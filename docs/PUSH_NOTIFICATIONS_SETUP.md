# 🔔 Push Notifications Setup Guide

## Current Status

✅ **Database Schema** - Complete
✅ **Edge Function** - Deployed (send-notification)
✅ **Frontend UI** - Complete (/dashboard/alerts)
✅ **Frontend Hooks** - Complete

⚠️ **Push Service** - Placeholder (logs notifications but doesn't send)

---

## How It Works Now

When a notification is triggered:
1. Edge Function `send-notification` is called
2. Fetches user's push subscriptions from database
3. Checks user's notification preferences
4. **Currently:** Logs to console (doesn't actually send)
5. Returns success/failure count

---

## To Enable Real Push Notifications

### Option 1: Firebase Cloud Messaging (Recommended)

**Step 1: Set up Firebase Project**
1. Go to https://console.firebase.google.com
2. Create new project or use existing
3. Go to Project Settings → Cloud Messaging
4. Generate **Server Key** (legacy) or **Service Account** (new)

**Step 2: Update Edge Function**

Replace the `sendPushNotification` function in `supabase/functions/send-notification/index.ts`:

```typescript
const FCM_SERVER_KEY = Deno.env.get('FCM_SERVER_KEY')!;

async function sendPushNotification(endpoint: string, payload: any) {
  // Extract FCM token from endpoint
  const token = endpoint.split('/').pop();
  
  const response = await fetch(
    'https://fcm.googleapis.com/fcm/send',
    {
      method: 'POST',
      headers: {
        'Authorization': `key=${FCM_SERVER_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: token,
        notification: {
          title: payload.title,
          body: payload.body,
          click_action: payload.url,
        },
        data: payload,
      }),
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`FCM error: ${error}`);
  }
  
  return response.json();
}
```

**Step 3: Set Environment Variable**
```bash
npx supabase functions secrets set \
  FCM_SERVER_KEY=your_fcm_server_key_here
```

**Step 4: Update Frontend VAPID Keys**

Generate VAPID keys:
```bash
npx web-push generate-vapid-keys
```

Add to `.env.local`:
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
```

---

### Option 2: OneSignal (Easier, Free Tier)

**Step 1: Create OneSignal Account**
1. Go to https://onesignal.com
2. Create free account
3. Create new app (Web Push)
4. Get **App ID** and **REST API Key**

**Step 2: Update Edge Function**

```typescript
const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID')!;
const ONESIGNAL_API_KEY = Deno.env.get('ONESIGNAL_API_KEY')!;

async function sendPushNotification(endpoint: string, payload: any) {
  const response = await fetch(
    'https://onesignal.com/api/v1/notifications',
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${ONESIGNAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_player_ids: [endpoint], // OneSignal player ID
        headings: { en: payload.title },
        contents: { en: payload.body },
        url: payload.url,
      }),
    }
  );
  
  if (!response.ok) {
    throw new Error(`OneSignal error: ${response.status}`);
  }
  
  return response.json();
}
```

---

### Option 3: Use Supabase Realtime (Alternative)

Instead of push notifications, use Supabase Realtime for in-app notifications:

**Step 1: Create notifications table**
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT,
  body TEXT,
  url TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Step 2: Update Edge Function**
```typescript
// Instead of push, insert into notifications table
await supabaseClient.from('notifications').insert({
  user_id: userId,
  title,
  body,
  url,
});
```

**Step 3: Frontend Realtime Subscription**
```typescript
supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${user.id}`,
  }, (payload) => {
    // Show in-app notification
    showNotification(payload.new);
  })
  .subscribe();
```

---

## Testing Current Setup

Even without real push, you can test the flow:

1. Go to `/dashboard/alerts`
2. Click "Ativar Notificações" (browser will ask permission)
3. Toggle notification types on/off
4. Manually trigger notification:

```bash
curl -X POST https://pqsjmavtkcrnorjemasq.supabase.co/functions/v1/send-notification \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID",
    "title": "Test Notification",
    "body": "This is a test",
    "url": "/dashboard",
    "type": "budget_80_percent"
  }'
```

Check Edge Function logs in Supabase Dashboard to see if it was called.

---

## Recommendation

**For MVP/Launch:** Use **Option 3 (Supabase Realtime)**
- ✅ No external dependencies
- ✅ Works immediately
- ✅ In-app notifications are less intrusive
- ✅ Can add push later

**For Production:** Use **Option 1 (FCM)**
- ✅ Real push notifications
- ✅ Works when browser is closed
- ✅ Industry standard
- ⚠️ Requires Firebase setup

---

**Status:** Ready for in-app notifications (Option 3) or can be enhanced with FCM later.
