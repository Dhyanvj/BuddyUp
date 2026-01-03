# Realtime Notifications Fix Guide

## Problem
Supabase Realtime notifications were not working because the `notifications` table didn't have Realtime enabled.

## Solution Applied

### 1. ✅ Created SQL Migration
A new file `Enable Notifications Realtime.sql` has been created with the necessary SQL commands.

### 2. ✅ Updated Documentation
Updated `Realtime Setup.md` to include the notifications table in the list of tables that need Realtime enabled.

### 3. ✅ Added Debug Logging
Enhanced logging throughout the notification system with emojis for easy identification:
- 🔔 = Realtime events
- ✅ = Success
- ❌ = Error
- 🔕 = Unsubscribe
- ⚠️ = Warning

## Steps to Fix (Required)

### Step 1: Enable Realtime in Supabase

**Option A: Using Supabase Dashboard (Recommended)**
1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Database → Replication**
4. Find the **notifications** table
5. Toggle the switch to **enable** replication
6. Wait for the confirmation message

**Option B: Using SQL Editor**
1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `Enable Notifications Realtime.sql`:
   ```sql
   ALTER TABLE notifications REPLICA IDENTITY FULL;
   ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
   ```
5. Click **Run**
6. You should see "Success. No rows returned"

### Step 2: Verify Realtime is Enabled

Run this query in the SQL Editor to confirm:
```sql
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'notifications';
```

You should see:
```
schemaname | tablename
-----------+--------------
public     | notifications
```

### Step 3: Test the Fix

1. **Restart your Expo app**:
   ```bash
   # Press Ctrl+C to stop
   # Then restart
   npx expo start
   ```

2. **Open the app and check the terminal/console for logs**:
   - Look for: `🔔 [Realtime] Setting up notification subscription`
   - Look for: `✅ [Realtime] Successfully subscribed to notifications channel`

3. **Create a test notification**:
   - Go to your Supabase Dashboard
   - Navigate to **Table Editor → notifications**
   - Click **Insert Row**
   - Fill in:
     - `user_id`: Your user ID (copy from the profiles table)
     - `type`: `test`
     - `title`: `Test Notification`
     - `body`: `Testing realtime notifications`
     - `read`: `false`
   - Click **Save**

4. **Check your app**:
   - The notification should appear **instantly** in the Notifications screen
   - Check the console for: `🔔 [Realtime] New notification INSERT event:`
   - The unread count should update automatically

## Debugging

### If notifications still don't appear:

1. **Check Console Logs**:
   - Look for `✅ [Realtime] Successfully subscribed` - if missing, subscription failed
   - Look for `❌ [Realtime] Channel error` - indicates connection issues
   - Look for `⏱️ [Realtime] Subscription timed out` - network/config issue

2. **Verify Realtime is enabled**:
   ```sql
   SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
   ```
   Should show notifications table.

3. **Check Supabase Status**:
   - Verify your Supabase project is running
   - Check for any service outages

4. **Test with Manual Insert**:
   - Insert a notification directly in Supabase
   - Check if it appears in the app immediately

### Common Issues:

**Issue**: `CHANNEL_ERROR` in logs
- **Fix**: Check your Supabase URL and anon key in `.env`

**Issue**: Subscription times out
- **Fix**: Check your internet connection and Supabase project status

**Issue**: Notifications appear only on refresh
- **Fix**: Realtime not enabled - follow Step 1 again

## What Should Work Now:

✅ **Instant notification delivery** when app is open  
✅ **Real-time unread count updates**  
✅ **No need to pull-to-refresh**  
✅ **Automatic UI updates** when notifications are read/deleted  
✅ **Multiple device sync** - changes on one device appear on others instantly

## Additional Notes:

- **Firebase FCM** (push notifications when app is closed) is separate and handled differently
- **Supabase Realtime** only works when the app is **open and running**
- The debug logs will help you identify any connection issues
- If you see `🔔` emojis in your logs, the subscription is working!

## Files Modified:

1. ✅ `Enable Notifications Realtime.sql` - New SQL migration file
2. ✅ `Realtime Setup.md` - Updated documentation
3. ✅ `src/services/notificationService.ts` - Enhanced logging
4. ✅ `src/screens/Notifications/NotificationsScreen.tsx` - Enhanced logging

## Need More Help?

If realtime notifications still don't work after following these steps:
1. Check the console logs for specific error messages
2. Verify the notifications table exists and has data
3. Make sure you're testing with the correct user_id
4. Try creating a notification manually in Supabase to test

