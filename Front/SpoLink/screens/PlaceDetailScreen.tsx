import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList, KakaoPlace } from '../navigation/RootStackParamList';
type PlaceDetailRouteProp = RouteProp<RootStackParamList, 'PlaceDetail'>;
const { width } = Dimensions.get('window');

const PlaceDetailScreen: React.FC = () => {
  const route = useRoute<PlaceDetailRouteProp>();
  const { place } = route.params;

  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loadingUserLoc, setLoadingUserLoc] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({});
        setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      } catch (err) {
        console.error('위치 가져오기 오류:', err);
      } finally {
        setLoadingUserLoc(false);
      }
    })();
  }, []);

  // 지도 region
  const latitude = parseFloat(place.y);
  const longitude = parseFloat(place.x);
  const region = {
    latitude,
    longitude,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  };


  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.mapContainer}>
        <MapView provider={PROVIDER_GOOGLE} style={styles.map} region={region}>
          <Marker coordinate={{ latitude, longitude }} title={place.place_name} description={place.address_name} />
          {!loadingUserLoc && userLocation && (
            <>
              <Marker coordinate={userLocation} title="내 위치" pinColor="blue" />
              <Circle center={userLocation} radius={50} fillColor="rgba(0,0,255,0.2)" strokeColor="rgba(0,0,255,0.5)" />
            </>
          )}
        </MapView>
      </View>

      <View style={styles.detailContainer}>
        <Text style={styles.title}>{place.place_name}</Text>
        <Text style={styles.address}>
          주소: {place.road_address_name || place.address_name || '정보 없음'}
        </Text>
        {place.phone && <Text style={styles.phone}>전화: {place.phone}</Text>}
      </View>

      {/* Kakao API로는 사진/영업시간/가격 정보 불가 */}
    </ScrollView>
  );
};

export default PlaceDetailScreen;

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
    backgroundColor: '#FFF',
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
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  address: {
    fontSize: 16,
    color: '#444',
    marginBottom: 6,
  },
  phone: {
    fontSize: 16,
    color: '#444',
    marginBottom: 6,
  },
  distance: {
    fontSize: 15,
    color: '#1E90FF',
    marginBottom: 6,
  },
});
