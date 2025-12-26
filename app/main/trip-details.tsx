// app/main/trip-details.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import TripDetailsScreen from '../../src/screens/Home/TripDetailsScreen';

export default function TripDetailsRoute() {
  const params = useLocalSearchParams();
  const router = useRouter();
  
  return (
    <TripDetailsScreen
      route={{ params: { tripId: params.tripId } }}
      navigation={{
        goBack: () => router.back(),
        navigate: (screen: string, params?: any) => {
          if (screen === 'Chat') {
            router.push(`/main/chat?tripId=${params.tripId}` as any);
          }
        },
      }}
    />
  );
}