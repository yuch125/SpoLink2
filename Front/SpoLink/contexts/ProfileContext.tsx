import React, { createContext, useContext, useState } from 'react';

type Profile = {
  userId: string;
  nickname: string;
  bio: string;
  ageGroup: string;
  trustScore: number;
  remainingNicknameChanges: number;
};

type ProfileContextType = {
  profile: Profile | null;
  setProfile: (update: Partial<Profile>) => void;
  clearProfile: () => void;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider = ({ children }: { children: React.ReactNode }) => {
  const [profile, setProfileState] = useState<Profile | null>(null);

  const setProfile = (update: Partial<Profile>) => {
    setProfileState(prev => {
      // 초기 상태라면 강제로 타입캐스팅하거나 기본값 적용 필요
      if (!prev) {
        return {
          userId: update.userId ?? '',
          nickname: update.nickname ?? '',
          bio: update.bio ?? '',
          ageGroup: update.ageGroup ?? '기타',
          trustScore: update.trustScore ?? 0,
          remainingNicknameChanges: update.remainingNicknameChanges ?? 3,
        };
      }

      return {
        ...prev,
        ...update,
      };
    });
  };

  const clearProfile = () => {
    setProfileState(null);
  };

  return (
    <ProfileContext.Provider value={{ profile, setProfile, clearProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile must be used within a ProfileProvider');
  return context;
};
