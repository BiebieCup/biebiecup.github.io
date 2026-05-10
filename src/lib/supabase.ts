import { createClient } from '@supabase/supabase-js';

// These are the public environment variables - replace with your actual Supabase project credentials
// For GitHub Pages deployment, set these in your repository secrets and use a build step
// or configure them directly here for static deployment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Admin emails (hardcoded as per requirements)
export const ADMIN_EMAILS = ['1412422438@qq.com', 'fzso5071@qq.com'];

export const isAdminEmail = (email: string) => ADMIN_EMAILS.includes(email.toLowerCase());

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          email: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      events: {
        Row: {
          id: string;
          title: string;
          description: string;
          start_time: string;
          end_time: string;
          live_time: string;
          vote_start: string;
          vote_end: string;
          is_anonymous: boolean;
          is_active: boolean;
          created_at: string;
          created_by: string;
        };
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          content: string;
          event_id: string | null;
          created_at: string;
          created_by: string;
          is_pinned: boolean;
        };
      };
      submissions: {
        Row: {
          id: string;
          event_id: string;
          submitter_id: string;
          track_type: 'regular' | 'entertainment';
          level_label: string;
          song_name: string;
          composer: string;
          charter: string;
          mode: 'solo' | 'collab';
          collaborators: string[];
          file_url: string;
          file_name: string;
          status: 'pending' | 'approved' | 'rejected';
          review_note: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
      };
      downloads: {
        Row: {
          id: string;
          event_id: string;
          title: string;
          description: string;
          file_url: string;
          file_name: string;
          released_at: string;
          created_by: string;
        };
      };
    };
  };
};
