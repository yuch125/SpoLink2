// ─────────── C:\Back\Front\SpoLink\App.tsx ───────────

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CreatePostScreen from './screens/CreatePostScreen';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import PlaceSearchScreen from './screens/PlaceSearchScreen';
import PlaceDetailScreen from './screens/PlaceDetailScreen';
import ChatScreen from './screens/ChatScreen';
import { RootStackParamList } from './navigation/RootStackParamList';
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="PlaceSearch" component={PlaceSearchScreen} />
        <Stack.Screen name="PlaceDetail" component={PlaceDetailScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="CreatePost" component={CreatePostScreen} /> 
      </Stack.Navigator>
    </NavigationContainer>
  );
}
