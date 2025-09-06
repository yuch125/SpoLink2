import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import axios from 'axios';
import { SERVER_URL } from '../constants';
import type { RootStackParamList, Post } from '../navigation/RootStackParamList';
import { RouteProp, useRoute } from '@react-navigation/native';
import PostCard from '../components/PostCard';
import { useProfile } from '../contexts/ProfileContext';

type JoinedPostsRouteProp = RouteProp<RootStackParamList, 'JoinedPosts'>;

export default function JoinedPostsScreen() {
  const route = useRoute<JoinedPostsRouteProp>();
  const { userId } = route.params;
  const [posts, setPosts] = useState<Post[]>([]);
  const { profile } = useProfile();

  useEffect(() => {
    axios.get(`${SERVER_URL}/users/${userId}/applications`)
      .then(res => setPosts(res.data))
      .catch(console.error);
  }, [userId]);

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <PostCard post={item} currentUser={profile!.userId} />
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>참가한 모임이 없습니다.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  emptyText: { textAlign: 'center', color: '#666', marginTop: 20 },
});
