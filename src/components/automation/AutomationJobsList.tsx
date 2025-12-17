import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CheckCircle2, XCircle, Clock, Timer } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AutomationJobsListProps {
  jobs: any[];
}

export function AutomationJobsList({ jobs }: AutomationJobsListProps) {
  if (!jobs || jobs.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="Nenhum histórico ainda"
        description="As execuções de automações aparecerão aqui"
      />
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Concluído
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Falhou
          </Badge>
        );
      case 'running':
        return (
          <Badge variant="secondary">
            <Timer className="mr-1 h-3 w-3" />
            Executando
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="mr-1 h-3 w-3" />
            Pendente
          </Badge>
        );
    }
  };

  const getJobTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      mentions_collection: 'Coleta de Menções',
      seo_analysis: 'Análise SEO',
      geo_metrics: 'Métricas GEO',
      weekly_report: 'Relatório Semanal',
      alerts_check: 'Verificação de Alertas',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <Card key={job.id} className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold">{getJobTypeLabel(job.job_type)}</h3>
              {job.brands && (
                <p className="text-sm text-muted-foreground">{job.brands.name}</p>
              )}
            </div>
            {getStatusBadge(job.status)}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">Iniciado:</span>{' '}
              {formatDistanceToNow(new Date(job.started_at), {
                addSuffix: true,
                locale: ptBR,
              })}
            </div>

            {job.duration_ms && (
              <div>
                <span className="font-medium">Duração:</span>{' '}
                {(job.duration_ms / 1000).toFixed(2)}s
              </div>
            )}
          </div>

          {job.error && (
            <div className="mt-3 p-3 bg-destructive/10 text-destructive text-sm rounded-md">
              <span className="font-medium">Erro:</span> {job.error}
            </div>
          )}

          {job.result && Object.keys(job.result).length > 0 && (
            <div className="mt-3 p-3 bg-muted text-sm rounded-md">
              <span className="font-medium">Resultado:</span>
              <pre className="mt-1 text-xs">
                {JSON.stringify(job.result, null, 2)}
              </pre>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}