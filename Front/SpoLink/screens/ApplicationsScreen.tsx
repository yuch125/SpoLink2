// screens/ApplicationsScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import axios from 'axios';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/RootStackParamList';
import { SERVER_URL } from '../constants';

type ApplicationsRouteProp = RouteProp<RootStackParamList, 'Applications'>;

type Application = {
  _id: string;
  content: string;
  writer: { _id: string; nickname?: string };
  applicants: { userId: string; accepted: boolean }[];
};

export default function ApplicationsScreen() {
  const route = useRoute<ApplicationsRouteProp>();
  const { userId } = route.params;

  const [posts, setPosts] = useState<Application[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${SERVER_URL}/posts`);
        const myPosts = res.data.filter((p: any) => {
          const writerId = typeof p.writer === 'string' ? p.writer : p.writer?._id;
          return writerId === userId;
        });
        setPosts(myPosts);
        console.log('✅ 받아온 posts:', myPosts);
      } catch (err) {
        console.error(err);
        Alert.alert('불러오기 실패', '서버 오류');
      }
    };
    fetchData();
  }, [userId]);

  const respondTo = async (postId: string, targetId: string, accepted: boolean) => {
    try {
      await axios.post(`${SERVER_URL}/posts/apply/respond`, {
        postId,
        userId: targetId,
        accepted,
      });

      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? {
                ...p,
                applicants: accepted
                  ? p.applicants.map((a) =>
                      a.userId === targetId ? { ...a, accepted: true } : a
                    )
                  : p.applicants.filter((a) => a.userId !== targetId),
              }
            : p
        )
      );

      Alert.alert(`${accepted ? '수락' : '거절'} 완료`);
    } catch (err) {
      console.error(err);
      Alert.alert('처리 실패');
    }
  };

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.title}>{item.content}</Text>
          {item.applicants?.length > 0 ? (
            item.applicants.map((app, i) => (
              <View key={i} style={styles.applicantBox}>
                <Text style={styles.name}>{app.userId}</Text>
                <Text style={styles.status}>
                  {app.accepted ? '✅ 수락됨' : '🕓 대기중'}
                </Text>
                {app.accepted ? (
                  <TouchableOpacity
                    onPress={() =>
                      respondTo(item._id, app.userId, false)
                    }
                  >
                    <Text style={{ color: 'orange' }}>수락 취소</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.buttons}>
                    <TouchableOpacity
                      onPress={() =>
                        respondTo(item._id, app.userId, true)
                      }
                    >
                      <Text style={{ color: 'green' }}>수락</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        respondTo(item._id, app.userId, false)
                      }
                    >
                      <Text style={{ color: 'red', marginLeft: 10 }}>
                        거절
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          ) : (
            <Text style={{ color: '#888' }}>신청자 없음</Text>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    margin: 12,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  applicantBox: {
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontWeight: '500',
  },
  status: {
    marginLeft: 10,
    color: '#007AFF',
  },
  buttons: {
    flexDirection: 'row',
  },
});
