"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { DesktopSidebar, MobileNav } from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const checkDevice = () => setIsMobile(window.innerWidth < 768);
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

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