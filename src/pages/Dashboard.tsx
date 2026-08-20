import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-800">
      <header className="max-w-4xl mx-auto flex justify-between items-center mb-8 pb-4 border-b border-slate-200">
        <h1 className="text-xl font-bold">Painel de Metas</h1>
        <Link to="/login" className="text-xs text-slate-500 hover:underline">Sair</Link>
      </header>

      <main className="max-w-4xl mx-auto space-y-4">
        <div className="p-4 bg-white rounded-lg border border-slate-200 flex justify-between items-center">
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