export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      books: {
        Row: {
          id: string
          title: string
          authors: string[]
          publisher: string | null
          publication_year: number | null
          language: string | null
          description: string | null
          cover_image: string | null
          neodb_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          authors?: string[]
          publisher?: string | null
          publication_year?: number | null
          language?: string | null
          description?: string | null
          cover_image?: string | null
          neodb_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          authors?: string[]
          publisher?: string | null
          publication_year?: number | null
          language?: string | null
          description?: string | null
          cover_image?: string | null
          neodb_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          id: string
          book_id: string
          rating_average: number | null
          rating_count: number
          updated_at: string
        }
        Insert: {
          id?: string
          book_id: string
          rating_average?: number | null
          rating_count?: number
          updated_at?: string
        }
        Update: {
          id?: string
          book_id?: string
          rating_average?: number | null
          rating_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: true
            referencedRelation: "books"
            referencedColumns: ["id"]
          }
        ]
      }
      tags: {
        Row: {
          id: string
          book_id: string
          tag: string
          created_at: string
        }
        Insert: {
          id?: string
          book_id: string
          tag: string
          created_at?: string
        }
        Update: {
          id?: string
          book_id?: string
          tag?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          }
        ]
      }
      purchase_links: {
        Row: {
          id: string
          book_id: string
          platform: string
          url: string
          price: number | null
          currency: string
          availability: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          book_id: string
          platform: string
          url: string
          price?: number | null
          currency?: string
          availability?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          book_id?: string
          platform?: string
          url?: string
          price?: number | null
          currency?: string
          availability?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_links_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
