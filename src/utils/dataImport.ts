import * as XLSX from 'xlsx';

export interface ImportedBrand {
  name: string;
  domain: string;
}

export const parseCSV = (file: File): Promise<ImportedBrand[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        // Skip header if exists
        const dataLines = lines[0].toLowerCase().includes('name') || lines[0].toLowerCase().includes('nome')
          ? lines.slice(1)
          : lines;
        
        const brands: ImportedBrand[] = dataLines.map(line => {
          const [name, domain] = line.split(',').map(s => s.trim());
          return { name, domain };
        }).filter(brand => brand.name && brand.domain);
        
        resolve(brands);
      } catch (error) {
        reject(new Error('Erro ao processar CSV'));
      }
    };
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsText(file);
  });
};

export const parseExcel = (file: File): Promise<ImportedBrand[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as string[][];
        
        // Skip header if exists
        const dataRows = jsonData[0].some(cell => 
          typeof cell === 'string' && (cell.toLowerCase().includes('name') || cell.toLowerCase().includes('nome'))
        ) ? jsonData.slice(1) : jsonData;
        
        const brands: ImportedBrand[] = dataRows.map(row => ({
          name: String(row[0] || '').trim(),
          domain: String(row[1] || '').trim(),
        })).filter(brand => brand.name && brand.domain);
        
        resolve(brands);
      } catch (error) {
        reject(new Error('Erro ao processar Excel'));
      }
    };
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsBinaryString(file);
  });
};

export const downloadTemplate = () => {
  const template = 'Nome,Domínio\nExemplo Marca 1,exemplo1.com\nExemplo Marca 2,exemplo2.com';
  const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', 'template-importacao-marcas.csv');
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
