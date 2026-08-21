interface CompletableLike {
  is_completed: boolean;
}

export interface Progress {
  total: number;
  done: number;
  percent: number;
}

/** Progresso de um conjunto de tarefas. 0 tarefas = 0%, nunca NaN. */
export function computeProgress(tasks: readonly CompletableLike[] | null | undefined): Progress {
  const total = tasks?.length ?? 0;
  const done = tasks?.filter((t) => t.is_completed).length ?? 0;
  return { total, done, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}
