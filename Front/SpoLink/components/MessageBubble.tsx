import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export type Message = {
  _id: string;
  content: string;
  sender: {
    userId: string;
    nickname: string;
  };
  createdAt?: string;
};

type MessageBubbleProps = {
  message: Message;
  currentUserId: string;
};

export default function MessageBubble({ message, currentUserId }: MessageBubbleProps) {
  const isOwn = message.sender.userId === currentUserId;
  return (
    <View style={[styles.container, isOwn ? styles.rightContainer : styles.leftContainer]}>      
      {!isOwn && <Text style={styles.sender}>{message.sender.nickname}</Text>}
      <View style={[styles.bubble, isOwn ? styles.rightBubble : styles.leftBubble]}>      
        <Text style={[styles.text, isOwn && styles.rightText]}>{message.content}</Text>
        {message.createdAt && (
          <Text style={styles.time}>
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 8,
    maxWidth: '75%',
  },
  leftContainer: {
    alignSelf: 'flex-start',
  },
  rightContainer: {
    alignSelf: 'flex-end',
  },
  sender: {
    fontSize: 12,
    color: '#555',
    marginBottom: 2,
  },
  bubble: {
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  leftBubble: {
    backgroundColor: '#e5e5ea',
  },
  rightBubble: {
    backgroundColor: '#0b93f6',
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
    alignSelf: 'flex-end',
    marginTop: 4,
  },
});
