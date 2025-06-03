// C:\Back\Front\SpoLink\screens\PlaceSearchScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import * as Location from 'expo-location';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, KakaoPlace } from '../navigation/RootStackParamList';
import { KAKAO_API_KEY } from '../config'; // config.ts에 실제 키를 넣어두세요.

type PlaceSearchNavProp = NativeStackNavigationProp<RootStackParamList, 'PlaceSearch'>;

// 운동시설 키워드만 허용
const FACILITY_KEYWORDS = ['체육관', '농구장', '축구장'];

const PlaceSearchScreen: React.FC = () => {
  const navigation = useNavigation<PlaceSearchNavProp>();

  // 상태 관리
  const [keyword, setKeyword] = useState<string>('체육관'); // 기본값은 '체육관'
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [places, setPlaces] = useState<KakaoPlace[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 위치 접근 권한 요청 및 위치 정보 얻기
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('위치 접근 권한이 필요합니다.');
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    })();
  }, []);

  // 위치 받아오면 최초 추천(체육관) 자동 검색
  useEffect(() => {
    if (location) {
      searchPlaces('체육관'); // 앱 진입시 자동 추천
    }
  }, [location]);

  // 검색 함수
  const searchPlaces = async (query: string) => {
    if (!location) {
      setErrorMsg('위치 정보가 없습니다.');
      return;
    }

    // 입력값이 운동시설 키워드 포함하는지 체크
    if (!FACILITY_KEYWORDS.some(k => query.includes(k))) {
      setErrorMsg('운동시설(체육관, 농구장, 축구장)만 검색할 수 있습니다.');
      setKeyword('체육관');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const { latitude, longitude } = location;
      const response = await axios.get(
        'https://dapi.kakao.com/v2/local/search/keyword.json',
        {
          params: {
            query,
            x: longitude.toString(),
            y: latitude.toString(),
            radius: 2000,
            size: 10,
          },
          headers: {
            Authorization: `KakaoAK ${KAKAO_API_KEY}`,
          },
        }
      );
      setPlaces(response.data.documents);
      if (response.data.documents.length === 0) {
        setErrorMsg('검색 결과가 없습니다.');
      }
    } catch (err) {
      console.error('키워드 검색 중 오류:', err);
      setErrorMsg('검색 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      Keyboard.dismiss();
    }
  };

  // FlatList 렌더링
  const renderItem = ({ item }: { item: KakaoPlace }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => navigation.navigate('PlaceDetail', { place: item })}
    >
      <Text style={styles.placeName}>{item.place_name}</Text>
      <Text style={styles.address}>{item.address_name || '주소 정보 없음'}</Text>
      {item.distance && (
        <Text style={styles.distance}>
          거리: {parseInt(item.distance, 10) < 1000
            ? `${item.distance} m`
            : `${(parseInt(item.distance, 10) / 1000).toFixed(1)} km`}
        </Text>
      )}
      {item.phone ? <Text style={styles.phone}>{item.phone}</Text> : null}
    </TouchableOpacity>
  );

  // 로딩/오류/리스트 UI
  if (loading && !places.length && !errorMsg) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E90FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 검색 입력창 */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="검색어: 체육관, 농구장, 축구장"
          value={keyword}
          onChangeText={setKeyword}
          onSubmitEditing={() => searchPlaces(keyword)}
          returnKeyType="search"
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => searchPlaces(keyword)}
        >
          <Text style={styles.searchButtonText}>검색</Text>
        </TouchableOpacity>
      </View>

      {/* 오류 메시지 */}
      {errorMsg && (
        <View style={styles.center}>
          <Text style={{ color: 'red' }}>{errorMsg}</Text>
        </View>
      )}

      {/* 결과 리스트 */}
      {!loading && places.length > 0 && (
        <FlatList
          data={places}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      {/* 추가 검색 중 로딩 */}
      {loading && places.length > 0 && (
        <View style={styles.loadingMore}>
          <ActivityIndicator size="small" color="#1E90FF" />
          <Text style={{ marginLeft: 8 }}>검색 중...</Text>
        </View>
      )}
    </View>
  );
};

export default PlaceSearchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 12,
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
    backgroundColor: '#f7f7f7',
  },
  input: {
    flex: 1,
    height: 44,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFF',
  },
  searchButton: {
    marginLeft: 8,
    backgroundColor: '#1E90FF',
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  itemContainer: {
    padding: 12,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '600',
  },
  address: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  phone: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  distance: {
    fontSize: 14,
    color: '#1E90FF',
    marginTop: 2,
    marginBottom: 2,
  },
});
