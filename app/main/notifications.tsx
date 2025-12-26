// app/main/notifications.tsx
import { Stack } from 'expo-router';
import NotificationsScreen from '../../src/screens/Notifications/NotificationsScreen';

export default function NotificationsRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Notifications',
          headerShown: false,
        }}
      />
      <NotificationsScreen />
    </>
  );
}

