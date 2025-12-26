# FCM Notifications Testing Guide

This guide helps you test the complete FCM notification system.

## Prerequisites

Before testing:
1. ✅ Firebase project created
2. ✅ `GoogleService-Info.plist` and `google-services.json` placed in project
3. ✅ Database migration run (platform column added)
4. ✅ Edge Functions deployed
5. ✅ Database webhook configured
6. ✅ Dependencies installed (`npm install --legacy-peer-deps`)

## Testing Environment

### iOS
- **Simulator**: ❌ Does NOT support push notifications
- **Physical Device**: ✅ Required for testing push notifications
- **Requirements**: 
  - APNs certificate/key configured in Firebase Console
  - Device running iOS 10+
  - Valid Apple Developer account

### Android
- **Emulator**: ✅ Supports push notifications
- **Physical Device**: ✅ Also works
- **Requirements**:
  - Google Play Services installed
  - Android 5.0+ (API 21+)

## Test Scenarios

### 1. FCM Registration & Token Storage

**Test**: User logs in and FCM token is registered

**Steps**:
1. Fresh install or clear app data
2. Log in to the app
3. Grant notification permissions when prompted
4. Check Supabase profiles table

**Expected**:
```sql
SELECT id, email, push_token, platform 
FROM profiles 
WHERE email = 'your-test-email@example.com';
```
- `push_token` should contain a long FCM token string
- `platform` should be 'ios' or 'android'

**Troubleshooting**:
- If `push_token` is NULL: Check app logs for FCM errors
- If permission not requested: Check iOS Info.plist or Android permissions
- If token not saved: Check `saveFCMToken()` function logs

---

### 2. Push Notification - App Closed

**Test**: Receive push when app is completely quit

**Steps**:
1. Log in and ensure FCM token is registered
2. Completely quit the app (swipe away from app switcher)
3. From another device/account, trigger a notification:
   - Request to join a trip
   - Send a chat message
   - Update a trip
4. Check device for push notification

**Expected**:
- Notification appears in system tray
- Notification shows correct title and body
- Tapping notification opens app and navigates to trip

**Troubleshooting**:
- No notification: Check Edge Function logs
- Wrong content: Check notification creation in code
- Doesn't open app: Check notification tap handler in `fcmNotificationService.ts`

---

### 3. Push Notification - App Backgrounded

**Test**: Receive push when app is in background

**Steps**:
1. Open app and log in
2. Press home button (app goes to background)
3. Trigger a notification from another device
4. Check for notification

**Expected**:
- Notification appears in system tray
- Tapping brings app to foreground
- App navigates to relevant screen

---

### 4. Foreground Notification - App Open

**Test**: Receive notification when app is actively open

**Steps**:
1. Open app and stay on any screen
2. Trigger a notification from another device
3. Check notification behavior

**Expected**:
- Notification appears in-app (iOS may show banner)
- Notifications screen updates in real-time
- Badge count updates immediately
- No need to refresh

**Troubleshooting**:
- No in-app update: Check Realtime subscription in AuthContext
- Badge not updating: Check `getUnreadCount()` in navigation

---

### 5. Notification Events Testing

#### A. Trip Request
**Trigger**: User B requests to join User A's trip

**Steps**:
1. User A creates a trip
2. User B requests to join
3. Check User A's device

**Expected**:
- User A receives push: "New Trip Request"
- Body: "Someone wants to join your trip: [trip title]"
- Notification appears in notifications screen
- Badge count increments

---

#### B. Request Accepted
**Trigger**: Creator accepts join request

**Steps**:
1. User B requests to join User A's trip
2. User A accepts the request
3. Check User B's device

**Expected**:
- User B receives push: "Request Accepted!"
- Body: "Your request to join [trip title] was accepted..."
- Badge count increments

---

#### C. Request Rejected
**Trigger**: Creator rejects join request

**Steps**:
1. User B requests to join User A's trip
2. User A rejects the request
3. Check User B's device

**Expected**:
- User B receives push: "Request Declined"
- Body: "Your request to join [trip title] was declined"

---

#### D. New Chat Message
**Trigger**: User sends message in trip chat

**Steps**:
1. User A and User B are in same trip
2. User A sends a message in trip chat
3. Check User B's device (app closed or backgrounded)

**Expected**:
- User B receives push: "New message in [trip title]"
- Body: "[Sender name]: [message preview]"
- All trip participants receive notification (except sender)

**Note**: If User B has chat screen open, they may not receive push (to avoid spam)

---

#### E. Trip Update
**Trigger**: Creator updates trip details

**Steps**:
1. User A creates trip with participants
2. User A edits trip (change time, location, etc.)
3. Check all participants' devices

**Expected**:
- All participants receive push: "Trip Updated"
- Body: "The trip [trip title] has been updated..."

---

#### F. Trip Cancelled
**Trigger**: Creator cancels trip

**Steps**:
1. User A creates trip with participants
2. User A cancels the trip
3. Check all participants' devices

**Expected**:
- All participants receive push: "Trip Cancelled"
- Body: "The trip you joined has been cancelled"

---

#### G. Trip Reminders
**Trigger**: Automated - 24h and 1h before departure

**Steps**:
1. Create a trip departing in 24 hours
2. Wait for cron job to run (or manually trigger Edge Function)
3. Check all participants' devices

**Expected**:
- 24h before: "Trip Tomorrow"
- 1h before: "Trip Starting Soon!"
- Creator and all accepted participants receive notification

**Manual Test**:
```bash
curl -X POST \
  -H "Authorization: Bearer [your-anon-key]" \
  -H "Content-Type: application/json" \
  https://[your-project-ref].supabase.co/functions/v1/send-trip-reminders
```

---

### 6. Notifications Screen UI

**Test**: Notifications screen displays and updates correctly

**Steps**:
1. Log in and navigate to Notifications tab
2. Trigger some notifications from another device
3. Test UI interactions

**Expected**:
- All notifications display in chronological order
- Unread notifications highlighted (blue background)
- Badge shows unread count
- Tap notification marks as read
- Tap notification navigates to trip
- "Mark all read" button works
- Long-press shows delete option
- Pull to refresh works
- Real-time updates (no manual refresh needed)

---

### 7. Badge Count

**Test**: Badge count updates correctly

**Steps**:
1. Start with 0 notifications
2. Receive 3 notifications (app closed)
3. Open app and check badge
4. Mark 1 as read
5. Check badge updates

**Expected**:
- Badge shows "3" when app opens
- Badge updates to "2" after marking one read
- Badge clears when all marked read
- iOS: Badge appears on app icon
- Android: Badge appears in notification tab

---

### 8. Token Refresh

**Test**: FCM token refreshes correctly

**Steps**:
1. Log in and register token
2. Reinstall app (simulates token refresh)
3. Log in again
4. Check profiles table

**Expected**:
- New FCM token saved
- Old token replaced
- Notifications still work

---

### 9. Logout Cleanup

**Test**: Token deleted on logout

**Steps**:
1. Log in and register token
2. Check profiles table (token exists)
3. Log out
4. Check profiles table again

**Expected**:
- `push_token` set to NULL
- `platform` set to NULL
- No notifications received after logout

---

### 10. Edge Function Testing

**Test**: Edge Function processes notifications correctly

**Steps**:
1. Insert a test notification directly in database:

```sql
INSERT INTO notifications (user_id, trip_id, type, title, body)
VALUES (
  'your-user-uuid',
  'some-trip-uuid',
  'test',
  'Test Notification',
  'This is a test from database'
);
```

2. Check Edge Function logs
3. Check device for push notification

**Expected**:
- Edge Function triggered by webhook
- Logs show FCM API call
- Push notification delivered
- No errors in logs

**Check Logs**:
```bash
supabase functions logs send-fcm-notification --tail
```

Or in Dashboard: Edge Functions > send-fcm-notification > Logs

---

## Performance Testing

### Load Test
**Test**: Multiple notifications sent rapidly

**Steps**:
1. Send 10 notifications in quick succession
2. Check all are delivered
3. Check UI updates smoothly

**Expected**:
- All notifications delivered
- No duplicates
- UI remains responsive
- Badge count accurate

---

### Concurrent Users
**Test**: Multiple users receive notifications simultaneously

**Steps**:
1. Have 5+ users in same trip
2. Send a message or update trip
3. Check all receive notifications

**Expected**:
- All users receive push
- No delays or failures
- Edge Function handles bulk sending

---

## Error Scenarios

### 1. Invalid FCM Token
**Simulate**: User uninstalls app, token becomes invalid

**Expected**:
- Edge Function logs error
- Notification not delivered
- No app crash
- Token should be refreshed on next login

---

### 2. No Internet Connection
**Simulate**: Turn off WiFi/data before triggering notification

**Expected**:
- Notification queued by FCM
- Delivered when connection restored
- No data loss

---

### 3. Permissions Denied
**Simulate**: User denies notification permissions

**Expected**:
- No FCM token saved
- No push notifications received
- In-app notifications still work (Realtime)
- App doesn't crash

---

## Debugging Tools

### 1. Check FCM Token
```typescript
import messaging from '@react-native-firebase/messaging';

const token = await messaging().getToken();
console.log('FCM Token:', token);
```

### 2. Check Notification Permissions
```typescript
const authStatus = await messaging().hasPermission();
console.log('Permission status:', authStatus);
```

### 3. Check Supabase Realtime Connection
```typescript
const channel = supabase.channel('test');
channel.subscribe((status) => {
  console.log('Realtime status:', status);
});
```

### 4. Test FCM Directly (Firebase Console)
1. Go to Firebase Console > Cloud Messaging
2. Click "Send test message"
3. Enter your FCM token
4. Send notification
5. Should receive on device

---

## Success Criteria

✅ All 6 notification types working
✅ Push delivered when app closed
✅ Push delivered when app backgrounded
✅ In-app updates when app open
✅ Badge count accurate
✅ Navigation works on tap
✅ Mark as read works
✅ Delete works
✅ Token refresh works
✅ Logout cleanup works
✅ Edge Functions deployed and working
✅ No Expo Notifications code remaining

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| No push received | Check Firebase Server Key in Supabase |
| Token not saved | Check FCM registration in AuthContext |
| Realtime not updating | Check subscription setup and Supabase Realtime enabled |
| iOS no push | Check APNs configuration in Firebase Console |
| Android no push | Check Google Play Services installed |
| Badge not updating | Check `setBadgeCount()` calls |
| Navigation not working | Check `handleNotificationNavigation()` |
| Edge Function errors | Check logs and Firebase Server Key |

---

## Next Steps After Testing

1. ✅ Monitor Firebase Console for delivery rates
2. ✅ Set up error alerting for Edge Functions
3. ✅ Add analytics for notification engagement
4. ✅ Consider adding notification preferences
5. ✅ Add rich notifications (images, actions)
6. ✅ Implement notification categories
7. ✅ Add notification sounds customization

---

**Happy Testing! 🎉**

If you encounter any issues, check the logs first:
- Edge Function logs in Supabase Dashboard
- Firebase Console > Cloud Messaging > Reports
- React Native debugger console
- Device system logs

