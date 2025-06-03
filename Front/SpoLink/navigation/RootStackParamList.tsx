// C:\Back\Front\SpoLink\navigation\RootStackParamList.ts (또는 RootNavigator 위쪽)

// ── navigation/RootStackParamList.ts ──
// ── navigation/RootStackParamList.ts ──

export type KakaoPlace = {
  id: string;
  place_name: string;
  address_name: string;
  road_address_name?: string;
  phone?: string;
  x: string; // 경도
  y: string; // 위도
};

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Home: undefined;
  PlaceSearch: undefined;
  PlaceDetail: { place: KakaoPlace }; // ← 이 줄이 반드시 있어야 합니다.
  Chat: undefined;
};



  