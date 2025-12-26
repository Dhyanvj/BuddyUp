// Help & Support Integration Guide

## Overview

This guide explains the Help & Support feature that has been integrated into your BuddyUp app. This feature provides comprehensive user assistance including FAQs, support tickets, bug reporting, and emergency assistance.

## 🎯 Features Implemented

### 1. **Comprehensive FAQ System**
- **14 Pre-written FAQs** covering:
  - Trip creation and management
  - Joining and leaving trips
  - Payment and cost splitting
  - Refund policies
  - Safety features
  - User reporting
  - Emergency procedures
  - Account verification
  - Account deletion

- **Category Filtering**:
  - All (shows everything)
  - Trips 🚗
  - Payments 💳
  - Safety 🛡️
  - Account 👤

- **Expandable Answers**: Tap questions to expand/collapse detailed answers

### 2. **Support Ticket System**
- In-app support form
- Subject and message fields
- Automatic user identification
- Email fallback option
- 24-hour response time commitment

### 3. **Bug Reporting**
- Dedicated bug report form
- Detailed description field
- Tracked in database
- Helps improve app quality

### 4. **Emergency Assistance**
- Prominent emergency banner
- Quick access to 911
- Support team contact
- Safety-first approach

### 5. **Resources Section**
- Community Guidelines link
- Safety Tips link
- External documentation access

### 6. **Contact Information**
- Support email: support@buddyup.com
- Direct email integration
- Response time expectations

## 📁 Files Created/Modified

### New Files:
1. **`src/screens/Profile/HelpSupportScreen.tsx`**
   - Main Help & Support UI component
   - 700+ lines of comprehensive interface
   - FAQ data included

2. **`src/services/supportHelpers.ts`**
   - Support management utility functions
   - Ticket submission
   - Bug reporting
   - Emergency alerts

3. **`app/main/help-support.tsx`**
   - Route file for navigation

4. **`Help Support Migration.sql`**
   - Database migration script
   - Creates 4 new tables

5. **`HELP_SUPPORT_GUIDE.md`** (this file)
   - Complete documentation

### Modified Files:
1. **`src/screens/Profile/ProfileScreen.tsx`**
   - Added navigation to Help & Support

2. **`app/main/_layout.tsx`**
   - Registered help-support route

## 🚀 Setup Instructions

### Step 1: Run Database Migration

1. Open your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `Help Support Migration.sql`
4. Run the SQL script
5. Verify that the new tables were created successfully:
   - `support_tickets`
   - `bug_reports`
   - `user_reports`
   - `emergency_alerts`

### Step 2: Update Contact Information (Optional)

Edit `src/screens/Profile/HelpSupportScreen.tsx` and `src/services/supportHelpers.ts`:

```typescript
// Update support email
const email = 'support@buddyup.com'; // ← Change to your email

// Update in supportHelpers.ts
export function getSupportContact() {
  return {
    email: 'support@buddyup.com', // ← Change
    phone: '+1-555-BUDDY-UP', // ← Change
    // ...
  };
}
```

### Step 3: Update External Links

Edit `src/screens/Profile/HelpSupportScreen.tsx`:

```typescript
// Line ~XXX
const openCommunityGuidelines = () => {
  Linking.openURL('https://buddyup.com/community-guidelines'); // ← Update
};

// Line ~XXX
const openSafetyTips = () => {
  Linking.openURL('https://buddyup.com/safety-tips'); // ← Update
};
```

### Step 4: Test the Feature

```bash
npm start
# Navigate to: Profile → Help & Support
```

## 🎨 UI/UX Features

### Emergency Banner
- **Prominent red banner** at the top
- Immediate attention grabber
- Direct access to emergency services
- Safety-first design

### FAQ System
- **Category chips** for easy filtering
- **Expandable cards** for clean interface
- **Clear typography** for readability
- **Comprehensive answers** with step-by-step instructions

### Support Forms
- **Clean, simple forms** with clear labels
- **Character limits** to guide users
- **Loading states** during submission
- **Success feedback** after submission
- **Email fallback** if form fails

### Quick Actions
- **Large, tappable cards** for accessibility
- **Clear icons** for visual recognition
- **Prominent placement** for easy access

## 📊 Database Schema

### support_tickets Table
```sql
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  assigned_to UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  resolved_at TIMESTAMP
);
```

**Status values**: open, in_progress, resolved, closed
**Priority values**: low, medium, high, urgent

### bug_reports Table
```sql
CREATE TABLE bug_reports (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  description TEXT NOT NULL,
  status TEXT DEFAULT 'reported',
  priority TEXT DEFAULT 'medium',
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  fixed_at TIMESTAMP
);
```

**Status values**: reported, investigating, fixed, wont_fix

### user_reports Table
```sql
CREATE TABLE user_reports (
  id UUID PRIMARY KEY,
  reporter_id UUID REFERENCES profiles(id),
  reported_user_id UUID REFERENCES profiles(id),
  trip_id UUID REFERENCES trips(id),
  reason TEXT NOT NULL,
  details TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP,
  reviewed_at TIMESTAMP
);
```

**Status values**: pending, reviewing, action_taken, dismissed

### emergency_alerts Table
```sql
CREATE TABLE emergency_alerts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  location GEOGRAPHY(POINT, 4326),
  message TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP,
  responded_at TIMESTAMP,
  resolved_at TIMESTAMP
);
```

**Status values**: active, responded, resolved

## 🔧 Developer Guide

### Using Support Helper Functions

```typescript
import {
  submitSupportTicket,
  reportBug,
  reportUser,
  sendEmergencyAlert,
  getSupportContact,
  isSupportAvailable,
} from '../services/supportHelpers';

// Submit a support ticket
const success = await submitSupportTicket(
  userId,
  'Cannot join trip',
  'I keep getting an error when trying to join trips...',
  'high' // priority
);

// Report a bug
const success = await reportBug(
  userId,
  'App crashes when uploading profile picture on iOS 16'
);

// Report a user
const success = await reportUser(
  reporterId,
  reportedUserId,
  'Harassment',
  'User sent inappropriate messages in trip chat',
  tripId // optional
);

// Send emergency alert
const success = await sendEmergencyAlert(
  userId,
  { latitude: 40.7128, longitude: -74.0060 },
  'Feeling unsafe on current trip'
);

// Get support contact info
const contact = getSupportContact();
console.log(contact.email); // support@buddyup.com

// Check if support is available
const available = isSupportAvailable();
if (available) {
  // Show "Support is online" indicator
}
```

### Adding New FAQ Items

Edit `src/screens/Profile/HelpSupportScreen.tsx`:

```typescript
const FAQ_DATA: FAQItem[] = [
  // ... existing FAQs ...
  {
    id: '15', // Increment ID
    category: 'trips', // or 'payments', 'safety', 'account'
    question: 'Your new question here?',
    answer: 'Your detailed answer here...',
  },
];
```

### Customizing Categories

Edit the `categories` array:

```typescript
const categories = [
  { id: 'all', label: 'All', icon: '📚' },
  { id: 'trips', label: 'Trips', icon: '🚗' },
  { id: 'payments', label: 'Payments', icon: '💳' },
  { id: 'safety', label: 'Safety', icon: '🛡️' },
  { id: 'account', label: 'Account', icon: '👤' },
  // Add your new category:
  { id: 'newcat', label: 'New Category', icon: '🆕' },
];
```

## 📱 User Flow

```
Profile Screen
    ↓
Tap "Help & Support"
    ↓
Help & Support Screen
    ├─ Emergency Banner (tap for 911/support)
    ├─ Quick Actions
    │   ├─ Contact Support → Support Form
    │   └─ Report Bug → Bug Form
    ├─ FAQ Section
    │   ├─ Category Filter
    │   └─ Expandable Questions
    ├─ Resources
    │   ├─ Community Guidelines → External Link
    │   └─ Safety Tips → External Link
    └─ Contact Info
        └─ Email Support → Opens Email App
```

## 🎯 FAQ Content Overview

### Trips Category (4 FAQs)
1. How to create a trip
2. How to join a trip
3. How to leave a trip
4. How to edit a trip

### Payments Category (4 FAQs)
5. How payment works
6. How cost is split
7. Refund policy
8. Refund processing time

### Safety Category (4 FAQs)
9. How to report a user
10. Safety features overview
11. Emergency procedures
12. Safety tips

### Account Category (2 FAQs)
13. How to verify account
14. How to delete account

## 🔐 Security & Privacy

### Data Protection
- All support tickets are private to the user
- Row Level Security (RLS) enforces access control
- User reports are confidential
- Emergency alerts are handled with priority

### Emergency Handling
- Emergency alerts trigger immediate notifications
- Location data is captured for safety
- Support team is alerted in real-time
- Users are guided to call 911 first

## 🎯 Next Steps

### Immediate (Required)
1. ✅ Run database migration
2. ✅ Update support email address
3. ✅ Test all features
4. ✅ Create Community Guidelines document
5. ✅ Create Safety Tips document

### Short-term (Recommended)
6. Set up email notifications for support tickets
7. Create admin dashboard for ticket management
8. Set up automated responses
9. Train support team on ticket system
10. Create internal documentation for support staff

### Long-term (Optional)
11. Add live chat support
12. Implement AI-powered FAQ search
13. Add video tutorials
14. Create user community forum
15. Add in-app feedback widget

## 📊 Support Metrics to Track

### Response Times
- Average first response time
- Average resolution time
- Response time by priority level

### Ticket Volume
- Tickets per day/week/month
- Tickets by category
- Peak support hours

### User Satisfaction
- Ticket resolution rate
- User feedback scores
- Repeat ticket rate

### Common Issues
- Most frequently asked questions
- Most common bug reports
- Most common user complaints

## 🐛 Troubleshooting

### Issue: Support tickets not saving

**Solution:**
- Check Supabase connection
- Verify database migration ran successfully
- Check RLS policies are enabled
- Look at Supabase logs for errors

### Issue: Email link not working

**Solution:**
- Verify device has email app configured
- Test with different email apps
- Provide alternative contact methods

### Issue: Emergency banner not visible

**Solution:**
- Check component rendering
- Verify styles are applied
- Test on different screen sizes

## 📞 Support Team Setup

### Required Tools
1. Access to Supabase dashboard
2. Email system for support@buddyup.com
3. Ticket management system (or build one)
4. Emergency contact procedures

### Support Team Training
1. How to access support tickets in database
2. How to respond to tickets
3. Emergency alert procedures
4. User report investigation process
5. Bug report triage and escalation

### Response Time Goals
- **Urgent**: 1-2 hours
- **High**: 4-6 hours
- **Medium**: 12-24 hours
- **Low**: 24-48 hours

## 🎉 Success Metrics

Your app now provides:
- ✅ **Comprehensive FAQ** - 14 detailed answers
- ✅ **Support System** - In-app ticket submission
- ✅ **Bug Reporting** - User feedback channel
- ✅ **Emergency Access** - Safety-first design
- ✅ **Resource Links** - External documentation
- ✅ **Contact Options** - Multiple ways to reach support

---

**Version:** 1.0.0  
**Last Updated:** December 25, 2024  
**Compatibility:** React Native, Expo, Supabase

