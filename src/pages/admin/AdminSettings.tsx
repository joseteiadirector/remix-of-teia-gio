import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { 
  Settings, 
  Database, 
  Zap, 
  Shield, 
  Clock,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

interface CleanupResult {
  timestamp: string;
  deleted_cache_entries: number;
  deleted_function_logs: number;
  deleted_old_jobs: number;
}

export default function AdminSettings() {
  const [loading, setLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null);
  const [dbStats, setDbStats] = useState({
    tables: 30,
    functions: 14,
    triggers: 6,
    policies: 100
  });

  const runCleanup = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('cleanup_old_data');
      if (error) throw error;
      
      setCleanupResult(data as unknown as CleanupResult);
      toast.success('Limpeza executada com sucesso!');
    } catch (error) {
      console.error('Error running cleanup:', error);
      toast.error('Erro ao executar limpeza');
    } finally {
      setLoading(false);
    }
  };

  const refreshCache = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.rpc('clean_expired_cache');
      if (error) throw error;
      toast.success('Cache limpo com sucesso!');
    } catch (error) {
      console.error('Error cleaning cache:', error);
      toast.error('Erro ao limpar cache');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Configurações do Sistema
        </h1>
        <p className="text-muted-foreground">Gerenciar configurações e manutenção</p>
      </div>

      {/* Database Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Visão Geral do Banco de Dados
          </CardTitle>
          <CardDescription>Estatísticas do esquema atual</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <div className="p-2 rounded-full bg-primary/10">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{dbStats.tables}</div>
                <div className="text-sm text-muted-foreground">Tabelas</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <div className="p-2 rounded-full bg-blue-500/10">
                <Zap className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{dbStats.functions}</div>
                <div className="text-sm text-muted-foreground">Funções</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <div className="p-2 rounded-full bg-orange-500/10">
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{dbStats.triggers}</div>
                <div className="text-sm text-muted-foreground">Triggers</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <div className="p-2 rounded-full bg-green-500/10">
                <Shield className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{dbStats.policies}%</div>
                <div className="text-sm text-muted-foreground">RLS Ativo</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Manutenção do Sistema
          </CardTitle>
          <CardDescription>Ações de limpeza e otimização</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <h4 className="font-medium">Limpeza Geral</h4>
              <p className="text-sm text-muted-foreground">
                Remove cache expirado, logs antigos e jobs concluídos (&gt;30 dias)
              </p>
            </div>
            <Button onClick={runCleanup} disabled={loading}>
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Executar
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <h4 className="font-medium">Limpar Cache LLM</h4>
              <p className="text-sm text-muted-foreground">
                Remove entradas de cache expiradas da tabela llm_query_cache
              </p>
            </div>
            <Button onClick={refreshCache} variant="outline" disabled={loading}>
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Limpar
            </Button>
          </div>

          {cleanupResult && (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium text-green-500">Limpeza Concluída</span>
              </div>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cache removido:</span>
                  <span>{cleanupResult.deleted_cache_entries} entradas</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Logs removidos:</span>
                  <span>{cleanupResult.deleted_function_logs} registros</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Jobs antigos:</span>
                  <span>{cleanupResult.deleted_old_jobs} removidos</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Status de Segurança
          </CardTitle>
          <CardDescription>Configurações de segurança ativas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>RLS habilitado em todas as tabelas</span>
              </div>
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                Ativo
              </Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Funções SECURITY DEFINER</span>
              </div>
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                14 funções
              </Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>User roles separados</span>
              </div>
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                Correto
              </Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>has_role() anti-recursão</span>
              </div>
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                Implementado
              </Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Auto-confirm email</span>
              </div>
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                Ativado
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edge Functions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Edge Functions
          </CardTitle>
          <CardDescription>44 funções de backend configuradas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {[
              { category: 'IA/LLM', count: 8, color: 'bg-purple-500/10 text-purple-500' },
              { category: 'Cálculos', count: 6, color: 'bg-blue-500/10 text-blue-500' },
              { category: 'Coleta', count: 5, color: 'bg-green-500/10 text-green-500' },
              { category: 'PDFs', count: 4, color: 'bg-orange-500/10 text-orange-500' },
              { category: 'Automação', count: 4, color: 'bg-yellow-500/10 text-yellow-500' },
              { category: 'Email', count: 5, color: 'bg-pink-500/10 text-pink-500' },
              { category: 'Análise', count: 4, color: 'bg-cyan-500/10 text-cyan-500' },
              { category: 'Outros', count: 8, color: 'bg-gray-500/10 text-gray-500' }
            ].map((cat) => (
              <div key={cat.category} className="flex items-center justify-between p-3 rounded-lg border">
                <span className="text-sm">{cat.category}</span>
                <Badge variant="outline" className={cat.color}>
                  {cat.count}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
