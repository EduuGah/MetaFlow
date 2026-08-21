/**
 * Ponto único de saída de erros do app.
 *
 * Nada de `console.log` espalhado: tudo passa por aqui, o que dá um lugar só
 * para (a) redigir dados sensíveis antes de escrever e (b) plugar um coletor
 * externo no futuro sem tocar em nenhum componente.
 *
 * Nenhuma ferramenta de observabilidade foi instalada: o app é 100% client-side
 * e não há back-end próprio para receber os eventos. Quando houver, basta
 * preencher `sink` abaixo.
 */

const SENSITIVE = /(token|key|secret|password|senha|authorization|apikey|access_token|refresh_token|email)/i;

/** Remove valores sensíveis de qualquer objeto antes de ele virar log. */
export function redact(value: unknown, depth = 0): unknown {
  if (depth > 4) return '[profundo]';
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => redact(v, depth + 1));

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = SENSITIVE.test(k) ? '[redigido]' : redact(v, depth + 1);
  }
  return out;
}

type Sink = (event: { scope: string; message: string; context?: unknown }) => void;

let sink: Sink | null = null;

/** Registra um coletor externo (Sentry, OTel, endpoint próprio). */
export function setErrorSink(fn: Sink | null) {
  sink = fn;
}

export function reportError(scope: string, error: unknown, context?: Record<string, unknown>) {
  const message =
    error instanceof Error ? error.message : typeof error === 'string' ? error : 'Erro desconhecido';

  const safeContext = context ? redact(context) : undefined;

  if (import.meta.env.DEV) {
    console.error(`[${scope}]`, message, safeContext ?? '');
  }

  try {
    sink?.({ scope, message, context: safeContext });
  } catch {
    /* um coletor quebrado nunca pode derrubar o app */
  }
}

/**
 * Mensagem para o usuário. Deliberadamente não repassa o texto cru do
 * back-end — mensagens de erro de banco podem revelar nomes de tabela,
 * políticas e colunas.
 */
export function userMessage(fallback: string, error?: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = String((error as { code?: unknown }).code ?? '');
    if (code === 'PGRST301' || code === '42501') return 'Você não tem permissão para esta ação.';
    if (code === 'PGRST116') return 'Registro não encontrado.';
    if (code.startsWith('23')) return 'Os dados enviados são inválidos.';
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return 'Você está sem conexão. Tente novamente quando voltar.';
  }
  return fallback;
}
