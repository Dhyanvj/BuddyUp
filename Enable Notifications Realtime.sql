-- Enable Realtime for Notifications Table
-- Run this SQL in your Supabase SQL Editor

-- Step 1: Enable replica identity (required for realtime)
ALTER TABLE notifications REPLICA IDENTITY FULL;

-- Step 2: Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Step 3: Verify realtime is enabled (optional check)
-- You can run this to confirm:
-- SELECT schemaname, tablename 
-- FROM pg_publication_tables 
-- WHERE pubname = 'supabase_realtime';

