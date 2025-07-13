import React, { useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/RootStackParamList';
import { SERVER_URL } from '../constants';
import axios from 'axios';
import { useProfile } from '../contexts/ProfileContext';

// 🔧 타입 정의
type NicknameSetupRouteProp = RouteProp<RootStackParamList, 'NicknameSetup'>;
type NicknameSetupNavProp = NativeStackNavigationProp<RootStackParamList, 'NicknameSetup'>;

export default function NicknameSetupScreen() {
  const route = useRoute<NicknameSetupRouteProp>();
  const navigation = useNavigation<NicknameSetupNavProp>();
  const { setProfile } = useProfile();

  const { userId, token, loginId } = route.params; // username → loginId로 변경
  const [nickname, setNickname] = useState('');

  const handleSave = async () => {
    if (!nickname.trim()) {
      Alert.alert('❗ 입력 오류', '닉네임을 입력해주세요.');
      return;
    }

    try {
      const res = await axios.put(`${SERVER_URL}/users/${userId}`, {
        nickname,
      });

      if (res.data.success) {
        // ProfileContext에 닉네임 저장
        setProfile({
          userId,
          nickname,
        });

        Alert.alert('✅ 닉네임 설정 완료!');
        navigation.replace('Home', {
          userId,
          nickname,
        });
      } else {
        Alert.alert('❌ 저장 실패', res.data.message || '닉네임 저장에 실패했습니다.');
      }
    } catch (err: any) {
      Alert.alert('❌ 에러 발생', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="닉네임을 입력하세요"
        value={nickname}
        onChangeText={setNickname}
      />
      <Button title="저장" onPress={handleSave} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  input: { borderBottomWidth: 1, marginBottom: 20, fontSize: 18 },
});
