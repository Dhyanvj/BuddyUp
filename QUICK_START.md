# FCM Notifications - Quick Start Guide

## 🚀 Get Started in 4 Steps

### Step 1: Firebase Setup (15 min)

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Click "Add project"
   - Name it "BuddyUp"
   - Disable Analytics (optional)

2. **Add iOS App**
   - Click iOS icon
   - Bundle ID: `com.auralogic.buddyup`
   - Download `GoogleService-Info.plist`
   - Place in project root: `BuddyUp/GoogleService-Info.plist`

3. **Add Android App**
   - Click Android icon
   - Package name: `com.auralogic.buddyup`
   - Download `google-services.json`
   - Place in project root: `BuddyUp/google-services.json`

4. **Get Service Account Credentials**
   - Go to Project Settings > Cloud Messaging
   - Click "Manage service accounts"
   - Click three dots (⋮) > "Manage keys"
   - Create new JSON key and download
   - Save it for Step 3 (you'll need project_id, client_email, private_key)

### Step 2: Database Setup (2 min)

Run this SQL in Supabase SQL Editor:

```sql
-- Add platform column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS platform TEXT CHECK (platform IN ('ios', 'android', NULL));
```

### Step 3: Deploy Edge Functions (10 min)

1. **Install Supabase CLI** (if not installed)
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**
   ```bash
   supabase login
   ```

3. **Link Your Project**
   ```bash
   cd BuddyUp
   supabase link --project-ref your-project-ref
   ```
   Get `your-project-ref` from Supabase Dashboard URL

4. **Set Firebase Credentials**
   ```bash
   supabase secrets set FIREBASE_PROJECT_ID="your-project-id"
   supabase secrets set FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
   supabase secrets set FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Key\n-----END PRIVATE KEY-----"
   ```
   Use values from the Service Account JSON file from Step 1

5. **Deploy Functions**
   ```bash
   supabase functions deploy send-fcm-notification
   supabase functions deploy send-trip-reminders
   ```

6. **Create Database Webhook**
   - Go to Supabase Dashboard > Database > Webhooks
   - Click "Create a new hook"
   - Name: `send_fcm_notification_webhook`
   - Table: `notifications`
   - Events: Check `INSERT`
   - Type: `HTTP Request`
   - Method: `POST`
   - URL: `https://[your-project-ref].supabase.co/functions/v1/send-fcm-notification`
   - Headers:
     ```
     Authorization: Bearer [your-anon-key]
     Content-Type: application/json
     ```
   - Click "Create webhook"

### Step 4: Test (5 min)

1. **Install Dependencies**
   ```bash
   cd BuddyUp
   npm install --legacy-peer-deps
   ```

2. **Run the App**
   ```bash
   npm start
   ```

3. **Test on Device**
   - iOS: Use physical device (simulator doesn't support push)
   - Android: Emulator or physical device works

4. **Quick Test**
   - Log in to the app
   - Grant notification permissions
   - From another device, request to join a trip
   - You should receive a push notification!

## ✅ Verification Checklist

After setup, verify:

- [ ] Firebase config files in project root
- [ ] Database migration run successfully
- [ ] Edge Functions deployed (check Supabase Dashboard)
- [ ] Database webhook created and enabled
- [ ] App runs without errors
- [ ] Notification permissions granted
- [ ] FCM token saved in profiles table
- [ ] Push notification received when testing

## 🎯 Quick Test

Test if everything works:

```sql
-- Insert a test notification (replace with your user ID)
INSERT INTO notifications (user_id, trip_id, type, title, body)
VALUES (
  'your-user-uuid-here',
  NULL,
  'test',
  'Test Notification',
  'If you see this as a push notification, it works!'
);
```

You should receive a push notification on your device!

## 📱 What You Get

After setup, your app will have:

✅ Push notifications when app is closed
✅ Push notifications when app is backgrounded
✅ Real-time in-app updates
✅ 7 types of notifications:
   - Trip requests
   - Request accepted/rejected
   - New messages
   - Trip updates
   - Trip cancelled
   - Trip reminders (24h & 1h before)
✅ Notification badge with unread count
✅ Beautiful notifications screen
✅ Mark as read, delete, navigate to trip

## 🆘 Troubleshooting

**No push notification received?**
1. Check Edge Function logs: Supabase Dashboard > Edge Functions > Logs
2. Verify Service Account credentials are correct (all 3 secrets)
3. Check FCM token exists in profiles table
4. iOS: Verify APNs is configured in Firebase Console
5. Ensure private key has `\n` characters preserved

**Token not saved?**
1. Check notification permissions are granted
2. Check app logs for FCM errors
3. Verify Firebase config files are in correct location

**Realtime not working?**
1. Check Supabase Realtime is enabled (Project Settings > API)
2. Verify subscription in AuthContext
3. Check browser/app console for errors

## 📚 Full Documentation

For detailed information, see:
- [`FIREBASE_SETUP_GUIDE.md`](FIREBASE_SETUP_GUIDE.md) - Complete Firebase setup
- [`SUPABASE_EDGE_FUNCTION_SETUP.md`](SUPABASE_EDGE_FUNCTION_SETUP.md) - Edge Function details
- [`TESTING_GUIDE.md`](TESTING_GUIDE.md) - Comprehensive testing guide
- [`FCM_IMPLEMENTATION_COMPLETE.md`](FCM_IMPLEMENTATION_COMPLETE.md) - Full implementation details

## 🎉 You're Done!

Your notification system is now ready for production!

**Next Steps:**
1. Test all notification types
2. Monitor Firebase Console for delivery rates
3. Set up error alerting
4. Add notification preferences (optional)

---

**Need Help?** Check the troubleshooting section in [`TESTING_GUIDE.md`](TESTING_GUIDE.md)

