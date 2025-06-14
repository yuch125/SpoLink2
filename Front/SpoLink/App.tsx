// ─────────── C:\Back\Front\SpoLink\App.tsx ───────────

// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './navigation/RootStackParamList';

import LoginScreen from './screens/LoginScreen';
import NicknameSetupScreen from './screens/NicknameSetupScreen';
import HomeScreen from './screens/HomeScreen';
import CreatePostScreen from './screens/CreatePostScreen';
import PlaceSearchScreen from './screens/PlaceSearchScreen';
import PlaceDetailScreen from './screens/PlaceDetailScreen';
import EditPostScreen from './screens/EditPostScreen';
import MyProfileScreen from './screens/MyProfileScreen'; 
import ApplicationsScreen from './screens/ApplicationsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="NicknameSetup" component={NicknameSetupScreen} />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          initialParams={{ username: '' }}
        />
        <Stack.Screen name="CreatePost" component={CreatePostScreen} />
        <Stack.Screen name="PlaceSearch" component={PlaceSearchScreen} />
        <Stack.Screen name="PlaceDetail" component={PlaceDetailScreen} />
        <Stack.Screen name="EditPost" component={EditPostScreen} />
        {/* 프로필 보기/수정 스크린 */}
      <Stack.Screen
        name="MyProfile"
        component={MyProfileScreen}
        options={{ title: '프로필' }}
      />
       <Stack.Screen name="Applications" component={ApplicationsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

