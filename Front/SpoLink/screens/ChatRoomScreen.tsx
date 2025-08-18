import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Button,
  Text,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
  ActivityIndicator,  // 추가
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MessageBubble, { Message } from '../components/MessageBubble';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import socket from '../utils/socket';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_URL } from '../constants';
import Slider from '@react-native-community/slider';
import { useProfile } from '../contexts/ProfileContext';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/RootStackParamList';

// ...

// 참가자 타입 정의
type Participant = {
  _id: string;
  userId: string;
  nickname: string;
  profileImage?: string;
};

export default function ChatRoomScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'ChatRoom'>>();
  const {
    roomId,
    postId: routePostId,
    title,
    initialCount,
    maxParticipants: initialMax
  } = route.params;
  const [postId, setPostId] = useState<string | null>(routePostId ?? null);
  const navigation = useNavigation<any>();
  const [evaluatedMap, setEvaluatedMap] = useState<Record<string, boolean>>({});
  const [roomTitle, setRoomTitle] = useState<string>(title ?? '모임');
  const [participantCount, setParticipantCount] = useState<number>(initialCount ?? 1);
  const [maxParticipants, setMaxParticipants] = useState<number>(initialMax ?? 1);

  const [trustPanelVisible, setTrustPanelVisible] = useState<boolean>(false); // 우상단 버튼으로 여는 패널

  const { profile } = useProfile();
  const userId = profile?.userId ?? '';
  if (!userId) return null; // 또는 로딩 화면

  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState<boolean>(true);  // 로딩 상태 추가
  const flatListRef = useRef<FlatList<Message>>(null);

  // route.params.postId가 나중에 들어오는 경우 대비
  useEffect(() => {
    if (!postId && routePostId) {
      setPostId(routePostId);
    }
  }, [routePostId]);


  useEffect(() => {
    navigation.setOptions({
      headerTitle: `${roomTitle}  ${participantCount}/${maxParticipants}`,
      headerRight: () => (
        <TouchableOpacity onPress={() => setTrustPanelVisible(true)} style={{ paddingHorizontal: 12 }}>
          <Text style={{ fontWeight: '600' }}>참가인원</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, roomTitle, participantCount, maxParticipants]);

  // 참가자 평가완료 여부 일괄 조회
  const fetchEvaluationStatus = async (members: Participant[]) => {
    console.log('DEBUG 👉 postId:', postId, 'profile?.userId:', profile?.userId);
    if (!postId || !profile?.userId) return;
    try {
      const entries = await Promise.all(
        members
          .filter(m => m.userId !== profile.userId)
          .map(async m => {
            const { data } = await axios.get(`${SERVER_URL}/evaluations/status`, {
              params: { postId, raterId: profile.userId, targetUserId: m.userId },
            });
            console.log('🧐 평가 상태 요청 params:', {
              postId,
              raterId: profile?.userId,
              targetUserId: m.userId,
            });

            return [m.userId, !!data.evaluated] as const;
          })
      );
      setEvaluatedMap(Object.fromEntries(entries));
    } catch (e) {
      // 무시 가능
    }
  };

  const fetchParticipants = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const { data } = await axios.get<{ participants: Participant[] }>(
        `${SERVER_URL}/chatrooms/${roomId}/participants`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('🔄 fetched participants:', data.participants);
      // 1) participants 상태 업데이트
      setParticipants(data.participants);
      if (!postId && (data as any)?.postId) {
        setPostId((data as any).postId);
      }
      if (typeof (data as any)?.maxParticipants === 'number') {
        setMaxParticipants((data as any).maxParticipants);
      }
      await fetchEvaluationStatus(data.participants);
      // 2) messages 상태에도 최신 프로필 덮어쓰기
      setMessages(prevMessages =>
        prevMessages.map(msg => {
          const p = data.participants.find(p => p.userId === msg.sender.userId);
          if (p) {
            return {
              ...msg,
              sender: {
                ...msg.sender,
                nickname: p.nickname,
                profileImage: p.profileImage,
              },
            };
          }
          return msg;
        })
      );
    } catch (err) {
      console.error('참가자 프로필 불러오기 실패', err);
    }
  };


  // 화면 포커스될 때마다 참가자 목록 갱신
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchParticipants().finally(() => setLoading(false));
    }, [roomId])
  );
  // postId가 null인 방(구버전 방) 보호: 방 메타에서 postId/인원 가져오기
  useEffect(() => {
    if (postId) return;          // 이미 있으면 필요 없음
    (async () => {
      try {
        const { data } = await axios.get(`${SERVER_URL}/chatrooms/room/${roomId}`);
        if (data?.postId) setPostId(data.postId);
        if (typeof data?.participantCount === 'number') setParticipantCount(data.participantCount);
        if (typeof data?.maxParticipants === 'number') setMaxParticipants(data.maxParticipants);
      } catch (e) {
        // 구버전 방일 수 있음 → postId가 끝내 없으면 평가를 잠그고 안내
        console.warn('chatroom meta 조회 실패 또는 postId 없음');
      }
    })();
  }, [roomId, postId]);

  // 메시지 초기 로드 및 소켓 연결
  // (추가) 최초 1회: post 상세에서 제목/인원 보정
  useEffect(() => {
    if (!postId) return;
    let mounted = true;

    axios.get(`${SERVER_URL}/posts/${postId}`)
      .then(res => {
        if (!mounted) return;
        const p = res.data;
        if (!title && typeof p.content === 'string') setRoomTitle(p.content);
        if (typeof p.participantCount === 'number') setParticipantCount(p.participantCount);
        if (typeof p.maxParticipants === 'number') setMaxParticipants(p.maxParticipants);
      })
      .catch(err => console.warn('get /posts/:id 실패', err));

    return () => { mounted = false; };
  }, [postId, title]);


  useEffect(() => {
    axios.get<Message[]>(`${SERVER_URL}/messages/${roomId}`)
      .then(res => {
        setMessages(res.data);
        socket.connect();
        socket.emit('joinRoom', { roomId, userId });
        res.data.forEach(msg => {
          if (!msg.readBy?.includes(userId)) {
            socket.emit('readMessage', { roomId, messageId: msg._id, userId });
          }
        });
      })
      .catch(console.error);

    socket.on('newMessage', msg => setMessages(prev => [...prev, msg]));
    socket.on('messageDeleted', id => setMessages(prev => prev.filter(m => m._id !== id)));
    socket.on('messageRead', ({ messageId, readerId }) => {
      setMessages(prev => prev.map(m =>
        m._id === messageId
          ? { ...m, readBy: Array.from(new Set([...(m.readBy || []), readerId])) }
          : m
      ));
    });

    return () => {
      socket.off('newMessage');
      socket.off('messageDeleted');
      socket.off('messageRead');
      socket.disconnect();
    };
  }, [roomId, userId]);

  // (추가) 참가 인원 업데이트 이벤트 수신
  useEffect(() => {
    const handler = (payload: {
      postId: string;
      participantCount: number;
      maxParticipants: number;
      isFull?: boolean;
    }) => {
      if (payload.postId) {
        setPostId(payload.postId); // 🔹 postId 보정
      }
      if (typeof payload.participantCount === 'number') {
        setParticipantCount(payload.participantCount);
      }
      if (typeof payload.maxParticipants === 'number') {
        setMaxParticipants(payload.maxParticipants);
      }
      fetchParticipants();
    };


    socket.on('post:participantsUpdated', handler);
    return () => {
      socket.off('post:participantsUpdated', handler);
    };
  }, []);


  // 자동 스크롤
  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);


  // messages 배열이 갱신될 때마다, 내 메시지가 아니고 아직 읽음 처리 안 된 메시지에 대해
  useEffect(() => {
    messages.forEach(msg => {
      // msg.sender.userId 필드 경로는 서버가 내려준 구조에 따라 조정하세요.
      if (msg.sender.userId !== userId && !msg.readBy?.includes(userId)) {
        socket.emit('readMessage', {
          roomId,
          messageId: msg._id,
          userId,
        });
      }
    });
  }, [messages, roomId, userId]);

  const sendMessage = () => {
    if (!input.trim()) return;
    socket.emit('sendMessage', { roomId, senderId: userId, content: input });
    setInput('');
  };

  const handleDelete = (messageId: string) => {
    Alert.alert('메시지 삭제', '정말 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => socket.emit('deleteMessage', { roomId, messageId, userId }) }
    ]);
  };

  // 1~100점 평가
  const handleEvaluate = async (targetUserId: string, value: 1 | -1) => {
    if (!postId) {
      Alert.alert('평가 불가', '이 채팅방은 모집글과 연결되어 있지 않아 평가를 할 수 없어요.');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${SERVER_URL}/evaluations`,
        { postId, raterId: userId, targetUserId, value },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEvaluatedMap(prev => ({ ...prev, [targetUserId]: true }));
      Alert.alert('✅ 평가 완료', value === 1 ? '좋아요가 반영됐어요.' : '싫어요가 반영됐어요.');
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setEvaluatedMap(prev => ({ ...prev, [targetUserId]: true }));
        Alert.alert('⚠️ 이미 평가함', '이 모임에서는 이미 평가했습니다.');
      } else {
        console.error(err);
        Alert.alert('❌ 오류', '평가 전송에 실패했습니다.');
      }
    }
  };


  const renderItem = useCallback(({ item }: { item: Message }) => {
    const isOwn = item.sender.userId === userId;
    const unreadCount = participants
      .filter(p => p.userId !== item.sender.userId)
      .filter(p => !item.readBy?.includes(p.userId)).length;
    return (
      <TouchableOpacity onLongPress={() => isOwn && handleDelete(item._id)} delayLongPress={300} activeOpacity={0.8}>
        <MessageBubble message={item} currentUserId={userId} unreadCount={unreadCount} />
      </TouchableOpacity>
    );
  }, [userId, participants]);

  // 로딩 중일 때
  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={i => i._id}
          contentContainerStyle={{ padding: 8, paddingBottom: 12 }}
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

      {/* 신뢰도 패널 모달(참가자 목록 + '평가하기' 버튼) */}
      <Modal
        transparent
        visible={trustPanelVisible}
        animationType="slide"
        onRequestClose={() => setTrustPanelVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { width: '90%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: '600' }}>참가자 평가하기</Text>
              <TouchableOpacity onPress={() => setTrustPanelVisible(false)}>
                <Text style={{ fontSize: 16 }}>닫기</Text>
              </TouchableOpacity>
            </View>

            {participants.filter(p => p.userId !== userId).map(p => (
              <View key={p.userId} style={styles.participantRow}>
                <TouchableOpacity
                  style={styles.profileRow}
                  onPress={() => {
                    setTrustPanelVisible(false);
                    navigation.navigate('Profile', { userId: p.userId });
                  }}
                >
                  <Image
                    source={p.profileImage ? { uri: `${p.profileImage}?t=${Date.now()}` } : require('../assets/user.png')}
                    style={styles.avatar}
                  />
                  <Text style={styles.participantName}>{p.nickname}</Text>
                </TouchableOpacity>

                {evaluatedMap[p.userId] ? (
                  <Text style={styles.evaluatedText}>✔️ 평가됨</Text>
                ) : (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={() => handleEvaluate(p.userId, 1)} style={styles.evalButton}>
                      <Text style={styles.evalButtonText}>👍</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleEvaluate(p.userId, -1)} style={[styles.evalButton, { backgroundColor: '#ef4444' }]}>
                      <Text style={styles.evalButtonText}>👎</Text>
                    </TouchableOpacity>
                  </View>
                )}

              </View>
            ))}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  inputContainer: { flexDirection: 'row', borderTopWidth: 1, borderColor: '#ddd', padding: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8 },
  sendButton: { justifyContent: 'center', paddingHorizontal: 16 },
  sendText: { color: '#007AFF', fontWeight: 'bold' },

  participantsContainer: { borderTopWidth: 1, borderColor: '#eee', padding: 8 },
  sectionTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 6 },
  participantRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8 },
  participantName: { fontSize: 16 },
  evalButton: { backgroundColor: '#007AFF', padding: 6, borderRadius: 6 },
  evalButtonText: { color: 'white' },
  evaluatedText: { color: '#007AFF', fontSize: 16 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', padding: 16, borderRadius: 8 },
  modalText: { marginBottom: 8, fontSize: 16 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
});
