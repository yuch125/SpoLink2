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
import PostDetailScreen from './screens/PostDetailScreen';
import ChatListScreen from './screens/ChatListScreen';
import ChatRoomScreen from './screens/ChatRoomScreen';
import ProfileScreen from './screens/MyProfileScreen';
import { ProfileProvider } from './contexts/ProfileContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <ProfileProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="NicknameSetup" component={NicknameSetupScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="CreatePost" component={CreatePostScreen} />
          <Stack.Screen name="PlaceSearch" component={PlaceSearchScreen} />
          <Stack.Screen name="PlaceDetail" component={PlaceDetailScreen} />
          <Stack.Screen name="EditPost" component={EditPostScreen} />
          <Stack.Screen name="MyProfile" component={MyProfileScreen} options={{ title: '프로필' }} />
          <Stack.Screen name="Applications" component={ApplicationsScreen} options={{ title: '신청자 관리' }} />
          {/* ChatListScreen과 ChatRoomScreen이 유효한 default export인지 확인하세요 */}
          <Stack.Screen name="ChatList" component={ChatListScreen} options={{ title: '채팅 목록' }} />
          <Stack.Screen name="ChatRoom" component={ChatRoomScreen} options={{ title: '채팅방' }} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: '프로필 보기', headerShown: true }}
          <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ title: '게시글 상세' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </ProfileProvider>
  );
}
