import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './env';

/**
 * A chave `anon` é pública por desenho — ela identifica o projeto, não o
 * usuário, e todo o controle de acesso mora nas políticas de Row Level
 * Security do Postgres. O que nunca pode aparecer aqui é a `service_role`.
 *
 * Antes, a ausência das variáveis lançava um erro no topo deste módulo: como
 * as páginas são carregadas sob demanda, o erro estourava dentro do Suspense e
 * o usuário via uma tela branca. Agora o cliente é criado com um destino
 * inerte e `App` mostra uma tela de configuração legível.
 */
export const supabase = createClient(
  SUPABASE_URL || 'http://localhost:54321',
  SUPABASE_ANON_KEY || 'nao-configurado',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // PKCE mantém o token fora da URL — no fluxo implícito ele viajava no
      // fragmento do endereço e ficava no histórico do navegador.
      flowType: 'pkce',
    },
  }
);
