"use client";

import { memo } from "react";
import { Icon } from "@/components/Icon";

interface LoadMoreProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  total: number;
  loaded: number;
}

export const LoadMore = memo(function LoadMore({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  total,
  loaded,
}: LoadMoreProps) {
  if (!hasNextPage) {
    return (
      <div className="text-center py-4 text-sm text-on-surface-variant">
        {loaded === 0 ? (
          <span>Sem transações para mostrar</span>
        ) : (
          <span>Todas as {total} transações carregadas</span>
        )}
      </div>
    );
  }

  return (
    <div className="text-center py-4 space-y-2">
      {isFetchingNextPage ? (
        <div className="flex items-center justify-center gap-2 text-on-surface-variant">
          <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
          <span className="text-sm">A carregar mais...</span>
        </div>
      ) : (
        <button
          onClick={() => fetchNextPage()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-surface-container-high text-on-surface rounded-full font-medium hover:bg-surface-container-highest transition-all text-sm"
        >
          <Icon name="expand_more" size={20} />
          Carregar mais ({loaded} de {total})
        </button>
      )}
    </div>
  );
});
