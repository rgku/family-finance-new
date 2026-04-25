"use client";

import { memo } from "react";
import { formatCurrencyWithSymbol } from "@/lib/currency";
import { Icon } from "@/components/Icon";

interface AIAlert {
  type: "alert";
  title: string;
  description: string;
  category?: string;
  amount?: number;
  percentage?: number;
  previousAmount?: number;
  threshold?: number;
  severity?: "high" | "medium" | "low";
}

interface AIAlertsCardProps {
  alerts: AIAlert[];
}

function getSeverityColor(severity?: "high" | "medium" | "low"): string {
  switch (severity) {
    case "high":
      return "border-red-500/50 bg-red-500/10";
    case "medium":
      return "border-amber-500/50 bg-amber-500/10";
    default:
      return "border-orange-500/50 bg-orange-500/10";
  }
}

function getSeverityIcon(severity?: "high" | "medium" | "low"): string {
  switch (severity) {
    case "high":
      return "error";
    case "medium":
      return "warning";
    default:
      return "info";
  }
}

export const AIAlertsCard = memo(function AIAlertsCard({ alerts }: AIAlertsCardProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="warning" size={20} className="text-red-500" />
        <p className="text-sm font-bold text-on-surface">Alertas de Padrões Anómalos</p>
      </div>

      <div className="space-y-3">
        {alerts.map((alert, idx) => {
          const severity = alert.severity || "medium";
          const borderColor = getSeverityColor(severity);
          const icon = getSeverityIcon(severity);

          return (
            <div key={idx} className={`flex items-start gap-3 p-4 rounded-lg border ${borderColor}`}>
              <Icon name={icon} size={20} className={`${severity === "high" ? "text-red-500" : severity === "medium" ? "text-amber-500" : "text-orange-500"} shrink-0 mt-0.5`} />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-on-surface">{alert.title}</p>
                <p className="text-xs text-on-surface-variant mt-1">{alert.description}</p>
                
                {alert.percentage !== undefined && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs font-bold ${alert.percentage > 40 ? "text-red-500" : alert.percentage > 20 ? "text-amber-500" : "text-orange-500"}`}>
                      {alert.percentage > 0 ? "+" : ""}{alert.percentage.toFixed(0)}%
                    </span>
                    <span className="text-xs text-on-surface-variant">vs mês passado</span>
                  </div>
                )}

                {alert.amount !== undefined && alert.previousAmount !== undefined && (
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <span className="text-on-surface-variant">
                      {formatCurrencyWithSymbol(alert.previousAmount)} → {formatCurrencyWithSymbol(alert.amount)}
                    </span>
                  </div>
                )}

                {alert.threshold !== undefined && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-amber-500">
                    <Icon name="info" size={12} />
                    <span>Limite: {alert.threshold}%</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-on-surface-variant mt-4 pt-3 border-t border-red-500/20">
        Estes alertas são baseados nos teus padrões de gastos e comparações com meses anteriores.
      </p>
    </div>
  );
});
