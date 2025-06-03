// screens/LoginScreen.tsx
console.log('✅ 앱 진입됨');

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, KakaoPlace } from '../navigation/RootStackParamList';type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [showSignup, setShowSignup] = useState(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const SERVER_URL = 'http://192.168.68.55:3000'; // 자신의 PC IP로 변경

  const handleLogin = () => {
    if (!username || !password) {
      Alert.alert('입력 오류', '아이디와 비밀번호를 입력해주세요.');
      return;
    }

    console.log('📡 로그인 시도:', { username, password });

    fetch(`${SERVER_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim(), password: password.trim() }),
    })
      .then(async res => {
        console.log('📥 응답 상태:', res.status);
        const text = await res.text();
        console.log('📥 응답 내용:', text);
        return JSON.parse(text);
      })
      .then(data => {
        console.log('✅ 로그인 응답:', data);
        if (data.success) {
          Alert.alert('환영합니다!', `${username}님, 로그인 성공!`);
          setUsername('');
          setPassword('');
          navigation.navigate('Home');
        } else {
          Alert.alert('로그인 실패', data.message);
        }
      })
      .catch(err => {
        console.log('❌ 로그인 통신 오류:', err);
        Alert.alert('오류', '서버와 통신 실패');
      });
  };

  const handleSignup = () => {
    if (!newUsername || !newPassword) {
      Alert.alert('입력 오류', '모든 필드를 입력해주세요.');
      return;
    }
    if (newPassword.length < 4) {
      Alert.alert('오류', '비밀번호는 최소 4자 이상이어야 합니다.');
      return;
    }

    console.log('📡 회원가입 시도:', { newUsername, newPassword });

    fetch(`${SERVER_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: newUsername, password: newPassword }),
    })
      .then(res => res.json())
      .then(data => {
        console.log('✅ 회원가입 응답:', data);
        if (data.success) {
          Alert.alert('회원가입 완료');

          fetch(`${SERVER_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: newUsername.trim(), password: newPassword.trim() }),
          })
            .then(res => res.json())
            .then(loginData => {
              console.log('✅ 자동 로그인 응답:', loginData);
              if (loginData.success) {
                Alert.alert('환영합니다!', `${newUsername}님, 자동 로그인 성공!`);
                setUsername('');
                setPassword('');
                setNewUsername('');
                setNewPassword('');
                setShowSignup(false);
                navigation.navigate('Home');
              } else {
                Alert.alert('자동 로그인 실패', loginData.message);
              }
            })
            .catch(err => {
              console.log('❌ 자동 로그인 오류:', err);
              Alert.alert('오류', '자동 로그인 실패');
            });
        } else {
          Alert.alert('회원가입 실패', data.message);
        }
      })
      .catch(err => {
        console.log('❌ 회원가입 통신 오류:', err);
        Alert.alert('오류', '서버와 통신 실패');
      });
  };

  if (showSignup) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>회원가입</Text>
        <TextInput
          style={styles.input}
          placeholder="아이디"
          value={newUsername}
          onChangeText={setNewUsername}
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
        value={username}
        onChangeText={setUsername}
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
