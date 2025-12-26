// src/services/fcmNotificationService.ts
import { Platform, PermissionsAndroid } from 'react-native';
import { supabase } from './supabase';

// Try to import Firebase, but handle if it's not available (Expo Go)
let messaging: any = null;
try {
  messaging = require('@react-native-firebase/messaging').default;
} catch (error) {
  console.log('Firebase Messaging not available - running in Expo Go');
}

/**
 * Request notification permissions for iOS and Android
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!messaging) {
    console.log('Firebase not available');
    return false;
  }
  
  try {
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log('iOS notification permission not granted');
        return false;
      }
      
      return true;
    } else if (Platform.OS === 'android') {
      // Android 13+ requires runtime permission
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      // Android 12 and below don't require runtime permission
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Register for FCM push notifications and get token
 */
export const registerForFCMNotifications = async (
  userId: string
): Promise<string | null> => {
  if (!messaging) {
    console.log('Firebase not available - skipping FCM registration');
    return null;
  }
  
  try {
    // Request permission first
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.log('Notification permission not granted');
      return null;
    }

    // Get FCM token
    const fcmToken = await messaging().getToken();
    
    if (!fcmToken) {
      console.log('Failed to get FCM token');
      return null;
    }

    console.log('FCM Token:', fcmToken);

    // Save token to Supabase with platform info
    await saveFCMToken(userId, fcmToken);

    return fcmToken;
  } catch (error) {
    console.error('Error registering for FCM notifications:', error);
    return null;
  }
};

/**
 * Save FCM token to user profile with platform information
 */
export const saveFCMToken = async (
  userId: string,
  token: string
): Promise<void> => {
  try {
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        push_token: token,
        platform: platform
      })
      .eq('id', userId);

    if (error) {
      console.error('Error saving FCM token:', error);
    } else {
      console.log(`FCM token saved successfully for ${platform}`);
    }
  } catch (error) {
    console.error('Error saving FCM token:', error);
  }
};

/**
 * Handle foreground notifications (when app is open)
 */
export const setupForegroundNotificationHandler = () => {
  if (!messaging) {
    return () => {}; // Return no-op function
  }
  
  const unsubscribe = messaging().onMessage(async (remoteMessage) => {
    console.log('Foreground notification received:', remoteMessage);
    
    // You can display a custom in-app notification here
    // or let the system handle it
    if (remoteMessage.notification) {
      console.log('Notification Title:', remoteMessage.notification.title);
      console.log('Notification Body:', remoteMessage.notification.body);
    }
  });

  return unsubscribe;
};

/**
 * Handle background and quit state notifications
 */
export const setupBackgroundNotificationHandler = () => {
  if (!messaging) {
    return;
  }
  
  // Handle notification when app is in background
  messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log('Notification opened app from background:', remoteMessage);
    handleNotificationNavigation(remoteMessage);
  });

  // Handle notification when app was completely quit
  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        console.log('Notification opened app from quit state:', remoteMessage);
        handleNotificationNavigation(remoteMessage);
      }
    });
};

/**
 * Handle notification tap navigation
 */
const handleNotificationNavigation = (remoteMessage: any) => {
  const data = remoteMessage.data;
  
  if (data?.tripId) {
    // Navigate to trip details
    console.log('Navigate to trip:', data.tripId);
    // You'll implement actual navigation in your app
    // Example: navigationRef.navigate('TripDetails', { tripId: data.tripId });
  } else if (data?.type === 'new_message' && data?.chatId) {
    // Navigate to chat
    console.log('Navigate to chat:', data.chatId);
  }
};

/**
 * Handle token refresh
 */
export const setupTokenRefreshHandler = (userId: string) => {
  if (!messaging) {
    return () => {}; // Return no-op function
  }
  
  const unsubscribe = messaging().onTokenRefresh(async (newToken) => {
    console.log('FCM token refreshed:', newToken);
    await saveFCMToken(userId, newToken);
  });

  return unsubscribe;
};

/**
 * Delete FCM token (on logout)
 */
export const deleteFCMToken = async (userId: string): Promise<void> => {
  if (!messaging) {
    return;
  }
  
  try {
    // Delete token from Firebase
    await messaging().deleteToken();
    
    // Remove token from Supabase
    const { error } = await supabase
      .from('profiles')
      .update({ 
        push_token: null,
        platform: null
      })
      .eq('id', userId);

    if (error) {
      console.error('Error deleting FCM token:', error);
    } else {
      console.log('FCM token deleted successfully');
    }
  } catch (error) {
    console.error('Error deleting FCM token:', error);
  }
};

/**
 * Check if notification permission is granted
 */
export const checkNotificationPermission = async (): Promise<boolean> => {
  if (!messaging) {
    return false;
  }
  
  try {
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().hasPermission();
      return (
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL
      );
    } else if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        return granted;
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error checking notification permission:', error);
    return false;
  }
};

/**
 * Get badge count (iOS only)
 */
export const getBadgeCount = async (): Promise<number> => {
  if (!messaging || Platform.OS !== 'ios') {
    return 0;
  }
  
  try {
    const badge = await messaging().getBadge();
    return badge;
  } catch (error) {
    console.error('Error getting badge count:', error);
    return 0;
  }
};

/**
 * Set badge count (iOS only)
 */
export const setBadgeCount = async (count: number): Promise<void> => {
  if (!messaging || Platform.OS !== 'ios') {
    return;
  }
  
  try {
    await messaging().setBadge(count);
  } catch (error) {
    console.error('Error setting badge count:', error);
  }
};

/**
 * Clear badge count (iOS only)
 */
export const clearBadgeCount = async (): Promise<void> => {
  await setBadgeCount(0);
};

