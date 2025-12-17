import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { BookOpen, TrendingUp, AlertTriangle, Target, Activity } from "lucide-react";

export function MetricsGuide() {
  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <BookOpen className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Como Interpretar as Métricas KAPI</h3>
          <p className="text-sm text-muted-foreground">
            Guia completo para entender cada métrica da plataforma Teia GEO
          </p>
        </div>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {/* ICE - Índice de Convergência Estratégica */}
        <AccordionItem value="ice">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="font-semibold">ICE - Índice de Convergência Estratégica</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pt-3">
            <div className="p-4 bg-background rounded-lg border">
              <h4 className="font-semibold mb-2 text-sm">O que é?</h4>
              <p className="text-sm text-muted-foreground mb-3">
                O ICE mede o alinhamento entre suas estratégias de SEO (buscadores tradicionais) e GEO (IA generativa). 
                Quanto maior o ICE, mais sincronizadas estão suas otimizações.
              </p>

              <h4 className="font-semibold mb-2 text-sm">Faixas de Interpretação:</h4>
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2">
                  <Badge className="gap-1">🟢 90-100</Badge>
                  <span className="text-xs">Excelente - Convergência perfeita</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">🟡 75-89</Badge>
                  <span className="text-xs">Bom - Oportunidades menores</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">🟠 60-74</Badge>
                  <span className="text-xs">Regular - Requer atenção</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="gap-1">🔴 0-59</Badge>
                  <span className="text-xs">Crítico - Ação urgente</span>
                </div>
              </div>

              <h4 className="font-semibold mb-2 text-sm">Exemplo Prático:</h4>
              <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                <strong>ICE: 75 →</strong> "Sua marca aparece bem no Google (SEO Score: 80), mas está menos presente 
                nas respostas dos LLMs (GEO Score: 70). O ICE indica que 3 em cada 4 estratégias estão alinhadas."
              </p>

              <h4 className="font-semibold mb-2 text-sm mt-3">O que fazer?</h4>
              <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                <li><strong>ICE Alto (&gt;85):</strong> Manter estratégias consistentes</li>
                <li><strong>ICE Médio (60-85):</strong> Revisar palavras-chave e contexto</li>
                <li><strong>ICE Baixo (&lt;60):</strong> Reavaliar completamente as estratégias</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* GAP - Prioridade de Ação */}
        <AccordionItem value="gap">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <span className="font-semibold">GAP - Prioridade Estratégica de Ação</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pt-3">
            <div className="p-4 bg-background rounded-lg border">
              <h4 className="font-semibold mb-2 text-sm">O que é?</h4>
              <p className="text-sm text-muted-foreground mb-3">
                O GAP mostra a divergência absoluta entre GEO e SEO. Valores baixos indicam estratégias alinhadas, 
                enquanto valores altos sinalizam desalinhamento crítico que requer ação imediata.
              </p>

              <h4 className="font-semibold mb-2 text-sm">Faixas de Interpretação:</h4>
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2">
                  <Badge className="gap-1">🟢 0-10</Badge>
                  <span className="text-xs">Excelente - Divergência mínima</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">🟡 11-25</Badge>
                  <span className="text-xs">Bom - Ajustes menores</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">🟠 26-40</Badge>
                  <span className="text-xs">Atenção - Ações estratégicas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="gap-1">🔴 41+</Badge>
                  <span className="text-xs">Crítico - Prioridade máxima</span>
                </div>
              </div>

              <h4 className="font-semibold mb-2 text-sm">Exemplo Prático:</h4>
              <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                <strong>GAP: 30 →</strong> "Há uma diferença de 30 pontos entre seu GEO Score e SEO Score. 
                Exemplo: GEO 65 vs SEO 95 indica que você está visível no Google mas invisível para LLMs."
              </p>

              <h4 className="font-semibold mb-2 text-sm mt-3">O que fazer?</h4>
              <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                <li><strong>GAP Baixo (&lt;15):</strong> Manutenção preventiva</li>
                <li><strong>GAP Médio (15-30):</strong> Otimizar pontos específicos</li>
                <li><strong>GAP Alto (&gt;30):</strong> Reformular estratégia completa</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* CPI - Índice de Previsibilidade Cognitiva */}
        <AccordionItem value="cpi">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <Target className="w-4 h-4 text-purple-500" />
              <span className="font-semibold">CPI - Índice de Previsibilidade Cognitiva</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pt-3">
            <div className="p-4 bg-background rounded-lg border">
              <h4 className="font-semibold mb-2 text-sm">O que é?</h4>
              <p className="text-sm text-muted-foreground mb-3">
                O CPI avalia a consistência das respostas dos LLMs sobre sua marca. Um CPI alto significa que 
                diferentes LLMs (ChatGPT, Gemini, Claude) falam sobre você de forma previsível e consistente.
              </p>

              <h4 className="font-semibold mb-2 text-sm">Faixas de Interpretação:</h4>
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2">
                  <Badge className="gap-1">🟢 80-100</Badge>
                  <span className="text-xs">Excelente - Alta consistência</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">🟡 65-79</Badge>
                  <span className="text-xs">Bom - Pequenas variações</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">🟠 50-64</Badge>
                  <span className="text-xs">Regular - Inconsistências</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="gap-1">🔴 0-49</Badge>
                  <span className="text-xs">Crítico - Respostas conflitantes</span>
                </div>
              </div>

              <h4 className="font-semibold mb-2 text-sm">Exemplo Prático:</h4>
              <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                <strong>CPI: 85 →</strong> "85% das vezes, os LLMs falam sobre sua marca de forma consistente. 
                ChatGPT, Gemini e Claude compartilham informações alinhadas sobre quem você é e o que faz."
              </p>

              <h4 className="font-semibold mb-2 text-sm mt-3">O que fazer?</h4>
              <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                <li><strong>CPI Alto (&gt;75):</strong> Manter messaging consistente</li>
                <li><strong>CPI Médio (50-75):</strong> Unificar comunicação digital</li>
                <li><strong>CPI Baixo (&lt;50):</strong> Revisar identidade e posicionamento</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Estabilidade Cognitiva */}
        <AccordionItem value="stability">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 text-green-500" />
              <span className="font-semibold">Estabilidade Cognitiva</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pt-3">
            <div className="p-4 bg-background rounded-lg border">
              <h4 className="font-semibold mb-2 text-sm">O que é?</h4>
              <p className="text-sm text-muted-foreground mb-3">
                A Estabilidade Cognitiva mede a consistência temporal das menções à sua marca. 
                Alta estabilidade indica presença digital sólida e previsível ao longo do tempo.
              </p>

              <h4 className="font-semibold mb-2 text-sm">Faixas de Interpretação:</h4>
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2">
                  <Badge className="gap-1">🟢 85-100</Badge>
                  <span className="text-xs">Excelente - Presença estável</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">🟡 70-84</Badge>
                  <span className="text-xs">Bom - Flutuações menores</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">🟠 55-69</Badge>
                  <span className="text-xs">Regular - Variações significativas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="gap-1">🔴 0-54</Badge>
                  <span className="text-xs">Crítico - Presença inconsistente</span>
                </div>
              </div>

              <h4 className="font-semibold mb-2 text-sm">Exemplo Prático:</h4>
              <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                <strong>Estabilidade: 78 →</strong> "Sua marca mantém 78% de consistência nas menções ao longo do tempo. 
                Há pequenas flutuações, mas sua presença digital é relativamente previsível."
              </p>

              <h4 className="font-semibold mb-2 text-sm mt-3">O que fazer?</h4>
              <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                <li><strong>Alta (&gt;80):</strong> Manter cadência de conteúdo</li>
                <li><strong>Média (60-80):</strong> Regularizar publicações</li>
                <li><strong>Baixa (&lt;60):</strong> Criar calendário editorial consistente</li>
              </ul>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Benchmarks de Mercado */}
        <AccordionItem value="benchmarks">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <Target className="w-4 h-4 text-primary" />
              <span className="font-semibold">Benchmarks de Mercado</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pt-3">
            <div className="p-4 bg-background rounded-lg border">
              <h4 className="font-semibold mb-3 text-sm">Médias por Segmento:</h4>
              
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded">
                  <h5 className="font-semibold text-xs mb-2">🏆 E-commerce / Varejo</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><strong>ICE:</strong> 72</div>
                    <div><strong>GAP:</strong> 28</div>
                    <div><strong>CPI:</strong> 68</div>
                    <div><strong>Estabilidade:</strong> 75</div>
                  </div>
                </div>

                <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded">
                  <h5 className="font-semibold text-xs mb-2">💼 B2B SaaS</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><strong>ICE:</strong> 78</div>
                    <div><strong>GAP:</strong> 22</div>
                    <div><strong>CPI:</strong> 82</div>
                    <div><strong>Estabilidade:</strong> 80</div>
                  </div>
                </div>

                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded">
                  <h5 className="font-semibold text-xs mb-2">📱 Marketing / Agências</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><strong>ICE:</strong> 75</div>
                    <div><strong>GAP:</strong> 25</div>
                    <div><strong>CPI:</strong> 70</div>
                    <div><strong>Estabilidade:</strong> 72</div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-3 italic">
                * Benchmarks baseados em análise de 500+ marcas na plataforma Teia GEO (2024)
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
