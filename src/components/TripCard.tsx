// src/components/TripCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { TripWithCreator } from '../types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface TripCardProps {
  trip: TripWithCreator;
  onPress: () => void;
}

export default function TripCard({ trip, onPress }: TripCardProps) {
  const getServiceIcon = (service: string) => {
    const icons: { [key: string]: string } = {
      uber: '🚗',
      bolt: '⚡',
      lyft: '🚙',
      other: '🚕',
    };
    return icons[service] || '🚗';
  };

  const costPerPerson = trip.estimated_cost
    ? (trip.estimated_cost / (trip.total_seats - trip.available_seats + 1)).toFixed(2)
    : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Creator Info */}
      <View style={styles.header}>
        <View style={styles.creatorInfo}>
          {trip.creator.avatar_url ? (
            <Image
              source={{ uri: trip.creator.avatar_url }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {trip.creator.full_name?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}
          <View style={styles.creatorDetails}>
            <Text style={styles.creatorName}>{trip.creator.full_name}</Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>⭐ {trip.creator.rating.toFixed(1)}</Text>
              <Text style={styles.tripCount}>• {trip.creator.total_trips} trips</Text>
            </View>
          </View>
        </View>
        {trip.distance_km && (
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>{trip.distance_km}km</Text>
          </View>
        )}
      </View>

      {/* Trip Route */}
      <View style={styles.routeContainer}>
        <View style={styles.routeMarker}>
          <View style={styles.originDot} />
          <View style={styles.routeLine} />
          <View style={styles.destinationDot} />
        </View>
        <View style={styles.routeDetails}>
          <View style={styles.locationRow}>
            <Text style={styles.locationLabel}>From</Text>
            <Text style={styles.locationText} numberOfLines={1}>
              {trip.pickup_location}
            </Text>
          </View>
          <View style={styles.locationRow}>
            <Text style={styles.locationLabel}>To</Text>
            <Text style={styles.locationText} numberOfLines={1}>
              {trip.dropoff_location}
            </Text>
          </View>
        </View>
      </View>

      {/* Trip Info */}
      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>🕐</Text>
          <Text style={styles.infoText}>
            {dayjs(trip.departure_time).format('MMM D, h:mm A')}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>{getServiceIcon(trip.service_type)}</Text>
          <Text style={styles.infoText}>{trip.service_type}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>👥</Text>
          <Text style={styles.infoText}>
            {trip.available_seats} seat{trip.available_seats !== 1 ? 's' : ''} left
          </Text>
        </View>
        {costPerPerson && (
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>💰</Text>
            <Text style={styles.infoText}>${costPerPerson}/person</Text>
          </View>
        )}
      </View>

      {/* Description (if available) */}
      {trip.description && (
        <Text style={styles.description} numberOfLines={2}>
          {trip.description}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  creatorDetails: {
    flex: 1,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 13,
    color: '#666',
  },
  tripCount: {
    fontSize: 13,
    color: '#999',
    marginLeft: 4,
  },
  distanceBadge: {
    backgroundColor: '#E8F4FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  routeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  routeMarker: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  originDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34C759',
    marginBottom: 4,
  },
  routeLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 2,
  },
  destinationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
    marginTop: 4,
  },
  routeDetails: {
    flex: 1,
  },
  locationRow: {
    marginBottom: 12,
  },
  locationLabel: {
    fontSize: 11,
    color: '#999',
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  infoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  infoIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});