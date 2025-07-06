// screens/PlaceSearchScreen.tsx

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
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import axios from 'axios';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, KakaoPlace } from '../navigation/RootStackParamList';
import { KAKAO_API_KEY } from '../config';

type PlaceSearchNavProp = NativeStackNavigationProp<RootStackParamList, 'PlaceSearch'>;
type PlaceSearchRouteProp = RouteProp<RootStackParamList, 'PlaceSearch'>;

const FACILITY_KEYWORDS = ['체육관', '농구장', '축구장', '농구', '야구', '야구장', '배구', '배구장', '축구'];

const PlaceSearchScreen: React.FC = () => {
  const navigation = useNavigation<PlaceSearchNavProp>();
  const route = useRoute<PlaceSearchRouteProp>();

  const userId = route.params?.userId!;
  const nickname = route.params?.nickname ?? '';
  const prevData = route.params?.prevData;
  const post = route.params?.post;

  const [keyword, setKeyword] = useState<string>('체육관');
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [places, setPlaces] = useState<KakaoPlace[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      Alert.alert('오류', '사용자 정보가 누락되었습니다. 다시 시도해주세요.');
      navigation.goBack();
    }
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('위치 접근 권한이 필요합니다.');
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocationCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    })();
  }, []);

  useEffect(() => {
    if (locationCoords) {
      searchPlaces('체육관');
    }
  }, [locationCoords]);

  const searchPlaces = async (query: string) => {
    if (!locationCoords) {
      setErrorMsg('위치 정보가 없습니다.');
      return;
    }

    if (!FACILITY_KEYWORDS.some((k) => query.includes(k))) {
      setErrorMsg('체육관, 농구장, 축구장만 검색 가능합니다.');
      setKeyword('체육관');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const { latitude, longitude } = locationCoords;
      const response = await axios.get('https://dapi.kakao.com/v2/local/search/keyword.json', {
        params: {
          query,
          x: longitude.toString(),
          y: latitude.toString(),
          radius: 5000,
          size: 15,
        },
        headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` },
      });
      const docs: KakaoPlace[] = response.data.documents;
      setPlaces(docs);
      if (docs.length === 0) {
        setErrorMsg('검색 결과가 없습니다.');
      }
    } catch (err) {
      console.error('키워드 검색 중 에러:', err);
      setErrorMsg('검색 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      Keyboard.dismiss();
    }
  };

  const handleSelect = (placeName: string) => {
    if (route.params?.from === 'CreatePost') {
      navigation.navigate('CreatePost', {
        userId,
        nickname,
        selectedPlace: placeName,
        prevData,
      });
    } else if (route.params?.from === 'EditPost' && post) {
      navigation.navigate('EditPost', {
        userId,
        nickname,
        selectedPlace: placeName,
        post,
      });
    }
  };

  const handleDetail = (place: KakaoPlace) => {
    navigation.navigate('PlaceDetail', { place });
  };

  const renderItem = ({ item }: { item: KakaoPlace }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.placeName}>{item.place_name}</Text>
      <Text style={styles.address}>{item.address_name || '주소 정보 없음'}</Text>
      {item.distance && (
        <Text style={styles.distance}>
          거리:{' '}
          {parseInt(item.distance, 10) < 1000
            ? `${item.distance} m`
            : `${(parseInt(item.distance, 10) / 1000).toFixed(1)} km`}
        </Text>
      )}
      {item.phone ? <Text style={styles.phone}>{item.phone}</Text> : null}

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.selectButton} onPress={() => handleSelect(item.place_name)}>
          <Text style={styles.buttonText}>📍 장소 선택</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.detailButton} onPress={() => handleDetail(item)}>
          <Text style={styles.buttonText}>🗺️ 정보 보기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!userId) return null;

  if (loading && places.length === 0 && !errorMsg) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E90FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="검색어: 체육관, 농구장, 축구장, 야구장, 배구장"
          value={keyword}
          onChangeText={setKeyword}
          onSubmitEditing={() => searchPlaces(keyword)}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={() => searchPlaces(keyword)}>
          <Text style={styles.searchButtonText}>검색</Text>
        </TouchableOpacity>
      </View>

      {errorMsg && (
        <View style={styles.center}>
          <Text style={{ color: 'red' }}>{errorMsg}</Text>
        </View>
      )}

      {!loading && places.length > 0 && (
        <FlatList
          data={places}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

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
  container: { flex: 1, backgroundColor: '#FFF' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  placeName: { fontSize: 16, fontWeight: '600' },
  address: { fontSize: 14, color: '#555', marginTop: 4 },
  phone: { fontSize: 14, color: '#333', marginTop: 4 },
  distance: { fontSize: 14, color: '#1E90FF', marginTop: 2, marginBottom: 2 },
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  selectButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginRight: 8,
  },
  detailButton: {
    backgroundColor: '#888',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
});
