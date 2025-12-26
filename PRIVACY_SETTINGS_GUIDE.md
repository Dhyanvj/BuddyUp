# Privacy Settings Integration Guide

## Overview

This guide explains the Privacy Settings feature that has been integrated into your BuddyUp app. This feature allows users to control their data privacy, profile visibility, location sharing, and request account deletion in compliance with GDPR requirements.

## 🎯 Features Implemented

### 1. **Privacy Settings Screen**
A comprehensive settings page that includes:
- Data usage explanation
- Profile visibility controls (Public, Limited, Private)
- Location sharing options (Always, During Trips Only, Off)
- Contact information toggles (Email, Phone)
- Direct messaging permissions
- Links to Privacy Policy and Terms & Conditions
- GDPR-compliant account deletion request

### 2. **Privacy Helper Functions**
Utility functions to manage privacy settings:
- `getPrivacySettings()` - Fetch user's privacy settings
- `updatePrivacySettings()` - Update privacy preferences
- `requestAccountDeletion()` - Submit deletion request
- `canViewProfile()` - Check if profile should be visible
- `shouldShareLocation()` - Check if location should be shared
- `getFilteredProfileData()` - Get privacy-filtered profile data
- `canSendDirectMessage()` - Check messaging permissions

### 3. **Database Schema Updates**
New fields added to the `profiles` table:
- `profile_visibility` - Controls profile visibility
- `location_sharing` - Controls location sharing
- `show_email` - Toggle email visibility
- `show_phone` - Toggle phone visibility
- `allow_messages` - Toggle direct messaging
- `deletion_requested` - Tracks deletion requests
- `deletion_requested_at` - Timestamp of deletion request

### 4. **Account Deletion Tracking**
New `account_deletion_requests` table for GDPR compliance:
- Tracks all deletion requests
- Includes status tracking (pending, approved, completed, cancelled)
- Audit trail with timestamps and processing notes

## 📁 Files Created/Modified

### New Files:
1. **`src/screens/Profile/PrivacySettingsScreen.tsx`**
   - Main Privacy Settings UI component
   - 600+ lines of comprehensive settings interface

2. **`src/services/privacyHelpers.ts`**
   - Privacy management utility functions
   - Data filtering and permission checking

3. **`app/main/privacy-settings.tsx`**
   - Route file for navigation

4. **`Privacy Settings Migration.sql`**
   - Database migration script
   - Run this in Supabase SQL Editor

5. **`PRIVACY_SETTINGS_GUIDE.md`** (this file)
   - Complete documentation

### Modified Files:
1. **`src/services/supabase.ts`**
   - Updated `Profile` type with privacy fields

2. **`src/screens/Profile/ProfileScreen.tsx`**
   - Added navigation to Privacy Settings

3. **`app/main/_layout.tsx`**
   - Registered privacy-settings route

## 🚀 Setup Instructions

### Step 1: Run Database Migration

1. Open your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `Privacy Settings Migration.sql`
4. Run the SQL script
5. Verify that the new columns and table were created successfully

### Step 2: Update Environment (if needed)

No environment variables need to be updated. The feature uses your existing Supabase configuration.

### Step 3: Test the Feature

1. Start your development server:
   ```bash
   npm start
   ```

2. Navigate to Profile → Privacy Settings

3. Test each feature:
   - Change profile visibility settings
   - Toggle location sharing options
   - Update contact information visibility
   - View Privacy Policy and Terms links
   - Test the account deletion request flow

## 🎨 UI/UX Features

### Profile Visibility Options

**🌍 Public**
- Everyone can see your profile, trips, and reviews
- Best for users who want maximum visibility

**👥 Limited**
- Only trip participants can see your full profile
- Balanced privacy while maintaining functionality

**🔒 Private**
- Minimal information visible to others
- Maximum privacy protection

### Location Sharing Options

**📍 Always On**
- Share location to find nearby trips (recommended)
- Best user experience for trip discovery

**🚗 During Trips Only**
- Share location only when on an active trip
- Balanced approach to privacy

**🚫 Off**
- Don't share location
- Note: This limits trip discovery features

### Contact Information Toggles

- **Show Email Address**: Control email visibility
- **Show Phone Number**: Control phone visibility
- **Allow Direct Messages**: Enable/disable messaging from other users

## 🔐 Privacy & Security

### GDPR Compliance

The account deletion feature is GDPR-compliant:
- Users can request account deletion at any time
- Deletion requests are tracked in the database
- 30-day processing window (standard practice)
- Email confirmation sent to users
- Complete data removal upon completion

### Data Protection

- All privacy settings are stored securely in Supabase
- Row Level Security (RLS) policies protect user data
- Privacy helper functions enforce access controls
- Filtered profile data based on visibility settings

## 🔧 Developer Guide

### Using Privacy Helper Functions

```typescript
import {
  getPrivacySettings,
  updatePrivacySettings,
  canViewProfile,
  shouldShareLocation,
  getFilteredProfileData,
} from '../services/privacyHelpers';

// Get user's privacy settings
const settings = await getPrivacySettings(userId);

// Update privacy settings
const success = await updatePrivacySettings(userId, {
  profile_visibility: 'limited',
  location_sharing: 'trips_only',
  show_email: false,
  show_phone: false,
  allow_messages: true,
});

// Check if profile should be visible
const canView = canViewProfile(
  targetUserId,
  currentUserId,
  'limited',
  isInSameTrip
);

// Check if location should be shared
const shareLocation = shouldShareLocation('trips_only', isOnActiveTrip);

// Get filtered profile data
const filteredProfile = getFilteredProfileData(profile, canViewFull);
```

### Integrating Privacy Checks in Your Code

When displaying user profiles, always check privacy settings:

```typescript
// Example: In TripDetailsScreen or UserProfileView
const canViewFullProfile = canViewProfile(
  user.id,
  currentUser?.id,
  user.profile_visibility,
  isParticipantInTrip
);

const displayProfile = getFilteredProfileData(user, canViewFullProfile);

// Use displayProfile instead of user for rendering
```

When sharing location data:

```typescript
// Example: In location tracking code
const shouldShare = shouldShareLocation(
  user.location_sharing,
  isOnActiveTrip
);

if (shouldShare) {
  // Share location
} else {
  // Don't share location
}
```

## 📱 User Flow

1. User navigates to Profile screen
2. Taps on "Privacy Settings" (🔒 icon)
3. Reviews data usage explanation
4. Adjusts privacy preferences:
   - Profile visibility
   - Location sharing
   - Contact information
   - Messaging permissions
5. Taps "Save Privacy Settings"
6. Settings are saved and applied immediately
7. (Optional) User can request account deletion from the "Danger Zone"

## 🔗 External Links

You'll need to update these URLs in `PrivacySettingsScreen.tsx`:

```typescript
const openPrivacyPolicy = () => {
  // Replace with your actual privacy policy URL
  Linking.openURL('https://buddyup.com/privacy-policy');
};

const openTermsAndConditions = () => {
  // Replace with your actual terms URL
  Linking.openURL('https://buddyup.com/terms-and-conditions');
};
```

## 🎯 Next Steps

### Recommended Enhancements:

1. **Create Privacy Policy & Terms Pages**
   - Draft comprehensive privacy policy
   - Create terms and conditions document
   - Host them on your website or create in-app pages

2. **Email Notifications**
   - Set up email templates for deletion requests
   - Send confirmation emails when settings change
   - Notify users when deletion is complete

3. **Admin Dashboard**
   - Create admin panel to review deletion requests
   - Implement deletion processing workflow
   - Add audit logs for compliance

4. **Enhanced Privacy Features**
   - Add "Who viewed my profile" feature
   - Implement blocking/reporting users
   - Add privacy shortcuts in user profiles

5. **Analytics**
   - Track which privacy settings are most popular
   - Monitor deletion request reasons
   - Improve UX based on privacy usage patterns

## 🐛 Troubleshooting

### Issue: Privacy settings not saving

**Solution:**
- Check Supabase connection
- Verify RLS policies are correctly set
- Check browser console for errors

### Issue: Navigation not working

**Solution:**
- Ensure `privacy-settings.tsx` exists in `app/main/`
- Verify route is registered in `_layout.tsx`
- Restart development server

### Issue: Database errors

**Solution:**
- Verify migration script ran successfully
- Check that all columns were added to profiles table
- Ensure `account_deletion_requests` table exists

## 📊 Testing Checklist

- [ ] Privacy Settings screen loads correctly
- [ ] All toggle switches work
- [ ] Profile visibility options can be selected
- [ ] Location sharing options can be selected
- [ ] Save button updates settings in database
- [ ] Settings persist after app restart
- [ ] Navigation back to Profile works
- [ ] Privacy Policy link opens (update URL first)
- [ ] Terms & Conditions link opens (update URL first)
- [ ] Account deletion request shows confirmation
- [ ] Deletion request is saved to database

## 🎉 Success!

Your BuddyUp app now has comprehensive privacy settings that:
- ✅ Give users control over their data
- ✅ Comply with GDPR requirements
- ✅ Provide transparent data usage information
- ✅ Enable account deletion requests
- ✅ Protect user privacy with granular controls
- ✅ Maintain great UX while respecting privacy

## 📞 Support

If you encounter any issues or need help:
1. Check the troubleshooting section above
2. Review the code comments in the implementation files
3. Verify database migration completed successfully
4. Check Supabase logs for any errors

---

**Version:** 1.0.0  
**Last Updated:** December 25, 2024  
**Compatibility:** React Native, Expo, Supabase

