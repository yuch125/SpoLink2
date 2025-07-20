import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { SERVER_URL } from '../constants';
import type { RootStackParamList } from '../navigation/RootStackParamList';

type ProfileRoute = RouteProp<RootStackParamList, 'Profile'>;

export default function ProfileScreen() {
  const { userId } = useRoute<ProfileRoute>().params;
  const [profile, setProfile] = useState<{
    nickname: string;
    bio: string;
    avatarUrl?: string;
    trustScore?: number;
  } | null>(null);

  useEffect(() => {
    const url = `${SERVER_URL}/users/${userId}`;
    console.log('▶️ 프로필 요청 URL:', url);

    axios.get(url)
      .then(res => {
        const u = res.data;
        setProfile({
          nickname: u.nickname,
          bio: u.bio,
          avatarUrl: u.profileImage,
          trustScore: u.trustScore,
        });
      })
      .catch(err => console.error('프로필 조회 실패:', err));
  }, [userId]);

  if (!profile) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }

  return (
    <View style={styles.container}>
      {profile.avatarUrl ? (
        <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
      ) : (
        <Image source={require('../assets/user.png')} style={styles.avatar} />
      )}

      <Text style={styles.nickname}>{profile.nickname}</Text>
      <Text style={styles.intro}>{profile.bio}</Text>
      <Text style={styles.trust}>신뢰도: {profile.trustScore ?? 0}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, alignItems: 'center', backgroundColor: '#fff' },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 12 },
  nickname: { fontSize: 20, fontWeight: 'bold' },
  intro: { fontSize: 14, color: '#555', marginVertical: 8, textAlign: 'center' },
  trust: { fontSize: 12, color: '#888' },
});
