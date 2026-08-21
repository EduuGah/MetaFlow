import { describe, expect, it } from 'vitest';
import { formatDeadlineLong, getDeadlineInfo } from '../deadline';

/** Meio-dia evita que o próprio horário do teste empurre a data para o dia seguinte. */
const now = new Date(2026, 7, 20, 12, 0, 0);

describe('getDeadlineInfo', () => {
  it('trata ausência de prazo sem quebrar', () => {
    expect(getDeadlineInfo(null, now)).toMatchObject({ status: 'none', days: null });
    expect(getDeadlineInfo(undefined, now).status).toBe('none');
    expect(getDeadlineInfo('', now).status).toBe('none');
  });

  it('ignora datas malformadas em vez de gerar NaN', () => {
    expect(getDeadlineInfo('data-invalida', now).status).toBe('none');
    expect(getDeadlineInfo('2026-13', now).status).toBe('none');
  });

  it('reconhece o vencimento de hoje', () => {
    const info = getDeadlineInfo('2026-08-20', now);
    expect(info.status).toBe('today');
    expect(info.days).toBe(0);
    expect(info.tone).toBe('signal');
  });

  it('conta o atraso em dias', () => {
    expect(getDeadlineInfo('2026-08-19', now)).toMatchObject({ status: 'overdue', days: -1, tone: 'alert' });
    expect(getDeadlineInfo('2026-08-15', now).label).toBe('Atrasado 5 dias');
  });

  it('separa a próxima semana do futuro distante', () => {
    expect(getDeadlineInfo('2026-08-21', now)).toMatchObject({ status: 'soon', days: 1 });
    expect(getDeadlineInfo('2026-08-27', now).status).toBe('soon');
    expect(getDeadlineInfo('2026-08-28', now).status).toBe('later');
  });

  /**
   * Regressão: interpretar 'YYYY-MM-DD' como UTC faz a data recuar um dia em
   * qualquer fuso a oeste de Greenwich — inclusive o do Brasil.
   */
  it('interpreta a data no fuso local, não em UTC', () => {
    const madrugada = new Date(2026, 7, 20, 0, 30, 0);
    expect(getDeadlineInfo('2026-08-20', madrugada).status).toBe('today');
  });

  it('aceita timestamp completo vindo do banco', () => {
    expect(getDeadlineInfo('2026-08-20T00:00:00+00:00', now).status).toBe('today');
  });
});

describe('formatDeadlineLong', () => {
  it('devolve null quando não há data', () => {
    expect(formatDeadlineLong(null)).toBeNull();
  });

  it('formata em português', () => {
    expect(formatDeadlineLong('2026-08-20')).toContain('agosto');
  });
});
