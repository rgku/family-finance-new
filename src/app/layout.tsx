import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { DataProvider } from "@/hooks/DataProvider";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://fiscalsanctuary.com'),
  title: {
    default: "Fiscal Sanctuary - Gestão Financeira Familiar",
    template: "%s | Fiscal Sanctuary"
  },
  description: "Aplicação de gestão financeira familiar em tempo real. Controle gastos, defina orçamentos, acompanhe metas e analise suas finanças com uma ferramenta intuitiva.",
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://fiscalsanctuary.com',
    siteName: 'Fiscal Sanctuary',
    title: 'Fiscal Sanctuary - Gestão Financeira Familiar',
    description: 'Controle suas finanças familiares em tempo real com orçamentos, metas e análise detalhada.',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fiscal Sanctuary',
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
    <html lang="pt-BR" className="dark">
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