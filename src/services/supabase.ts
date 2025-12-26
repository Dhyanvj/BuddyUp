// src/services/supabase.ts
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Type definitions for database
export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone_number: string | null;
  bio: string | null;
  rating: number;
  total_trips: number;
  email_verified: boolean;
  phone_verified: boolean;
  id_verified: boolean;
  // Privacy settings
  profile_visibility: 'public' | 'limited' | 'private';
  location_sharing: 'always' | 'trips_only' | 'off';
  show_email: boolean;
  show_phone: boolean;
  allow_messages: boolean;
  deletion_requested: boolean;
  deletion_requested_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Trip = {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  pickup_location: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_location: string;
  dropoff_lat: number;
  dropoff_lng: number;
  departure_time: string;
  service_type: 'uber' | 'bolt' | 'lyft' | 'other';
  available_seats: number;
  total_seats: number;
  estimated_cost: number | null;
  status: 'active' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
};

export type TripParticipant = {
  id: string;
  trip_id: string;
  user_id: string;
  seats_requested: number;
  status: 'pending' | 'accepted' | 'rejected' | 'left';
  payment_status: 'unpaid' | 'pending' | 'paid' | 'refunded';
  joined_at: string;
};

export type Message = {
  id: string;
  trip_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'system';
  read_by: string[];
  created_at: string;
};

export type Review = {
  id: string;
  trip_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  tags: string[] | null;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  trip_id: string | null;
  type: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
};