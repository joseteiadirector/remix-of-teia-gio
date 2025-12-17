import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Brain, Send, Loader2, Trash2, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { logger } from "@/utils/logger";
import { USE_CODE_BASED_VISIBILITY, VISIBLE_BRAND_NAME } from "@/config/brandVisibility";
import { KnowledgeBaseUpload } from "@/components/nucleus/KnowledgeBaseUpload";

const LLM_OPTIONS = [
  { key: 'chatgpt', name: 'ChatGPT', icon: '🤖' },
  { key: 'gemini', name: 'Google Gemini', icon: '✨' },
  { key: 'claude', name: 'Claude', icon: '🧠' },
  { key: 'perplexity', name: 'Perplexity', icon: '🔍' },
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
  llm?: string;
  timestamp: Date;
  usedKnowledgeBase?: boolean;
}

export default function NucleusCommandCenter() {
  const queryClient = useQueryClient();
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ✅ FILTRO CONTROLADO PELO CÓDIGO
  const { data: brands } = useQuery({
    queryKey: ["brands", USE_CODE_BASED_VISIBILITY, VISIBLE_BRAND_NAME],
    queryFn: async () => {
      let query = supabase
        .from("brands")
        .select("*");
      
      if (USE_CODE_BASED_VISIBILITY) {
        query = query.eq('name', VISIBLE_BRAND_NAME);
      } else {
        query = query.eq('is_visible', true);
      }
      
      query = query.order("name");
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const selectedBrandData = brands?.find(b => b.id === selectedBrand);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, brandId }: { message: string; brandId: string }) => {
      logger.info('Enviando mensagem para nucleus-chat', { message, brandId });
      const { data, error } = await supabase.functions.invoke("nucleus-chat", {
        body: { message, brandId },
      });
      
      logger.debug('Resposta nucleus-chat', { data, error });
      
      if (error) {
        logger.error('Erro nucleus-chat', { error });
        throw error;
      }
      
      if (!data) {
        throw new Error('Resposta vazia do servidor');
      }
      
      return data;
    },
    onSuccess: (data) => {
      logger.debug('Sucesso nucleus-chat', { data });
      
      // Check if data has the expected structure
      if (!data.results || !Array.isArray(data.results)) {
        logger.error('Estrutura de resposta inválida', { data });
        toast.error('Resposta inválida do servidor');
        setIsLoading(false);
        return;
      }
      
      // Add LLM responses to messages
      let addedCount = 0;
      data.results.forEach((result: any) => {
        logger.debug('Processando resultado LLM', { result });
        if (result.success && result.response) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: result.response,
            llm: result.llm,
            timestamp: new Date(),
            usedKnowledgeBase: result.usedKnowledgeBase || data.usedKnowledgeBase,
          }]);
          addedCount++;
        }
      });
      
      queryClient.invalidateQueries({ queryKey: ["mentions_llm"] });
      setIsLoading(false);
      
      if (addedCount > 0) {
        const kbMessage = data.usedKnowledgeBase ? ' (com base de conhecimento)' : '';
        toast.success(`${addedCount} LLM${addedCount > 1 ? 's responderam' : ' respondeu'}${kbMessage}!`);
      } else {
        toast.warning('Nenhum LLM conseguiu responder. Verifique os logs.');
      }
    },
    onError: (error) => {
      logger.error('Erro na mutação nucleus-chat', { error });
      setIsLoading(false);
      toast.error("Erro ao enviar mensagem: " + error.message);
    },
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !selectedBrand) {
      toast.error("Selecione uma marca e digite uma mensagem");
      return;
    }

    setMessages(prev => [...prev, {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    }]);

    setIsLoading(true);
    sendMessageMutation.mutate({ 
      message: inputMessage, 
      brandId: selectedBrand 
    });

    setInputMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    toast.success("Conversas limpas! Comece uma nova pesquisa.");
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Brain className="h-8 w-8 text-primary" />
              Nucleus Chat
            </h1>
            <p className="text-muted-foreground">
              Converse com 4 LLMs simultaneamente sobre sua marca
            </p>
          </div>

          <div className="flex gap-3 items-center">
            {messages.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearChat}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Limpar Chat
              </Button>
            )}
            
            <Select value={selectedBrand || undefined} onValueChange={setSelectedBrand}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Selecione uma marca" />
              </SelectTrigger>
              <SelectContent>
                {brands?.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Knowledge Base Upload Section */}
        {selectedBrand && selectedBrandData && (
          <KnowledgeBaseUpload 
            brandId={selectedBrand} 
            brandName={selectedBrandData.name} 
          />
        )}

        <Card className="flex flex-col h-[calc(100vh-22rem)]">
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Bem-vindo ao Nucleus Chat</h3>
                  <p className="text-muted-foreground mb-6">
                    Faça perguntas sobre sua marca e os 4 LLMs responderão simultaneamente
                  </p>
                  <div className="flex justify-center gap-4">
                    {LLM_OPTIONS.map((llm) => (
                      <div key={llm.key} className="text-center">
                        <div className="text-3xl mb-1">{llm.icon}</div>
                        <div className="text-xs text-muted-foreground">{llm.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="text-2xl flex-shrink-0">
                      {LLM_OPTIONS.find(l => l.key === message.llm)?.icon || '🤖'}
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.role === 'assistant' && message.llm && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold opacity-70">
                          {LLM_OPTIONS.find(l => l.key === message.llm)?.name}
                        </span>
                        {message.usedKnowledgeBase && (
                          <Badge variant="secondary" className="text-[10px] py-0 px-1">
                            <BookOpen className="w-3 h-3 mr-1" />
                            KB
                          </Badge>
                        )}
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <div className="text-xs opacity-50 mt-2">
                      {message.timestamp.toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <div className="text-2xl flex-shrink-0">👤</div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">
                      Consultando os 4 LLMs...
                    </p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={
                  selectedBrand 
                    ? "Digite sua pergunta..." 
                    : "Selecione uma marca primeiro"
                }
                disabled={!selectedBrand || isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!selectedBrand || !inputMessage.trim() || isLoading}
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Pressione Enter para enviar, Shift+Enter para nova linha
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
