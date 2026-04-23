# 🚀 Quick Setup Guide - In-App Notifications

## What You Get

✅ Real-time in-app notifications
✅ Notification bell with unread count
✅ Auto-notifications for budget thresholds (80%, 100%)
✅ Auto-notifications for goals achieved
✅ Browser notifications (optional)
✅ Notification preferences UI

---

## Step 1: Execute Database Migration

**File:** `supabase/migrations/20270425000000_inapp_notifications.sql`

1. Go to Supabase Dashboard → SQL Editor
2. Copy the entire content of the file
3. Paste and click "Run"
4. Verify success message

This creates:
- `notifications` table
- `create_notification()` function
- Triggers for budget/goal notifications

---

## Step 2: Test Notifications

### Test Manually:

```sql
-- Send yourself a test notification
SELECT create_notification(
  auth.uid(),  -- or specific user UUID
  'Test Notification',
  'This is a test notification body',
  '/dashboard',
  'test'
);
```

### Test via UI:

1. Go to `/dashboard/budgets`
2. Create a budget (e.g., €100 for "Alimentação")
3. Add expenses that reach 80% (€80)
4. Check notification bell in header
5. You should see a notification!

---

## How It Works

### Real-time Flow:

1. **User performs action** (add expense, create goal, etc.)
2. **Database trigger fires** (if threshold reached)
3. **Notification inserted** into `notifications` table
4. **Supabase Realtime** pushes to connected clients
5. **NotificationBell component** receives update
6. **Badge updates** and notification appears

### Notification Types:

| Type | Trigger | Message |
|------|---------|---------|
| `budget_80_percent` | Budget reaches 80% | "Atingiste X% do orçamento para [category]" |
| `budget_100_percent` | Budget exceeds 100% | "Ultrapassaste o limite para [category]" |
| `goal_achieved` | Goal reaches 100% | "Parabéns! Completaste a meta [name]" |
| `recurring_reminder` | Recurring transaction due | "Tens uma despesa recorrente para registrar" |

---

## Features

### Notification Bell (Header)

- **Badge** shows unread count
- **Dropdown** shows last 50 notifications
- **Blue dot** indicates unread
- **Click** to mark as read
- **"Mark all as read"** button
- **Delete** individual notifications

### Notification Preferences

Go to `/dashboard/alerts` to:
- Enable/disable notification types
- Toggle budget alerts (80%, 100%)
- Toggle goal achievement alerts
- Toggle recurring reminders
- Toggle weekly summary (future)
- Toggle inactivity reminders (future)

---

## Browser Notifications (Optional)

To enable browser notifications (works even when tab is in background):

1. Click notification bell
2. Browser will ask permission
3. Click "Allow"
4. Now you'll get system notifications!

---

## Customization

### Add More Triggers

Edit `supabase/migrations/20270425000000_inapp_notifications.sql`:

```sql
-- Example: New transaction notification
CREATE OR REPLACE FUNCTION notify_new_transaction()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_notification(
    NEW.user_id,
    'Nova transação',
    FORMAT('Adicionaste %s de €%s', NEW.type, NEW.amount),
    '/dashboard/transactions',
    'new_transaction'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Change Notification Limit

Default is 50 notifications. Change in `useNotifications.ts`:

```typescript
.limit(50) // Change to 100 or any number
```

---

## Troubleshooting

### Notifications not appearing?

1. Check if migration was executed
2. Check Realtime is enabled in Supabase Dashboard:
   - Database → Replication → Enable for `notifications` table
3. Check browser console for errors
4. Verify user is logged in

### Badge not updating?

1. Check `useNotifications` hook is imported
2. Verify `NotificationBell` is in Sidebar
3. Check Realtime subscription is active

### Want to disable browser notifications?

Remove this code from `useNotifications.ts`:

```typescript
// Show browser notification if supported
if ('Notification' in window && Notification.permission === 'granted') {
  // ... remove this block
}
```

---

## Next Steps

1. ✅ Execute migration
2. ✅ Test with budget trigger
3. ✅ Customize as needed
4. 🎉 Enjoy real-time notifications!

---

**Questions?** Check `IMPLEMENTATION_LOG.md` for full details.
