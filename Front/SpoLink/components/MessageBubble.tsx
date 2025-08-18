import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootStackParamList';
import { useProfile } from '../contexts/ProfileContext';
// 컴포넌트 최상단

export type Message = {
  _id: string;
  content: string;
  sender: {
    userId: string;
    nickname: string;
    profileImage?: string;   // ← 추가
  };
  createdAt?: string;
  readBy?: string[];
};

type MessageBubbleProps = {
  message: Message;
  currentUserId: string;
  unreadCount?: number;
  onDelete?:() => void;
};

export default function MessageBubble({ message, currentUserId, unreadCount = 0, onDelete,}: MessageBubbleProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { profile } = useProfile();   // ← 절대 컴포넌트 밖에 두지 마세요!

  const isOwn = message.sender.userId === currentUserId;
  return (
    <View style={[styles.container, isOwn ? styles.rightContainer : styles.leftContainer]}>

      {/* 수정: 소유자 메시지가 아닐 때는 항상 렌더링 */}
      {!isOwn && (
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile', { userId: message.sender.userId })}
          style={styles.avatarWrapper}
        >
          <Image
            source={

              // profileImage 유무 상관없이, 삼항으로 소스 분기
              message.sender.profileImage
                ? { uri: message.sender.profileImage }
                : require('../assets/user.png')
            }
            style={styles.avatar}
          />
        </TouchableOpacity>

      )}

      <View style={[styles.bubble, isOwn ? styles.rightBubble : styles.leftBubble]}>
        {/* 타인 메시지엔 닉네임도 함께 */}
        {!isOwn && <Text style={styles.nickname}>{message.sender.nickname}</Text>}
        <Text style={[styles.text, isOwn && styles.rightText]}>
          {message.content}
        </Text>
        {message.createdAt && (
          <Text style={styles.time}>
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
        {isOwn && unreadCount > 0 && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
    marginHorizontal: 8,
    alignItems: 'flex-end',
    maxWidth: '75%',
  },
  leftContainer: {
    alignSelf: 'flex-start',
  },
  rightContainer: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 6,
  },
  bubble: {
    borderRadius: 16,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  leftBubble: {
    backgroundColor: '#e5e5ea',
  },
  rightBubble: {
    backgroundColor: '#0b93f6',
  },
  nickname: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
    color: '#555',
  },
  text: {
    fontSize: 16,
    color: '#000',
  },
  rightText: {
    color: '#fff',
  },
  time: {
    fontSize: 10,
    color: '#555',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  avatarWrapper: {
    padding: 4,           // 터치 영역을 조금 키워줍니다 (선택)
    borderRadius: 20,     // 터치 피드백이 자연스럽도록
  },
  badgeContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
