// src/services/reviewHelpers.ts
import { supabase, Review } from './supabase';

/**
 * Submit a review for a user after a trip
 */
export const submitReview = async (
  tripId: string,
  reviewerId: string,
  revieweeId: string,
  rating: number,
  comment?: string,
  tags?: string[]
): Promise<Review | null> => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .insert([
        {
          trip_id: tripId,
          reviewer_id: reviewerId,
          reviewee_id: revieweeId,
          rating,
          comment: comment || null,
          tags: tags || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Update reviewee's total trips count
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_trips')
      .eq('id', revieweeId)
      .single();

    if (profile) {
      await supabase
        .from('profiles')
        .update({ total_trips: profile.total_trips + 1 })
        .eq('id', revieweeId);
    }

    return data;
  } catch (error) {
    console.error('Error submitting review:', error);
    return null;
  }
};

/**
 * Get reviews for a user
 */
export const getUserReviews = async (userId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        reviewer:profiles!reviews_reviewer_id_fkey(id, full_name, avatar_url),
        trip:trips(title, departure_time)
      `)
      .eq('reviewee_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
};

/**
 * Check if user can review participants from a trip
 */
export const getReviewableParticipants = async (
  tripId: string,
  userId: string
): Promise<any[]> => {
  try {
    // Get all participants except the current user
    const { data: participants } = await supabase
      .from('trip_participants')
      .select(`
        *,
        user:profiles(*)
      `)
      .eq('trip_id', tripId)
      .eq('status', 'accepted')
      .neq('user_id', userId);

    if (!participants) return [];

    // Filter out participants already reviewed
    const reviewableParticipants = [];
    for (const participant of participants) {
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('trip_id', tripId)
        .eq('reviewer_id', userId)
        .eq('reviewee_id', participant.user_id)
        .single();

      if (!existingReview) {
        reviewableParticipants.push(participant);
      }
    }

    return reviewableParticipants;
  } catch (error) {
    console.error('Error getting reviewable participants:', error);
    return [];
  }
};

/**
 * Get user statistics
 */
export const getUserStats = async (userId: string): Promise<any> => {
  try {
    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // Count trips created
    const { count: tripsCreated } = await supabase
      .from('trips')
      .select('id', { count: 'exact', head: true })
      .eq('creator_id', userId);

    // Count trips joined
    const { count: tripsJoined } = await supabase
      .from('trip_participants')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'accepted');

    // Count reviews received
    const { count: reviewCount } = await supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('reviewee_id', userId);

    return {
      profile,
      tripsCreated: tripsCreated || 0,
      tripsJoined: tripsJoined || 0,
      reviewCount: reviewCount || 0,
      totalTrips: (tripsCreated || 0) + (tripsJoined || 0),
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return null;
  }
};