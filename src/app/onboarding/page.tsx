'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useSupabase } from '@/hooks/useSupabase';
import { EXPENSE_CATEGORIES } from '@/lib/constants';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, profile, updateProfile } = useAuth();
  const supabase = useSupabase();
  
  const [fullName, setFullName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [billingCycleDay, setBillingCycleDay] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Se já tem profile completo, redireciona para dashboard
    if (profile?.billing_cycle_day && profile.billing_cycle_day > 0) {
      router.push('/dashboard');
    }
  }, [profile, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Update profile with billing cycle
      await updateProfile({
        billing_cycle_day: billingCycleDay,
      });

      // 2. Create family if user wants
      if (selectedCategories.length > 0) {
        // Just save preferences for now, family creation can be done later
        console.log('Categories selected:', selectedCategories);
      }

      // 3. Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Onboarding error:', err);
      setError(err.message || 'Erro ao completar configuração');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  if (!user) {
    return null; // Will redirect via AuthProvider
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="font-headline text-3xl font-bold text-primary">
            Bem-vindo ao FamFlow! 🎉
          </h1>
          <p className="text-on-surface-variant mt-2">
            Vamos configurar a tua conta em menos de 1 minuto
          </p>
        </div>

        <div className="bg-surface-container rounded-2xl p-8 space-y-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Step 1: Nome */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-bold text-on-surface mb-2">
                1️⃣ Como te chamas?
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-on-surface"
                placeholder="O teu nome"
                required
              />
            </div>

            {/* Step 2: Ciclo de Faturação */}
            <div>
              <label className="block text-sm font-bold text-on-surface mb-3">
                2️⃣ Qual é o teu ciclo de faturação?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBillingCycleDay(1)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    billingCycleDay === 1
                      ? 'border-primary bg-primary/10'
                      : 'border-surface-container-high hover:border-primary/50'
                  }`}
                >
                  <p className="font-semibold text-on-surface">Início do mês</p>
                  <p className="text-sm text-on-surface-variant">Dia 1 ao último dia</p>
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycleDay(28)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    billingCycleDay === 28
                      ? 'border-primary bg-primary/10'
                      : 'border-surface-container-high hover:border-primary/50'
                  }`}
                >
                  <p className="font-semibold text-on-surface">Fim do mês</p>
                  <p className="text-sm text-on-surface-variant">Dia 28 ao dia 27</p>
                </button>
              </div>
            </div>

            {/* Step 3: Categorias Principais */}
            <div>
              <label className="block text-sm font-bold text-on-surface mb-3">
                3️⃣ Quais categorias queres acompanhar? (opcional)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {EXPENSE_CATEGORIES.filter(c => c.value !== 'Outros').map((category) => (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => toggleCategory(category.value)}
                    className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${
                      selectedCategories.includes(category.value)
                        ? 'border-primary bg-primary/10'
                        : 'border-surface-container-high hover:border-primary/50'
                    }`}
                  >
                    <span className="text-xl">{category.icon}</span>
                    <span className="text-sm font-medium text-on-surface">{category.value}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-on-surface-variant mt-2">
                Podes adicionar mais categorias depois nas definições
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-on-primary font-bold rounded-2xl hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'A configurar...' : 'Começar a usar! 🚀'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-on-surface-variant mt-6">
          Podes alterar estas definições a qualquer momento
        </p>
      </div>
    </div>
  );
}
