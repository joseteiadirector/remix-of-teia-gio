import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, Download, FileText } from "lucide-react";
import { logger } from "@/utils/logger";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { parseCSV, parseExcel, downloadTemplate, ImportedBrand } from "@/utils/dataImport";

interface DataImportProps {
  onImportComplete: () => void;
}

export const DataImport = ({ onImportComplete }: DataImportProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);

    try {
      let brands: ImportedBrand[] = [];

      if (file.name.endsWith('.csv')) {
        brands = await parseCSV(file);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        brands = await parseExcel(file);
      } else {
        throw new Error('Formato não suportado. Use CSV ou Excel.');
      }

      if (brands.length === 0) {
        throw new Error('Nenhuma marca válida encontrada no arquivo.');
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Insert brands
      const brandsToInsert = brands.map(brand => ({
        ...brand,
        user_id: user.id,
      }));

      const { error } = await supabase.from('brands').insert(brandsToInsert);
      if (error) throw error;

      toast({
        title: "Importação concluída!",
        description: `${brands.length} marca(s) importada(s) com sucesso.`,
      });

      setOpen(false);
      onImportComplete();
    } catch (error) {
      logger.error('Erro na importação de dados', { error });
      toast({
        title: "Erro na importação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      // Reset input
      event.target.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Importar Marcas
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar Marcas</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo CSV ou Excel com suas marcas
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              O arquivo deve conter duas colunas: Nome e Domínio
            </p>
            
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Baixar Template CSV
            </Button>
          </div>

          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Button variant="default" disabled={importing} asChild>
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  {importing ? "Importando..." : "Selecionar Arquivo"}
                </span>
              </Button>
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              disabled={importing}
              className="hidden"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Formatos aceitos: CSV, XLSX, XLS
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
