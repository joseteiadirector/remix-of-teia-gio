import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, Globe, Trash2, Home, Download, Settings, Pencil, Building2, Calendar, ExternalLink } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import { DataImport } from "@/components/DataImport";
import { BrandBackup } from "@/components/BrandBackup";

import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { useNavigate, Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { logger } from "@/utils/logger";

// Limite máximo de marcas da plataforma
const MAX_PLATFORM_BRANDS = 7;

const Brands = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { limits } = useSubscriptionLimits();
  const [open, setOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any>(null);
  const [newBrand, setNewBrand] = useState({ name: "", domain: "", context: "" });
  const [loading, setLoading] = useState(false);

  // Otimizar busca de marcas com React Query
  const { data: brands = [], isLoading: brandsLoading } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name, domain, context, description, created_at, user_id, is_visible')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Erro ao carregar marcas",
          description: "Não foi possível carregar as marcas.",
          variant: "destructive",
        });
        throw error;
      }
      return data || [];
    },
    staleTime: 1 * 60 * 1000, // Cache por 1 minuto
  });

  const saveBrand = async () => {
    if (editingBrand) {
      // Update existing brand
      if (!editingBrand.name || !editingBrand.domain) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha nome e domínio",
          variant: "destructive",
        });
        return;
      }

      setLoading(true);

      try {
        const { error } = await supabase
          .from('brands')
          .update({
            name: editingBrand.name,
            domain: editingBrand.domain,
            context: editingBrand.context || null,
          })
          .eq('id', editingBrand.id);

        if (error) throw error;

        toast({
          title: "Marca atualizada!",
          description: `${editingBrand.name} foi atualizada com sucesso`,
        });

        setEditingBrand(null);
        setOpen(false);
        
        // Invalidar query para atualizar em todos os lugares
        queryClient.invalidateQueries({ queryKey: ['brands'] });
      } catch (error) {
        logger.error('Error updating brand', { error });
        toast({
          title: "Erro ao atualizar",
          description: error instanceof Error ? error.message : "Erro desconhecido",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    } else {
      // Add new brand
      if (!canAddBrand) {
        toast({
          title: "Limite atingido",
          description: `A plataforma suporta no máximo ${MAX_PLATFORM_BRANDS} marcas. Exclua uma marca existente para adicionar outra.`,
          variant: "destructive",
        });
        return;
      }

      if (!newBrand.name || !newBrand.domain) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha nome e domínio",
          variant: "destructive",
        });
        return;
      }

      setLoading(true);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast({
            title: "Não autenticado",
            description: "Faça login para adicionar marcas",
            variant: "destructive",
          });
          return;
        }

        const { error } = await supabase.from('brands').insert({
          name: newBrand.name,
          domain: newBrand.domain,
          context: newBrand.context || null,
          user_id: user.id,
        });

        if (error) throw error;

        toast({
          title: "Marca adicionada!",
          description: `${newBrand.name} foi adicionada com sucesso`,
        });

        setNewBrand({ name: "", domain: "", context: "" });
        setOpen(false);
        
        // Invalidar query para atualizar em todos os lugares
        queryClient.invalidateQueries({ queryKey: ['brands'] });
      } catch (error) {
        logger.error('Error adding brand', { error });
        toast({
          title: "Erro ao adicionar",
          description: error instanceof Error ? error.message : "Erro desconhecido",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const deleteBrand = async (id: string, brandName: string) => {
    if (!confirm(`Tem certeza que deseja excluir a marca "${brandName}"?`)) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from('brands').delete().eq('id', id);

      if (error) throw error;

      toast({
        title: "Marca removida",
        description: `${brandName} foi excluída com sucesso`,
      });

      // Invalidar query para atualizar em todos os lugares
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    } catch (error) {
      logger.error('Error deleting brand', { error });
      toast({
        title: "Erro ao excluir",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  const { currentData, currentPage, totalPages, nextPage, previousPage, hasPreviousPage, hasNextPage } = 
    usePagination({ data: brands, itemsPerPage: 9 });

  // Verificar se pode adicionar mais marcas (limite da plataforma: 7)
  const canAddBrand = brands.length < MAX_PLATFORM_BRANDS;
  const brandsRemaining = MAX_PLATFORM_BRANDS - brands.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-4 md:space-y-8">
          {/* Breadcrumbs */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                  <Home className="h-4 w-4" />
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Marcas
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Premium Header */}
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-background/80 via-primary/5 to-background/80 backdrop-blur-xl p-6 shadow-2xl transition-all duration-500 hover:shadow-primary/20 hover:border-primary/40">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30">
                    <Building2 className="h-6 w-6 text-primary drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                  </div>
                  <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                    Gerenciar Marcas
                  </h1>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    brands.length >= MAX_PLATFORM_BRANDS 
                      ? 'bg-destructive/10 text-destructive border border-destructive/30' 
                      : 'bg-primary/10 text-primary border border-primary/30'
                  }`}>
                    {brands.length}/{MAX_PLATFORM_BRANDS}
                  </span>
                </div>
                <p className="text-sm md:text-base text-muted-foreground">
                  Adicione e monitore suas marcas • Máximo de {MAX_PLATFORM_BRANDS} marcas
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="border-primary/30 hover:border-primary/50 hover:bg-primary/5" asChild>
                  <Link to="/google-setup">
                    <Settings className="h-4 w-4 md:mr-2 text-primary" />
                    <span className="hidden md:inline">Configurar Google</span>
                  </Link>
                </Button>
                <DataImport onImportComplete={() => queryClient.invalidateQueries({ queryKey: ['brands'] })} />
                <BrandBackup 
                  brands={brands} 
                  onImportComplete={() => queryClient.invalidateQueries({ queryKey: ['brands'] })}
                  maxBrands={MAX_PLATFORM_BRANDS}
                />
                <Dialog open={open} onOpenChange={(isOpen) => {
                  setOpen(isOpen);
                  if (!isOpen) {
                    setEditingBrand(null);
                    setNewBrand({ name: "", domain: "", context: "" });
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      disabled={!canAddBrand}
                      title={!canAddBrand ? `Limite de ${MAX_PLATFORM_BRANDS} marcas atingido` : `${brandsRemaining} vagas restantes`}
                      className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25"
                    >
                      <Plus className="h-4 w-4 md:mr-2" />
                      <span className="hidden sm:inline">Nova Marca</span>
                      <span className="sm:hidden">Nova</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg border-primary/20 bg-background/95 backdrop-blur-xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        {editingBrand ? 'Editar Marca' : 'Adicionar Nova Marca'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingBrand 
                          ? 'Atualize os dados da marca. O contexto ajuda os LLMs a identificar a marca correta.'
                          : `Insira os dados da marca que deseja monitorar. (${brands.length}/${MAX_PLATFORM_BRANDS} marcas)`
                        }
                        {!canAddBrand && !editingBrand && (
                          <span className="block mt-2 text-destructive">
                            Limite máximo de {MAX_PLATFORM_BRANDS} marcas atingido
                          </span>
                        )}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome da Marca *</Label>
                        <Input
                          id="name"
                          value={editingBrand ? editingBrand.name : newBrand.name}
                          onChange={(e) => editingBrand 
                            ? setEditingBrand({ ...editingBrand, name: e.target.value })
                            : setNewBrand({ ...newBrand, name: e.target.value })
                          }
                          placeholder="Ex: WYSE"
                          className="border-primary/20 focus:border-primary/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="domain">Domínio *</Label>
                        <Input
                          id="domain"
                          value={editingBrand ? editingBrand.domain : newBrand.domain}
                          onChange={(e) => editingBrand
                            ? setEditingBrand({ ...editingBrand, domain: e.target.value })
                            : setNewBrand({ ...newBrand, domain: e.target.value })
                          }
                          placeholder="Ex: wyse.com.br"
                          className="border-primary/20 focus:border-primary/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="context">Contexto (Recomendado)</Label>
                        <Input
                          id="context"
                          value={editingBrand ? (editingBrand.context || '') : newBrand.context}
                          onChange={(e) => editingBrand
                            ? setEditingBrand({ ...editingBrand, context: e.target.value })
                            : setNewBrand({ ...newBrand, context: e.target.value })
                          }
                          placeholder="Ex: agência de marketing do Rio de Janeiro"
                          className="border-primary/20 focus:border-primary/50"
                        />
                        <p className="text-xs text-muted-foreground">
                          Ajuda a diferenciar marcas com nomes similares. Ex: localização, setor, especialidade.
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={saveBrand} disabled={loading} className="bg-gradient-to-r from-primary to-primary/80">
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {editingBrand ? 'Salvando...' : 'Adicionando...'}
                          </>
                        ) : (
                          editingBrand ? 'Salvar' : 'Adicionar'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          {brandsLoading ? (
            <LoadingSpinner size="lg" text="Carregando marcas..." className="py-12" />
          ) : brands.length === 0 ? (
            <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-background/80 via-primary/5 to-background/80 backdrop-blur-xl p-12 text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
              <div className="relative z-10">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center mb-4">
                  <Globe className="h-8 w-8 text-primary drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Nenhuma marca cadastrada</h3>
                <p className="text-muted-foreground mb-4">
                  Adicione sua primeira marca para começar
                </p>
                <Button onClick={() => setOpen(true)} className="bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/25">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Marca
                </Button>
              </div>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentData.map((brand, index) => (
                  <Card 
                    key={brand.id} 
                    className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-background/80 via-primary/5 to-background/80 backdrop-blur-xl p-6 group hover:shadow-lg hover:shadow-primary/20 hover:border-primary/40 transition-all duration-500"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex-shrink-0">
                            <Globe className="h-5 w-5 text-primary drop-shadow-[0_0_6px_rgba(139,92,246,0.4)]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate text-foreground" title={brand.name}>{brand.name}</h3>
                            <p className="text-sm text-muted-foreground break-all line-clamp-1 flex items-center gap-1" title={brand.domain}>
                              <ExternalLink className="h-3 w-3 flex-shrink-0" />
                              {brand.domain}
                            </p>
                            {brand.context && (
                              <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-1" title={brand.context}>
                                {brand.context}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingBrand(brand);
                              setOpen(true);
                            }}
                            className="hover:bg-primary/10"
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteBrand(brand.id, brand.name)}
                            className="hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4 text-destructive/70 hover:text-destructive transition-colors" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-4 border-t border-border/50">
                        <Calendar className="h-3.5 w-3.5" />
                        Criada em: {new Date(brand.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={previousPage}
                    disabled={!hasPreviousPage}
                    className="border-primary/30 hover:border-primary/50"
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground px-4">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={nextPage}
                    disabled={!hasNextPage}
                    className="border-primary/30 hover:border-primary/50"
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Brands;
