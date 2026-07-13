import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SingleModelChatScreen } from './src/chat/SingleModelChatScreen';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <SingleModelChatScreen />
    </>
  );
}

export default App;
