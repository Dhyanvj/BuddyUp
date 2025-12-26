// src/services/tripHelpers.ts
import { supabase, Trip, TripParticipant } from './supabase';
import { CreateTripForm, TripWithCreator } from '../types';

/**
 * Search for nearby trips based on user location
 */
export const searchNearbyTrips = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 10
): Promise<TripWithCreator[]> => {
  try {
    console.log('🔍 Calling search_nearby_trips RPC...');
    console.log('📍 Params:', { latitude, longitude, radiusKm });
    
    const { data, error } = await supabase
      .rpc('search_nearby_trips', {
        user_lat: latitude,
        user_lng: longitude,
        radius_km: radiusKm,
      });

    if (error) {
      console.error('❌ RPC Error:', error);
      throw error;
    }

    console.log('✅ RPC returned:', data?.length || 0, 'trips');

    if (!data || data.length === 0) {
      return [];
    }

    // Fetch creator details for each trip
    const tripsWithCreators: TripWithCreator[] = [];
    
    for (const trip of data) {
      console.log('🔄 Processing trip:', trip.id, trip.title);
      
      const { data: creator, error: creatorError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', trip.creator_id)
        .single();

      if (creatorError) {
        console.error('❌ Error fetching creator:', creatorError);
        continue;
      }

      tripsWithCreators.push({
        id: trip.id,
        creator_id: trip.creator_id,
        title: trip.title,
        description: trip.description,
        pickup_location: trip.pickup_location,
        pickup_lat: parseFloat(trip.pickup_lat),
        pickup_lng: parseFloat(trip.pickup_lng),
        // Remove this line:
        // pickup_geography: trip.pickup_geography,
        dropoff_location: trip.dropoff_location,
        dropoff_lat: parseFloat(trip.dropoff_lat),
        dropoff_lng: parseFloat(trip.dropoff_lng),
        departure_time: trip.departure_time,
        service_type: trip.service_type,
        available_seats: trip.available_seats,
        total_seats: trip.total_seats,
        estimated_cost: trip.estimated_cost,
        status: trip.status,
        created_at: trip.created_at,
        updated_at: trip.updated_at,
        distance_km: parseFloat(trip.distance_km),
        creator: creator,
      });
    }

    console.log('✅ Processed trips:', tripsWithCreators.length);
    return tripsWithCreators;
  } catch (error) {
    console.error('❌ Error in searchNearbyTrips:', error);
    throw error;
  }
};

/**
 * Get trip details with creator and participants
 */
export const getTripDetails = async (tripId: string): Promise<TripWithCreator | null> => {
  try {
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single();

    if (tripError) throw tripError;

    // Get creator
    const { data: creator } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', trip.creator_id)
      .single();

    // Get all participants (pending and accepted)
    const { data: participants } = await supabase
      .from('trip_participants')
      .select(`
        *,
        user:profiles(*)
      `)
      .eq('trip_id', tripId)
      .in('status', ['pending', 'accepted']);

    return {
      ...trip,
      pickup_lat: Number(trip.pickup_lat),
      pickup_lng: Number(trip.pickup_lng),
      dropoff_lat: Number(trip.dropoff_lat),
      dropoff_lng: Number(trip.dropoff_lng),
      creator,
      participants: participants || [],
    };
  } catch (error) {
    console.error('Error getting trip details:', error);
    return null;
  }
};

/**
 * Create a new trip
 */
export const createTrip = async (
  formData: CreateTripForm,
  creatorId: string
): Promise<Trip> => {
  try {
    const tripData = {
      creator_id: creatorId,
      title: formData.title,
      description: formData.description || null,
      pickup_location: formData.pickup_location,
      pickup_lat: formData.pickup_lat,
      pickup_lng: formData.pickup_lng,
      dropoff_location: formData.dropoff_location,
      dropoff_lat: formData.dropoff_lat,
      dropoff_lng: formData.dropoff_lng,
      departure_time: formData.departure_time.toISOString(),
      service_type: formData.service_type,
      available_seats: formData.available_seats,
      total_seats: formData.available_seats,
      estimated_cost: formData.estimated_cost || null,
      status: 'active',
    };

    const { data, error } = await supabase
      .from('trips')
      .insert([tripData])
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error creating trip:', error);
    throw error;
  }
};

/**
 * Request to join a trip
 */
export const requestToJoinTrip = async (
  tripId: string,
  userId: string,
  seatsRequested: number = 1
): Promise<TripParticipant> => {
  try {
    // Use upsert to handle cases where user previously left the trip
    // This will update the existing record instead of creating a duplicate
    const { data, error } = await supabase
      .from('trip_participants')
      .upsert(
        {
          trip_id: tripId,
          user_id: userId,
          seats_requested: seatsRequested,
          status: 'pending',
          joined_at: new Date().toISOString(), // Reset joined_at timestamp
        },
        {
          onConflict: 'trip_id,user_id', // Specify the unique constraint columns
        }
      )
      .select()
      .single();

    if (error) throw error;

    // Create notification for trip creator
    const { data: trip } = await supabase
      .from('trips')
      .select('creator_id, title')
      .eq('id', tripId)
      .single();

    if (trip) {
      // Insert notification - Edge Function will automatically send FCM push
      await supabase.from('notifications').insert([
        {
          user_id: trip.creator_id,
          trip_id: tripId,
          type: 'trip_request',
          title: 'New Trip Request',
          body: `Someone wants to join your trip: ${trip.title}`,
        },
      ]);
    }

    return data;
  } catch (error) {
    console.error('Error requesting to join trip:', error);
    throw error;
  }
};

/**
 * Note: Push notifications are now handled automatically by Supabase Edge Function
 * When a notification is inserted into the database, the Edge Function will
 * automatically send an FCM push notification to the user's device
 */

/**
 * Accept a trip request (creator only)
 */
export const acceptTripRequest = async (
  participantId: string,
  tripId: string
): Promise<void> => {
  try {
    // Get participant info first
    const { data: participant } = await supabase
      .from('trip_participants')
      .select('user_id, seats_requested')
      .eq('id', participantId)
      .single();

    if (!participant) throw new Error('Participant not found');

    // Update participant status
    const { error: updateError } = await supabase
      .from('trip_participants')
      .update({ status: 'accepted' })
      .eq('id', participantId);

    if (updateError) throw updateError;

    // Decrease available seats by the number of seats requested
    const { data: trip } = await supabase
      .from('trips')
      .select('available_seats, title')
      .eq('id', tripId)
      .single();

    if (trip) {
      await supabase
        .from('trips')
        .update({ available_seats: trip.available_seats - participant.seats_requested })
        .eq('id', tripId);
    }

    // Send notification to requester - Edge Function will send FCM push
    if (participant) {
      await supabase.from('notifications').insert([
        {
          user_id: participant.user_id,
          trip_id: tripId,
          type: 'request_accepted',
          title: 'Request Accepted!',
          body: `Your request to join "${trip?.title}" was accepted. You can now chat with the group.`,
        },
      ]);
    }
  } catch (error) {
    console.error('Error accepting trip request:', error);
    throw error;
  }
};

/**
 * Reject a trip request (creator only)
 */
export const rejectTripRequest = async (
  participantId: string,
  tripId: string
): Promise<void> => {
  try {
    // Get participant info first
    const { data: participant } = await supabase
      .from('trip_participants')
      .select('user_id')
      .eq('id', participantId)
      .single();

    if (!participant) throw new Error('Participant not found');

    // Update participant status to rejected
    const { error: updateError } = await supabase
      .from('trip_participants')
      .update({ status: 'rejected' })
      .eq('id', participantId);

    if (updateError) throw updateError;

    // Get trip title for notification
    const { data: trip } = await supabase
      .from('trips')
      .select('title')
      .eq('id', tripId)
      .single();

    // Send notification to requester - Edge Function will send FCM push
    if (participant && trip) {
      await supabase.from('notifications').insert([
        {
          user_id: participant.user_id,
          trip_id: tripId,
          type: 'request_rejected',
          title: 'Request Declined',
          body: `Your request to join "${trip.title}" was declined.`,
        },
      ]);
    }
  } catch (error) {
    console.error('Error rejecting trip request:', error);
    throw error;
  }
};

/**
 * Get user's trips (created and joined)
 */
export const getUserTrips = async (userId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase.rpc('get_user_trips', {
      user_uuid: userId,
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting user trips:', error);
    return [];
  }
};

/**
 * Cancel a trip (creator only)
 */
export const cancelTrip = async (tripId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('trips')
      .update({ status: 'cancelled' })
      .eq('id', tripId);

    if (error) throw error;

    // Notify all participants
    const { data: participants } = await supabase
      .from('trip_participants')
      .select('user_id')
      .eq('trip_id', tripId);

    if (participants) {
      const notifications = participants.map((p) => ({
        user_id: p.user_id,
        trip_id: tripId,
        type: 'trip_cancelled',
        title: 'Trip Cancelled',
        body: 'The trip you joined has been cancelled.',
      }));

      await supabase.from('notifications').insert(notifications);
    }
  } catch (error) {
    console.error('Error cancelling trip:', error);
    throw error;
  }
};

/**
 * Leave a trip (participant only)
 */
export const leaveTrip = async (tripId: string, userId: string): Promise<void> => {
  try {
    // Update participant status to 'left'
    const { error: updateError } = await supabase
      .from('trip_participants')
      .update({ status: 'left' })
      .eq('trip_id', tripId)
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // Increase available seats
    const { data: trip } = await supabase
      .from('trips')
      .select('available_seats')
      .eq('id', tripId)
      .single();

    if (trip) {
      await supabase
        .from('trips')
        .update({ available_seats: trip.available_seats + 1 })
        .eq('id', tripId);
    }

    // Notify trip creator
    const { data: tripData } = await supabase
      .from('trips')
      .select('creator_id')
      .eq('id', tripId)
      .single();

    if (tripData) {
      await supabase.from('notifications').insert([
        {
          user_id: tripData.creator_id,
          trip_id: tripId,
          type: 'participant_left',
          title: 'Participant Left',
          body: 'A participant has left your trip.',
        },
      ]);
    }
  } catch (error) {
    console.error('Error leaving trip:', error);
    throw error;
  }
};

/**
 * Remove a participant from a trip (creator only)
 */
export const removeParticipant = async (
  participantId: string,
  tripId: string,
  reason?: string
): Promise<void> => {
  try {
    // Get participant info first
    const { data: participant } = await supabase
      .from('trip_participants')
      .select('user_id, seats_requested, status')
      .eq('id', participantId)
      .single();

    if (!participant) throw new Error('Participant not found');

    // Update participant status to 'removed'
    const { error: updateError } = await supabase
      .from('trip_participants')
      .update({ status: 'removed' })
      .eq('id', participantId);

    if (updateError) throw updateError;

    // If participant was accepted, increase available seats
    if (participant.status === 'accepted') {
      const { data: trip } = await supabase
        .from('trips')
        .select('available_seats, title')
        .eq('id', tripId)
        .single();

      if (trip) {
        await supabase
          .from('trips')
          .update({ 
            available_seats: trip.available_seats + participant.seats_requested 
          })
          .eq('id', tripId);

        // Send notification to removed participant
        const notificationBody = reason 
          ? `You have been removed from "${trip.title}". Reason: ${reason}`
          : `You have been removed from "${trip.title}".`;

        await supabase.from('notifications').insert([
          {
            user_id: participant.user_id,
            trip_id: tripId,
            type: 'participant_removed',
            title: 'Removed from Trip',
            body: notificationBody,
          },
        ]);

        // Send push notification
        //await sendPushNotification(
          //participant.user_id,
          //'Removed from Trip',
          //notificationBody,
          //{ tripId, type: 'participant_removed' }
        //);
      }
    }
  } catch (error) {
    console.error('Error removing participant:', error);
    throw error;
  }
};

/**
 * Mark trip as completed (creator only)
 */
export const completeTrip = async (tripId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('trips')
      .update({ status: 'completed' })
      .eq('id', tripId);

    if (error) throw error;

    // Notify all participants to leave reviews
    const { data: participants } = await supabase
      .from('trip_participants')
      .select('user_id')
      .eq('trip_id', tripId)
      .eq('status', 'accepted');

    if (participants) {
      const notifications = participants.map((p) => ({
        user_id: p.user_id,
        trip_id: tripId,
        type: 'trip_completed',
        title: 'Trip Completed',
        body: 'How was your trip? Leave a review!',
      }));

      await supabase.from('notifications').insert(notifications);
    }
  } catch (error) {
    console.error('Error completing trip:', error);
    throw error;
  }
};

/**
 * Get detailed user trips with all information
 */
export const getDetailedUserTrips = async (userId: string): Promise<TripWithCreator[]> => {
  try {
    // Get trips user created
    const { data: createdTrips } = await supabase
      .from('trips')
      .select(`
        *,
        creator:profiles(*),
        participants:trip_participants(
          *,
          user:profiles(*)
        )
      `)
      .eq('creator_id', userId)
      .order('departure_time', { ascending: false });

    // Get trips user joined
    const { data: joinedTrips } = await supabase
      .from('trip_participants')
      .select(`
        *,
        trip:trips(
          *,
          creator:profiles(*),
          participants:trip_participants(
            *,
            user:profiles(*)
          )
        )
      `)
      .eq('user_id', userId)
      .in('status', ['accepted', 'pending']);

    const allTrips: TripWithCreator[] = [];

    // Add created trips
    if (createdTrips) {
      allTrips.push(...createdTrips);
    }

    // Add joined trips
    if (joinedTrips) {
      joinedTrips.forEach((pt: any) => {
        if (pt.trip) {
          allTrips.push({
            ...pt.trip,
            userParticipantStatus: pt.status,
          });
        }
      });
    }

    // Sort by departure time
    allTrips.sort((a, b) => 
      new Date(b.departure_time).getTime() - new Date(a.departure_time).getTime()
    );

    return allTrips;
  } catch (error) {
    console.error('Error getting detailed user trips:', error);
    return [];
  }
};