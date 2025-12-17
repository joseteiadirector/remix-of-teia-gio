import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Circle, Copy, ExternalLink, AlertCircle, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface WizardStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

export function GoogleSetupWizard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [serviceAccountEmail, setServiceAccountEmail] = useState("");
  const [propertyId, setPropertyId] = useState("");
  
  const [steps, setSteps] = useState<WizardStep[]>([
    { id: 1, title: "Criar Service Account", description: "Google Cloud Console", completed: false },
    { id: 2, title: "Baixar Credenciais JSON", description: "Arquivo de configuração", completed: false },
    { id: 3, title: "Configurar Google Search Console", description: "Adicionar permissões", completed: false },
    { id: 4, title: "Configurar Google Analytics 4", description: "Adicionar acesso", completed: false },
    { id: 5, title: "Configurar Secrets", description: "Lovable Cloud", completed: false },
  ]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `${label} copiado para área de transferência`,
    });
  };

  const markStepComplete = (stepId: number) => {
    setSteps(steps.map(s => s.id === stepId ? { ...s, completed: true } : s));
    if (stepId < 5) setCurrentStep(stepId + 1);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate('/seo-scores')}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para SEO Escore
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Guia de Configuração: Google Search Console & Analytics</CardTitle>
          <CardDescription>
            Siga este guia passo-a-passo para conectar seus dados do Google
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center flex-1">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 mb-2 ${
                    step.completed 
                      ? "bg-primary border-primary text-primary-foreground" 
                      : currentStep === step.id
                      ? "border-primary text-primary"
                      : "border-muted text-muted-foreground"
                  }`}>
                    {step.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                  </div>
                  <p className="text-xs text-center font-medium">{step.title}</p>
                  {index < steps.length - 1 && (
                    <div className={`hidden md:block w-full h-0.5 mt-5 -mx-12 ${
                      step.completed ? "bg-primary" : "bg-muted"
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Create Service Account */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Importante:</strong> Use o mesmo projeto do Google que contém seu Google Search Console e Analytics
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Passo 1: Criar Service Account</h3>
                
                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <p className="text-sm">1. Acesse o Google Cloud Console:</p>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => window.open("https://console.cloud.google.com/iam-admin/serviceaccounts", "_blank")}
                  >
                    Abrir Google Cloud Console
                    <ExternalLink className="w-4 h-4" />
                  </Button>

                  <p className="text-sm">2. Clique em <strong>"CREATE SERVICE ACCOUNT"</strong></p>
                  
                  <p className="text-sm">3. Preencha:</p>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• <strong>Nome:</strong> lovable-gsc-connector</li>
                    <li>• <strong>Role:</strong> Viewer</li>
                  </ul>

                  <p className="text-sm">4. Após criar, copie o email gerado (formato: nome@projeto.iam.gserviceaccount.com)</p>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Cole o email da Service Account aqui:</Label>
                    <div className="flex gap-2">
                      <Input
                        id="email"
                        placeholder="exemplo@projeto.iam.gserviceaccount.com"
                        value={serviceAccountEmail}
                        onChange={(e) => setServiceAccountEmail(e.target.value)}
                      />
                      <Button
                        disabled={!serviceAccountEmail.includes("@") || !serviceAccountEmail.includes("iam.gserviceaccount.com")}
                        onClick={() => markStepComplete(1)}
                      >
                        Próximo
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Download JSON */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Passo 2: Baixar Credenciais JSON</h3>
              
              <Alert>
                <AlertDescription>
                  <strong>Email da Service Account:</strong> {serviceAccountEmail}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2"
                    onClick={() => copyToClipboard(serviceAccountEmail, "Email")}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </AlertDescription>
              </Alert>

              <div className="bg-muted p-4 rounded-lg space-y-3">
                <p className="text-sm">1. No Google Cloud Console, clique na Service Account que você criou</p>
                <p className="text-sm">2. Vá em <strong>"KEYS"</strong> → <strong>"ADD KEY"</strong> → <strong>"Create new key"</strong></p>
                <p className="text-sm">3. Escolha formato <strong>JSON</strong></p>
                <p className="text-sm">4. O arquivo será baixado automaticamente</p>
                <p className="text-sm text-muted-foreground">⚠️ Guarde este arquivo em local seguro - você vai precisar dele no passo 5</p>
                
                <Button onClick={() => markStepComplete(2)} className="w-full">
                  Credenciais Baixadas - Próximo
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Configure GSC */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Passo 3: Configurar Google Search Console</h3>
              
              <Alert>
                <AlertDescription>
                  <strong>Email para adicionar:</strong> {serviceAccountEmail}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2"
                    onClick={() => copyToClipboard(serviceAccountEmail, "Email")}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </AlertDescription>
              </Alert>

              <div className="bg-muted p-4 rounded-lg space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => window.open("https://search.google.com/search-console", "_blank")}
                >
                  Abrir Google Search Console
                  <ExternalLink className="w-4 h-4" />
                </Button>

                <p className="text-sm">1. Escolha sua propriedade</p>
                <p className="text-sm">2. Vá em <strong>Settings → Users and permissions</strong></p>
                <p className="text-sm">3. Clique em <strong>"ADD USER"</strong></p>
                <p className="text-sm">4. Cole o email: <code className="bg-background px-1">{serviceAccountEmail}</code></p>
                <p className="text-sm">5. Selecione permissão: <strong>Full</strong> ou <strong>Owner</strong></p>
                <p className="text-sm">6. Clique em <strong>"ADD"</strong></p>
                
                <Button onClick={() => markStepComplete(3)} className="w-full">
                  Usuário Adicionado no GSC - Próximo
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Configure GA4 */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Passo 4: Configurar Google Analytics 4</h3>
              
              <Alert>
                <AlertDescription>
                  <strong>Email para adicionar:</strong> {serviceAccountEmail}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2"
                    onClick={() => copyToClipboard(serviceAccountEmail, "Email")}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </AlertDescription>
              </Alert>

              <div className="bg-muted p-4 rounded-lg space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => window.open("https://analytics.google.com/", "_blank")}
                >
                  Abrir Google Analytics
                  <ExternalLink className="w-4 h-4" />
                </Button>

                <Alert className="bg-yellow-500/10 border-yellow-500/30">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-sm">
                    <strong>Importante:</strong> A Service Account precisa ter permissão <strong>Viewer</strong> ou superior. 
                    Sem essa permissão, você verá erro 403 ao tentar sincronizar dados.
                  </AlertDescription>
                </Alert>

                <p className="text-sm font-semibold">Passos para adicionar a Service Account:</p>
                <p className="text-sm">1. Clique em <strong>Admin</strong> (⚙️ canto inferior esquerdo)</p>
                <p className="text-sm">2. Na coluna <strong>Property</strong>, clique em <strong>Property Access Management</strong></p>
                <p className="text-sm">3. Clique no botão azul <strong>"+"</strong> no canto superior direito</p>
                <p className="text-sm">4. Selecione <strong>"Add users"</strong></p>
                <p className="text-sm">5. Cole o email da Service Account:</p>
                <div className="ml-4 p-2 bg-background rounded border">
                  <code className="text-xs break-all">{serviceAccountEmail}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(serviceAccountEmail, "Email")}
                    className="ml-2"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-sm">6. Marque a role: <strong>Viewer</strong> (ou Administrator se preferir acesso completo)</p>
                <p className="text-sm">7. Clique em <strong>"Add"</strong></p>
                <p className="text-sm">8. Volte para <strong>Property Settings</strong> e copie o <strong>Property ID</strong></p>
                
                <div className="space-y-2 mt-4">
                  <Label htmlFor="propertyId">Cole o Property ID aqui:</Label>
                  <div className="flex gap-2">
                    <Input
                      id="propertyId"
                      placeholder="Ex: 123456789"
                      value={propertyId}
                      onChange={(e) => setPropertyId(e.target.value)}
                    />
                    <Button
                      disabled={!propertyId || isNaN(Number(propertyId))}
                      onClick={() => markStepComplete(4)}
                    >
                      Próximo
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Configure Secrets */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Passo 5: Configurar Secrets no Lovable</h3>
              
              <div className="bg-muted p-4 rounded-lg space-y-4">
                <Alert>
                  <AlertDescription>
                    <strong>Property ID:</strong> {propertyId}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2"
                      onClick={() => copyToClipboard(propertyId, "Property ID")}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <p className="text-sm font-semibold">1. Configure o GA4_PROPERTY_ID:</p>
                  <p className="text-sm">• Abra o Backend (Lovable Cloud)</p>
                  <p className="text-sm">• Vá em Secrets</p>
                  <p className="text-sm">• Encontre <strong>GA4_PROPERTY_ID</strong></p>
                  <p className="text-sm">• Cole o valor: <code className="bg-background px-1">{propertyId}</code></p>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold">2. Configure o GSC_CREDENTIALS_JSON:</p>
                  <p className="text-sm">• Abra o arquivo JSON que você baixou no Passo 2</p>
                  <p className="text-sm">• Copie TODO o conteúdo do arquivo</p>
                  <p className="text-sm">• No Lovable Cloud → Secrets</p>
                  <p className="text-sm">• Encontre <strong>GSC_CREDENTIALS_JSON</strong></p>
                  <p className="text-sm">• Cole o conteúdo completo do JSON</p>
                </div>

                <Button onClick={() => markStepComplete(5)} className="w-full">
                  Configuração Concluída! ✅
                </Button>
              </div>
            </div>
          )}

          {/* Completion */}
          {steps.every(s => s.completed) && (
            <Alert className="bg-primary/10 border-primary">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <AlertDescription>
                <strong>Parabéns!</strong> Configuração concluída. Agora você pode importar dados reais do Google Search Console e Google Analytics 4.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
