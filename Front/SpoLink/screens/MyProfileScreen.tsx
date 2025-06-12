import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootStackParamList';

type ProfileRouteProp = RouteProp<RootStackParamList, 'MyProfile'>;
type ProfileNavProp = NativeStackNavigationProp<RootStackParamList, 'MyProfile'>;

export default function MyProfileScreen() {
  const route = useRoute<ProfileRouteProp>();
  const navigation = useNavigation<ProfileNavProp>();
  const username = route.params.username;

  const [nickname, setNickname] = useState(username);
  const [intro, setIntro] = useState('농구 좋아하는 중학생');

  const handleLogout = () => {
    Alert.alert('로그아웃 되었습니다.');
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.location}>경기도 시흥시 거주</Text>

      <View style={styles.profileCircle}>
        <Text style={styles.profileIcon}>👤</Text>
      </View>

      <Text style={styles.nickname}>{nickname}</Text>
      <Text style={styles.intro}>{intro}</Text>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>총 5회</Text>
          <Text style={styles.statLabel}>활동수</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>높음</Text>
          <Text style={styles.statLabel}>신뢰도</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>🏀</Text>
          <Text style={styles.statLabel}>좋아하는 운동</Text>
        </View>
      </View>

      <TextInput
        style={styles.input}
        placeholder="닉네임 수정"
        value={nickname}
        onChangeText={setNickname}
      />
      <TextInput
        style={styles.input}
        placeholder="한줄 소개"
        value={intro}
        onChangeText={setIntro}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>로그아웃</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 50,
    backgroundColor: '#F8F9FA',
  },
  location: {
    fontSize: 14,
    marginBottom: 10,
    color: '#555',
  },
  profileCircle: {
    backgroundColor: '#DDD',
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  profileIcon: {
    fontSize: 40,
  },
  nickname: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  intro: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '90%',
    marginBottom: 20,
  },
  statBox: {
    backgroundColor: '#C3F0CA',
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 6,
  },
  statValue: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#333',
  },
  input: {
    width: '90%',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#FF5C5C',
    padding: 14,
    borderRadius: 8,
    marginTop: 10,
    width: '90%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});