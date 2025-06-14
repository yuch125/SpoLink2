// components/PostCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { Post } from '../navigation/RootStackParamList'
import { SERVER_URL } from '../constants';
import axios from 'axios';
import { Alert } from 'react-native';


type Props = {
  post: Post;
  currentUser: string;
  onDelete: () => void;
  onEdit: () => void;
};


export default function PostCard({ post, currentUser, onDelete, onEdit }: Props) {
  const writerName = typeof post.writer === 'string' ? post.writer : post.writer.username;
  const isOwner = currentUser === writerName;
  const handleApply = async () => {
    console.log('🟢 참가신청 버튼 클릭됨', post._id, currentUser); // ← 요거!
    try {
      await axios.post(`${SERVER_URL}/posts/apply`, {
        postId: post._id,
        username: currentUser,
      });
      Alert.alert('✅ 참가 신청 완료', '주최자가 수락할 때까지 기다려주세요.');
    } catch (err: any) {
      console.error('❌ 신청 실패:', err.response?.data || err.message);
      if (err.response?.data?.error === '이미 신청했습니다') {
        Alert.alert('⚠️ 중복 신청', '이미 신청한 모집입니다.');
      } else {
        Alert.alert('❌ 오류', '참가 신청 중 문제가 발생했습니다.');
      }
    }
  };

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
      {!isOwner && (
        <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
          <Text style={styles.buttonText}>참가 신청</Text>
        </TouchableOpacity>
      )}

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
  applyButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },

});