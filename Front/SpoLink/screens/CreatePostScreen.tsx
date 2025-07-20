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
import { useProfile } from '../contexts/ProfileContext';

type CreatePostRouteProp = RouteProp<RootStackParamList, 'CreatePost'>;
type CreatePostNavProp = NativeStackNavigationProp<RootStackParamList, 'CreatePost'>;

export default function CreatePostScreen() {
  const { profile } = useProfile();

  const navigation = useNavigation<CreatePostNavProp>();
  const route = useRoute<CreatePostRouteProp>();

  const userId = route.params?.userId;
  const nickname = route.params?.nickname;
  const profileImage = profile?.profileImage || '';
  console.log('🧑‍💻 현재 프로필 이미지:', profile?.profileImage);

  if (!userId) {
    console.error('❌ CreatePostScreen: userId가 전달되지 않았습니다!');
    Alert.alert('오류', '로그인 정보가 누락되었습니다. 다시 로그인해주세요.');
    navigation.navigate('Login');
    return null;
  }

  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [detail, setDetail] = useState('');
  const [expiresAt, setExpiresAt] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState(12);

  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSelectingStartTime, setIsSelectingStartTime] = useState(true);

  useEffect(() => {
    if (route.params?.selectedPlace) {
      setLocation(route.params.selectedPlace);
    }
  }, [route.params?.selectedPlace]);

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setExpiresAt(selectedDate);
    }
  };

  const handleSubmit = async () => {
    if (!category || !content || !startTime || !endTime || !location || !detail) {
      Alert.alert('모든 항목을 입력해 주세요.');
      return;
    }

    if (startTime.getTime() >= endTime.getTime()) {
      Alert.alert('시간 설정 오류', '시작 시간은 종료 시간보다 이전이어야 합니다.');
      return;
    }

    const time = `${startTime.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}~${endTime.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    const newPost = {
      category,
      content,
      time,
      location,
      detail,
      writer: userId,
      maxParticipants,
      participants: 1,
      expiresAt,
    };
    console.log('🧾 생성 요청 데이터:', newPost);
    try {
      await axios.post(`${SERVER_URL}/posts`, newPost, {
        headers: { 'Content-Type': 'application/json' },
      });

      Alert.alert('모집 카드가 생성되었습니다!', '', [
        {
          text: '확인',
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home', params: { userId, nickname } }],
            });
          },
        },
      ]);
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
            style={[styles.sportButton, category === sport && styles.sportButtonSelected]}
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

      <View style={[styles.input, { flexDirection: 'row', justifyContent: 'space-between' }]}>
        <TouchableOpacity onPress={() => { setIsSelectingStartTime(true); setShowTimePicker(true); }}>
          <Text style={styles.timeText}>
            {startTime ? startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '시작 시간'}
          </Text>
        </TouchableOpacity>
        <Text> ~ </Text>
        <TouchableOpacity onPress={() => { setIsSelectingStartTime(false); setShowTimePicker(true); }}>
          <Text style={styles.timeText}>
            {endTime ? endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '종료 시간'}
          </Text>
        </TouchableOpacity>
      </View>

      {showTimePicker && (
        <DateTimePicker
          mode="time"
          value={(isSelectingStartTime ? startTime : endTime) || new Date()}
          is24Hour={true}
          display={Platform.OS === 'android' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setShowTimePicker(false);
            if (date) {
              isSelectingStartTime ? setStartTime(date) : setEndTime(date);
            }
          }}
        />
      )}

      <TouchableOpacity
        style={[styles.input, styles.locationBox]}
        onPress={() => {
          navigation.navigate('PlaceSearch', {
            from: 'CreatePost',
            userId,
            nickname,
            prevData: { category, content, detail },
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

      <View style={styles.inputContainer}>
        <Text>최대 참가자 수:</Text>
        <TextInput
          keyboardType="numeric"
          value={String(maxParticipants)}
          onChangeText={(text) => setMaxParticipants(Number(text))}
          style={styles.textInput}
        />
      </View>

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
  inputContainer: {
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    fontSize: 16,
  },
  timeText: {
    fontSize: 16,
    color: '#000',
  },
});
