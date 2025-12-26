# Send FCM Notification Edge Function (V1 API)

This Supabase Edge Function sends push notifications via Firebase Cloud Messaging V1 API when a new notification is inserted into the database.

## Firebase Cloud Messaging V1 API

This function uses the **modern FCM V1 API** (not the deprecated Legacy API). The V1 API uses OAuth 2.0 authentication with Service Account credentials, which is more secure.

## Setup

### 1. Get Firebase Service Account Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Project Settings** (gear icon) > **Cloud Messaging**
4. Click **"Manage service accounts"**
5. In Google Cloud Console, find your service account (e.g., `firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com`)
6. Click the **three dots** (⋮) > **Manage keys**
7. Click **"Add Key"** > **"Create new key"**
8. Choose **JSON** format
9. Click **"Create"** - a JSON file will download

**IMPORTANT**: Keep this JSON file secure! It has admin access to your Firebase project.

### 2. Extract Credentials from JSON

Open the downloaded JSON file and find these values:

```json
{
  "project_id": "your-project-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
}
```

### 3. Set Environment Variables in Supabase

In your Supabase Dashboard, go to **Project Settings** > **Edge Functions** and add:

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYour_Private_Key_Here\n-----END PRIVATE KEY-----
```

**OR** via Supabase CLI:

```bash
supabase secrets set FIREBASE_PROJECT_ID="your-project-id"
supabase secrets set FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
supabase secrets set FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Private_Key_Here\n-----END PRIVATE KEY-----"
```

**Note**: For the private key, keep the `\n` characters - they represent line breaks.

### 4. Deploy the Function

```bash
supabase functions deploy send-fcm-notification
```

### 5. Create Database Webhook

In your Supabase Dashboard, go to **Database** > **Webhooks** and create a new webhook:

- **Name**: `send_fcm_notification_webhook`
- **Table**: `notifications`
- **Events**: `INSERT`
- **Type**: `HTTP Request`
- **HTTP Request**:
  - Method: `POST`
  - URL: `https://[your-project-ref].supabase.co/functions/v1/send-fcm-notification`
  - Headers:
    ```
    Authorization: Bearer [your-anon-key]
    Content-Type: application/json
    ```

### 6. Test the Function

Insert a test notification:

```sql
INSERT INTO notifications (user_id, trip_id, type, title, body)
VALUES (
  'user-uuid-here',
  'trip-uuid-here',
  'test',
  'Test Notification',
  'This is a test push notification via FCM V1 API'
);
```

Check the Edge Function logs in Supabase Dashboard to verify it was triggered.

## How It Works

1. User action triggers notification creation (e.g., trip request, new message)
2. App inserts notification into `notifications` table
3. Database webhook triggers this Edge Function
4. Function retrieves user's FCM token from `profiles` table
5. Function gets OAuth 2.0 access token using Service Account credentials
6. Function sends push notification via FCM V1 API
7. Push notification is delivered to user's device (even if app is closed)

## OAuth 2.0 Flow

The function uses JWT (JSON Web Token) to authenticate with Google:

1. Creates a JWT with Service Account credentials
2. Signs the JWT with the private key
3. Exchanges JWT for an OAuth 2.0 access token
4. Uses access token to call FCM V1 API

Access tokens are valid for 1 hour and are generated fresh for each notification.

## Error Handling

The function handles:
- Missing FCM tokens (user hasn't granted permission)
- Invalid tokens (user uninstalled app)
- FCM API errors
- OAuth authentication errors
- Database errors

Check the Edge Function logs for debugging.

## Platform-Specific Configurations

### iOS (APNs)
- Requires APNs certificate/key configured in Firebase Console
- Supports badge counts
- Supports custom sounds
- Uses `apns` payload in FCM message

### Android
- Works out of the box
- High priority delivery
- Custom notification channels
- Uses `android` configuration in FCM message

## Monitoring

Monitor the function in:
- Supabase Dashboard > Edge Functions > Logs
- Firebase Console > Cloud Messaging > Reports

## Advantages of V1 API over Legacy API

✅ More secure (OAuth 2.0 vs. Server Key)
✅ Better error messages
✅ Support for message topics and conditions
✅ Modern authentication standard
✅ Required by Firebase (Legacy API deprecated)

## Troubleshooting

### "Failed to get access token"
- Check that Service Account credentials are correct
- Verify private key includes `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Ensure `\n` characters are preserved in the private key

### "Invalid token" or "Unregistered"
- User's FCM token may have expired
- User may have uninstalled the app
- Token will be refreshed on next app login

### "Permission denied"
- Verify Service Account has Firebase Admin permissions
- Check that Firebase Cloud Messaging API (V1) is enabled

### No notification received
- Check Edge Function logs for errors
- Verify FCM token exists in profiles table
- Test FCM token using Firebase Console "Send test message"
- iOS: Verify APNs is configured in Firebase Console

## Cost

- Edge Function invocations: Free tier includes 500K requests/month
- Firebase Cloud Messaging: Free for unlimited notifications
- OAuth token generation: No additional cost

## Security Notes

1. **Never commit** Service Account JSON or private key to version control
2. Use Supabase secrets for environment variables
3. Edge Function runs with service role privileges
4. Webhook should use Authorization header
5. Keep Service Account JSON file secure

## Additional Resources

- [FCM V1 API Documentation](https://firebase.google.com/docs/cloud-messaging/migrate-v1)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [OAuth 2.0 Service Accounts](https://developers.google.com/identity/protocols/oauth2/service-account)
