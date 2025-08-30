// screens/LoginScreen.tsx

import React, { useState} from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootStackParamList';
import { SERVER_URL } from '../constants';
import axios from 'axios';
import { useProfile } from '../contexts/ProfileContext';
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;
import socket from '../utils/socket';
export default function LoginScreen() {
  const { setProfile } = useProfile(); // 추가
  const navigation = useNavigation<NavigationProp>();
  const [showSignup, setShowSignup] = useState(false);
  const [userIdInput, setUserIdInput] = useState('');
  const [password, setPassword] = useState('');
  const [newUserId, setNewUserId] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleLogin = async () => {
    if (!userIdInput || !password) {
      Alert.alert('입력 오류', '아이디와 비밀번호를 입력해주세요.');
      return;
    }
  
    try {
      const res = await axios.post(`${SERVER_URL}/login`, {
        username: userIdInput.trim(),
        password: password.trim(),
      });
      const data = res.data;
      console.log('✅ 로그인 응답 데이터:', data);
  
      if (data.success) {
        setProfile({
          userId: data.userId,
          nickname: data.nickname || '',
        });
  
        // ✅ 로그인 성공 → 소켓 register 먼저!
        socket.emit('register', { userId: data.userId });
  
        Alert.alert('환영합니다!', `${data.nickname}님, 로그인 성공!`);
        setUserIdInput('');
        setPassword('');
  
        if (!data.nickname || data.nickname.trim() === '') {
          navigation.navigate('NicknameSetup', {
            userId: data.userId,
            token: data.token,
            loginId: data.username,
          });
        } else {
          navigation.navigate('Home', {
            userId: data.userId,
            nickname: data.nickname,
          });
        }
      } else {
        Alert.alert('로그인 실패', data.message);
      }
    } catch (err) {
      console.log('❌ 로그인 통신 오류:', err);
      Alert.alert('오류', '서버와 통신 실패');
    }
  };

  const handleSignup = async () => {
    if (!newUserId || !newPassword) {
      Alert.alert('입력 오류', '모든 필드를 입력해주세요.');
      return;
    }
    if (newPassword.length < 4) {
      Alert.alert('오류', '비밀번호는 최소 4자 이상이어야 합니다.');
      return;
    }

    try {
      const res = await axios.post(`${SERVER_URL}/signup`, {
        username: newUserId,
        password: newPassword,
        nickname: '',
        profileImage: '',
        bio: '',
      });

      const data = res.data;
      if (data.success) {
        Alert.alert('회원가입 완료');

        const loginRes = await axios.post(`${SERVER_URL}/login`, {
          username: newUserId.trim(),
          password: newPassword.trim(),
        });

        const loginData = loginRes.data;
        if (loginData.success) {
          Alert.alert('환영합니다!', `${newUserId}님, 자동 로그인 성공!`);
          setUserIdInput('');
          setPassword('');
          setNewUserId('');
          setNewPassword('');
          setShowSignup(false);
          setProfile({
            userId: data.userId,
            nickname: data.nickname,
          });
          if (!loginData.nickname || loginData.nickname.trim() === '') {
            navigation.navigate('NicknameSetup', {
              userId: loginData.userId,
              token: loginData.token,
              loginId: loginData.username,
            });
          } else {
            console.log(loginData)
            navigation.navigate('Home', {
              userId: loginData.userId,
              nickname: loginData.nickname,
            });
          }
        } else {
          Alert.alert('자동 로그인 실패', loginData.message);
        }
      } else {
        Alert.alert('회원가입 실패', data.message);
      }
    } catch (err) {
      console.log('❌ 회원가입/자동 로그인 오류:', err);
      Alert.alert('오류', '서버와 통신 실패');
    }
  };

  if (showSignup) {
    return (
      <View style={styles.container}>
        <Text style={styles.logo}>회원가입</Text>
        <TextInput
          style={styles.input}
          placeholder="아이디"
          value={newUserId}
          onChangeText={setNewUserId}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="비밀번호 (4자 이상)"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />
        <TouchableOpacity style={styles.button} onPress={handleSignup}>
          <Text style={styles.buttonText}>회원가입</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ marginTop: 20 }} onPress={() => setShowSignup(false)}>
          <Text style={{ color: 'blue' }}>뒤로 가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>SpoLink</Text>
      <Text style={styles.subtitle}>WHY NOT?</Text>
      <TextInput
        style={styles.input}
        placeholder="아이디"
        value={userIdInput}
        onChangeText={setUserIdInput}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="비밀번호"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>로그인</Text>
      </TouchableOpacity>

      <View style={{ marginTop: 20, alignItems: 'center' }}>
        <Text style={{ color: 'white' }}>혹시 계정이 없으신가요?</Text>
        <TouchableOpacity onPress={() => setShowSignup(true)}>
          <Text style={{ color: 'blue', marginTop: 10 }}>회원가입 하러가기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#333',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#0097a7',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 30,
  },
});
