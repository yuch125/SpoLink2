import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { commonStyles } from '../styles/commonStyle';
import { RootStackParamList } from '../navigation/RootStackParamList';
import { SERVER_URL } from '../constants';
import { useProfile } from '../contexts/ProfileContext';

type NicknameSetupRouteProp = RouteProp<RootStackParamList, 'NicknameSetup'>;
type NicknameSetupNavProp = NativeStackNavigationProp<RootStackParamList, 'NicknameSetup'>;

export default function NicknameSetupScreen() {
  const route = useRoute<NicknameSetupRouteProp>();
  const navigation = useNavigation<NicknameSetupNavProp>();
  const { setProfile } = useProfile();

  const { userId, token, loginId } = route.params;

  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [age, setAge] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // 📷 이미지 선택
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  // ✅ 저장 핸들러
  const handleSave = async () => {
    if (!nickname.trim()) {
      Alert.alert('닉네임을 입력해주세요.');
      return;
    }

    try {
      const res = await axios.patch(
        `${SERVER_URL}/users/${userId}`,
        { nickname, bio, age, profileImage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProfile(res.data.user);
      Alert.alert('✅ 프로필이 저장되었습니다.');
      navigation.navigate('Home', { userId });
    } catch (err) {
      console.error(err);
      Alert.alert('❌ 저장 실패', '서버와 통신 중 문제가 발생했습니다.');
    }
  };

  return (
    <View style={commonStyles.screen}>
      <View style={commonStyles.card}>
        <TouchableOpacity onPress={pickImage} style={{ alignSelf: 'center', marginBottom: 20 }}>
          <Image
            source={profileImage ? { uri: profileImage } : require('../assets/user.png')}
            style={{ width: 100, height: 100, borderRadius: 50 }}
          />
        </TouchableOpacity>
  
        <TextInput
          style={commonStyles.input}
          placeholder="닉네임 입력"
          value={nickname}
          onChangeText={setNickname}
        />
  
        <TextInput
          style={commonStyles.input}
          placeholder="한 줄 소개"
          value={bio}
          onChangeText={setBio}
        />
  
        <TextInput
          style={commonStyles.input}
          placeholder="나이"
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
        />
  
        <TouchableOpacity style={commonStyles.button} onPress={handleSave}>
          <Text style={commonStyles.buttonText}>저장하기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  imageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
});
