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
  ChatRoom: {
    roomId: string;
    userId: string;
    nickname: string;
  };
  ChatList: { userId: string; nickname: string };
  PostDetail: {
    postId: string;
    title: string;
    content: string;
    writerId: string;
    writerNickname: string;
    userId: string;
    nickname: string;
  };
  Login: undefined;
  Home: { userId: string, nickname: string; };
  CreatePost: {
    userId: string;
    nickname?: string;
    selectedPlace?: {
      name: string;
      latitude: number;
      longitude: number;
    };
    prevData?: {
      category?: string;
      content?: string;
      time?: string;
      detail?: string;
    };
  };
  Applications: { userId?: string, postId?: string, nickname?: string, };
  MyApplicationList: { userId: string };
  MyProfile: { userId: string };
  Profile: { userId: string }
  PlaceSearch: {
    from: 'CreatePost' | 'EditPost';
    prevData?: {
      category?: string;
      content?: string;
      time?: string;
      detail?: string;
    };
    post?: Post;
    userId: string;
    nickname: string;
  };
  EditPost: {
    post: Post;
    userId: string;
    nickname: string;
    selectedPlace?: {
      name: string;
      latitude: number;
      longitude: number;
    };
  };
  Chat: undefined;
  PlaceDetail: { place: KakaoPlace };
  NicknameSetup: { userId: string; token: string; loginId: string; };
};

export interface UserProfile {
  _id: string;
  userId: string;
  nickname?: string;
  profileImage?: string;
}


export type Post = {
  _id: string;
  category: string;
  content: string;
  time: string;
  location: { coordinates: [number, number] }; detail: string;
  writer: {
    _id: string;
    nickname: string;
    userId?: string;
    profileImage?: string;
  };
  locationName :  string;
  participants: number;
  maxParticipants: number;
  expiresAt: string;
};




