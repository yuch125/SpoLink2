import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
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
    _id: string;
    nickname: string;
    trustScore: number;
    profileImage?: string;
    ageGroup?: string;
    trust: {
      grade: string;   // "매우높음", "높음", ...
      score: number;   // 0~100
      total: number;   // 평가 횟수
      likes: number;
      dislikes: number;
    };
  };
};

export default function ApplicationsScreen() {
  const route = useRoute<ApplicationsRouteProp>();
  const navigation = useNavigation<ApplicationsNavProp>();
  const { postId } = route.params;
  const { profile } = useProfile();
  if (!profile) return <ActivityIndicator style={{ flex: 1 }} size="large" />;

  const { userId, nickname } = profile;
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get<Application[]>(
        `${SERVER_URL}/applications/post/${postId}`
      );
      console.log("참가자 정보")
      console.log(res.data)
      console.log("---------------------")
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


  const handleAccept = useCallback(
    async (
      id: string,
    ) => {
      try {
        const acceptRes = await axios.patch(
          `${SERVER_URL}/applications/${id}/accept`
        );
        const chatRoomId: string = acceptRes.data.chatRoomId;


        navigation.navigate('ChatRoom', {
          roomId: chatRoomId,
          postId: acceptRes.data.postId,               // ✅ 헤더 보정용
          title: acceptRes.data.title,                 // 모임 제목(없으면 ChatRoom이 /posts/:id로 보정)
          initialCount: acceptRes.data.participantCount,
          maxParticipants: acceptRes.data.maxParticipants,
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

  const renderItem = useCallback(
    ({ item }: { item: Application }) => (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.profileRow}
          onPress={() => {
            const id = item.applicant._id; // ✅ 이제 userId 대신 _id 사용
            console.log('→ 프로필 이동 userId:', id);
            if (typeof id === 'string' && id.length === 24) {
              navigation.navigate('Profile', { userId: id });
            } else {
              Alert.alert('오류', '유효한 사용자 ID가 아닙니다.');
            }
          }}
        >
          <Image
            source={
              item.applicant.profileImage
                ? { uri: `${item.applicant.profileImage}?t=${Date.now()}` }
                : require('../assets/user.png')
            }
            style={styles.avatar}
          />
          <View style={styles.header}>
            <Text style={styles.name}>{item.applicant.nickname}</Text>
            <Text style={styles.trust}>
              [{item.applicant.trust?.grade ?? '데이터부족'}]
            </Text>

            {item.applicant.ageGroup && (
              <Text style={styles.ageGroup}>({item.applicant.ageGroup})</Text>
            )}
          </View>
        </TouchableOpacity>

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
              onPress={() => handleAccept(item._id)}
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
    [handleAccept, handleReject, navigation]
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
  profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 8 },
  header: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '600' },
  trust: { fontSize: 14, color: '#666', marginLeft: 8 },
  status: { fontSize: 14, color: '#555', marginBottom: 6 },
  buttons: { flexDirection: 'row', marginTop: 10 },
  accept: { marginRight: 16, color: 'green', fontWeight: 'bold' },
  reject: { color: 'red', fontWeight: 'bold' },
  empty: { textAlign: 'center', marginTop: 40, color: '#888' },
  age: { fontSize: 14, color: '#666', marginLeft: 8 },
  ageGroup: { fontSize: 14, color: '#444', marginLeft: 6 },
});
