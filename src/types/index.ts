export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category?: string;
  deadline: string | null;
  /** Ordem manual no painel. `null` em linha anterior ao backfill. */
  position?: number | null;
  created_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  parent_id: string | null;
  title: string;
  is_completed: boolean;
  status?: 'todo' | 'in_progress' | 'done';
  priority?: 'low' | 'medium' | 'high';
  recurrence?: string | null;
  last_completed_at?: string | null;
  /** Anotação livre da tarefa. Opcional no tipo porque linhas antigas vêm sem ela. */
  notes?: string | null;
  /** Prazo da tarefa, em dia de calendário ('YYYY-MM-DD'). Independe do prazo do projeto. */
  deadline?: string | null;
  /** Ordem manual dentro do projeto. `null` em linha anterior ao backfill. */
  position?: number | null;
  created_at: string;
}