import { describe, expect, it } from 'vitest';
import { descendantsOf } from '../tree';

const node = (id: string, parent_id: string | null) => ({ id, parent_id });

/**
 *  a
 *  ├── b
 *  │   └── d
 *  └── c
 *  e (solta)
 */
const tree = [node('a', null), node('b', 'a'), node('c', 'a'), node('d', 'b'), node('e', null)];

describe('descendantsOf', () => {
  it('desce todos os níveis, não só os filhos diretos', () => {
    expect(descendantsOf(tree, 'a').map((t) => t.id)).toEqual(['b', 'c', 'd']);
  });

  it('devolve lista vazia para folha', () => {
    expect(descendantsOf(tree, 'd')).toEqual([]);
    expect(descendantsOf(tree, 'e')).toEqual([]);
  });

  it('não inclui a própria raiz', () => {
    expect(descendantsOf(tree, 'b').map((t) => t.id)).toEqual(['d']);
  });

  it('ignora id que não existe', () => {
    expect(descendantsOf(tree, 'inexistente')).toEqual([]);
  });

  it('não trava quando o vínculo forma um ciclo', () => {
    // 'x' é pai de 'y' e 'y' é pai de 'x' — dado corrompido, mas possível.
    const ciclo = [node('x', 'y'), node('y', 'x')];
    expect(descendantsOf(ciclo, 'x').map((t) => t.id)).toEqual(['y']);
  });
});
