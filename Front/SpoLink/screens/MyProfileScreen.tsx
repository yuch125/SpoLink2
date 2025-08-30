import React, { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import PostCard from '../components/PostCard';
import type { Profile } from '../contexts/ProfileContext';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, RouteProp, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, Post } from '../navigation/RootStackParamList';
import { SERVER_URL } from '../constants';
import { useProfile } from '../contexts/ProfileContext';

// 네비게이션 타입 정의
type MyProfileRouteProp = RouteProp<RootStackParamList, 'MyProfile'>;
type MyProfileNavProp = NativeStackNavigationProp<RootStackParamList, 'MyProfile'>;

export default function MyProfileScreen() {
  const route = useRoute<MyProfileRouteProp>();
  const navigation = useNavigation<MyProfileNavProp>();
  const { userId } = route.params;
  const [profileImage, setProfileImage] = useState<string>('');
  const { profile, setProfile, clearProfile } = useProfile();

  const [nickname, setNickname] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [trustScore, setTrustScore] = useState<number>(0);
  const [remainingChanges, setRemainingChanges] = useState<number>(3);
  const [editing, setEditing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const [createdPosts, setCreatedPosts] = useState<Post[]>([]);
  const [joinedPosts, setJoinedPosts] = useState<Post[]>([]);

  // 신뢰도 점수 → 한글 라벨
  const getTrustLabel = (score: number) => {
    if (score >= 80) return '매우높음';
    if (score >= 60) return '높음';
    if (score >= 40) return '보통';
    if (score >= 20) return '낮음';
    return '매우낮음';
  };

  // 프로필 사진 선택 및 업로드
  const pickAndUploadImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return Alert.alert('앨범 접근 권한이 필요합니다');
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const filename = uri.split('/').pop() ?? 'profile.jpg';
      const formData = new FormData();
      formData.append('image', { uri, name: filename, type: 'image/jpeg' } as any);
      try {
        const uploadRes = await fetch(`${SERVER_URL}/upload/profile`, { method: 'POST', body: formData });
        const { imageUrl } = await uploadRes.json();
        const token = await AsyncStorage.getItem('token');
        await axios.patch(
          `${SERVER_URL}/users/${userId}`,
          { profileImage: imageUrl },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setProfileImage(imageUrl);
        setProfile({ profileImage: imageUrl });
        Alert.alert('✅ 프로필 사진이 업데이트되었습니다');
      } catch (error) {
        console.error('이미지 업로드 실패:', error);
        Alert.alert('❌ 이미지 업로드에 실패했습니다');
      }
    }
  };

  // 마운트 시 프로필 및 모임 목록 불러오기
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        // 1) 프로필 정보
        const res = await axios.get<Profile>(`${SERVER_URL}/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const u = res.data;
        setNickname(u.nickname);
        setBio(u.bio);
        setAge(u.ageGroup ?? '');
        setTrustScore(u.trustScore);
        setRemainingChanges(u.remainingNicknameChanges);
        setProfileImage(u.profileImage ?? '');
        setProfile({
          userId: u.userId,
          nickname: u.nickname,
          bio: u.bio,
          profileImage: u.profileImage,
          ageGroup: u.ageGroup,
          trust: u.trust,   // 전체 trust 객체
        });

        // 2) 내가 만든 모임
        const { data: mine } = await axios.get<Post[]>(`${SERVER_URL}/posts?writer=${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCreatedPosts(mine);

        // 3) 내가 참가한 모임 (backend에서 Post[] 직접 반환)
        const { data: joined } = await axios.get<Post[]>(`${SERVER_URL}/users/${userId}/applications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setJoinedPosts(joined);
      } catch (error) {
        console.error('프로필 불러오기 실패:', error);
        Alert.alert('❌ 프로필을 불러오는 데 실패했습니다');
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  // 프로필 저장 핸들러
  const handleSave = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const res = await axios.patch(
        `${SERVER_URL}/users/${userId}`,
        { newNickname: nickname, bio, age },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const u = res.data.user as Profile;
      setNickname(u.nickname);
      setBio(u.bio);
      setAge(u.age);
      setTrustScore(u.trustScore);
      setRemainingChanges(u.remainingNicknameChanges);
      setProfile({ nickname: u.nickname, bio: u.bio, age: u.age, trustScore: u.trustScore, remainingNicknameChanges: u.remainingNicknameChanges });
      setEditing(false);
      Alert.alert('✅ 프로필이 업데이트되었습니다');
      navigation.goBack();
    } catch (error: any) {
      console.error('프로필 업데이트 실패:', error);
      Alert.alert(error.response?.data?.error || '❌ 업데이트에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃
  const handleLogout = async () => {
    await AsyncStorage.clear();
    clearProfile();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  // 모임 삭제
  const handleDelete = (postId: string) => {
    axios.delete(`${SERVER_URL}/posts/${postId}`).then(() => {
      setCreatedPosts(prev => prev.filter(p => p._id !== postId));
      setJoinedPosts(prev => prev.filter(p => p._id !== postId));
    }).catch(console.warn);
  };

  // 모임 수정 네비게이션
  const handleEdit = (post: Post) => {
    navigation.navigate('EditPost', { post, userId: profile!.userId, nickname: profile!.nickname });
  };


  return (
    <View style={styles.container}>
      {/* 로그아웃 버튼 - 오른쪽 위 */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>로그아웃</Text>
      </TouchableOpacity>

      {/* 프로필 섹션 (20%) */}
      <View style={styles.profileSection}>
        <TouchableOpacity onPress={() => editing && pickAndUploadImage()}>
          <Image
            source={profileImage ? { uri: profileImage } : require('../assets/user.png')}
            style={styles.avatar}
          />
        </TouchableOpacity>

        {editing ? (
          <View style={styles.editBlock}>
            <Text style={styles.editNotice}>닉네임은 최대 3번만 변경가능합니다.</Text>
            <TextInput style={styles.input} value={nickname} onChangeText={setNickname} placeholder="닉네임" />
            <TextInput style={styles.input} value={age} onChangeText={setAge} placeholder="예) 23" keyboardType="numeric" />
            <TextInput style={styles.input} value={bio} onChangeText={setBio} placeholder="한줄 소개" />

            {/* 저장/취소 버튼 묶음 */}
            <View style={styles.editButtonsRow}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveText}>저장</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
                <Text style={styles.cancelText}>취소</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.infoBlock}>
            <Text style={styles.nickname}>{nickname}</Text>
            <Text style={styles.intro}>{bio?.toString() || ''}</Text>
            <Text style={styles.trust}>
              신뢰도: {getTrustLabel(trustScore)}
            </Text>

            <Text style={styles.intro}>나이: {age || '미입력'}</Text>
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Text style={styles.editText}>✏️ 프로필 수정</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 모임 리스트 (80%) */}
      <View style={styles.listSection}>
        <Text style={styles.sectionTitle}>내가 만든 모임</Text>
        <FlatList
          data={createdPosts}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <PostCard post={item} currentUser={profile!.userId} onDelete={() => handleDelete(item._id)} onEdit={() => handleEdit(item)} />
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>생성한 모임이 없습니다.</Text>}
        />

        <Text style={styles.sectionTitle}>내가 참가한 모임</Text>
        <FlatList
          data={joinedPosts}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <PostCard post={item} currentUser={profile!.userId} onDelete={() => handleDelete(item._id)} onEdit={() => handleEdit(item)} />
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>참가한 모임이 없습니다.</Text>}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },

  logoutBtn: {
    position: 'absolute', top: 12, right: 12, padding: 6, zIndex: 10,
  },
  logoutText: { fontSize: 12, color: '#007AFF', fontWeight: '600' },

  // 🔹 프로필 섹션 (높이 비율 제거)
  profileSection: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  avatar: { width: 70, height: 70, borderRadius: 35, marginBottom: 8 },
  infoBlock: { alignItems: 'center' },
  nickname: { fontSize: 18, fontWeight: 'bold' },
  intro: { fontSize: 12, color: '#555', marginVertical: 4, textAlign: 'center' },
  trust: { fontSize: 11, color: '#888' },
  editText: { fontSize: 12, color: '#007AFF', marginTop: 4 },

  editBlock: { width: '90%', paddingHorizontal: 16, marginTop: 12 },
  editNotice: { fontSize: 11, color: '#999', marginBottom: 8, textAlign: 'center' },
  input: { borderBottomWidth: 1, borderColor: '#ccc', fontSize: 13, marginBottom: 12, paddingVertical: 4 },


  // 🔹 모임 섹션
  listSection: {
    flex: 1,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginTop: 12, marginBottom: 6 },
  emptyText: { textAlign: 'center', color: '#666', marginVertical: 12 },
  editButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },

  saveBtn: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    flex: 1,
    marginRight: 4,
  },
  saveText: { color: '#fff', fontSize: 13 },

  cancelBtn: {
    backgroundColor: '#ccc',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    flex: 1,
    marginLeft: 4,
  },
  cancelText: { color: '#333', fontSize: 13 },

});
