# Chat Real-Time Features Documentation

## Overview

The BuddyUp chat system uses Supabase Real-Time to provide instant messaging with advanced features like typing indicators, read receipts, and duplicate prevention.

---

## Features Implemented

### 1. ✅ Real-Time Message Delivery

Messages appear instantly for all participants without manual refresh.

**How It Works:**
- Subscribes to `INSERT` events on the `messages` table filtered by `trip_id`
- Automatically fetches sender profile information
- Prevents duplicate messages with ID checking
- Auto-scrolls to latest message

**Code:**
```typescript
const messageSubscription = subscribeToMessages(tripId, (newMessage) => {
  // Prevent duplicates
  setMessages((prev) => {
    const exists = prev.some(msg => msg.id === newMessage.id);
    if (exists) return prev;
    return [...prev, newMessage];
  });
  
  // Auto-scroll
  setTimeout(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, 100);
});
```

---

### 2. ✅ Typing Indicators

See when other users are typing in real-time.

**Features:**
- Shows "Someone is typing..." when 1 user is typing
- Shows "X people are typing..." for multiple users
- Animated typing dots
- Automatically stops after 2 seconds of inactivity
- Excludes current user from typing indicator

**How It Works:**
- Uses Supabase Presence API
- Tracks typing state per user
- Broadcasts typing status to all chat participants
- Debounces typing status updates

**Code:**
```typescript
const typingSubscription = subscribeToTypingStatus(
  tripId,
  profile.id,
  (typing) => {
    setTypingUsers(typing); // Array of user IDs currently typing
  }
);

// Start typing
typingSubscription.startTyping();

// Stop typing (after 2 seconds or on send)
typingSubscription.stopTyping();
```

---

### 3. ✅ Read Receipts

Automatically marks messages as read when viewed.

**Features:**
- Tracks which users have read each message
- Uses `read_by` array field in messages table
- Automatically marks messages as read when chat is open
- Only marks messages from other users

**Code:**
```typescript
useEffect(() => {
  if (messages.length > 0 && profile) {
    const unreadMessageIds = messages
      .filter(msg => 
        msg.sender_id !== profile.id && 
        !msg.read_by?.includes(profile.id)
      )
      .map(msg => msg.id);
    
    if (unreadMessageIds.length > 0) {
      markMessagesAsRead(unreadMessageIds, profile.id);
    }
  }
}, [messages, profile]);
```

---

### 4. ✅ Enhanced Error Handling

Robust error handling for network issues and failed operations.

**Features:**
- Graceful fallback if sender profile fetch fails
- Shows "Unknown User" instead of crashing
- Restores message text if send fails
- Logs subscription status changes
- Handles connection errors

**Error Recovery:**
```typescript
try {
  const { data: sender, error: senderError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', payload.new.sender_id)
    .single();

  if (senderError) {
    // Fallback to unknown user
    callback({
      ...payload.new,
      sender: {
        id: payload.new.sender_id,
        full_name: 'Unknown User',
        // ... default values
      },
    });
    return;
  }
  
  callback({ ...payload.new, sender });
} catch (error) {
  console.error('Error processing new message:', error);
}
```

---

### 5. ✅ Duplicate Prevention

Ensures messages aren't displayed twice.

**Problem Solved:**
Sometimes real-time subscriptions can deliver the same message multiple times, especially during reconnections.

**Solution:**
```typescript
setMessages((prev) => {
  const exists = prev.some(msg => msg.id === newMessage.id);
  if (exists) return prev; // Don't add if already exists
  return [...prev, newMessage];
});
```

---

### 6. ✅ Connection Status Monitoring

Tracks real-time connection status.

**Features:**
- Logs when successfully subscribed
- Detects channel errors
- Helps with debugging connection issues

**Code:**
```typescript
.subscribe((status) => {
  console.log(`🔌 Subscription status: ${status}`);
  if (status === 'SUBSCRIBED') {
    console.log('✅ Successfully subscribed to messages');
  } else if (status === 'CHANNEL_ERROR') {
    console.error('❌ Error subscribing to messages');
  }
});
```

---

### 7. ✅ Proper Cleanup

Prevents memory leaks and duplicate subscriptions.

**Features:**
- Unsubscribes from messages on unmount
- Clears typing indicators
- Cancels pending timeouts

**Code:**
```typescript
return () => {
  // Cleanup subscriptions
  if (subscriptionRef.current) {
    subscriptionRef.current.unsubscribe();
  }
  if (typingSubscriptionRef.current) {
    typingSubscriptionRef.current.unsubscribe();
  }
  if (typingTimeoutRef.current) {
    clearTimeout(typingTimeoutRef.current);
  }
};
```

---

## Database Setup

### Enable Realtime for Messages Table

Run this SQL in Supabase SQL Editor:

```sql
-- Enable realtime for messages table
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

Or via Supabase Dashboard:
1. Database → Replication
2. Enable for: `messages`

---

## API Functions

### `subscribeToMessages(tripId, callback)`

Subscribe to real-time messages for a specific trip.

**Parameters:**
- `tripId` (string) - The trip ID to subscribe to
- `callback` (function) - Called when new message arrives

**Returns:**
- Subscription object with `.unsubscribe()` method

**Example:**
```typescript
const subscription = subscribeToMessages(tripId, (newMessage) => {
  console.log('New message:', newMessage);
  setMessages(prev => [...prev, newMessage]);
});

// Cleanup
subscription.unsubscribe();
```

---

### `subscribeToTypingStatus(tripId, userId, onTypingChange)`

Subscribe to typing indicators for a trip.

**Parameters:**
- `tripId` (string) - The trip ID
- `userId` (string) - Current user's ID (to exclude from typing list)
- `onTypingChange` (function) - Called with array of user IDs currently typing

**Returns:**
- Object with methods:
  - `channel` - The Supabase channel
  - `startTyping()` - Broadcast typing start
  - `stopTyping()` - Broadcast typing stop
  - `unsubscribe()` - Cleanup

**Example:**
```typescript
const typingSubscription = subscribeToTypingStatus(
  tripId,
  currentUserId,
  (typingUsers) => {
    console.log('Users typing:', typingUsers);
  }
);

// User starts typing
typingSubscription.startTyping();

// User stops typing
typingSubscription.stopTyping();

// Cleanup
typingSubscription.unsubscribe();
```

---

### `sendMessage(tripId, senderId, content)`

Send a message to a trip chat.

**Parameters:**
- `tripId` (string) - The trip ID
- `senderId` (string) - User ID of sender
- `content` (string) - Message text

**Returns:**
- Promise<Message | null>

**Example:**
```typescript
const message = await sendMessage(tripId, userId, "Hello!");
if (message) {
  console.log('Message sent:', message.id);
}
```

---

### `markMessagesAsRead(messageIds, userId)`

Mark multiple messages as read.

**Parameters:**
- `messageIds` (string[]) - Array of message IDs
- `userId` (string) - User ID to add to read_by

**Returns:**
- Promise<void>

**Example:**
```typescript
const unreadIds = messages
  .filter(msg => !msg.read_by.includes(userId))
  .map(msg => msg.id);

await markMessagesAsRead(unreadIds, userId);
```

---

### `getUnreadMessageCount(tripId, userId)`

Get count of unread messages for a trip.

**Parameters:**
- `tripId` (string) - The trip ID
- `userId` (string) - User ID

**Returns:**
- Promise<number> - Count of unread messages

**Example:**
```typescript
const unreadCount = await getUnreadMessageCount(tripId, userId);
console.log(`You have ${unreadCount} unread messages`);
```

---

## UI Components

### Typing Indicator

Animated dots showing when users are typing.

**Visual:**
```
● ● ● Someone is typing...
```

**Styling:**
- 3 animated blue dots
- Gray italic text
- Light gray background
- Appears above input bar

---

### Auto-Scroll Behavior

**Features:**
- Auto-scrolls to bottom on initial load
- Auto-scrolls when new message arrives
- Smooth animation for new messages
- Instant scroll on first load

**Code:**
```typescript
setTimeout(() => {
  flatListRef.current?.scrollToEnd({ animated: true });
}, 100);
```

---

## Testing Guide

### Test Real-Time Messaging

1. **Device A & B**: Open the same trip chat
2. **Device A**: Type a message and send
3. ✅ **Device B**: Should see message instantly (within ~100ms)
4. **Device B**: Reply
5. ✅ **Device A**: Should see reply instantly

### Test Typing Indicators

1. **Device A & B**: Open the same trip chat
2. **Device A**: Start typing (don't send)
3. ✅ **Device B**: Should see "Someone is typing..." with animated dots
4. **Device A**: Stop typing for 2+ seconds
5. ✅ **Device B**: Typing indicator should disappear
6. **Device A & C**: Both start typing
7. ✅ **Device B**: Should see "2 people are typing..."

### Test Duplicate Prevention

1. **Device A**: Send a message
2. **Device A**: Check that message appears only once
3. Disconnect/reconnect network
4. ✅ Messages should not duplicate after reconnection

### Test Error Handling

1. Disconnect network
2. Try to send a message
3. ✅ Should restore message text if failed
4. Reconnect network
5. Try sending again
6. ✅ Should work normally

---

## Performance Considerations

### Optimization Strategies

1. **Filtered Subscriptions**
   - Only subscribe to messages for specific trip
   - Reduces unnecessary data transfer

2. **Efficient Updates**
   - Uses ID checking to prevent duplicates
   - Debounces typing indicators (2 second timeout)

3. **Memory Management**
   - Properly unsubscribes on unmount
   - Clears timeouts to prevent leaks

4. **Auto-Scroll Optimization**
   - Uses setTimeout to batch scroll operations
   - Smooth animation doesn't block UI

---

## Troubleshooting

### Messages Not Appearing Instantly

**Possible Causes:**
1. Realtime not enabled on `messages` table
2. RLS policies blocking access
3. Network connectivity issues

**Solution:**
```sql
-- Check if realtime is enabled
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'messages';

-- Enable if not present
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

### Typing Indicators Not Working

**Possible Causes:**
1. Presence not enabled in Supabase project
2. Channel name mismatch
3. User ID not being tracked correctly

**Debug:**
```typescript
// Add logging
.subscribe((status) => {
  console.log('Typing subscription status:', status);
});
```

### Duplicate Messages

**Possible Causes:**
1. Multiple subscriptions to same channel
2. Not cleaning up on unmount
3. Multiple instances of chat screen

**Solution:**
- Ensure proper cleanup in useEffect return
- Check that subscription ref is being used correctly
- Verify duplicate prevention logic

---

## Future Enhancements

### Potential Features

1. **Message Reactions** 🎉
   - React to messages with emoji
   - Real-time reaction updates

2. **Image Sharing** 📸
   - Upload and share photos
   - Image previews in chat

3. **Voice Messages** 🎤
   - Record and send audio
   - Playback controls

4. **Message Deletion** 🗑️
   - Delete own messages
   - Edit messages within 5 minutes

5. **Push Notifications** 🔔
   - Notify when new message arrives
   - Badge count on app icon

6. **Online Status** 🟢
   - Show who's currently online
   - Last seen timestamps

7. **Message Search** 🔍
   - Search through chat history
   - Filter by sender or date

8. **File Sharing** 📎
   - Share documents, PDFs
   - Download attachments

---

## Security Considerations

### Row Level Security (RLS)

Ensure proper RLS policies are in place:

```sql
-- Only trip participants can view messages
CREATE POLICY "Participants can view messages"
  ON messages FOR SELECT
  USING (
    trip_id IN (
      SELECT trip_id FROM trip_participants
      WHERE user_id = auth.uid() AND status = 'accepted'
    ) OR
    trip_id IN (
      SELECT id FROM trips WHERE creator_id = auth.uid()
    )
  );

-- Only participants can send messages
CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND (
      trip_id IN (
        SELECT trip_id FROM trip_participants
        WHERE user_id = auth.uid() AND status = 'accepted'
      ) OR
      trip_id IN (
        SELECT id FROM trips WHERE creator_id = auth.uid()
      )
    )
  );
```

---

## Summary

The chat system now provides:
- ✅ **Instant messaging** - Messages appear in real-time
- ✅ **Typing indicators** - See when others are typing
- ✅ **Read receipts** - Auto-mark messages as read
- ✅ **Duplicate prevention** - No message duplication
- ✅ **Error handling** - Graceful degradation on failures
- ✅ **Clean code** - Proper cleanup and memory management
- ✅ **Great UX** - Auto-scroll, smooth animations

The implementation is production-ready and handles edge cases properly!

