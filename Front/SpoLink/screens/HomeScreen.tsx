// screens/HomeScreen.tsx

import React, { useEffect, useState } from 'react';
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

const categoryIcons: Record<string, any> = {
  농구: require('../assets/basketball.png'),
  축구: require('../assets/soccer-ball-variant.png'),
  야구: require('../assets/baseball-ball.png'),
  배구: require('../assets/volleyball-ball.png'),
};

type HomeNavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;


export default function HomeScreen() {

  const { profile } = useProfile();
  const { userId, nickname } = profile; // 👈 여기서 가져오면 됨
  const navigation = useNavigation<HomeNavProp>();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const filteredPosts = selectedCategory
    ? posts.filter(post => post.category === selectedCategory)
    : posts;
  console.log('📦 userId:', userId, 'nickname:', nickname);
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
      axios
        .get(`${SERVER_URL}/posts`)
        .then(res => setPosts(res.data))
        .catch(err => {
          console.error('❌ 카드 불러오기 실패:', err);
          Alert.alert('오류', '카드 목록을 불러오는데 실패했습니다.');
        });
    }, [])
  );

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('../assets/Logo.png')}
          style={styles.logo}
        />
        <View>
          <Text style={styles.title}>SpoLink</Text>
          <Text style={styles.subtitle}>WHY NOT?</Text>
        </View>
        <TouchableOpacity
          style={styles.plusButton}
          onPress={() =>
            navigation.navigate('CreatePost', { userId, nickname, })
          }
        >
          <Text style={styles.plusText}>＋</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.categoryContainer}>
        {['농구', '축구', '야구', '배구'].map(sport => (
          <TouchableOpacity
            key={sport}
            style={[
              styles.categoryItem,
              selectedCategory === sport && { backgroundColor: '#D0EBFF', borderRadius: 10 },
            ]}
            onPress={() =>
              setSelectedCategory(selectedCategory === sport ? null : sport)
            }
          >
            <Image source={categoryIcons[sport]} style={styles.icon} />
            <Text style={styles.categoryLabel}>{sport}</Text>
          </TouchableOpacity>
        ))}
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
                writerId: item.writer.userId || '',
                writerNickname: item.writer.nickname,
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
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('PlaceSearch', { userId, nickname })
          }
        >
          <Image
            source={require('../assets/placeholder.png')}
            style={styles.navIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('Home', { userId, nickname })
          }
        >
          <Image
            source={require('../assets/home.png')}
            style={styles.navIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('MyProfile', { userId })}
        >
          <Image
            source={require('../assets/user.png')}
            style={styles.navIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('ChatList', { userId, nickname })}
        >
          <Image
            source={require('../assets/messenger.png')}
            style={styles.navIcon}
          />
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
  logo: {
    width: 60,
    height: 60,
    marginRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
  },
  plusButton: {
    width: 30,
    height: 30,
    backgroundColor: '#fff',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: 30,
  },
  categoryItem: {
    alignItems: 'center',
  },
  icon: {
    width: 40,
    height: 40,
  },
  categoryLabel: {
    marginTop: 6,
    fontSize: 12,
  },
  list: {
    flex: 1,
  },
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
  navIcon: {
    width: 30,
    height: 30,
  },
});
