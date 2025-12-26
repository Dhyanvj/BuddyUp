// Supabase Edge Function: send-trip-reminders
// This function should be run on a schedule (e.g., every hour) to send trip reminders
// It sends notifications 24 hours and 1 hour before trip departure

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  try {
    console.log('Running trip reminders check...');

    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    const now = new Date();
    
    // Calculate time windows for reminders
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const twentyThreeHoursFromNow = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const fiftyNineMinutesFromNow = new Date(now.getTime() + 59 * 60 * 1000);

    // Find trips departing in ~24 hours
    const { data: trips24h, error: error24h } = await supabase
      .from('trips')
      .select('id, title, departure_time, creator_id')
      .eq('status', 'active')
      .gte('departure_time', twentyThreeHoursFromNow.toISOString())
      .lte('departure_time', twentyFourHoursFromNow.toISOString());

    if (error24h) {
      console.error('Error fetching 24h trips:', error24h);
    }

    // Find trips departing in ~1 hour
    const { data: trips1h, error: error1h } = await supabase
      .from('trips')
      .select('id, title, departure_time, creator_id')
      .eq('status', 'active')
      .gte('departure_time', fiftyNineMinutesFromNow.toISOString())
      .lte('departure_time', oneHourFromNow.toISOString());

    if (error1h) {
      console.error('Error fetching 1h trips:', error1h);
    }

    let notificationsSent = 0;

    // Send 24-hour reminders
    if (trips24h && trips24h.length > 0) {
      for (const trip of trips24h) {
        // Get all participants
        const { data: participants } = await supabase
          .from('trip_participants')
          .select('user_id')
          .eq('trip_id', trip.id)
          .eq('status', 'accepted');

        const userIds = [
          trip.creator_id,
          ...(participants?.map(p => p.user_id) || [])
        ];

        // Remove duplicates
        const uniqueUserIds = [...new Set(userIds)];

        const notifications = uniqueUserIds.map(userId => ({
          user_id: userId,
          trip_id: trip.id,
          type: 'trip_reminder',
          title: 'Trip Tomorrow',
          body: `Your trip "${trip.title}" is departing in 24 hours!`,
        }));

        const { error: insertError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (!insertError) {
          notificationsSent += notifications.length;
          console.log(`Sent 24h reminders for trip ${trip.id}`);
        } else {
          console.error(`Error sending 24h reminders for trip ${trip.id}:`, insertError);
        }
      }
    }

    // Send 1-hour reminders
    if (trips1h && trips1h.length > 0) {
      for (const trip of trips1h) {
        // Get all participants
        const { data: participants } = await supabase
          .from('trip_participants')
          .select('user_id')
          .eq('trip_id', trip.id)
          .eq('status', 'accepted');

        const userIds = [
          trip.creator_id,
          ...(participants?.map(p => p.user_id) || [])
        ];

        // Remove duplicates
        const uniqueUserIds = [...new Set(userIds)];

        const notifications = uniqueUserIds.map(userId => ({
          user_id: userId,
          trip_id: trip.id,
          type: 'trip_reminder',
          title: 'Trip Starting Soon!',
          body: `Your trip "${trip.title}" is departing in 1 hour!`,
        }));

        const { error: insertError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (!insertError) {
          notificationsSent += notifications.length;
          console.log(`Sent 1h reminders for trip ${trip.id}`);
        } else {
          console.error(`Error sending 1h reminders for trip ${trip.id}:`, insertError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${notificationsSent} trip reminders`,
        trips24h: trips24h?.length || 0,
        trips1h: trips1h?.length || 0,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-trip-reminders function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

