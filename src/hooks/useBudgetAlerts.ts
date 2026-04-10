"use client";

import { useState, useEffect, useCallback } from "react";

export interface BudgetAlert {
  id: string;
  user_id: string;
  category: string;
  threshold_percent: number;
  alert_type: "warning" | "exceeded";
  notify_email: boolean;
  notify_in_app: boolean;
  last_sent: string | null;
  is_active: boolean;
  created_at: string;
}

export function useBudgetAlerts() {
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/family/alerts");
      const data = await res.json();
      
      if (res.ok) {
        setAlerts(data.alerts || []);
      }
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const createAlert = async (
    category: string,
    threshold: number = 80,
    alertType: "warning" | "exceeded" = "warning",
    notifyEmail: boolean = true,
    notifyInApp: boolean = true
  ) => {
    const res = await fetch("/api/family/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category,
        threshold_percent: threshold,
        alert_type: alertType,
        notify_email: notifyEmail,
        notify_in_app: notifyInApp,
      }),
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error);
    }
    
    await fetchAlerts();
    return data;
  };

  const updateAlert = async (alertId: string, updates: Partial<BudgetAlert>) => {
    const res = await fetch("/api/family/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        alertId,
        ...updates,
      }),
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error);
    }
    
    await fetchAlerts();
  };

  const deleteAlert = async (alertId: string) => {
    const res = await fetch(`/api/family/alerts?id=${alertId}`, {
      method: "DELETE",
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error);
    }
    
    await fetchAlerts();
  };

  const toggleAlert = async (alertId: string, isActive: boolean) => {
    await updateAlert(alertId, { is_active: isActive });
  };

  return {
    alerts,
    loading,
    createAlert,
    updateAlert,
    deleteAlert,
    toggleAlert,
    refresh: fetchAlerts,
  };
}