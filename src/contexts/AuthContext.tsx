// src/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, Profile } from '../services/supabase';
import {
  registerForFCMNotifications,
  setupForegroundNotificationHandler,
  setupBackgroundNotificationHandler,
  setupTokenRefreshHandler,
  deleteFCMToken,
} from '../services/fcmNotificationService';
import {
  subscribeToNotifications,
  unsubscribeFromNotifications,
  getUnreadCount,
} from '../services/notificationService';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationChannel, setNotificationChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Set up FCM and Realtime notifications when user logs in
  useEffect(() => {
    if (profile) {
      setupNotifications();
    }

    return () => {
      cleanupNotifications();
    };
  }, [profile]);

  const setupNotifications = async () => {
    if (!profile) return;

    try {
      // Register for FCM push notifications
      const fcmToken = await registerForFCMNotifications(profile.id);
      if (fcmToken) {
        console.log('FCM notifications registered successfully');
      }

      // Set up FCM handlers for foreground and background notifications
      const unsubscribeForeground = setupForegroundNotificationHandler();
      setupBackgroundNotificationHandler();
      
      // Set up token refresh handler
      const unsubscribeTokenRefresh = setupTokenRefreshHandler(profile.id);

      // Set up Supabase Realtime for in-app notification updates
      const channel = subscribeToNotifications(
        profile.id,
        (notification) => {
          console.log('New notification via Realtime:', notification);
          // You can show an in-app notification banner here
        },
        (unreadCount) => {
          console.log('Unread count updated:', unreadCount);
          // Update badge count or UI
        }
      );
      
      setNotificationChannel(channel);

      // Cleanup function
      return () => {
        unsubscribeForeground();
        unsubscribeTokenRefresh();
      };
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  };

  const cleanupNotifications = async () => {
    if (notificationChannel) {
      await unsubscribeFromNotifications(notificationChannel);
      setNotificationChannel(null);
    }
  };

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      // Profile is created automatically by database trigger
      if (data.user) {
        await loadProfile(data.user.id);
      }
    } catch (error: any) {
      throw new Error(error.message || 'Sign up failed');
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await loadProfile(data.user.id);
      }
    } catch (error: any) {
      throw new Error(error.message || 'Sign in failed');
    }
  };

  const signOut = async () => {
    try {
      // Clean up notifications before signing out
      if (profile) {
        await deleteFCMToken(profile.id);
      }
      await cleanupNotifications();

      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setProfile(null);
    } catch (error: any) {
      throw new Error(error.message || 'Sign out failed');
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};