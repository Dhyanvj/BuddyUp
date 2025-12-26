// src/screens/Profile/PrivacySettingsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import {
  getPrivacySettings,
  updatePrivacySettings,
  requestAccountDeletion,
} from '../../services/privacyHelpers';

type ProfileVisibility = 'public' | 'limited' | 'private';
type LocationSharing = 'always' | 'trips_only' | 'off';

interface PrivacySettings {
  profile_visibility: ProfileVisibility;
  location_sharing: LocationSharing;
  show_email: boolean;
  show_phone: boolean;
  allow_messages: boolean;
}

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const { profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PrivacySettings>({
    profile_visibility: 'public',
    location_sharing: 'trips_only',
    show_email: false,
    show_phone: false,
    allow_messages: true,
  });

  useEffect(() => {
    loadPrivacySettings();
  }, [profile]);

  const loadPrivacySettings = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      const privacySettings = await getPrivacySettings(profile.id);
      if (privacySettings) {
        setSettings(privacySettings);
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
      Alert.alert('Error', 'Could not load privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const success = await updatePrivacySettings(profile.id, settings);
      if (!success) {
        throw new Error('Failed to update settings');
      }

      await refreshProfile();
      Alert.alert('Success', 'Privacy settings updated successfully');
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      Alert.alert('Error', 'Could not update privacy settings');
    } finally {
      setSaving(false);
    }
  };

  const handleProfileVisibilityChange = (visibility: ProfileVisibility) => {
    setSettings({ ...settings, profile_visibility: visibility });
  };

  const handleLocationSharingChange = (sharing: LocationSharing) => {
    setSettings({ ...settings, location_sharing: sharing });
  };

  const handleRequestDeletion = () => {
    Alert.alert(
      'Request Account Deletion',
      'Are you sure you want to request account deletion? This action cannot be undone. Your account will be reviewed and deleted within 30 days.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Deletion',
          style: 'destructive',
          onPress: async () => {
            if (!profile) return;
            
            try {
              const success = await requestAccountDeletion(profile.id);
              if (success) {
                Alert.alert(
                  'Request Submitted',
                  'Your account deletion request has been submitted. You will receive an email confirmation shortly.',
                  [{ text: 'OK', onPress: () => router.back() }]
                );
              } else {
                throw new Error('Failed to submit deletion request');
              }
            } catch (error) {
              console.error('Error requesting account deletion:', error);
              Alert.alert('Error', 'Could not submit deletion request');
            }
          },
        },
      ]
    );
  };

  const openPrivacyPolicy = () => {
    // Replace with your actual privacy policy URL
    Linking.openURL('https://buddyup.com/privacy-policy');
  };

  const openTermsAndConditions = () => {
    // Replace with your actual terms URL
    Linking.openURL('https://buddyup.com/terms-and-conditions');
  };

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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Data Usage Explanation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔐 Your Data & Privacy</Text>
          <Text style={styles.explanationText}>
            BuddyUp is committed to protecting your privacy. We collect and use your data to:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>• Connect you with travel companions</Text>
            <Text style={styles.bulletPoint}>• Show nearby trips based on your location</Text>
            <Text style={styles.bulletPoint}>• Facilitate safe and secure ride-sharing</Text>
            <Text style={styles.bulletPoint}>• Improve our services and user experience</Text>
          </View>
          <Text style={styles.explanationText}>
            You have full control over your privacy settings below.
          </Text>
        </View>

        {/* Profile Visibility */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Visibility</Text>
          <Text style={styles.sectionDescription}>
            Control who can see your profile information
          </Text>

          <TouchableOpacity
            style={[
              styles.optionCard,
              settings.profile_visibility === 'public' && styles.optionCardSelected,
            ]}
            onPress={() => handleProfileVisibilityChange('public')}
          >
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>🌍 Public</Text>
              <Text style={styles.optionDescription}>
                Everyone can see your profile, trips, and reviews
              </Text>
            </View>
            <View
              style={[
                styles.radioButton,
                settings.profile_visibility === 'public' && styles.radioButtonSelected,
              ]}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionCard,
              settings.profile_visibility === 'limited' && styles.optionCardSelected,
            ]}
            onPress={() => handleProfileVisibilityChange('limited')}
          >
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>👥 Limited</Text>
              <Text style={styles.optionDescription}>
                Only trip participants can see your full profile
              </Text>
            </View>
            <View
              style={[
                styles.radioButton,
                settings.profile_visibility === 'limited' && styles.radioButtonSelected,
              ]}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionCard,
              settings.profile_visibility === 'private' && styles.optionCardSelected,
            ]}
            onPress={() => handleProfileVisibilityChange('private')}
          >
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>🔒 Private</Text>
              <Text style={styles.optionDescription}>
                Minimal information visible to others
              </Text>
            </View>
            <View
              style={[
                styles.radioButton,
                settings.profile_visibility === 'private' && styles.radioButtonSelected,
              ]}
            />
          </TouchableOpacity>
        </View>

        {/* Location Sharing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Sharing</Text>
          <Text style={styles.sectionDescription}>
            Control when your location is shared
          </Text>

          <TouchableOpacity
            style={[
              styles.optionCard,
              settings.location_sharing === 'always' && styles.optionCardSelected,
            ]}
            onPress={() => handleLocationSharingChange('always')}
          >
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>📍 Always On</Text>
              <Text style={styles.optionDescription}>
                Share location to find nearby trips (recommended)
              </Text>
            </View>
            <View
              style={[
                styles.radioButton,
                settings.location_sharing === 'always' && styles.radioButtonSelected,
              ]}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionCard,
              settings.location_sharing === 'trips_only' && styles.optionCardSelected,
            ]}
            onPress={() => handleLocationSharingChange('trips_only')}
          >
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>🚗 During Trips Only</Text>
              <Text style={styles.optionDescription}>
                Share location only when you're on an active trip
              </Text>
            </View>
            <View
              style={[
                styles.radioButton,
                settings.location_sharing === 'trips_only' && styles.radioButtonSelected,
              ]}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionCard,
              settings.location_sharing === 'off' && styles.optionCardSelected,
            ]}
            onPress={() => handleLocationSharingChange('off')}
          >
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>🚫 Off</Text>
              <Text style={styles.optionDescription}>
                Don't share location (limits trip discovery)
              </Text>
            </View>
            <View
              style={[
                styles.radioButton,
                settings.location_sharing === 'off' && styles.radioButtonSelected,
              ]}
            />
          </TouchableOpacity>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <Text style={styles.sectionDescription}>
            Choose what contact info to display on your profile
          </Text>

          <View style={styles.toggleRow}>
            <View style={styles.toggleContent}>
              <Text style={styles.toggleTitle}>Show Email Address</Text>
              <Text style={styles.toggleDescription}>
                Other users can see your email
              </Text>
            </View>
            <Switch
              value={settings.show_email}
              onValueChange={(value) =>
                setSettings({ ...settings, show_email: value })
              }
              trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleContent}>
              <Text style={styles.toggleTitle}>Show Phone Number</Text>
              <Text style={styles.toggleDescription}>
                Other users can see your phone
              </Text>
            </View>
            <Switch
              value={settings.show_phone}
              onValueChange={(value) =>
                setSettings({ ...settings, show_phone: value })
              }
              trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleContent}>
              <Text style={styles.toggleTitle}>Allow Direct Messages</Text>
              <Text style={styles.toggleDescription}>
                Users can message you outside of trips
              </Text>
            </View>
            <Switch
              value={settings.allow_messages}
              onValueChange={(value) =>
                setSettings({ ...settings, allow_messages: value })
              }
              trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Legal Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal & Policies</Text>

          <TouchableOpacity style={styles.linkCard} onPress={openPrivacyPolicy}>
            <Text style={styles.linkIcon}>📄</Text>
            <Text style={styles.linkText}>Privacy Policy</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkCard} onPress={openTermsAndConditions}>
            <Text style={styles.linkIcon}>📋</Text>
            <Text style={styles.linkText}>Terms & Conditions</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.buttonDisabled]}
          onPress={handleSaveSettings}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save Privacy Settings</Text>
          )}
        </TouchableOpacity>

        {/* Account Deletion */}
        <View style={styles.dangerSection}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleRequestDeletion}
          >
            <Text style={styles.deleteButtonText}>Request Account Deletion</Text>
          </TouchableOpacity>
          <Text style={styles.dangerNote}>
            This will permanently delete your account and all associated data within 30 days.
            This action cannot be undone.
          </Text>
        </View>
      </ScrollView>
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 28,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  placeholder: {
    width: 40,
  },
  content: {
    paddingBottom: 40,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  explanationText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  bulletList: {
    marginLeft: 8,
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    backgroundColor: '#E8F4FF',
    borderColor: '#007AFF',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    marginLeft: 12,
  },
  radioButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  toggleContent: {
    flex: 1,
    marginRight: 16,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 13,
    color: '#666',
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 8,
  },
  linkIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  linkText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  linkArrow: {
    fontSize: 20,
    color: '#007AFF',
  },
  saveButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  dangerSection: {
    padding: 16,
    backgroundColor: '#FFF5F5',
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE0E0',
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 12,
  },
  deleteButton: {
    padding: 16,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  dangerNote: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    textAlign: 'center',
  },
});

