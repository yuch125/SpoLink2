import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootStackParamList';
import axios from 'axios';
import { SERVER_URL } from '../constants';

type EditPostRouteProp = RouteProp<RootStackParamList, 'EditPost'>;
type EditPostNavProp = NativeStackNavigationProp<RootStackParamList, 'EditPost'>;

export default function EditPostScreen() {
  const route = useRoute<EditPostRouteProp>();
  const navigation = useNavigation<EditPostNavProp>();
  const { post, userId, nickname } = route.params;

  const [category, setCategory] = useState(post.category);
  const [content, setContent] = useState(post.content);
  const [time, setTime] = useState(post.time);
  const [location, setLocation] = useState(post.location);
  const [detail, setDetail] = useState(post.detail);

  // 🔄 장소 검색 후 돌아왔을 때 선택된 장소 반영
  useEffect(() => {
    if (route.params?.selectedPlace) {
      setLocation(route.params.selectedPlace);
    }
  }, [route.params?.selectedPlace]);

  const handleSave = async () => {
    try {
      const updated = { category, content, time, location, detail };
      await axios.put(`${SERVER_URL}/posts/${post._id}`, updated, {
        headers: { 'Content-Type': 'application/json' },
      });
      Alert.alert('수정 완료', '모임 카드가 수정되었습니다.', [
        {
          text: '확인',
          onPress: () => {
            navigation.navigate('Home', { userId, nickname });
          },
        },
      ]);
    } catch (err) {
      console.error('❌ 수정 실패:', err);
      Alert.alert('수정 중 오류 발생');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>모임 카드 수정</Text>

      <View style={styles.sportButtonContainer}>
        {['농구', '축구', '야구', '배구'].map((sport) => (
          <TouchableOpacity
            key={sport}
            style={[
              styles.sportButton,
              category === sport && styles.sportButtonSelected,
            ]}
            onPress={() => setCategory(sport)}
          >
            <Text style={category === sport ? styles.sportTextSelected : styles.sportText}>
              {sport}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.input}
        placeholder="모집 내용"
        value={content}
        onChangeText={setContent}
      />

      <TextInput
        style={styles.input}
        placeholder="시간 (예: 18:00~20:00)"
        value={time}
        onChangeText={setTime}
      />

      {/* 🔍 장소 선택 버튼 */}
      <TouchableOpacity
        style={[styles.input, styles.locationBox]}
        onPress={() => {
          navigation.navigate('PlaceSearch', {
            from: 'EditPost',
            userId,
            nickname,
            post,
            prevData: { category, content, time, detail },
          });
        }}
      >
        <Text style={{ color: location ? '#000' : '#888' }}>
          {location ? location : '장소를 선택하세요'}
        </Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="세부사항"
        value={detail}
        onChangeText={setDetail}
      />

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>수정 완료</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  locationBox: {
    justifyContent: 'center',
    height: 48,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  sportButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sportButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 6,
    backgroundColor: '#eee',
    alignItems: 'center',
  },
  sportButtonSelected: {
    backgroundColor: '#007AFF',
  },
  sportText: {
    color: '#000',
  },
  sportTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
});
