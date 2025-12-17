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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_insights: {
        Row: {
          brand_id: string | null
          content: Json
          created_at: string
          id: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          brand_id?: string | null
          content: Json
          created_at?: string
          id?: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          brand_id?: string | null
          content?: Json
          created_at?: string
          id?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_configs: {
        Row: {
          created_at: string
          email: string
          id: string
          new_mention: boolean | null
          priority: Database["public"]["Enums"]["alert_priority"]
          score_decrease: boolean | null
          score_increase: boolean | null
          threshold_alert: boolean | null
          threshold_value: number | null
          updated_at: string
          user_id: string
          weekly_report: boolean | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          new_mention?: boolean | null
          priority?: Database["public"]["Enums"]["alert_priority"]
          score_decrease?: boolean | null
          score_increase?: boolean | null
          threshold_alert?: boolean | null
          threshold_value?: number | null
          updated_at?: string
          user_id: string
          weekly_report?: boolean | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          new_mention?: boolean | null
          priority?: Database["public"]["Enums"]["alert_priority"]
          score_decrease?: boolean | null
          score_increase?: boolean | null
          threshold_alert?: boolean | null
          threshold_value?: number | null
          updated_at?: string
          user_id?: string
          weekly_report?: boolean | null
        }
        Relationships: []
      }
      alerts_history: {
        Row: {
          alert_type: string
          brand_id: string | null
          created_at: string
          id: string
          message: string
          metadata: Json | null
          priority: Database["public"]["Enums"]["alert_priority"]
          read: boolean | null
          title: string
          user_id: string
        }
        Insert: {
          alert_type: string
          brand_id?: string | null
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["alert_priority"]
          read?: boolean | null
          title: string
          user_id: string
        }
        Update: {
          alert_type?: string
          brand_id?: string | null
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["alert_priority"]
          read?: boolean | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      automation_configs: {
        Row: {
          automation_type: string
          brand_id: string | null
          config: Json | null
          created_at: string | null
          enabled: boolean | null
          frequency: string
          id: string
          last_run: string | null
          next_run: string | null
          schedule_time: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          automation_type: string
          brand_id?: string | null
          config?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          frequency: string
          id?: string
          last_run?: string | null
          next_run?: string | null
          schedule_time?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          automation_type?: string
          brand_id?: string | null
          config?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          frequency?: string
          id?: string
          last_run?: string | null
          next_run?: string | null
          schedule_time?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_configs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_jobs: {
        Row: {
          brand_id: string | null
          completed_at: string | null
          config_id: string | null
          created_at: string | null
          duration_ms: number | null
          error: string | null
          id: string
          job_type: string
          result: Json | null
          started_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          brand_id?: string | null
          completed_at?: string | null
          config_id?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error?: string | null
          id?: string
          job_type: string
          result?: Json | null
          started_at?: string | null
          status: string
          user_id: string
        }
        Update: {
          brand_id?: string | null
          completed_at?: string | null
          config_id?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error?: string | null
          id?: string
          job_type?: string
          result?: Json | null
          started_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_jobs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_jobs_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "automation_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_logs: {
        Row: {
          backup_date: string
          created_at: string
          duration_ms: number | null
          failed_tables: string[] | null
          id: string
          metadata: Json | null
          status: string
          total_records: number
          total_tables: number
        }
        Insert: {
          backup_date?: string
          created_at?: string
          duration_ms?: number | null
          failed_tables?: string[] | null
          id?: string
          metadata?: Json | null
          status: string
          total_records?: number
          total_tables?: number
        }
        Update: {
          backup_date?: string
          created_at?: string
          duration_ms?: number | null
          failed_tables?: string[] | null
          id?: string
          metadata?: Json | null
          status?: string
          total_records?: number
          total_tables?: number
        }
        Relationships: []
      }
      brand_documents: {
        Row: {
          brand_id: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          mime_type: string
          status: string
          total_chunks: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          id?: string
          mime_type?: string
          status?: string
          total_chunks?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          mime_type?: string
          status?: string
          total_chunks?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_documents_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          context: string | null
          created_at: string | null
          description: string | null
          domain: string
          id: string
          is_visible: boolean
          name: string
          user_id: string
        }
        Insert: {
          context?: string | null
          created_at?: string | null
          description?: string | null
          domain: string
          id?: string
          is_visible?: boolean
          name: string
          user_id: string
        }
        Update: {
          context?: string | null
          created_at?: string | null
          description?: string | null
          domain?: string
          id?: string
          is_visible?: boolean
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_comparisons: {
        Row: {
          analysis_data: Json | null
          competitor_urls: Json
          created_at: string
          id: string
          main_url: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_data?: Json | null
          competitor_urls?: Json
          created_at?: string
          id?: string
          main_url: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_data?: Json | null
          competitor_urls?: Json
          created_at?: string
          id?: string
          main_url?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dashboard_configs: {
        Row: {
          created_at: string
          id: string
          layout: Json
          updated_at: string
          user_id: string
          widgets: Json
        }
        Insert: {
          created_at?: string
          id?: string
          layout?: Json
          updated_at?: string
          user_id: string
          widgets?: Json
        }
        Update: {
          created_at?: string
          id?: string
          layout?: Json
          updated_at?: string
          user_id?: string
          widgets?: Json
        }
        Relationships: []
      }
      document_chunks: {
        Row: {
          brand_id: string
          chunk_index: number
          content: string
          content_length: number
          created_at: string
          document_id: string
          id: string
        }
        Insert: {
          brand_id: string
          chunk_index: number
          content: string
          content_length: number
          created_at?: string
          document_id: string
          id?: string
        }
        Update: {
          brand_id?: string
          chunk_index?: number
          content?: string
          content_length?: number
          created_at?: string
          document_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "brand_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      function_calls_log: {
        Row: {
          created_at: string
          function_name: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          function_name: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          function_name?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      generated_reports: {
        Row: {
          content: Json
          email_sent: boolean
          generated_at: string
          id: string
          report_type: string
          status: string
          user_id: string
        }
        Insert: {
          content?: Json
          email_sent?: boolean
          generated_at?: string
          id?: string
          report_type: string
          status?: string
          user_id: string
        }
        Update: {
          content?: Json
          email_sent?: boolean
          generated_at?: string
          id?: string
          report_type?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      geo_pillars_monthly: {
        Row: {
          autoridade_cognitiva: number
          base_tecnica: number
          brand_id: string
          created_at: string
          estrutura_semantica: number
          geo_score_final: number
          id: string
          inteligencia_estrategica: number
          month_year: string
          relevancia_conversacional: number
          total_mentions: number | null
          total_queries: number | null
        }
        Insert: {
          autoridade_cognitiva: number
          base_tecnica: number
          brand_id: string
          created_at?: string
          estrutura_semantica: number
          geo_score_final: number
          id?: string
          inteligencia_estrategica: number
          month_year: string
          relevancia_conversacional: number
          total_mentions?: number | null
          total_queries?: number | null
        }
        Update: {
          autoridade_cognitiva?: number
          base_tecnica?: number
          brand_id?: string
          created_at?: string
          estrutura_semantica?: number
          geo_score_final?: number
          id?: string
          inteligencia_estrategica?: number
          month_year?: string
          relevancia_conversacional?: number
          total_mentions?: number | null
          total_queries?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "geo_pillars_monthly_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      geo_scores: {
        Row: {
          brand_id: string
          breakdown: Json
          computed_at: string | null
          cpi: number | null
          id: number
          score: number
        }
        Insert: {
          brand_id: string
          breakdown: Json
          computed_at?: string | null
          cpi?: number | null
          id?: number
          score: number
        }
        Update: {
          brand_id?: string
          breakdown?: Json
          computed_at?: string | null
          cpi?: number | null
          id?: number
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "geo_scores_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      gsc_queries: {
        Row: {
          brand_id: string
          clicks: number
          collected_at: string
          ctr: number
          id: string
          impressions: number
          position: number
          query: string
        }
        Insert: {
          brand_id: string
          clicks?: number
          collected_at?: string
          ctr?: number
          id?: string
          impressions?: number
          position?: number
          query: string
        }
        Update: {
          brand_id?: string
          clicks?: number
          collected_at?: string
          ctr?: number
          id?: string
          impressions?: number
          position?: number
          query?: string
        }
        Relationships: [
          {
            foreignKeyName: "gsc_queries_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      gsc_queries_audit: {
        Row: {
          brand_id: string
          created_at: string | null
          edge_function: string
          id: string
          metadata: Json | null
          operation: string
        }
        Insert: {
          brand_id: string
          created_at?: string | null
          edge_function: string
          id?: string
          metadata?: Json | null
          operation: string
        }
        Update: {
          brand_id?: string
          created_at?: string | null
          edge_function?: string
          id?: string
          metadata?: Json | null
          operation?: string
        }
        Relationships: [
          {
            foreignKeyName: "gsc_queries_audit_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      hallucination_detections: {
        Row: {
          avg_risk_score: number | null
          brand_id: string | null
          created_at: string | null
          critical_count: number | null
          detection_results: Json
          execution_id: string | null
          id: string
          user_id: string
        }
        Insert: {
          avg_risk_score?: number | null
          brand_id?: string | null
          created_at?: string | null
          critical_count?: number | null
          detection_results: Json
          execution_id?: string | null
          id?: string
          user_id: string
        }
        Update: {
          avg_risk_score?: number | null
          brand_id?: string | null
          created_at?: string | null
          critical_count?: number | null
          detection_results?: Json
          execution_id?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hallucination_detections_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hallucination_detections_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "nucleus_executions"
            referencedColumns: ["id"]
          },
        ]
      }
      igo_metrics_history: {
        Row: {
          brand_id: string
          calculated_at: string
          cognitive_stability: number
          confidence_interval: number | null
          cpi: number
          created_at: string
          gap: number
          ice: number
          id: string
          metadata: Json | null
        }
        Insert: {
          brand_id: string
          calculated_at?: string
          cognitive_stability?: number
          confidence_interval?: number | null
          cpi?: number
          created_at?: string
          gap?: number
          ice?: number
          id?: string
          metadata?: Json | null
        }
        Update: {
          brand_id?: string
          calculated_at?: string
          cognitive_stability?: number
          confidence_interval?: number | null
          cpi?: number
          created_at?: string
          gap?: number
          ice?: number
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "igo_metrics_history_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      llm_query_cache: {
        Row: {
          created_at: string
          expires_at: string
          hit_count: number
          id: string
          provider: string
          query_hash: string
          query_text: string
          response: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string
          hit_count?: number
          id?: string
          provider: string
          query_hash: string
          query_text: string
          response: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          hit_count?: number
          id?: string
          provider?: string
          query_hash?: string
          query_text?: string
          response?: string
          user_id?: string | null
        }
        Relationships: []
      }
      mentions_llm: {
        Row: {
          answer_excerpt: string | null
          brand_id: string
          collected_at: string | null
          confidence: number
          id: number
          mentioned: boolean
          provider: string
          query: string
        }
        Insert: {
          answer_excerpt?: string | null
          brand_id: string
          collected_at?: string | null
          confidence: number
          id?: number
          mentioned: boolean
          provider: string
          query: string
        }
        Update: {
          answer_excerpt?: string | null
          brand_id?: string
          collected_at?: string | null
          confidence?: number
          id?: number
          mentioned?: boolean
          provider?: string
          query?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentions_llm_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      nucleus_executions: {
        Row: {
          brand_id: string | null
          completed_at: string | null
          error: string | null
          id: string
          llms_used: Json | null
          query_id: string | null
          results: Json | null
          started_at: string | null
          status: string
          total_mentions: number | null
          total_queries: number | null
          user_id: string
        }
        Insert: {
          brand_id?: string | null
          completed_at?: string | null
          error?: string | null
          id?: string
          llms_used?: Json | null
          query_id?: string | null
          results?: Json | null
          started_at?: string | null
          status?: string
          total_mentions?: number | null
          total_queries?: number | null
          user_id: string
        }
        Update: {
          brand_id?: string | null
          completed_at?: string | null
          error?: string | null
          id?: string
          llms_used?: Json | null
          query_id?: string | null
          results?: Json | null
          started_at?: string | null
          status?: string
          total_mentions?: number | null
          total_queries?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nucleus_executions_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nucleus_executions_query_id_fkey"
            columns: ["query_id"]
            isOneToOne: false
            referencedRelation: "nucleus_queries"
            referencedColumns: ["id"]
          },
        ]
      }
      nucleus_queries: {
        Row: {
          brand_id: string | null
          category: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_template: boolean | null
          keywords: Json | null
          query_text: string
          selected_llms: Json | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          brand_id?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          keywords?: Json | null
          query_text: string
          selected_llms?: Json | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          brand_id?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          keywords?: Json | null
          query_text?: string
          selected_llms?: Json | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nucleus_queries_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string | null
          full_name: string | null
          id: string
          job_title: string | null
          phone: string | null
          preferences: Json | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          job_title?: string | null
          phone?: string | null
          preferences?: Json | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          phone?: string | null
          preferences?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      recommendation_checklist: {
        Row: {
          brand_id: string | null
          completed_at: string | null
          created_at: string | null
          estimated_impact: number | null
          id: string
          priority: string
          recommendation_description: string | null
          recommendation_title: string
          recommendation_type: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          brand_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          estimated_impact?: number | null
          id?: string
          priority?: string
          recommendation_description?: string | null
          recommendation_title: string
          recommendation_type: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          brand_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          estimated_impact?: number | null
          id?: string
          priority?: string
          recommendation_description?: string | null
          recommendation_title?: string
          recommendation_type?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_checklist_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendation_impact: {
        Row: {
          after_value: number | null
          before_value: number | null
          brand_id: string | null
          created_at: string | null
          id: string
          improvement_percentage: number | null
          measured_at: string | null
          metric_name: string
          recommendation_id: string | null
          user_id: string
        }
        Insert: {
          after_value?: number | null
          before_value?: number | null
          brand_id?: string | null
          created_at?: string | null
          id?: string
          improvement_percentage?: number | null
          measured_at?: string | null
          metric_name: string
          recommendation_id?: string | null
          user_id: string
        }
        Update: {
          after_value?: number | null
          before_value?: number | null
          brand_id?: string | null
          created_at?: string | null
          id?: string
          improvement_percentage?: number | null
          measured_at?: string | null
          metric_name?: string
          recommendation_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_impact_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendation_impact_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "recommendation_checklist"
            referencedColumns: ["id"]
          },
        ]
      }
      report_audits: {
        Row: {
          audit_date: string
          audit_pdf_url: string | null
          brand_id: string
          complete_report_data: Json | null
          created_at: string
          geo_metrics_data: Json | null
          id: string
          inconsistencies_found: number
          kpi_data: Json | null
          max_divergence_percentage: number | null
          seo_metrics_data: Json | null
          status: string
          user_id: string
          validation_results: Json
        }
        Insert: {
          audit_date?: string
          audit_pdf_url?: string | null
          brand_id: string
          complete_report_data?: Json | null
          created_at?: string
          geo_metrics_data?: Json | null
          id?: string
          inconsistencies_found?: number
          kpi_data?: Json | null
          max_divergence_percentage?: number | null
          seo_metrics_data?: Json | null
          status?: string
          user_id: string
          validation_results?: Json
        }
        Update: {
          audit_date?: string
          audit_pdf_url?: string | null
          brand_id?: string
          complete_report_data?: Json | null
          created_at?: string
          geo_metrics_data?: Json | null
          id?: string
          inconsistencies_found?: number
          kpi_data?: Json | null
          max_divergence_percentage?: number | null
          seo_metrics_data?: Json | null
          status?: string
          user_id?: string
          validation_results?: Json
        }
        Relationships: []
      }
      scheduled_notifications: {
        Row: {
          brand_id: string | null
          config: Json | null
          created_at: string | null
          enabled: boolean | null
          frequency: string
          id: string
          last_sent: string | null
          next_send: string | null
          notification_type: string
          schedule_day: number | null
          schedule_time: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          brand_id?: string | null
          config?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          frequency: string
          id?: string
          last_sent?: string | null
          next_send?: string | null
          notification_type: string
          schedule_day?: number | null
          schedule_time: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          brand_id?: string | null
          config?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          frequency?: string
          id?: string
          last_sent?: string | null
          next_send?: string | null
          notification_type?: string
          schedule_day?: number | null
          schedule_time?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_notifications_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_reports: {
        Row: {
          created_at: string
          enabled: boolean
          frequency: string
          id: string
          last_run: string | null
          next_run: string | null
          report_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          frequency: string
          id?: string
          last_run?: string | null
          next_run?: string | null
          report_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          frequency?: string
          id?: string
          last_run?: string | null
          next_run?: string | null
          report_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scientific_reports: {
        Row: {
          brand_id: string | null
          generated_at: string | null
          id: string
          period_days: number
          report_data: Json
          report_type: string
          user_id: string
        }
        Insert: {
          brand_id?: string | null
          generated_at?: string | null
          id?: string
          period_days: number
          report_data: Json
          report_type: string
          user_id: string
        }
        Update: {
          brand_id?: string | null
          generated_at?: string | null
          id?: string
          period_days?: number
          report_data?: Json
          report_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scientific_reports_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_metrics_daily: {
        Row: {
          avg_position: number | null
          brand_id: string
          collected_at: string
          conversion_rate: number | null
          ctr: number | null
          date: string
          id: string
          organic_traffic: number | null
          seo_score: number | null
          total_clicks: number | null
          total_impressions: number | null
        }
        Insert: {
          avg_position?: number | null
          brand_id: string
          collected_at?: string
          conversion_rate?: number | null
          ctr?: number | null
          date: string
          id?: string
          organic_traffic?: number | null
          seo_score?: number | null
          total_clicks?: number | null
          total_impressions?: number | null
        }
        Update: {
          avg_position?: number | null
          brand_id?: string
          collected_at?: string
          conversion_rate?: number | null
          ctr?: number | null
          date?: string
          id?: string
          organic_traffic?: number | null
          seo_score?: number | null
          total_clicks?: number | null
          total_impressions?: number | null
        }
        Relationships: []
      }
      signals: {
        Row: {
          brand_id: string
          collected_at: string | null
          id: number
          kind: string
          meta: Json | null
          metric: string
          value: number
        }
        Insert: {
          brand_id: string
          collected_at?: string | null
          id?: number
          kind: string
          meta?: Json | null
          metric: string
          value: number
        }
        Update: {
          brand_id?: string
          collected_at?: string | null
          id?: number
          kind?: string
          meta?: Json | null
          metric?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "signals_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      url_analysis_history: {
        Row: {
          analysis_data: Json
          brand_id: string | null
          created_at: string
          geo_score: number
          id: string
          overall_score: number
          seo_score: number
          summary: string | null
          url: string
          user_id: string
        }
        Insert: {
          analysis_data: Json
          brand_id?: string | null
          created_at?: string
          geo_score: number
          id?: string
          overall_score: number
          seo_score: number
          summary?: string | null
          url: string
          user_id: string
        }
        Update: {
          analysis_data?: Json
          brand_id?: string | null
          created_at?: string
          geo_score?: number
          id?: string
          overall_score?: number
          seo_score?: number
          summary?: string | null
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "url_analysis_history_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      url_monitoring_schedules: {
        Row: {
          alert_on_drop: boolean
          alert_threshold: number
          created_at: string
          enabled: boolean
          frequency: string
          id: string
          last_run: string | null
          next_run: string | null
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          alert_on_drop?: boolean
          alert_threshold?: number
          created_at?: string
          enabled?: boolean
          frequency: string
          id?: string
          last_run?: string | null
          next_run?: string | null
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          alert_on_drop?: boolean
          alert_threshold?: number
          created_at?: string
          enabled?: boolean
          frequency?: string
          id?: string
          last_run?: string | null
          next_run?: string | null
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      url_optimization_tasks: {
        Row: {
          analysis_id: string | null
          category: Database["public"]["Enums"]["task_category"]
          completed_at: string | null
          created_at: string
          description: string
          estimated_impact: number | null
          id: string
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          analysis_id?: string | null
          category: Database["public"]["Enums"]["task_category"]
          completed_at?: string | null
          created_at?: string
          description: string
          estimated_impact?: number | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          analysis_id?: string | null
          category?: Database["public"]["Enums"]["task_category"]
          completed_at?: string | null
          created_at?: string
          description?: string
          estimated_impact?: number | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "url_optimization_tasks_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "url_analysis_history"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      calculate_cpi_from_igo: {
        Args: { p_gap: number; p_ice: number; p_stability: number }
        Returns: number
      }
      calculate_next_run: {
        Args: { frequency: string; last_run?: string; schedule_time: string }
        Returns: string
      }
      can_analyze: { Args: { _user_id: string }; Returns: boolean }
      can_edit: { Args: { _user_id: string }; Returns: boolean }
      can_manage: { Args: { _user_id: string }; Returns: boolean }
      can_view: { Args: { _user_id: string }; Returns: boolean }
      clean_expired_cache: { Args: never; Returns: undefined }
      clean_old_function_logs: { Args: never; Returns: undefined }
      cleanup_old_data: { Args: never; Returns: Json }
      get_platform_health: { Args: never; Returns: Json }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_gsc_operation: {
        Args: {
          _brand_id: string
          _edge_function: string
          _metadata?: Json
          _operation: string
        }
        Returns: string
      }
      sync_brand_statistics: { Args: { p_brand_id: string }; Returns: Json }
      validate_platform_consistency: {
        Args: never
        Returns: {
          check_name: string
          details: string
          status: string
        }[]
      }
      verify_admin_role: { Args: never; Returns: boolean }
    }
    Enums: {
      alert_priority: "low" | "medium" | "high" | "critical"
      app_role:
        | "admin"
        | "user"
        | "agency_manager"
        | "editor"
        | "analyst"
        | "viewer"
      document_status: "processing" | "completed" | "failed"
      job_status: "pending" | "running" | "completed" | "failed"
      report_status: "pending" | "generating" | "completed" | "failed"
      task_category: "geo" | "seo" | "technical" | "content" | "performance"
      task_priority: "high" | "medium" | "low"
      task_status: "pending" | "in_progress" | "completed"
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
    Enums: {
      alert_priority: ["low", "medium", "high", "critical"],
      app_role: [
        "admin",
        "user",
        "agency_manager",
        "editor",
        "analyst",
        "viewer",
      ],
      document_status: ["processing", "completed", "failed"],
      job_status: ["pending", "running", "completed", "failed"],
      report_status: ["pending", "generating", "completed", "failed"],
      task_category: ["geo", "seo", "technical", "content", "performance"],
      task_priority: ["high", "medium", "low"],
      task_status: ["pending", "in_progress", "completed"],
    },
  },
} as const
