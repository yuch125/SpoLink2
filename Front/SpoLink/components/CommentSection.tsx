import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Alert
} from 'react-native';
import { COMMENTS_URL } from '../constants';
import axios from 'axios';
import { useProfile } from '../contexts/ProfileContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootStackParamList';

interface Comment {
  _id: string;
  content: string;
  createdAt: string;
  userId: string;
  updatedAt: string;
  author: {
    _id: string;
    nickname: string;
    profileImage?: string;
  };
  replies?: Comment[];
}

interface Props {
  postId: string;
}

// 상대 시간 계산 헬퍼
function timeAgo(dateString: string): string {
  const now = new Date();
  const past = new Date(dateString);
  const diff = now.getTime() - past.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

export default function CommentSection({ postId }: Props) {
  useFocusEffect(
    useCallback(() => {
      fetchComments();
    }, [postId])
  );

  const { profile } = useProfile();
  if (!profile) return null;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { userId, nickname, profileImage } = profile;
  const [comments, setComments] = useState<Comment[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');

  const fetchComments = async () => {
    try {
      const res = await axios.get<{ comments: Comment[] }>(`${COMMENTS_URL}/${postId}`);
      setComments(res.data.comments);
    } catch (err) {
      console.error('❌ 댓글 불러오기 실패:', err);
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    try {
      await axios.post(COMMENTS_URL, { postId, author: userId, userId, nickname, profileImage, content: newComment });
      setNewComment('');
      fetchComments();
    } catch (err) {
      console.error('❌ 댓글 작성 실패:', err);
    }
  };

  const handleReplySubmit = async (parentId: string) => {
    if (!replyContent.trim()) return;
    try {
      await axios.post(COMMENTS_URL, { postId, author: userId, userId, nickname, profileImage, content: replyContent, parentComment: parentId });
      setReplyContent('');
      setReplyToId(null);
      fetchComments();
    } catch (err) {
      console.error('❌ 대댓글 작성 실패:', err);
    }
  };

  const handleUpdate = async (commentId: string) => {
    if (!editedContent.trim()) return;
    try {
      await axios.patch(`${COMMENTS_URL}/${commentId}`, { content: editedContent });
      setEditingId(null);
      setEditedContent('');
      fetchComments();
    } catch (err) {
      console.error('❌ 댓글 수정 실패:', err);
    }
  };

  const handleDelete = async (commentId: string) => {
    Alert.alert('댓글 삭제', '정말 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: async () => {
          try { await axios.delete(`${COMMENTS_URL}/${commentId}`); setComments(prev => prev.filter(c => c._id !== commentId)); }
          catch (err) { console.error('❌ 댓글 삭제 실패:', err); }
      }}
    ]);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setExpanded(prev => !prev)}>
        <Text style={styles.toggleText}>{expanded ? '댓글 접기 ▲' : '댓글 펼치기 ▼'}</Text>
      </TouchableOpacity>

      {expanded && (
        <>
          <View style={styles.inputRow}>
            <TextInput placeholder="댓글을 입력하세요" style={styles.input} value={newComment} onChangeText={setNewComment} />
            <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}><Text style={styles.submitText}>작성</Text></TouchableOpacity>
          </View>

          <FlatList
            data={comments}
            keyExtractor={item => item._id}
            renderItem={({ item }) => (
              <View style={styles.commentBox}>
                <TouchableOpacity style={styles.profileRow} onPress={() => navigation.navigate('Profile', { userId: item.userId })}>
                  <Image source={item.author.profileImage ? { uri: `${item.author.profileImage}?t=${Date.now()}` } : require('../assets/user.png')} style={styles.avatar} />
                  <Text style={styles.nickname}>{item.author.nickname}</Text>
                </TouchableOpacity>

                {editingId === item._id ? (
                  <> 
                    <TextInput style={[styles.input, { marginTop: 8 }]} value={editedContent} onChangeText={setEditedContent} />
                    <View style={styles.editFooter}>
                      <TouchableOpacity onPress={() => handleUpdate(item._id)} style={styles.submitButton}><Text style={styles.submitText}>완료</Text></TouchableOpacity>
                      <TouchableOpacity onPress={() => { setEditingId(null); setEditedContent(''); }} style={[styles.submitButton, styles.cancelButton]}><Text style={styles.submitText}>취소</Text></TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>  
                    <Text style={styles.contentText}>{item.content}{new Date(item.updatedAt) > new Date(item.createdAt) && <Text style={styles.editedLabel}> (수정됨)</Text>}</Text>
                    <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
                    <View style={styles.commentFooter}>
                      {item.userId === userId && (
                        <>  
                          <TouchableOpacity onPress={() => { setEditingId(item._id); setEditedContent(item.content); }}><Text style={styles.actionButton}>수정</Text></TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDelete(item._id)}><Text style={styles.actionButton}>삭제</Text></TouchableOpacity>
                        </>
                      )}
                      <TouchableOpacity onPress={() => setReplyToId(item._id)}><Text style={styles.replyButton}>답글 달기</Text></TouchableOpacity>
                    </View>
                  </>
                )}

                {replyToId === item._id && (
                  <View style={styles.replyForm}>
                    <TextInput style={styles.input} value={replyContent} onChangeText={setReplyContent} placeholder="답글을 입력하세요" />
                    <TouchableOpacity onPress={() => handleReplySubmit(item._id)} style={styles.submitButton}><Text style={styles.submitText}>등록</Text></TouchableOpacity>
                  </View>
                )}

                {item.replies?.map(reply => (
                  <View key={reply._id} style={styles.replyContainer}>
                    <View style={styles.replyHeader}>
                      <Image source={reply.author.profileImage ? { uri: `${reply.author.profileImage}?t=${Date.now()}` } : require('../assets/user.png')} style={styles.replyAvatar} />
                      <Text style={styles.replyNickname}>{reply.author.nickname}</Text>
                      <Text style={styles.replyTime}>{timeAgo(reply.createdAt)}</Text>
                    </View>
                    <Text style={styles.replyContent}>{reply.content}</Text>
                  </View>
                ))}
              </View>
            )}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, borderTopWidth: 1, borderColor: '#ddd', backgroundColor: '#fafafa' },
  toggleText: { fontSize: 14, color: '#007AFF', marginBottom: 8, fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, fontSize: 14, backgroundColor: '#fff' },
  submitButton: { backgroundColor: '#007AFF', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, marginLeft: 8 },
  submitText: { color: '#fff', fontWeight: '600' },
  cancelButton: { backgroundColor: '#888' },
  commentBox: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: { width: 28, height: 28, borderRadius: 14, marginRight: 8, backgroundColor: '#eee' },
  nickname: { fontWeight: 'bold', fontSize: 14 },
  contentText: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  editedLabel: { fontSize: 12, color: '#999' },
  time: { fontSize: 12, color: '#888', marginBottom: 8 },
  commentFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  editFooter: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  actionButton: { color: '#6c757d', fontSize: 13, marginLeft: 8, fontWeight: '600' },
  replyButton: { color: '#007AFF', fontSize: 13, fontWeight: '600', marginLeft: 8 },
  replyForm: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginLeft: 32 },
  replyContainer: { marginLeft: 32, marginTop: 12, padding: 10, backgroundColor: '#f5f5f5', borderLeftWidth: 4, borderLeftColor: '#007AFF', borderRadius: 6 },
  replyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  replyAvatar: { width: 24, height: 24, borderRadius: 12, marginRight: 6, backgroundColor: '#eee' },
  replyNickname: { fontWeight: '600', fontSize: 13, marginRight: 6 },
  replyTime: { fontSize: 11, color: '#888' },
  replyContent: { fontSize: 14, lineHeight: 20 }
});
