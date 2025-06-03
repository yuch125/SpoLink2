// screens/HomeScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootStackParamList';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<NavProp>();

  return (
    <View style={styles.container}>
      {/* 상단 로고 영역 */}
      <View style={styles.header}>
        <Image source={require('../assets/Logo.png')} style={styles.logo} />
        <View>
          <Text style={styles.title}>SpoLink</Text>
          <Text style={styles.subtitle}>WHY NOT?</Text>
        </View>
        <TouchableOpacity style={styles.plusButton}>
          <Text style={styles.plusText}>＋</Text>
        </TouchableOpacity>
      </View>

      {/* 스포츠 카테고리 프레임 */}
      <View style={styles.categoryContainer}>
        <TouchableOpacity style={styles.categoryItem}>
          <Image source={require('../assets/basketball.png')} style={styles.icon} />
          <Text style={styles.categoryLabel}>농구</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.categoryItem}>
          <Image source={require('../assets/soccer-ball-variant.png')} style={styles.icon} />
          <Text style={styles.categoryLabel}>축구</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.categoryItem}>
          <Image source={require('../assets/baseball-ball.png')} style={styles.icon} />
          <Text style={styles.categoryLabel}>야구</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.categoryItem}>
          <Image source={require('../assets/volleyball-ball.png')} style={styles.icon} />
          <Text style={styles.categoryLabel}>배구</Text>
        </TouchableOpacity>
      </View>

      {/* 하단 내비게이션 바 */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.navigate('PlaceSearch')}>
          <Image source={require('../assets/placeholder.png')} style={styles.navIcon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Image source={require('../assets/home.png')} style={styles.navIcon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Chat')}>
          <Image source={require('../assets/messenger.png')} style={styles.navIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  logo: {
    width: 60, height: 60, marginRight: 10,
  },
  title: {
    color: '#000', fontSize: 18, fontWeight: 'bold',
  },
  subtitle: {
    color: '#000', fontSize: 14,
  },
  plusButton: {
    width: 30, height: 30, backgroundColor: '#fff', borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  plusText: {
    fontSize: 20, fontWeight: 'bold', color: '#000',
  },
  categoryContainer: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: '#fff', borderRadius: 12, paddingVertical: 10,
    marginBottom: 30,
  },
  categoryItem: {
    alignItems: 'center',
  },
  icon: {
    width: 40, height: 40,
  },
  categoryLabel: {
    marginTop: 6, fontSize: 12, color: '#000',
  },
  navbar: {
    position: 'absolute', bottom: 40, left: 0, right: 0,
    paddingHorizontal: 40, flexDirection: 'row', justifyContent: 'space-between',
  },
  navIcon: {
    width: 30, height: 30,
  },
});


