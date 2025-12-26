// app/main/edit-trip.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import EditTripScreen from '../../src/screens/CreateTrip/EditTripScreen';

export default function EditTripRoute() {
  const params = useLocalSearchParams();
  const router = useRouter();
  
  return (
    <EditTripScreen
      route={{ params: { tripId: params.tripId } }}
      navigation={{
        goBack: () => router.back(),
      }}
    />
  );
}