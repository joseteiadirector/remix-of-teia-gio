import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { preloadCriticalRoutes } from '@/utils/routePreloader';
import { logger } from '@/utils/logger';
import { CACHE_DURATIONS } from '@/config/cache';

interface SubscriptionData {
  subscribed: boolean;
  product_id: string | null;
  subscription_end: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  subscription: SubscriptionData | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
  checkSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);
  const [lastSubscriptionCheck, setLastSubscriptionCheck] = useState<number>(0);
  const { toast } = useToast();

  const checkSubscription = async (force = false) => {
    // Evitar chamadas redundantes com cache inteligente
    const now = Date.now();
    const cacheValid = now - lastSubscriptionCheck < CACHE_DURATIONS.SUBSCRIPTION_CHECK;
    
    if (!force && (isCheckingSubscription || cacheValid)) {
      logger.debug('Subscription check ignorado', { cacheValid, isCheckingSubscription });
      return;
    }

    setIsCheckingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      setSubscription(data);
      setLastSubscriptionCheck(Date.now());
      logger.info('Subscription atualizada', { subscribed: data?.subscribed, productId: data?.product_id });
    } catch (error) {
      logger.error('Erro ao verificar subscription', { error });
      setSubscription({ subscribed: false, product_id: null, subscription_end: null });
    } finally {
      setIsCheckingSubscription(false);
    }
  };

  useEffect(() => {
    let sessionChecked = false;
    let mounted = true;

    // Timeout de segurança - se não conseguir carregar auth em 10s, continua sem usuário
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        logger.warn('Auth timeout - continuando sem sessão');
        setLoading(false);
      }
    }, 10000);

    // Set up auth state listener FIRST
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        clearTimeout(safetyTimeout);
        
        // Check subscription only on SIGN_IN event (não em outros eventos)
        if (session?.user && event === 'SIGNED_IN' && !sessionChecked) {
          checkSubscription();
          // Preload rotas críticas após login bem-sucedido
          preloadCriticalRoutes();
        } else if (!session?.user) {
          setSubscription(null);
          setLastSubscriptionCheck(0);
        }
      }
    );

    // THEN check for existing session (apenas uma vez na inicialização)
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        sessionChecked = true;
        clearTimeout(safetyTimeout);
        
        if (session?.user) {
          checkSubscription();
        }
      })
      .catch((error) => {
        logger.error('Erro ao obter sessão', { error });
        if (mounted) {
          setLoading(false);
          clearTimeout(safetyTimeout);
        }
      });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      authSubscription.unsubscribe();
    };
  }, []);

  // Função para tocar som de login da Teia
  const playLoginSound = () => {
    try {
      const audio = new Audio('/sounds/teia-login.mp3');
      audio.volume = 0.5;
      audio.play().catch(err => logger.warn('Não foi possível tocar som de login', { error: err }));
    } catch (err) {
      logger.warn('Erro ao criar áudio de login', { error: err });
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.error('Falha no login', { error: error.message });
      toast({
        title: "Erro ao fazer login",
        description: error.message === 'Invalid login credentials' 
          ? 'Email ou senha incorretos'
          : error.message,
        variant: "destructive",
      });
    } else {
      // Tocar som de login da Teia
      playLoginSound();
    }

    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/dashboard`;

    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });

    if (error) {
      logger.error('Falha no registro', { error: error.message });
      toast({
        title: "Erro ao criar conta",
        description: error.message === 'User already registered'
          ? 'Este email já está cadastrado'
          : error.message,
        variant: "destructive",
      });
    } else {
      // Send welcome email in background
      if (data.user) {
        supabase.functions.invoke('send-welcome-email', {
          body: { 
            userEmail: email,
            userName: data.user.user_metadata?.name 
          }
        }).catch(err => logger.warn('Email de boas-vindas falhou', { error: err }));
      }
      
      toast({
        title: "Conta criada!",
        description: "Você já pode fazer login. Confira seu email!",
      });
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso",
    });
  };

  return (
    <AuthContext.Provider value={{ user, session, subscription, signIn, signUp, signOut, loading, checkSubscription }}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Inicializando...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    // Retornar fallback silenciosamente durante inicialização
    return {
      user: null,
      session: null,
      subscription: null,
      signIn: async () => ({ error: new Error('Auth não inicializado') }),
      signUp: async () => ({ error: new Error('Auth não inicializado') }),
      signOut: async () => {},
      loading: true,
      checkSubscription: async () => {},
    } as AuthContextType;
  }
  return context;
}