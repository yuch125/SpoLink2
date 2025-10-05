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

export type Participant = {
  userId: string;
  nickname: string;
  profileImage?: string;
  trustScore?: number;
  ageGroup?: string;
};
// 글 타입(다른 파일에서 쓰이면 여기 둬도 됨)
export type Post = {
  _id: string;
  category: string;
  content: string;
  time: string;
  location: { coordinates: [number, number] };
  locationDistance?: string; // ✅ 새로 추가
  detail: string;
  writer: {
    _id: string;
    nickname: string;
    userId?: string;
    profileImage?: string;
  };
  locationName: string;
  participants: Participant[];   // ✅ 배열로 고치기
  participantCount?: number;
  maxParticipants?: number;
  isFull?: boolean;
  expiresAt: string;
  commentCount?: number;
  preferredAgeGroups?: string[];
  myApplicationStatus?: 'pending' | 'accepted' | 'rejected' | null;
  startTime: string;
  endTime: string;
};

export interface UserProfile {
  _id: string;
  userId: string;
  nickname?: string;
  profileImage?: string;
}

// ✅ “필수만” 강제, 나머지는 옵션으로 둬서 기존 호출들이 최대한 안 깨지게 정리
export type RootStackParamList = {
  // 인증
  Login: undefined;
  NicknameSetup: { userId: string; token: string; loginId: string };

  // 메인/채팅 목록: 프로필 컨텍스트로 유저 데이터 접근 → 파라미터는 있어도 되고 없어도 되게
  Home: { userId?: string; nickname?: string };
  ChatList: { userId?: string; nickname?: string };

  // 채팅방: roomId만 필수, 나머지는 있으면 사용
  ChatRoom: {
    roomId: string;
    postId?: string;
    title?: string;
    initialCount?: number;
    maxParticipants?: number;
    userId?: string;     // (옵션) 삭제 UX용으로 넘길 수 있음
    nickname?: string;   // (옵션) 필요 시 넘겨도 됨
  };

  // 글 상세: postId만 필수, 과거 호출 호환 위해 나머지는 옵션
  PostDetail: {
    postId: string;
    title?: string;
    content?: string;
    writerId?: string;
    writerNickname?: string;
    userId?: string;
    nickname?: string;
  };

  // 글 작성/수정/장소검색: 과거 호출 호환 위해 userId/nickname 옵션
  CreatePost: {
    userId?: string;
    nickname?: string;
    selectedPlace?: { name: string; latitude: number; longitude: number  , distance?: string | null; // ✅ 새로 추가
  };
    prevData?: {
      category?: string;
      content?: string;
      date?: Date;
      startTime?: Date;
      endTime?: Date;
      detail?: string;
    };
  };
  EditPost: {
    post: Post;
    userId?: string;
    nickname?: string;
    selectedPlace?: { name: string; latitude: number; longitude: number };
  };
  PlaceSearch: {
    from: 'CreatePost' | 'EditPost';
    prevData?: {
      category?: string;
      content?: string;
      date?: Date | undefined;        // ✅ null 허용
      startTime?: Date | undefined;   // ✅ null 허용
      endTime?: Date | undefined;     // ✅ null 허용
      detail?: string;
    };

    post?: Post;
    userId?: string;
    nickname?: string;
  };
  PlaceDetail: { place: KakaoPlace };

  // 신청 관련
  Applications: { postId: string; userId?: string; nickname?: string };
  MyApplicationList: { userId: string };
  CreatedPosts: { userId: string };   // ✅ 추가
  JoinedPosts: { userId: string };    // ✅ 추가
  // 프로필
  Profile: { userId: string };
  MyProfile: { userId: string };

  // (미사용이면 유지만)
  Chat: undefined;
};
