-- Migration: Add platform column to profiles table for FCM notifications
-- This column stores the device platform (iOS or Android) for each user's push token
-- Run this migration in your Supabase SQL Editor

-- Add platform column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS platform TEXT CHECK (platform IN ('ios', 'android', NULL));

-- Add comment for documentation
COMMENT ON COLUMN profiles.platform IS 'Device platform for FCM push notifications (ios/android)';

-- Optional: Update existing records to NULL (they will be updated when users log in)
-- No action needed as new column defaults to NULL

-- Verify the migration
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name IN ('push_token', 'platform');

