'use client';

import { useState } from 'react';
import { formatCurrencyWithSymbol } from '@/lib/currency';
import { EXPENSE_CATEGORIES } from '@/lib/constants';
import { Eye, EyeOff, TrendingDown, TrendingUp, AlertTriangle, Edit2, Trash2 } from 'lucide-react';

interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
}

interface EnvelopeVisualizationProps {
  budgets: Budget[];
  filterMode: 'all' | 'critical' | 'ok';
  showAmounts: boolean;
  onEdit: (budget: Budget) => void;
  onDelete: (id: string) => void;
}

interface EnvelopeCardProps {
  category: string;
  limit: number;
  spent: number;
  isVisible: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

function EnvelopeCard({ category, limit, spent, isVisible, onEdit, onDelete }: EnvelopeCardProps) {
  const remaining = limit - spent;
  const percentage = Math.min((spent / limit) * 100, 100);
  const isOverBudget = spent > limit;
  
  const categoryInfo = EXPENSE_CATEGORIES.find(c => c.value === category);
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
        <div className="flex gap-1">
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              title="Editar"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors"
              title="Apagar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
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

export function EnvelopeVisualization({ budgets, filterMode, showAmounts, onEdit, onDelete }: EnvelopeVisualizationProps) {
  // Filtrar orçamentos válidos (com limite > 0)
  const validBudgets = budgets.filter(b => b.limit > 0);
  
  // Aplicar filtro
  const filteredBudgets = validBudgets.filter(b => {
    if (filterMode === 'critical') return b.spent >= b.limit * 0.8;
    if (filterMode === 'ok') return b.spent < b.limit * 0.8;
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {sortedBudgets.length === 0 ? (
        <div className="col-span-full text-center py-12 text-on-surface-variant">
          <p className="text-lg mb-2">📭 {filterMode === 'all' ? 'Nenhum orçamento encontrado' : filterMode === 'critical' ? 'Nenhum orçamento crítico' : 'Nenhum orçamento OK'}</p>
          <p>{filterMode === 'all' ? 'Cria orçamentos primeiro para usar o Método Envelope' : 'Tenta outro filtro'}</p>
        </div>
      ) : (
        sortedBudgets.map(budget => (
          <EnvelopeCard
            key={budget.id}
            category={budget.category}
            limit={budget.limit}
            spent={budget.spent}
            isVisible={showAmounts}
            onEdit={() => onEdit?.(budget)}
            onDelete={() => onDelete?.(budget.id)}
          />
        ))
      )}
    </div>
  );
}
