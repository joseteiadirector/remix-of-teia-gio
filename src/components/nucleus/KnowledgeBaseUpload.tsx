import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Upload, 
  FileText, 
  Trash2, 
  Loader2, 
  CheckCircle, 
  XCircle,
  BookOpen,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface KnowledgeBaseUploadProps {
  brandId: string;
  brandName: string;
}

interface BrandDocument {
  id: string;
  file_name: string;
  file_size: number;
  status: string;
  total_chunks: number;
  created_at: string;
}

export function KnowledgeBaseUpload({ brandId, brandName }: KnowledgeBaseUploadProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  // Fetch documents for this brand
  const { data: documents, isLoading } = useQuery({
    queryKey: ['brand-documents', brandId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brand_documents')
        .select('*')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as BrandDocument[];
    },
    enabled: !!brandId,
  });

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const doc = documents?.find(d => d.id === documentId);
      if (!doc) throw new Error('Document not found');

      // Delete from storage
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.storage
          .from('brand-documents')
          .remove([`${user.id}/${brandId}/${doc.file_name}`]);
      }

      // Delete from database (chunks will be cascade deleted)
      const { error } = await supabase
        .from('brand_documents')
        .delete()
        .eq('id', documentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-documents', brandId] });
      toast.success('Documento removido');
    },
    onError: (error) => {
      toast.error('Erro ao remover documento: ' + error.message);
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não suportado. Use PDF, DOC, DOCX ou TXT.');
      return;
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo: 50MB');
      return;
    }

    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const filePath = `${user.id}/${brandId}/${file.name}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('brand-documents')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Create document record
      const { data: docData, error: docError } = await supabase
        .from('brand_documents')
        .insert({
          brand_id: brandId,
          user_id: user.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          status: 'processing',
        })
        .select()
        .single();

      if (docError) throw docError;

      toast.success('Documento enviado! Processando...');
      queryClient.invalidateQueries({ queryKey: ['brand-documents', brandId] });

      // Trigger processing
      const { error: processError } = await supabase.functions.invoke('process-document', {
        body: { documentId: docData.id }
      });

      if (processError) {
        console.error('Processing error:', processError);
        toast.error('Erro ao processar documento');
      } else {
        toast.success('Documento processado com sucesso!');
        queryClient.invalidateQueries({ queryKey: ['brand-documents', brandId] });
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar documento: ' + (error as Error).message);
    } finally {
      setIsUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Pronto</Badge>;
      case 'processing':
        return <Badge variant="secondary"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Processando</Badge>;
      case 'error':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Erro</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const completedDocs = documents?.filter(d => d.status === 'completed').length || 0;
  const totalChunks = documents?.reduce((sum, d) => sum + (d.total_chunks || 0), 0) || 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-primary/20 bg-card/50">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <CardTitle className="text-base">Base de Conhecimento</CardTitle>
                {completedDocs > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {completedDocs} doc{completedDocs !== 1 ? 's' : ''} • {totalChunks} chunks
                  </Badge>
                )}
              </div>
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mb-4">
              Adicione PDFs e documentos para enriquecer as respostas dos LLMs sobre <strong>{brandName}</strong>
            </p>

            {/* Upload Area */}
            <div className="relative mb-4">
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
                id={`file-upload-${brandId}`}
              />
              <label
                htmlFor={`file-upload-${brandId}`}
                className={`
                  flex items-center justify-center gap-2 p-4 border-2 border-dashed 
                  rounded-lg cursor-pointer transition-colors
                  ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-muted/50'}
                `}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span>Clique para enviar PDF, DOC ou TXT</span>
                  </>
                )}
              </label>
            </div>

            {/* Documents List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : documents && documents.length > 0 ? (
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="w-4 h-4 flex-shrink-0 text-primary" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(doc.file_size)}
                            {doc.total_chunks > 0 && ` • ${doc.total_chunks} chunks`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(doc.status)}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(doc.id)}
                          disabled={deleteMutation.isPending}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum documento adicionado ainda
              </p>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
