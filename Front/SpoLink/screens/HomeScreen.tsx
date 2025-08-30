// screens/HomeScreen.tsx
import {
  getCurrentPositionAsync,
  requestForegroundPermissionsAsync,
  LocationObject,
} from 'expo-location';
import socket from '../utils/socket';
import React, { useEffect, useState, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  Platform
} from 'react-native';
import axios from 'axios';
import {
  useNavigation,
  useRoute,
  RouteProp,
} from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import type {
  RootStackParamList,
  Post,
} from '../navigation/RootStackParamList';
import PostCard from '../components/PostCard';
import { FlatList } from 'react-native';
import { SERVER_URL } from '../constants';
import { useProfile } from '../contexts/ProfileContext';
import { haversineDistance } from '../utils/distance';
const categoryIcons: Record<string, any> = {
  농구: require('../assets/basketball.png'),
  축구: require('../assets/soccer-ball-variant.png'),
  배드민턴: require('../assets/shuttlecock.png'),
  런닝: require('../assets/shoe.png'),
};

type HomeNavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;


export default function HomeScreen() {
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  const { profile } = useProfile(); // ✅ 현재 로그인된 사용자 정보
  if (!profile) {
    return null; // 혹은 <ActivityIndicator />
  }
  const { userId, nickname } = profile; // 👈 여기서 가져오면 됨


  const navigation = useNavigation<HomeNavProp>();

  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [selectedAges, setSelectedAges] = useState<string[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
 
  const sportOptions = ['농구', '축구', '배드민턴', '런닝'];
  const ageOptions = ['전체', '중학생', '고등학생', '20대', '30대', '40대', '50대'];

  const fetchPosts = async () => {
    try {
      const res = await axios.get<Post[]>(`${SERVER_URL}/posts`, {
        params: { userId }   // ← 현재 로그인한 userId 보내주기
      });  
      const withDist = res.data
        .filter(post => post.location && post.location.coordinates)
        .map(post => ({
          ...post,
          distance: userCoords
            ? haversineDistance(
              userCoords.lat,
              userCoords.lng,
              post.location.coordinates[1],
              post.location.coordinates[0]
            )  
            : 0,
        }))    
        .sort((a, b) => a.distance - b.distance);
      setPosts(withDist);  
    } catch (err) {
      console.error('❌ 게시물 불러오기 실패:', err);
      Alert.alert('오류', '게시물 불러오기에 실패했습니다.');
    }  
  };  
  
   // ✅ 스포츠 토글
   const toggleSport = (sport: string) => {
    setSelectedSports(prev =>
      prev.includes(sport) ? prev.filter(s => s !== sport) : [...prev, sport]
    );
  };

  // ✅ 연령대 토글 ('전체'는 리셋)
  const toggleAge = (age: string) => {
    if (age === '전체') {
      setSelectedAges([]);
      return;
    }
    setSelectedAges(prev =>
      prev.includes(age) ? prev.filter(a => a !== age) : [...prev, age]
    );
  };


  const filteredPosts = useMemo(() => {
    const hasIntersection = (a?: string[], b?: string[]) =>
      !!a && !!b && a.some(x => b.includes(x));
  
    return posts.filter(post => {
      const tags = (post as any).categories as string[] | undefined; // 새 구조(태그 배열)
      const legacySport = (post as any).category as string | undefined; // 구 구조(단일)
      const legacyAges = (post as any).preferredAgeGroups as string[] | undefined; // 구 구조(배열)
  
      // 스포츠 매칭
      const tagSportHit = tags ? tags.some(t => selectedSports.includes(t)) : undefined;
      const legacySportHit = legacySport ? selectedSports.includes(legacySport) : undefined;
      const sportMatch =
        selectedSports.length === 0 ||
        (tagSportHit ?? legacySportHit ?? true);
  
      // 연령대 매칭
      const tagAgeHit = tags ? tags.some(t => selectedAges.includes(t)) : undefined;
      const legacyAgeHit = legacyAges ? hasIntersection(legacyAges, selectedAges) : undefined;
      const ageMatch =
        selectedAges.length === 0 ||
        (tagAgeHit ?? legacyAgeHit ?? false);
  
      return sportMatch && ageMatch;
    });
  }, [posts, selectedSports, selectedAges]);
  

  console.log('📦 userId:', userId, 'nickname:', nickname);

  useEffect(() => {
    (async () => {
      const { status } = await requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('위치 권한 필요', '위치 권한이 거부되었습니다.');
        return;
      }

      const loc = await getCurrentPositionAsync({});
      setUserCoords({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      });
    })();
  }, []);

  useEffect(() => {
    if (userId) {
      socket.emit('register', { userId });
    }
  }, [userId]);
  
  useEffect(() => {
    const handler = (payload: { postId: string; status: string; title: string }) => {
      console.log("📩 application:update 수신:", payload);
      if (payload.status === 'accepted') {
        Alert.alert('알림', `📢 '${payload.title}' 모임 참가요청이 수락되었습니다!`);
      } else if (payload.status === 'rejected') {
        Alert.alert('알림', `📢 '${payload.title}' 모임 참가요청이 거절되었습니다.`);
      }
    };
  
    socket.on('application:update', handler);
    return () => {
      socket.off('application:update', handler);
    };
  }, []);
  
  


  useEffect(() => {
    fetchPosts();
  }, []);

  useFocusEffect(
    useCallback(() => {
      console.log('🏠 HomeScreen 포커스 → 모집글 새로고침');
      fetchPosts();
    }, [userCoords])
  );





  useEffect(() => {
    console.log(userId, nickname)
    if (!userId || !nickname) {
      console.warn(
        '⚠️ HomeScreen: userId param missing → redirect to Login'
      );
      navigation.replace('Login');
    }
  }, [userId, nickname]);

  if (!userId) {
    return null;
  }

  useFocusEffect(
    useCallback(() => {
      if (!userCoords) return;  // 위치 없으면 대기

      (async () => {
        try {
          const res = await axios.get<Post[]>(`${SERVER_URL}/posts`);
          const withDist = res.data
            .filter(post => post.location && post.location.coordinates)
            .map(post => ({
              ...post,
              distance: haversineDistance(
                userCoords.lat,
                userCoords.lng,
                post.location.coordinates[1],
                post.location.coordinates[0]
              ),
            }))
            .sort((a, b) => a.distance - b.distance);


          setPosts(withDist);
        } catch (err) {
          console.error('❌ 카드 불러오기 실패:', err);
          Alert.alert('오류', '카드 목록을 불러오는데 실패했습니다.');
        }
      })();
    }, [userCoords])
  );

  useEffect(() => {
    const handler = (p: { postId: string; participantCount: number; maxParticipants: number; isFull: boolean }) => {
      setPosts(prev =>
        prev.map(post =>
          post._id === p.postId
            ? { ...post, participantCount: p.participantCount, maxParticipants: p.maxParticipants, isFull: p.isFull }
            : post
        )
      );
    };

    // 1) 구독은 여기서 수행
    socket.on('post:participantsUpdated', handler);

    // 2) 정리 함수는 반드시 'void'를 반환해야 함
    return () => {
      socket.off('post:participantsUpdated', handler);
    };
  }, []);





  const handleDelete = async (postId: string) => {
    try {
      await axios.delete(`${SERVER_URL}/posts/${postId}`);
      setPosts(prev => prev.filter(p => p._id !== postId));
    } catch (err) {
      Alert.alert('삭제 실패', '오류가 발생했습니다.');
    }
  };

  const handleEdit = (post: Post) => {
    navigation.navigate('EditPost', { post, userId, nickname, });
  };

    // ✅ 필터 초기화
    const clearFilters = () => {
      setSelectedSports([]);
      setSelectedAges([]);
    };


    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>SpoLink</Text>
            <Text style={styles.subtitle}>WHY NOT?</Text>
          </View>
          <TouchableOpacity
            style={styles.plusButton}
            onPress={() => navigation.navigate('CreatePost', { userId, nickname })}
          >
            <Text style={styles.plusText}>＋</Text>
          </TouchableOpacity>
        </View>
  
        <View style={styles.categoryContainer}>
          {/* 1️⃣ 스포츠 아이콘 줄 */}
          <View style={styles.sportRow}>
            {sportOptions.map(sport => {
              const active = selectedSports.includes(sport);
              return (
                <TouchableOpacity
                  key={sport}
                  style={[
                    styles.categoryItem,
                    active && { backgroundColor: '#D0EBFF', borderRadius: 10, paddingHorizontal: 6 },
                  ]}
                  onPress={() => toggleSport(sport)}
                >
                  <Image source={categoryIcons[sport]} style={styles.icon} />
                  <Text style={styles.categoryLabel}>{sport}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
  
          {/* 2️⃣ 연령대 줄 (가로 슬라이드 가능) */}
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={ageOptions}
            keyExtractor={(item) => item}
            contentContainerStyle={{ paddingVertical: 8, paddingHorizontal: 6 }}
            renderItem={({ item }) => {
              const isAll = item === '전체';
              const active = isAll ? selectedAges.length === 0 : selectedAges.includes(item);
              return (
                <TouchableOpacity
                  style={[
                    styles.ageItem,
                    active && { backgroundColor: '#D0EBFF', borderColor: '#8cc4ff' },
                  ]}
                  onPress={() => toggleAge(item)}
                >
                  <Text style={styles.ageLabel}>{item}</Text>
                </TouchableOpacity>
              );
            }}
          />
  
          {/* ✅ 선택된 필터 표시 + 초기화 */}
          {(selectedSports.length > 0 || selectedAges.length > 0) && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, gap: 6 }}>

              <TouchableOpacity onPress={clearFilters} style={[styles.chip, { backgroundColor: '#ffe8e8' }]}>
                <Text style={[styles.chipText, { color: '#c62828' }]}>초기화</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
  
        <FlatList
          data={filteredPosts}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('PostDetail', {
                  postId: item._id,
                  title: item.content,
                  content: item.detail,
                  writerId: (item as any).writer?.userId || '',
                  writerNickname: (item as any).writer?.nickname,
                  userId,
                  nickname,
                })
              }
            >
              <PostCard
                post={item}
                currentUser={userId}
                onDelete={() => handleDelete(item._id)}
                onEdit={() => handleEdit(item)}
              />
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}
          showsVerticalScrollIndicator={false}
        />
  
        <View style={styles.navbar}>
          <TouchableOpacity onPress={() => navigation.navigate('Home', { userId, nickname })}>
            <Image source={require('../assets/home.png')} style={styles.navIcon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('MyProfile', { userId })}>
            <Image source={require('../assets/user (2).png')} style={styles.navIcon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('ChatList', { userId, nickname })}>
            <Image source={require('../assets/messenger.png')} style={styles.navIcon} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f2f2f2',
      paddingHorizontal: 20,
      paddingTop: 50,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    logo: { width: 60, height: 60, marginRight: 10 },
    title: { fontSize: 18, fontWeight: 'bold' },
    subtitle: { fontSize: 14 },
    plusButton: {
      width: 30,
      height: 30,
      backgroundColor: '#fff',
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    plusText: { fontSize: 20, fontWeight: 'bold' },
    categoryContainer: {
      flexDirection: 'column',
      backgroundColor: '#fff',
      borderRadius: 12,
      paddingVertical: 10,
      marginBottom: 30,
    },
    categoryItem: { alignItems: 'center', paddingVertical: 6 },
    icon: { width: 40, height: 40 },
    categoryLabel: { marginTop: 6, fontSize: 12 },
    list: { flex: 1 },
    navbar: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingVertical: 14,
      paddingBottom: Platform.OS === 'android' ? 20 : 14,
      borderTopWidth: 1,
      borderColor: '#ddd',
      backgroundColor: '#fff',
      height: 80,
    },
    navIcon: { width: 30, height: 30 },
    sportRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 10,
    },
    ageRow: {
      flexDirection: 'row',
      marginTop: 4,
      paddingHorizontal: 10,
    },
    ageItem: {
      paddingVertical: 6,
      paddingHorizontal: 14,
      marginRight: 8,
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 10,
    },
    ageLabel: { fontSize: 14, color: '#333' },
    chip: {
      backgroundColor: '#eef6ff',
      paddingVertical: 4,
      paddingHorizontal: 10,
    },
    chipText: { fontSize: 12, color: '#0b4ea2' },
  });