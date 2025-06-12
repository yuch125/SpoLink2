

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
  Home: { username: string };
  CreatePost: {
    username: string;
    selectedPlace?: string;
    prevData?: {
      category?: string;
      content?: string;
      time?: string;
      detail?: string;
    };
  };
  
  MyProfile: {
    username: string;
  };

  PlaceSearch: {
    from?: 'CreatePost';
    prevData?: {
      category?: string;
      content?: string;
      time?: string;
      detail?: string;
    };
    username?: string;
  };
  EditPost: { post: Post };
  Chat: undefined;
  PlaceDetail: { place: KakaoPlace };
  NicknameSetup: { userId: string; token: string };
};

export interface UserProfile {
  _id: string;
  username: string;
  nickname?: string;
  profileImage?: string;
}


export type Post = {
  _id: string;
  category: string;
  content: string;
  time: string;
  location: string;
  detail: string;
  writer: {
    _id: string;
    nickname: string;
    username?: string;
    profileImage?: string;
  };
  participants: number;
  maxParticipants: number;
  expiresAt: string;
};





