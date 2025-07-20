// Front/SpoLink/screens/ChatRoomScreen.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, FlatList, TextInput, TouchableOpacity, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MessageBubble, { Message } from '../components/MessageBubble';
import { useRoute } from '@react-navigation/native';
import socket from '../utils/socket';
import axios from 'axios';
import { SERVER_URL } from '../constants';

export default function ChatRoomScreen() {
  const { roomId, userId } = useRoute<any>().params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    // 이전 메시지 불러오기
    axios.get<Message[]>(`${SERVER_URL}/messages/${roomId}`)
      .then(res => {
        console.log('🔍 fetched messages:', res.data);
        setMessages(res.data);
      })
      .catch(err => console.error('❌ 이전 메시지 불러오기 실패:', err));

    socket.connect();
    socket.emit('joinRoom', { roomId, userId });

    socket.on('newMessage', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      socket.off('newMessage');
      socket.disconnect();
    };
  }, [roomId, userId]);

  useEffect(() => {
    // 메시지 수신 시 가장 아래로 스크롤
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    socket.emit('sendMessage', { roomId, senderId: userId, content: input });
    setInput('');
  };

  const renderItem = useCallback(
    ({ item }: { item: Message }) => (
      <MessageBubble message={item} currentUserId={userId} />
    ),
    [userId]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={{ paddingBottom: 12 }}
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="메시지를 입력하세요"
          />
          <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
            <Text style={styles.sendText}>전송</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderColor: '#ddd', padding: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8 },
  sendButton: { paddingVertical: 8, paddingHorizontal: 16 },
  sendText: { color: '#007AFF', fontWeight: 'bold' },
});
