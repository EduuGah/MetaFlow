import { describe, expect, it } from 'vitest';
import { redact, userMessage } from '../logger';

describe('redact', () => {
  it('remove campos sensíveis em qualquer profundidade', () => {
    const input = {
      user: { email: 'a@b.com', access_token: 'abc', name: 'Ana' },
      apiKey: '123',
      nested: [{ password: 'x', ok: 1 }],
    };
    expect(redact(input)).toEqual({
      user: { email: '[redigido]', access_token: '[redigido]', name: 'Ana' },
      apiKey: '[redigido]',
      nested: [{ password: '[redigido]', ok: 1 }],
    });
  });

  it('preserva valores primitivos', () => {
    expect(redact('texto')).toBe('texto');
    expect(redact(42)).toBe(42);
    expect(redact(null)).toBeNull();
  });
});

describe('userMessage', () => {
  it('traduz erro de permissão do Postgres', () => {
    expect(userMessage('genérico', { code: '42501' })).toBe('Você não tem permissão para esta ação.');
  });

  it('não repassa o texto cru do banco', () => {
    const message = userMessage('Não foi possível salvar.', {
      code: '23505',
      message: 'duplicate key value violates unique constraint "projects_pkey"',
    });
    expect(message).not.toContain('projects_pkey');
  });

  it('cai no texto padrão quando o erro é desconhecido', () => {
    expect(userMessage('Falhou.', new Error('boom'))).toBe('Falhou.');
  });
});
