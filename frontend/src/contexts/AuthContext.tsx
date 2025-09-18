import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { userApi } from '../api/userApi';
import type { UserProfile } from '../api/userApi';

interface AuthContextType {
  user: UserProfile | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (userData: UserProfile) => void;
  logout: () => void;
  updateUser: (userData: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      console.log('AuthContext - Token found:', !!token); // Debug log
      if (token) {
        try {
          console.log('AuthContext - Fetching user profile...'); // Debug log
          const userData = await userApi.getProfile();
          console.log('AuthContext - User data received:', userData); // Debug log
          setUser(userData);
          setIsLoggedIn(true);
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          localStorage.removeItem('token');
          setIsLoggedIn(false);
          setUser(null);
        }
      } else {
        console.log('AuthContext - No token found'); // Debug log
        setIsLoggedIn(false);
        setUser(null);
      }
      setIsLoading(false);
    };

    checkAuth();

    // Listen for storage changes to handle token removal from other tabs or axios interceptor
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' && e.newValue === null) {
        setIsLoggedIn(false);
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = (userData: UserProfile) => {
    setUser(userData);
    setIsLoggedIn(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsLoggedIn(false);
  };

  const updateUser = (userData: UserProfile) => {
    setUser(userData);
  };

  const value = {
    user,
    isLoggedIn,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};