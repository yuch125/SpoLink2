import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import io from 'socket.io-client';
import axios from 'axios';
import {
  useRoute,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { SERVER_URL } from '../constants';
import type { RootStackParamList } from '../navigation/RootStackParamList';
import { useProfile } from '../contexts/ProfileContext';

type ApplicationsRouteProp = RouteProp<RootStackParamList, 'Applications'>;
type ApplicationsNavProp = NativeStackNavigationProp<RootStackParamList, 'Applications'>;

type Application = {
  _id: string;
  status: 'pending' | 'accepted' | 'rejected';
  applicant: {
    userId: string;
    nickname: string;
  };
};

// Socket.IO 클라이언트 인스턴스
const socket = io(SERVER_URL, { transports: ['websocket'] });

export default function ApplicationsScreen() {
  const route = useRoute<ApplicationsRouteProp>();
  const navigation = useNavigation<ApplicationsNavProp>();
  const { postId } = route.params;
  const { profile } = useProfile();
  const { userId, nickname } = profile;

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // 신청 목록 불러오기
  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get<Application[]>(
        `${SERVER_URL}/applications/post/${postId}`
      );
      setApplications(res.data);
    } catch (err: any) {
      console.error('❌ 신청 목록 오류:', err.response?.data || err.message);
      Alert.alert('불러오기 실패', err.response?.data?.error || '서버 오류');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useFocusEffect(
    useCallback(() => {
      fetchApplications();
    }, [fetchApplications])
  );

  // 소켓 연결
  useEffect(() => {
    socket.on('connect', () => {
      console.log('✅ Socket.IO connected:', socket.id);
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  // 참가 수락 핸들러
  const handleAccept = useCallback(
    async (
      id: string,
      applicant: { userId: string; nickname: string }
    ) => {
      try {
        // 1) 수락 & chatRoomId 받기
        const acceptRes = await axios.patch(
          `${SERVER_URL}/applications/${id}/accept`
        );
        const chatRoomId: string = acceptRes.data.chatRoomId;
        console.log('▶️ 받은 chatRoomId:', chatRoomId);

        // 2) Socket.IO 룸 입장
        socket.emit('joinRoom', { roomId: chatRoomId, userId: applicant.userId });
        console.log(
          `▶️ joinRoom 이벤트 발송 (roomId=${chatRoomId}, userId=${
            applicant.userId
          })`
        );

        // 3) 채팅방 화면으로 이동
        navigation.navigate('ChatRoom', {
          roomId: chatRoomId,
          userId,
          nickname,
        });

        Alert.alert('✅ 수락 완료', '채팅방으로 이동합니다.');
        fetchApplications();
      } catch (err: any) {
        console.error(
          '❌ 수락/채팅방 오류:',
          err.response?.data || err.message
        );
        Alert.alert('오류', err.response?.data?.error || '서버 오류');
      }
    },
    [fetchApplications, navigation, userId, nickname]
  );

  // 참가 거절 핸들러
  const handleReject = useCallback(
    async (id: string) => {
      try {
        await axios.patch(`${SERVER_URL}/applications/${id}/reject`);
        Alert.alert('거절 완료');
        fetchApplications();
      } catch (err: any) {
        console.error('❌ 거절 오류:', err.response?.data || err.message);
        Alert.alert('거절 실패', err.response?.data?.error || '서버 오류');
      }
    },
    [fetchApplications]
  );

  // 신청자 카드 렌더링
  const renderItem = useCallback(
    ({ item }: { item: Application }) => (
      <View style={styles.card}>
        <Text style={styles.name}>{item.applicant.nickname}</Text>
        <Text style={styles.status}>
          상태:{' '}
          {item.status === 'pending'
            ? '🕓 대기중'
            : item.status === 'accepted'
            ? '✅ 수락됨'
            : '❌ 거절됨'}
        </Text>

        {item.status === 'pending' && (
          <View style={styles.buttons}>
            <TouchableOpacity
              onPress={() => handleAccept(item._id, item.applicant)}
            >
              <Text style={styles.accept}>수락</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleReject(item._id)}>
              <Text style={styles.reject}>거절</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    ),
    [handleAccept, handleReject]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>신청자 목록</Text>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={applications}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={styles.empty}>신청자가 없습니다.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  card: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  name: { fontSize: 16, fontWeight: '600' },
  status: { fontSize: 14, color: '#555', marginTop: 4 },
  buttons: { flexDirection: 'row', marginTop: 10 },
  accept: { marginRight: 16, color: 'green', fontWeight: 'bold' },
  reject: { color: 'red', fontWeight: 'bold' },
  empty: { textAlign: 'center', marginTop: 40, color: '#888' },
});
