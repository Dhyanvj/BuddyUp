// src/screens/Home/HomeScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from '../../contexts/LocationContext';
import { searchNearbyTrips } from '../../services/tripHelpers';
import { TripWithCreator } from '../../types';
import TripCard from '../../components/TripCard';
import { supabase } from '../../services/supabase';

type ViewMode = 'map' | 'list';
type ServiceFilter = 'all' | 'uber' | 'bolt' | 'lyft' | 'other';

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { location, loading: locationLoading } = useLocation();
  const mapRef = useRef<MapView>(null);
  const subscriptionRef = useRef<any>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [radius, setRadius] = useState(10); // km
  const [trips, setTrips] = useState<TripWithCreator[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<TripWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState<TripWithCreator | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>('all');

  useEffect(() => {
    if (location) {
      loadTrips();
      setupRealtimeSubscriptions();
    }
    // TEMPORARY: Add test trip for debugging
    else {
      console.log('⚠️ No location yet, adding test trip');
      setTrips([{
        id: 'test-123',
        creator_id: 'test',
        title: 'Test Trip',
        description: 'Testing',
        pickup_location: 'Woking',
        pickup_lat: 51.32166280,
        pickup_lng: -0.55532500,
        dropoff_location: 'Chertsey',
        dropoff_lat: 51.38649100,
        dropoff_lng: -0.50945600,
        departure_time: new Date().toISOString(),
        service_type: 'uber',
        available_seats: 2,
        total_seats: 2,
        estimated_cost: 33,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        distance_km: 0.41,
        creator: {
          id: 'test',
          email: 'test@test.com',
          full_name: 'Test User',
          rating: 5,
          total_trips: 10,
        } as any,
      } as any]);
    }

    // Cleanup subscriptions on unmount
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [location, radius]);

  useEffect(() => {
    applyFilters();
  }, [trips, searchQuery, serviceFilter]);

  const loadTrips = async () => {
    if (!location) return;

    setLoading(true);
    try {
      console.log('🔍 Searching trips...');
      console.log('📍 User location:', location.coords.latitude, location.coords.longitude);
      console.log('📏 Search radius:', radius, 'km');
      
      const searchLat = location.coords.latitude;
      const searchLng = location.coords.longitude;
      
      const nearbyTrips = await searchNearbyTrips(searchLat, searchLng, radius);
      
      console.log('✅ Trips found:', nearbyTrips.length);
      if (nearbyTrips.length > 0) {
        console.log('📦 First trip:', {
          title: nearbyTrips[0].title,
          pickup_lat: nearbyTrips[0].pickup_lat,
          pickup_lng: nearbyTrips[0].pickup_lng,
          distance: nearbyTrips[0].distance_km
        });
      }
      
      setTrips(nearbyTrips);
    } catch (error) {
      console.error('❌ Error loading trips:', error);
      Alert.alert('Error', 'Could not load trips');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to changes in active trips
    const tripsChannel = supabase
      .channel('home-trips-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips',
          filter: 'status=eq.active',
        },
        (payload) => {
          console.log('Trip updated in home:', payload);
          // Reload trips when any active trip changes
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
          console.log('Trip participants updated in home:', payload);
          // Reload trips to update available seats
          loadTrips();
        }
      )
      .subscribe();

    subscriptionRef.current = tripsChannel;
  };

  const applyFilters = () => {
    let filtered = [...trips];

    // Filter by service type
    if (serviceFilter !== 'all') {
      filtered = filtered.filter((trip) => trip.service_type === serviceFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (trip) =>
          trip.title.toLowerCase().includes(query) ||
          trip.pickup_location.toLowerCase().includes(query) ||
          trip.dropoff_location.toLowerCase().includes(query) ||
          trip.creator.full_name?.toLowerCase().includes(query)
      );
    }

    setFilteredTrips(filtered);
  };

  const handleMarkerPress = (trip: TripWithCreator) => {
    setSelectedTrip(trip);
    // Center map on selected trip
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: trip.pickup_lat,
        longitude: trip.pickup_lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  };

  const handleTripPress = (trip: TripWithCreator) => {
    router.push(`/main/trip-details?tripId=${trip.id}` as any);
  };

  const renderRadiusSelector = () => (
    <View style={styles.radiusSelector}>
      {[5, 10, 20, 50].map((r) => (
        <TouchableOpacity
          key={r}
          style={[styles.radiusButton, radius === r && styles.radiusButtonActive]}
          onPress={() => setRadius(r)}
        >
          <Text style={[styles.radiusText, radius === r && styles.radiusTextActive]}>
            {r}km
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderServiceFilter = () => (
    <View style={styles.serviceFilter}>
      {['all', 'uber', 'bolt', 'lyft', 'other'].map((service) => (
        <TouchableOpacity
          key={service}
          style={[
            styles.serviceFilterButton,
            serviceFilter === service && styles.serviceFilterButtonActive,
          ]}
          onPress={() => setServiceFilter(service as ServiceFilter)}
        >
          <Text
            style={[
              styles.serviceFilterText,
              serviceFilter === service && styles.serviceFilterTextActive,
            ]}
          >
            {service === 'all' ? '🚗 All' : service.charAt(0).toUpperCase() + service.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderMapView = () => {
    if (!location) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      );
    }

    const initialRegion: Region = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };

    return (
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation
          showsMyLocationButton
        >
          {filteredTrips
            .filter(trip => 
              trip.pickup_lat && 
              trip.pickup_lng && 
              !isNaN(trip.pickup_lat) && 
              !isNaN(trip.pickup_lng)
            )
            .map((trip) => {
              const isSelected = selectedTrip?.id === trip.id;
              
              return (
                <Marker
                  key={trip.id}
                  coordinate={{
                    latitude: Number(trip.pickup_lat),
                    longitude: Number(trip.pickup_lng),
                  }}
                  onPress={() => handleMarkerPress(trip)}
                >
                  <View style={styles.markerContainer}>
                    <Text style={styles.markerText}>
                      {isSelected ? '🚙' : '🚗'}
                    </Text>
                  </View>
                </Marker>
              );
            })}
        </MapView>

        {/* Trip Preview Card */}
        {selectedTrip && (
          <View style={styles.previewCard}>
            <TouchableOpacity
              style={styles.previewContent}
              onPress={() => handleTripPress(selectedTrip)}
              activeOpacity={0.9}
            >
              <View style={styles.previewHeader}>
                <View style={styles.previewLeft}>
                  <Text style={styles.previewTitle} numberOfLines={1}>
                    {selectedTrip.title}
                  </Text>
                  <Text style={styles.previewDistance}>
                    {selectedTrip.distance_km}km away
                  </Text>
                </View>
                <View style={styles.previewRight}>
                  {selectedTrip.estimated_cost && (
                    <Text style={styles.previewPrice}>
                      $
                      {(
                        selectedTrip.estimated_cost /
                        (selectedTrip.total_seats - selectedTrip.available_seats + 1)
                      ).toFixed(2)}
                    </Text>
                  )}
                  <Text style={styles.previewSeats}>
                    {selectedTrip.available_seats} seats
                  </Text>
                </View>
              </View>
              <Text style={styles.previewRoute} numberOfLines={1}>
                {selectedTrip.pickup_location} → {selectedTrip.dropoff_location}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closePreview}
              onPress={() => setSelectedTrip(null)}
            >
              <Text style={styles.closePreviewText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderListView = () => (
    <FlatList
      data={filteredTrips}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TripCard trip={item} onPress={() => handleTripPress(item)} />
      )}
      contentContainerStyle={styles.listContainer}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>No trips found</Text>
          <Text style={styles.emptySubtext}>
            {searchQuery || serviceFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Try increasing the search radius or create a trip'}
          </Text>
        </View>
      }
    />
  );

  if (locationLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading trips...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Find Your Ride</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.viewToggle}
            onPress={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
          >
            <Text style={styles.viewToggleText}>
              {viewMode === 'map' ? '📋' : '🗺️'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by location, title, or user..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Radius Selector */}
      {renderRadiusSelector()}

      {/* Service Filter */}
      {renderServiceFilter()}

      {/* Results Count */}
      <View style={styles.resultsBar}>
        <Text style={styles.resultsText}>
          {filteredTrips.length} {filteredTrips.length === 1 ? 'trip' : 'trips'} found
        </Text>
        {(searchQuery || serviceFilter !== 'all') && (
          <TouchableOpacity
            onPress={() => {
              setSearchQuery('');
              setServiceFilter('all');
            }}
          >
            <Text style={styles.clearFilters}>Clear filters</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {viewMode === 'map' ? renderMapView() : renderListView()}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  viewToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewToggleText: {
    fontSize: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },
  clearButton: {
    position: 'absolute',
    right: 24,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  radiusSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  radiusButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  radiusButtonActive: {
    backgroundColor: '#007AFF',
  },
  radiusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  radiusTextActive: {
    color: '#fff',
  },
  serviceFilter: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  serviceFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f8f8f8',
  },
  serviceFilterButtonActive: {
    backgroundColor: '#E8F4FF',
  },
  serviceFilterText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  serviceFilterTextActive: {
    color: '#007AFF',
  },
  resultsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f8f8',
  },
  resultsText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  clearFilters: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    width: 35,
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerText: {
    fontSize: 28,
  },
  previewCard: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  previewContent: {
    marginRight: 32,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  previewLeft: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  previewDistance: {
    fontSize: 12,
    color: '#007AFF',
  },
  previewRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  previewPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34C759',
  },
  previewSeats: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  previewRoute: {
    fontSize: 13,
    color: '#666',
  },
  closePreview: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closePreviewText: {
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 16,
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