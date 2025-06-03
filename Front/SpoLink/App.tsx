// ─────────── C:\Back\Front\SpoLink\App.tsx ───────────

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import PlaceSearchScreen from './screens/PlaceSearchScreen';
import PlaceDetailScreen from './screens/PlaceDetailScreen';
import ChatScreen from './screens/ChatScreen';

// 1) KakaoPlace 타입을 미리 export 해줍니다.
export type KakaoPlace = {
  id: string;
  place_name: string;
  address_name: string;
  road_address_name?: string;
  phone?: string;
  x: string;
  y: string;
};

// 2) RootStackParamList 에서도 KakaoPlace를 재사용
export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Home: undefined;
  PlaceSearch: undefined;
  PlaceDetail: { place: KakaoPlace };  // 이제 KakaoPlace를 참조할 수 있습니다.
  Chat: undefined;
};

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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
