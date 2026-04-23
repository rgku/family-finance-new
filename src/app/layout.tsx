import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { DataProvider } from "@/hooks/DataProvider";
import { SWRegistration } from "@/components/SWRegistration";
import { TanStackProvider } from "@/components/TanStackProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OneSignalProvider } from "@/components/OneSignalProvider";
import { ToastProvider } from "@/components/Toast";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://famflow.app'),
  title: {
    default: "FamFlow - Family Financial Management",
    template: "%s | FamFlow"
  },
  description: "Family finance management app. Track expenses, set budgets, monitor goals and analyze your family finances in real-time.",
  robots: { index: true, follow: true },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FamFlow',
  },
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
    { rel: 'icon', url: '/icon.svg' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-PT" className={`dark ${manrope.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-surface text-on-surface min-h-screen antialiased font-sans" suppressHydrationWarning>
        <OneSignalProvider>
          <SWRegistration />
          <ErrorBoundary>
            <TanStackProvider>
              <AuthProvider>
                <DataProvider>
                  <ToastProvider>
                    {children}
                  </ToastProvider>
                </DataProvider>
              </AuthProvider>
            </TanStackProvider>
          </ErrorBoundary>
        </OneSignalProvider>
      </body>
    </html>
  );
}