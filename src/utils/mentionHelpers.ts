/**
 * Helper functions for mention visualization
 */

export const getSentimentConfig = (sentiment: string) => {
  switch (sentiment) {
    case 'positive':
      return {
        label: 'Positivo',
        variant: 'default' as const,
        color: 'bg-green-500',
        icon: '😊'
      };
    case 'negative':
      return {
        label: 'Negativo',
        variant: 'destructive' as const,
        color: 'bg-red-500',
        icon: '😞'
      };
    default:
      return {
        label: 'Neutro',
        variant: 'secondary' as const,
        color: 'bg-gray-500',
        icon: '😐'
      };
  }
};

export const getContextConfig = (context: string) => {
  switch (context) {
    case 'relevant':
      return {
        label: 'Relevante',
        variant: 'default' as const,
        color: 'bg-blue-500'
      };
    case 'irrelevant':
      return {
        label: 'Irrelevante',
        variant: 'outline' as const,
        color: 'bg-gray-400'
      };
    default:
      return {
        label: 'Parcial',
        variant: 'secondary' as const,
        color: 'bg-yellow-500'
      };
  }
};

export const getConfidenceLevel = (confidence: number) => {
  if (confidence >= 80) return { label: 'Alta', color: 'bg-green-500', textColor: 'text-green-500', variant: 'default' as const };
  if (confidence >= 50) return { label: 'Média', color: 'bg-yellow-500', textColor: 'text-yellow-500', variant: 'secondary' as const };
  return { label: 'Baixa', color: 'bg-red-500', textColor: 'text-red-500', variant: 'destructive' as const };
};

export const getConfidenceDescription = (confidence: number, mentioned: boolean) => {
  if (mentioned) {
    if (confidence >= 80) return 'Alta confiança - Menção confirmada com baixo risco de falso positivo';
    if (confidence >= 50) return 'Confiança média - Recomendável verificar contexto da menção';
    return 'Baixa confiança - Alto risco de falso positivo, verificação manual recomendada';
  } else {
    if (confidence >= 80) return 'Alta confiança - Marca não mencionada';
    if (confidence >= 50) return 'Confiança média - Possível falso negativo';
    return 'Baixa confiança - Resultado inconclusivo, coletar novamente recomendado';
  }
};
