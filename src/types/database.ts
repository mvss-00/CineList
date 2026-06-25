export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      media: {
        Row: {
          id: string;
          tmdb_id: number;
          title: string;
          type: "movie" | "series";
          poster_url: string | null;
          release_year: number | null;
          genres: string[];
          overview: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tmdb_id: number;
          title: string;
          type: "movie" | "series";
          poster_url?: string | null;
          release_year?: number | null;
          genres?: string[];
          overview?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tmdb_id?: number;
          title?: string;
          type?: "movie" | "series";
          poster_url?: string | null;
          release_year?: number | null;
          genres?: string[];
          overview?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      entries: {
        Row: {
          id: string;
          user_id: string;
          media_id: string;
          status: "watching" | "completed" | "plan_to_watch" | "dropped";
          rating: number | null;
          review_text: string | null;
          watched_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          media_id: string;
          status: "watching" | "completed" | "plan_to_watch" | "dropped";
          rating?: number | null;
          review_text?: string | null;
          watched_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          media_id?: string;
          status?: "watching" | "completed" | "plan_to_watch" | "dropped";
          rating?: number | null;
          review_text?: string | null;
          watched_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          entry_id: string;
          user_id: string;
          text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          entry_id: string;
          user_id: string;
          text: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          entry_id?: string;
          user_id?: string;
          text?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      follows: {
        Row: {
          follower_id: string;
          following_id: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
        };
        Update: {
          follower_id?: string;
          following_id?: string;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          id: string;
          name: string;
        };
        Insert: {
          id?: string;
          name: string;
        };
        Update: {
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      entry_tags: {
        Row: {
          entry_id: string;
          tag_id: string;
        };
        Insert: {
          entry_id: string;
          tag_id: string;
        };
        Update: {
          entry_id?: string;
          tag_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Media = Database["public"]["Tables"]["media"]["Row"];
export type Entry = Database["public"]["Tables"]["entries"]["Row"];
export type Comment = Database["public"]["Tables"]["comments"]["Row"];
export type Follow = Database["public"]["Tables"]["follows"]["Row"];
export type Tag = Database["public"]["Tables"]["tags"]["Row"];

export type EntryStatus = "watching" | "completed" | "plan_to_watch" | "dropped";
export type MediaType = "movie" | "series";

export type EntryWithMedia = Entry & {
  media: Media;
};

export type EntryWithProfile = Entry & {
  media: Media;
  profile: Profile;
};

export type EntryWithDetails = Entry & {
  media: Media;
  profile: Profile;
  tags?: Tag[];
  comments?: Comment[];
};
