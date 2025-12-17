import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogIn, UserPlus, Loader2, Check, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const validatePassword = (password: string) => {
  const requirements = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  
  const isValid = Object.values(requirements).every(Boolean);
  return { requirements, isValid };
};

export const LoginCard = () => {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ email: "", password: "", confirmPassword: "" });
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  
  const passwordValidation = validatePassword(signupData.password);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(loginData.email, loginData.password);

    setLoading(false);

    if (!error) {
      navigate('/dashboard');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (signupData.password !== signupData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (!passwordValidation.isValid) {
      toast({
        title: "Senha fraca",
        description: "A senha não atende todos os requisitos de segurança",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await signUp(signupData.email, signupData.password);

    setLoading(false);

    if (!error) {
      toast({
        title: "Conta criada!",
        description: "Sua conta foi criada com sucesso",
      });
      navigate('/dashboard');
    }
  };

  return (
    <Card className="w-full p-6 lg:p-8 shadow-xl border-2">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2">Acesse a Plataforma</h3>
        <p className="text-sm text-muted-foreground">
          Comece a otimizar sua presença em IAs generativas
        </p>
      </div>

      <Tabs defaultValue="signup" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signup">Criar Conta</TabsTrigger>
          <TabsTrigger value="login">Login</TabsTrigger>
        </TabsList>

        <TabsContent value="signup">
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="seu@email.com"
                value={signupData.email}
                onChange={(e) =>
                  setSignupData({ ...signupData, email: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Senha</Label>
              <Input
                id="signup-password"
                type="password"
                placeholder="••••••••"
                value={signupData.password}
                onChange={(e) =>
                  setSignupData({ ...signupData, password: e.target.value })
                }
                onFocus={() => setShowPasswordRequirements(true)}
                required
              />
              
              {showPasswordRequirements && signupData.password && (
                <div className="mt-3 p-3 bg-muted rounded-md space-y-2 text-sm">
                  <p className="font-medium mb-2">Requisitos da senha:</p>
                  <div className="space-y-1">
                    <div className={`flex items-center gap-2 ${passwordValidation.requirements.minLength ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {passwordValidation.requirements.minLength ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      <span>Mínimo 8 caracteres</span>
                    </div>
                    <div className={`flex items-center gap-2 ${passwordValidation.requirements.hasUpperCase ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {passwordValidation.requirements.hasUpperCase ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      <span>Pelo menos 1 letra maiúscula</span>
                    </div>
                    <div className={`flex items-center gap-2 ${passwordValidation.requirements.hasNumber ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {passwordValidation.requirements.hasNumber ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      <span>Pelo menos 1 número</span>
                    </div>
                    <div className={`flex items-center gap-2 ${passwordValidation.requirements.hasSpecialChar ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {passwordValidation.requirements.hasSpecialChar ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      <span>Pelo menos 1 caractere especial (!@#$%...)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Senha</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={signupData.confirmPassword}
                onChange={(e) =>
                  setSignupData({ ...signupData, confirmPassword: e.target.value })
                }
                required
              />
              {signupData.confirmPassword && signupData.password !== signupData.confirmPassword && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <X className="h-4 w-4" />
                  As senhas não coincidem
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Criar Conta Grátis
                </>
              )}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="login">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="seu@email.com"
                value={loginData.email}
                onChange={(e) =>
                  setLoginData({ ...loginData, email: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Senha</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={loginData.password}
                onChange={(e) =>
                  setLoginData({ ...loginData, password: e.target.value })
                }
                required
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Entrar
                </>
              )}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </Card>
  );
};
