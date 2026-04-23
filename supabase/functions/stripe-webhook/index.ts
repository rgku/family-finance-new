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
    const body = await req.text();
    const signature = req.headers.get('stripe-signature')!;

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
    });

    let event: Stripe.Event;
    
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        Deno.env.get('STRIPE_WEBHOOK_SECRET')!
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const supabaseClient = createSupabaseClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check for duplicate event before processing
    const { data: existingEvent } = await supabaseClient
      .from('subscription_events')
      .select('id')
      .eq('stripe_event_id', event.id)
      .single();

    if (existingEvent) {
      return new Response(
        JSON.stringify({ received: true, duplicate: true }),
        { headers: corsHeaders, status: 200 }
      );
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Get user_id from metadata
        const userId = session.metadata?.userId;
        const planType = session.metadata?.planType || 'premium';
        
        if (userId) {
          // Update user's subscription
          await supabaseClient
            .from('profiles')
            .update({
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              stripe_price_id: session.line_items?.data[0]?.price?.id,
              subscription_status: session.status,
              plan: planType,
              trial_ends_at: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
            })
            .eq('id', userId);

          // Log event
          await supabaseClient.from('subscription_events').insert({
            user_id: userId,
            event_type: event.type,
            stripe_event_id: event.id,
            data: {
              sessionId: session.id,
              planType,
            },
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Find user by stripe_customer_id
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', subscription.customer)
          .single();

        if (profile) {
          // Determine plan from price_id
          let plan = 'free';
          if (subscription.items.data[0]?.price?.id?.includes('premium')) {
            plan = 'premium';
          } else if (subscription.items.data[0]?.price?.id?.includes('family')) {
            plan = 'family';
          }

          // Update subscription status
          await supabaseClient
            .from('profiles')
            .update({
              stripe_subscription_id: subscription.id,
              stripe_price_id: subscription.items.data[0]?.price?.id,
              subscription_status: subscription.status,
              plan: subscription.status === 'active' || subscription.status === 'trialing' ? plan : 'free',
              current_period_ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
            })
            .eq('id', profile.id);

          // Log event
          await supabaseClient.from('subscription_events').insert({
            user_id: profile.id,
            event_type: event.type,
            stripe_event_id: event.id,
            data: {
              subscriptionId: subscription.id,
              status: subscription.status,
              plan,
            },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Find user by stripe_customer_id
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', subscription.customer)
          .single();

        if (profile) {
          // Revert to free plan
          await supabaseClient
            .from('profiles')
            .update({
              plan: 'free',
              subscription_status: 'canceled',
              stripe_subscription_id: null,
              stripe_price_id: null,
            })
            .eq('id', profile.id);

          // Log event
          await supabaseClient.from('subscription_events').insert({
            user_id: profile.id,
            event_type: event.type,
            stripe_event_id: event.id,
            data: {
              subscriptionId: subscription.id,
            },
          });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Find user by stripe_customer_id
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', invoice.customer)
          .single();

        if (profile && invoice.subscription) {
          // Log successful payment
          await supabaseClient.from('subscription_events').insert({
            user_id: profile.id,
            event_type: event.type,
            stripe_event_id: event.id,
            data: {
              invoiceId: invoice.id,
              amountPaid: invoice.amount_paid,
              subscription: invoice.subscription,
            },
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Find user by stripe_customer_id
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', invoice.customer)
          .single();

        if (profile) {
          // Update status to past_due
          await supabaseClient
            .from('profiles')
            .update({
              subscription_status: 'past_due',
            })
            .eq('id', profile.id);

          // Log failed payment
          await supabaseClient.from('subscription_events').insert({
            user_id: profile.id,
            event_type: event.type,
            stripe_event_id: event.id,
            data: {
              invoiceId: invoice.id,
              amountDue: invoice.amount_due,
            },
          });
        }
        break;
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: corsHeaders, status: 200 }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: corsHeaders, status: 500 }
    );
  }
});

// Supabase client creator
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
        update: (data: any) => ({
          eq: (column: string, value: any) => ({
            then: async () => {
              await fetch(
                `${url}/rest/v1/${table}?${column}=eq.${value}`,
                {
                  method: 'PATCH',
                  headers: {
                    apikey: key,
                    Authorization: `Bearer ${key}`,
                    'Content-Type': 'application/json',
                    Prefer: 'return=representation',
                  },
                  body: JSON.stringify(data),
                }
              );
            },
          }),
        }),
        insert: (data: any) => ({
          then: async () => {
            await fetch(
              `${url}/rest/v1/${table}`,
              {
                method: 'POST',
                headers: {
                  apikey: key,
                  Authorization: `Bearer ${key}`,
                  'Content-Type': 'application/json',
                  Prefer: 'return=representation',
                },
                body: JSON.stringify(data),
              }
            );
          },
        }),
      }),
    }),
  };
}
