import Papa from 'papaparse';

export interface CSVExportOptions {
  filename: string;
  data: Record<string, unknown>[];
  columns?: string[];
}

export const exportToCSV = ({ filename, data, columns }: CSVExportOptions): void => {
  let exportData = data;
  
  if (columns) {
    exportData = data.map(row => {
      const filteredRow: Record<string, unknown> = {};
      columns.forEach(col => {
        filteredRow[col] = row[col];
      });
      return filteredRow;
    });
  }

  const csv = Papa.unparse(exportData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export interface CSVImportResult<T> {
  data: T[];
  errors: string[];
  meta: Papa.ParseMeta;
}

export const importFromCSV = <T>(
  file: File,
  transform?: (row: Record<string, unknown>) => T
): Promise<CSVImportResult<T>> => {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = results.errors.map(err => `Row ${err.row}: ${err.message}`);
        let data: T[] = results.data as T[];
        
        if (transform) {
          data = results.data.map((row, index) => {
            try {
              return transform(row as Record<string, unknown>);
            } catch (error) {
              errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Invalid data'}`);
              return null;
            }
          }).filter(Boolean) as T[];
        }
        
        resolve({
          data,
          errors,
          meta: results.meta
        });
      },
      error: (error) => {
        resolve({
          data: [],
          errors: [error.message],
          meta: {} as Papa.ParseMeta
        });
      }
    });
  });
};