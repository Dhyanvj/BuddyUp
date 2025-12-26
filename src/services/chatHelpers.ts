// src/services/chatHelpers.ts
import { supabase, Message } from './supabase';
import { MessageWithSender } from '../types';

/**
 * Get all messages for a trip
 */
export const getTripMessages = async (tripId: string): Promise<MessageWithSender[]> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles(*)
      `)
      .eq('trip_id', tripId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
};

/**
 * Send a message to a trip
 */
export const sendMessage = async (
  tripId: string,
  senderId: string,
  content: string
): Promise<Message | null> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          trip_id: tripId,
          sender_id: senderId,
          content: content.trim(),
          message_type: 'text',
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Get sender name for notification
    const { data: sender } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', senderId)
      .single();

    // Get all trip participants except the sender
    const { data: participants } = await supabase
      .from('trip_participants')
      .select('user_id')
      .eq('trip_id', tripId)
      .eq('status', 'accepted')
      .neq('user_id', senderId);

    // Also include trip creator
    const { data: trip } = await supabase
      .from('trips')
      .select('creator_id, title')
      .eq('id', tripId)
      .single();

    // Create notifications for all participants (except sender)
    if (participants && trip) {
      const recipientIds = [
        ...participants.map(p => p.user_id),
        ...(trip.creator_id !== senderId ? [trip.creator_id] : [])
      ];

      // Remove duplicates
      const uniqueRecipients = [...new Set(recipientIds)];

      if (uniqueRecipients.length > 0) {
        const notifications = uniqueRecipients.map(userId => ({
          user_id: userId,
          trip_id: tripId,
          type: 'new_message',
          title: `New message in ${trip.title}`,
          body: `${sender?.full_name || 'Someone'}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
        }));

        await supabase.from('notifications').insert(notifications);
      }
    }

    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    return null;
  }
};

/**
 * Send a system message (e.g., "User joined the trip")
 */
export const sendSystemMessage = async (
  tripId: string,
  content: string
): Promise<void> => {
  try {
    // Use a system user ID (you can create a special system user in your DB)
    // For now, we'll just use a placeholder
    await supabase.from('messages').insert([
      {
        trip_id: tripId,
        sender_id: '00000000-0000-0000-0000-000000000000', // System user
        content,
        message_type: 'system',
      },
    ]);
  } catch (error) {
    console.error('Error sending system message:', error);
  }
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (
  messageIds: string[],
  userId: string
): Promise<void> => {
  try {
    for (const messageId of messageIds) {
      const { data: message } = await supabase
        .from('messages')
        .select('read_by')
        .eq('id', messageId)
        .single();

      if (message && !message.read_by.includes(userId)) {
        await supabase
          .from('messages')
          .update({
            read_by: [...message.read_by, userId],
          })
          .eq('id', messageId);
      }
    }
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
};

/**
 * Subscribe to new messages in real-time
 * Enhanced with better error handling and duplicate prevention
 */
export const subscribeToMessages = (
  tripId: string,
  callback: (message: any) => void
) => {
  console.log(`📡 Subscribing to messages for trip: ${tripId}`);
  
  const subscription = supabase
    .channel(`messages:${tripId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `trip_id=eq.${tripId}`,
      },
      async (payload) => {
        console.log('📨 New message received:', payload.new);
        
        try {
          // Fetch sender details
          const { data: sender, error: senderError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', payload.new.sender_id)
            .single();

          if (senderError) {
            console.error('Error fetching sender:', senderError);
            // Still show message even if sender fetch fails
            callback({
              ...payload.new,
              sender: {
                id: payload.new.sender_id,
                full_name: 'Unknown User',
                email: '',
                avatar_url: null,
                rating: 0,
                total_trips: 0,
              },
            });
            return;
          }

          callback({
            ...payload.new,
            sender,
          });
        } catch (error) {
          console.error('Error processing new message:', error);
        }
      }
    )
    .subscribe((status) => {
      console.log(`🔌 Subscription status: ${status}`);
      if (status === 'SUBSCRIBED') {
        console.log('✅ Successfully subscribed to messages');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Error subscribing to messages');
      }
    });

  return subscription;
};

/**
 * Subscribe to typing indicators (users currently typing)
 */
export const subscribeToTypingStatus = (
  tripId: string,
  userId: string,
  onTypingChange: (typingUsers: string[]) => void
) => {
  const channel = supabase.channel(`typing:${tripId}`);
  
  // Track typing users
  const typingUsers = new Set<string>();
  
  // Listen to presence changes
  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const currentlyTyping = Object.values(state)
        .flat()
        .filter((user: any) => user.typing && user.user_id !== userId)
        .map((user: any) => user.user_id);
      
      onTypingChange(currentlyTyping);
    })
    .subscribe();

  return {
    channel,
    startTyping: () => {
      channel.track({
        user_id: userId,
        typing: true,
        online_at: new Date().toISOString(),
      });
    },
    stopTyping: () => {
      channel.track({
        user_id: userId,
        typing: false,
        online_at: new Date().toISOString(),
      });
    },
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
};

/**
 * Get unread message count for a trip
 */
export const getUnreadMessageCount = async (
  tripId: string,
  userId: string
): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('id, read_by')
      .eq('trip_id', tripId)
      .neq('sender_id', userId);

    if (error) throw error;

    const unreadCount = data?.filter(
      (msg) => !msg.read_by.includes(userId)
    ).length || 0;

    return unreadCount;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};