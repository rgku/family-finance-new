'use client';

import { EnvelopeVisualization } from '@/components/EnvelopeVisualization';
import { AppShell } from '@/components/layout/AppShell';
import { AppHeader } from '@/components/layout/AppHeader';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EnvelopePage() {
  return (
    <AppShell>
      <AppHeader 
        title="Método Envelope" 
        showBack
        action={
          <Link 
            href="/dashboard/budgets"
            className="p-2 hover:bg-surface-container rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        }
      />
      
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <EnvelopeVisualization />
      </div>
    </AppShell>
  );
}
