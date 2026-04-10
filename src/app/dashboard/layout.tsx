"use client";

import { usePathname } from "next/navigation";
import { DesktopSidebar, MobileNav, MobileHeader } from "@/components/Sidebar";
import { useDeviceType } from "@/hooks/useDeviceType";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMobile = useDeviceType();

  if (pathname === "/dashboard" || pathname === "/dashboard/settings/reset-password") {
    return (
      <>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:p-4 focus:bg-primary focus:text-on-primary focus:z-50">
          Saltar para conteúdo principal
        </a>
        {isMobile && <MobileHeader />}
        {children}
      </>
    );
  }

  if (isMobile) {
    return (
      <>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:p-4 focus:bg-primary focus:text-on-primary focus:z-50">
          Saltar para conteúdo principal
        </a>
        <MobileHeader />
        <div className="pb-24 pt-16">
          {children}
        </div>
        <MobileNav />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <a href="#main-content" className="sr-only focus:fixed focus:p-4 focus:bg-primary focus:text-on-primary focus:z-50 focus:top-2 focus:left-2">
          Saltar para conteúdo principal
        </a>
      <DesktopSidebar />
      <main className="ml-64" id="main-content" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}