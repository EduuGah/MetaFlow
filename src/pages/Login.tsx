import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Login() {
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      console.error('Erro ao realizar login:', error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-sm bg-white p-6 rounded-lg border border-slate-200 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-slate-800 mb-1">Acessar a conta</h2>
        <p className="text-xs text-slate-500 mb-6">Conecte-se para sincronizar suas metas.</p>
        
        <button 
          onClick={handleGoogleLogin}
          className="w-full py-2.5 px-4 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          Continuar com Google
        </button>
        
        <div className="mt-4 text-xs">
          <Link to="/" className="text-slate-500 hover:underline">Voltar para o início</Link>
        </div>
      </div>
    </div>
  );
}