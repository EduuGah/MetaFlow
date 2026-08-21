interface Ordered {
  position?: number | null;
  created_at: string;
}

/**
 * `position` manda; o desempate é assunto de cada lista.
 *
 * Ordenar aqui, e não no `order()` do Postgres, evita depender de `nulls
 * last`/`nulls first` e mantém a mesma regra valendo depois de cada alteração
 * otimista na tela — o servidor não é consultado de novo a cada troca.
 */
function byPosition<T extends Ordered>(list: T[], fallback: number, tiebreak: (a: T, b: T) => number): T[] {
  return [...list].sort((a, b) => {
    const pa = a.position ?? fallback;
    const pb = b.position ?? fallback;
    return pa !== pb ? pa - pb : tiebreak(a, b);
  });
}

/**
 * Ordem das tarefas dentro de um projeto.
 *
 * Sem posição gravada, a tarefa vai para o **fim**: é onde uma tarefa nova
 * nasce, e é onde uma linha criada por aba antiga deve cair sem embaralhar as
 * outras. Entre as sem posição, a mais velha primeiro.
 */
export function orderTasks<T extends Ordered>(list: T[]): T[] {
  return byPosition(list, Number.MAX_SAFE_INTEGER, (a, b) => a.created_at.localeCompare(b.created_at));
}

/**
 * Ordem dos projetos no painel.
 *
 * O padrão é o inverso do das tarefas, e de propósito: sem posição gravada, o
 * projeto vai para o **topo**, porque o painel sempre mostrou o mais recente
 * primeiro e é lá que a pessoa espera ver o projeto que acabou de criar. Entre
 * os sem posição, o mais novo primeiro — a mesma ordem de antes.
 */
export function orderProjects<T extends Ordered>(list: T[]): T[] {
  return byPosition(list, Number.MIN_SAFE_INTEGER, (a, b) => b.created_at.localeCompare(a.created_at));
}

/**
 * Tira o item de `from` e o encaixa em `to`.
 *
 * Entre vizinhos isso dá no mesmo que trocar os dois de lugar, que é o que as
 * setas fazem. Num salto maior — o caso do arrastar — tirar-e-encaixar é o que
 * preserva a ordem de todo mundo que ficou entre as duas pontas; trocar
 * embaralharia quem não foi tocado.
 * Índice fora da lista devolve o array original, sem cópia inútil.
 */
export function move<T>(list: T[], from: number, to: number): T[] {
  if (from < 0 || to < 0 || from >= list.length || to >= list.length || from === to) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/**
 * Para onde vai o item quando é solto antes ou depois de um alvo.
 *
 * O desconto quando `from < raw` é o detalhe que sempre escapa: ao arrastar
 * para baixo, o próprio item some da posição de origem antes de ser encaixado,
 * então todo índice depois dele anda uma casa para trás.
 */
export function dropIndex(from: number, targetIndex: number, side: 'before' | 'after'): number {
  const raw = side === 'after' ? targetIndex + 1 : targetIndex;
  return from < raw ? raw - 1 : raw;
}

/**
 * Quais linhas precisam ir ao banco depois de uma troca.
 *
 * Renumerar de 0 a N e mandar só o que mudou: numa lista já numerada isso são
 * duas linhas, não a lista inteira. Na primeira vez — se o backfill não rodou
 * e todas as posições estão nulas — vai tudo, uma vez só.
 */
export function positionUpdates<T extends Ordered & { id: string }>(ordered: T[]): { id: string; position: number }[] {
  return ordered
    .map((task, position) => ({ id: task.id, position, changed: task.position !== position }))
    .filter((row) => row.changed)
    .map(({ id, position }) => ({ id, position }));
}
