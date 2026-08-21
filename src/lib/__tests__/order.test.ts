import { describe, expect, it } from 'vitest';
import { orderTasks, positionUpdates, swap } from '../order';

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

describe('swap', () => {
  it('troca dois vizinhos', () => {
    expect(swap(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c']);
  });

  it('devolve a lista intacta quando o índice sai da faixa', () => {
    const list = ['a', 'b'];
    expect(swap(list, 0, -1)).toBe(list);
    expect(swap(list, 1, 2)).toBe(list);
    expect(swap(list, 0, 0)).toBe(list);
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
