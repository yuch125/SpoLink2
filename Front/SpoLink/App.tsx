// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { RootStackParamList } from './navigation/RootStackParamList';
import ProfileScreen from './screens/ProfileScreen';
import LoginScreen from './screens/LoginScreen';
import NicknameSetupScreen from './screens/NicknameSetupScreen';
import HomeScreen from './screens/HomeScreen';
import CreatePostScreen from './screens/CreatePostScreen';
import PlaceSearchScreen from './screens/PlaceSearchScreen';
import PlaceDetailScreen from './screens/PlaceDetailScreen';
import EditPostScreen from './screens/EditPostScreen';
import MyProfileScreen from './screens/MyProfileScreen';
import ApplicationsScreen from './screens/ApplicationsScreen';
import PostDetailScreen from './screens/PostDetailScreen';
import ChatListScreen from './screens/ChatListScreen';
import ChatRoomScreen from './screens/ChatRoomScreen';
import CreatedPostsScreen from './screens/CreatedPostsScreen';
import JoinedPostsScreen from './screens/JoinedPostsScreen';
import { ProfileProvider } from './contexts/ProfileContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      {/* ✅ ProfileProvider를 최상단으로 올림 */}
      <ProfileProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{
              headerShown: true,
              headerTitleAlign: 'center',
              headerBackTitle: '',
            }}
          >
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="NicknameSetup" component={NicknameSetupScreen} options={{ title: '프로필 설정' }} />
            <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="CreatePost" component={CreatePostScreen} options={{ title: '모임 만들기' }} />
            <Stack.Screen name="PlaceSearch" component={PlaceSearchScreen} options={{ title: '장소 검색' }} />
            <Stack.Screen name="PlaceDetail" component={PlaceDetailScreen} options={{ title: '장소 상세' }} />
            <Stack.Screen name="EditPost" component={EditPostScreen} options={{ title: '모임 수정' }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: '사용자 프로필' }} />
            <Stack.Screen name="MyProfile" component={MyProfileScreen} options={{ title: '내 프로필' }} />
            <Stack.Screen name="Applications" component={ApplicationsScreen} options={{ title: '신청자 관리' }} />
            <Stack.Screen name="ChatList" component={ChatListScreen} options={{ title: '채팅 목록' }} />
            <Stack.Screen name="ChatRoom" component={ChatRoomScreen} options={{ title: '채팅방' }} />
            <Stack.Screen name="CreatedPosts" component={CreatedPostsScreen} options={{ title: '만든 모임' }} />
            <Stack.Screen name="JoinedPosts" component={JoinedPostsScreen} options={{ title: '참가한 모임' }} />
            <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ title: '게시글 상세' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </ProfileProvider>
    </SafeAreaProvider>
  );
}
