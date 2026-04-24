"use client";

import { DesktopSidebar, MobileNav } from "@/components/Sidebar";
import { useAuth } from "@/components/AuthProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { signOut } = useAuth();
  
  return (
    <>
      <DesktopSidebar onSignOut={signOut} />
      <div className="ml-64 min-h-screen bg-surface">
        {children}
      </div>
      <MobileNav />
    </>
  );
}
