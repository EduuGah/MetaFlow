import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-800">
      <header className="max-w-4xl mx-auto flex justify-between items-center mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold">Painel de Metas</h1>
          {user && (
            <p className="text-xs text-slate-500">
              Conectado como: <span className="font-medium text-slate-700">{user.user_metadata?.full_name || user.email}</span>
            </p>
          )}
        </div>
        <button 
          onClick={handleLogout}
          className="text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          Sair
        </button>
      </header>

      <main className="max-w-4xl mx-auto space-y-4">
        <div className="p-4 bg-white rounded-lg border border-slate-200 flex justify-between items-center shadow-sm">
          <div>
            <h2 className="text-base font-semibold">Lançar PWA no Ar</h2>
            <p className="text-xs text-slate-500">Prazo: 30/09/2026</p>
          </div>
          <Link to="/dashboard/1" className="text-xs text-slate-900 font-medium hover:underline">
            Ver detalhes →
          </Link>
        </div>
      </main>
    </div>
  );
}