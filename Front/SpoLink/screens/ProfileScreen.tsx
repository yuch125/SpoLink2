import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { SERVER_URL } from '../constants';
import type { RootStackParamList } from '../navigation/RootStackParamList';

type ProfileRoute = RouteProp<RootStackParamList, 'Profile'>;

type ProfileData = {
  nickname: string;
  bio?: string;
  avatarUrl?: string;
  trustScore?: number;
};

export default function ProfileScreen() {
  const { userId } = useRoute<ProfileRoute>().params;
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${SERVER_URL}/users/${userId}`);
        const u = res.data;

        setProfile({
          nickname: u.nickname,
          bio: u.bio,
          avatarUrl: u.profileImage,
          trustScore: u.trustScore ?? 0,
        });
      } catch (err: any) {
        console.error('❌ 프로필 조회 실패:', err);
        Alert.alert('프로필 조회 오류', '사용자 정보를 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }

  if (!profile) {
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
          profile.avatarUrl
            ? { uri: profile.avatarUrl }
            : require('../assets/user.png')
        }
        style={styles.avatar}
      />
      <Text style={styles.nickname}>{profile.nickname}</Text>
      <Text style={styles.bio}>
        {profile.bio?.trim() || '한줄 소개가 없습니다.'}
      </Text>
      <Text style={styles.trust}>
        신뢰도: {profile.trustScore?.toFixed(0) ?? 0}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  nickname: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  bio: {
    fontSize: 14,
    color: '#555',
    marginTop: 8,
    textAlign: 'center',
  },
  trust: {
    fontSize: 12,
    color: '#888',
    marginTop: 6,
  },
});
