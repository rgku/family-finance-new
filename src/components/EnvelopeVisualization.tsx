'use client';

import { useState } from 'react';
import { useData } from '@/hooks/DataProvider';
import { formatCurrencyWithSymbol } from '@/lib/utils';
import { CATEGORIES } from '@/lib/constants';
import { Eye, EyeOff, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';

interface EnvelopeCardProps {
  category: string;
  limit: number;
  spent: number;
  isVisible: boolean;
}

function EnvelopeCard({ category, limit, spent, isVisible }: EnvelopeCardProps) {
  const remaining = limit - spent;
  const percentage = Math.min((spent / limit) * 100, 100);
  const isOverBudget = spent > limit;
  
  const categoryInfo = CATEGORIES.find(c => c.name === category);
  const Icon = categoryInfo?.icon;
  
  // Cores baseadas na percentagem
  const getEnvelopeColor = () => {
    if (isOverBudget) return 'from-red-600 to-red-800';
    if (percentage >= 90) return 'from-red-400 to-red-600';
    if (percentage >= 80) return 'from-yellow-400 to-yellow-600';
    return 'from-green-400 to-green-600';
  };
  
  const getBarColor = () => {
    if (isOverBudget) return 'bg-red-500';
    if (percentage >= 90) return 'bg-red-400';
    if (percentage >= 80) return 'bg-yellow-400';
    return 'bg-green-500';
  };

  return (
    <div className="bg-surface-container rounded-2xl p-4 relative overflow-hidden shadow-md hover:shadow-lg transition-shadow">
      {/* Envelope Visual */}
      <div className="relative h-40 mb-4 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
        {/* Fundo do envelope (dinheiro restante) */}
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${getEnvelopeColor()} transition-all duration-700 ease-out`}
          style={{ height: `${isVisible ? Math.max(100 - percentage, 0) : 50}%` }}
        >
          {/* Ícone do envelope */}
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <span className="text-8xl">💰</span>
          </div>
        </div>
        
        {/* Linha de alerta aos 80% */}
        {percentage >= 80 && !isOverBudget && (
          <div className="absolute top-[20%] left-0 right-0 border-t-2 border-dashed border-yellow-500 z-10">
            <span className="absolute -top-6 right-0 text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded">
              80%
            </span>
          </div>
        )}
        
        {/* Indicador de estouro */}
        {isOverBudget && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Excedido!
          </div>
        )}
        
        {/* Valor restante sobreposto */}
        <div className="absolute bottom-4 left-4 right-4 text-center">
          <p className="text-3xl font-bold text-white drop-shadow-lg">
            {isVisible ? formatCurrencyWithSymbol(remaining) : '••••'}
          </p>
          <p className="text-xs text-white/80">restantes</p>
        </div>
      </div>
      
      {/* Info da categoria */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-on-surface-variant" />}
          <span className="font-semibold text-on-surface">{category}</span>
        </div>
        <button
          onClick={() => {}}
          className="text-on-surface-variant hover:text-on-surface"
        >
          {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>
      
      {/* Barra de progresso */}
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
        <div 
          className={`h-full ${getBarColor()} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {/* Detalhes */}
      <div className="flex justify-between text-sm">
        <span className="text-on-surface-variant">
          Gasto: {formatCurrencyWithSymbol(spent)}
        </span>
        <span className="text-on-surface-variant">
          Limite: {formatCurrencyWithSymbol(limit)}
        </span>
      </div>
      
      {/* Status message */}
      {isOverBudget ? (
        <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
          <TrendingDown className="w-3 h-3" />
          Excedeste o orçamento em {formatCurrencyWithSymbol(spent - limit)}
        </p>
      ) : percentage >= 80 ? (
        <p className="text-xs text-yellow-600 mt-2 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Atenção! Só faltam {formatCurrencyWithSymbol(remaining)}
        </p>
      ) : (
        <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          Tudo sob controlo
        </p>
      )}
    </div>
  );
}

export function EnvelopeVisualization() {
  const { budgets } = useData();
  const [showAmounts, setShowAmounts] = useState(true);
  const [filter, setFilter] = useState<'all' | 'critical' | 'ok'>('all');
  
  // Filtrar orçamentos válidos (com limite > 0)
  const validBudgets = budgets.filter(b => b.limit > 0);
  
  // Aplicar filtro
  const filteredBudgets = validBudgets.filter(b => {
    if (filter === 'critical') return b.spent >= b.limit * 0.8;
    if (filter === 'ok') return b.spent < b.limit * 0.8;
    return true;
  });
  
  // Ordenar: críticos primeiro (maior percentagem)
  const sortedBudgets = [...filteredBudgets].sort((a, b) => {
    const pctA = (a.spent / a.limit) * 100;
    const pctB = (b.spent / b.limit) * 100;
    return pctB - pctA;
  });
  
  const totalLimit = validBudgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = validBudgets.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalLimit - totalSpent;
  
  return (
    <div className="space-y-6">
      {/* Header com resumo */}
      <div className="bg-primary-container rounded-2xl p-6 text-center">
        <h2 className="text-2xl font-bold text-on-primary-container mb-2">
          Método Envelope
        </h2>
        <p className="text-on-primary-container/80 mb-4">
          Cada categoria é um envelope com dinheiro limitado
        </p>
        
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <p className="text-2xl font-bold">{formatCurrencyWithSymbol(totalLimit)}</p>
            <p className="text-sm opacity-80">Orçamento Total</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">{formatCurrencyWithSymbol(totalSpent)}</p>
            <p className="text-sm opacity-80">Gasto</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrencyWithSymbol(totalRemaining)}
            </p>
            <p className="text-sm opacity-80">Resta</p>
          </div>
        </div>
      </div>
      
      {/* Filtros e controles */}
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-primary text-on-primary' 
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            Todos ({validBudgets.length})
          </button>
          <button
            onClick={() => setFilter('critical')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'critical' 
                ? 'bg-red-500 text-white' 
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            ⚠️ Críticos ({validBudgets.filter(b => b.spent >= b.limit * 0.8).length})
          </button>
          <button
            onClick={() => setFilter('ok')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'ok' 
                ? 'bg-green-500 text-white' 
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            ✅ OK ({validBudgets.filter(b => b.spent < b.limit * 0.8).length})
          </button>
        </div>
        
        <button
          onClick={() => setShowAmounts(!showAmounts)}
          className="flex items-center gap-2 px-4 py-2 bg-surface-container rounded-lg hover:bg-surface-container-high transition-colors"
        >
          {showAmounts ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span className="text-sm">{showAmounts ? 'Ocultar' : 'Mostrar'} valores</span>
        </button>
      </div>
      
      {/* Grid de Envelopes */}
      {sortedBudgets.length === 0 ? (
        <div className="text-center py-12 text-on-surface-variant">
          <p className="text-lg mb-2">📭 Nenhum orçamento encontrado</p>
          <p>Cria orçamentos primeiro para usar o Método Envelope</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedBudgets.map(budget => (
            <EnvelopeCard
              key={budget.id}
              category={budget.category}
              limit={budget.limit}
              spent={budget.spent}
              isVisible={showAmounts}
            />
          ))}
        </div>
      )}
      
      {/* Dica educativa */}
      <div className="bg-tertiary-container rounded-xl p-4 text-on-tertiary-container">
        <h3 className="font-semibold mb-2">💡 Como funciona o Método Envelope?</h3>
        <p className="text-sm">
          Imagina que tens envelopes físicos para cada categoria de gastos. 
          Quando o dinheiro acaba no envelope, não podes gastar mais nessa categoria 
          até ao próximo mês. Esta visualização ajuda-te a ver exatamente quanto 
          "dinheiro" ainda tens em cada envelope!
        </p>
      </div>
    </div>
  );
}
