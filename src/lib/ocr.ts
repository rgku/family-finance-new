export interface OCRResult {
  merchant: string;
  total: number;
  date: string;
  rawText: string;
  confidence: number;
  suggestedCategory?: string;
}

const OCR_CONFIG = {
  MAX_MERCHANT_LENGTH: 50,
  MIN_MERCHANT_LENGTH: 3,
  MAX_MERCHANT_CANDIDATES: 3,
  MAX_TOTAL_VALUE: 10000,
  MIN_TOTAL_VALUE: 0.01,
  MAX_DATE_AGE_DAYS: 365,
} as const;

function isValidDate(year: number, month: number, day: number): boolean {
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && 
         date.getMonth() === month - 1 && 
         date.getDate() === day;
}

function parseMonetaryValue(str: string): number {
  const clean = str.replace(/\s*(€|EUR|euros?)?/gi, '').trim();
  
  const lastDot = clean.lastIndexOf('.');
  const lastComma = clean.lastIndexOf(',');
  
  let result: number;
  if (lastComma > lastDot) {
    result = parseFloat(clean.replace(/\./g, '').replace(',', '.'));
  } else {
    result = parseFloat(clean.replace(/,/g, ''));
  }
  
  return isNaN(result) ? 0 : result;
}

function sanitizeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

export function parseReceiptText(text: string): OCRResult {
  const sanitizedText = sanitizeText(text);
  const lines = sanitizedText.split('\n').filter(line => line.trim().length > 0);
  
  const merchant = extractMerchant(lines);
  const { total, confidence: totalConfidence } = extractTotal(sanitizedText);
  const date = extractDate(sanitizedText);
  const confidence = calculateConfidence(merchant, total, date);
  
  return {
    merchant,
    total,
    date,
    rawText: sanitizedText,
    confidence,
  };
}

function extractMerchant(lines: string[]): string {
  // Ignorar linhas muito curtas ou muito longas
  const candidateLines = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed.length > 3 && trimmed.length < 50;
  });
  
  // Primeiras 1-3 linhas são normalmente o merchant
  for (let i = 0; i < Math.min(3, candidateLines.length); i++) {
    const line = candidateLines[i].trim();
    
    // Ignorar linhas que parecem ser dados (datas, valores, etc.)
    if (isLikelyData(line)) {
      continue;
    }
    
    // Ignorar palavras comuns de recibos que não são o merchant
    const skipWords = ['total', 'subtotal', 'iva', 'tax', 'cash', 'card', 'visa', 
                       'mastercard', 'obrigado', 'volte', 'sempre', 'thanks', 'thank'];
    const lowerLine = line.toLowerCase();
    if (skipWords.some(word => lowerLine.includes(word))) {
      continue;
    }
    
    return line;
  }
  
  return lines[0]?.trim() || '';
}

function extractTotal(text: string): { total: number; confidence: number } {
  const allMatches: Array<{ value: number; confidence: number; isExplicitTotal: boolean; context: string }> = [];
  
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();
    
    // Ignorar linhas com "anterior", "pagamentos", "crédito", "débito anterior"
    if (lowerLine.includes('anterior') || lowerLine.includes('pagamentos') || 
        lowerLine.includes('crédito') || lowerLine.includes('credito') ||
        lowerLine.includes('somos a luz')) {
      continue;
    }
    
    // Procurar por "Esta fatura será cobrada" ou "FT" (número da fatura)
    const isCurrentInvoice = lowerLine.includes('esta fatura') || 
                             lowerLine.includes('ft ') || 
                             lowerLine.includes('ft2') ||
                             lowerLine.includes('total a pagar');
    
    // Extrair valores da linha
    const valuePatterns = [
      /(?:€|EUR)\s*([0-9]{1,3}(?:[.,\s][0-9]{3})*(?:[.,][0-9]{2})?)/gi,
      /([0-9]{1,3}(?:[.,\s][0-9]{3})*(?:[.,][0-9]{2})?)\s*(?:€|eur)/gi,
      /\b([0-9]{1,3}[.,][0-9]{2})\s*€\b/g,
    ];
    
    for (const pattern of valuePatterns) {
      const matches = [...line.matchAll(pattern)];
      for (const match of matches) {
        const value = parseMonetaryValue(match[1]);
        
        if (!isNaN(value) && value > OCR_CONFIG.MIN_TOTAL_VALUE && value < OCR_CONFIG.MAX_TOTAL_VALUE) {
          allMatches.push({
            value: Math.round(value * 100) / 100,
            confidence: isCurrentInvoice ? 0.95 : 0.7,
            isExplicitTotal: isCurrentInvoice || lowerLine.includes('total a pagar'),
            context: line.trim().substring(0, 50),
          });
        }
      }
    }
  }
  
  if (allMatches.length === 0) {
    return { total: 0, confidence: 0 };
  }
  
  // Priorizar totais explícitos da fatura atual
  const explicitTotals = allMatches.filter(m => m.isExplicitTotal);
  if (explicitTotals.length > 0) {
    // Se houver múltiplos totais explícitos, escolher o último (geralmente o mais relevante)
    const lastTotal = explicitTotals[explicitTotals.length - 1];
    return { total: lastTotal.value, confidence: lastTotal.confidence };
  }
  
  // Se não houver totais explícitos, retornar o valor mais alto
  const highestValue = allMatches.reduce((max, m) => m.value > max.value ? m : max);
  return { total: highestValue.value, confidence: highestValue.confidence * 0.8 };
}

function extractDate(text: string): string {
  const monthMap: Record<string, number> = {
    'jan': 1, 'janeiro': 1, 'january': 1,
    'fev': 2, 'fevereiro': 2, 'february': 2,
    'mar': 3, 'marco': 3, 'março': 3, 'march': 3,
    'abr': 4, 'abril': 4, 'april': 4, 'apr': 4,
    'mai': 5, 'maio': 5, 'may': 5,
    'jun': 6, 'junho': 6, 'june': 6,
    'jul': 7, 'julho': 7, 'july': 7,
    'ago': 8, 'agosto': 8, 'august': 8, 'aug': 8,
    'set': 9, 'setembro': 9, 'september': 9, 'sep': 9,
    'out': 10, 'outubro': 10, 'october': 10, 'oct': 10,
    'nov': 11, 'novembro': 11, 'november': 11,
    'dez': 12, 'dezembro': 12, 'december': 12, 'dec': 12,
  };
  
  const patterns = [
    /(\d{2})[\/\-](\d{2})[\/\-](\d{4})/,
    /(\d{4})[\/\-](\d{2})[\/\-](\d{2})/,
    /(\d{2})[\/\-](\d{2})[\/\-](\d{2})/,
    /(\d{1,2})\s*-\s*(\d{1,2})\s*-\s*(\d{4})/,
    /(\d{1,2})\s+de\s+([a-zA-Zçãõ]+)\s+de\s+(\d{4})/i,
    /([a-zA-Z]+)\s+(\d{1,2}),?\s+(\d{4})/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        let year: number, month: number, day: number;
        
        if (pattern.source.includes('de') || pattern.source.includes('[a-zA-Z]')) {
          const [, dayStr, monthStr, yearStr] = match;
          day = parseInt(dayStr);
          month = monthMap[monthStr.toLowerCase()] || 0;
          year = parseInt(yearStr);
        } else if (match[0].length >= 10) {
          if (match[1].length === 4) {
            year = parseInt(match[1]);
            month = parseInt(match[2]);
            day = parseInt(match[3]);
          } else {
            day = parseInt(match[1]);
            month = parseInt(match[2]);
            year = match[3].length === 2 ? 2000 + parseInt(match[3]) : parseInt(match[3]);
          }
        } else {
          day = parseInt(match[1]);
          month = parseInt(match[2]);
          year = 2000 + parseInt(match[3]);
        }
        
        if (year >= 2000 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          if (isValidDate(year, month, day)) {
            const date = new Date(year, month - 1, day);
            const today = new Date();
            const daysDiff = Math.abs((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysDiff < OCR_CONFIG.MAX_DATE_AGE_DAYS) {
              return date.toISOString().split('T')[0];
            }
          }
        }
      } catch {
        // Continuar para o próximo padrão
      }
    }
  }
  
  return new Date().toISOString().split('T')[0];
}

function isLikelyData(line: string): boolean {
  // Verificar se a linha parece ser um dado (não merchant)
  const patterns = [
    /^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/,  // Data
    /^\d{2}:\d{2}$/,                   // Hora
    /^\d+[.,]\d{2}\s*€?$/,            // Valor
    /^€?\s*\d+[.,]\d{2}$/,            // Valor com símbolo
    /^\d+$/,                          // Apenas números
    /^[A-Z]{2}\d+\s*[A-Z]{2}\d*$/,    // Matrícula ou código
  ];
  
  return patterns.some(pattern => pattern.test(line.trim()));
}

function calculateConfidence(merchant: string, total: number, date: string): number {
  let score = 0;
  let maxScore = 3;
  
  if (merchant && merchant.length > 2) score++;
  if (total > 0) score++;
  
  // Verificar se a data não é muito antiga ou futura
  const today = new Date();
  const extractedDate = new Date(date);
  const daysDiff = Math.abs((today.getTime() - extractedDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff < 365) score++;
  
  return score / maxScore;
}

export function suggestCategory(merchant: string, rawText: string): string {
  const text = (merchant + ' ' + rawText).toLowerCase();
  
  // Mapeamento de palavras-chave para categorias do FamFlow
  const categoryKeywords: Record<string, string[]> = {
    'Alimentação': ['continente', 'pingo doce', 'auchan', 'mercado', 'supermercado', 'fruta', 'legumes', 'carne', 'peixe', 'padaria', 'pastelaria', 'café', 'restaurante', 'pizza', 'burger'],
    'Transportes': ['galp', 'repsol', 'bp', 'cepsa', 'combustível', 'gasolina', 'gasóleo', 'uber', 'bolt', 'taxi', 'metro', 'comboio', 'autocarro', 'portagem'],
    'Saúde': ['farmácia', 'farmacia', 'hospital', 'clínica', 'clinica', 'médico', 'medico', 'dentista', 'enfermagem'],
    'Casa': [' Continente ', 'pingo', 'lar', 'casa', 'jardim', 'bricolage', 'leroy', 'worten', 'fnac', 'radio popular'],
    'Lazer': ['cinema', 'teatro', 'concerto', 'festival', 'parque', 'zoo', 'museu', 'ginásio', 'ginasio', 'desporto'],
    'Comunicações': ['vos', 'meo', 'nowo', 'vodafone', 'telekom', 'internet', 'telemóvel', 'telemovel'],
    'Educação': ['livraria', 'livros', 'escola', 'universidade', 'curso', 'formação'],
    'Vestuário': ['roupa', 'vestuário', 'vestuario', 'sapatos', 'calçado', 'zara', 'hm', 'primark', 'mango'],
  };
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return category;
    }
  }
  
  return '';
}
