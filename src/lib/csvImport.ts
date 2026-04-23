export interface CSVMapping {
  dateColumn: string;
  descriptionColumn: string;
  amountColumn: string;
  categoryColumn?: string;
  typeColumn?: string;
}

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category?: string;
}

// Presets para bancos portugueses e internacionais
export const bankPresets: Record<string, CSVMapping> = {
  generic: {
    dateColumn: "date",
    descriptionColumn: "description",
    amountColumn: "amount",
  },
  revolut: {
    dateColumn: "data",
    descriptionColumn: "descrição",
    amountColumn: "valor",
    categoryColumn: "categoria",
  },
  n26: {
    dateColumn: "date",
    descriptionColumn: "partner name",
    amountColumn: "amount",
  },
  millennium: {
    dateColumn: "data",
    descriptionColumn: "descrição",
    amountColumn: "valor",
  },
  cgd: {
    dateColumn: "data",
    descriptionColumn: "movimento",
    amountColumn: "valor",
  },
  santander: {
    dateColumn: "data",
    descriptionColumn: "descrição",
    amountColumn: "valor",
  },
};

export async function parseCSV(file: File, mapping: CSVMapping): Promise<ParsedTransaction[]> {
  try {
    const text = await file.text();
    
    if (!text || text.trim().length === 0) {
      throw new Error("O ficheiro CSV está vazio");
    }
    
    const lines = text.split("\n").filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error("CSV vazio ou inválido - precisa de pelo menos 1 linha de dados");
    }

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/"/g, ""));
    
    const dateIdx = findColumnIndex(headers, mapping.dateColumn);
    const descIdx = findColumnIndex(headers, mapping.descriptionColumn);
    const amountIdx = findColumnIndex(headers, mapping.amountColumn);
    const categoryIdx = mapping.categoryColumn ? findColumnIndex(headers, mapping.categoryColumn) : -1;
    const typeIdx = mapping.typeColumn ? findColumnIndex(headers, mapping.typeColumn) : -1;

    if (dateIdx === -1 || descIdx === -1 || amountIdx === -1) {
      const missing: string[] = [];
      if (dateIdx === -1) missing.push(mapping.dateColumn);
      if (descIdx === -1) missing.push(mapping.descriptionColumn);
      if (amountIdx === -1) missing.push(mapping.amountColumn);
      throw new Error(`Colunas necessárias não encontradas: ${missing.join(", ")}`);
    }

    const transactions: ParsedTransaction[] = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const row = parseCSVLine(lines[i], headers.length);
        
        if (!row[dateIdx] || !row[amountIdx]) continue;

        const date = parseDate(row[dateIdx]);
        const amount = parseAmount(row[amountIdx]);
        
        if (!date || isNaN(amount)) {
          console.warn(`Skipping row ${i}: invalid date or amount`);
          continue;
        }

        transactions.push({
          date,
          description: row[descIdx]?.replace(/"/g, "") || "Importado",
          amount: Math.abs(amount),
          type: amount < 0 || (typeIdx !== -1 && row[typeIdx]?.toLowerCase().includes("débito")) 
            ? "expense" 
            : "income",
          category: categoryIdx !== -1 ? row[categoryIdx]?.replace(/"/g, "") : undefined,
        });
      } catch (rowError) {
        console.warn(`Error parsing row ${i}:`, rowError);
      }
    }

    if (transactions.length === 0) {
      throw new Error("Nenhuma transação válida encontrada no CSV");
    }

    return transactions;
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("Erro ao processar CSV");
  }
}

function findColumnIndex(headers: string[], searchTerms: string): number {
  const terms = searchTerms.toLowerCase().split(/[|/]/);
  
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i].toLowerCase();
    for (const term of terms) {
      if (header.includes(term.trim())) {
        return i;
      }
    }
  }
  
  return -1;
}

function parseCSVLine(line: string, expectedColumns: number): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  
  // Pad with empty strings if needed
  while (result.length < expectedColumns) {
    result.push("");
  }
  
  return result;
}

function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;
  
  const date = dateStr.trim();
  
  // Try different date formats
  const formats = [
    // YYYY-MM-DD
    /(\d{4})-(\d{1,2})-(\d{1,2})/,
    // DD/MM/YYYY
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    // DD-MM-YYYY
    /(\d{1,2})-(\d{1,2})-(\d{4})/,
    // DD.MM.YYYY
    /(\d{1,2})\.(\d{1,2})\.(\d{4})/,
    // MM/DD/YYYY (US format)
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
  ];

  for (const format of formats) {
    const match = date.match(format);
    if (match) {
      let year: number, month: number, day: number;
      
      if (format.source.includes("YYYY-MM-DD")) {
        year = parseInt(match[1]);
        month = parseInt(match[2]) - 1;
        day = parseInt(match[3]);
      } else if (format.source.includes("DD/MM") || format.source.includes("DD-MM") || format.source.includes("DD.MM")) {
        day = parseInt(match[1]);
        month = parseInt(match[2]) - 1;
        year = parseInt(match[3]);
      } else {
        // Assume MM/DD/YYYY
        month = parseInt(match[1]) - 1;
        day = parseInt(match[2]);
        year = parseInt(match[3]);
      }
      
      const parsed = new Date(year, month, day);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split("T")[0];
      }
    }
  }

  // Fallback: try native Date parsing
  const native = new Date(date);
  if (!isNaN(native.getTime())) {
    return native.toISOString().split("T")[0];
  }

  return null;
}

function parseAmount(amountStr: string): number {
  if (!amountStr) return NaN;
  
  let amount = amountStr.trim();
  
  // Remove currency symbols
  amount = amount.replace(/[€$£]/g, "");
  
  // Handle parentheses for negative (accounting format)
  if (amount.startsWith("(") && amount.endsWith(")")) {
    amount = "-" + amount.slice(1, -1);
  }
  
  // Handle European format (1.234,56) vs US format (1,234.56)
  if (amount.includes(".") && amount.includes(",")) {
    // Both present - determine which is decimal separator
    const lastDot = amount.lastIndexOf(".");
    const lastComma = amount.lastIndexOf(",");
    
    if (lastComma > lastDot) {
      // European: 1.234,56
      amount = amount.replace(/\./g, "").replace(",", ".");
    } else {
      // US: 1,234.56
      amount = amount.replace(/,/g, "");
    }
  } else if (amount.includes(",")) {
    // Only comma - check if it's likely a decimal separator
    const commaParts = amount.split(",");
    if (commaParts.length === 2 && commaParts[1].length <= 2) {
      // Likely decimal: 123,45
      amount = amount.replace(",", ".");
    } else {
      // Likely thousands separator: 1,234
      amount = amount.replace(/,/g, "");
    }
  }
  
  return parseFloat(amount);
}

export function generateCSV(transactions: ParsedTransaction[]): string {
  const headers = ["Data", "Descrição", "Categoria", "Tipo", "Valor"];
  
  const rows = transactions.map(t => [
    t.date,
    `"${t.description.replace(/"/g, '""')}"`,
    `"${(t.category || "Outros").replace(/"/g, '""')}"`,
    t.type,
    t.type === "income" ? t.amount.toFixed(2) : `-${t.amount.toFixed(2)}`,
  ]);
  
  return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
}
