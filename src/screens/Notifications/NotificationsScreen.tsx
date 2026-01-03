// src/screens/Notifications/NotificationsScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import {
  fetchNotifications,
  subscribeToNotifications,
  unsubscribeFromNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadCount,
} from '../../services/notificationService';
import { setBadgeCount } from '../../services/fcmNotificationService';
import type { Notification } from '../../services/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export default function NotificationsScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const subscriptionRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (profile) {
      loadNotifications();
      setupRealtimeSubscription();
    }

    return () => {
      cleanupSubscription();
    };
  }, [profile]);

  const loadNotifications = async () => {
    if (!profile) return;

    try {
      const data = await fetchNotifications(profile.id);
      setNotifications(data);
      
      const count = await getUnreadCount(profile.id);
      setUnreadCount(count);
      
      // Update iOS badge count
      await setBadgeCount(count);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!profile) {
      console.log('⚠️ [Notifications] No profile, skipping realtime subscription');
      return;
    }

    console.log('🔔 [Notifications] Setting up realtime subscription for:', profile.id);
    
    const channel = subscribeToNotifications(
      profile.id,
      (notification) => {
        console.log('🔔 [Notifications] Received new notification, updating UI:', notification);
        // Add new notification to the list
        setNotifications(prev => [notification, ...prev]);
      },
      (count) => {
        console.log('🔔 [Notifications] Unread count updated:', count);
        setUnreadCount(count);
        setBadgeCount(count);
      }
    );

    subscriptionRef.current = channel;
    console.log('✅ [Notifications] Realtime subscription setup complete');
  };

  const cleanupSubscription = async () => {
    if (subscriptionRef.current) {
      console.log('🔕 [Notifications] Cleaning up realtime subscription');
      await unsubscribeFromNotifications(subscriptionRef.current);
      subscriptionRef.current = null;
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
      setNotifications(prev =>
        prev.map(n => (n.id === notification.id ? { ...n, read: true } : n))
      );
      
      const newCount = unreadCount - 1;
      setUnreadCount(newCount);
      await setBadgeCount(newCount);
    }

    // Navigate based on notification type
    if (notification.trip_id) {
      router.push({
        pathname: '/main/trip-details',
        params: { tripId: notification.trip_id },
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!profile) return;

    try {
      await markAllNotificationsAsRead(profile.id);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      await setBadgeCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
      Alert.alert('Error', 'Could not mark all notifications as read');
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Update unread count if it was unread
      const wasUnread = notifications.find(n => n.id === notificationId)?.read === false;
      if (wasUnread) {
        const newCount = unreadCount - 1;
        setUnreadCount(newCount);
        await setBadgeCount(newCount);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      Alert.alert('Error', 'Could not delete notification');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'trip_request':
        return '🚗';
      case 'request_accepted':
        return '✅';
      case 'request_rejected':
        return '❌';
      case 'new_message':
        return '💬';
      case 'trip_update':
        return '📝';
      case 'trip_cancelled':
        return '🚫';
      case 'trip_reminder':
        return '⏰';
      default:
        return '🔔';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.read && styles.unreadCard]}
      onPress={() => handleNotificationPress(item)}
      onLongPress={() => {
        Alert.alert(
          'Delete Notification',
          'Are you sure you want to delete this notification?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => handleDeleteNotification(item.id),
            },
          ]
        );
      }}
    >
      <View style={styles.notificationContent}>
        <Text style={styles.notificationIcon}>{getNotificationIcon(item.type)}</Text>
        <View style={styles.notificationText}>
          <Text style={[styles.notificationTitle, !item.read && styles.unreadText]}>
            {item.title}
          </Text>
          <Text style={styles.notificationBody}>{item.body}</Text>
          <Text style={styles.notificationTime}>{formatTime(item.created_at)}</Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <Text style={styles.markAllButton}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Unread count badge */}
      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Text style={styles.unreadBannerText}>
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* Notifications list */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyText}>No notifications</Text>
            <Text style={styles.emptySubtext}>
              You'll see notifications here when you receive them
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  markAllButton: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  unreadBanner: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#BBDEFB',
  },
  unreadBannerText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadCard: {
    backgroundColor: '#F0F8FF',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: 'bold',
  },
  notificationBody: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

