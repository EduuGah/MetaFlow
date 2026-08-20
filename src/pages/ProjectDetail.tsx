import { useParams, Link } from 'react-router-dom';

export default function ProjectDetail() {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-800">
      <div className="max-w-3xl mx-auto">
        <Link to="/dashboard" className="text-xs text-slate-500 hover:underline mb-4 inline-block">
          ← Voltar ao Dashboard
        </Link>
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <h1 className="text-xl font-bold">Projeto #{id}</h1>
          <p className="text-sm text-slate-600 mt-1">Detalhes e tarefas da meta selecionada.</p>
        </div>
      </div>
    </div>
  );
}