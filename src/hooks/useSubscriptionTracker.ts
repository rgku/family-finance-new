"use client";

import { useMemo } from "react";
import { useData } from "./DataProvider";

interface Subscription {
  id: string;
  name: string;
  amount: number;
  frequency: "monthly" | "yearly" | "weekly";
  category: string;
  lastCharged: string;
  daysSinceLastCharge: number;
  isActive: boolean;
  isZombie: boolean;
  icon: string;
  firstSeen: string;
  totalCharged: number;
}

interface SubscriptionTracker {
  subscriptions: Subscription[];
  totalMonthly: number;
  totalYearly: number;
  activeCount: number;
  zombieCount: number;
  potentialSavings: number;
}

const STREAMING_CATEGORIES = [
  "Netflix", "Spotify", "Disney+", "HBO", "Amazon Prime", "Apple TV",
  "YouTube Premium", "YouTube Music", "Tidal", "Deezer", "Xbox Game Pass",
  "PlayStation Plus", "Nintendo Online", "Adobe", "Microsoft 365",
  "Dropbox", "iCloud", "Google One", "VPN", "NordVPN",
];

export function useSubscriptionTracker(): SubscriptionTracker {
  const { transactions } = useData();

  return useMemo(() => {
    const now = new Date();

    const streamingTransactions = transactions.filter((t) =>
      t.type === "expense" &&
      STREAMING_CATEGORIES.some((cat) =>
        t.description?.toLowerCase().includes(cat.toLowerCase()) ||
        t.category?.toLowerCase().includes(cat.toLowerCase())
      )
    );

    const detectedSubscriptions = new Map<string, Subscription>();

    streamingTransactions.forEach((t) => {
      const key = t.category || t.description;
      if (!key) return;

      const existing = detectedSubscriptions.get(key);
      const transDate = new Date(t.date);

      if (existing) {
        if (transDate > new Date(existing.lastCharged)) {
          existing.lastCharged = t.date;
          existing.amount = t.amount;
        }
        existing.totalCharged += t.amount;
      } else {
        detectedSubscriptions.set(key, {
          id: t.id,
          name: key,
          amount: t.amount,
          frequency: "monthly",
          category: t.category || key,
          lastCharged: t.date,
          daysSinceLastCharge: Math.floor(
            (now.getTime() - transDate.getTime()) / (1000 * 60 * 60 * 24)
          ),
          isActive: true,
          isZombie: false,
          icon: "play_circle",
          firstSeen: t.date,
          totalCharged: t.amount,
        });
      }
    });

    const regularPattern = new Map<string, { amount: number; count: number; dates: Date[] }>();

    streamingTransactions.forEach((t) => {
      const key = t.category || t.description || "unknown";
      if (!regularPattern.has(key)) {
        regularPattern.set(key, { amount: t.amount, count: 1, dates: [new Date(t.date)] });
      } else {
        const entry = regularPattern.get(key)!;
        entry.count++;
        entry.dates.push(new Date(t.date));
      }
    });

    let zombieCount = 0;
    let potentialSavings = 0;

    const subscriptions: Subscription[] = Array.from(detectedSubscriptions.values()).map((sub) => {
      const pattern = regularPattern.get(sub.name);

      const daysSinceLastCharge = Math.floor(
        (now.getTime() - new Date(sub.lastCharged).getTime()) / (1000 * 60 * 60 * 24)
      );

      const isZombie = daysSinceLastCharge > 60 || (pattern ? pattern.count === 1 : false);
      sub.isZombie = isZombie;
      sub.daysSinceLastCharge = daysSinceLastCharge;

      if (isZombie) {
        zombieCount++;
        potentialSavings += sub.amount;
      }

      const iconMap: Record<string, string> = {
        "Netflix": "movie",
        "Spotify": "music_note",
        "Disney+": "movie",
        "HBO": "movie",
        "Amazon Prime": "shopping_bag",
        "YouTube": "play_circle",
        "Xbox": "sports_esports",
        "PlayStation": "sports_esports",
        "Microsoft": "computer",
        "Adobe": "design_services",
        "Dropbox": "cloud",
        "iCloud": "cloud",
        "VPN": "vpn_key",
      };

      sub.icon = iconMap[sub.name] || "subscriptions";

      return sub;
    });

    const activeSubscriptions = subscriptions.filter((s) => !s.isZombie);
    const totalMonthly = activeSubscriptions.reduce((sum, s) => sum + s.amount, 0);
    const totalYearly = totalMonthly * 12;

    return {
      subscriptions: subscriptions.sort((a, b) => b.amount - a.amount),
      totalMonthly,
      totalYearly,
      activeCount: activeSubscriptions.length,
      zombieCount,
      potentialSavings,
    };
  }, [transactions]);
}