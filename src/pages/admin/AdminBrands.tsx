import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Search, Eye, EyeOff, RefreshCw, BarChart3, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface BrandWithStats {
  id: string;
  name: string;
  domain: string;
  is_visible: boolean;
  user_id: string;
  created_at: string;
  mentions_count: number;
  geo_scores_count: number;
  automations_count: number;
}

export default function AdminBrands() {
  const [brands, setBrands] = useState<BrandWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<BrandWithStats | null>(null);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      // Fetch brands
      const { data: brandsData, error: brandsError } = await supabase
        .from('brands')
        .select('*')
        .order('created_at', { ascending: false });

      if (brandsError) throw brandsError;

      // Fetch stats for each brand
      const brandsWithStats = await Promise.all(
        (brandsData || []).map(async (brand) => {
          const [mentionsResult, geoResult, automationsResult] = await Promise.all([
            supabase.from('mentions_llm').select('id', { count: 'exact', head: true }).eq('brand_id', brand.id),
            supabase.from('geo_scores').select('id', { count: 'exact', head: true }).eq('brand_id', brand.id),
            supabase.from('automation_configs').select('id', { count: 'exact', head: true }).eq('brand_id', brand.id).eq('enabled', true)
          ]);

          return {
            ...brand,
            mentions_count: mentionsResult.count || 0,
            geo_scores_count: geoResult.count || 0,
            automations_count: automationsResult.count || 0
          };
        })
      );

      setBrands(brandsWithStats);
    } catch (error) {
      console.error('Error fetching brands:', error);
      toast.error('Erro ao carregar marcas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const toggleVisibility = async (brand: BrandWithStats) => {
    try {
      const { error } = await supabase
        .from('brands')
        .update({ is_visible: !brand.is_visible })
        .eq('id', brand.id);

      if (error) throw error;

      toast.success(`Marca ${brand.is_visible ? 'ocultada' : 'visível'}`);
      fetchBrands();
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast.error('Erro ao alterar visibilidade');
    }
  };

  const handleDelete = async () => {
    if (!brandToDelete) return;

    try {
      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', brandToDelete.id);

      if (error) throw error;

      toast.success('Marca excluída com sucesso');
      setDeleteDialogOpen(false);
      setBrandToDelete(null);
      fetchBrands();
    } catch (error) {
      console.error('Error deleting brand:', error);
      toast.error('Erro ao excluir marca');
    }
  };

  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    brand.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Gestão de Marcas
          </h1>
          <p className="text-muted-foreground">Gerenciar marcas e visibilidade</p>
        </div>
        <Button onClick={fetchBrands} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Marcas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brands.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Marcas Visíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {brands.filter(b => b.is_visible).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Marcas Ocultas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {brands.filter(b => !b.is_visible).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Menções</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {brands.reduce((acc, b) => acc + b.mentions_count, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Todas as Marcas</CardTitle>
          <CardDescription>Lista completa de marcas cadastradas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou domínio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Marca</TableHead>
                  <TableHead>Domínio</TableHead>
                  <TableHead className="text-center">Visível</TableHead>
                  <TableHead className="text-center">Menções</TableHead>
                  <TableHead className="text-center">GEO Scores</TableHead>
                  <TableHead className="text-center">Automações</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBrands.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell className="font-medium">{brand.name}</TableCell>
                    <TableCell className="text-muted-foreground">{brand.domain}</TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={brand.is_visible}
                        onCheckedChange={() => toggleVisibility(brand)}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{brand.mentions_count}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{brand.geo_scores_count}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{brand.automations_count}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(brand.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleVisibility(brand)}
                        >
                          {brand.is_visible ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setBrandToDelete(brand);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a marca <strong>{brandToDelete?.name}</strong>?
              Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
