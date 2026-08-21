import { defineConfig } from 'vitest/config';

/**
 * Configuração separada da do app de propósito: os testes cobrem lógica pura
 * (prazos, recorrência, progresso, redação de logs) e não precisam do plugin
 * de PWA nem do de React para rodar.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    reporters: 'default',
  },
});
