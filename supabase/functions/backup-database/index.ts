import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[BACKUP] Iniciando backup automático do banco...');
    const timestamp = new Date().toISOString();
    
    // Tabelas críticas para backup
    const criticalTables = [
      'brands',
      'geo_scores',
      'seo_metrics_daily',
      'mentions_llm',
      'gsc_queries',
      'url_analysis_history',
      'alert_configs',
      'automation_jobs'
    ];

    const backupData: Record<string, any> = {
      timestamp,
      version: '1.0.0',
      tables: {}
    };

    // Fazer backup de cada tabela
    for (const table of criticalTables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact' });

        if (error) {
          console.error(`[BACKUP] Erro ao fazer backup da tabela ${table}:`, error);
          backupData.tables[table] = { error: error.message, count: 0 };
        } else {
          backupData.tables[table] = { 
            count: count || 0,
            sample: data?.slice(0, 3) || [] // Apenas amostra para verificação
          };
          console.log(`[BACKUP] ✅ ${table}: ${count} registros`);
        }
      } catch (error) {
        console.error(`[BACKUP] Erro ao processar tabela ${table}:`, error);
        backupData.tables[table] = { error: String(error), count: 0 };
      }
    }

    // Contar totais
    const totalRecords = Object.values(backupData.tables)
      .reduce((sum: number, table: any) => sum + (table.count || 0), 0);

    const failedTables = Object.entries(backupData.tables)
      .filter(([_, table]: [string, any]) => table.error)
      .map(([name]) => name);

    // Calcular duração
    const durationMs = Date.now() - new Date(timestamp).getTime();

    // Salvar log do backup na nova tabela
    const { error: logError } = await supabase
      .from('backup_logs')
      .insert({
        backup_date: timestamp,
        status: failedTables.length === 0 ? 'success' : failedTables.length === criticalTables.length ? 'failed' : 'partial',
        total_tables: criticalTables.length - failedTables.length,
        total_records: totalRecords,
        failed_tables: failedTables,
        duration_ms: durationMs,
        metadata: {
          backup_summary: Object.entries(backupData.tables).map(([name, info]: [string, any]) => ({
            table: name,
            records: info.count || 0,
            status: info.error ? 'error' : 'success',
            error: info.error || null
          }))
        }
      });

    if (logError) {
      console.error('[BACKUP] Erro ao salvar log:', logError);
    }

    const response = {
      success: failedTables.length === 0,
      timestamp,
      summary: {
        total_records: totalRecords,
        tables_processed: criticalTables.length,
        tables_succeeded: criticalTables.length - failedTables.length,
        tables_failed: failedTables.length,
        failed_tables: failedTables
      },
      tables: backupData.tables
    };

    console.log('[BACKUP] Backup concluído:', response.summary);

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: failedTables.length === 0 ? 200 : 207 // 207 = Multi-Status
      }
    );

  } catch (error) {
    console.error('[BACKUP] Erro crítico no backup:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
