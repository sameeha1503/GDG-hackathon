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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      blood_requests: {
        Row: {
          blood_group_needed: string
          component: string
          confirmed_donor_id: string | null
          created_at: string
          hospital_name: string
          id: string
          notification_round: number
          patient_id: string
          request_code: string
          required_by: string
          status: string
          units_needed: number
          urgency_level: string
        }
        Insert: {
          blood_group_needed: string
          component?: string
          confirmed_donor_id?: string | null
          created_at?: string
          hospital_name: string
          id?: string
          notification_round?: number
          patient_id: string
          request_code: string
          required_by: string
          status?: string
          units_needed?: number
          urgency_level?: string
        }
        Update: {
          blood_group_needed?: string
          component?: string
          confirmed_donor_id?: string | null
          created_at?: string
          hospital_name?: string
          id?: string
          notification_round?: number
          patient_id?: string
          request_code?: string
          required_by?: string
          status?: string
          units_needed?: number
          urgency_level?: string
        }
        Relationships: [
          {
            foreignKeyName: "blood_requests_confirmed_donor_id_fkey"
            columns: ["confirmed_donor_id"]
            isOneToOne: false
            referencedRelation: "donors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blood_requests_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      care_records: {
        Row: {
          confirmatory_status: string
          confirmed_result: string
          last_updated_date: string
          last_updated_facility: string
          mock_abha_id: string
          patient_id: string
          record_id: string
          treatment_status: string
        }
        Insert: {
          confirmatory_status: string
          confirmed_result: string
          last_updated_date?: string
          last_updated_facility: string
          mock_abha_id: string
          patient_id: string
          record_id: string
          treatment_status?: string
        }
        Update: {
          confirmatory_status?: string
          confirmed_result?: string
          last_updated_date?: string
          last_updated_facility?: string
          mock_abha_id?: string
          patient_id?: string
          record_id?: string
          treatment_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      donors: {
        Row: {
          availability_status: string
          blood_group: string
          created_at: string
          distance_km: number
          donor_code: string
          general_location: string
          id: string
          past_donation_count: number
          private_phone: string
          response_rate: number
        }
        Insert: {
          availability_status?: string
          blood_group: string
          created_at?: string
          distance_km?: number
          donor_code: string
          general_location: string
          id?: string
          past_donation_count?: number
          private_phone?: string
          response_rate?: number
        }
        Update: {
          availability_status?: string
          blood_group?: string
          created_at?: string
          distance_km?: number
          donor_code?: string
          general_location?: string
          id?: string
          past_donation_count?: number
          private_phone?: string
          response_rate?: number
        }
        Relationships: []
      }
      patients: {
        Row: {
          closed_at: string | null
          confirmed_result: string | null
          created_at: string
          district: string
          id: string
          name: string
          patient_code: string
          phc: string
          phone_number: string
          preferred_language: string
          report_reference: string | null
          screening_date: string
          status: string
        }
        Insert: {
          closed_at?: string | null
          confirmed_result?: string | null
          created_at?: string
          district: string
          id?: string
          name: string
          patient_code: string
          phc: string
          phone_number: string
          preferred_language?: string
          report_reference?: string | null
          screening_date: string
          status?: string
        }
        Update: {
          closed_at?: string | null
          confirmed_result?: string | null
          created_at?: string
          district?: string
          id?: string
          name?: string
          patient_code?: string
          phc?: string
          phone_number?: string
          preferred_language?: string
          report_reference?: string | null
          screening_date?: string
          status?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          facility: string
          full_name: string
          id: string
        }
        Insert: {
          created_at?: string
          facility?: string
          full_name?: string
          id: string
        }
        Update: {
          created_at?: string
          facility?: string
          full_name?: string
          id?: string
        }
        Relationships: []
      }
      reminder_log: {
        Row: {
          channel: string
          id: string
          language: string
          message: string
          patient_id: string
          sent_at: string
          sent_by: string | null
        }
        Insert: {
          channel?: string
          id?: string
          language: string
          message: string
          patient_id: string
          sent_at?: string
          sent_by?: string | null
        }
        Update: {
          channel?: string
          id?: string
          language?: string
          message?: string
          patient_id?: string
          sent_at?: string
          sent_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reminder_log_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      request_notifications: {
        Row: {
          donor_id: string
          id: string
          request_id: string
          response: string
          round: number
          sent_at: string
        }
        Insert: {
          donor_id: string
          id?: string
          request_id: string
          response?: string
          round?: number
          sent_at?: string
        }
        Update: {
          donor_id?: string
          id?: string
          request_id?: string
          response?: string
          round?: number
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_notifications_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "donors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_notifications_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "blood_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "health_worker" | "blood_bank"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["health_worker", "blood_bank"],
    },
  },
} as const
