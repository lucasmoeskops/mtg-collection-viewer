export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      honey_game: {
        Row: {
          created_at: string
          id: number
          score: number
          words_available: number | null
          words_correct: number | null
          words_played: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          score: number
          words_available?: number | null
          words_correct?: number | null
          words_played?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          score?: number
          words_available?: number | null
          words_correct?: number | null
          words_played?: number | null
        }
        Relationships: []
      }
      honey_translations: {
        Row: {
          created_at: string
          english: string
          id: number
          mastery: number | null
          sentence: string | null
          sentence_translation: string | null
          times_correct: number | null
          times_played: number | null
          word: number
        }
        Insert: {
          created_at?: string
          english: string
          id?: number
          mastery?: number | null
          sentence?: string | null
          sentence_translation?: string | null
          times_correct?: number | null
          times_played?: number | null
          word: number
        }
        Update: {
          created_at?: string
          english?: string
          id?: number
          mastery?: number | null
          sentence?: string | null
          sentence_translation?: string | null
          times_correct?: number | null
          times_played?: number | null
          word?: number
        }
        Relationships: [
          {
            foreignKeyName: "honey_translations_word_fkey"
            columns: ["word"]
            isOneToOne: false
            referencedRelation: "honey_words"
            referencedColumns: ["id"]
          },
        ]
      }
      honey_words: {
        Row: {
          created_at: string
          dutch: string
          id: number
        }
        Insert: {
          created_at?: string
          dutch: string
          id?: number
        }
        Update: {
          created_at?: string
          dutch?: string
          id?: number
        }
        Relationships: []
      }
      mtg_account: {
        Row: {
          created_at: string
          dbkey: string | null
          id: number
          username: string | null
        }
        Insert: {
          created_at?: string
          dbkey?: string | null
          id?: number
          username?: string | null
        }
        Update: {
          created_at?: string
          dbkey?: string | null
          id?: number
          username?: string | null
        }
        Relationships: []
      }
      mtg_account_card: {
        Row: {
          account: number
          amount: number
          card: number
          created_at: string
          id: number
        }
        Insert: {
          account: number
          amount?: number
          card: number
          created_at?: string
          id?: number
        }
        Update: {
          account?: number
          amount?: number
          card?: number
          created_at?: string
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "mtg_account_card_account_fkey"
            columns: ["account"]
            isOneToOne: false
            referencedRelation: "mtg_account"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mtg_account_card_card_fkey"
            columns: ["card"]
            isOneToOne: false
            referencedRelation: "mtg_data"
            referencedColumns: ["id"]
          },
        ]
      }
      mtg_data: {
        Row: {
          amount_owned: number | null
          artist: string
          card_type: string
          cardmarket_url: string | null
          cardnumber: number
          colors: string[]
          created_at: string
          id: number
          image_url: string | null
          is_foil: boolean
          is_token: boolean
          manacost: string
          name: string
          price_estimate: number
          rarity: string
          release_date: string
          series: string
          text: string
        }
        Insert: {
          amount_owned?: number | null
          artist: string
          card_type?: string
          cardmarket_url?: string | null
          cardnumber: number
          colors: string[]
          created_at?: string
          id?: number
          image_url?: string | null
          is_foil: boolean
          is_token?: boolean
          manacost: string
          name?: string
          price_estimate?: number
          rarity?: string
          release_date: string
          series: string
          text: string
        }
        Update: {
          amount_owned?: number | null
          artist?: string
          card_type?: string
          cardmarket_url?: string | null
          cardnumber?: number
          colors?: string[]
          created_at?: string
          id?: number
          image_url?: string | null
          is_foil?: boolean
          is_token?: boolean
          manacost?: string
          name?: string
          price_estimate?: number
          rarity?: string
          release_date?: string
          series?: string
          text?: string
        }
        Relationships: []
      }
      mtg_deck: {
        Row: {
          account: number
          created_at: string
          description: string | null
          id: number
          name: string | null
        }
        Insert: {
          account: number
          created_at?: string
          description?: string | null
          id?: number
          name?: string | null
        }
        Update: {
          account?: number
          created_at?: string
          description?: string | null
          id?: number
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mtg_deck_account_fkey"
            columns: ["account"]
            isOneToOne: false
            referencedRelation: "mtg_account"
            referencedColumns: ["id"]
          },
        ]
      }
      mtg_deck_card: {
        Row: {
          card: number
          created_at: string
          deck: number
          id: number
          role: string | null
        }
        Insert: {
          card: number
          created_at?: string
          deck: number
          id?: number
          role?: string | null
        }
        Update: {
          card?: number
          created_at?: string
          deck?: number
          id?: number
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mtg_deck_card_card_fkey"
            columns: ["card"]
            isOneToOne: false
            referencedRelation: "mtg_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mtg_deck_card_deck_fkey"
            columns: ["deck"]
            isOneToOne: false
            referencedRelation: "mtg_deck"
            referencedColumns: ["id"]
          },
        ]
      }
      mtg_price: {
        Row: {
          created_at: string
          id: number
          mtg_data_id: number
          non_foil_price_cents: number | null
          price_cents: number
          timestamp: string
        }
        Insert: {
          created_at?: string
          id?: number
          mtg_data_id?: number
          non_foil_price_cents?: number | null
          price_cents: number
          timestamp: string
        }
        Update: {
          created_at?: string
          id?: number
          mtg_data_id?: number
          non_foil_price_cents?: number | null
          price_cents?: number
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "mtg_price_mtg_data_id_fkey"
            columns: ["mtg_data_id"]
            isOneToOne: false
            referencedRelation: "mtg_data"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      random_card: {
        Args: never
        Returns: {
          amount_owned: number | null
          artist: string
          card_type: string
          cardmarket_url: string | null
          cardnumber: number
          colors: string[]
          created_at: string
          id: number
          image_url: string | null
          is_foil: boolean
          is_token: boolean
          manacost: string
          name: string
          price_estimate: number
          rarity: string
          release_date: string
          series: string
          text: string
        }[]
        SetofOptions: {
          from: "*"
          to: "mtg_data"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
