// src/services/notificationService.ts
import { supabase } from './supabase';
import type { Notification } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Fetch user's notifications from database
 */
export const fetchNotifications = async (
  userId: string,
  limit: number = 50
): Promise<Notification[]> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (userId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (
  notificationId: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (
  userId: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (
  notificationId: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting notification:', error);
  }
};

/**
 * Delete all notifications for a user
 */
export const deleteAllNotifications = async (
  userId: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting all notifications:', error);
  }
};

/**
 * Subscribe to real-time notification updates (when app is open)
 * This only updates the UI - FCM handles actual push delivery
 */
export const subscribeToNotifications = (
  userId: string,
  onNotification: (notification: Notification) => void,
  onUnreadCountChange?: (count: number) => void
): RealtimeChannel => {
  console.log('Setting up Realtime notification subscription for user:', userId);

  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log('New notification received via Realtime:', payload);
        const notification = payload.new as Notification;
        onNotification(notification);

        // Update unread count if callback provided
        if (onUnreadCountChange) {
          getUnreadCount(userId).then(onUnreadCountChange);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log('Notification updated via Realtime:', payload);
        
        // Update unread count if callback provided
        if (onUnreadCountChange) {
          getUnreadCount(userId).then(onUnreadCountChange);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log('Notification deleted via Realtime:', payload);
        
        // Update unread count if callback provided
        if (onUnreadCountChange) {
          getUnreadCount(userId).then(onUnreadCountChange);
        }
      }
    )
    .subscribe((status) => {
      console.log('Notification subscription status:', status);
    });

  return channel;
};

/**
 * Unsubscribe from real-time notifications
 */
export const unsubscribeFromNotifications = async (
  channel: RealtimeChannel
): Promise<void> => {
  try {
    await supabase.removeChannel(channel);
    console.log('Unsubscribed from notification updates');
  } catch (error) {
    console.error('Error unsubscribing from notifications:', error);
  }
};

/**
 * Create a notification in the database
 * The Supabase Edge Function will automatically send FCM push notification
 */
export const createNotification = async (
  userId: string,
  tripId: string | null,
  type: string,
  title: string,
  body: string
): Promise<Notification | null> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([
        {
          user_id: userId,
          trip_id: tripId,
          type,
          title,
          body,
          read: false,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

/**
 * Create notifications for multiple users (bulk)
 */
export const createBulkNotifications = async (
  notifications: Array<{
    user_id: string;
    trip_id: string | null;
    type: string;
    title: string;
    body: string;
  }>
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) throw error;
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
  }
};

/**
 * Get notification by ID
 */
export const getNotificationById = async (
  notificationId: string
): Promise<Notification | null> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting notification:', error);
    return null;
  }
};

/**
 * Get notifications for a specific trip
 */
export const getTripNotifications = async (
  userId: string,
  tripId: string
): Promise<Notification[]> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting trip notifications:', error);
    return [];
  }
};
