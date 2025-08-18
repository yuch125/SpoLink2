// ChatListScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { SERVER_URL } from '../constants';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootStackParamList';
import type { RouteProp } from '@react-navigation/native';

// 🔸 채팅방 타입 명시
type ChatRoom = {
  _id: string;
  postId: string; // 🔹 모집글 ID
  postTitle: string;
  participantCount: number;
  maxParticipants: number;
  lastMessage: string;
  title: string;
};

// 🔸 props 타입 지정
type Props = {
  route: RouteProp<RootStackParamList, 'ChatList'>;
};

export default function ChatListScreen({ route }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { userId, nickname } = route.params;

  const [rooms, setRooms] = useState<ChatRoom[]>([]);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await axios.get(`${SERVER_URL}/chatrooms/${userId}`);
        console.log('✅ 채팅방 목록:', res.data); // ✅ 이 줄 추가!
        setRooms(res.data);
      } catch (err) {
        console.error('❌ 채팅방 목록 로드 실패:', err);
      }
    };

    fetchRooms();
  }, [userId]);

  const goToChatRoom = (roomId: string, postId: string, title: string, initialCount: number, maxParticipants: number) => {
    navigation.navigate('ChatRoom', {
      roomId,
      postId, // 🔹 여기 추가
      userId,
      nickname,
      title,
      initialCount,
      maxParticipants,
    });
  };
  

  return (
    <View style={styles.container}>
      <FlatList
        data={rooms}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() =>goToChatRoom(item._id, item.postId, item.title, item.participantCount, item.maxParticipants)} style={styles.room}>
            <Text style={styles.title}>🏀 {item.postTitle}</Text>
            <Text style={styles.message}>💬 {item.lastMessage}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>채팅방이 없습니다.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  room: {
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#f1f1f1',
    borderRadius: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#555',
  },
});
