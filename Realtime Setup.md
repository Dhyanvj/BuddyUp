# Supabase Realtime Setup

## Required Database Configuration

To enable real-time updates in the app, you need to enable Realtime on the following tables in your Supabase dashboard:

### Tables that need Realtime enabled:

1. **trips** - For trip updates (edits, cancellations, status changes)
2. **trip_participants** - For join requests, acceptances, rejections
3. **messages** - For real-time chat messaging

### How to Enable Realtime in Supabase:

1. Go to your Supabase Dashboard
2. Navigate to Database → Replication
3. Click on "0 tables" or the table count
4. Enable replication for these tables:
   - ✅ `trips`
   - ✅ `trip_participants`
   - ✅ `messages`

Alternatively, you can run this SQL in the Supabase SQL Editor:

```sql
-- Enable realtime for trips table
ALTER TABLE trips REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE trips;

-- Enable realtime for trip_participants table
ALTER TABLE trip_participants REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE trip_participants;

-- Enable realtime for messages table
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

## What Gets Synced in Real-Time:

### TripDetailsScreen
- Trip edits (title, description, time, location, etc.)
- Available seats updates
- New join requests
- Accepted/rejected participants
- Trip cancellation

### MyTripsScreen
- New trips created by user
- Trips user joins
- Participant status changes (pending → accepted/rejected)
- New join requests on trips user created
- Trip updates

### HomeScreen
- New active trips in the area
- Trip seat availability changes
- Trip status changes (active → cancelled/completed)

### ChatScreen
- New messages appear instantly
- Real-time message delivery
- No manual refresh needed
- Auto-scroll to new messages

## How It Works:

The app uses Supabase's real-time channels to subscribe to database changes:

1. **postgres_changes** - Listens to INSERT, UPDATE, DELETE events
2. **Filtered subscriptions** - Only listens to relevant data (e.g., specific trip_id)
3. **Automatic refresh** - Reloads data when changes are detected
4. **Cleanup** - Unsubscribes when components unmount to prevent memory leaks

## Testing Real-Time Updates:

1. Open the app on two devices/emulators
2. Create a trip on Device 1
3. On Device 2, you should see it appear immediately in the Home screen
4. Request to join on Device 2
5. On Device 1, the join request should appear instantly
6. Accept the request on Device 1
7. On Device 2, the status should update immediately

## Performance Notes:

- Subscriptions are scoped to minimize unnecessary updates
- Each screen only subscribes to relevant tables and filters
- Channels are cleaned up when screens unmount
- Debouncing prevents excessive reloads

