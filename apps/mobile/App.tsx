import { StatusBar } from 'expo-status-bar';
import { SingleModelChatScreen } from './src/chat/SingleModelChatScreen';

export default function App() {
  return (
    <>
      <SingleModelChatScreen />
      <StatusBar style="auto" />
    </>
  );
}
