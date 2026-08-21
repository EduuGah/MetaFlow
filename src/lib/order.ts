interface Ordered {
  position?: number | null;
  created_at: string;
}

/**
 * Ordem de exibição das tarefas.
 *
 * `position` manda; a data de criação só desempata. Linha sem posição vai para
 * o fim — é o caso de uma tarefa criada por uma aba antiga, ou pelo banco
 * antes do backfill: ela aparece embaixo em vez de sumir ou embaralhar as
 * outras. Ordenar aqui, e não no `order()` do Postgres, evita depender de
 * `nulls last` e mantém a mesma regra depois de cada alteração otimista.
 */
export function orderTasks<T extends Ordered>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const pa = a.position ?? Number.MAX_SAFE_INTEGER;
    const pb = b.position ?? Number.MAX_SAFE_INTEGER;
    if (pa !== pb) return pa - pb;
    return a.created_at.localeCompare(b.created_at);
  });
}

/**
 * Troca de lugar o item de `from` com o vizinho em `to`.
 * Índice fora da lista devolve o array original, sem cópia inútil.
 */
export function swap<T>(list: T[], from: number, to: number): T[] {
  if (from < 0 || to < 0 || from >= list.length || to >= list.length || from === to) return list;
  const next = [...list];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
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
