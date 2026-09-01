import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/tcg';

interface AuthContextType {
  currentUser: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    age: number;
    avatarUrl?: string;
    bio?: string;
    hobbies?: string[];
    interests?: string[];
    favoriteActivities?: string[];
    locationArea?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<User>;
  resetPassword: (email: string, newPassword: string) => Promise<string>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'tcg_friends_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(true);

  // Initial session restoration on mount
  useEffect(() => {
    const initSession = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
          setToken(storedToken);
        } else {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setCurrentUser(null);
        }
      } catch (e) {
        console.error('Failed to restore session:', e);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
  }, []);

  const login = async (email: string, password: string) => {
    const cleanEmail = email.trim();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setCurrentUser(data.user);
  };

  const register = async (formData: {
    email: string;
    password: string;
    name: string;
    age: number;
    avatarUrl?: string;
    bio?: string;
    hobbies?: string[];
    interests?: string[];
    favoriteActivities?: string[];
    locationArea?: string;
  }) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setCurrentUser(data.user);
  };

  const logout = async () => {
    const currentToken = token || localStorage.getItem(TOKEN_KEY);
    if (currentToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${currentToken}` },
        });
      } catch (e) {
        console.error('Logout error', e);
      }
    }
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setCurrentUser(null);
  };

  const updateProfile = async (updates: Partial<User>): Promise<User> => {
    const currentToken = token || localStorage.getItem(TOKEN_KEY);
    if (!currentToken) throw new Error('Not authenticated');
    const res = await fetch('/api/users/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentToken}`,
      },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Profile update failed');
    }
    setCurrentUser(data.user);
    return data.user;
  };

  const resetPassword = async (email: string, newPassword: string): Promise<string> => {
    const cleanEmail = email.trim();
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Password reset failed');
    }
    return data.message;
  };

  const refetchUser = async () => {
    const currentToken = token || localStorage.getItem(TOKEN_KEY);
    if (currentToken) {
      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
        }
      } catch (e) {
        console.error('Refetch user error', e);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        resetPassword,
        refetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
