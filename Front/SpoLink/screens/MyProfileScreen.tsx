// screens/MyProfileScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import axios from 'axios';
import { useRoute, useNavigation } from '@react-navigation/native';
import PostCard from '../components/PostCard';
import { SERVER_URL } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Post, RootStackParamList } from '../navigation/RootStackParamList';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Application = {
  _id: string;
  status: 'accepted' | 'pending';
  post?: Post;
};

type MyProfileRouteProp = NativeStackNavigationProp<RootStackParamList, 'MyProfile'>;

export default function MyProfileScreen() {
  const route = useRoute();
  const navigation = useNavigation<MyProfileRouteProp>();
  const { username } = route.params as { username: string };

  const [nickname, setNickname] = useState(username);
  const [intro, setIntro] = useState('');
  const [editing, setEditing] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    // 모집 글 불러오기 (username 기준)
    axios.get(`${SERVER_URL}/posts`).then((res) => {
      const myPosts = res.data.filter((p: Post) => {
        const writerName = typeof p.writer === 'string' ? p.writer : p.writer?.username;
        return writerName === username;
      });
      setPosts(myPosts);
    });

    // 내가 신청한 글
    axios.get(`${SERVER_URL}/applications`, { params: { username } })
      .then((res) => setApplications(res.data));

    // 사용자 정보 불러오기
    axios.get(`${SERVER_URL}/users/${username}`).then((res) => {
      setNickname(res.data.user.nickname || username);
      setIntro(res.data.user.bio || '');
    });
  }, [username]);

  const handleSaveNickname = async () => {
    console.log('🔄 닉네임 저장 시도');
    console.log('📤 요청 URL:', `${SERVER_URL}/users/${username}`);
    console.log('📤 요청 데이터:', { newNickname: nickname, intro: intro });

    try {
      const response = await axios.patch(`${SERVER_URL}/users/${username}`, {
        newNickname: nickname,
        intro: intro,
      });

      setNickname(response.data.user.nickname || username);
      setIntro(response.data.user.bio || '');

      Alert.alert('✅ 닉네임이 변경되었습니다');
      setEditing(false);
    } catch (err) {
      console.error(err);
      Alert.alert('❌ 닉네임 변경 실패');
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <View style={styles.container}>
      <Image source={require('../assets/user.png')} style={styles.profileImage} />

      {editing ? (
        <View style={styles.editBlock}>
          <TextInput
            style={styles.nicknameInput}
            value={nickname}
            onChangeText={setNickname}
            placeholder="닉네임"
          />
          <TextInput
            style={styles.nicknameInput}
            value={intro}
            onChangeText={setIntro}
            placeholder="한줄 소개"
          />
          <TouchableOpacity onPress={handleSaveNickname}>
            <Text style={styles.saveText}>저장</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.nicknameRow}>
          <View>
            <Text style={styles.nickname}>{nickname}</Text>
            <Text style={styles.intro}>{intro}</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              console.log('✏️ 수정 버튼 클릭됨');
              setEditing(true);
            }}
          >
            <Text style={styles.editText}>수정</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <Text style={{ color: 'white' }}>로그아웃</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>📍 내가 만든 모집</Text>
      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            currentUser={username}
            onEdit={() => { }}
            onDelete={() => { }}
          />
        )}
      />

      <Text style={styles.sectionTitle}>✏️ 참가 신청한 모집</Text>
      <FlatList
        data={applications}
        keyExtractor={(item) => item._id || Math.random().toString()}
        renderItem={({ item }) =>
          item.post ? (
            <PostCard
              post={item.post}
              currentUser={username}
              onEdit={() => { }}
              onDelete={() => { }}
            />
          ) : (
            <Text style={{ color: 'red' }}>❌ 모집글이 삭제되었거나 없습니다</Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 10,
  },
  nicknameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nickname: { fontSize: 20, fontWeight: 'bold' },
  intro: { color: '#666', marginTop: 4 },
  editText: { color: 'blue', marginLeft: 10 },
  subtext: { textAlign: 'center', color: '#888', marginBottom: 20 },
  editBlock: {
    marginBottom: 12,
    gap: 8,
  },
  nicknameInput: {
    borderBottomWidth: 1,
    fontSize: 18,
    paddingVertical: 6,
    marginBottom: 8,
  },
  saveText: { color: 'green', fontWeight: 'bold' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  logoutButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#333',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
});
