import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { reportError } from '../lib/logger';

interface AuthContextData {
  user: User | null;
  session: Session | null;
  /** `true` só até a primeira resposta do Supabase. */
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData | null>(null);

/**
 * O cliente do Supabase pesa cerca de 200 kB e é carregado sob demanda: a
 * página pública não precisa dele para renderizar uma linha sequer de texto.
 * O import dinâmico abaixo tira esse peso do pacote inicial sem espalhar
 * `await import()` por toda a aplicação.
 */
const client = () => import('../lib/supabase').then((m) => m.supabase);

/**
 * Uma única assinatura de sessão para o app inteiro.
 *
 * Antes, cada tela chamava `supabase.auth.getUser()` por conta própria e o
 * `ProtectedRoute` abria a sua própria escuta — três consultas para a mesma
 * informação, e nenhuma delas sabia da outra. Aqui a sessão é resolvida uma vez
 * e propagada; sair da conta atualiza tudo ao mesmo tempo.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    (async () => {
      try {
        const supabase = await client();
        if (!active) return;

        const { data } = await supabase.auth.getSession();
        if (active) setSession(data.session);

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, next) => {
          if (!active) return;
          setSession(next);
          setLoading(false);
        });
        unsubscribe = () => subscription.unsubscribe();
      } catch (error) {
        reportError('auth.bootstrap', error);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const value = useMemo<AuthContextData>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      signOut: async () => {
        try {
          const supabase = await client();
          const { error } = await supabase.auth.signOut();
          if (error) reportError('auth.signOut', error);
        } catch (error) {
          reportError('auth.signOut', error);
        }
      },
    }),
    [session, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth precisa estar dentro de AuthProvider');
  return context;
}
