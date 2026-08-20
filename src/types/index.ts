export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  parent_id: string | null;
  title: string;
  is_completed: boolean;
  recurrence?: string | null; // 'none' | '15m' | '30m' | '1h' | '6h' | '12h' | 'daily' | 'weekly'
  last_completed_at?: string | null;
  created_at: string;
}