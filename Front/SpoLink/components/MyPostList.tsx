import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, FlatList, Alert } from 'react-native';
import axios from 'axios';
import { Post } from '../navigation/RootStackParamList';
import { SERVER_URL } from '../constants';
import PostCard from './PostCard';

type Props = {
  username: string;
};

export default function MyPostList({ username }: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${SERVER_URL}/posts`);
      const myPosts = res.data.filter((p: Post) => p.writer.username === username);
      setPosts(myPosts);
    } catch (err) {
      console.error('❌ 내 모집글 불러오기 실패:', err);
      Alert.alert('오류', '내 모집글을 불러오는 중 문제가 발생했어요.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (postId: string) => {
    try {
      await axios.delete(`${SERVER_URL}/posts/${postId}`);
      setPosts(prev => prev.filter(p => p._id !== postId));
    } catch (err) {
      Alert.alert('삭제 실패', '문제가 발생했습니다.');
    }
  };

  const handleEdit = (post: Post) => {
    // 이 함수는 필요에 따라 navigation 넘기거나 props에서 받아와야 함
    Alert.alert('수정 기능은 아직 연결 안됨');
  };

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 32 }} />;

  if (posts.length === 0)
    return <Text style={{ textAlign: 'center', marginTop: 20 }}>작성한 모집이 없습니다.</Text>;

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <PostCard
          post={item}
          currentUser={username}
          onDelete={() => handleDelete(item._id)}
          onEdit={() => handleEdit(item)}
        />
      )}
      contentContainerStyle={{ paddingBottom: 40 }}
    />
  );
}
