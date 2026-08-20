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
  title: string;
  is_completed: boolean;
  created_at: string;
}