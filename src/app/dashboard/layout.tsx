"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(true);
  const { user, signOut } = useAuth();

  useEffect(() => {
    const checkDevice = () => setIsMobile(window.innerWidth < 768);
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const navItems = [
    { href: "/dashboard", icon: "home", label: "Home" },
    { href: "/dashboard/transactions", icon: "receipt_long", label: "Transações" },
    { href: "/dashboard/goals", icon: "track_changes", label: "Metas" },
    { href: "/dashboard/budgets", icon: "pie_chart", label: "Orçamentos" },
    { href: "/dashboard/analytics", icon: "trending_up", label: "Análise" },
    { href: "/dashboard/profile", icon: "person", label: "Perfil" },
    { href: "/dashboard/settings", icon: "settings", label: "Definições" },
  ];

  // Don't wrap root dashboard - it has its own layout with sidebar
  if (pathname === "/dashboard") {
    return <>{children}</>;
  }

  if (isMobile) {
    return (
      <>
        {children}
        <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-between items-center px-2 pb-6 pt-2 bg-surface/80 backdrop-blur-xl rounded-t-[2rem]">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex flex-col items-center justify-center p-2 flex-1 ${pathname === item.href ? "text-primary" : "text-slate-500"}`}
            >
              <span className="material-symbols-outlined" style={pathname === item.href ? { fontVariationSettings: "'FILL' 1" } : {}}>{item.icon}</span>
              <span className="font-inter font-medium text-[9px] mt-1">{item.label}</span>
            </Link>
          ))}
        </nav>
      </>
    );
  }

  // Desktop layout with sidebar - includes dashboard root
  return (
    <div className="min-h-screen bg-surface">
      <aside className="fixed left-0 top-0 bottom-0 z-50 flex flex-col h-screen w-64 border-r border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
        <div className="p-8">
          <h1 className="text-xl font-bold tracking-tighter text-emerald-400">Fiscal Sanctuary</h1>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">Family Wealth</p>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-800/50 transition-all ${
                pathname === item.href 
                  ? "text-emerald-400 font-bold border-r-2 border-emerald-400 bg-emerald-400/5" 
                  : "text-slate-400"
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <main className="ml-64">
        {children}
      </main>
    </div>
  );
}