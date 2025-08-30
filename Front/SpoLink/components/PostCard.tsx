import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import type { Post } from '../navigation/RootStackParamList';
import { SERVER_URL } from '../constants';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootStackParamList';
import { useProfile } from '../contexts/ProfileContext'; // ✅ 추가
import { Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

type Props = {
  post: Post;
  currentUser: string; // userId
  onDelete?: () => void;
  onEdit?: () => void;

};

export default function PostCard({ post, currentUser, onDelete, onEdit }: Props) {
  const [showComments, setShowComments] = useState(false);
  const { profile } = useProfile();
  const nickname = profile?.nickname || '익명';
  const start = new Date(post.startTime);
  const end = new Date(post.endTime);

  // ✅ 날짜/시간 포맷
  const dateStr = start.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const timeStr = `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ~ ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const writerId =
    typeof post.writer === 'string'
      ? post.writer
      : post.writer?._id || '';

  const writerNickname =
    typeof post.writer === 'object' && post.writer?.nickname
      ? post.writer.nickname
      : '익명';
  console.log('📍 post.locationName =', post.locationName);

  // 현재 로그인한 유저 ageGroup
  const userAgeGroup = profile?.ageGroup || null;

  // 모집글의 허용 연령대
  const allowedAgeGroups = post.preferredAgeGroups || [];

  // 신청 가능 여부 계산
  const isAgeAllowed =
    allowedAgeGroups.includes('상관없음') ||
    (userAgeGroup && allowedAgeGroups.includes(userAgeGroup));

  const goToProfile = () => {
    if (writerId) {
      navigation.navigate('Profile', { userId: writerId });
    } else {
      Alert.alert('⚠️ 사용자 정보 없음', '작성자 정보를 찾을 수 없습니다.');
    }
  };

  console.log('🖼 작성자 profileImage:', post.writer?.profileImage);

  const isOwner = currentUser === writerId;

  const handleApply = async () => {
    console.log('🟢 참가신청 버튼 클릭됨', post._id, currentUser);
    console.log('✅ 신청에 들어갈 닉네임:', profile?.nickname || '익명'); // 🔍 여기!

    try {
      await axios.post(`${SERVER_URL}/applications`, {
        postId: post._id,
        userId: currentUser,
        nickname: profile?.nickname || '익명',
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
  console.log('🧪 참가자 수 확인:', post.participantCount, '/', post.maxParticipants);
  console.log('👤 현재 유저 ageGroup:', userAgeGroup);
  console.log('📦 모집글 허용 ageGroups:', allowedAgeGroups);
  
  return (
    <View style={styles.card}>
      <Text style={styles.category}>🏷️ {post.category}</Text>

      {/* 작성자 */}
      <View style={styles.writerRow}>
        <TouchableOpacity onPress={goToProfile} style={styles.writerProfile}>
          <Image
            source={
              typeof post.writer === 'object' && post.writer?.profileImage
                ? { uri: post.writer.profileImage }
                : require('../assets/user.png')
            }
            style={styles.profileImage}
          />
          <Text style={styles.writer}>{writerNickname}</Text>
        </TouchableOpacity>
      </View>

      {/* 제목 */}
      <Text style={styles.title}>{post.content}</Text>

      {/* 장소 */}
      <Text style={styles.datetime}>시간: {dateStr} {timeStr}</Text>

      {/* 장소 */}
      {post.locationName && (
        <Text style={styles.location}>장소: {post.locationName}</Text>
      )}

      {/* 선호 연령대 */}
      {post.preferredAgeGroups && post.preferredAgeGroups.length > 0 && (
        <View style={styles.ageGroupRow}>
          <Text style={styles.label}>선호 연령대:</Text>
          <View style={styles.ageButtons}>
            {post.preferredAgeGroups.map((age, idx) => (
              <View key={idx} style={styles.ageTag}>
                <Text style={styles.ageTagText}>{age}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 참여자 수 + 댓글 */}
      <Text style={styles.participants}>
        참여자 수: {post.participantCount ?? 0} / {post.maxParticipants ?? 0}
        <FontAwesome name="comment-o" size={14} color="#555" /> {post.commentCount || 0}
      </Text>

      {/* 참가 신청 버튼 */}
      {!isOwner && (
        <>
          {post.myApplicationStatus === 'pending' && (
            <Text style={{ marginTop: 8, color: '#666', fontWeight: 'bold' }}>
              이미 참가신청한 모집입니다
            </Text>
          )}
          {post.myApplicationStatus === 'accepted' && (
            <Text style={[styles.applyButton, { backgroundColor: '#ccc' }]}>
              참가신청이 수락되었습니다
            </Text>
          )}
          {post.myApplicationStatus === 'rejected' && (
            <Text style={[styles.applyButton, { backgroundColor: '#ccc' }]}>
              참가신청이 거절되었습니다
            </Text>
          )}

          {!post.myApplicationStatus && (
            <>
              {post.isFull ? (
                <Text style={[styles.applyButton, { backgroundColor: '#ccc' }]}>
                  모집마감
                </Text>
              ) : !isAgeAllowed ? (
                <Text style={[styles.applyButton, { backgroundColor: '#ccc' }]}>
                  이 모집글은 {allowedAgeGroups.join(', ')}만 참가 가능합니다
                </Text>
              ) : (
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={handleApply}
                >
                  <Text style={styles.buttonText}>참가 신청</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </>
      )}



      {/* 수정/삭제 버튼 */}
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

      {/* 신청자 관리 버튼 */}
      {isOwner && (
        <TouchableOpacity
          style={styles.manageButton}
          onPress={() => navigation.navigate('Applications', { postId: post._id })}
        >
          <Text style={styles.manageText}>신청자 관리</Text>
        </TouchableOpacity>
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
  datetime: { fontSize: 14, color: '#333', marginBottom: 6 },

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
  manageButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#E8F0FE',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
  },
  manageText: { color: '#007AFF', fontWeight: 'bold' },
  writerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },

  writerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#eee',
  },
  detailButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#E8F0FE',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
  },
  detailButtonText: { color: '#007AFF', fontWeight: 'bold' },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 6,
    color: '#000',
  },
  ageGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  ageButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: 6,
  },
  ageTag: {
    backgroundColor: '#E8F0FE',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 6,
    marginTop: 4,
  },
  ageTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#007AFF',
  },
  location: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
  },
  


});