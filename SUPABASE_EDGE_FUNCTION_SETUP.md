# Supabase Edge Function Setup Guide

This guide explains how to deploy and configure the FCM notification Edge Function.

## Prerequisites

1. Supabase CLI installed: `npm install -g supabase`
2. Firebase Server Key from Firebase Console
3. Supabase project created

## Step 1: Login to Supabase CLI

```bash
supabase login
```

This will open a browser window for authentication.

## Step 2: Link Your Project

```bash
cd BuddyUp
supabase link --project-ref your-project-ref
```

Get your project ref from Supabase Dashboard URL:
`https://app.supabase.com/project/[your-project-ref]`

## Step 3: Set Environment Variables

**Important**: Firebase now uses V1 API which requires Service Account credentials (not a Server Key).

### Get Service Account JSON First

1. Go to Firebase Console > Project Settings > Cloud Messaging
2. Click "Manage service accounts"
3. Click the three dots (⋮) next to your service account
4. Select "Manage keys" > "Add Key" > "Create new key"
5. Choose JSON format and download

### Option A: Via Supabase Dashboard (Recommended)

1. Go to Supabase Dashboard
2. Navigate to **Project Settings** > **Edge Functions**
3. Click **Add new secret** for each of these:
   
   **Secret 1:**
   - Name: `FIREBASE_PROJECT_ID`
   - Value: [from JSON: "project_id"]
   
   **Secret 2:**
   - Name: `FIREBASE_CLIENT_EMAIL`
   - Value: [from JSON: "client_email"]
   
   **Secret 3:**
   - Name: `FIREBASE_PRIVATE_KEY`
   - Value: [from JSON: "private_key" - include BEGIN/END markers]

### Option B: Via CLI

```bash
supabase secrets set FIREBASE_PROJECT_ID="your-project-id"
supabase secrets set FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
supabase secrets set FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Key\n-----END PRIVATE KEY-----"
```

**Note**: Keep the `\n` characters in the private key - they represent line breaks.

## Step 4: Deploy the Edge Function

```bash
supabase functions deploy send-fcm-notification
```

You should see output like:
```
Deploying send-fcm-notification (project ref: your-project-ref)
Deployed send-fcm-notification
```

## Step 5: Create Database Webhook

### Option A: Via Supabase Dashboard (Recommended)

1. Go to **Database** > **Webhooks**
2. Click **Create a new hook**
3. Fill in:
   - **Name**: `send_fcm_notification_webhook`
   - **Table**: `notifications`
   - **Events**: Check `INSERT`
   - **Type**: `HTTP Request`
   - **HTTP Request**:
     - Method: `POST`
     - URL: `https://[your-project-ref].supabase.co/functions/v1/send-fcm-notification`
     - HTTP Headers:
       ```
       Authorization: Bearer [your-anon-key]
       Content-Type: application/json
       ```
4. Click **Create webhook**

### Option B: Via SQL

Run this in your Supabase SQL Editor:

```sql
-- Create webhook to trigger Edge Function on notification insert
CREATE OR REPLACE FUNCTION notify_fcm_on_insert()
RETURNS TRIGGER AS $$
DECLARE
  request_id bigint;
BEGIN
  -- Call the Edge Function via pg_net extension
  SELECT net.http_post(
    url := 'https://[your-project-ref].supabase.co/functions/v1/send-fcm-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer [your-anon-key]'
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'notifications',
      'record', row_to_json(NEW),
      'schema', 'public'
    )
  ) INTO request_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_notify_fcm ON notifications;
CREATE TRIGGER trigger_notify_fcm
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION notify_fcm_on_insert();
```

Replace `[your-project-ref]` and `[your-anon-key]` with your actual values.

## Step 6: Test the Function

### Test via SQL

```sql
-- Insert a test notification
INSERT INTO notifications (user_id, trip_id, type, title, body)
VALUES (
  'your-user-uuid',
  NULL,
  'test',
  'Test Push Notification',
  'This is a test from Supabase Edge Function'
);
```

### Test via Edge Function Logs

1. Go to **Edge Functions** > **send-fcm-notification** > **Logs**
2. You should see the function execution logs
3. Check for any errors

### Test on Device

1. Make sure you're logged in to the app
2. Check that your FCM token is saved in the `profiles` table
3. Insert a notification via SQL or trigger an app action
4. You should receive a push notification on your device

## Step 7: Verify Setup

Run this query to check if everything is configured:

```sql
-- Check if users have FCM tokens
SELECT id, email, push_token, platform
FROM profiles
WHERE push_token IS NOT NULL;

-- Check recent notifications
SELECT *
FROM notifications
ORDER BY created_at DESC
LIMIT 10;
```

## Troubleshooting

### Function Not Triggering

1. Check webhook is enabled in Database > Webhooks
2. Verify the webhook URL is correct
3. Check Edge Function logs for errors

### No Push Notification Received

1. Verify FCM token exists in profiles table
2. Check Firebase Server Key is correct
3. Verify device has granted notification permissions
4. Check Edge Function logs for FCM API errors
5. Test FCM token manually using Firebase Console

### Invalid Token Errors

- User may have uninstalled/reinstalled the app
- Token may have expired
- User may have revoked notification permissions

### Common Errors

**"User profile not found"**
- User ID in notification doesn't match any profile

**"No FCM token found for user"**
- User hasn't granted notification permissions
- User hasn't logged in since FCM was implemented

**"Failed to get access token"**
- Service Account credentials are incorrect
- Private key is not properly formatted
- Ensure `\n` characters are preserved in private key

**"FCM error: InvalidRegistration"**
- FCM token is invalid or expired
- Need to refresh the token

**"Permission denied"**
- Service Account doesn't have Firebase Admin permissions
- Verify Firebase Cloud Messaging API (V1) is enabled

## Monitoring

### View Logs

```bash
supabase functions logs send-fcm-notification
```

Or view in Dashboard: **Edge Functions** > **send-fcm-notification** > **Logs**

### Monitor FCM Delivery

- Firebase Console > Cloud Messaging > Reports
- Shows delivery rates, open rates, etc.

## Updating the Function

After making changes to the function code:

```bash
supabase functions deploy send-fcm-notification
```

The webhook will automatically use the updated function.

## Cost Considerations

- **Supabase Edge Functions**: Free tier includes 500K invocations/month
- **Firebase Cloud Messaging**: Free for unlimited notifications
- **Database Webhooks**: No additional cost

## Security Notes

1. **Never commit** `FIREBASE_SERVER_KEY` to version control
2. Use Supabase secrets for environment variables
3. Edge Function runs with service role privileges
4. Webhook should use Authorization header

## Next Steps

Once the Edge Function is working:

1. Test all notification types (trip requests, messages, etc.)
2. Monitor delivery rates in Firebase Console
3. Set up error alerting for failed deliveries
4. Consider implementing retry logic for failed sends

## Additional Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Supabase Webhooks Docs](https://supabase.com/docs/guides/database/webhooks)

