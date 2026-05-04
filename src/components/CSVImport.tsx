'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useToast } from '@/components/Toast';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X } from 'lucide-react';
import { formatCurrencyWithSymbol } from '@/lib/utils';

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category?: string;
  subcategory?: string;
  notes?: string;
}

interface CSVImportProps {
  onImport: (transactions: ParsedTransaction[]) => Promise<void>;
  onClose: () => void;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Alimentação': ['continente', 'pingo doce', 'auchan', 'mercado', 'supermercado', 'restaurante', 'café', 'pizza', 'mcdonalds', 'burger'],
  'Transportes': ['uber', 'bolt', 'tvde', 'comboio', 'cp', 'metro', 'autocarro', 'carro', 'gasolina', 'repsol', 'galp', 'bp'],
  'Casa': ['renda', 'condomínio', 'luz', 'água', 'gás', 'edp', 'epal', 'lisboagás', 'internet', 'nos', 'meo', 'vodafone'],
  'Saúde': ['farmácia', 'farmacia', 'hospital', 'médico', 'medico', 'consulta', 'exame', 'análise'],
  'Lazer': ['cinema', 'netflix', 'spotify', 'ginásio', 'gympass', 'jogo', 'livro', 'teatro', 'concerto'],
  'Compras': ['shopping', 'centro comercial', 'roupa', 'sapatos', 'eletrónica', 'amazon', 'worten', 'fnac'],
  'Educação': ['escola', 'universidade', 'curso', 'formação', 'livro', 'material escolar'],
  'Serviços': ['seguro', 'banco', 'comissão', 'taxa', 'subscrição', 'assinatura'],
  'Salário': ['salário', 'ordenado', 'vencimento', 'transferência'],
  'Investimentos': ['investimento', 'ações', 'fundos', 'poupança', 'depósito'],
};

function detectCategory(description: string): string {
  const desc = description.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => desc.includes(kw))) {
      return category;
    }
  }
  return 'Outros';
}

function parseCSVContent(content: string): ParsedTransaction[] {
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].toLowerCase().split(/[;,]/).map(h => h.trim());
  
  const dateIdx = headers.findIndex(h => h.includes('data') || h.includes('date'));
  const descIdx = headers.findIndex(h => h.includes('descrição') || h.includes('descricao') || h.includes('description') || h.includes('nome'));
  const amountIdx = headers.findIndex(h => h.includes('valor') || h.includes('amount') || h.includes('montante'));
  const typeIdx = headers.findIndex(h => h.includes('tipo') || h.includes('type'));
  const categoryIdx = headers.findIndex(h => h.includes('categoria') || h.includes('category'));

  const transactions: ParsedTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(/[;,]/).map(v => v.trim().replace(/^"|"$/g, ''));
    
    if (values.length < Math.max(dateIdx, descIdx, amountIdx) + 1) continue;

    let dateStr = values[dateIdx] || '';
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/');
      dateStr = `${year}-${month}-${day}`;
    }

    const amountStr = values[amountIdx]?.replace(/[€$]/g, '').replace(',', '.').trim();
    let amount = parseFloat(amountStr);
    
    if (isNaN(amount)) continue;

    let type: 'income' | 'expense' = amount >= 0 ? 'expense' : 'income';
    if (typeIdx >= 0) {
      const typeVal = values[typeIdx].toLowerCase();
      if (typeVal.includes('receita') || typeVal.includes('income') || typeVal.includes('positivo')) {
        type = 'income';
      } else if (typeVal.includes('despesa') || typeVal.includes('expense') || typeVal.includes('negativo')) {
        type = 'expense';
      }
    }

    const description = values[descIdx] || 'Sem descrição';
    const category = categoryIdx >= 0 && values[categoryIdx] ? values[categoryIdx] : detectCategory(description);

    transactions.push({
      date: dateStr,
      description,
      amount: Math.abs(amount),
      type,
      category,
    });
  }

  return transactions;
}

export function CSVImport({ onImport, onClose }: CSVImportProps) {
  const { showToast } = useToast();
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedTransaction[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setFileName(file.name);
    setParsing(true);

    try {
      const content = await file.text();
      const transactions = parseCSVContent(content);

      if (transactions.length === 0) {
        showToast('Nenhuma transação válida encontrada', 'error');
        return;
      }

      setParsed(transactions);
      showToast(`${transactions.length} transações encontradas!`, 'success');
    } catch (error) {
      console.error('Error parsing CSV:', error);
      showToast('Erro ao processar ficheiro', 'error');
    } finally {
      setParsing(false);
    }
  }, [showToast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
  });

  const handleImport = async () => {
    if (!parsed) return;

    setImporting(true);
    try {
      await onImport(parsed);
      showToast(`${parsed.length} transações importadas!`, 'success');
      onClose();
    } catch (error) {
      console.error('Error importing transactions:', error);
      showToast('Erro ao importar transações', 'error');
    } finally {
      setImporting(false);
    }
  };

  const totalIncome = parsed?.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0) || 0;
  const totalExpenses = parsed?.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0) || 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-auto">
        <div className="p-6 border-b border-surface-container-high flex justify-between items-center">
          <h2 className="text-xl font-bold">Importar CSV</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-container-high rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!parsed ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-surface-container-high hover:border-primary'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-16 h-16 mx-auto mb-4 text-on-surface-variant" />
              <p className="text-lg font-semibold mb-2">
                {isDragActive ? 'Solta o ficheiro aqui' : 'Arrasta o ficheiro CSV'}
              </p>
              <p className="text-sm text-on-surface-variant mb-4">
                ou clica para selecionar
              </p>
              <p className="text-xs text-on-surface-variant">
                Formato: Data, Descrição, Valor, Tipo (opcional), Categoria (opcional)
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-surface-container-low p-4 rounded-xl">
                <FileSpreadsheet className="w-10 h-10 text-green-500" />
                <div className="flex-1">
                  <p className="font-semibold">{fileName}</p>
                  <p className="text-sm text-on-surface-variant">
                    {parsed.length} transações encontradas
                  </p>
                </div>
                <button
                  onClick={() => {
                    setParsed(null);
                    setFileName(null);
                  }}
                  className="p-2 hover:bg-surface-container-high rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl">
                  <p className="text-sm text-green-700 dark:text-green-400">Receitas</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrencyWithSymbol(totalIncome)}
                  </p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl">
                  <p className="text-sm text-red-700 dark:text-red-400">Despesas</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {formatCurrencyWithSymbol(totalExpenses)}
                  </p>
                </div>
              </div>

              <div className="border border-surface-container-high rounded-xl overflow-hidden">
                <div className="bg-surface-container-low p-3 font-semibold text-sm">
                  Pré-visualização (primeiras 5 transações)
                </div>
                <div className="divide-y divide-surface-container-high">
                  {parsed.slice(0, 5).map((t, idx) => (
                    <div key={idx} className="p-3 flex justify-between items-center text-sm">
                      <div>
                        <p className="font-medium">{t.date} - {t.description}</p>
                        <p className="text-xs text-on-surface-variant">{t.category}</p>
                      </div>
                      <p className={`font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrencyWithSymbol(t.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="flex-1 py-3 bg-primary text-on-primary font-bold rounded-full hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {importing ? 'A importar...' : `Importar ${parsed.length} transações`}
                </button>
                <button
                  onClick={() => {
                    setParsed(null);
                    setFileName(null);
                  }}
                  className="px-6 py-3 bg-surface-container-high text-on-surface font-bold rounded-full"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
