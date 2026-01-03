# Notification Creation Troubleshooting Guide

## Issue: Notifications Not Being Created

You mentioned that notifications aren't being created when actions happen. Let's debug this systematically.

## ✅ Notification Creation Code EXISTS

I've confirmed that notification creation code is already implemented for all 7 types:

### 1. ✅ Trip Request (`trip_request`)
**File**: `src/services/tripHelpers.ts` (lines 211-219)
**When**: User requests to join a trip
**Recipient**: Trip creator
```typescript
await supabase.from('notifications').insert([{
  user_id: trip.creator_id,
  trip_id: tripId,
  type: 'trip_request',
  title: 'New Trip Request',
  body: `Someone wants to join your trip: ${trip.title}`,
}]);
```

### 2. ✅ Request Accepted (`request_accepted`)
**File**: `src/services/tripHelpers.ts` (lines 276-284)
**When**: Trip creator accepts a join request
**Recipient**: User who requested to join
```typescript
await supabase.from('notifications').insert([{
  user_id: participant.user_id,
  trip_id: tripId,
  type: 'request_accepted',
  title: 'Request Accepted!',
  body: `Your request to join "${trip?.title}" was accepted...`,
}]);
```

### 3. ✅ Request Rejected (`request_rejected`)
**File**: `src/services/tripHelpers.ts` (lines 326-334)
**When**: Trip creator rejects a join request
**Recipient**: User who requested to join
```typescript
await supabase.from('notifications').insert([{
  user_id: participant.user_id,
  trip_id: tripId,
  type: 'request_rejected',
  title: 'Request Declined',
  body: `Your request to join "${trip.title}" was declined.`,
}]);
```

### 4. ✅ New Message (`new_message`)
**File**: `src/services/chatHelpers.ts` (line 87)
**When**: Someone sends a message in trip chat
**Recipient**: All trip participants except sender
```typescript
await supabase.from('notifications').insert([{
  user_id: participant.user_id,
  trip_id: tripId,
  type: 'new_message',
  title: 'New Message',
  body: `New message in trip chat...`,
}]);
```

### 5. ✅ Trip Update (`trip_update`)
**File**: `src/screens/CreateTrip/EditTripScreen.tsx` (lines 102-110)
**When**: Trip creator edits trip details
**Recipient**: All accepted participants
```typescript
await supabase.from('notifications').insert(notifications);
```

### 6. ✅ Trip Cancelled (`trip_cancelled`)
**File**: `src/services/tripHelpers.ts` (lines 378-386)
**When**: Trip creator cancels the trip
**Recipient**: All participants
```typescript
await supabase.from('notifications').insert(notifications);
```

### 7. ✅ Trip Reminders (`trip_reminder`)
**File**: `supabase/functions/send-trip-reminders/index.ts`
**When**: Automated - 24h and 1h before trip
**Recipient**: All accepted participants
**Note**: This runs via Supabase Cron job

---

## 🔍 Debugging Steps

Since the code exists, let's figure out WHY notifications aren't being created:

### Step 1: Check Supabase RLS Policies

The `notifications` table might have Row Level Security (RLS) policies that are blocking inserts.

**Run this in Supabase SQL Editor:**

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'notifications';

-- Check existing policies
SELECT * FROM pg_policies 
WHERE tablename = 'notifications';
```

**Fix if needed:**

```sql
-- If RLS is blocking inserts, update the policy:
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;

CREATE POLICY "Allow service role and authenticated users to insert"
ON notifications FOR INSERT
TO authenticated, service_role
WITH CHECK (true);

-- Also ensure users can read their own notifications
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

### Step 2: Check Console for Errors

Add better error logging to see if inserts are failing silently:

**Test by manually running notification creation:**

1. Open your app
2. Try requesting to join a trip
3. Check the console/terminal for errors
4. Look for messages like:
   - `Error requesting to join trip:`
   - `Error accepting trip request:`
   - Any database errors

### Step 3: Manually Test Notification Insert

Try inserting a notification directly in Supabase to verify the table works:

```sql
-- Replace 'your-user-id' with an actual user ID from profiles table
INSERT INTO notifications (user_id, trip_id, type, title, body, read)
VALUES (
  'your-user-id',
  NULL,
  'test',
  'Test Notification',
  'Testing if notifications table works',
  false
);

-- Then query to verify
SELECT * FROM notifications WHERE type = 'test';
```

If this fails, there's a database issue (likely RLS policies or constraints).

### Step 4: Check for Silent Errors

The notification creation code is wrapped in try-catch blocks, but errors might be swallowed. Let's add explicit logging:

**Check these functions and look for console errors:**
- `requestToJoinTrip` - Should log "Error requesting to join trip"
- `acceptTripRequest` - Should log "Error accepting trip request"
- `rejectTripRequest` - Should log "Error rejecting trip request"
- `cancelTrip` - Should log "Error cancelling trip"

### Step 5: Verify Realtime is Working

You've already enabled Realtime for notifications, but let's verify:

```sql
-- Check if notifications table is in realtime publication
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'notifications';
```

Should return one row showing notifications is enabled.

### Step 6: Test End-to-End

**Test Trip Request Notification:**

1. **User A**: Create a trip
2. **User B**: Request to join the trip (from TripDetailsScreen)
3. **Check**: 
   - Console for any errors
   - Supabase table editor - does a notification appear in the notifications table?
   - User A's app - does notification appear in notifications screen?

**Test Request Accepted Notification:**

1. **User A** (trip creator): Accept User B's request
2. **Check**:
   - Console for errors
   - Notifications table in Supabase
   - User B's app notifications screen

---

## 🐛 Common Issues & Solutions

### Issue 1: RLS Policies Blocking Inserts
**Symptom**: Code runs without errors, but no notifications in database
**Solution**: Update RLS policies (see Step 1)

### Issue 2: Missing user_id or trip_id
**Symptom**: Errors in console about constraint violations
**Solution**: Check that all required fields are being populated

### Issue 3: Edge Function Not Deployed
**Symptom**: Notifications created in database, but no FCM push
**Solution**: Deploy the Edge Function (see SUPABASE_EDGE_FUNCTION_SETUP.md)

### Issue 4: Async/Await Not Handled
**Symptom**: Function returns before notification is created
**Solution**: All notification inserts use `await`, so this shouldn't be the issue

### Issue 5: Supabase Client Not Authenticated
**Symptom**: Permission errors in console
**Solution**: Verify user is logged in (`profile` exists in auth context)

---

## 🔧 Quick Test Script

Run this in your browser console while app is running to test notification creation:

```javascript
// Test creating a notification manually
const testNotification = async () => {
  const { data, error } = await supabase
    .from('notifications')
    .insert([{
      user_id: 'YOUR_USER_ID_HERE', // Replace with your actual user ID
      trip_id: null,
      type: 'test',
      title: 'Manual Test',
      body: 'Testing notification creation',
      read: false
    }])
    .select();
    
  console.log('Result:', { data, error });
};

testNotification();
```

If this works but the automatic notifications don't, the issue is in the code logic, not the database.

---

## 📋 Next Steps

1. **Run the RLS policy check** (Step 1) - Most likely culprit!
2. **Check console for errors** when performing actions
3. **Manually test insert** to verify table works
4. **Report back** what you find - I can help debug further

## 💡 Most Likely Cause

Based on similar issues, it's usually **Row Level Security (RLS) policies** blocking the inserts. The code tries to insert notifications, but RLS silently blocks them.

**Run this fix first:**

```sql
-- Allow authenticated users to insert notifications
CREATE POLICY "Authenticated users can insert notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (true);
```

Then test creating a trip request and see if notifications appear!

