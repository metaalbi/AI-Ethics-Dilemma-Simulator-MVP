export interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface NewsItem {
  id: number;
  title: string;
  body: string;
  author_name: string;
  created_at: string;
  updated_at?: string;
}

export interface AuthState {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
}