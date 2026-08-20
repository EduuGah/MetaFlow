export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  created_at: string;
}