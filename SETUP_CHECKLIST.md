# FCM Notifications Setup Checklist

Use this checklist to track your setup progress.

## ✅ Pre-Setup (Already Done)

- [x] Code implementation complete
- [x] Dependencies installed
- [x] Documentation created
- [x] All 13 todos completed

## 📋 Your Setup Tasks

### Phase 1: Firebase Setup (15 minutes)

- [ ] **1.1** Go to [Firebase Console](https://console.firebase.google.com)
- [ ] **1.2** Create new project named "BuddyUp"
- [ ] **1.3** Add iOS app
  - [ ] Bundle ID: `com.auralogic.buddyup`
  - [ ] Download `GoogleService-Info.plist`
  - [ ] Place file in: `BuddyUp/GoogleService-Info.plist`
- [ ] **1.4** Add Android app
  - [ ] Package name: `com.auralogic.buddyup`
  - [ ] Download `google-services.json`
  - [ ] Place file in: `BuddyUp/google-services.json`
- [ ] **1.5** Get Service Account Credentials (V1 API)
  - [ ] Go to Project Settings > Cloud Messaging
  - [ ] Click "Manage service accounts"
  - [ ] Click three dots (⋮) next to service account
  - [ ] Select "Manage keys" > "Add Key" > "Create new key"
  - [ ] Choose JSON format and download
  - [ ] Save file securely (needed for Step 3)
  - [ ] Extract: `project_id`, `client_email`, `private_key` from JSON

**Time**: ~15 minutes  
**Help**: See [`FIREBASE_SETUP_GUIDE.md`](FIREBASE_SETUP_GUIDE.md)

---

### Phase 2: Database Setup (2 minutes)

- [ ] **2.1** Open Supabase SQL Editor
- [ ] **2.2** Run migration from `Database Migration - Add Platform.sql`:
  ```sql
  ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS platform TEXT CHECK (platform IN ('ios', 'android', NULL));
  ```
- [ ] **2.3** Verify column added:
  ```sql
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'profiles' AND column_name = 'platform';
  ```

**Time**: ~2 minutes  
**Help**: See [`Database Migration - Add Platform.sql`](Database%20Migration%20-%20Add%20Platform.sql)

---

### Phase 3: Edge Functions Setup (10 minutes)

#### 3.1 Install Supabase CLI
- [ ] Run: `npm install -g supabase`
- [ ] Verify: `supabase --version`

#### 3.2 Login to Supabase
- [ ] Run: `supabase login`
- [ ] Browser opens for authentication
- [ ] Confirm logged in

#### 3.3 Link Project
- [ ] Get project ref from Supabase Dashboard URL
- [ ] Run: `cd BuddyUp`
- [ ] Run: `supabase link --project-ref your-project-ref`

#### 3.4 Set Firebase Service Account Credentials
- [ ] Run: `supabase secrets set FIREBASE_PROJECT_ID="your-project-id"`
- [ ] Run: `supabase secrets set FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"`
- [ ] Run: `supabase secrets set FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Key\n-----END PRIVATE KEY-----"`
- [ ] Use values from Service Account JSON file from Phase 1.5
- [ ] Verify: `supabase secrets list` (should show 3 secrets)

#### 3.5 Deploy Edge Functions
- [ ] Run: `supabase functions deploy send-fcm-notification`
- [ ] Verify deployment successful
- [ ] Run: `supabase functions deploy send-trip-reminders`
- [ ] Verify deployment successful

#### 3.6 Create Database Webhook
- [ ] Go to Supabase Dashboard > Database > Webhooks
- [ ] Click "Create a new hook"
- [ ] Fill in:
  - Name: `send_fcm_notification_webhook`
  - Table: `notifications`
  - Events: ☑️ INSERT
  - Type: HTTP Request
  - Method: POST
  - URL: `https://[your-project-ref].supabase.co/functions/v1/send-fcm-notification`
  - Headers:
    ```
    Authorization: Bearer [your-anon-key]
    Content-Type: application/json
    ```
- [ ] Click "Create webhook"
- [ ] Verify webhook is enabled

#### 3.7 Set Up Cron for Reminders (Optional)
- [ ] Go to Supabase Dashboard > Database > SQL Editor
- [ ] Run cron setup SQL from `supabase/functions/send-trip-reminders/README.md`
- [ ] Or set up external cron (GitHub Actions, etc.)

**Time**: ~10 minutes  
**Help**: See [`SUPABASE_EDGE_FUNCTION_SETUP.md`](SUPABASE_EDGE_FUNCTION_SETUP.md)

---

### Phase 4: Testing (30 minutes)

#### 4.1 Basic Setup Test
- [ ] Run: `npm install --legacy-peer-deps` (if not done)
- [ ] Run: `npm start`
- [ ] App starts without errors

#### 4.2 Device Setup
- [ ] iOS: Use physical device (simulator doesn't support push)
- [ ] Android: Use emulator or physical device
- [ ] Device connected and recognized

#### 4.3 FCM Registration Test
- [ ] Log in to the app
- [ ] Grant notification permissions when prompted
- [ ] Check Supabase profiles table:
  ```sql
  SELECT id, email, push_token, platform 
  FROM profiles 
  WHERE email = 'your-email@example.com';
  ```
- [ ] Verify `push_token` is not NULL
- [ ] Verify `platform` is 'ios' or 'android'

#### 4.4 Push Notification Test (App Closed)
- [ ] Completely quit the app
- [ ] From another device, trigger a notification:
  - [ ] Request to join a trip, OR
  - [ ] Send a chat message, OR
  - [ ] Run SQL test:
    ```sql
    INSERT INTO notifications (user_id, trip_id, type, title, body)
    VALUES ('your-user-uuid', NULL, 'test', 'Test Push', 'Testing!');
    ```
- [ ] Receive push notification on device
- [ ] Tap notification opens app

#### 4.5 Real-Time Update Test (App Open)
- [ ] Open app and go to Notifications screen
- [ ] From another device, trigger a notification
- [ ] Notification appears instantly (no refresh needed)
- [ ] Badge count updates automatically

#### 4.6 All Notification Types Test
- [ ] Trip request notification works
- [ ] Request accepted notification works
- [ ] Request rejected notification works
- [ ] New message notification works
- [ ] Trip update notification works
- [ ] Trip cancelled notification works
- [ ] Trip reminder notification works (create trip 24h from now)

#### 4.7 UI Test
- [ ] Notifications screen displays all notifications
- [ ] Unread badge shows correct count
- [ ] Tap notification marks as read
- [ ] Tap notification navigates to trip
- [ ] "Mark all read" button works
- [ ] Long-press delete works
- [ ] Pull to refresh works

#### 4.8 Cleanup Test
- [ ] Log out
- [ ] Check profiles table - `push_token` should be NULL
- [ ] Log back in
- [ ] Token registered again

**Time**: ~30 minutes  
**Help**: See [`TESTING_GUIDE.md`](TESTING_GUIDE.md)

---

### Phase 5: Monitoring Setup (5 minutes)

- [ ] **5.1** Check Firebase Console
  - [ ] Go to Cloud Messaging > Reports
  - [ ] Verify notifications are being delivered
  
- [ ] **5.2** Check Supabase Logs
  - [ ] Go to Edge Functions > send-fcm-notification > Logs
  - [ ] Verify function executes without errors
  
- [ ] **5.3** Check Webhook Status
  - [ ] Go to Database > Webhooks
  - [ ] Verify webhook shows recent successful calls

**Time**: ~5 minutes

---

## 🎯 Success Criteria

You're done when all of these are true:

- ✅ Firebase config files in project root
- ✅ Database migration completed
- ✅ Edge Functions deployed
- ✅ Database webhook created and working
- ✅ App runs without errors
- ✅ Notification permissions granted
- ✅ FCM token saved in database
- ✅ Push notification received when app closed
- ✅ Real-time updates work when app open
- ✅ All 7 notification types working
- ✅ Notifications screen displays correctly
- ✅ Badge count updates correctly
- ✅ Navigation from notification works
- ✅ Logout cleanup works

## 📊 Progress Tracker

**Total Tasks**: 50+  
**Completed**: _____ / 50+  
**Estimated Time**: ~60 minutes  
**Actual Time**: _____ minutes

## 🆘 Need Help?

If you get stuck:

1. **Check the detailed guides**:
   - [`QUICK_START.md`](QUICK_START.md) - Fast setup
   - [`FIREBASE_SETUP_GUIDE.md`](FIREBASE_SETUP_GUIDE.md) - Firebase details
   - [`SUPABASE_EDGE_FUNCTION_SETUP.md`](SUPABASE_EDGE_FUNCTION_SETUP.md) - Edge Functions
   - [`TESTING_GUIDE.md`](TESTING_GUIDE.md) - Testing & troubleshooting

2. **Check logs**:
   - Supabase Dashboard > Edge Functions > Logs
   - Firebase Console > Cloud Messaging > Reports
   - React Native debugger console

3. **Common issues**:
   - No push: Check Firebase Server Key
   - Token not saved: Check permissions granted
   - Realtime not working: Check Supabase Realtime enabled
   - iOS no push: Check APNs configuration

## 📝 Notes

Use this space to track any issues or customizations:

```
Date: ___________
Issues encountered: 




Solutions: 




Custom configurations: 




```

---

## 🎉 Completion

When all tasks are checked:

- [ ] Mark this checklist as complete
- [ ] Document any custom configurations
- [ ] Share with your team
- [ ] Start monitoring in production

**Congratulations!** Your notification system is live! 🚀

---

**Started**: ___________  
**Completed**: ___________  
**Total Time**: ___________

