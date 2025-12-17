import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { generateTechnicalOverviewPDF } from "@/utils/generateTechnicalPDF";
import { logger } from "@/utils/logger";

export const DownloadTechnicalPDF = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      await generateTechnicalOverviewPDF();
      toast({
        title: "PDF Gerado!",
        description: "O documento técnico foi baixado com sucesso.",
      });
    } catch (error) {
      logger.error('Erro ao gerar PDF técnico', { error });
      toast({
        title: "Erro ao Gerar PDF",
        description: "Não foi possível gerar o documento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={isGenerating}
      size="lg"
      className="gap-2"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Gerando PDF...
        </>
      ) : (
        <>
          <FileDown className="w-5 h-5" />
          Baixar Documento Técnico (PDF)
        </>
      )}
    </Button>
  );
};
