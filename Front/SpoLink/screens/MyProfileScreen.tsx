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
import { commonStyles } from '../styles/commonStyle';
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
  const [ageGroup, setAgegroup] = useState<String>('');
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
        console.log(u)
        setNickname(u.nickname);
        setBio(u.bio);
        setAgegroup(u.ageGroup ?? '')
        setAge(u.age ?? '');
        setRemainingChanges(u.remainingNicknameChanges);
        setProfileImage(u.profileImage ?? '');
        setProfile({
          userId: u.userId,
          nickname: u.nickname,
          bio: u.bio,
          profileImage: u.profileImage,
          ageGroup: u.ageGroup,
          age: u.age,
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
    <View style={commonStyles.screen}>
      {/* 프로필 카드 */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>로그아웃</Text>
      </TouchableOpacity>
      <View style={commonStyles.card}>
        <TouchableOpacity onPress={() => editing && pickAndUploadImage()} style={{ alignSelf: 'center', marginBottom: 12 }}>
          <Image
            source={profileImage ? { uri: profileImage } : require('../assets/user.png')}
            style={{ width: 100, height: 100, borderRadius: 50 }}
          />
        </TouchableOpacity>

        {editing ? (
          <>
            <TextInput style={commonStyles.input} value={nickname} onChangeText={setNickname} placeholder="닉네임" />
            <TextInput style={commonStyles.input} value={age} onChangeText={setAge} placeholder="나이" keyboardType="numeric" />
            <TextInput style={commonStyles.input} value={bio} onChangeText={setBio} placeholder="한 줄 소개" />

            <TouchableOpacity style={commonStyles.button} onPress={handleSave}>
              <Text style={commonStyles.buttonText}>저장</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>{nickname}</Text>
            <Text style={{ fontSize: 14, color: '#555', textAlign: 'center' }}>{bio || '한 줄 소개가 없습니다.'}</Text>
            <Text style={{ fontSize: 14, color: '#555', textAlign: 'center' }}>나이: {age ? `${age}세` : '미입력'}</Text>

        
              <Text style={{ fontSize: 13, color: '#333', textAlign: 'center', marginTop: 4 }}>
                신뢰도: {profile?.trust?.grade}
              </Text>

            <TouchableOpacity onPress={() => setEditing(true)} style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 13, color: '#007AFF', textAlign: 'center' }}>✏️ 프로필 수정</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* 활동 카드 */}
      <View style={commonStyles.card}>
        <TouchableOpacity style={commonStyles.button} onPress={() => navigation.navigate('CreatedPosts', { userId })}>
          <Text style={commonStyles.buttonText}>만든 모임 보기</Text>
        </TouchableOpacity>

        <TouchableOpacity style={commonStyles.button} onPress={() => navigation.navigate('JoinedPosts', { userId })}>
          <Text style={commonStyles.buttonText}>참가한 모임 보기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },

  logoutBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#f2f2f2',
    borderRadius: 6,
    zIndex: 10
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
