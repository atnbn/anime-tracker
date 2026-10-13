/** Public schema used by the browser client. Regenerate this definition after schema changes. */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
type LibraryRow = {
  user_id: string;
  anime_id: number;
  favorite: boolean;
  status: string;
  current_episode: number;
  episode_notes: Json;
};
export type Database = {
  public: {
    Tables: {
      user_anime: {
        Row: LibraryRow;
        Insert: { user_id: string; anime_id: number; favorite?: boolean; status?: string; current_episode?: number; episode_notes?: Json };
        Update: Partial<LibraryRow>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
