-- Privacy Settings Migration for BuddyUp
-- Run this SQL in your Supabase SQL Editor

-- ============================================
-- ADD PRIVACY SETTINGS COLUMNS TO PROFILES TABLE
-- ============================================

-- Add privacy settings columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'limited', 'private')),
ADD COLUMN IF NOT EXISTS location_sharing TEXT DEFAULT 'trips_only' CHECK (location_sharing IN ('always', 'trips_only', 'off')),
ADD COLUMN IF NOT EXISTS show_email BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS show_phone BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS allow_messages BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS deletion_requested BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMP WITH TIME ZONE;

-- Create index for deletion requests
CREATE INDEX IF NOT EXISTS idx_profiles_deletion_requested ON profiles(deletion_requested, deletion_requested_at);

-- ============================================
-- ACCOUNT DELETION REQUESTS TABLE (GDPR Compliance)
-- ============================================

CREATE TABLE IF NOT EXISTS account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'cancelled')),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on deletion requests table
ALTER TABLE account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own deletion requests
CREATE POLICY "Users can view own deletion requests"
  ON account_deletion_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own deletion requests
CREATE POLICY "Users can create own deletion requests"
  ON account_deletion_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for deletion requests
CREATE INDEX IF NOT EXISTS idx_deletion_requests_user ON account_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON account_deletion_requests(status, requested_at);

-- ============================================
-- HELPER FUNCTION: Check if profile is visible
-- ============================================

CREATE OR REPLACE FUNCTION can_view_profile(
  target_user_id UUID,
  current_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  visibility TEXT;
  is_in_same_trip BOOLEAN;
BEGIN
  -- User can always view their own profile
  IF target_user_id = current_user_id THEN
    RETURN TRUE;
  END IF;

  -- Get target user's visibility setting
  SELECT profile_visibility INTO visibility
  FROM profiles
  WHERE id = target_user_id;

  -- Public profiles are always visible
  IF visibility = 'public' THEN
    RETURN TRUE;
  END IF;

  -- Private profiles are never visible
  IF visibility = 'private' THEN
    RETURN FALSE;
  END IF;

  -- Limited profiles: check if users are in the same trip
  IF visibility = 'limited' THEN
    SELECT EXISTS (
      SELECT 1
      FROM trip_participants tp1
      JOIN trip_participants tp2 ON tp1.trip_id = tp2.trip_id
      WHERE tp1.user_id = current_user_id
        AND tp2.user_id = target_user_id
        AND tp1.status = 'accepted'
        AND tp2.status = 'accepted'
    ) INTO is_in_same_trip;

    RETURN is_in_same_trip;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- UPDATE EXISTING PROFILES WITH DEFAULT VALUES
-- ============================================

-- Set default privacy settings for existing users
UPDATE profiles
SET 
  profile_visibility = COALESCE(profile_visibility, 'public'),
  location_sharing = COALESCE(location_sharing, 'trips_only'),
  show_email = COALESCE(show_email, FALSE),
  show_phone = COALESCE(show_phone, FALSE),
  allow_messages = COALESCE(allow_messages, TRUE),
  deletion_requested = COALESCE(deletion_requested, FALSE)
WHERE profile_visibility IS NULL 
   OR location_sharing IS NULL 
   OR show_email IS NULL 
   OR show_phone IS NULL 
   OR allow_messages IS NULL 
   OR deletion_requested IS NULL;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN profiles.profile_visibility IS 'Controls who can see the user profile: public (everyone), limited (trip participants only), private (minimal info)';
COMMENT ON COLUMN profiles.location_sharing IS 'Controls when location is shared: always, trips_only, or off';
COMMENT ON COLUMN profiles.show_email IS 'Whether to display email address on profile';
COMMENT ON COLUMN profiles.show_phone IS 'Whether to display phone number on profile';
COMMENT ON COLUMN profiles.allow_messages IS 'Whether to allow direct messages from other users';
COMMENT ON COLUMN profiles.deletion_requested IS 'Whether user has requested account deletion';
COMMENT ON COLUMN profiles.deletion_requested_at IS 'When the deletion was requested';

COMMENT ON TABLE account_deletion_requests IS 'Tracks GDPR-compliant account deletion requests';

