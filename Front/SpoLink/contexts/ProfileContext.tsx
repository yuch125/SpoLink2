// contexts/ProfileContext.tsx
import React, { createContext, useContext, useState } from 'react';

type Profile = {
  userId: string;
  nickname: string;
};

type ProfileContextType = {
  profile: Profile;
  
  setProfile: (profile: Profile) => void;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider = ({ children }: { children: React.ReactNode }) => {
  console.log('✅ ProfileProvider 렌더됨');
  const [profile, setProfile] = useState<Profile>({ userId: '', nickname: '' });
  return (
    <ProfileContext.Provider value={{ profile, setProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile must be used within a ProfileProvider');
  return context;
};
