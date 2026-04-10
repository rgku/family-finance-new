"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", icon: "home", label: "Home" },
  { href: "/dashboard/transactions", icon: "receipt_long", label: "Transações" },
  { href: "/dashboard/goals", icon: "track_changes", label: "Metas" },
  { href: "/dashboard/analytics", icon: "trending_up", label: "Análise" },
  { href: "/dashboard/profile", icon: "person", label: "Perfil" },
  { href: "/dashboard/settings", icon: "settings", label: "Definições" },
];

const navItemsDesktop = [
  { href: "/dashboard", icon: "home", label: "Home" },
  { href: "/dashboard/transactions", icon: "account_balance_wallet", label: "Transações" },
  { href: "/dashboard/goals", icon: "track_changes", label: "Metas" },
  { href: "/dashboard/budgets", icon: "pie_chart", label: "Orçamentos" },
  { href: "/dashboard/analytics", icon: "trending_up", label: "Análise" },
  { href: "/dashboard/profile", icon: "person", label: "Perfil" },
  { href: "/dashboard/settings", icon: "settings", label: "Definições" },
];

interface DesktopSidebarProps {
  onSignOut?: () => void;
}

export function DesktopSidebar({ onSignOut }: DesktopSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-50 flex flex-col h-screen w-64 border-r border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
      <div className="p-8">
        <h1 className="text-xl font-bold tracking-tighter text-primary">Fiscal Sanctuary</h1>
        <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mt-1">Family Wealth</p>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {navItemsDesktop.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 hover:bg-surface-container-high transition-all ${
              pathname === item.href
                ? "text-primary font-bold border-r-2 border-primary bg-primary/5"
                : "text-on-surface-variant"
            }`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      {onSignOut && (
        <div className="p-4">
          <button
            onClick={onSignOut}
            className="w-full py-3 bg-surface-container text-on-surface rounded-lg text-sm font-medium hover:bg-surface-variant transition-colors"
          >
            Sair
          </button>
        </div>
      )}
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-between items-center px-2 pb-6 pt-2 bg-surface/80 backdrop-blur-xl rounded-t-[2rem]">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex flex-col items-center justify-center p-2 flex-1 ${
            pathname === item.href ? "text-primary" : "text-on-surface-variant"
          }`}
        >
          <span
            className="material-symbols-outlined"
            style={pathname === item.href ? { fontVariationSettings: "'FILL' 1" } : {}}
          >
            {item.icon}
          </span>
          <span className="font-inter font-medium text-[9px] mt-1">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

export function MobileHeader({ hideProfile = false, hideSettings = false }: { hideProfile?: boolean; hideSettings?: boolean }) {
  return (
    <header className="fixed top-0 w-full z-50 bg-surface flex justify-between items-center px-6 py-4">
      {!hideProfile && (
        <Link href="/dashboard/profile" className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden">
          <span className="material-symbols-outlined text-primary">person</span>
        </Link>
      )}
      {!hideSettings && (
        <Link href="/dashboard/settings" className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden">
          <span className="material-symbols-outlined text-primary">settings</span>
        </Link>
      )}
    </header>
  );
}

export function FABNewTransaction() {
  return (
    <Link
      href="/dashboard/transaction/new"
      className="flex flex-col items-center justify-center p-2 flex-1 -mt-6"
    >
      <div className="w-12 h-12 bg-primary rounded-full shadow-lg shadow-primary/30 flex items-center justify-center">
        <span className="material-symbols-outlined text-on-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
          add
        </span>
      </div>
    </Link>
  );
}

export { navItems };