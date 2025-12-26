// app/main/create-trip.tsx
import { useRouter } from 'expo-router';
import CreateTripScreen from '../../src/screens/CreateTrip/CreateTripScreen';

export default function CreateTripRoute() {
  const router = useRouter();
  
  return (
    <CreateTripScreen
      navigation={{
        goBack: () => router.back(),
        navigate: (screen: string, params?: any) => {
          if (screen === 'TripDetails') {
            router.push(`/main/trip-details?tripId=${params.tripId}` as any);
          }
        },
      }}
    />
  );
}