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
  Search,
  Globe,
  Info
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
    color: "green",
    iconColor: "text-green-500",
    borderColor: "border-green-500/30",
    bgColor: "from-green-500/10",
    glowColor: "rgba(34,197,94,0.2)"
  },
  google: {
    name: "Google (Gemini)",
    icon: Sparkles,
    description: "Gemini API via Lovable AI Gateway",
    color: "blue",
    iconColor: "text-blue-500",
    borderColor: "border-blue-500/30",
    bgColor: "from-blue-500/10",
    glowColor: "rgba(59,130,246,0.2)"
  },
  claude: {
    name: "Anthropic (Claude)",
    icon: Brain,
    description: "Claude API para análise avançada",
    color: "orange",
    iconColor: "text-orange-500",
    borderColor: "border-orange-500/30",
    bgColor: "from-orange-500/10",
    glowColor: "rgba(249,115,22,0.2)"
  },
  perplexity: {
    name: "Perplexity",
    icon: Search,
    description: "Perplexity API para busca em tempo real",
    color: "purple",
    iconColor: "text-purple-500",
    borderColor: "border-purple-500/30",
    bgColor: "from-purple-500/10",
    glowColor: "rgba(168,85,247,0.2)"
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
        toast.success("Todas as APIs estão funcionando!");
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
          <Badge className="bg-green-500/20 text-green-500 border-green-500/30 shadow-lg shadow-green-500/10">
            <CheckCircle className="w-3 h-3 mr-1" />
            Conectado
          </Badge>
        );
      case 'configured':
        return (
          <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30 shadow-lg shadow-blue-500/10">
            <CheckCircle className="w-3 h-3 mr-1" />
            Configurado
          </Badge>
        );
      case 'not_configured':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 shadow-lg shadow-yellow-500/10">
            <AlertCircle className="w-3 h-3 mr-1" />
            Não Configurado
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-red-500/20 text-red-500 border-red-500/30 shadow-lg shadow-red-500/10">
            <XCircle className="w-3 h-3 mr-1" />
            Erro
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-muted-foreground/30">
            <AlertCircle className="w-3 h-3 mr-1" />
            Desconhecido
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-green-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="container mx-auto p-6 space-y-6">
        {/* Premium Header */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-background/80 via-primary/5 to-background/80 backdrop-blur-xl p-8 shadow-2xl transition-all duration-500 hover:shadow-primary/20 hover:border-primary/40 group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30">
                <Zap className="h-8 w-8 text-primary drop-shadow-[0_0_12px_rgba(139,92,246,0.5)]" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">
                  <span className="bg-gradient-to-r from-primary via-purple-400 to-primary bg-[length:200%_auto] animate-[gradient_3s_linear_infinite] bg-clip-text text-transparent">
                    Teste de Conexões LLM
                  </span>
                </h1>
                <p className="text-muted-foreground mt-1">
                  Verifique o status das APIs que alimentam o Nucleus Chat
                </p>
              </div>
            </div>
            <Button 
              onClick={testConnections} 
              disabled={loading}
              size="lg"
              className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              {loading ? "Testando..." : "Testar Conexões"}
            </Button>
          </div>
        </div>

        {/* LLM Providers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(providerConfig).map(([key, config], index) => {
            const result = results?.[key as keyof typeof providerConfig];
            const Icon = config.icon;
            
            return (
              <Card 
                key={key} 
                className={`relative overflow-hidden ${config.borderColor} bg-gradient-to-br ${config.bgColor} via-background to-background backdrop-blur-xl hover:shadow-lg transition-all duration-500 group animate-fadeIn`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div 
                  className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" 
                  style={{ backgroundColor: config.glowColor }}
                />
                
                <CardHeader className="relative z-10 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${config.bgColor} border ${config.borderColor}`}>
                        <Icon className={`w-5 h-5 ${config.iconColor} drop-shadow-[0_0_6px_currentColor]`} />
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
                  <CardContent className="relative z-10 pt-0">
                    <p className="text-sm text-muted-foreground">
                      {result.message}
                    </p>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* Google Services - Premium */}
        <Card className="relative overflow-hidden border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-background to-background backdrop-blur-xl hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-500 group">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <CardHeader className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border border-cyan-500/30">
                <Globe className="w-5 h-5 text-cyan-500 drop-shadow-[0_0_6px_rgba(6,182,212,0.5)]" />
              </div>
              <div>
                <CardTitle className="text-lg">Serviços Google (SEO)</CardTitle>
                <CardDescription>
                  Google Search Console e Google Analytics para métricas SEO
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-background/50 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all duration-300">
              <div>
                <p className="font-medium">Google Search Console</p>
                <p className="text-xs text-muted-foreground">
                  {results?.gsc?.message || "Clique em testar para verificar"}
                </p>
              </div>
              {results?.gsc && getStatusBadge(results.gsc)}
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-background/50 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all duration-300">
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

        {/* Info Card - Premium */}
        <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background backdrop-blur-xl hover:shadow-lg hover:shadow-primary/20 transition-all duration-500 group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <CardContent className="relative z-10 pt-6">
            <div className="flex gap-4">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 h-fit">
                <Info className="w-5 h-5 text-primary drop-shadow-[0_0_6px_rgba(139,92,246,0.5)]" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">
                  Sobre as APIs do Nucleus
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
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
    </div>
  );
}
