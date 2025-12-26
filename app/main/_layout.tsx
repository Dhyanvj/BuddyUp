// app/main/_layout.tsx
import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { useState, useEffect } from 'react';
import { useAuth } from '../../src/contexts/AuthContext';
import { getUnreadCount, subscribeToNotifications, unsubscribeFromNotifications } from '../../src/services/notificationService';
import { RealtimeChannel } from '@supabase/supabase-js';

export default function MainLayout() {
  const { profile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (profile) {
      loadUnreadCount();
      
      // Subscribe to notification changes
      const channel = subscribeToNotifications(
        profile.id,
        () => {
          loadUnreadCount();
        },
        (count) => {
          setUnreadCount(count);
        }
      );

      return () => {
        unsubscribeFromNotifications(channel);
      };
    }
  }, [profile]);

  const loadUnreadCount = async () => {
    if (profile) {
      const count = await getUnreadCount(profile.id);
      setUnreadCount(count);
    }
  };

  const NotificationBadge = () => {
    if (unreadCount === 0) return null;
    return (
      <View style={{
        position: 'absolute',
        top: -4,
        right: -8,
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
      }}>
        <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </Text>
      </View>
    );
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          height: 70,
          paddingBottom: 10,
          paddingTop: 5,
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🏠</Text>,
        }}
      />
      
      <Tabs.Screen
        name="create-trip"
        options={{
          title: 'Create Trip',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>➕</Text>,
        }}
      />
      
      <Tabs.Screen
        name="mytrips"
        options={{
          title: 'My Trips',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🎫</Text>,
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color }) => (
            <View style={{ position: 'relative' }}>
              <Text style={{ fontSize: 24 }}>🔔</Text>
              <NotificationBadge />
            </View>
          ),
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>👤</Text>,
        }}
      />
      
      
      {/* Hide these from tab bar */}
      <Tabs.Screen
        name="chat"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="trip-details"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="edit-trip"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="privacy-settings"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="help-support"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}