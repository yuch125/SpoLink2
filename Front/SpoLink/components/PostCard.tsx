// components/PostCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type {Post} from '../navigation/RootStackParamList'


type Props = {
  post: Post;
  currentUser: string;
  onDelete: () => void;
  onEdit: () => void;
};
export default function PostCard({ post, currentUser, onDelete, onEdit }: Props) {
  const isOwner = currentUser === post.writer as any;

  return (
    <View style={styles.card}>
      <Text style={styles.category}>🏷️ {post.category}</Text>
      <Text style={styles.writer}>{post.writer as any}</Text>

      <Text style={styles.content}>{post.content}</Text>

      <Text style={styles.label}>장소: {post.location}</Text>
      <Text style={styles.label}>시간: {post.time}</Text>
      <Text style={styles.label}>설명: {post.detail}</Text>

      <Text style={styles.participants}>
        참여자 수: {post.participants} / {post.maxParticipants}
      </Text>

      {/* 참가 신청 버튼 */}
      <TouchableOpacity style={styles.joinButton}>
        <Text style={styles.joinText}>참가 신청</Text>
      </TouchableOpacity>

      {isOwner && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={onEdit} style={styles.editButton}>
            <Text style={{ color: 'blue' }}>수정</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
            <Text style={{ color: 'red' }}>삭제</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    overflow: 'hidden', // ✅ 내부 요소 잘림 방지
  },
  
  writer: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 6,
  },
  content: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    color: '#444',
  },
  participants: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  joinButton: {
    marginTop: 10,
    backgroundColor: '#444',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinText: {
    color: '#fff',
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  editButton: { marginRight: 10 },
  deleteButton: {},
  category: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
});