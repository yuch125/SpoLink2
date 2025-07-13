import React, { useEffect, useState, useCallback } from 'react';
import { View, TextInput, Button, FlatList, Text, StyleSheet } from 'react-native';
import socket from '../utils/socket';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootStackParamList';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { SERVER_URL } from '../constants';
type Props = NativeStackScreenProps<RootStackParamList, 'ChatRoom'>;

type ChatMessage = {
  _id?: string;
  roomId: string;
  sender: {
    userId: string;
    nickname: string;
  };
  content: string;
  createdAt?: string;
};

export default function ChatRoomScreen({ route }: Props) {
  const { roomId, userId, nickname } = route.params;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axios.get(`${SERVER_URL}/messages/${roomId}`);
        setMessages(res.data); // 🔥 서버에서 받아온 메시지로 초기화
      } catch (err) {
        console.error('❌ 과거 메시지 불러오기 실패:', err);
      }
    };
  
    fetchMessages(); // 🔸 처음 진입 시 실행

    socket.connect();
    socket.emit('joinRoom', { roomId, userId });

    const handleNewMessage = (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    };

    socket.on('newMessage', handleNewMessage);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.disconnect();
    };
  }, [roomId, userId]);

  const sendMessage = () => {
    if (text.trim()) {
      socket.emit('sendMessage', {
        roomId,
        userId,
        nickname,
        content: text,
      });
      setText('');
    }
  };

  const renderItem = useCallback(({ item }: { item: ChatMessage }) => (
    <Text style={styles.message}>
      <Text style={styles.nickname}>{item.sender.nickname}:</Text> {item.content}
    </Text>
  ), []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.container}>
        <FlatList
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item, index) => item._id ?? index.toString()}
          contentContainerStyle={{ paddingBottom: 12 }}
        />
        <View style={styles.inputContainer}>
          <TextInput
            value={text}
            onChangeText={setText}
            style={styles.input}
            placeholder="메시지를 입력하세요"
          />
          <Button title="전송" onPress={sendMessage} />
        </View>
      </View>
    </SafeAreaView>

  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  message: { marginBottom: 8, fontSize: 16 },
  nickname: { fontWeight: 'bold', color: '#007AFF' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#ddd',
    padding: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 8,
    padding: 8,
    borderRadius: 6,
  },
});


