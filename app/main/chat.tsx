// app/main/chat.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import ChatScreen from '../../src/screens/Chat/ChatScreen';

export default function ChatRoute() {
  const params = useLocalSearchParams();
  const router = useRouter();
  
  return (
    <ChatScreen
      route={{ params: { tripId: params.tripId } }}
      navigation={{ goBack: () => router.back() }}
    />
  );
}