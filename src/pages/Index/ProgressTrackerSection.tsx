import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, Circle, ArrowRight, Database, 
  Github, Shield, BarChart3, Lock, Clock
} from "lucide-react";
import { useState } from "react";

export const ProgressTrackerSection = () => {
  const [completedTasks, setCompletedTasks] = useState<number[]>([]);
  
  const tasks = [
    {
      id: 1,
      icon: <Database className="w-6 h-6" />,
      title: "Configurar Backup Automático do Banco",
      time: "15 minutos",
      scoreImpact: 10,
      priority: "critical",
      status: completedTasks.includes(1) ? "completed" : "pending",
      steps: [
        "1. Clique no menu Cloud no topo da página",
        "2. Selecione 'Database' no menu lateral",
        "3. Clique na aba 'Backups'",
        "4. Ative 'Enable automatic backups'",
        "5. Selecione frequência: Daily (Diário)",
        "6. Ative 'Point-in-time recovery' (PITR)",
        "7. Clique em 'Save' ou 'Apply Changes'"
      ],
      verification: [
        "✓ Deve aparecer 'Backups: Enabled'",
        "✓ Deve mostrar próximo backup agendado",
        "✓ PITR deve estar 'Active'"
      ]
    },
    {
      id: 2,
      icon: <Github className="w-6 h-6" />,
      title: "Conectar ao GitHub",
      time: "5 minutos",
      scoreImpact: 5,
      priority: "critical",
      status: completedTasks.includes(2) ? "completed" : completedTasks.includes(1) ? "next" : "locked",
      steps: [
        "1. Clique no botão 'GitHub' no canto superior direito",
        "2. Selecione 'Connect to GitHub'",
        "3. Autorize o 'Lovable GitHub App' na janela que abrir",
        "4. Selecione sua conta/organização GitHub",
        "5. Clique em 'Create Repository'",
        "6. Aguarde a criação do repositório (30 segundos)"
      ],
      verification: [
        "✓ Ícone do GitHub deve ficar verde",
        "✓ Deve aparecer nome do repositório criado",
        "✓ Código será sincronizado automaticamente"
      ]
    },
    {
      id: 3,
      icon: <Shield className="w-6 h-6" />,
      title: "Proteção contra Senhas Vazadas",
      time: "2 minutos",
      scoreImpact: 2,
      priority: "recommended",
      status: completedTasks.includes(3) ? "completed" : completedTasks.includes(2) ? "next" : "locked",
      steps: [
        "1. Cloud → Authentication → Settings",
        "2. Procure 'Password Protection'",
        "3. Ative 'Enable leaked password protection'",
        "4. Clique em 'Save'"
      ],
      verification: [
        "✓ Toggle deve ficar verde/ativado",
        "✓ Mensagem de confirmação aparece"
      ]
    },
    {
      id: 4,
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Configurar Sentry DSN",
      time: "5 minutos",
      scoreImpact: 2,
      priority: "recommended",
      status: completedTasks.includes(4) ? "completed" : completedTasks.includes(3) ? "next" : "locked",
      steps: [
        "1. Vá para sentry.io e faça login (ou crie conta grátis)",
        "2. Crie um novo projeto ou use existente",
        "3. Copie o DSN (começa com https://...@sentry.io/...)",
        "4. Volte ao Lovable → Cloud → Secrets",
        "5. Procure VITE_SENTRY_DSN",
        "6. Cole o DSN copiado",
        "7. Clique em 'Update'"
      ],
      verification: [
        "✓ Secret VITE_SENTRY_DSN deve mostrar 'Updated'",
        "✓ No Sentry, deve aparecer 'Waiting for events'"
      ]
    },
    {
      id: 5,
      icon: <Lock className="w-6 h-6" />,
      title: "Restringir Cache de Queries",
      time: "10 minutos",
      scoreImpact: 1,
      priority: "recommended",
      status: completedTasks.includes(5) ? "completed" : completedTasks.includes(4) ? "next" : "locked",
      steps: [
        "1. Cloud → Database → Tables",
        "2. Procure e selecione 'llm_query_cache'",
        "3. Clique na aba 'Policies' (RLS)",
        "4. Encontre a policy 'Anyone can read cache'",
        "5. Clique em 'Edit'",
        "6. Altere 'anon' para 'authenticated'",
        "7. Salve as alterações"
      ],
      verification: [
        "✓ Policy deve mostrar 'authenticated' users",
        "✓ RLS deve continuar 'Enabled'"
      ]
    }
  ];

  const totalScore = 80;
  const maxScore = 100;
  const currentScore = totalScore + completedTasks.reduce((sum, taskId) => {
    const task = tasks.find(t => t.id === taskId);
    return sum + (task?.scoreImpact || 0);
  }, 0);

  const nextTask = tasks.find(t => !completedTasks.includes(t.id));
  const criticalCompleted = completedTasks.filter(id => id <= 2).length;
  const recommendedCompleted = completedTasks.filter(id => id > 2).length;

  const toggleTask = (taskId: number) => {
    if (completedTasks.includes(taskId)) {
      setCompletedTasks(completedTasks.filter(id => id !== taskId));
    } else {
      setCompletedTasks([...completedTasks, taskId]);
    }
  };

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background via-primary/5 to-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="default">
            <Clock className="w-4 h-4 mr-2" />
            Tracker de Progresso
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Acompanhe seu Progresso
          </h2>
          <p className="text-xl text-muted-foreground">
            Marque cada tarefa como concluída e veja o score subir em tempo real
          </p>
        </div>

        {/* Score Atual */}
        <Card className="p-8 mb-8 bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/30">
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <div className="text-6xl font-bold text-primary mb-2">{currentScore}%</div>
              <div className="text-sm text-muted-foreground">Score Atual</div>
            </div>
            <div className="text-center">
              <div className="text-6xl font-bold text-muted-foreground mb-2">
                {maxScore - currentScore}%
              </div>
              <div className="text-sm text-muted-foreground">Faltam</div>
            </div>
            <div className="text-center">
              <div className="text-6xl font-bold text-accent mb-2">
                {completedTasks.length}/{tasks.length}
              </div>
              <div className="text-sm text-muted-foreground">Tarefas Completas</div>
            </div>
          </div>
          
          <Progress value={currentScore} className="h-4 mb-4" />
          
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between p-3 bg-background rounded-lg">
              <span>🔴 Críticas ({criticalCompleted}/2)</span>
              <Badge variant={criticalCompleted === 2 ? "default" : "outline"}>
                {criticalCompleted === 2 ? "✅ Completo" : `${criticalCompleted}/2`}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-background rounded-lg">
              <span>🟡 Recomendadas ({recommendedCompleted}/3)</span>
              <Badge variant={recommendedCompleted === 3 ? "default" : "outline"}>
                {recommendedCompleted === 3 ? "✅ Completo" : `${recommendedCompleted}/3`}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Próxima Tarefa em Destaque */}
        {nextTask && (
          <Card className="p-8 mb-8 border-2 border-primary bg-gradient-to-br from-primary/5 to-accent/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-primary/10 text-primary">
                {nextTask.icon}
              </div>
              <div className="flex-1">
                <Badge className="mb-2" variant={nextTask.priority === 'critical' ? 'destructive' : 'default'}>
                  {nextTask.priority === 'critical' ? '🔴 PRÓXIMA - CRÍTICA' : '🟡 PRÓXIMA - RECOMENDADA'}
                </Badge>
                <h3 className="text-2xl font-bold">{nextTask.title}</h3>
                <p className="text-muted-foreground">
                  Tempo estimado: {nextTask.time} • +{nextTask.scoreImpact}% no score
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <ArrowRight className="w-5 h-5 text-primary" />
                  Passo a Passo:
                </h4>
                <ol className="space-y-2">
                  {nextTask.steps.map((step, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="font-bold text-primary">{step.split('.')[0]}.</span>
                      <span>{step.split('.').slice(1).join('.')}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Como Verificar:
                </h4>
                <ul className="space-y-2">
                  {nextTask.verification.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Button 
              size="lg" 
              className="w-full"
              onClick={() => toggleTask(nextTask.id)}
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Marcar como Concluída
            </Button>
          </Card>
        )}

        {/* Lista de Todas as Tarefas */}
        <div className="space-y-4">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isCompleted={completedTasks.includes(task.id)}
              onToggle={() => toggleTask(task.id)}
            />
          ))}
        </div>

        {/* Conclusão */}
        {completedTasks.length === tasks.length && (
          <Card className="p-8 mt-8 bg-gradient-to-br from-green-500/10 to-primary/10 border-2 border-green-500/50">
            <div className="text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-3xl font-bold mb-4">
                🎉 Parabéns! Todas as Tarefas Concluídas!
              </h3>
              <p className="text-xl text-muted-foreground mb-6">
                Sua plataforma agora está em <strong className="text-primary">{currentScore}%</strong> de prontidão!
              </p>
              <Badge className="text-lg px-6 py-2">
                ✅ Pronto para Produção
              </Badge>
            </div>
          </Card>
        )}
      </div>
    </section>
  );
};

const TaskCard = ({ 
  task, 
  isCompleted, 
  onToggle 
}: { 
  task: any; 
  isCompleted: boolean; 
  onToggle: () => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const statusColors = {
    completed: 'border-green-500 bg-green-500/5',
    next: 'border-primary bg-primary/5',
    pending: 'border-muted-foreground/20 bg-muted/20',
    locked: 'border-muted-foreground/10 bg-muted/10 opacity-60'
  };

  return (
    <Card className={`p-6 transition-all ${statusColors[task.status as keyof typeof statusColors]}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {isCompleted ? (
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          ) : task.status === 'locked' ? (
            <Circle className="w-8 h-8 text-muted-foreground" />
          ) : (
            <Circle className="w-8 h-8 text-primary" />
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="text-lg font-bold mb-1">{task.title}</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{task.time}</Badge>
                <Badge variant="outline">+{task.scoreImpact}%</Badge>
                {task.priority === 'critical' && (
                  <Badge variant="destructive">Crítica</Badge>
                )}
              </div>
            </div>
          </div>

          {isExpanded && (
            <div className="mt-4 space-y-4">
              <div>
                <h5 className="font-semibold mb-2">📋 Passos:</h5>
                <ol className="space-y-1 text-sm text-muted-foreground">
                  {task.steps.map((step: string, i: number) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
              <div>
                <h5 className="font-semibold mb-2">✓ Verificação:</h5>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {task.verification.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Ocultar Detalhes' : 'Ver Detalhes'}
            </Button>
            {!isCompleted && task.status !== 'locked' && (
              <Button
                size="sm"
                onClick={onToggle}
              >
                Marcar como Concluída
              </Button>
            )}
            {isCompleted && (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggle}
              >
                Desmarcar
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
