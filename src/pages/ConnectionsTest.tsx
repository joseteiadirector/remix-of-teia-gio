import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Zap,
  Bot,
  Sparkles,
  Brain,
  Search
} from "lucide-react";

interface ConnectionResult {
  status: 'success' | 'error' | 'not_configured' | 'configured' | 'unknown';
  message: string;
}

interface ConnectionResults {
  openai: ConnectionResult;
  google: ConnectionResult;
  claude: ConnectionResult;
  perplexity: ConnectionResult;
  gsc: ConnectionResult;
  ga4: ConnectionResult;
}

const providerConfig = {
  openai: {
    name: "OpenAI (GPT)",
    icon: Bot,
    description: "ChatGPT API para geração de respostas",
    color: "text-emerald-500"
  },
  google: {
    name: "Google (Gemini)",
    icon: Sparkles,
    description: "Gemini API via Lovable AI Gateway",
    color: "text-blue-500"
  },
  claude: {
    name: "Anthropic (Claude)",
    icon: Brain,
    description: "Claude API para análise avançada",
    color: "text-orange-500"
  },
  perplexity: {
    name: "Perplexity",
    icon: Search,
    description: "Perplexity API para busca em tempo real",
    color: "text-purple-500"
  }
};

export default function ConnectionsTest() {
  const [results, setResults] = useState<ConnectionResults | null>(null);
  const [loading, setLoading] = useState(false);

  const testConnections = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-connections');
      
      if (error) {
        toast.error("Erro ao testar conexões: " + error.message);
        return;
      }

      setResults(data);
      
      const successCount = Object.values(data).filter(
        (r: ConnectionResult) => r.status === 'success' || r.status === 'configured'
      ).length;
      
      if (successCount === 6) {
        toast.success("✅ Todas as APIs estão funcionando!");
      } else if (successCount > 0) {
        toast.info(`${successCount}/6 conexões ativas`);
      } else {
        toast.error("Nenhuma API está conectada");
      }
    } catch (err) {
      toast.error("Erro ao executar teste");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (result: ConnectionResult) => {
    switch (result.status) {
      case 'success':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Conectado
          </Badge>
        );
      case 'configured':
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Configurado
          </Badge>
        );
      case 'not_configured':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <AlertCircle className="w-3 h-3 mr-1" />
            Não Configurado
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            Erro
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <AlertCircle className="w-3 h-3 mr-1" />
            Desconhecido
          </Badge>
        );
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Teste de Conexões LLM
          </h1>
          <p className="text-muted-foreground mt-1">
            Verifique o status das APIs que alimentam o Nucleus Chat
          </p>
        </div>
        <Button 
          onClick={testConnections} 
          disabled={loading}
          size="lg"
          className="gap-2"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
          {loading ? "Testando..." : "Testar Conexões"}
        </Button>
      </div>

      {/* LLM Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(providerConfig).map(([key, config]) => {
          const result = results?.[key as keyof typeof providerConfig];
          const Icon = config.icon;
          
          return (
            <Card key={key} className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-muted ${config.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{config.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {config.description}
                      </CardDescription>
                    </div>
                  </div>
                  {result && getStatusBadge(result)}
                </div>
              </CardHeader>
              {result && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">
                    {result.message}
                  </p>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Google Services */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Serviços Google (SEO)</CardTitle>
          <CardDescription>
            Google Search Console e Google Analytics para métricas SEO
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium">Google Search Console</p>
              <p className="text-xs text-muted-foreground">
                {results?.gsc?.message || "Clique em testar para verificar"}
              </p>
            </div>
            {results?.gsc && getStatusBadge(results.gsc)}
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium">Google Analytics 4</p>
              <p className="text-xs text-muted-foreground">
                {results?.ga4?.message || "Clique em testar para verificar"}
              </p>
            </div>
            {results?.ga4 && getStatusBadge(results.ga4)}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-foreground">
                Sobre as APIs do Nucleus
              </p>
              <p className="text-sm text-muted-foreground">
                O Nucleus Chat consulta múltiplos LLMs (GPT, Gemini, Claude, Perplexity) 
                simultaneamente para fornecer análises abrangentes sobre a presença 
                da sua marca nas IAs generativas. Cada API precisa estar configurada 
                corretamente para funcionamento completo.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
