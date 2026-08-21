import { describe, expect, it } from 'vitest';
import { dropIndex, move, orderProjects, orderTasks, positionUpdates } from '../order';

const task = (id: string, position: number | null, created_at = '2026-08-20T10:00:00Z') => ({
  id,
  position,
  created_at,
});

describe('orderTasks', () => {
  it('ordena pela posição, não pela data', () => {
    const list = [task('c', 2), task('a', 0), task('b', 1)];
    expect(orderTasks(list).map((t) => t.id)).toEqual(['a', 'b', 'c']);
  });

  it('joga as linhas sem posição para o fim', () => {
    const list = [task('sem', null), task('com', 3)];
    expect(orderTasks(list).map((t) => t.id)).toEqual(['com', 'sem']);
  });

  it('desempata pela data de criação', () => {
    const list = [task('novo', null, '2026-08-21T10:00:00Z'), task('velho', null, '2026-08-19T10:00:00Z')];
    expect(orderTasks(list).map((t) => t.id)).toEqual(['velho', 'novo']);
  });

  it('não altera o array recebido', () => {
    const list = [task('b', 1), task('a', 0)];
    orderTasks(list);
    expect(list.map((t) => t.id)).toEqual(['b', 'a']);
  });
});

describe('orderProjects', () => {
  it('ordena pela posição, como as tarefas', () => {
    const list = [task('c', 2), task('a', 0), task('b', 1)];
    expect(orderProjects(list).map((t) => t.id)).toEqual(['a', 'b', 'c']);
  });

  it('joga as linhas sem posição para o TOPO, ao contrário das tarefas', () => {
    const list = [task('com', 3), task('novo', null)];
    expect(orderProjects(list).map((t) => t.id)).toEqual(['novo', 'com']);
    expect(orderTasks(list).map((t) => t.id)).toEqual(['com', 'novo']);
  });

  it('entre os sem posição, o mais novo primeiro', () => {
    const list = [task('velho', null, '2026-08-19T10:00:00Z'), task('novo', null, '2026-08-21T10:00:00Z')];
    expect(orderProjects(list).map((t) => t.id)).toEqual(['novo', 'velho']);
  });
});

describe('move', () => {
  it('entre vizinhos, dá no mesmo que trocar de lugar', () => {
    expect(move(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c']);
  });

  it('num salto longo, preserva a ordem de quem ficou no meio', () => {
    expect(move(['a', 'b', 'c', 'd'], 0, 3)).toEqual(['b', 'c', 'd', 'a']);
    expect(move(['a', 'b', 'c', 'd'], 3, 0)).toEqual(['d', 'a', 'b', 'c']);
  });

  it('devolve a lista intacta quando o índice sai da faixa', () => {
    const list = ['a', 'b'];
    expect(move(list, 0, -1)).toBe(list);
    expect(move(list, 1, 2)).toBe(list);
    expect(move(list, 0, 0)).toBe(list);
  });
});

describe('dropIndex', () => {
  it('soltar acima de um alvo mais abaixo desconta a casa de origem', () => {
    // ['a','b','c'], arrastando 'a' (0) para depois de 'b' (1) => índice 1.
    expect(dropIndex(0, 1, 'after')).toBe(1);
    expect(dropIndex(0, 2, 'before')).toBe(1);
  });

  it('soltar subindo não desconta nada', () => {
    // Arrastando 'c' (2) para antes de 'a' (0) => índice 0.
    expect(dropIndex(2, 0, 'before')).toBe(0);
    expect(dropIndex(2, 0, 'after')).toBe(1);
  });

  it('soltar no próprio lugar não move', () => {
    expect(dropIndex(1, 1, 'before')).toBe(1);
    expect(dropIndex(1, 1, 'after')).toBe(1);
  });
});

describe('positionUpdates', () => {
  it('manda só as linhas que saíram do lugar', () => {
    const ordered = [task('a', 1), task('b', 0), task('c', 2)];
    expect(positionUpdates(ordered)).toEqual([
      { id: 'a', position: 0 },
      { id: 'b', position: 1 },
    ]);
  });

  it('numera a lista inteira quando ninguém tem posição', () => {
    const ordered = [task('a', null), task('b', null)];
    expect(positionUpdates(ordered)).toHaveLength(2);
  });

  it('não manda nada quando a ordem já bate', () => {
    expect(positionUpdates([task('a', 0), task('b', 1)])).toEqual([]);
  });
});
