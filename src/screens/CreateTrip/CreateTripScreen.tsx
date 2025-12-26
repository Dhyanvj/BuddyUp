// src/screens/CreateTrip/CreateTripScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { createTrip } from '../../services/tripHelpers';
import { CreateTripForm } from '../../types';
import dayjs from 'dayjs';

export default function CreateTripScreen({ navigation }: any) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [dropoffCoords, setDropoffCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [departureTime, setDepartureTime] = useState(new Date(Date.now() + 3600000)); // 1 hour from now
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [serviceType, setServiceType] = useState<'uber' | 'bolt' | 'lyft' | 'other'>('uber');
  const [availableSeats, setAvailableSeats] = useState(3);
  const [estimatedCost, setEstimatedCost] = useState('');
  
  // Location search states
  const [pickupSearchQuery, setPickupSearchQuery] = useState('');
  const [dropoffSearchQuery, setDropoffSearchQuery] = useState('');
  const [pickupSuggestions, setPickupSuggestions] = useState<any[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<any[]>([]);
  const [searchingPickup, setSearchingPickup] = useState(false);
  const [searchingDropoff, setSearchingDropoff] = useState(false);

  const GOOGLE_MAPS_API_KEY = 'AIzaSyDwou8CBDIu9_Tek3pVTiGRxdZkEZ_wscA';

  // Search for places
  const searchPlaces = async (query: string, isPickup: boolean) => {
    if (query.length < 3) {
      if (isPickup) setPickupSuggestions([]);
      else setDropoffSuggestions([]);
      return;
    }

    if (isPickup) setSearchingPickup(true);
    else setSearchingDropoff(true);

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          query
        )}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.predictions) {
        if (isPickup) setPickupSuggestions(data.predictions);
        else setDropoffSuggestions(data.predictions);
      }
    } catch (error) {
      console.error('Error searching places:', error);
    } finally {
      if (isPickup) setSearchingPickup(false);
      else setSearchingDropoff(false);
    }
  };

  // Get place details (coordinates)
  const getPlaceDetails = async (placeId: string, isPickup: boolean) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,formatted_address&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.result?.geometry?.location) {
        const location = data.result.geometry.location;
        const address = data.result.formatted_address;

        if (isPickup) {
          setPickupLocation(address);
          setPickupCoords({ lat: location.lat, lng: location.lng });
          setPickupSuggestions([]);
          setPickupSearchQuery(address);
        } else {
          setDropoffLocation(address);
          setDropoffCoords({ lat: location.lat, lng: location.lng });
          setDropoffSuggestions([]);
          setDropoffSearchQuery(address);
        }
      }
    } catch (error) {
      console.error('Error getting place details:', error);
    }
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a trip title');
      return false;
    }
    if (!pickupLocation || !pickupCoords) {
      Alert.alert('Error', 'Please select a pick-up location');
      return false;
    }
    if (!dropoffLocation || !dropoffCoords) {
      Alert.alert('Error', 'Please select a drop-off location');
      return false;
    }
    if (departureTime <= new Date()) {
      Alert.alert('Error', 'Departure time must be in the future');
      return false;
    }
    if (availableSeats < 1 || availableSeats > 7) {
      Alert.alert('Error', 'Please select between 1 and 7 seats');
      return false;
    }
    return true;
  };

  const handleCreateTrip = async () => {
    if (!validateForm() || !profile || !pickupCoords || !dropoffCoords) return;

    setLoading(true);
    try {
      const formData: CreateTripForm = {
        title: title.trim(),
        description: description.trim() || undefined,
        pickup_location: pickupLocation,
        pickup_lat: pickupCoords.lat,
        pickup_lng: pickupCoords.lng,
        dropoff_location: dropoffLocation,
        dropoff_lat: dropoffCoords.lat,
        dropoff_lng: dropoffCoords.lng,
        departure_time: departureTime,
        service_type: serviceType,
        available_seats: availableSeats,
        estimated_cost: estimatedCost ? parseFloat(estimatedCost) : undefined,
      };

      const newTrip = await createTrip(formData, profile.id);
      Alert.alert('Success', 'Trip created successfully!');
      navigation.navigate('TripDetails', { tripId: newTrip.id });
    } catch (error) {
      console.error('Error creating trip:', error);
      Alert.alert('Error', 'Could not create trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const serviceOptions = [
    { value: 'uber', label: 'Uber', icon: '🚗' },
    { value: 'bolt', label: 'Bolt', icon: '⚡' },
    { value: 'lyft', label: 'Lyft', icon: '🚙' },
    { value: 'other', label: 'Other', icon: '🚕' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.headerTitle}>Create Your Trip</Text>
        <Text style={styles.headerSubtitle}>
          Share the ride, split the cost, make new friends!
        </Text>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.label}>Trip Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Airport to Downtown"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add details about your trip..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            maxLength={500}
          />
        </View>

        {/* Locations */}
        <View style={styles.section}>
          <Text style={styles.label}>Pick-up Location *</Text>
          <TextInput
            style={styles.input}
            placeholder="Search for pick-up location"
            value={pickupSearchQuery}
            onChangeText={(text) => {
              setPickupSearchQuery(text);
              searchPlaces(text, true);
            }}
          />
          {searchingPickup && <ActivityIndicator style={{ marginTop: 8 }} />}
          {pickupSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <FlatList
                data={pickupSuggestions}
                keyExtractor={(item) => item.place_id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.suggestionItem}
                    onPress={() => getPlaceDetails(item.place_id, true)}
                  >
                    <Text style={styles.suggestionText}>{item.description}</Text>
                  </TouchableOpacity>
                )}
                scrollEnabled={false}
              />
            </View>
          )}
          {pickupLocation && pickupSuggestions.length === 0 && (
            <Text style={styles.selectedLocation}>✓ {pickupLocation}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Drop-off Location *</Text>
          <TextInput
            style={styles.input}
            placeholder="Search for drop-off location"
            value={dropoffSearchQuery}
            onChangeText={(text) => {
              setDropoffSearchQuery(text);
              searchPlaces(text, false);
            }}
          />
          {searchingDropoff && <ActivityIndicator style={{ marginTop: 8 }} />}
          {dropoffSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <FlatList
                data={dropoffSuggestions}
                keyExtractor={(item) => item.place_id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.suggestionItem}
                    onPress={() => getPlaceDetails(item.place_id, false)}
                  >
                    <Text style={styles.suggestionText}>{item.description}</Text>
                  </TouchableOpacity>
                )}
                scrollEnabled={false}
              />
            </View>
          )}
          {dropoffLocation && dropoffSuggestions.length === 0 && (
            <Text style={styles.selectedLocation}>✓ {dropoffLocation}</Text>
          )}
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={styles.label}>Departure Date & Time *</Text>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateTimeIcon}>📅</Text>
              <Text style={styles.dateTimeText}>
                {dayjs(departureTime).format('MMM D, YYYY')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.dateTimeIcon}>🕐</Text>
              <Text style={styles.dateTimeText}>
                {dayjs(departureTime).format('h:mm A')}
              </Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={departureTime}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selectedDate) {
                  const newDate = new Date(departureTime);
                  newDate.setFullYear(selectedDate.getFullYear());
                  newDate.setMonth(selectedDate.getMonth());
                  newDate.setDate(selectedDate.getDate());
                  setDepartureTime(newDate);
                }
              }}
              minimumDate={new Date()}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={departureTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowTimePicker(Platform.OS === 'ios');
                if (selectedDate) {
                  const newDate = new Date(departureTime);
                  newDate.setHours(selectedDate.getHours());
                  newDate.setMinutes(selectedDate.getMinutes());
                  setDepartureTime(newDate);
                }
              }}
            />
          )}
        </View>

        {/* Service Type */}
        <View style={styles.section}>
          <Text style={styles.label}>Service Type *</Text>
          <View style={styles.serviceGrid}>
            {serviceOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.serviceOption,
                  serviceType === option.value && styles.serviceOptionActive,
                ]}
                onPress={() => setServiceType(option.value as any)}
              >
                <Text style={styles.serviceIcon}>{option.icon}</Text>
                <Text
                  style={[
                    styles.serviceLabel,
                    serviceType === option.value && styles.serviceLabelActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Available Seats */}
        <View style={styles.section}>
          <Text style={styles.label}>Available Seats *</Text>
          <View style={styles.seatsRow}>
            {[1, 2, 3, 4, 5, 6, 7].map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.seatButton,
                  availableSeats === num && styles.seatButtonActive,
                ]}
                onPress={() => setAvailableSeats(num)}
              >
                <Text
                  style={[
                    styles.seatButtonText,
                    availableSeats === num && styles.seatButtonTextActive,
                  ]}
                >
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Estimated Cost */}
        <View style={styles.section}>
          <Text style={styles.label}>Estimated Total Cost (Optional)</Text>
          <View style={styles.costInputContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.costInput}
              placeholder="0.00"
              value={estimatedCost}
              onChangeText={setEstimatedCost}
              keyboardType="decimal-pad"
              maxLength={10}
            />
          </View>
          {estimatedCost && parseFloat(estimatedCost) > 0 && (
            <Text style={styles.costPerPerson}>
              ≈ ${(parseFloat(estimatedCost) / (availableSeats + 1)).toFixed(2)} per person
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreateTrip}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>Create Trip</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  suggestionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  autocompleteContainer: {
    zIndex: 1,
  },
  autocompleteInput: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedLocation: {
    marginTop: 8,
    fontSize: 13,
    color: '#34C759',
    fontWeight: '500',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateTimeIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  dateTimeText: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  serviceGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  serviceOption: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  serviceOptionActive: {
    backgroundColor: '#E8F4FF',
    borderColor: '#007AFF',
  },
  serviceIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  serviceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  serviceLabelActive: {
    color: '#007AFF',
  },
  seatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  seatButton: {
    width: '22%',
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
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
  costInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingLeft: 16,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginRight: 8,
  },
  costInput: {
    flex: 1,
    padding: 16,
    fontSize: 15,
  },
  costPerPerson: {
    marginTop: 8,
    fontSize: 13,
    color: '#666',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  createButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});