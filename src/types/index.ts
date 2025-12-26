// src/types/index.ts
import { Profile, Trip, TripParticipant, Message } from '../services/supabase';

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  MyTrips: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  HomeScreen: undefined;
  TripDetails: { tripId: string };
  CreateTrip: undefined;
  Chat: { tripId: string };
};

// Extended types with joined data
export interface TripWithCreator extends Trip {
  creator: Profile;
  distance_km?: number;
  participants?: TripParticipant[];
  userParticipantStatus?: 'pending' | 'accepted' | 'rejected' | 'left';
}

export interface MessageWithSender extends Message {
  sender: Profile;
}

export interface TripParticipantWithUser extends TripParticipant {
  user: Profile;
}

// Form types
export interface CreateTripForm {
  title: string;
  description?: string;
  pickup_location: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_location: string;
  dropoff_lat: number;
  dropoff_lng: number;
  departure_time: Date;
  service_type: 'uber' | 'bolt' | 'lyft' | 'other';
  available_seats: number;
  estimated_cost?: number;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

// Component prop types
export interface TripCardProps {
  trip: TripWithCreator;
  onPress: () => void;
}

export interface UserAvatarProps {
  user: Profile;
  size?: number;
  showRating?: boolean;
}

export interface ChatBubbleProps {
  message: MessageWithSender;
  isCurrentUser: boolean;
}