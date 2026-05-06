"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useSubscription, useCreateCheckoutSession, PLANS } from "@/hooks/useSubscription";
import { DesktopSidebar, MobileHeader, MobileNav } from "@/components/Sidebar";
import { useDeviceType } from "@/hooks/useDeviceType";
import { Icon } from "@/components/Icon";
import { formatCurrencyWithSymbol } from "@/lib/currency";

export default function SubscriptionPage() {
  const { signOut } = useAuth();
  const isMobile = useDeviceType();
  const { currentPlan, isLoading, trialEndsAt } = useSubscription();
  const createCheckout = useCreateCheckoutSession();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    setLoading(planId);
    try {
      const priceId = planId === 'premium' 
        ? 'price_premium_monthly' // Replace with actual Stripe Price ID
        : 'price_family_monthly';  // Replace with actual Stripe Price ID
      
      const { url } = await createCheckout.mutateAsync({
        priceId,
        planType: planId,
      });

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('Erro ao iniciar subscrição. Tenta novamente.');
    } finally {
      setLoading(null);
    }
  };

  const pageContent = (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-on-surface">Subscrição</h1>
        <p className="text-on-surface-variant">Gerencia o teu plano e subscrição</p>
      </header>

      {isLoading ? (
        <div className="text-center py-12 text-on-surface-variant">
          <p>A carregar...</p>
        </div>
      ) : (
        <div className="max-w-6xl">
          {/* Current Plan */}
          <div className="bg-surface-container rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-on-surface">Plano Atual</h2>
                <p className="text-3xl font-bold text-primary mt-2 capitalize">
                  {currentPlan === 'free' ? 'Free' : currentPlan === 'premium' ? 'Premium' : 'Family'}
                </p>
                {trialEndsAt && (
                  <p className="text-sm text-on-surface-variant mt-2">
                    Trial termina em: {new Date(trialEndsAt).toLocaleDateString('pt-PT')}
                  </p>
                )}
              </div>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                currentPlan === 'free' ? 'bg-surface-container-high' :
                currentPlan === 'premium' ? 'bg-primary/20' : 'bg-secondary/20'
              }`}>
                <Icon
                  name={currentPlan === 'free' ? 'free_breakfast' : 
                        currentPlan === 'premium' ? 'diamond' : 'groups'}
                  size={32}
                  className={currentPlan === 'free' ? 'text-on-surface-variant' :
                           currentPlan === 'premium' ? 'text-primary' : 'text-secondary'}
                />
              </div>
            </div>
          </div>

          {/* Plan Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-2xl p-6 border-2 transition-all ${
                  currentPlan === plan.id
                    ? 'border-primary bg-primary/5'
                    : 'border-surface-container-high bg-surface-container'
                }`}
              >
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-on-surface">{plan.name}</h3>
                  <div className="mt-2">
                    {plan.price === 0 ? (
                      <p className="text-3xl font-bold text-on-surface">Grátis</p>
                    ) : (
                      <>
                        <p className="text-3xl font-bold text-primary">
                          {formatCurrencyWithSymbol(plan.price)}
                        </p>
                        <p className="text-sm text-on-surface-variant">/mês</p>
                      </>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Icon
                        name="check_circle"
                        size={18}
                        className="text-primary mt-0.5 flex-shrink-0"
                      />
                      <span className="text-on-surface-variant">{feature}</span>
                    </li>
                  ))}
                </ul>

                {currentPlan !== plan.id && plan.id !== 'free' && (
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={loading === plan.id}
                    className={`w-full py-3 rounded-full font-bold transition-all ${
                      currentPlan === 'free'
                        ? 'bg-primary text-on-primary hover:brightness-110'
                        : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
                    } disabled:opacity-50`}
                  >
                    {loading === plan.id ? 'A processar...' : 
                     currentPlan === 'free' ? 'Começar Trial Grátis' : 'Mudar para ' + plan.name}
                  </button>
                )}

                {currentPlan === plan.id && (
                  <div className="w-full py-3 rounded-full font-bold text-center bg-primary/20 text-primary">
                    Plano Atual
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div className="bg-surface-container rounded-lg p-6">
            <h3 className="text-lg font-bold text-on-surface mb-4">Perguntas Frequentes</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-on-surface mb-1">
                  Como funciona o trial grátis de 14 dias?
                </h4>
                <p className="text-sm text-on-surface-variant">
                  Podes experimentar o plano Premium ou Family gratuitamente durante 14 dias. 
                  Não é necessário cartão de crédito. No final do trial, podes escolher continuar 
                  com o plano pago ou voltar ao plano Free.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-on-surface mb-1">
                  Posso cancelar a qualquer momento?
                </h4>
                <p className="text-sm text-on-surface-variant">
                  Sim! Podes cancelar a tua subscrição a qualquer momento. O acesso às funcionalidades 
                  premium mantém-se até ao final do período de faturação.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-on-surface mb-1">
                  Que métodos de pagamento são aceites?
                </h4>
                <p className="text-sm text-on-surface-variant">
                  Aceitamos todos os principais cartões de crédito (Visa, Mastercard, American Express) 
                  e débito. Os pagamentos são processados de forma segura pela Stripe.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-on-surface mb-1">
                  Posso mudar de plano depois?
                </h4>
                <p className="text-sm text-on-surface-variant">
                  Sim! Podes fazer upgrade ou downgrade do teu plano a qualquer momento nas 
                  definições da subscrição.
                </p>
              </div>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-8 text-center text-sm text-on-surface-variant">
            <p>Precisas de ajuda com a tua subscrição?</p>
            <p className="mt-1">
              Contacta-nos em{' '}
              <a href="mailto:suporte@famflow.app" className="text-primary hover:underline">
                suporte@famflow.app
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-surface">
        <MobileHeader onSignOut={signOut} />
        <main className="pt-20 px-4 pb-24 max-w-4xl mx-auto">
          {pageContent}
        </main>
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <DesktopSidebar onSignOut={signOut} />
      <main className="ml-64">{pageContent}</main>
    </div>
  );
}
