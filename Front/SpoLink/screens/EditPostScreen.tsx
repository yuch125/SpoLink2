import React, { useEffect, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
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
  const [date, setDate] = useState<Date | null>(new Date(post.startTime));
  const [startTime, setStartTime] = useState<Date | null>(new Date(post.startTime));
  const [endTime, setEndTime] = useState<Date | null>(new Date(post.endTime));
  const [category, setCategory] = useState(post.category);
  const [content, setContent] = useState(post.content);
  const [location, setLocation] = useState<{
    name: string;
    latitude: number;
    longitude: number;
  } | null>(null);
  const [maxParticipants, setMaxParticipants] = useState(
    post.maxParticipants?.toString() || '4'
  );

  const [preferredAgeGroups, setPreferredAgeGroups] = useState<string[]>(
    post.preferredAgeGroups || []
  );

  const ageOptions = ['초등학생', '중학생', '고등학생', '20대', '30대', '40대 이상', '상관없음'];

  const [locationName, setLocationName] = useState<string>(''); // ✅ 이 줄 추가
  const [detail, setDetail] = useState(post.detail);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [pickerTarget, setPickerTarget] = useState<'date' | 'startTime' | 'endTime'>('date');

  const openPicker = (target: 'date' | 'startTime' | 'endTime') => {
    setPickerTarget(target);
    setPickerMode(target === 'date' ? 'date' : 'time');
    setShowPicker(true);
  };

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
  // 🔄 장소 검색 후 돌아왔을 때 선택된 장소 반영
  useEffect(() => {
    if (post.location) {
      setLocation({
        name: post.locationName, // ✅ name 필드 추가
        latitude: post.location.coordinates[1],
        longitude: post.location.coordinates[0],
      });
    }
    if (post.locationName) {
      setLocationName(post.locationName);  // ✅ 이 줄 추가
    }
  }, [post]);

  // 🔽 2. 이 위치에 너가 말한 useEffect 붙여줘
  useEffect(() => {
    const focusUnsubscribe = navigation.addListener('focus', () => {
      if (route.params?.selectedPlace) {
        const selected = route.params.selectedPlace;
        setLocation({
          name: selected.name,
          latitude: selected.latitude,
          longitude: selected.longitude,
        });
        setLocationName(selected.name); // ✅ locationName도 함께 갱신!
      }
    });

    return focusUnsubscribe;
  }, [navigation, route.params?.selectedPlace]);

  const startDateTime = new Date(date!);
  startDateTime.setHours(startTime!.getHours(), startTime!.getMinutes());

  const endDateTime = new Date(date!);
  endDateTime.setHours(endTime!.getHours(), endTime!.getMinutes());


  const handleSave = async () => {
    try {
      const updated = {
        category,
        content,
        startTime: startDateTime.toISOString(),  // ✅ 필수
        endTime: endDateTime.toISOString(),      // ✅ 필수
        location: location
          ? {
            type: 'Point',
            coordinates: [location.longitude, location.latitude],
          }
          : null,
        detail,
        locationName,
        maxParticipants: parseInt(maxParticipants, 10),
        preferredAgeGroups,
      };
      await axios.put(`${SERVER_URL}/posts/${post._id}`, updated, {
        headers: { 'Content-Type': 'application/json' },
      });
      Alert.alert('수정 완료', '모임 카드가 수정되었습니다.', [
        {
          text: '확인',
          onPress: () => {
            setTimeout(() => {
              navigation.navigate('Home', { userId, nickname });
            }, 1000); // 1초 정도 딜레이
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
        {['농구', '축구', '배드민턴', '런닝'].map((sport) => (
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

      {/* 날짜 선택 */}
      <TouchableOpacity style={styles.input} onPress={() => openPicker('date')}>
        <Text style={{ color: date ? '#000' : '#888' }}>
          {date ? date.toLocaleDateString() : '날짜 선택'}
        </Text>
      </TouchableOpacity>

      {/* 시작/종료 시간 */}
      <View style={[styles.input, { flexDirection: 'row', justifyContent: 'space-between' }]}>
        <TouchableOpacity onPress={() => openPicker('startTime')}>
          <Text style={{ color: startTime ? '#000' : '#888' }}>
            {startTime
              ? startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '시작 시간'}
          </Text>
        </TouchableOpacity>
        <Text> ~ </Text>
        <TouchableOpacity onPress={() => openPicker('endTime')}>
          <Text style={{ color: endTime ? '#000' : '#888' }}>
            {endTime
              ? endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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


      {/* 🔍 장소 선택 버튼 */}
      <TouchableOpacity
        style={[styles.input, styles.locationBox]}
        onPress={() => {
          navigation.navigate('PlaceSearch', {
            from: 'EditPost',
            userId,
            nickname,
            post,
            prevData: { category, content, date, startTime, endTime, detail },
          });
        }}
      >
        <Text>{location?.name ?? '장소를 선택하세요'}</Text>

      </TouchableOpacity>

      {/* 최대 인원 */}
      <TextInput
        style={styles.input}
        placeholder="최대 인원"
        value={maxParticipants}
        onChangeText={setMaxParticipants}
        keyboardType="numeric"
      />

      {/* 연령대 선택 */}
      <View style={{ marginBottom: 12 }}>
        <Text style={{ marginBottom: 8 }}>선호 연령대</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {ageOptions.map((age) => (
            <TouchableOpacity
              key={age}
              style={[
                styles.ageButton,
                preferredAgeGroups.includes(age) && styles.ageButtonSelected,
              ]}
              onPress={() => {
                if (preferredAgeGroups.includes(age)) {
                  setPreferredAgeGroups(preferredAgeGroups.filter((a) => a !== age));
                } else {
                  setPreferredAgeGroups([...preferredAgeGroups, age]);
                }
              }}
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
      </View>


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
  container: { flex: 1, padding: 20, backgroundColor: '#f2f2f2' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 15,
    backgroundColor: '#fafafa',
  },
  locationBox: { justifyContent: 'center', height: 48 },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  sportButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sportButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#eee',
    alignItems: 'center',
  },
  sportButtonSelected: { backgroundColor: '#007AFF' },
  sportText: { color: '#000' },
  sportTextSelected: { color: '#fff', fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  ageButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    margin: 4,
    backgroundColor: '#f2f2f2',
  },
  ageButtonSelected: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  ageText: { color: '#000' },
  ageTextSelected: { color: '#fff', fontWeight: '600' },
});
