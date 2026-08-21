import { describe, expect, it } from 'vitest';
import { buildDeadlineAlert } from '../deadlineAlerts';

/** Meio-dia evita que o próprio horário do teste empurre a data para o dia seguinte. */
const now = new Date(2026, 7, 20, 12, 0, 0);

const project = (title: string, deadline: string | null) => ({ title, deadline });

describe('buildDeadlineAlert', () => {
  it('cala a boca quando não há prazo estourando', () => {
    expect(buildDeadlineAlert([], now)).toBeNull();
    expect(buildDeadlineAlert([project('Mudança', null)], now)).toBeNull();
    // Daqui a cinco dias não é motivo para interromper ninguém.
    expect(buildDeadlineAlert([project('Mudança', '2026-08-25')], now)).toBeNull();
  });

  it('anuncia um único atraso no singular', () => {
    const alert = buildDeadlineAlert([project('Reforma', '2026-08-15')], now);
    expect(alert?.title).toBe('1 projeto atrasado');
    expect(alert?.body).toBe('Reforma');
  });

  it('anuncia um único vencimento de hoje', () => {
    const alert = buildDeadlineAlert([project('TCC', '2026-08-20')], now);
    expect(alert?.title).toBe('1 vence hoje');
  });

  it('junta atraso e vencimento numa linha só, atrasados primeiro', () => {
    const alert = buildDeadlineAlert(
      [project('TCC', '2026-08-20'), project('Reforma', '2026-08-15'), project('Mudança', '2026-08-10')],
      now
    );
    expect(alert?.title).toBe('2 projetos atrasados · 1 vence hoje');
    expect(alert?.body).toBe('Reforma · Mudança · TCC');
  });

  it('corta a lista em três nomes e conta o resto', () => {
    const alert = buildDeadlineAlert(
      ['A', 'B', 'C', 'D', 'E'].map((t) => project(t, '2026-08-15')),
      now
    );
    expect(alert?.body).toBe('A · B · C e mais 2');
  });

  it('usa uma tag por dia, para o aviso substituir o anterior', () => {
    const alert = buildDeadlineAlert([project('Reforma', '2026-08-15')], now);
    expect(alert?.tag).toBe('metaflow-prazos-2026-8-20');
  });
});
