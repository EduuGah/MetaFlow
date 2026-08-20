import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-slate-800">
      <h1 className="text-3xl font-bold mb-2">MetaFlow</h1>
      <p className="text-slate-600 mb-6 text-sm">Gerenciamento simples e direto de metas e tarefas.</p>
      <div className="flex gap-3">
        <Link to="/login" className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 transition-colors">
          Entrar
        </Link>
        <Link to="/dashboard" className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-100 transition-colors">
          Ver Dashboard
        </Link>
      </div>
    </div>
  );
}