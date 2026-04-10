import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { DataProvider } from "@/hooks/DataProvider";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://famflow.app'),
title: {
    default: "FamFlow - Family Financial Management",
    template: "%s | FamFlow"
  },
  description: "Family finance management app. Track expenses, set budgets, monitor goals and analyze your family finances in real-time.",
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'pt_PT',
    url: 'https://famflow.app',
    siteName: 'FamFlow',
    title: 'FamFlow - Gestão Financeira Familiar',
    description: 'Controle suas finanças familiares em tempo real com orçamentos, metas e análise detalhada.',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FamFlow',
    description: 'Gestão financeira familiar em tempo real',
  },
  icons: [
    { rel: 'icon', url: '/favicon.ico' },
    { rel: 'apple-touch-icon', url: '/apple-touch-icon.png' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-PT" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,0" rel="stylesheet" />
      </head>
      <body className="bg-surface text-on-surface min-h-screen antialiased">
        <AuthProvider>
          <DataProvider>
            {children}
          </DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}