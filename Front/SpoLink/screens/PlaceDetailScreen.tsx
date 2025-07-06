// screens/PlaceDetailScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList, KakaoPlace } from '../navigation/RootStackParamList';

type PlaceDetailRouteProp = RouteProp<RootStackParamList, 'PlaceDetail'>;

const { width } = Dimensions.get('window');

export default function PlaceDetailScreen() {
  const route = useRoute<PlaceDetailRouteProp>();

  console.log('✅ PlaceDetail route.params →', route.params);
  
  const place = route.params?.place;
  


  if (!place) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>❌ 장소 정보가 없습니다.</Text>
      </View>
    );
  }

  // 사용자 현재 위치
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loadingUserLoc, setLoadingUserLoc] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('위치 권한 거부됨', '내 위치를 가져오지 못해 정확한 거리 계산이 불가능합니다.');
          setLoadingUserLoc(false);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      } catch (err) {
        console.error('위치 가져오기 오류:', err);
      } finally {
        setLoadingUserLoc(false);
      }
    })();
  }, []);

  // KakaoPlace 에서 제공되는 거리(distance) 값을 사용하거나, 
  // 직접 계산이 필요하면 여기에 haversine 공식을 넣을 수도 있음. 
  // 여기서는 API에서 넘어온 place.distance(미터 단위 문자열)를 사용한다.
  const parsedDistance = place.distance
    ? parseInt(place.distance, 10)
    : null; // 단위: 미터

  // 카카오가 주는 위도/경도 문자열을 숫자로 변환
  const latitude = parseFloat(place.y);
  const longitude = parseFloat(place.x);

  // 맵 초기 region 설정
  const region = {
    latitude,
    longitude,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  };

  // “구글 맵에서 보기” 버튼 핸들러
  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('오류', '구글 맵을 열 수 없습니다.');
        }
      })
      .catch(() => {
        Alert.alert('오류', '구글 맵을 열 수 없습니다.');
      });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* 1) 지도 섹션 */}
      <View style={styles.mapContainer}>
        <MapView provider={PROVIDER_GOOGLE} style={styles.map} region={region}>
          {/* 장소 마커 */}
          <Marker
            coordinate={{ latitude, longitude }}
            title={place.place_name}
            description={place.address_name || '주소 정보 없음'}
          />

          {/* 사용자 위치 마커 & 원 */}
          {!loadingUserLoc && userLocation && (
            <>
              <Marker
                coordinate={userLocation}
                title="내 위치"
                pinColor="blue"
              />
              <Circle
                center={userLocation}
                radius={50}
                fillColor="rgba(0,0,255,0.2)"
                strokeColor="rgba(0,0,255,0.5)"
              />
            </>
          )}
        </MapView>
      </View>

      {/* 2) 상세 정보 섹션 */}
      <View style={styles.detailContainer}>
        {/* 장소 이름 */}
        <Text style={styles.title}>{place.place_name}</Text>

        {/* 도로명 주소 & 지번 주소 */}
        <Text style={styles.label}>도로명 주소:</Text>
        <Text style={styles.text}>
          {place.road_address_name || '정보 없음'}
        </Text>

        <Text style={styles.label}>지번 주소:</Text>
        <Text style={styles.text}>
          {place.address_name || '정보 없음'}
        </Text>

        {/* 전화번호 */}
        <Text style={styles.label}>전화번호:</Text>
        <Text style={styles.text}>
          {place.phone || '정보 없음'}
        </Text>

        {/* API에서 넘어온 거리 (m) */}
        {parsedDistance !== null && (
          <>
            <Text style={styles.label}>카카오 API 제공 거리:</Text>
            <Text style={styles.text}>
              {parsedDistance < 1000
                ? `${parsedDistance} m`
                : `${(parsedDistance / 1000).toFixed(1)} km`}
            </Text>
          </>
        )}

        {/* 직접 계산한 거리 (예시) */}
        {!loadingUserLoc && userLocation && (
          <>
            <Text style={styles.label}>내 위치와의 직접 계산 거리:</Text>
            <Text style={styles.text}>
              {(() => {
                // 단순히 Pythagoras 근사: 위도/경도 차이를 이용해 m 단위로 근사 계산
                const toRad = (deg: number) => (deg * Math.PI) / 180;
                const R = 6371000; // 지구 반지름 (m)
                const φ1 = toRad(userLocation.latitude);
                const φ2 = toRad(latitude);
                const Δφ = toRad(latitude - userLocation.latitude);
                const Δλ = toRad(longitude - userLocation.longitude);
                const a =
                  Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) *
                  Math.cos(φ2) *
                  Math.sin(Δλ / 2) *
                  Math.sin(Δλ / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const d = R * c; // 미터 단위
                return d < 1000
                  ? `${Math.round(d)} m`
                  : `${(d / 1000).toFixed(1)} km`;
              })()}
            </Text>
          </>
        )}

        {/* 구글맵 보기 버튼 */}
      </View>
    </ScrollView>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// 스타일
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    paddingBottom: 30,
  },
  mapContainer: {
    width: width,
    height: 300,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  detailContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
  },
  text: {
    fontSize: 16,
    marginTop: 4,
    color: '#333',
  },
  mapButton: {
    marginTop: 20,
    backgroundColor: '#1E90FF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  mapButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});