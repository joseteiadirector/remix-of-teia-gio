import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, FileJson, Archive } from "lucide-react";
import { logger } from "@/utils/logger";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";

interface Brand {
  id: string;
  name: string;
  domain: string;
  context?: string | null;
  description?: string | null;
  is_visible: boolean;
  created_at: string;
}

interface BrandBackupData {
  version: string;
  exportedAt: string;
  platform: string;
  brands: Omit<Brand, 'id' | 'created_at'>[];
}

interface BrandBackupProps {
  brands: Brand[];
  onImportComplete: () => void;
  maxBrands: number;
}

export const BrandBackup = ({ brands, onImportComplete, maxBrands }: BrandBackupProps) => {
  const { toast } = useToast();
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  const exportToJSON = () => {
    const backupData: BrandBackupData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      platform: "Teia GEO",
      brands: brands.map(({ name, domain, context, description, is_visible }) => ({
        name,
        domain,
        context,
        description,
        is_visible,
      })),
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teia-geo-brands-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Backup exportado!",
      description: `${brands.length} marca(s) exportada(s) em JSON`,
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);

    try {
      const text = await file.text();
      const data = JSON.parse(text) as BrandBackupData;

      // Validate backup structure
      if (!data.brands || !Array.isArray(data.brands)) {
        throw new Error('Arquivo de backup inválido. Estrutura não reconhecida.');
      }

      // Validate each brand
      const validBrands = data.brands.filter(b => b.name && b.domain);
      if (validBrands.length === 0) {
        throw new Error('Nenhuma marca válida encontrada no backup.');
      }

      // Check platform limit
      const currentCount = brands.length;
      const availableSlots = maxBrands - currentCount;
      
      if (availableSlots <= 0) {
        throw new Error(`Limite de ${maxBrands} marcas atingido. Exclua marcas existentes para importar.`);
      }

      // Limit import to available slots
      const brandsToImport = validBrands.slice(0, availableSlots);
      const skipped = validBrands.length - brandsToImport.length;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Check for duplicates by name or domain
      const existingNames = new Set(brands.map(b => b.name.toLowerCase()));
      const existingDomains = new Set(brands.map(b => b.domain.toLowerCase()));
      
      const newBrands = brandsToImport.filter(b => 
        !existingNames.has(b.name.toLowerCase()) && 
        !existingDomains.has(b.domain.toLowerCase())
      );

      const duplicates = brandsToImport.length - newBrands.length;

      if (newBrands.length === 0) {
        throw new Error('Todas as marcas do backup já existem na plataforma.');
      }

      // Insert brands
      const brandsToInsert = newBrands.map(brand => ({
        name: brand.name,
        domain: brand.domain,
        context: brand.context || null,
        description: brand.description || null,
        is_visible: brand.is_visible ?? true,
        user_id: user.id,
      }));

      const { error } = await supabase.from('brands').insert(brandsToInsert);
      if (error) throw error;

      let message = `${newBrands.length} marca(s) importada(s) com sucesso.`;
      if (duplicates > 0) message += ` ${duplicates} duplicada(s) ignorada(s).`;
      if (skipped > 0) message += ` ${skipped} ignorada(s) por limite.`;

      toast({
        title: "Importação concluída!",
        description: message,
      });

      setImportOpen(false);
      onImportComplete();
    } catch (error) {
      logger.error('Erro na importação de backup', { error });
      toast({
        title: "Erro na importação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="md:size-default">
            <Archive className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Backup</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={exportToJSON} disabled={brands.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Exportar JSON
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Importar JSON
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar Backup JSON</DialogTitle>
            <DialogDescription>
              Restaure marcas de um arquivo de backup JSON exportado anteriormente.
              {brands.length >= maxBrands && (
                <span className="block mt-2 text-destructive">
                  Limite de {maxBrands} marcas atingido. Exclua marcas para importar.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                • Marcas duplicadas serão ignoradas automaticamente
              </p>
              <p className="text-sm text-muted-foreground">
                • Limite máximo: {maxBrands} marcas ({maxBrands - brands.length} vagas disponíveis)
              </p>
            </div>

            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <FileJson className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <label htmlFor="json-upload" className="cursor-pointer">
                <Button 
                  variant="default" 
                  disabled={importing || brands.length >= maxBrands} 
                  asChild
                >
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    {importing ? "Importando..." : "Selecionar Arquivo JSON"}
                  </span>
                </Button>
              </label>
              <input
                id="json-upload"
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                disabled={importing || brands.length >= maxBrands}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Formato aceito: JSON
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
