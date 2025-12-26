// src/screens/MyTrips/MyTripsScreen.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { getDetailedUserTrips, leaveTrip, completeTrip } from '../../services/tripHelpers';
import { TripWithCreator } from '../../types';
import { supabase } from '../../services/supabase';
import dayjs from 'dayjs';

type TabType = 'upcoming' | 'completed' | 'cancelled';

export default function MyTripsScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [trips, setTrips] = useState<TripWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const subscriptionRef = useRef<any>(null);

  // Reload trips when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadTrips();
      setupRealtimeSubscriptions();
      
      return () => {
        // Cleanup subscriptions when screen loses focus
        if (subscriptionRef.current) {
          supabase.removeChannel(subscriptionRef.current);
        }
      };
    }, [profile])
  );

  const loadTrips = async () => {
    if (!profile) return;
    
    setLoading(true);
    try {
      const userTrips = await getDetailedUserTrips(profile.id);
      setTrips(userTrips);
    } catch (error) {
      console.error('Error loading trips:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    if (!profile) return;

    // Subscribe to changes in trips and participants for user's trips
    const tripsChannel = supabase
      .channel('my-trips-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips',
          filter: `creator_id=eq.${profile.id}`,
        },
        (payload) => {
          console.log('My trip changed:', payload);
          loadTrips();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trip_participants',
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          console.log('My participation changed:', payload);
          loadTrips();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trip_participants',
        },
        (payload) => {
          console.log('Trip participants updated:', payload);
          // Reload to catch pending requests on trips I created
          loadTrips();
        }
      )
      .subscribe();

    subscriptionRef.current = tripsChannel;
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTrips();
  };

  const handleLeaveTrip = (tripId: string) => {
    Alert.alert(
      'Leave Trip',
      'Are you sure you want to leave this trip?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveTrip(tripId, profile!.id);
              Alert.alert('Success', 'You have left the trip');
              loadTrips();
            } catch (error) {
              Alert.alert('Error', 'Could not leave trip');
            }
          },
        },
      ]
    );
  };

  const handleCompleteTrip = (tripId: string) => {
    Alert.alert(
      'Complete Trip',
      'Mark this trip as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              await completeTrip(tripId);
              Alert.alert('Success', 'Trip marked as completed');
              loadTrips();
            } catch (error) {
              Alert.alert('Error', 'Could not complete trip');
            }
          },
        },
      ]
    );
  };

  const getFilteredTrips = () => {
    const now = new Date();
    
    switch (activeTab) {
      case 'upcoming':
        return trips.filter(
          (trip) =>
            trip.status === 'active' &&
            new Date(trip.departure_time) > now
        );
      case 'completed':
        return trips.filter((trip) => trip.status === 'completed');
      case 'cancelled':
        return trips.filter((trip) => {
          // Show cancelled trips OR past trips that are still 'active' (not completed)
          if (trip.status === 'cancelled') return true;
          if (trip.status === 'active' && new Date(trip.departure_time) <= now) return true;
          return false;
        });
      default:
        return [];
    }
  };

  const renderTripCard = ({ item }: { item: TripWithCreator }) => {
    const isCreator = item.creator_id === profile?.id;
    const isPending = item.userParticipantStatus === 'pending';
    const departureTime = dayjs(item.departure_time);
    const isPast = departureTime.isBefore(dayjs());
    
    // Count pending requests for creator
    const pendingRequestsCount = isCreator 
      ? item.participants?.filter((p: any) => p.status === 'pending').length || 0
      : 0;
    
    // Determine trip status for display
    const isCancelled = item.status === 'cancelled';
    const isExpired = item.status === 'active' && isPast; // Past but not completed

    return (
      <TouchableOpacity
        style={[
          styles.tripCard,
          isCancelled && styles.tripCardCancelled,
          isExpired && styles.tripCardExpired,
        ]}
        onPress={() => router.push(`/main/trip-details?tripId=${item.id}` as any)}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            {isCreator ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>👑 Your Trip</Text>
              </View>
            ) : isPending ? (
              <View style={[styles.badge, styles.badgePending]}>
                <Text style={styles.badgeText}>⏳ Pending</Text>
              </View>
            ) : (
              <View style={[styles.badge, styles.badgeJoined]}>
                <Text style={styles.badgeText}>🎫 Joined</Text>
              </View>
            )}
            {isCancelled && (
              <View style={[styles.badge, styles.badgeCancelled]}>
                <Text style={styles.badgeText}>✕ Cancelled</Text>
              </View>
            )}
            {isExpired && (
              <View style={[styles.badge, styles.badgeExpired]}>
                <Text style={styles.badgeText}>⚠️ Expired</Text>
              </View>
            )}
            {pendingRequestsCount > 0 && (
              <View style={[styles.badge, styles.badgeRequests]}>
                <Text style={styles.badgeText}>🔔 {pendingRequestsCount} Request{pendingRequestsCount > 1 ? 's' : ''}</Text>
              </View>
            )}
          </View>
          <Text style={styles.serviceType}>{item.service_type}</Text>
        </View>

        {/* Title */}
        <Text style={styles.tripTitle}>{item.title}</Text>

        {/* Route */}
        <View style={styles.routeContainer}>
          <View style={styles.routeMarkers}>
            <View style={styles.originDot} />
            <View style={styles.routeLine} />
            <View style={styles.destinationDot} />
          </View>
          <View style={styles.routeDetails}>
            <Text style={styles.locationText} numberOfLines={1}>
              {item.pickup_location}
            </Text>
            <Text style={styles.locationText} numberOfLines={1}>
              {item.dropoff_location}
            </Text>
          </View>
        </View>

        {/* Trip Info */}
        <View style={styles.tripInfo}>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>🕐</Text>
            <Text style={styles.infoText}>
              {departureTime.format('MMM D, h:mm A')}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>👥</Text>
            <Text style={styles.infoText}>
              {item.participants?.filter((p: any) => p.status === 'accepted').length || 0} joined
            </Text>
          </View>
        </View>

        {/* Actions */}
        {activeTab === 'upcoming' && (
          <View style={styles.actions}>
            {isCreator ? (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonPrimary]}
                  onPress={() => router.push(`/main/chat?tripId=${item.id}`)}
                >
                  <Text style={styles.actionButtonTextPrimary}>💬 Chat</Text>
                </TouchableOpacity>
                {!isPast && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonSecondary]}
                    onPress={() => handleCompleteTrip(item.id)}
                  >
                    <Text style={styles.actionButtonTextSecondary}>✓ Complete</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : !isPending ? (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonPrimary]}
                  onPress={() => router.push(`/main/chat?tripId=${item.id}`)}
                >
                  <Text style={styles.actionButtonTextPrimary}>💬 Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonDanger]}
                  onPress={() => handleLeaveTrip(item.id)}
                >
                  <Text style={styles.actionButtonTextDanger}>Leave</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.pendingText}>Waiting for approval...</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const filteredTrips = getFilteredTrips();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Trips</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            Upcoming
          </Text>
          {trips.filter(t => t.status === 'active' && new Date(t.departure_time) > new Date()).length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>
                {trips.filter(t => t.status === 'active' && new Date(t.departure_time) > new Date()).length}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
            Completed
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'cancelled' && styles.tabActive]}
          onPress={() => setActiveTab('cancelled')}
        >
          <Text style={[styles.tabText, activeTab === 'cancelled' && styles.tabTextActive]}>
            Cancelled
          </Text>
        </TouchableOpacity>
      </View>

      {/* Trips List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={filteredTrips}
          keyExtractor={(item) => item.id}
          renderItem={renderTripCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>
                {activeTab === 'upcoming' ? '🚗' : activeTab === 'completed' ? '✓' : '✕'}
              </Text>
              <Text style={styles.emptyText}>
                {activeTab === 'upcoming'
                  ? 'No upcoming trips'
                  : activeTab === 'completed'
                  ? 'No completed trips'
                  : 'No cancelled trips'}
              </Text>
              <Text style={styles.emptySubtext}>
                {activeTab === 'upcoming'
                  ? 'Find a ride or create your own trip'
                  : 'Your trip history will appear here'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tripCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  tripCardCancelled: {
    borderColor: '#FF3B30',
    borderWidth: 2,
    backgroundColor: '#FFF5F5',
  },
  tripCardExpired: {
    borderColor: '#FF9500',
    borderWidth: 2,
    backgroundColor: '#FFF9F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    backgroundColor: '#FFD60A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgePending: {
    backgroundColor: '#FF9500',
  },
  badgeJoined: {
    backgroundColor: '#34C759',
  },
  badgeCancelled: {
    backgroundColor: '#FF3B30',
  },
  badgeExpired: {
    backgroundColor: '#FF9500',
  },
  badgeRequests: {
    backgroundColor: '#007AFF',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  serviceType: {
    fontSize: 13,
    color: '#666',
    textTransform: 'capitalize',
  },
  tripTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  routeContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  routeMarkers: {
    width: 20,
    alignItems: 'center',
    marginRight: 12,
  },
  originDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34C759',
  },
  routeLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 4,
  },
  destinationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
  },
  routeDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  locationText: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  tripInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonPrimary: {
    backgroundColor: '#007AFF',
  },
  actionButtonSecondary: {
    backgroundColor: '#34C759',
  },
  actionButtonDanger: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  actionButtonTextPrimary: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtonTextSecondary: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtonTextDanger: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
  pendingText: {
    fontSize: 14,
    color: '#FF9500',
    fontStyle: 'italic',
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});