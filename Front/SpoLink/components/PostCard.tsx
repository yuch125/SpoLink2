import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import type { Post } from '../navigation/RootStackParamList';
import { SERVER_URL } from '../constants';
import axios from 'axios';
import CommentSection from './CommentSection'; // ← 경로는 맞는지 꼭 확인!

type Props = {
  post: Post;
  currentUser: string; // userId
  onDelete: () => void;
  onEdit: () => void;
};

export default function PostCard({ post, currentUser, onDelete, onEdit }: Props) {
  const [showComments, setShowComments] = useState(false);

  const writerId =
    typeof post.writer === 'string'
      ? post.writer
      : post.writer?.userId || '';

  const writerNickname =
    typeof post.writer === 'object' && post.writer?.nickname
      ? post.writer.nickname
      : '익명';

  const isOwner = currentUser === writerId;

  const handleApply = async () => {
    console.log('🟢 참가신청 버튼 클릭됨', post._id, currentUser);
    try {
      await axios.post(`${SERVER_URL}/posts/apply`, {
        postId: post._id,
        userId: currentUser,
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
      <Text style={styles.writer}>작성자: {writerNickname}</Text>
      <Text style={styles.content}>{post.content}</Text>
      <Text style={styles.label}>장소: {post.location}</Text>
      <Text style={styles.label}>시간: {post.time}</Text>
      <Text style={styles.label}>설명: {post.detail}</Text>
      <Text style={styles.participants}>
        참여자 수: {post.participants} / {post.maxParticipants}
      </Text>

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

      {/* 댓글 접기/펼치기 버튼 */}
      <TouchableOpacity onPress={() => setShowComments(prev => !prev)} style={{ marginTop: 10 }}>
        <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>
          {showComments ? '댓글 접기 ▲' : '댓글 보기 ▼'}
        </Text>
      </TouchableOpacity>

      {/* 댓글 섹션 */}
      {showComments && (
        <CommentSection
          postId={post._id}
          userId={currentUser}
          nickname={writerNickname}
        />
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
    overflow: 'hidden',
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
