import { supabase } from "@/integrations/supabase/client";
import { logger } from "./logger";

export const testConnections = async () => {
  try {
    logger.info('Testando conexões API');
    
    const { data, error } = await supabase.functions.invoke('test-connections');
    
    if (error) {
      logger.error('Erro ao testar conexões', { error });
      throw error;
    }
    
    logger.debug('Resultados dos testes de conexão', { data });
    
    return data;
  } catch (error) {
    logger.error('Falha ao testar conexões', { error });
    throw error;
  }
};

// Make it available globally
if (typeof window !== 'undefined') {
  (window as any).geo = {
    testConnections
  };
}
