// screens/CreatePostScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootStackParamList';
import axios from 'axios';
import { RouteProp } from '@react-navigation/native';

import DateTimePicker from '@react-native-community/datetimepicker';
import { SERVER_URL } from '../constants';

type CreatePostRouteProp = RouteProp<RootStackParamList, 'CreatePost'>;
type CreatePostNavProp = NativeStackNavigationProp<RootStackParamList, 'CreatePost'>;

export default function CreatePostScreen() {
  const navigation = useNavigation<CreatePostNavProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'CreatePost'>>();
if (!route.params?.username) {
  console.error('❌ CreatePostScreen: username이 전달되지 않았습니다!');
  Alert.alert('오류', '로그인 정보가 누락되었습니다. 다시 로그인해주세요.');
  navigation.navigate('Login'); // 또는 navigation.goBack();
  return null; // 화면 렌더링 중단
}

const username = route.params.username;



  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [detail, setDetail] = useState('');
  const [expiresAt, setExpiresAt] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // 1. 장소를 선택하면 상태에 반영
  useEffect(() => {
    if ((route as any).params?.selectedPlace) {
      setLocation((route as any).params.selectedPlace);
    }
  }, [(route as any).params?.selectedPlace]);

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setExpiresAt(selectedDate);
    }
  };

  const handleSubmit = async () => {
    if (!category || !content || !time || !location || !detail) {
      Alert.alert('모든 항목을 입력해 주세요.');
      return;
    }

    const newPost = {
      category,
      content,
      time,
      location,
      detail,
      writer: username,  // ← 닉네임 저장
      maxParticipants: 12,
      participants: 0,
      expiresAt,
    };

    try {
      await axios.post(`${SERVER_URL}/posts`, newPost, {
        headers: { 'Content-Type': 'application/json' },
      });

      Alert.alert(
        '모집 카드가 생성되었습니다!',
        '',
        [
          {
            text: '확인',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [
                  {
                    name: 'Home',
                    params: { username }, // ✅ 여기 꼭 전달
                  },
                ],
              });
            },
          },
        ],
        { cancelable: false }
      );
    } catch (err: any) {
      console.error('❌ 카드 생성 실패:', err.response?.data || err.message);
      Alert.alert('카드 생성 중 오류가 발생했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>모임을 만들어 주세요</Text>

      <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>운동 종목 선택</Text>
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
        placeholder="모집 내용"
        style={styles.input}
        value={content}
        onChangeText={setContent}
      />
      <TextInput
        placeholder="시간 (예: 18:00~20:00)"
        style={styles.input}
        value={time}
        onChangeText={setTime}
      />

      <TouchableOpacity
        style={[styles.input, styles.locationBox]}
        onPress={() => {
          navigation.navigate('PlaceSearch', {
            from: 'CreatePost',
            username,                            // 로그인 유저
            prevData: { category, content, time, detail },
          });
        }}
      >
        <Text style={{ color: location ? '#000' : '#888' }}>
          {location ? location : '장소를 선택하세요'}
        </Text>
      </TouchableOpacity>

      <TextInput
        placeholder="세부사항 (예: 준비물 등)"
        style={styles.input}
        value={detail}
        onChangeText={setDetail}
      />

      <TouchableOpacity
        style={[styles.input, styles.datePickerBox]}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={{ color: '#000' }}>
          모집 마감시간: {expiresAt.toLocaleString()}
        </Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={expiresAt}
          mode="datetime"
          display="default"
          onChange={onChangeDate}
        />
      )}

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>모임 만들기</Text>
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
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
  },
  locationBox: {
    justifyContent: 'center',
    height: 48,
  },
  datePickerBox: {
    justifyContent: 'center',
    height: 48,
  },
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
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
