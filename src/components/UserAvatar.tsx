// src/components/UserAvatar.tsx
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Profile } from '../services/supabase';

interface UserAvatarProps {
  user: Profile;
  size?: number;
  showRating?: boolean;
  showVerified?: boolean;
}

export default function UserAvatar({
  user,
  size = 48,
  showRating = false,
  showVerified = false,
}: UserAvatarProps) {
  const avatarSize = { width: size, height: size, borderRadius: size / 2 };

  return (
    <View style={styles.container}>
      {user.avatar_url ? (
        <Image source={{ uri: user.avatar_url }} style={[styles.avatar, avatarSize]} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder, avatarSize]}>
          <Text style={[styles.avatarText, { fontSize: size / 2.4 }]}>
            {user.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
      )}
      
      {showVerified && (user.email_verified || user.phone_verified || user.id_verified) && (
        <View style={[styles.verifiedBadge, { width: size / 3, height: size / 3 }]}>
          <Text style={[styles.verifiedText, { fontSize: size / 6 }]}>✓</Text>
        </View>
      )}

      {showRating && user.rating > 0 && (
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingText}>⭐ {user.rating.toFixed(1)}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  avatar: {
    backgroundColor: '#f0f0f0',
  },
  avatarPlaceholder: {
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '600',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#34C759',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  ratingContainer: {
    marginTop: 4,
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },
});