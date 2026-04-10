"use client";

import { usePathname } from "next/navigation";
import { DesktopSidebar, MobileNav } from "@/components/Sidebar";
import { useDeviceType } from "@/hooks/useDeviceType";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMobile = useDeviceType();

  if (pathname === "/dashboard" || pathname === "/dashboard/settings/reset-password") {
    return <>{children}</>;
  }

  if (isMobile) {
    return (
      <>
        <div className="pb-24">
          {children}
        </div>
        <MobileNav />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <DesktopSidebar />
      <main className="ml-64">
        {children}
      </main>
    </div>
  );
}