# 💳 Stripe Setup Guide - FamFlow

## Overview

This guide walks you through setting up Stripe for FamFlow Premium subscriptions.

---

## Step 1: Create Stripe Account

1. Go to https://stripe.com
2. Click "Sign up"
3. Choose **Individual** (for now)
4. Fill in:
   - Full name
   - Email
   - NIF (Portuguese tax ID)
   - Full address
5. Verify email

**Verification Time:** 1-3 business days

**Documents Needed:**
- Cartão de Cidadão (front & back)
- Comprovativo de morada (utility bill < 3 months)
- NIF

---

## Step 2: Get API Keys

1. **Go to:** Stripe Dashboard → Developers → API keys

2. **Copy keys:**
   - **Publishable key:** `pk_test_...`
   - **Secret key:** `sk_test_...`

3. **Add to `.env.local`:**
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

---

## Step 3: Create Products & Prices

### Product 1: FamFlow Premium

1. **Go to:** Products → Add product

2. **Fill in:**
   ```
   Name: FamFlow Premium
   Description: Gestão financeira familiar completa
   Pricing: Recurring
   Amount: €3.99
   Interval: Monthly
   ```

3. **Create another for Annual:**
   ```
   Amount: €39.99
   Interval: Yearly
   (2 months free)
   ```

4. **Copy Price IDs:**
   - Premium Monthly: `price_...` (looks like `price_1ABC123...`)
   - Premium Yearly: `price_...`

### Product 2: FamFlow Family

1. **Go to:** Products → Add product

2. **Fill in:**
   ```
   Name: FamFlow Family
   Description: Para famílias maiores
   Pricing: Recurring
   Amount: €6.99
   Interval: Monthly
   ```

3. **Create Annual:**
   ```
   Amount: €69.99
   Interval: Yearly
   ```

4. **Copy Price IDs**

---

## Step 4: Update Price IDs in Code

Edit `src/app/dashboard/settings/subscription/page.tsx`:

```typescript
const handleSubscribe = async (planId: string) => {
  setLoading(planId);
  try {
    const priceId = planId === 'premium' 
      ? 'price_1ABC123...' // Replace with YOUR Premium Price ID
      : 'price_1DEF456...'; // Replace with YOUR Family Price ID
    
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
```

---

## Step 5: Configure Webhooks

### 5.1 Deploy Webhook Endpoint

Already done! Your webhook endpoint is:
```
https://pqsjmavtkcrnorjemasq.supabase.co/functions/v1/stripe-webhook
```

### 5.2 Get Webhook Signing Secret

1. **Go to:** Developers → Webhooks → Add endpoint

2. **Fill in:**
   ```
   Endpoint URL: https://pqsjmavtkcrnorjemasq.supabase.co/functions/v1/stripe-webhook
   Events to listen:
     - checkout.session.completed
     - customer.subscription.updated
     - customer.subscription.deleted
     - invoice.payment_succeeded
     - invoice.payment_failed
   ```

3. **Click "Add endpoint"**

4. **Copy Signing Secret:** `whsec_...`

5. **Add to Supabase Secrets:**
   ```bash
   npx supabase functions secrets set \
     STRIPE_WEBHOOK_SECRET=whsec_...
   ```

---

## Step 6: Test in Test Mode

### Use Test Cards:

| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 0002` | Declined |
| `4000 0025 0000 0003` | Requires SCA |

**Any future expiry date**
**Any 3-digit CVC**

### Test Flow:

1. Go to `/dashboard/settings/subscription`
2. Click "Começar Trial Grátis" on Premium
3. Use test card `4242 4242 4242 4242`
4. Complete checkout
5. Check webhook logs in Stripe Dashboard
6. Verify subscription created in Supabase

---

## Step 7: Go Live

### Before Going Live:

1. **Complete Stripe verification** (submit documents)
2. **Test thoroughly** in test mode
3. **Update webhook endpoint** to live URL

### Switch to Live Mode:

1. **Get Live API Keys:**
   - Dashboard → Developers → API keys
   - Toggle to "Live mode"
   - Copy live keys

2. **Update `.env.local`:**
   ```env
   STRIPE_SECRET_KEY=sk_live_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```

3. **Create Live Products & Prices** (repeat Step 3 in live mode)

4. **Update Price IDs** in code (repeat Step 4)

5. **Configure Live Webhook:**
   - Add live webhook endpoint
   - Copy live signing secret
   - Update Supabase secret

6. **Redeploy:**
   ```bash
   npm run build
   ```

---

## Step 8: Environment Variables

### Local Development (`.env.local`):
```env
# Stripe Test Keys
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Production (Vercel/Netlify):
```env
# Stripe Live Keys
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Site URL
NEXT_PUBLIC_SITE_URL=https://famflow.app
```

---

## Testing Checklist

- [ ] Test Premium monthly checkout
- [ ] Test Family monthly checkout
- [ ] Test trial signup (14 days)
- [ ] Test successful payment webhook
- [ ] Test failed payment webhook
- [ ] Test subscription cancellation
- [ ] Test subscription update
- [ ] Verify plan updates in database
- [ ] Test Stripe Customer Portal

---

## Troubleshooting

### Webhook not firing?

1. Check webhook endpoint is public (not localhost)
2. Verify signing secret is correct
3. Check Edge Function logs in Supabase Dashboard
4. Test webhook manually with Stripe CLI

### Subscription not updating?

1. Check webhook events in Stripe Dashboard
2. Verify `user_id` in metadata
3. Check database logs for errors
4. Ensure migration was executed

### Checkout session fails?

1. Verify Price ID is correct
2. Check API keys are correct
3. Ensure email is valid
4. Check Edge Function logs

---

## Stripe CLI (Local Testing)

For local webhook testing:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to localhost
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
```

---

## Pricing Strategy Tips

### Recommended:

- **Free Trial:** 14 days (no credit card required)
- **Monthly:** €3.99 / €6.99
- **Annual:** €39.99 / €69.99 (save 17% = 2 months free)
- **Coupon Codes:** Create in Stripe Dashboard for promotions

### Future Enhancements:

- Family plan discounts for students
- Lifetime deal (early adopters)
- Team plan (€9.99/month, 20 members)

---

## Support

**Stripe Support:** https://support.stripe.com

**Questions?** Check logs:
- Stripe Dashboard → Developers → Logs
- Supabase Dashboard → Edge Functions → Logs

---

**Last Updated:** April 22, 2026
**Status:** Ready for testing (test mode)
