// src/services/privacyHelpers.ts
import { supabase } from './supabase';
import { Alert } from 'react-native';

export type ProfileVisibility = 'public' | 'limited' | 'private';
export type LocationSharing = 'always' | 'trips_only' | 'off';

export interface PrivacySettings {
  profile_visibility: ProfileVisibility;
  location_sharing: LocationSharing;
  show_email: boolean;
  show_phone: boolean;
  allow_messages: boolean;
}

/**
 * Get user's privacy settings
 */
export async function getPrivacySettings(
  userId: string
): Promise<PrivacySettings | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('profile_visibility, location_sharing, show_email, show_phone, allow_messages')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return {
      profile_visibility: (data.profile_visibility as ProfileVisibility) || 'public',
      location_sharing: (data.location_sharing as LocationSharing) || 'trips_only',
      show_email: data.show_email ?? false,
      show_phone: data.show_phone ?? false,
      allow_messages: data.allow_messages ?? true,
    };
  } catch (error) {
    console.error('Error fetching privacy settings:', error);
    return null;
  }
}

/**
 * Update user's privacy settings
 */
export async function updatePrivacySettings(
  userId: string,
  settings: PrivacySettings
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        profile_visibility: settings.profile_visibility,
        location_sharing: settings.location_sharing,
        show_email: settings.show_email,
        show_phone: settings.show_phone,
        allow_messages: settings.allow_messages,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    return false;
  }
}

/**
 * Request account deletion (GDPR compliant)
 */
export async function requestAccountDeletion(userId: string): Promise<boolean> {
  try {
    // Create a deletion request record
    const { error: requestError } = await supabase
      .from('account_deletion_requests')
      .insert({
        user_id: userId,
        requested_at: new Date().toISOString(),
        status: 'pending',
      });

    if (requestError) {
      // If table doesn't exist yet, mark profile for deletion
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          deletion_requested: true,
          deletion_requested_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (profileError) throw profileError;
    }

    // Send notification email (you can implement this with a backend function)
    // For now, we'll just mark it in the database

    return true;
  } catch (error) {
    console.error('Error requesting account deletion:', error);
    return false;
  }
}

/**
 * Check if user profile should be visible based on privacy settings
 */
export function canViewProfile(
  targetUserId: string,
  currentUserId: string | undefined,
  profileVisibility: ProfileVisibility,
  isInSameTrip: boolean = false
): boolean {
  // User can always view their own profile
  if (currentUserId === targetUserId) {
    return true;
  }

  switch (profileVisibility) {
    case 'public':
      return true;
    case 'limited':
      return isInSameTrip;
    case 'private':
      return false;
    default:
      return true;
  }
}

/**
 * Check if user's location should be shared based on settings
 */
export function shouldShareLocation(
  locationSharing: LocationSharing,
  isOnActiveTrip: boolean = false
): boolean {
  switch (locationSharing) {
    case 'always':
      return true;
    case 'trips_only':
      return isOnActiveTrip;
    case 'off':
      return false;
    default:
      return false;
  }
}

/**
 * Get filtered profile data based on privacy settings
 */
export function getFilteredProfileData(
  profile: any,
  canViewFull: boolean
): any {
  if (canViewFull) {
    return profile;
  }

  // Return limited profile data
  return {
    id: profile.id,
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
    rating: profile.rating,
    total_trips: profile.total_trips,
    email_verified: profile.email_verified,
    phone_verified: profile.phone_verified,
    id_verified: profile.id_verified,
    // Hide sensitive information
    email: profile.show_email ? profile.email : null,
    phone_number: profile.show_phone ? profile.phone_number : null,
    bio: profile.profile_visibility === 'private' ? null : profile.bio,
  };
}

/**
 * Check if user allows direct messages
 */
export async function canSendDirectMessage(
  targetUserId: string,
  currentUserId: string
): Promise<boolean> {
  if (targetUserId === currentUserId) {
    return false;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('allow_messages')
      .eq('id', targetUserId)
      .single();

    if (error) throw error;

    return data.allow_messages ?? true;
  } catch (error) {
    console.error('Error checking message permissions:', error);
    return false;
  }
}

