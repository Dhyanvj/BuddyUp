// src/screens/CreateTrip/EditTripScreen.tsx
import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { getTripDetails } from '../../services/tripHelpers';
import { supabase } from '../../services/supabase';
import dayjs from 'dayjs';

interface EditTripScreenProps {
  route: any;
  navigation: any;
}

export default function EditTripScreen({ route, navigation }: EditTripScreenProps) {
  const { tripId } = route.params;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [departureTime, setDepartureTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [serviceType, setServiceType] = useState<'uber' | 'bolt' | 'lyft' | 'other'>('uber');
  const [availableSeats, setAvailableSeats] = useState(3);
  const [estimatedCost, setEstimatedCost] = useState('');

  useEffect(() => {
    loadTripData();
  }, [tripId]);

  const loadTripData = async () => {
    setLoading(true);
    try {
      const trip = await getTripDetails(tripId);
      if (trip) {
        setTitle(trip.title);
        setDescription(trip.description || '');
        setDepartureTime(new Date(trip.departure_time));
        setServiceType(trip.service_type);
        setAvailableSeats(trip.available_seats);
        setEstimatedCost(trip.estimated_cost?.toString() || '');
      }
    } catch (error) {
      console.error('Error loading trip:', error);
      Alert.alert('Error', 'Could not load trip details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a trip title');
      return;
    }

    if (departureTime <= new Date()) {
      Alert.alert('Error', 'Departure time must be in the future');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('trips')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          departure_time: departureTime.toISOString(),
          service_type: serviceType,
          available_seats: availableSeats,
          total_seats: availableSeats,
          estimated_cost: estimatedCost ? parseFloat(estimatedCost) : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tripId);

      if (error) throw error;

      // Notify all participants about the trip update
      const { data: participants } = await supabase
        .from('trip_participants')
        .select('user_id')
        .eq('trip_id', tripId)
        .eq('status', 'accepted');

      if (participants && participants.length > 0) {
        const notifications = participants.map(p => ({
          user_id: p.user_id,
          trip_id: tripId,
          type: 'trip_update',
          title: 'Trip Updated',
          body: `The trip "${title.trim()}" has been updated. Check the details.`,
        }));

        await supabase.from('notifications').insert(notifications);
      }

      Alert.alert('Success', 'Trip updated successfully!');
      router.back();
    } catch (error) {
      console.error('Error updating trip:', error);
      Alert.alert('Error', 'Could not update trip');
    } finally {
      setSaving(false);
    }
  };

  const serviceOptions = [
    { value: 'uber', label: 'Uber', icon: '🚗' },
    { value: 'bolt', label: 'Bolt', icon: '⚡' },
    { value: 'lyft', label: 'Lyft', icon: '🚙' },
    { value: 'other', label: 'Other', icon: '🚕' },
  ];

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
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Trip</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
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
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backText: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
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
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
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
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});