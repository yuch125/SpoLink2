// Front/SpoLink/screens/MyProfileScreen.tsx
// 화면 맨 위에
import * as ImagePicker from 'expo-image-picker';
import PostCard from '../components/PostCard';
import type { Profile } from '../contexts/ProfileContext';
import React, { useState, useEffect } from 'react';
import {View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert, ActivityIndicator, FlatList,} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, RouteProp, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootStackParamList';
import { Picker } from '@react-native-picker/picker';
import { SERVER_URL } from '../constants';
import { useProfile } from '../contexts/ProfileContext';
import { Post } from '../navigation/RootStackParamList';
// 네비게이션 타입 정의
type MyProfileRouteProp = RouteProp<RootStackParamList, 'MyProfile'>;
type MyProfileNavProp = NativeStackNavigationProp<RootStackParamList, 'MyProfile'>;

export default function MyProfileScreen() {
  const route = useRoute<MyProfileRouteProp>();
  const navigation = useNavigation<MyProfileNavProp>();
  const { userId } = route.params;
  const [profileImage, setProfileImage] = useState('');
  const { profile, setProfile, clearProfile } = useProfile();
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [ageGroup, setAgeGroup] = useState<'중1' | '중2' | '중3' | '고1' | '고2' | '고3' | '대학생' | '기타'>('기타');
  const [trustScore, setTrustScore] = useState(0);
  const [remainingChanges, setRemainingChanges] = useState(3);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [createdPosts, setCreatedPosts] = useState<Post[]>([]);
  const [joinedPosts, setJoinedPosts] = useState<Post[]>([]);


  // ✅ 여기 위치에 작성하면 돼
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
      const imageUri = result.assets[0].uri;

      const filename = imageUri.split('/').pop() || 'profile.jpg';
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        name: filename,
        type: 'image/jpeg',
      } as any);

      try {
        console.log('📤 이미지 업로드 시작');

        const uploadRes = await fetch(`${SERVER_URL}/upload/profile`, {
          method: 'POST',
          body: formData,
        });

        console.log('📥 서버 응답 상태코드:', uploadRes.status);

        const responseText = await uploadRes.text();
        console.log('📦 서버 응답 본문:', responseText);

        const { imageUrl } = JSON.parse(responseText);
        console.log('✅ 이미지 URL:', imageUrl);

        const token = await AsyncStorage.getItem('token');
        await axios.patch(`${SERVER_URL}/users/${userId}`, {
          profileImage: imageUrl,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setProfileImage(imageUrl);
        setProfile({
          userId: profile?.userId ?? '',
          nickname: profile?.nickname ?? '',
          bio: profile?.bio ?? '',
          ageGroup: profile?.ageGroup ?? '기타',
          trustScore: profile?.trustScore ?? 0,
          remainingNicknameChanges: profile?.remainingNicknameChanges ?? 3,
          profileImage: imageUrl, // 확실히 이걸로 지정
        });



        Alert.alert('✅ 프로필 사진이 업데이트되었습니다');
      } catch (err) {
        console.error('이미지 업로드 실패:', err);
        Alert.alert('❌ 이미지 업로드에 실패했습니다');
      }
    }
  };

  // 1) 화면 마운트 시 프로필 불러오기
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await axios.get(`${SERVER_URL}/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('📦 응답 구조 확인:', res.data); // 이거 찍고 구조 확인해봐

        const u = res.data as Profile;
        console.log('👤 받아온 사용자 정보:', u); // 디버깅


        setNickname(u.nickname);
        setBio(u.bio);
        setAgeGroup(u.ageGroup as typeof ageGroup);
        setTrustScore(u.trustScore);
        setRemainingChanges(u.remainingNicknameChanges);
        setProfileImage(u.profileImage || '');
        setProfile(u);

        console.log('✅ 적용된 ageGroup:', ageGroup);
        console.log('✅ 적용된 profileImage:', profileImage);
              // ② 내가 만든 모임
      const { data: mine } = await axios.get<Post[]>(
        `${SERVER_URL}/posts?writer=${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCreatedPosts(mine);

      // ③ 내가 참가한 모임
      const { data: joined } = await axios.get<Post[]>(
        `${SERVER_URL}/users/${userId}/applications`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setJoinedPosts(joined);
      

      } catch (err) {
        console.error('프로필 불러오기 실패:', err);
        if (axios.isAxiosError(err)) {
          console.error('  • 응답 status:', err.response?.status);
          console.error('  • 응답 data:', err.response?.data);
          console.error('  • 요청 config:', err.config);
        }
        
        Alert.alert('❌ 프로필을 불러오는 데 실패했습니다');
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  // 2) 저장 버튼 핸들러
  const handleSave = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const res = await axios.patch(
        `${SERVER_URL}/users/${userId}`,
        { newNickname: nickname, bio, ageGroup },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const u = res.data.user as Profile;
      setNickname(u.nickname);
      setBio(u.bio);
      setAgeGroup(u.ageGroup as typeof ageGroup);
      setTrustScore(u.trustScore);
      setRemainingChanges(u.remainingNicknameChanges);
      setProfile(u);
      setEditing(false);
      Alert.alert('✅ 프로필이 업데이트되었습니다');
      navigation.goBack();
    } catch (err: any) {
      console.error('프로필 업데이트 실패:', err);
      Alert.alert(err.response?.data?.error || '❌ 업데이트에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  // 3) 로그아웃
  const handleLogout = async () => {
    await AsyncStorage.clear();
    clearProfile();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const handleDelete = (postId: string) => {
    axios
      .delete(`${SERVER_URL}/posts/${postId}`)
      .then(() => {
        setCreatedPosts(prev => prev.filter(p => p._id !== postId));
      })
      .catch(console.warn);
  };

  // 수정 버튼 눌렀을 때 처리 (예: 수정 화면으로 네비게이트)
  const handleEdit = (post: Post) => {
    navigation.navigate('EditPost', { post, userId:profile!.userId, nickname: profile!.nickname});
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <View style={{ alignItems: 'center', marginBottom: 16 }}>
        <TouchableOpacity onPress={() => {
          console.log('사진 누름');
          if (editing) {
            pickAndUploadImage();
          }
        }}>
          <Image
            source={profileImage ? { uri: profileImage } : require('../assets/user.png')}
            style={styles.avatar}
          />
        </TouchableOpacity>

      </View>
      {editing ? (
        <View style={styles.editBlock}>
          <Text>닉네임은 최대 3번만 변경가능합니다.</Text>
          <TextInput
            style={styles.input}
            value={nickname}
            onChangeText={setNickname}
            placeholder="닉네임"
          />

          <Text>한줄소개</Text>
          <TextInput
            style={styles.input}
            value={bio}
            onChangeText={setBio}
            placeholder="한줄 소개"
          />

          <Text>나이</Text>
          <Picker
            selectedValue={ageGroup}
            onValueChange={setAgeGroup}
            style={styles.picker}
          >
            {['중1', '중2', '중3', '고1', '고2', '고3', '대학생', '기타'].map(a => (
              <Picker.Item key={a} label={a} value={a} />
            ))}
          </Picker>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveText}>저장</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.infoBlock}>
          <Text style={styles.nickname}>{nickname}</Text>
          <Text style={styles.intro}>{bio}</Text>
          <Text style={styles.trust}>신뢰도: {trustScore}%</Text>
          <Text style={styles.intro}>나이: {ageGroup}</Text>
          <TouchableOpacity onPress={() => setEditing(true)}>
            <Text style={styles.editText}>✏️ 프로필, 프사 수정</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>로그아웃</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>내가 만든 모임</Text>
      <FlatList
        data={createdPosts}
        keyExtractor={item => item._id}
        renderItem={({ item }) => <PostCard
        post={item}
        currentUser={profile!.userId}
        onDelete={() => handleDelete(item._id)}
        onEdit={() => handleEdit(item)}
      />}
        ListEmptyComponent={<Text style={styles.emptyText}>생성한 모임이 없습니다.</Text>}
      />

      <Text style={styles.sectionTitle}>내가 참가한 모임</Text>
      <FlatList
        data={joinedPosts}
        keyExtractor={item => item._id}
        renderItem={({ item }) => <PostCard
        post={item}
        currentUser={profile!.userId}
        onDelete={() => handleDelete(item._id)}
        onEdit={() => handleEdit(item)}
      />}
        ListEmptyComponent={<Text style={styles.emptyText}>참가한 모임이 없습니다.</Text>}
      />





    </View>


  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 8 },
  emptyText: { textAlign: 'center', color: '#666', marginVertical: 16 }, avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 16 },
  infoBlock: { alignItems: 'center', marginBottom: 24 },
  nickname: { fontSize: 24, fontWeight: 'bold' },
  intro: { fontSize: 16, color: '#555', marginVertical: 8, textAlign: 'center' },
  trust: { fontSize: 14, color: '#888' },
  editText: { fontSize: 14, color: '#007AFF', marginTop: 8 },
  editBlock: { width: '100%', paddingHorizontal: 24 },
  input: { borderBottomWidth: 1, borderColor: '#ccc', fontSize: 18, marginBottom: 16, paddingVertical: 4 },
  picker: { width: '100%', marginBottom: 16 },
  saveBtn: { backgroundColor: '#007AFF', padding: 12, borderRadius: 8, alignItems: 'center' },
  saveText: { color: '#fff', fontSize: 16 },
  logoutBtn: { marginTop: 'auto', backgroundColor: '#333', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  logoutText: { color: '#fff', fontSize: 16 },
  changeText: { fontSize: 14, color: '#888', marginBottom: 16, marginTop: 4, }
});
