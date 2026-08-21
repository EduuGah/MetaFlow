import { describe, expect, it } from 'vitest';
import { findTasksDueForReset } from '../recurrence';

const base = { id: 'x', is_completed: true, recurrence: 'daily', last_completed_at: null as string | null };
const now = new Date('2026-08-20T12:00:00.000Z');

describe('findTasksDueForReset', () => {
  it('ignora tarefas em aberto', () => {
    const tasks = [{ ...base, id: 'a', is_completed: false, last_completed_at: '2026-08-01T00:00:00.000Z' }];
    expect(findTasksDueForReset(tasks, now)).toEqual([]);
  });

  it('ignora tarefas sem repetição', () => {
    const tasks = [
      { ...base, id: 'a', recurrence: 'none', last_completed_at: '2026-08-01T00:00:00.000Z' },
      { ...base, id: 'b', recurrence: null, last_completed_at: '2026-08-01T00:00:00.000Z' },
    ];
    expect(findTasksDueForReset(tasks, now)).toEqual([]);
  });

  it('ignora tarefas concluídas sem registro de horário', () => {
    expect(findTasksDueForReset([{ ...base, id: 'a' }], now)).toEqual([]);
  });

  it('reabre apenas quando o intervalo já venceu', () => {
    const tasks = [
      { ...base, id: 'vencida', recurrence: '1h', last_completed_at: '2026-08-20T10:30:00.000Z' },
      { ...base, id: 'dentro', recurrence: '1h', last_completed_at: '2026-08-20T11:30:00.000Z' },
    ];
    expect(findTasksDueForReset(tasks, now)).toEqual(['vencida']);
  });

  it('trata o limite exato do intervalo como vencido', () => {
    const tasks = [{ ...base, id: 'limite', recurrence: '15m', last_completed_at: '2026-08-20T11:45:00.000Z' }];
    expect(findTasksDueForReset(tasks, now)).toEqual(['limite']);
  });

  it('cobre todos os intervalos oferecidos na interface', () => {
    const tasks = [
      { ...base, id: '30m', recurrence: '30m', last_completed_at: '2026-08-20T11:00:00.000Z' },
      { ...base, id: '6h', recurrence: '6h', last_completed_at: '2026-08-20T05:00:00.000Z' },
      { ...base, id: '12h', recurrence: '12h', last_completed_at: '2026-08-19T23:00:00.000Z' },
      { ...base, id: 'daily', recurrence: 'daily', last_completed_at: '2026-08-19T10:00:00.000Z' },
      { ...base, id: 'weekly', recurrence: 'weekly', last_completed_at: '2026-08-10T10:00:00.000Z' },
    ];
    expect(findTasksDueForReset(tasks, now)).toEqual(['30m', '6h', '12h', 'daily', 'weekly']);
  });

  it('ignora intervalo desconhecido em vez de reabrir por engano', () => {
    const tasks = [{ ...base, id: 'a', recurrence: 'a-cada-lua-cheia', last_completed_at: '2020-01-01T00:00:00.000Z' }];
    expect(findTasksDueForReset(tasks, now)).toEqual([]);
  });

  it('ignora data de conclusão inválida', () => {
    const tasks = [{ ...base, id: 'a', last_completed_at: 'ontem' }];
    expect(findTasksDueForReset(tasks, now)).toEqual([]);
  });
});
