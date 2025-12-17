import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Brain, Send, Loader2, Trash2, BookOpen, Bot, Sparkles, MessageSquare, Search, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { logger } from "@/utils/logger";
import { USE_CODE_BASED_VISIBILITY, VISIBLE_BRAND_NAME } from "@/config/brandVisibility";
import { KnowledgeBaseUpload } from "@/components/nucleus/KnowledgeBaseUpload";

// Corporate LLM Icons Component
const LLMIcon = ({ provider, size = 'md' }: { provider: string; size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };
  const containerSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };
  
  const configs: Record<string, { icon: typeof Bot; gradient: string; shadow: string }> = {
    chatgpt: {
      icon: Bot,
      gradient: 'from-emerald-500 to-teal-500',
      shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.4)]'
    },
    gemini: {
      icon: Sparkles,
      gradient: 'from-blue-500 to-purple-500',
      shadow: 'shadow-[0_0_15px_rgba(59,130,246,0.4)]'
    },
    claude: {
      icon: MessageSquare,
      gradient: 'from-orange-500 to-amber-500',
      shadow: 'shadow-[0_0_15px_rgba(249,115,22,0.4)]'
    },
    perplexity: {
      icon: Search,
      gradient: 'from-cyan-500 to-blue-500',
      shadow: 'shadow-[0_0_15px_rgba(6,182,212,0.4)]'
    }
  };
  
  const config = configs[provider.toLowerCase()] || configs.chatgpt;
  const IconComponent = config.icon;
  
  return (
    <div className={`${containerSizes[size]} rounded-xl bg-gradient-to-br ${config.gradient} ${config.shadow} flex items-center justify-center flex-shrink-0`}>
      <IconComponent className={`${sizeClasses[size]} text-white`} />
    </div>
  );
};

const LLM_OPTIONS = [
  { key: 'chatgpt', name: 'ChatGPT' },
  { key: 'gemini', name: 'Google Gemini' },
  { key: 'claude', name: 'Claude' },
  { key: 'perplexity', name: 'Perplexity' },
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
    <div className="min-h-screen bg-slate-950">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container mx-auto p-6 max-w-5xl">
        <div className="flex flex-col gap-6">
          {/* Premium Header */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-purple-500/30 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 backdrop-blur-xl p-8 shadow-[0_0_50px_rgba(168,85,247,0.15)] transition-all duration-500 hover:shadow-[0_0_60px_rgba(168,85,247,0.25)] hover:border-purple-500/50">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
            <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-4xl font-black mb-2 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 shadow-[0_0_25px_rgba(168,85,247,0.5)]">
                    <Brain className="h-8 w-8 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-300 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
                    Nucleus Chat
                  </span>
                </h1>
                <p className="text-slate-400">
                  Converse com 4 LLMs simultaneamente sobre sua marca
                </p>
              </div>

              <div className="flex gap-3 items-center flex-wrap">
                {messages.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearChat}
                    className="gap-2 border-purple-500/30 hover:border-purple-500/50 hover:bg-purple-500/10 text-purple-300"
                  >
                    <Trash2 className="h-4 w-4" />
                    Limpar Chat
                  </Button>
                )}
                
                <Select value={selectedBrand || undefined} onValueChange={setSelectedBrand}>
                  <SelectTrigger className="w-64 border-purple-500/30 hover:border-purple-500/50 bg-slate-800/50 backdrop-blur-sm text-white">
                    <SelectValue placeholder="Selecione uma marca" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-purple-500/30">
                    {brands?.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id} className="text-white hover:bg-purple-500/20">
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Knowledge Base Upload Section */}
          {selectedBrand && selectedBrandData && (
            <KnowledgeBaseUpload 
              brandId={selectedBrand} 
              brandName={selectedBrandData.name} 
            />
          )}

          <Card className="flex flex-col h-[calc(100vh-26rem)] border-2 border-slate-700/50 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-sm shadow-[0_0_40px_rgba(30,41,59,0.5)]">
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                    <Brain className="h-10 w-10 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-black mb-2 bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-transparent">Bem-vindo ao Nucleus Chat</h3>
                  <p className="text-slate-400 mb-8">
                    Faça perguntas sobre sua marca e os 4 LLMs responderão simultaneamente
                  </p>
                  <div className="flex justify-center gap-6">
                    {LLM_OPTIONS.map((llm) => (
                      <div key={llm.key} className="text-center group">
                        <div className="mb-2 transform group-hover:scale-110 transition-transform duration-300">
                          <LLMIcon provider={llm.key} size="lg" />
                        </div>
                        <div className="text-xs text-slate-400 font-medium">{llm.name}</div>
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
                  {message.role === 'assistant' && message.llm && (
                    <LLMIcon provider={message.llm} size="md" />
                  )}
                  
                  <div
                    className={`max-w-[80%] rounded-xl p-4 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                        : 'bg-slate-800/80 border border-slate-700/50 text-slate-100'
                    }`}
                  >
                    {message.role === 'assistant' && message.llm && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-slate-300">
                          {LLM_OPTIONS.find(l => l.key === message.llm)?.name}
                        </span>
                        {message.usedKnowledgeBase && (
                          <Badge className="text-[10px] py-0 px-1.5 bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                            <BookOpen className="w-3 h-3 mr-1" />
                            KB
                          </Badge>
                        )}
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <div className="text-xs text-slate-500 mt-2">
                      {message.timestamp.toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 shadow-lg flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start gap-3 items-center">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 to-cyan-500/30 border border-purple-500/30 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
                  </div>
                  <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-4">
                    <p className="text-sm text-slate-400">
                      Consultando os 4 LLMs...
                    </p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="border-t border-slate-700/50 p-4 bg-slate-800/30">
            <div className="flex gap-3">
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
                className="flex-1 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-purple-500/20"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!selectedBrand || !inputMessage.trim() || isLoading}
                size="icon"
                className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 shadow-[0_0_20px_rgba(168,85,247,0.3)] disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Pressione Enter para enviar, Shift+Enter para nova linha
            </p>
          </div>
        </Card>
      </div>
      </div>
    </div>
  );
}
