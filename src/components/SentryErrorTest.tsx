import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { captureError, captureMessage } from "@/lib/sentry";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle, Bug } from "lucide-react";

/**
 * Componente de teste para verificar se o Sentry está capturando erros
 * APENAS para testes - remover em produção
 */
export const SentryErrorTest = () => {
  const { toast } = useToast();

  const testError = () => {
    try {
      // Simular erro
      throw new Error("Teste de erro do Sentry - Ignore este erro!");
    } catch (error) {
      captureError(error as Error, {
        testType: "manual-error-test",
        timestamp: new Date().toISOString(),
      });
      
      toast({
        title: "Erro enviado para o Sentry!",
        description: "Verifique o dashboard do Sentry em alguns segundos.",
        variant: "default",
      });
    }
  };

  const testMessage = () => {
    captureMessage("Mensagem de teste do Sentry", "info");
    
    toast({
      title: "Mensagem enviada!",
      description: "Mensagem de teste enviada para o Sentry.",
      variant: "default",
    });
  };

  const testCriticalError = () => {
    try {
      // Simular erro crítico
      throw new Error("ERRO CRÍTICO DE TESTE - Pode ignorar!");
    } catch (error) {
      captureError(error as Error, {
        severity: "critical",
        testType: "critical-error-test",
        timestamp: new Date().toISOString(),
      });
      
      toast({
        title: "Erro crítico enviado!",
        description: "Verifique alertas no Sentry.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Teste de Monitoramento Sentry
        </CardTitle>
        <CardDescription>
          Use os botões abaixo para testar se o Sentry está capturando erros corretamente.
          Os erros aparecerão no dashboard do Sentry em alguns segundos.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="bg-muted p-4 rounded-lg space-y-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Como verificar:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Clique em um dos botões de teste abaixo</li>
                <li>Aguarde 10-30 segundos</li>
                <li>Acesse seu dashboard do Sentry</li>
                <li>Verifique a aba "Issues" para ver o erro capturado</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          <Button 
            onClick={testError}
            variant="outline"
            className="w-full justify-start"
          >
            <AlertCircle className="mr-2 h-4 w-4" />
            Testar Erro Normal
          </Button>

          <Button 
            onClick={testMessage}
            variant="outline"
            className="w-full justify-start"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Testar Mensagem de Info
          </Button>

          <Button 
            onClick={testCriticalError}
            variant="destructive"
            className="w-full justify-start"
          >
            <AlertCircle className="mr-2 h-4 w-4" />
            Testar Erro Crítico
          </Button>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
          <p className="text-sm text-amber-600 dark:text-amber-500">
            ⚠️ <strong>Importante:</strong> Este componente é apenas para testes. 
            Remova-o antes de publicar em produção!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
