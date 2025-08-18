import React, { createContext, useContext, useState } from 'react';

export type Profile = {
  userId: string;
  nickname: string;
  bio: string;
  age: string;  // 자유 입력 나이 필드
  trustScore: number;
  remainingNicknameChanges: number;
  profileImage?: string;
  ageGroup?: string;
  trust?: {
    grade: string;
    score: number;
    total: number;
    likes: number;
    dislikes: number;
  };
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
      if (!prev) {
        return {
          userId: update.userId ?? '',
          nickname: update.nickname ?? '',
          bio: update.bio ?? '',
          age: update.age ?? '',
          trustScore: update.trustScore ?? 0,
          profileImage: update.profileImage ?? '',
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
