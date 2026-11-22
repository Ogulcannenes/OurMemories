
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "categories": {
                  Row: {
                    "created_at": string,"id": string,"key": string | null,"name": string | null,"position": number,"space_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"key"?: string | null,"name"?: string | null,"position"?: number,"space_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"key"?: string | null,"name"?: string | null,"position"?: number,"space_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "categories_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "spaces"
      referencedColumns: ["id"]
    }
                  ]
                },"favorites": {
                  Row: {
                    "created_at": string,"memory_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"memory_id": string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"memory_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "favorites_memory_id_fkey"
      columns: ["memory_id"]
isOneToOne: false
      referencedRelation: "memories"
      referencedColumns: ["id"]
    }
                  ]
                },"memories": {
                  Row: {
                    "author_id": string | null,"category_id": string | null,"created_at": string,"id": string,"occurred_on": string,"photo_path": string | null,"quote": string,"search_text": string | null,"space_id": string,"story": string | null,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string | null,"category_id"?: string | null,"created_at"?: string,"id"?: string,"occurred_on": string,"photo_path"?: string | null,"quote": string,"search_text"?: never,"space_id": string,"story"?: string | null,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "author_id"?: string | null,"category_id"?: string | null,"created_at"?: string,"id"?: string,"occurred_on"?: string,"photo_path"?: string | null,"quote"?: string,"search_text"?: never,"space_id"?: string,"story"?: string | null,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "memories_category_id_space_id_fkey"
      columns: ["category_id","space_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id","space_id"]
    },{
      foreignKeyName: "memories_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "spaces"
      referencedColumns: ["id"]
    }
                  ]
                },"memory_photos": {
                  Row: {
                    "created_at": string,"id": string,"memory_id": string,"path": string,"position": number,"space_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"memory_id": string,"path": string,"position"?: number,"space_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"memory_id"?: string,"path"?: string,"position"?: number,"space_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "memory_photos_memory_id_space_id_fkey"
      columns: ["memory_id","space_id"]
isOneToOne: false
      referencedRelation: "memories"
      referencedColumns: ["id","space_id"]
    }
                  ]
                },"memory_tags": {
                  Row: {
                    "memory_id": string,"space_id": string,"tag_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "memory_id": string,"space_id": string,"tag_id": string
                  }
                  Update: {
                    "memory_id"?: string,"space_id"?: string,"tag_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "memory_tags_memory_id_space_id_fkey"
      columns: ["memory_id","space_id"]
isOneToOne: false
      referencedRelation: "memories"
      referencedColumns: ["id","space_id"]
    },{
      foreignKeyName: "memory_tags_tag_id_space_id_fkey"
      columns: ["tag_id","space_id"]
isOneToOne: false
      referencedRelation: "tags"
      referencedColumns: ["id","space_id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"display_name": string,"id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"display_name": string,"id": string
                  }
                  Update: {
                    "created_at"?: string,"display_name"?: string,"id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"space_members": {
                  Row: {
                    "joined_at": string,"space_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "joined_at"?: string,"space_id": string,"user_id": string
                  }
                  Update: {
                    "joined_at"?: string,"space_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "space_members_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "spaces"
      referencedColumns: ["id"]
    }
                  ]
                },"spaces": {
                  Row: {
                    "created_at": string,"created_by": string | null,"id": string,"invite_code": string,"name": string,"together_since": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"invite_code": string,"name": string,"together_since"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"invite_code"?: string,"name"?: string,"together_since"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"tags": {
                  Row: {
                    "id": string,"name": string,"space_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"name": string,"space_id": string
                  }
                  Update: {
                    "id"?: string,"name"?: string,"space_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "tags_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "spaces"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "create_space":
{ Args: { "p_name": string }; Returns: string
                           },
"join_space":
{ Args: { "p_code": string }; Returns: string
                           },
"random_memory":
{ Args: { "p_exclude"?: string }; Returns: string
                           },
"set_memory_photos":
{ Args: { "p_memory": string,"p_paths": (string)[] }; Returns: undefined
                           },
"set_memory_tags":
{ Args: { "p_memory": string,"p_names": (string)[] }; Returns: undefined
                           },
"space_stats":
{ Args: Record<PropertyKey, never>; Returns: Json
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            
          }
        }
} as const
