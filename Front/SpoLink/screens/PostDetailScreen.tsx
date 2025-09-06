// screens/PostDetailScreen.tsx
import socket from '../utils/socket';
import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/RootStackParamList';
import CommentSection from '../components/CommentSection';

type PostDetailRouteProp = RouteProp<RootStackParamList, 'PostDetail'>;

export default function PostDetailScreen() {
  const route = useRoute<PostDetailRouteProp>();
  const { postId, title, content, writerNickname } = route.params;

  return (
    <FlatList
      data={[]} // 댓글은 CommentSection이 직접 관리
      keyExtractor={(_, idx) => `empty-${idx}`}
      renderItem={null} // 목록 데이터 없음 → null
      ListHeaderComponent={
        <View style={styles.container}>
          {/* 게시글 정보 */}
          <View style={styles.postBox}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.writer}>작성자: {writerNickname}</Text>
            <Text style={styles.content}>{content}</Text>
          </View>

          {/* 댓글 */}
          <CommentSection postId={postId} />
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  postBox: { padding: 16, borderBottomWidth: 1, borderColor: '#ddd' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 6 },
  writer: { fontSize: 14, color: '#666', marginBottom: 8 },
  content: { fontSize: 16, lineHeight: 22 },
});
