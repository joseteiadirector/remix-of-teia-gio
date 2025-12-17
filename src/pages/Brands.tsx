import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, Globe, Trash2, Home, Download, Settings, Pencil } from "lucide-react";
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
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-4 md:space-y-8">
        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Marcas</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-4xl font-bold">Gerenciar Marcas</h1>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                brands.length >= MAX_PLATFORM_BRANDS 
                  ? 'bg-destructive/10 text-destructive' 
                  : 'bg-primary/10 text-primary'
              }`}>
                {brands.length}/{MAX_PLATFORM_BRANDS}
              </span>
            </div>
            <p className="text-sm md:text-base text-muted-foreground">
              Adicione e monitore suas marcas • Máximo de {MAX_PLATFORM_BRANDS} marcas
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="md:size-default" asChild>
              <Link to="/google-setup">
                <Settings className="h-4 w-4 md:mr-2" />
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
                  className="md:size-default"
                  disabled={!canAddBrand}
                  title={!canAddBrand ? `Limite de ${MAX_PLATFORM_BRANDS} marcas atingido` : `${brandsRemaining} vagas restantes`}
                >
                  <Plus className="h-4 w-4 md:mr-2" />
                  <span className="hidden sm:inline">Nova Marca</span>
                  <span className="sm:hidden">Nova</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingBrand ? 'Editar Marca' : 'Adicionar Nova Marca'}</DialogTitle>
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
                    />
                    <p className="text-xs text-muted-foreground">
                      Ajuda a diferenciar marcas com nomes similares. Ex: localização, setor, especialidade.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={saveBrand} disabled={loading}>
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

        {brandsLoading ? (
          <LoadingSpinner size="lg" text="Carregando marcas..." className="py-12" />
        ) : brands.length === 0 ? (
          <Card className="p-12 text-center">
            <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma marca cadastrada</h3>
            <p className="text-muted-foreground mb-4">
              Adicione sua primeira marca para começar
            </p>
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Marca
            </Button>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentData.map((brand) => (
                <Card key={brand.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
                        <Globe className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate" title={brand.name}>{brand.name}</h3>
                        <p className="text-sm text-muted-foreground break-all line-clamp-1" title={brand.domain}>{brand.domain}</p>
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
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteBrand(brand.id, brand.name)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Criada em: {new Date(brand.created_at).toLocaleDateString('pt-BR')}
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
                >
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPage}
                  disabled={!hasNextPage}
                >
                  Próxima
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Brands;