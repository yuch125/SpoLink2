import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_URL } from '../constants';
import type { RootStackParamList, Post } from '../navigation/RootStackParamList';
import PostCard from '../components/PostCard';
import { useProfile } from '../contexts/ProfileContext';

type ProfileRoute = RouteProp<RootStackParamList, 'Profile'>;

type ProfileData = {
  nickname: string;
  bio?: string;
  profileImage?: string;
  trustScore: number;
  trustStats?: { likes: number; dislikes: number }; // ✅ 추가
  ageGroup?: string; // ✅ age 대신 ageGroup으로
  age? : string,
  createdPosts: Post[];
  joinedPosts: Post[];
  trust? : {dislike : number, grade : string, likes : number, score : number, total : number}
};

export default function ProfileScreen() {
  const { userId } = useRoute<ProfileRoute>().params;
  const navigation = useNavigation<any>();
  const { profile: me } = useProfile();
  const viewerId = me?.userId;
  const isMine = viewerId === userId;

  // 내 프로필이면 MyProfileScreen으로 이동
  useEffect(() => {
    if (isMine) {
      navigation.replace('MyProfile', { userId });
    }
  }, [isMine]);

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState<Record<string, boolean>>({});

  // 신뢰도 점수 → 한글 라벨
  const getTrustLabel = (score: number) => {
    if (score >= 80) return '매우높음';
    if (score >= 60) return '높음';
    if (score >= 40) return '보통';
    if (score >= 20) return '낮음';
    return '매우낮음';
  };

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await axios.get(`${SERVER_URL}/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const u = res.data;
        console.log(u)
        const { data: mine } = await axios.get<Post[]>(
          `${SERVER_URL}/posts?writer=${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const { data: joined } = await axios.get<Post[]>(
          `${SERVER_URL}/users/${userId}/applications`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setProfileData({
          nickname: u.nickname,
          bio: u.bio,
          profileImage: u.profileImage,
          trustScore: u.trustScore ?? 0,
          trustStats: u.trustStats, // 서버에서 { likes, dislikes } 제공된다고 가정
          ageGroup: u.ageGroup,
          age: u.age,
          createdPosts: mine,
          joinedPosts: joined,
          trust : u.trust
        });


        const appliedMap: Record<string, boolean> = {};
        joined.forEach(p => { appliedMap[p._id] = true; });
        setHasApplied(appliedMap);
      } catch (err) {
        console.error('❌ 프로필 조회 실패:', err);
        Alert.alert('프로필 조회 오류', '사용자 정보를 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const handleApply = async (postId: string) => {
    if (!viewerId) return Alert.alert('로그인이 필요합니다');
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${SERVER_URL}/applications`,
        { postId, applicant: { userId: viewerId, nickname: me?.nickname } },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHasApplied(prev => ({ ...prev, [postId]: true }));
      Alert.alert('참가신청이 완료되었습니다');
    } catch (err: any) {
      console.error('❌ 참가신청 실패:', err);
      Alert.alert('참가신청 오류', err.response?.data?.error || '다시 시도해주세요');
    }
  };

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }
  if (!profileData) {
    return (
      <View style={styles.center}>
        <Text>프로필 정보를 불러올 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={
          profileData.profileImage
            ? { uri: profileData.profileImage }
            : require('../assets/user.png')
        }
        style={styles.avatar}
      />
      <Text style={styles.nickname}>{profileData.nickname}</Text>
      <Text style={styles.bio}>한줄소개 : {profileData.bio?.trim() || '한줄 소개가 없습니다.'}</Text>
      <Text style={styles.age}>
        나이: {profileData.age +"세" || '미입력'}
      </Text>
      <Text style={styles.trust}>
        신뢰도: {profileData.trust?.grade}
      </Text>
  
      {/* ✅ 버튼 영역 */}
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => navigation.navigate('CreatedPosts', { userId })}
      >
        <Text style={styles.menuButtonText}>생성한 모임 보기</Text>
      </TouchableOpacity>
  
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => navigation.navigate('JoinedPosts', { userId })}
      >
        <Text style={styles.menuButtonText}>참가한 모임 보기</Text>
      </TouchableOpacity>
    </View>
  );
  
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' }, // padding 줄임
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // 프로필 영역 ↓
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#ccc'
  },
  nickname: { fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  bio: { fontSize: 12, color: '#555', marginTop: 4, textAlign: 'center' },
  trust: { fontSize: 11, color: '#888', marginTop: 4, textAlign: 'center' },
  age: { fontSize: 11, color: '#888', marginTop: 2, textAlign: 'center' },

  // 리스트 영역 ↓
  sectionTitle: { fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 6 },

  // PostCard를 조금 더 크게 보이도록
  postWrapper: { marginVertical: 6 },
  emptyText: { textAlign: 'center', color: '#666', marginVertical: 12 },
  menuButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginVertical: 6,
    alignItems: 'center',
  },
  menuButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  
});
