# Help & Support - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### 1. Run Database Migration
```sql
-- Open Supabase SQL Editor and run:
-- Copy contents from "Help Support Migration.sql"
```

This creates 4 new tables:
- `support_tickets` - User support requests
- `bug_reports` - Bug submissions
- `user_reports` - User behavior reports
- `emergency_alerts` - Emergency notifications

### 2. Update Contact Information
Edit `src/screens/Profile/HelpSupportScreen.tsx`:
```typescript
// Line ~XXX
const email = 'support@buddyup.com'; // ← Change to your email
```

Edit `src/services/supportHelpers.ts`:
```typescript
export function getSupportContact() {
  return {
    email: 'support@buddyup.com', // ← Change
    phone: '+1-555-BUDDY-UP', // ← Change
    // ...
  };
}
```

### 3. Update Resource Links
Edit `src/screens/Profile/HelpSupportScreen.tsx`:
```typescript
const openCommunityGuidelines = () => {
  Linking.openURL('https://YOUR-DOMAIN.com/community-guidelines');
};

const openSafetyTips = () => {
  Linking.openURL('https://YOUR-DOMAIN.com/safety-tips');
};
```

### 4. Test
```bash
npm start
# Navigate to: Profile → Help & Support
```

---

## 📂 Files Added

```
BuddyUp/
├── src/screens/Profile/
│   └── HelpSupportScreen.tsx .............. Main UI (700+ lines)
├── src/services/
│   └── supportHelpers.ts .................. Helper functions
├── app/main/
│   └── help-support.tsx ................... Route file
├── Help Support Migration.sql ............. Database script
├── HELP_SUPPORT_GUIDE.md .................. Full documentation
└── HELP_SUPPORT_QUICK_START.md ............ This file
```

---

## 🎯 What Users Can Do

| Feature | Description |
|---------|-------------|
| **Browse FAQs** | 14 pre-written answers in 4 categories |
| **Contact Support** | Submit tickets via in-app form or email |
| **Report Bugs** | Help improve the app |
| **Emergency Help** | Quick access to 911 and support |
| **View Resources** | Community guidelines and safety tips |

---

## 📋 FAQ Categories

### 🚗 Trips (4 FAQs)
- Creating trips
- Joining trips
- Leaving trips
- Editing trips

### 💳 Payments (4 FAQs)
- How payment works
- Cost splitting
- Refund policy
- Refund timing

### 🛡️ Safety (4 FAQs)
- Reporting users
- Safety features
- Emergency procedures
- Safety tips

### 👤 Account (2 FAQs)
- Account verification
- Account deletion

---

## 🔧 Key Functions

```typescript
// Submit support ticket
await submitSupportTicket(userId, subject, message, priority);

// Report a bug
await reportBug(userId, description);

// Report a user
await reportUser(reporterId, reportedUserId, reason, details, tripId);

// Send emergency alert
await sendEmergencyAlert(userId, location, message);

// Get support contact
const contact = getSupportContact();

// Check if support is available
const available = isSupportAvailable();
```

---

## ✅ Testing Checklist

### UI Tests
- [ ] Help & Support screen loads
- [ ] Emergency banner is visible
- [ ] Quick action cards work
- [ ] FAQ categories filter correctly
- [ ] FAQ items expand/collapse
- [ ] Support form opens
- [ ] Bug report form opens
- [ ] Resource links work
- [ ] Email button works

### Functionality Tests
- [ ] Can submit support ticket
- [ ] Can report a bug
- [ ] Emergency alert shows options
- [ ] Email app opens correctly
- [ ] Navigation works
- [ ] Forms validate input
- [ ] Success messages appear

### Database Tests
- [ ] Support tickets save to database
- [ ] Bug reports save to database
- [ ] RLS policies work
- [ ] Timestamps are correct

---

## 🎨 UI Preview

```
┌─────────────────────────────────┐
│  ← Help & Support               │
├─────────────────────────────────┤
│ 🚨 Emergency?                   │
│ Tap here for immediate help  →  │
├─────────────────────────────────┤
│ Quick Actions                   │
│ ┌──────────┐  ┌──────────┐     │
│ │ 💬       │  │ 🐛       │     │
│ │ Contact  │  │ Report   │     │
│ │ Support  │  │ Bug      │     │
│ └──────────┘  └──────────┘     │
├─────────────────────────────────┤
│ Frequently Asked Questions      │
│ [📚 All] [🚗 Trips] [💳 Pay]   │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ How do I create a trip?  +  │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ How do I join a trip?    +  │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ Resources                       │
│ 📖 Community Guidelines      →  │
│ 🛡️  Safety Tips              →  │
├─────────────────────────────────┤
│ Still Need Help?                │
│ 📧 Email Support                │
│ support@buddyup.com             │
│ [Send Email]                    │
└─────────────────────────────────┘
```

---

## 🔐 Security Features

- ✅ RLS policies protect user data
- ✅ Support tickets are private
- ✅ Emergency alerts are prioritized
- ✅ User reports are confidential
- ✅ All data is encrypted

---

## 📊 Database Schema

### support_tickets
```sql
id, user_id, subject, message, status, priority,
assigned_to, created_at, updated_at, resolved_at
```

### bug_reports
```sql
id, user_id, description, status, priority,
created_at, updated_at, fixed_at
```

### user_reports
```sql
id, reporter_id, reported_user_id, trip_id,
reason, details, status, created_at, reviewed_at
```

### emergency_alerts
```sql
id, user_id, location, message, status,
created_at, responded_at, resolved_at
```

---

## 🎯 Next Actions

### Required
1. ✅ Run database migration
2. ✅ Update support email
3. ✅ Test all features
4. 📝 Create Community Guidelines
5. 📝 Create Safety Tips document

### Recommended
6. 🔔 Set up email notifications
7. 👨‍💼 Create admin dashboard
8. 📧 Configure automated responses
9. 👥 Train support team
10. 📊 Set up analytics

### Optional
11. 💬 Add live chat
12. 🤖 Add AI-powered search
13. 🎥 Add video tutorials
14. 👥 Create community forum
15. 📝 Add feedback widget

---

## 🚨 Emergency Features

### Emergency Banner
- Prominent red banner at top
- Direct access to 911
- Support team contact
- Always visible

### Emergency Alert Function
```typescript
await sendEmergencyAlert(
  userId,
  { latitude: 40.7128, longitude: -74.0060 },
  'Feeling unsafe on current trip'
);
```

### Emergency Response
- Immediate notification to support team
- Location tracking
- Priority handling
- Follow-up procedures

---

## 📞 Support Contact Setup

### Email Setup
1. Create support@buddyup.com
2. Set up auto-responders
3. Configure ticket system
4. Train support team

### Response Times
- **Urgent**: 1-2 hours
- **High**: 4-6 hours
- **Medium**: 12-24 hours
- **Low**: 24-48 hours

---

## 🐛 Troubleshooting

### Tickets not saving?
- Check Supabase connection
- Verify migration ran
- Check RLS policies

### Email not opening?
- Verify device email app
- Test with different apps
- Provide alternatives

### FAQs not showing?
- Check FAQ_DATA array
- Verify category filter
- Check console for errors

---

## 📚 Documentation

For more details, see:
- **Complete Guide**: `HELP_SUPPORT_GUIDE.md`
- **Database Migration**: `Help Support Migration.sql`
- **Component Code**: `src/screens/Profile/HelpSupportScreen.tsx`
- **Helper Functions**: `src/services/supportHelpers.ts`

---

## 🎉 Success!

Your app now has:
- ✅ Comprehensive FAQ system
- ✅ In-app support tickets
- ✅ Bug reporting
- ✅ Emergency assistance
- ✅ Resource links
- ✅ Multiple contact options

**Users can get help easily, and you can track all support requests!**

---

**Quick Start Complete!** 🎊

*Your BuddyUp app now has professional support features!*

