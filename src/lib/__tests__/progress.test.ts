import { describe, expect, it } from 'vitest';
import { computeProgress } from '../progress';

describe('computeProgress', () => {
  it('não divide por zero', () => {
    expect(computeProgress([])).toEqual({ total: 0, done: 0, percent: 0 });
    expect(computeProgress(null)).toEqual({ total: 0, done: 0, percent: 0 });
    expect(computeProgress(undefined).percent).toBe(0);
  });

  it('arredonda para inteiro', () => {
    const tasks = [{ is_completed: true }, { is_completed: false }, { is_completed: false }];
    expect(computeProgress(tasks)).toEqual({ total: 3, done: 1, percent: 33 });
  });

  it('chega a 100 só quando tudo está concluído', () => {
    expect(computeProgress([{ is_completed: true }, { is_completed: true }]).percent).toBe(100);
    expect(computeProgress([{ is_completed: true }, { is_completed: false }]).percent).toBe(50);
  });
});
