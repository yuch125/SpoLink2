// C:\Back\Front\SpoLink\navigation\RootStackParamList.ts (또는 RootNavigator 위쪽)

// ── navigation/RootStackParamList.ts ──
// ── navigation/RootStackParamList.ts ──

// navigation/RootStackParamList.ts

export type KakaoPlace = {
  id: string;
  place_name: string;
  address_name: string;
  road_address_name?: string;
  phone?: string;
  x: string;
  y: string;
  distance?: string;
};

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  CreatePost: { selectedPlace?: string } | undefined;
  PlaceSearch: { from?: 'CreatePost' } | undefined;
  PlaceDetail: { place: KakaoPlace } | undefined;
  Chat: undefined;
};




  