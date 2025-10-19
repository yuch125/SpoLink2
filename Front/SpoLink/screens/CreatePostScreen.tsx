import React, { useEffect, useState } from 'react';
import { ScrollView, KeyboardAvoidingView } from 'react-native';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const selectedPlace = route.params?.selectedPlace;
  const userId = route.params?.userId;
  const nickname = route.params?.nickname;
  const profileImage = profile?.profileImage || '';

  if (!userId) {
    console.error('❌ CreatePostScreen: userId가 전달되지 않았습니다!');
    Alert.alert('오류', '로그인 정보가 누락되었습니다. 다시 로그인해주세요.');
    navigation.navigate('Login');
    return null;
  }

  // 상태 관리
  const [preferredAgeGroups, setPreferredAgeGroups] = useState<string[]>([]);
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [locationName, setLocationName] = useState<string>('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [detail, setDetail] = useState('');
  const [expiresAt, setExpiresAt] = useState(new Date());
  const [maxParticipants, setMaxParticipants] = useState(12);

// ✅ 날짜 + 시간
const [date, setDate] = useState<Date | null>(null);
const [startTime, setStartTime] = useState<Date | null>(null);
const [endTime, setEndTime] = useState<Date | null>(null);

const [showPicker, setShowPicker] = useState(false);
const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
const [pickerTarget, setPickerTarget] = useState<'date' | 'startTime' | 'endTime'>('date');

// ✅ Picker 열기
const openPicker = (target: 'date' | 'startTime' | 'endTime') => {
  setPickerTarget(target);
  setPickerMode(target === 'date' ? 'date' : 'time');
  setShowPicker(true);
};


// ✅ Picker 값 변경
const onChangeDateTime = (event: any, selected?: Date) => {
  if (!selected) {
    setShowPicker(false);
    return;
  }
  if (pickerTarget === 'date') setDate(selected);
  if (pickerTarget === 'startTime') setStartTime(selected);
  if (pickerTarget === 'endTime') setEndTime(selected);
  setShowPicker(false);
};


  useEffect(() => {
    if (selectedPlace) {
      console.log('🧭 선택된 장소:', selectedPlace);
      const { name, latitude, longitude } = route.params.selectedPlace;
      setLocationName(name);
      setCoordinates({ lat: latitude, lng: longitude });
    }
  }, [route.params?.selectedPlace]);

  // 연령대 선택
  const toggleAgeGroup = (age: string) => {
    if (preferredAgeGroups.includes(age)) {
      setPreferredAgeGroups(preferredAgeGroups.filter(a => a !== age));
    } else {
      if (preferredAgeGroups.length < 2) {
        setPreferredAgeGroups([...preferredAgeGroups, age]);
      } else {
        Alert.alert('최대 2개까지 선택할 수 있습니다.');
      }
    }
  };

  // 모집 카드 제출
  const handleSubmit = async () => {
    if (!category || !content || !startTime || !endTime || !coordinates || !detail) {
      Alert.alert('모든 항목을 입력해 주세요.');
      return;
    }

    if (startTime.getTime() >= endTime.getTime()) {
      Alert.alert('시간 설정 오류', '시작 시간은 종료 시간보다 이전이어야 합니다.');
      return;
    }

    const newPost = {
      category,
      content,
      startTime: startTime.toISOString(),  // ✅ 날짜+시간 저장
      endTime: endTime.toISOString(),
      writer: userId,
      maxParticipants,
      participants: 1,
      expiresAt,
      locationName,
      location: {
        type: 'Point',
        coordinates: coordinates ? [coordinates.lng, coordinates.lat] : [0, 0],
      },
      locationDistance: selectedPlace?.distance || '', // ✅ 추가
      detail,
      preferredAgeGroups,
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f2f2f2' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.title}>모임을 만들어 주세요</Text>
  
            {/* 운동 종목 */}
            <Text style={styles.sectionTitle}>운동 종목 선택</Text>
            <View style={styles.sportButtonContainer}>
              {['농구', '축구', '배드민턴', '런닝'].map((sport) => (
                <TouchableOpacity
                  key={sport}
                  style={[
                    styles.sportButton,
                    category === sport && styles.sportButtonSelected,
                  ]}
                  onPress={() => setCategory(sport)}
                >
                  <Text
                    style={
                      category === sport ? styles.sportTextSelected : styles.sportText
                    }
                  >
                    {sport}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
  
            {/* 제목 */}
            <TextInput
              placeholder="제목"
              style={styles.input}
              value={content}
              onChangeText={setContent}
            />
  
            {/* 날짜 선택 */}
            <TouchableOpacity style={styles.input} onPress={() => openPicker('date')}>
              <Text style={styles.timeText}>
                {date ? date.toLocaleDateString() : '날짜 선택'}
              </Text>
            </TouchableOpacity>
  
            {/* 시작/종료 시간 */}
            <View
              style={[
                styles.input,
                { flexDirection: 'row', justifyContent: 'space-between' },
              ]}
            >
              <TouchableOpacity onPress={() => openPicker('startTime')}>
                <Text style={styles.timeText}>
                  {startTime
                    ? startTime.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '시작 시간'}
                </Text>
              </TouchableOpacity>
              <Text> ~ </Text>
              <TouchableOpacity onPress={() => openPicker('endTime')}>
                <Text style={styles.timeText}>
                  {endTime
                    ? endTime.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '종료 시간'}
                </Text>
              </TouchableOpacity>
            </View>
  
            {/* Picker */}
            {showPicker && (
              <DateTimePicker
                mode={pickerMode}
                value={new Date()}
                display={pickerMode === 'date' ? 'calendar' : 'spinner'}
                onChange={onChangeDateTime}
              />
            )}
  
            {/* 장소 */}
            <TouchableOpacity
              style={[styles.input, styles.locationBox]}
              onPress={() => {
                navigation.navigate('PlaceSearch', {
                  from: 'CreatePost',
                  userId,
                  nickname: nickname!,
                  prevData: { category, content, detail },
                });
              }}
            >
              <Text style={{ color: locationName ? '#000' : '#888' }}>
                {locationName || '장소를 선택하세요'}
              </Text>
            </TouchableOpacity>
  
            {/* 세부사항 */}
            <TextInput
              placeholder="세부사항 (예: 준비물: 농구화)"
              style={styles.input}
              multiline
              value={detail}
              onChangeText={setDetail}
            />
  
            {/* 선호 연령대 */}
            <Text style={styles.sectionTitle}>선호 연령대 (최대 2개)</Text>
            <View style={styles.ageContainer}>
              {[
                '중학생',
                '고등학생',
                '20대',
                '30대',
                '40대',
                '50대',
                '상관없음',
              ].map((age) => (
                <TouchableOpacity
                  key={age}
                  style={[
                    styles.ageButton,
                    preferredAgeGroups.includes(age) && styles.ageButtonSelected,
                  ]}
                  onPress={() => toggleAgeGroup(age)}
                >
                  <Text
                    style={
                      preferredAgeGroups.includes(age)
                        ? styles.ageTextSelected
                        : styles.ageText
                    }
                  >
                    {age}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
  
            {/* 최대 참가자 수 */}
            <View style={styles.inputContainer}>
              <Text>모집인원 수(자신 포함):</Text>
              <TextInput
                keyboardType="numeric"
                value={String(maxParticipants)}
                onChangeText={(text) => setMaxParticipants(Number(text))}
                style={styles.textInput}
              />
            </View>
  
            {/* 제출 버튼 */}
            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>모임 만들기</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
  
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 10,
    marginTop: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  sportButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sportButton: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 3,
    borderRadius: 8,
    backgroundColor: '#eee',
    alignItems: 'center',
  },
  sportButtonSelected: {
    backgroundColor: '#4E6CFF',
  },
  sportText: { color: '#333', fontSize: 14 },
  sportTextSelected: { color: '#fff', fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 14,
    marginBottom: 10,
    backgroundColor: '#fafafa',
  },
  timeText: { fontSize: 14, color: '#000' },
  ageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 6,
  },
  ageButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    margin: 3,
    backgroundColor: '#f2f2f2',
  },
  ageButtonSelected: {
    backgroundColor: '#4E6CFF',
    borderColor: '#4E6CFF',
  },
  ageText: { color: '#000', fontSize: 13 },
  ageTextSelected: { color: '#fff', fontWeight: '600' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginLeft: 8,
    fontSize: 14,
    width: 70,
    textAlign: 'center',
    backgroundColor: '#fafafa',
  },
  button: {
    backgroundColor: '#4E6CFF',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
