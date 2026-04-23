import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.6.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { priceId, userId, email, planType } = await req.json();

    if (!priceId || !userId || !email) {
      throw new Error('Missing required fields: priceId, userId, email');
    }

    // Validate userId format (UUID)
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(userId)) {
      throw new Error('Invalid userId format');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    // Validate priceId against allowed list
    const allowedPriceIds = (Deno.env.get('STRIPE_ALLOWED_PRICE_IDS') || '').split(',').filter(Boolean);
    if (allowedPriceIds.length > 0 && !allowedPriceIds.includes(priceId)) {
      throw new Error('Invalid priceId');
    }

    // Create Supabase client to verify user exists
    const supabaseClient = createSupabaseClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify user exists
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (!profile) {
      throw new Error('User not found');
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
    });

    // Check if customer exists
    let customerId = null;
    
    // Try to find existing customer by email
    const existingCustomers = await stripe.customers.list({ email });
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId || undefined,
      customer_email: customerId ? undefined : email,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${Deno.env.get('NEXT_PUBLIC_SITE_URL')}/dashboard/settings/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get('NEXT_PUBLIC_SITE_URL')}/dashboard/settings/subscription?canceled=true`,
      metadata: {
        userId,
        planType,
      },
      subscription_data: {
        trial_period_days: 14, // 14-day free trial
        metadata: {
          userId,
          planType,
        },
      },
      allow_promotion_codes: true, // Allow coupon codes
    });

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

function createSupabaseClient(url: string, key: string) {
  return {
    from: (table: string) => ({
      select: (columns: string) => ({
        eq: (column: string, value: any) => ({
          single: async () => {
            const response = await fetch(
              `${url}/rest/v1/${table}?${column}=eq.${value}`,
              {
                headers: {
                  apikey: key,
                  Authorization: `Bearer ${key}`,
                  Prefer: 'return=representation',
                },
              }
            );
            const data = await response.json();
            return { data: data[0], error: null };
          },
        }),
      }),
    }),
  };
}
