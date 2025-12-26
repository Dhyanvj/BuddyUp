# Firebase Cloud Messaging V1 API Update

## Important Change

Firebase has fully migrated to the **V1 API** and the Legacy API (Server Key) is no longer available. This is actually **better** for security and provides more features.

## What Changed

### Old (Legacy API - Deprecated)
- Used a simple Server Key
- Format: `AAAA1234567:APA91bH...`
- Less secure
- Being phased out

### New (V1 API - Current)
- Uses Service Account credentials
- OAuth 2.0 authentication
- More secure
- Modern standard
- Required by Firebase

## Migration Summary

All Edge Functions and documentation have been updated to use V1 API:

### ✅ Files Updated

1. **Edge Function**: `supabase/functions/send-fcm-notification/index.ts`
   - Now uses OAuth 2.0 with Service Account
   - Generates access tokens dynamically
   - More secure and robust

2. **Documentation Updated**:
   - `FIREBASE_SETUP_GUIDE.md`
   - `SUPABASE_EDGE_FUNCTION_SETUP.md`
   - `QUICK_START.md`
   - `SETUP_CHECKLIST.md`
   - `FCM_IMPLEMENTATION_COMPLETE.md`

3. **Edge Function README**: Complete guide for V1 API setup

## What You Need Now

Instead of a Server Key, you need **3 credentials** from Service Account JSON:

### 1. Get Service Account JSON

1. Firebase Console > Project Settings > Cloud Messaging
2. Click "Manage service accounts"
3. Click ⋮ (three dots) > "Manage keys"
4. "Add Key" > "Create new key" > JSON
5. Download the JSON file

### 2. Extract These Values

From the downloaded JSON:
```json
{
  "project_id": "your-project-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
}
```

### 3. Set as Supabase Secrets

```bash
supabase secrets set FIREBASE_PROJECT_ID="your-project-id"
supabase secrets set FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
supabase secrets set FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Key\n-----END PRIVATE KEY-----"
```

**Important**: Keep the `\n` characters in the private key!

## How It Works Now

1. Edge Function creates a JWT (JSON Web Token)
2. Signs JWT with private key
3. Exchanges JWT for OAuth 2.0 access token
4. Uses access token to call FCM V1 API
5. Access token valid for 1 hour

## Benefits of V1 API

✅ **More Secure**: OAuth 2.0 vs simple key
✅ **Better Errors**: More detailed error messages
✅ **Modern Standard**: Industry best practice
✅ **Future Proof**: Required by Firebase
✅ **More Features**: Topics, conditions, etc.

## Testing

After setting up V1 API:

1. Deploy the updated Edge Function:
   ```bash
   supabase functions deploy send-fcm-notification
   ```

2. Test with a notification:
   ```sql
   INSERT INTO notifications (user_id, type, title, body)
   VALUES ('your-user-id', 'test', 'Test V1 API', 'Testing FCM V1 API');
   ```

3. Check Edge Function logs for success

## Troubleshooting

### "Failed to get access token"
- Check Service Account credentials are correct
- Verify private key includes BEGIN/END markers
- Ensure `\n` characters are preserved

### "Permission denied"
- Verify Firebase Cloud Messaging API (V1) is enabled
- Check Service Account has Firebase Admin role

### "Invalid token"
- User's FCM token may be expired
- User should log out and log back in

## Security Notes

🔒 **Keep Service Account JSON secure!**
- Don't commit to Git
- Don't share publicly  
- Store in password manager
- Has admin access to Firebase project

## Next Steps

1. ✅ Download Service Account JSON
2. ✅ Set 3 Supabase secrets
3. ✅ Deploy updated Edge Function
4. ✅ Test notifications
5. ✅ Monitor Edge Function logs

## Resources

- [FCM V1 Migration Guide](https://firebase.google.com/docs/cloud-messaging/migrate-v1)
- [OAuth 2.0 Service Accounts](https://developers.google.com/identity/protocols/oauth2/service-account)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

**Status**: ✅ All code and documentation updated for V1 API

**Ready**: Follow the updated guides to deploy!

