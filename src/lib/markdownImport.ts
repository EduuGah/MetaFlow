import { MAX_DEPTH } from './tree';

export interface ParsedTask {
  title: string;
  done: boolean;
  /** Linhas que não couberam como tarefa e viraram anotação. */
  notes: string[];
  children: ParsedTask[];
}

export interface ImportPlan {
  /** Título do projeto, quando o documento traz um. */
  title: string | null;
  tasks: ParsedTask[];
  total: number;
  done: number;
  /** Avisos honestos sobre o que o importador teve de decidir sozinho. */
  warnings: string[];
}

/**
 * Teto de linhas por importação.
 *
 * É válvula de segurança contra um arquivo colado por engano, não linha de
 * desempenho: um documento de planejamento de verdade não chega perto disso, e
 * se chegar, demorar é aceitável. A inserção vai ao banco em lotes justamente
 * para que "demorado" não vire "falhou" — ver `ImportProjectModal`.
 */
export const MAX_IMPORT_TASKS = 5000;

/** Limite da coluna `title` no banco. */
const TITLE_LIMIT = 160;

const HEADING = /^(#{1,6})\s+(.*)$/;
const LIST_ITEM = /^(\s*)(?:[-*+]|\d+[.)])\s+(.*)$/;
const CHECKBOX = /^\[([ xX])\]\s*(.*)$/;
const FENCE = /^\s*(```|~~~)/;

/**
 * Tira a marcação de dentro de um título.
 *
 * O texto vai para uma linha de lista, não para um render de markdown: manter
 * `**` e crases faria a tela mostrar os asteriscos. Link vira só o rótulo —
 * a URL não cabe numa linha de tarefa e ninguém clica nela ali.
 */
function cleanTitle(raw: string): string {
  return raw
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_~`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, TITLE_LIMIT);
}

function makeTask(title: string, done: boolean): ParsedTask {
  return { title, done, notes: [], children: [] };
}

/**
 * Lê um documento em markdown e devolve o projeto que ele descreve.
 *
 * O formato alvo é o que sai de um assistente de conversa: títulos com `#`,
 * itens com `-` ou `*`, caixas `[ ]` e `[x]`. Prosa, tabelas, blocos de código
 * e citações são ignorados de propósito — num documento de planejamento eles
 * são explicação, não tarefa, e transformá-los em linha encheria a lista de
 * lixo que a pessoa teria de apagar uma por uma.
 *
 * Mapa de profundidade: o título de menor nível vira o nome do projeto quando
 * é único, e os demais descem um degrau por nível. Item de lista entra um
 * degrau abaixo do título que o contém, e mais um por recuo.
 */
export function parseMarkdownProject(markdown: string): ImportPlan {
  const lines = markdown.split(/\r?\n/);
  const warnings: string[] = [];

  const headingLevels: number[] = [];
  let inFence = false;
  for (const line of lines) {
    if (FENCE.test(line)) inFence = !inFence;
    else if (!inFence) {
      const match = HEADING.exec(line);
      if (match && cleanTitle(match[2])) headingLevels.push(match[1].length);
    }
  }

  /*
   * O primeiro título é o nome do projeto quando manda no que vem depois:
   * ou é o único do seu nível, ou é mais raso que o título seguinte.
   *
   * A segunda condição existe por causa de documento gerado por assistente de
   * conversa, que costuma sair desalinhado — `# Título`, `## 1. Seção`,
   * `# 2. Seção`, com as seções ora em `#` ora em `##`. Exigir que o topo
   * fosse único fazia o nome do projeto virar tarefa e empurrava o documento
   * inteiro um degrau para baixo, estourando o limite de níveis.
   */
  const minLevel = headingLevels.length > 0 ? Math.min(...headingLevels) : 1;
  const topCount = headingLevels.filter((l) => l === minLevel).length;
  const titleIsHeading =
    headingLevels.length > 0 &&
    headingLevels[0] === minLevel &&
    (topCount === 1 || headingLevels[0] < headingLevels[1]);

  /*
   * A profundidade de um título vem de uma pilha, não de uma conta sobre o
   * número de `#`.
   *
   * Contar `#` supõe que o documento use os níveis de forma consistente, e o
   * documento de origem não usa: `##` é seção num lugar e subseção em outro.
   * Com a conta fixa, `### 1.2` entrava dentro de `### 1.1` em vez de ao lado.
   * A pilha decide por aninhamento real — um título entra sob o último título
   * mais raso que ele —, que é como qualquer sumário se monta.
   */
  const headingStack: number[] = [];

  const roots: ParsedTask[] = [];
  const path: ParsedTask[] = [];
  let title: string | null = null;
  let headingDepth = -1;
  let indents: number[] = [];
  let total = 0;
  let done = 0;
  let flattened = 0;
  let truncated = false;

  /** Encaixa uma linha na árvore e devolve a profundidade onde ela ficou. */
  const place = (depth: number, text: string, isDone: boolean): number => {
    // Fundo demais para a árvore: vira anotação na tarefa mais funda que
    // existe, em vez de sumir. Anotar no pai preserva o agrupamento — as
    // opções de "Definir o gênero" continuam grudadas nessa pergunta, e não
    // espalhadas como se fossem tarefas irmãs dela.
    if (depth > MAX_DEPTH) {
      const host = path[MAX_DEPTH] ?? path[path.length - 1];
      if (host) {
        host.notes.push(text);
        flattened += 1;
        return MAX_DEPTH;
      }
    }

    if (total >= MAX_IMPORT_TASKS) {
      truncated = true;
      return Math.min(depth, MAX_DEPTH);
    }

    // Nunca pular degrau. Documento que salta de `#` para `###` não deve abrir
    // um buraco na árvore: o título encosta no nível seguinte ao atual. É o
    // que conserta sozinho a numeração desalinhada do documento de origem.
    const level = Math.max(0, Math.min(depth, MAX_DEPTH, path.length));
    const task = makeTask(text, isDone);

    if (level === 0) roots.push(task);
    else path[level - 1].children.push(task);

    path.length = level;
    path.push(task);

    total += 1;
    if (isDone) done += 1;
    return level;
  };

  inFence = false;

  for (const line of lines) {
    if (FENCE.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence || !line.trim()) continue;

    const heading = HEADING.exec(line);
    if (heading) {
      const text = cleanTitle(heading[2]);
      if (!text) continue;

      if (titleIsHeading && title === null && heading[1].length === minLevel) {
        title = text;
        continue;
      }

      const level = heading[1].length;
      while (headingStack.length > 0 && headingStack[headingStack.length - 1] >= level) headingStack.pop();
      const depth = headingStack.length;
      headingStack.push(level);

      // A profundidade que vale para os itens abaixo é onde o título REALMENTE
      // caiu, não a que a pilha pediu: os dois só divergem quando a árvore já
      // está no limite de níveis, e aí é a real que evita um buraco.
      indents = [];
      headingDepth = place(depth, text, false);
      continue;
    }

    const item = LIST_ITEM.exec(line);
    if (!item) continue;

    const indent = item[1].replace(/\t/g, '    ').length;
    const box = CHECKBOX.exec(item[2]);
    const text = cleanTitle(box ? box[2] : item[2]);
    if (!text) continue;

    // O recuo vira nível por comparação, não por divisão: documentos misturam
    // 2 e 4 espaços, e dividir por um número fixo erra em um deles.
    while (indents.length > 0 && indent < indents[indents.length - 1]) indents.pop();
    if (indents.length === 0 || indent > indents[indents.length - 1]) indents.push(indent);

    place(headingDepth + indents.length, text, box ? box[1].toLowerCase() === 'x' : false);
  }

  if (flattened > 0) {
    warnings.push(
      flattened === 1
        ? '1 item passou do terceiro nível e virou anotação na etapa acima.'
        : `${flattened} itens passaram do terceiro nível e viraram anotação na etapa acima.`
    );
  }
  if (truncated) {
    warnings.push(`O documento passa de ${MAX_IMPORT_TASKS} linhas; o excedente ficou de fora.`);
  }
  if (total === 0) {
    warnings.push('Nenhuma tarefa encontrada. O importador lê títulos com # e itens de lista.');
  }

  return { title, tasks: roots, total, done, warnings };
}
