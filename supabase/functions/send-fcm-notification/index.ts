// Supabase Edge Function: send-fcm-notification (Firebase Cloud Messaging V1 API)
// This function is triggered by database webhooks when a new notification is inserted
// It sends push notifications via Firebase Cloud Messaging V1 API

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const FIREBASE_PROJECT_ID = Deno.env.get('FIREBASE_PROJECT_ID');
const FIREBASE_CLIENT_EMAIL = Deno.env.get('FIREBASE_CLIENT_EMAIL');
const FIREBASE_PRIVATE_KEY = Deno.env.get('FIREBASE_PRIVATE_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface NotificationPayload {
  type: 'INSERT';
  table: string;
  record: {
    id: string;
    user_id: string;
    trip_id: string | null;
    type: string;
    title: string;
    body: string;
    read: boolean;
    created_at: string;
  };
  schema: string;
}

/**
 * Get OAuth 2.0 access token for Firebase Cloud Messaging V1 API
 */
async function getAccessToken(): Promise<string> {
  try {
    // Prepare JWT header and claim set
    const now = Math.floor(Date.now() / 1000);
    
    const header = {
      alg: 'RS256',
      typ: 'JWT',
    };
    
    const claimSet = {
      iss: FIREBASE_CLIENT_EMAIL,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    // Encode header and claim set
    const encodedHeader = btoa(JSON.stringify(header))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    const encodedClaimSet = btoa(JSON.stringify(claimSet))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const signatureInput = `${encodedHeader}.${encodedClaimSet}`;

    // Import private key
    const privateKey = FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '';
    
    // For Deno, we'll use a simpler approach with the jose library
    // Import the key
    const pemHeader = '-----BEGIN PRIVATE KEY-----';
    const pemFooter = '-----END PRIVATE KEY-----';
    const pemContents = privateKey
      .replace(pemHeader, '')
      .replace(pemFooter, '')
      .replace(/\s/g, '');
    
    // Create JWT manually using Web Crypto API
    const keyData = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
    
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      keyData,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    );

    // Sign the JWT
    const signatureBuffer = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      new TextEncoder().encode(signatureInput)
    );

    // Encode signature
    const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const jwt = `${signatureInput}.${signature}`;

    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Failed to get access token: ${error}`);
    }

    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
}

serve(async (req) => {
  try {
    // Parse the webhook payload
    const payload: NotificationPayload = await req.json();
    
    console.log('Received notification webhook:', payload);

    // Only process INSERT events
    if (payload.type !== 'INSERT') {
      return new Response(
        JSON.stringify({ message: 'Not an INSERT event, skipping' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const notification = payload.record;

    // Create Supabase client with service role key
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user's FCM token and platform from profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('push_token, platform')
      .eq('id', notification.user_id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!profile?.push_token) {
      console.log('User has no FCM token, skipping push notification');
      return new Response(
        JSON.stringify({ message: 'No FCM token found for user' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get OAuth 2.0 access token
    console.log('Getting OAuth access token...');
    const accessToken = await getAccessToken();

    // Prepare FCM V1 API message
    const fcmMessage = {
      message: {
        token: profile.push_token,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: {
          notificationId: notification.id,
          tripId: notification.trip_id || '',
          type: notification.type,
          createdAt: notification.created_at,
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            click_action: 'FLUTTER_NOTIFICATION_CLICK',
            channel_id: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: notification.title,
                body: notification.body,
              },
              sound: 'default',
              badge: 1,
            },
          },
        },
      },
    };

    // Send FCM push notification via V1 API
    console.log('Sending FCM notification...');
    const fcmResponse = await fetch(
      `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(fcmMessage),
      }
    );

    const fcmResult = await fcmResponse.json();

    if (!fcmResponse.ok) {
      console.error('FCM error:', fcmResult);
      return new Response(
        JSON.stringify({ error: 'Failed to send FCM notification', details: fcmResult }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('FCM notification sent successfully:', fcmResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Push notification sent',
        fcmResult 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-fcm-notification function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
