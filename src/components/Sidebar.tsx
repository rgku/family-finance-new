"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, memo } from "react";

const navItemsMobile = [
  { href: "/dashboard", icon: "home", label: "Home" },
];

const navItemsSecondary = [
  { href: "/dashboard/analytics", icon: "trending_up", label: "Análise" },
  { href: "/dashboard/transactions", icon: "receipt_long", label: "Trans" },
  { href: "/dashboard/reports", icon: "assessment", label: "Relatórios" },
  { href: "/dashboard/goals", icon: "track_changes", label: "Metas" },
  { href: "/dashboard/budgets", icon: "pie_chart", label: "Orçamentos" },
];

const navItemsDesktop = [
  { href: "/dashboard", icon: "home", label: "Home" },
  { href: "/dashboard/transactions", icon: "receipt_long", label: "Transações" },
  { href: "/dashboard/analytics", icon: "trending_up", label: "Análise" },
  { href: "/dashboard/reports", icon: "assessment", label: "Relatórios" },
  { href: "/dashboard/profile", icon: "person", label: "Perfil" },
  { href: "/dashboard/goals", icon: "track_changes", label: "Metas" },
  { href: "/dashboard/budgets", icon: "pie_chart", label: "Orçamentos" },
  { href: "/dashboard/alerts", icon: "notifications", label: "Alertas" },
  { href: "/dashboard/family", icon: "group", label: "Família" },
  { href: "/dashboard/settings", icon: "settings", label: "Definições" },
];

interface DesktopSidebarProps {
  onSignOut?: () => void;
}

export function DesktopSidebar({ onSignOut }: DesktopSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-50 flex flex-col h-screen w-64 border-r border-slate-800/50 bg-slate-950/80 backdrop-blur-xl" role="navigation" aria-label="Navegação principal">
      <div className="p-8">
        <h1 className="text-xl font-bold tracking-tighter text-primary">FamFlow</h1>
        <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mt-1">Family Wealth</p>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {navItemsDesktop.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 hover:bg-surface-container-high transition-all ${
              pathname === item.href
                ? "text-primary font-bold border-r-2 border-primary bg-primary/5"
                : "text-on-surface-variant"
            }`}
            aria-current={pathname === item.href ? "page" : undefined}
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

function NavItem({ href, icon, label, isActive }: { href: string; icon: string; label: string; isActive: boolean }) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center py-2 px-1 flex-1 min-h-[56px] ${isActive ? "text-primary" : "text-on-surface-variant"}`}
    >
      <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "normal" }}>
        {icon}
      </span>
      <span className="font-inter font-medium text-[10px] mt-0.5">{label}</span>
    </Link>
  );
}

function NavItemSecondary({ href, icon, label, isActive, onClick }: { href: string; icon: string; label: string; isActive: boolean; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-3 rounded-xl ${isActive ? "bg-primary/20 text-primary" : "text-on-surface-variant"}`}
    >
      <span className="material-symbols-outlined text-[24px]">{icon}</span>
      <span className="font-inter font-medium text-[10px] mt-1">{label}</span>
    </Link>
  );
}

const NavItemMemo = memo(NavItem);
const NavItemSecondaryMemo = memo(NavItemSecondary);

const MobileNavComponent = function MobileNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-between items-center px-1 pb-6 pt-2 bg-surface/80 backdrop-blur-xl rounded-t-[2rem]" role="navigation" aria-label="Navegação principal">
        {navItemsMobile.map((item) => (
          <NavItemMemo key={item.href} {...item} isActive={pathname === item.href} />
        ))}
        
        <div className="flex-1 flex justify-center">
          <Link href="/dashboard/transaction/new" className="flex flex-col items-center justify-center -mt-6">
            <div className="w-12 h-12 bg-primary rounded-full shadow-lg shadow-primary/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
            </div>
          </Link>
        </div>
        
        <button
          onClick={() => setShowMore(v => !v)}
          className={`flex flex-col items-center justify-center py-2 px-1 flex-1 min-h-[56px] ${showMore ? "text-primary" : "text-on-surface-variant"}`}
          aria-label="Mais opções"
        >
          <span className="material-symbols-outlined text-[24px]">more_horiz</span>
          <span className="font-inter font-medium text-[10px] mt-0.5">Mais</span>
        </button>
      </nav>
      
      {showMore && (
        <div className="fixed bottom-20 left-0 right-0 z-40 mx-4 bg-surface-container rounded-2xl p-4 shadow-xl">
          <div className="grid grid-cols-4 gap-3">
            {navItemsSecondary.map((item) => (
              <NavItemSecondaryMemo 
                key={item.href} 
                {...item} 
                isActive={pathname === item.href} 
                onClick={() => setShowMore(false)} 
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export const MobileNav = memo(MobileNavComponent);

const MobileHeaderComponent = function MobileHeader({ hideNotifications = false }: { hideNotifications?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  
  return (
    <header className="fixed top-0 w-full z-50 bg-surface flex justify-between items-center px-4 py-3">
      <div className="flex-1">
        <span className="text-lg font-bold text-primary">FamFlow</span>
      </div>
      
      <div className="flex items-center gap-2">
        {!hideNotifications && (
          <Link 
            href="/dashboard/alerts" 
            className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center"
            aria-label="Notificações"
          >
            <span className="material-symbols-outlined text-primary">notifications</span>
          </Link>
        )}
        
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center"
          aria-label="Menu"
        >
          <span className="material-symbols-outlined text-primary">
            {menuOpen ? "close" : "menu"}
          </span>
        </button>
      </div>
      
      {menuOpen && (
        <div className="absolute top-full right-4 mt-2 w-48 bg-surface-container rounded-2xl shadow-xl py-2 z-50">
          <Link
            href="/dashboard/profile"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-on-surface hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined">person</span>
            <span>Perfil</span>
          </Link>
          <Link
            href="/dashboard/family"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-on-surface hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined">group</span>
            <span>Família</span>
          </Link>
          <Link
            href="/dashboard/settings"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-on-surface hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined">settings</span>
            <span>Definições</span>
          </Link>
          <Link
            href="/dashboard/alerts"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-on-surface hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined">notifications</span>
            <span>Alertas</span>
          </Link>
          <hr className="my-2 border-surface-container-high" />
          <button
            onClick={() => {
              setMenuOpen(false);
              // Sign out logic here
            }}
            className="flex items-center gap-3 px-4 py-3 text-error hover:bg-error/10 w-full"
          >
            <span className="material-symbols-outlined">logout</span>
            <span>Sair</span>
          </button>
        </div>
      )}
    </header>
  );
}

export const MobileHeader = memo(MobileHeaderComponent);

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