// src/screens/Home/TripDetailsScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import dayjs from 'dayjs';
import { useAuth } from '../../contexts/AuthContext';
import { getTripDetails, requestToJoinTrip, acceptTripRequest, rejectTripRequest, cancelTrip, removeParticipant } from '../../services/tripHelpers';
import { TripWithCreator, TripParticipantWithUser } from '../../types';
import UserAvatar from '../../components/UserAvatar';
import { supabase } from '../../services/supabase';

import { useRouter } from 'expo-router';

export default function TripDetailsScreen({ route, navigation }: any) {
  const { tripId } = route.params;
  const router = useRouter();
  const { profile } = useAuth();
  const [trip, setTrip] = useState<TripWithCreator | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [removeModalVisible, setRemoveModalVisible] = useState(false);
  const [participantToRemove, setParticipantToRemove] = useState<any>(null);
  const [removalReason, setRemovalReason] = useState('');
  const [seatsRequested, setSeatsRequested] = useState(1);
  const [message, setMessage] = useState('');
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    loadTripDetails();
    
    // Set up real-time subscriptions
    setupRealtimeSubscriptions();
    
    // Cleanup subscriptions on unmount
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [tripId]);

  const loadTripDetails = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    } else {
      setSyncing(true);
    }
    try {
      const tripData = await getTripDetails(tripId);
      setTrip(tripData);
    } catch (error) {
      console.error('Error loading trip:', error);
      if (!silent) {
        Alert.alert('Error', 'Could not load trip details');
      }
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to changes in the trips table for this specific trip
    const tripChannel = supabase
      .channel(`trip-${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'trips',
          filter: `id=eq.${tripId}`,
        },
        (payload) => {
          console.log('Trip changed:', payload);
          // Reload trip details silently when trip is updated
          loadTripDetails(true);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trip_participants',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          console.log('Trip participants changed:', payload);
          // Reload trip details silently when participants change
          loadTripDetails(true);
        }
      )
      .subscribe();

    subscriptionRef.current = tripChannel;
  };

  const handleJoinTrip = async () => {
    if (!profile || !trip) return;

    try {
      await requestToJoinTrip(trip.id, profile.id, seatsRequested);
      setJoinModalVisible(false);
      Alert.alert('Success', 'Your request has been sent!');
      loadTripDetails(); // Refresh
    } catch (error) {
      console.error('Error joining trip:', error);
      Alert.alert('Error', 'Could not send request. You may have already requested to join.');
    }
  };

  const handleAcceptRequest = async (participantId: string) => {
    if (!trip) return;

    try {
      // Optimistic update: Update UI immediately
      setTrip((prevTrip) => {
        if (!prevTrip) return prevTrip;
        return {
          ...prevTrip,
          participants: prevTrip.participants?.map((p: any) =>
            p.id === participantId ? { ...p, status: 'accepted' } : p
          ),
          available_seats: prevTrip.available_seats - (prevTrip.participants?.find((p: any) => p.id === participantId)?.seats_requested || 1),
        };
      });

      await acceptTripRequest(participantId, trip.id);
      Alert.alert('Success', 'Request accepted!');
      // Reload to ensure consistency
      loadTripDetails();
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert('Error', 'Could not accept request');
      // Revert optimistic update on error
      loadTripDetails();
    }
  };

  const handleRejectRequest = async (participantId: string) => {
    if (!trip) return;

    Alert.alert(
      'Reject Request',
      'Are you sure you want to reject this request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              // Optimistic update: Remove from pending immediately
              setTrip((prevTrip) => {
                if (!prevTrip) return prevTrip;
                return {
                  ...prevTrip,
                  participants: prevTrip.participants?.filter((p: any) => p.id !== participantId),
                };
              });

              await rejectTripRequest(participantId, trip.id);
              Alert.alert('Success', 'Request rejected');
              // Reload to ensure consistency
              loadTripDetails();
            } catch (error) {
              console.error('Error rejecting request:', error);
              Alert.alert('Error', 'Could not reject request');
              // Revert optimistic update on error
              loadTripDetails();
            }
          },
        },
      ]
    );
  };

  const handleRemoveParticipant = (participant: any) => {
    setParticipantToRemove(participant);
    setRemovalReason('');
    setRemoveModalVisible(true);
  };

  const confirmRemoveParticipant = async () => {
    if (!participantToRemove || !trip) return;

    try {
      // Optimistic update: Remove participant immediately
      setTrip((prevTrip) => {
        if (!prevTrip) return prevTrip;
        return {
          ...prevTrip,
          participants: prevTrip.participants?.filter((p: any) => p.id !== participantToRemove.id),
          available_seats: prevTrip.available_seats + participantToRemove.seats_requested,
        };
      });

      setRemoveModalVisible(false);
      await removeParticipant(participantToRemove.id, trip.id, removalReason.trim() || undefined);
      Alert.alert('Success', 'Participant removed');
      // Reload to ensure consistency
      loadTripDetails();
    } catch (error) {
      console.error('Error removing participant:', error);
      Alert.alert('Error', 'Could not remove participant');
      // Revert optimistic update on error
      loadTripDetails();
    }
  };

  const handleCancelTrip = () => {
    Alert.alert(
      'Cancel Trip',
      'Are you sure you want to cancel this trip? All participants will be notified.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelTrip(tripId);
              Alert.alert('Success', 'Trip cancelled');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Could not cancel trip');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!trip) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Trip not found</Text>
      </View>
    );
  }

  const isCreator = profile?.id === trip.creator_id;
  const hasJoined = trip.participants?.some(p => p.user_id === profile?.id);
  const userParticipant = trip.participants?.find(p => p.user_id === profile?.id);
  const pendingRequests = trip.participants?.filter(p => p.status === 'pending') || [];
  const acceptedParticipants = trip.participants?.filter(p => p.status === 'accepted') || [];

  const costPerPerson = trip.estimated_cost
    ? (trip.estimated_cost / (trip.available_seats + 1)).toFixed(2)
    : null;

  return (
    <View style={styles.container}>
      {/* Syncing Indicator */}
      {syncing && (
        <View style={styles.syncIndicator}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.syncText}>Syncing...</Text>
        </View>
      )}
      
      <ScrollView>
        {/* Map */}
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: (trip.pickup_lat + trip.dropoff_lat) / 2,
            longitude: (trip.pickup_lng + trip.dropoff_lng) / 2,
            latitudeDelta: Math.abs(trip.pickup_lat - trip.dropoff_lat) * 2 || 0.1,
            longitudeDelta: Math.abs(trip.pickup_lng - trip.dropoff_lng) * 2 || 0.1,
          }}
        >
          <Marker
            coordinate={{ latitude: trip.pickup_lat, longitude: trip.pickup_lng }}
            pinColor="green"
            title="Pick-up"
          />
          <Marker
            coordinate={{ latitude: trip.dropoff_lat, longitude: trip.dropoff_lng }}
            pinColor="red"
            title="Drop-off"
          />
          <Polyline
            coordinates={[
              { latitude: trip.pickup_lat, longitude: trip.pickup_lng },
              { latitude: trip.dropoff_lat, longitude: trip.dropoff_lng },
            ]}
            strokeColor="#007AFF"
            strokeWidth={3}
          />
        </MapView>

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{trip.title}</Text>
            {isCreator && <Text style={styles.creatorBadge}>👑 Your Trip</Text>}
          </View>

          {/* Creator Info */}
          <TouchableOpacity style={styles.creatorSection}>
            <UserAvatar user={trip.creator} size={56} showVerified />
            <View style={styles.creatorInfo}>
              <Text style={styles.creatorName}>{trip.creator.full_name}</Text>
              <Text style={styles.creatorStats}>
                ⭐ {trip.creator.rating.toFixed(1)} • {trip.creator.total_trips} trips
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.messageButton}
              onPress={() => navigation.navigate('Chat', { tripId: trip.id })}
            >
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Route Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Route</Text>
            <View style={styles.routeContainer}>
              <View style={styles.routeMarkers}>
                <View style={styles.originDot} />
                <View style={styles.routeLine} />
                <View style={styles.destinationDot} />
              </View>
              <View style={styles.routeDetails}>
                <View style={styles.locationRow}>
                  <Text style={styles.locationLabel}>Pick-up</Text>
                  <Text style={styles.locationText}>{trip.pickup_location}</Text>
                </View>
                <View style={styles.locationRow}>
                  <Text style={styles.locationLabel}>Drop-off</Text>
                  <Text style={styles.locationText}>{trip.dropoff_location}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Trip Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>🕐</Text>
                <View>
                  <Text style={styles.detailLabel}>Departure</Text>
                  <Text style={styles.detailValue}>
                    {dayjs(trip.departure_time).format('MMM D, YYYY')}
                  </Text>
                  <Text style={styles.detailValue}>
                    {dayjs(trip.departure_time).format('h:mm A')}
                  </Text>
                </View>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>🚗</Text>
                <View>
                  <Text style={styles.detailLabel}>Service</Text>
                  <Text style={styles.detailValue}>{trip.service_type}</Text>
                </View>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>👥</Text>
                <View>
                  <Text style={styles.detailLabel}>Available Seats</Text>
                  <Text style={styles.detailValue}>
                    {trip.available_seats} of {trip.total_seats}
                  </Text>
                </View>
              </View>
              {costPerPerson && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>💰</Text>
                  <View>
                    <Text style={styles.detailLabel}>Cost per Person</Text>
                    <Text style={styles.detailValue}>${costPerPerson}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Description */}
          {trip.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About This Trip</Text>
              <Text style={styles.description}>{trip.description}</Text>
            </View>
          )}

          {/* Participants */}
          {acceptedParticipants.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Participants ({acceptedParticipants.length})
              </Text>
              {acceptedParticipants.map((participant: any) => (
                <View key={participant.id} style={styles.participantRow}>
                  <UserAvatar user={participant.user} size={40} />
                  <View style={styles.participantInfo}>
                    <Text style={styles.participantName}>{participant.user.full_name}</Text>
                    <Text style={styles.participantSeats}>
                      {participant.seats_requested} seat(s)
                    </Text>
                  </View>
                  {isCreator && (
                    <TouchableOpacity
                      style={styles.removeParticipantButton}
                      onPress={() => handleRemoveParticipant(participant)}
                    >
                      <Text style={styles.removeParticipantText}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Pending Requests (Creator Only) */}
          {isCreator && pendingRequests.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Pending Requests ({pendingRequests.length})
              </Text>
              {pendingRequests.map((participant: any) => (
                <View key={participant.id} style={styles.requestRow}>
                  <UserAvatar user={participant.user} size={40} />
                  <View style={styles.participantInfo}>
                    <Text style={styles.participantName}>{participant.user.full_name}</Text>
                    <Text style={styles.participantSeats}>
                      Wants {participant.seats_requested} seat(s)
                    </Text>
                  </View>
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => handleRejectRequest(participant.id)}
                    >
                      <Text style={styles.rejectButtonText}>✕</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => handleAcceptRequest(participant.id)}
                    >
                      <Text style={styles.acceptButtonText}>✓</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        {isCreator ? (
          <View style={styles.creatorActions}>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => router.push(`/main/edit-trip?tripId=${tripId}` as any)}
            >
              <Text style={styles.editButtonText}>Edit Trip</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelTrip}>
              <Text style={styles.cancelButtonText}>Cancel Trip</Text>
            </TouchableOpacity>
          </View>
        ) : hasJoined ? (
          userParticipant?.status === 'pending' ? (
            <View style={styles.pendingContainer}>
              <Text style={styles.pendingText}>⏳ Request Pending</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.joinedButton}
              onPress={() => navigation.navigate('Chat', { tripId: trip.id })}
            >
              <Text style={styles.joinedButtonText}>💬 Open Chat</Text>
            </TouchableOpacity>
          )
        ) : trip.available_seats > 0 ? (
          <TouchableOpacity
            style={styles.joinButton}
            onPress={() => setJoinModalVisible(true)}
          >
            <Text style={styles.joinButtonText}>Join Trip</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.fullContainer}>
            <Text style={styles.fullText}>Trip is Full</Text>
          </View>
        )}
      </View>

      {/* Join Modal */}
      <Modal
        visible={joinModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setJoinModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Request to Join</Text>
            
            <Text style={styles.modalLabel}>How many seats do you need?</Text>
            <View style={styles.seatsSelector}>
              {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.seatButton,
                    seatsRequested === num && styles.seatButtonActive,
                  ]}
                  onPress={() => setSeatsRequested(num)}
                  disabled={num > trip.available_seats}
                >
                  <Text
                    style={[
                      styles.seatButtonText,
                      seatsRequested === num && styles.seatButtonTextActive,
                      num > trip.available_seats && styles.seatButtonTextDisabled,
                    ]}
                  >
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Add a message (optional)</Text>
            <TextInput
              style={styles.messageInput}
              placeholder="Hi! I'd like to join your trip..."
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={200}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setJoinModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalJoinButton} onPress={handleJoinTrip}>
                <Text style={styles.modalJoinText}>Send Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Remove Participant Modal */}
      <Modal
        visible={removeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRemoveModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Remove Participant</Text>
            
            {participantToRemove && (
              <View style={styles.removeParticipantInfo}>
                <UserAvatar user={participantToRemove.user} size={48} />
                <View style={styles.removeParticipantDetails}>
                  <Text style={styles.removeParticipantName}>
                    {participantToRemove.user.full_name}
                  </Text>
                  <Text style={styles.removeParticipantSeats}>
                    {participantToRemove.seats_requested} seat(s)
                  </Text>
                </View>
              </View>
            )}

            <Text style={styles.modalLabel}>Reason for removal (optional)</Text>
            <TextInput
              style={styles.messageInput}
              placeholder="e.g., Trip schedule changed, no longer available..."
              value={removalReason}
              onChangeText={setRemovalReason}
              multiline
              maxLength={200}
            />

            <Text style={styles.removalWarning}>
              ⚠️ The participant will be notified of their removal{removalReason.trim() ? ' and the reason provided' : ''}.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setRemoveModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalRemoveButton} 
                onPress={confirmRemoveParticipant}
              >
                <Text style={styles.modalRemoveText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  syncIndicator: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    zIndex: 1000,
    gap: 8,
  },
  syncText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  map: {
    height: 250,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
  },
  creatorBadge: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '600',
  },
  creatorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 24,
  },
  creatorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  creatorStats: {
    fontSize: 13,
    color: '#666',
  },
  messageButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  messageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  routeContainer: {
    flexDirection: 'row',
  },
  routeMarkers: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  originDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#34C759',
  },
  routeLine: {
    width: 2,
    height: 40,
    backgroundColor: '#e0e0e0',
    marginVertical: 4,
  },
  destinationDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
  },
  routeDetails: {
    flex: 1,
  },
  locationRow: {
    marginBottom: 16,
  },
  locationLabel: {
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 15,
    color: '#1a1a1a',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 12,
    flex: 1,
    minWidth: '45%',
  },
  detailIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  participantInfo: {
    flex: 1,
    marginLeft: 12,
  },
  participantName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  participantSeats: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#34C759',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  bottomBar: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  creatorActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF3B30',
  },
  cancelButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  joinButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  joinedButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  joinedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pendingContainer: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  pendingText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  fullContainer: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  fullText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  seatsSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  seatButton: {
    width: '22%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  seatButtonActive: {
    backgroundColor: '#E8F4FF',
    borderColor: '#007AFF',
  },
  seatButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  seatButtonTextActive: {
    color: '#007AFF',
  },
  seatButtonTextDisabled: {
    color: '#ccc',
  },
  messageInput: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  modalJoinButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  modalJoinText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  removeParticipantButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  removeParticipantText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  removeParticipantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 20,
  },
  removeParticipantDetails: {
    marginLeft: 12,
    flex: 1,
  },
  removeParticipantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  removeParticipantSeats: {
    fontSize: 13,
    color: '#666',
  },
  removalWarning: {
    fontSize: 13,
    color: '#666',
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    lineHeight: 18,
  },
  modalRemoveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
  },
  modalRemoveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});