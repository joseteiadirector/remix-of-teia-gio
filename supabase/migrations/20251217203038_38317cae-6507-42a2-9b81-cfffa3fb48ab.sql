-- =============================================
-- PARTE 1: ATUALIZAR brands.user_id COM CASCADE
-- =============================================
ALTER TABLE public.brands DROP CONSTRAINT IF EXISTS brands_user_id_fkey;
ALTER TABLE public.brands
ADD CONSTRAINT brands_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- =============================================
-- PARTE 2: CRIAR FK FALTANTE geo_pillars_monthly
-- =============================================
ALTER TABLE public.geo_pillars_monthly DROP CONSTRAINT IF EXISTS geo_pillars_monthly_brand_id_fkey;
ALTER TABLE public.geo_pillars_monthly
ADD CONSTRAINT geo_pillars_monthly_brand_id_fkey 
FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- =============================================
-- PARTE 3: ATUALIZAR FKs COM CASCADE
-- =============================================

-- ai_insights
ALTER TABLE public.ai_insights DROP CONSTRAINT IF EXISTS ai_insights_brand_id_fkey;
ALTER TABLE public.ai_insights
ADD CONSTRAINT ai_insights_brand_id_fkey 
FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- automation_configs
ALTER TABLE public.automation_configs DROP CONSTRAINT IF EXISTS automation_configs_brand_id_fkey;
ALTER TABLE public.automation_configs
ADD CONSTRAINT automation_configs_brand_id_fkey 
FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- automation_jobs
ALTER TABLE public.automation_jobs DROP CONSTRAINT IF EXISTS automation_jobs_brand_id_fkey;
ALTER TABLE public.automation_jobs
ADD CONSTRAINT automation_jobs_brand_id_fkey 
FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

ALTER TABLE public.automation_jobs DROP CONSTRAINT IF EXISTS automation_jobs_config_id_fkey;
ALTER TABLE public.automation_jobs
ADD CONSTRAINT automation_jobs_config_id_fkey 
FOREIGN KEY (config_id) REFERENCES public.automation_configs(id) ON DELETE CASCADE;

-- brand_documents
ALTER TABLE public.brand_documents DROP CONSTRAINT IF EXISTS brand_documents_brand_id_fkey;
ALTER TABLE public.brand_documents
ADD CONSTRAINT brand_documents_brand_id_fkey 
FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- document_chunks
ALTER TABLE public.document_chunks DROP CONSTRAINT IF EXISTS document_chunks_brand_id_fkey;
ALTER TABLE public.document_chunks
ADD CONSTRAINT document_chunks_brand_id_fkey 
FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

ALTER TABLE public.document_chunks DROP CONSTRAINT IF EXISTS document_chunks_document_id_fkey;
ALTER TABLE public.document_chunks
ADD CONSTRAINT document_chunks_document_id_fkey 
FOREIGN KEY (document_id) REFERENCES public.brand_documents(id) ON DELETE CASCADE;

-- geo_scores
ALTER TABLE public.geo_scores DROP CONSTRAINT IF EXISTS geo_scores_brand_id_fkey;
ALTER TABLE public.geo_scores
ADD CONSTRAINT geo_scores_brand_id_fkey 
FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- gsc_queries
ALTER TABLE public.gsc_queries DROP CONSTRAINT IF EXISTS gsc_queries_brand_id_fkey;
ALTER TABLE public.gsc_queries
ADD CONSTRAINT gsc_queries_brand_id_fkey 
FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- gsc_queries_audit
ALTER TABLE public.gsc_queries_audit DROP CONSTRAINT IF EXISTS gsc_queries_audit_brand_id_fkey;
ALTER TABLE public.gsc_queries_audit
ADD CONSTRAINT gsc_queries_audit_brand_id_fkey 
FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- hallucination_detections
ALTER TABLE public.hallucination_detections DROP CONSTRAINT IF EXISTS hallucination_detections_brand_id_fkey;
ALTER TABLE public.hallucination_detections
ADD CONSTRAINT hallucination_detections_brand_id_fkey 
FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

ALTER TABLE public.hallucination_detections DROP CONSTRAINT IF EXISTS hallucination_detections_execution_id_fkey;
ALTER TABLE public.hallucination_detections
ADD CONSTRAINT hallucination_detections_execution_id_fkey 
FOREIGN KEY (execution_id) REFERENCES public.nucleus_executions(id) ON DELETE CASCADE;

-- igo_metrics_history
ALTER TABLE public.igo_metrics_history DROP CONSTRAINT IF EXISTS igo_metrics_history_brand_id_fkey;
ALTER TABLE public.igo_metrics_history
ADD CONSTRAINT igo_metrics_history_brand_id_fkey 
FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- mentions_llm
ALTER TABLE public.mentions_llm DROP CONSTRAINT IF EXISTS mentions_llm_brand_id_fkey;
ALTER TABLE public.mentions_llm
ADD CONSTRAINT mentions_llm_brand_id_fkey 
FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- nucleus_executions
ALTER TABLE public.nucleus_executions DROP CONSTRAINT IF EXISTS nucleus_executions_brand_id_fkey;
ALTER TABLE public.nucleus_executions
ADD CONSTRAINT nucleus_executions_brand_id_fkey 
FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

ALTER TABLE public.nucleus_executions DROP CONSTRAINT IF EXISTS nucleus_executions_query_id_fkey;
ALTER TABLE public.nucleus_executions
ADD CONSTRAINT nucleus_executions_query_id_fkey 
FOREIGN KEY (query_id) REFERENCES public.nucleus_queries(id) ON DELETE CASCADE;

-- nucleus_queries
ALTER TABLE public.nucleus_queries DROP CONSTRAINT IF EXISTS nucleus_queries_brand_id_fkey;
ALTER TABLE public.nucleus_queries
ADD CONSTRAINT nucleus_queries_brand_id_fkey 
FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- recommendation_checklist
ALTER TABLE public.recommendation_checklist DROP CONSTRAINT IF EXISTS recommendation_checklist_brand_id_fkey;
ALTER TABLE public.recommendation_checklist
ADD CONSTRAINT recommendation_checklist_brand_id_fkey 
FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- recommendation_impact
ALTER TABLE public.recommendation_impact DROP CONSTRAINT IF EXISTS recommendation_impact_brand_id_fkey;
ALTER TABLE public.recommendation_impact
ADD CONSTRAINT recommendation_impact_brand_id_fkey 
FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

ALTER TABLE public.recommendation_impact DROP CONSTRAINT IF EXISTS recommendation_impact_recommendation_id_fkey;
ALTER TABLE public.recommendation_impact
ADD CONSTRAINT recommendation_impact_recommendation_id_fkey 
FOREIGN KEY (recommendation_id) REFERENCES public.recommendation_checklist(id) ON DELETE CASCADE;

-- scheduled_notifications
ALTER TABLE public.scheduled_notifications DROP CONSTRAINT IF EXISTS scheduled_notifications_brand_id_fkey;
ALTER TABLE public.scheduled_notifications
ADD CONSTRAINT scheduled_notifications_brand_id_fkey 
FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- scientific_reports
ALTER TABLE public.scientific_reports DROP CONSTRAINT IF EXISTS scientific_reports_brand_id_fkey;
ALTER TABLE public.scientific_reports
ADD CONSTRAINT scientific_reports_brand_id_fkey 
FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- url_analysis_history
ALTER TABLE public.url_analysis_history DROP CONSTRAINT IF EXISTS url_analysis_history_brand_id_fkey;
ALTER TABLE public.url_analysis_history
ADD CONSTRAINT url_analysis_history_brand_id_fkey 
FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- url_optimization_tasks
ALTER TABLE public.url_optimization_tasks DROP CONSTRAINT IF EXISTS url_optimization_tasks_analysis_id_fkey;
ALTER TABLE public.url_optimization_tasks
ADD CONSTRAINT url_optimization_tasks_analysis_id_fkey 
FOREIGN KEY (analysis_id) REFERENCES public.url_analysis_history(id) ON DELETE CASCADE;

-- chat_messages
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_conversation_id_fkey;
ALTER TABLE public.chat_messages
ADD CONSTRAINT chat_messages_conversation_id_fkey 
FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id) ON DELETE CASCADE;