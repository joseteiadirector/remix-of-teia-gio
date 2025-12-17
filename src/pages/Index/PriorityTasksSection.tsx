import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const PriorityTasksSection = () => {
  return (
    <section className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="destructive">
            Ação Necessária
          </Badge>
          <h2 className="text-4xl font-bold mb-4">
            Tarefas Prioritárias
          </h2>
          <p className="text-lg text-muted-foreground">
            O que precisa ser feito agora para levar a plataforma de 80% para 96%
          </p>
        </div>

        {/* Tarefas Críticas */}
        <Card className="p-6 mb-6 border-2 border-red-500 bg-red-500/5">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <div>
              <h3 className="text-xl font-bold">🔴 CRÍTICO - Fazer HOJE</h3>
              <p className="text-sm text-muted-foreground">Tempo total: 20 minutos</p>
            </div>
          </div>

          <div className="space-y-4">
            <TaskCard
              number="1"
              title="Configurar Backup Automático do Banco de Dados"
              time="15 minutos"
              why="Sem isso, você pode perder TODOS os dados se algo der errado"
              how={[
                "Acesse: Lovable → Cloud → Database → Backups",
                "Ative: Daily backups",
                "Ative: Point-in-time recovery",
                "Salve as configurações"
              ]}
              priority="critical"
            />

            <TaskCard
              number="2"
              title="Conectar ao GitHub"
              time="5 minutos"
              why="Backup do código na nuvem. Se o Lovable tiver problema, seu código está seguro"
              how={[
                "Clique no botão 'GitHub' no canto superior direito",
                "Clique em 'Connect to GitHub'",
                "Autorize o Lovable GitHub App",
                "Clique em 'Create Repository'"
              ]}
              priority="critical"
            />
          </div>

          <div className="mt-6 p-4 bg-background rounded-lg border border-red-500/30">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="font-semibold">Depois disso: Plataforma fica 90% pronta ✅</span>
            </div>
          </div>
        </Card>

        {/* Tarefas Recomendadas */}
        <Card className="p-6 mb-6 border-2 border-yellow-500 bg-yellow-500/5">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-6 h-6 text-yellow-500" />
            <div>
              <h3 className="text-xl font-bold">🟡 RECOMENDADO - Fazer nas próximas 24h</h3>
              <p className="text-sm text-muted-foreground">Tempo total: 17 minutos</p>
            </div>
          </div>

          <div className="space-y-4">
            <TaskCard
              number="3"
              title="Habilitar Proteção contra Senhas Vazadas"
              time="2 minutos"
              why="Impede que usuários usem senhas que já foram roubadas em outros sites"
              how={[
                "Acesse: Cloud → Authentication → Settings",
                "Procure: 'Password Protection'",
                "Ative: 'Enable leaked password protection'",
                "Salve"
              ]}
              priority="recommended"
            />

            <TaskCard
              number="4"
              title="Configurar Sentry para Produção"
              time="5 minutos"
              why="Receber notificação quando algo der erro na produção"
              how={[
                "Vá para: sentry.io e pegue seu DSN",
                "Acesse: Cloud → Secrets",
                "Adicione: VITE_SENTRY_DSN com o valor do Sentry",
                "Pronto - erros serão monitorados automaticamente"
              ]}
              priority="recommended"
            />

            <TaskCard
              number="5"
              title="Restringir Acesso ao Cache de Queries"
              time="10 minutos"
              why="Aumenta segurança - só usuários logados veem o cache de IA"
              how={[
                "Acesse: Cloud → Database → Tables",
                "Selecione a tabela: llm_query_cache",
                "Vá em: Policies (RLS)",
                "Altere a policy de SELECT para: authenticated users only",
                "Salve"
              ]}
              priority="recommended"
            />
          </div>

          <div className="mt-6 p-4 bg-background rounded-lg border border-yellow-500/30">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="font-semibold">Depois disso: Plataforma fica 96% pronta ✅</span>
            </div>
          </div>
        </Card>

        {/* Call to Action */}
        <Card className="p-8 text-center bg-gradient-to-br from-primary/10 to-accent/10">
          <h3 className="text-2xl font-bold mb-3">
            Total: 37 minutos de trabalho
          </h3>
          <p className="text-lg text-muted-foreground mb-6">
            Com menos de <strong>40 minutos</strong>, sua plataforma estará <strong>96% pronta</strong> para produção
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" asChild>
              <a href="#" onClick={(e) => { e.preventDefault(); window.open('https://lovable.dev', '_blank'); }}>
                Acessar Lovable Cloud
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                Ir para GitHub
              </a>
            </Button>
          </div>
        </Card>

        {/* Resumo Visual */}
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <Card className="p-6 text-center">
            <div className="text-4xl font-bold text-primary mb-2">80%</div>
            <div className="text-sm text-muted-foreground">Agora</div>
          </Card>
          <Card className="p-6 text-center border-2 border-primary">
            <div className="text-4xl font-bold text-green-500 mb-2">90%</div>
            <div className="text-sm text-muted-foreground">Após tarefas críticas (20 min)</div>
          </Card>
          <Card className="p-6 text-center border-2 border-accent">
            <div className="text-4xl font-bold text-accent mb-2">96%</div>
            <div className="text-sm text-muted-foreground">Após recomendadas (37 min total)</div>
          </Card>
        </div>
      </div>
    </section>
  );
};

const TaskCard = ({ 
  number, 
  title, 
  time, 
  why, 
  how, 
  priority 
}: { 
  number: string; 
  title: string; 
  time: string; 
  why: string; 
  how: string[];
  priority: 'critical' | 'recommended';
}) => {
  const bgColor = priority === 'critical' 
    ? 'bg-red-500' 
    : 'bg-yellow-500';

  return (
    <div className="p-4 bg-background rounded-lg border">
      <div className="flex items-start gap-4 mb-3">
        <div className={`${bgColor} text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0`}>
          {number}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-bold">{title}</h4>
            <Badge variant="outline">{time}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            <strong>Por quê:</strong> {why}
          </p>
          <div className="text-sm">
            <strong className="text-foreground">Como fazer:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-muted-foreground">
              {how.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
