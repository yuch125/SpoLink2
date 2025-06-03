// screens/CreatePostScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootStackParamList';

type CreatePostNavProp = NativeStackNavigationProp<RootStackParamList, 'CreatePost'>;
type CreatePostRouteProp = RouteProp<RootStackParamList, 'CreatePost'>;

export default function CreatePostScreen() {
  const navigation = useNavigation<CreatePostNavProp>();
  const route = useRoute<CreatePostRouteProp>();

  const [category, setCategory] = useState<string>('');   // 운동 종목
  const [content, setContent] = useState<string>('');     // 모집 내용
  const [time, setTime] = useState<string>('');           // 시간
  const [location, setLocation] = useState<string>('');   // 선택된 장소(문자열)

  // ── **PlaceSearch에서 돌아왔을 때 (selectedPlace가 있으면) location에 세팅**
  useEffect(() => {
    if (route.params?.selectedPlace) {
      setLocation(route.params.selectedPlace);
    }
  }, [route.params?.selectedPlace]);

  const handleSubmit = () => {
    if (!category || !content || !time || !location) {
      Alert.alert('모든 항목을 입력해 주세요.');
      return;
    }
    // TODO: 서버로 POST하거나 Context/Redux에 저장
    console.log({ category, content, time, location });
    Alert.alert('모집 카드가 생성되었습니다!');
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>모임을 만들어 주세요</Text>

      <TextInput
        placeholder="운동 종목 (예: 농구)"
        style={styles.input}
        value={category}
        onChangeText={setCategory}
      />
      <TextInput
        placeholder="모집 내용"
        style={styles.input}
        value={content}
        onChangeText={setContent}
      />
      <TextInput
        placeholder="시간 (예: 18~20시)"
        style={styles.input}
        value={time}
        onChangeText={setTime}
      />

      {/* 📍 장소 입력 부분 → TextInput 대신 TouchableOpacity로 대체 */}
      <TouchableOpacity
        style={[styles.input, styles.locationBox]}
        onPress={() => {
          // from:'CreatePost' 파라미터를 넘겨서 PlaceSearch로 이동
          navigation.navigate('PlaceSearch', { from: 'CreatePost' });
        }}
      >
        <Text style={{ color: location ? '#000' : '#888' }}>
          {location ? location : '장소를 선택하세요'}
        </Text>
      </TouchableOpacity>

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
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
