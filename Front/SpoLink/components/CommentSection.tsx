import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import axios from 'axios';
import { SERVER_URL } from '../constants';
import { useProfile } from '../contexts/ProfileContext'; // ✅ 추가

interface Comment {
  _id: string;
  content: string;
  createdAt: string;
  nickname: string;
}

interface Props {
  postId: string;
}

export default function CommentSection({ postId }: Props) {
  const { profile } = useProfile(); // ✅ 현재 로그인된 사용자 정보
  console.log('🧪 profile:', profile);
  const { userId, nickname } = profile;

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [expanded, setExpanded] = useState(false);
  
  const fetchComments = async () => {
    try {
      const res = await axios.get(`${SERVER_URL}/comments/${postId}`);
      setComments(res.data.comments);
    } catch (err) {
      console.error('❌ 댓글 불러오기 실패:', err);
    }
  };

  useEffect(() => {
    if (expanded) fetchComments();
  }, [expanded]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
     // ⬇️ 이 줄 추가해!
     if (!nickname || !userId) {
      console.log('❌ 닉네임 또는 유저ID 없음:', { nickname, userId });
      alert('닉네임 정보가 없습니다. 다시 로그인해주세요.');
      return;
    }

  console.log('📨 댓글 전송 시도:', {
    postId,
    userId,
    nickname: nickname,
    content: newComment,
  });
    try {
      const res = await axios.post(`${SERVER_URL}/comments`, {
        postId,
        userId,
        nickname: nickname,
        content: newComment,
      });
      setComments([res.data.comment, ...comments]);
      setNewComment('');
    } catch (err) {
      console.error('❌ 댓글 작성 실패:', err);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)}>
        <Text style={styles.toggleText}>
          {expanded ? '댓글 접기 ▲' : '댓글 펼치기 ▼'}
        </Text>
      </TouchableOpacity>

      {expanded && (
        <>
          <View style={styles.inputRow}>
            <TextInput
              placeholder="댓글을 입력하세요"
              style={styles.input}
              value={newComment}
              onChangeText={setNewComment}
            />
            <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
              <Text style={styles.submitText}>작성</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={comments}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View style={styles.commentBox}>
                <Text style={styles.nickname}>{item.nickname}</Text>
                <Text>{item.content}</Text>
                <Text style={styles.time}>{new Date(item.createdAt).toLocaleString()}</Text>
              </View>
            )}
            scrollEnabled={false}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, borderTopWidth: 1, borderColor: '#ddd' },
  toggleText: { fontSize: 14, color: '#007AFF', marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 6,
    fontSize: 14,
    marginRight: 8,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  submitText: { color: '#fff', fontWeight: 'bold' },
  commentBox: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  nickname: { fontWeight: 'bold', marginBottom: 2 },
  time: { fontSize: 12, color: '#999' },
});
