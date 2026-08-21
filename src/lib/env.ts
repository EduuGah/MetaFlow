/**
 * Leitura das variáveis de ambiente, isolada do cliente do Supabase.
 *
 * Esta separação é o que mantém a página pública leve: `App` precisa saber se
 * o projeto está configurado, mas não precisa — e não deve — arrastar as ~200 kB
 * do cliente do Supabase para o pacote inicial só por causa dessa checagem.
 */
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
