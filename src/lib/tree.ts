interface TreeNode {
  id: string;
  parent_id: string | null;
}

/**
 * Profundidade máxima de aninhamento: tarefa → etapa → subetapa.
 *
 * O limite não é técnico — `parent_id` aceitaria qualquer profundidade. É de
 * leitura: cada nível come recuo, e no celular o quarto nível deixaria o
 * título com menos de metade da linha. Três níveis dão conta de "reformar a
 * casa → pintar a sala → comprar tinta" e é onde a maioria das listas para.
 */
export const MAX_DEPTH = 2;

/**
 * Todos os descendentes de uma tarefa, dos mais próximos aos mais fundos.
 *
 * Percurso em largura, com um conjunto de visitados: se um `parent_id` apontar
 * para um ancestral por acidente, a função para em vez de rodar para sempre.
 * A tela inteira depende disto para contar progresso e para apagar em cascata.
 */
export function descendantsOf<T extends TreeNode>(tasks: readonly T[], rootId: string): T[] {
  const byParent = new Map<string, T[]>();
  for (const task of tasks) {
    if (!task.parent_id) continue;
    const siblings = byParent.get(task.parent_id);
    if (siblings) siblings.push(task);
    else byParent.set(task.parent_id, [task]);
  }

  const found: T[] = [];
  const seen = new Set<string>([rootId]);
  const queue: string[] = [rootId];

  while (queue.length > 0) {
    const current = queue.shift() as string;
    for (const child of byParent.get(current) ?? []) {
      if (seen.has(child.id)) continue;
      seen.add(child.id);
      found.push(child);
      queue.push(child.id);
    }
  }

  return found;
}
