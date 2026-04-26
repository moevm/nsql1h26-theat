import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch } from '../api/client';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  login: string;
  role: 'user' | 'manager' | 'admin';
}

interface AuthContextType {
  currentUser: User | null;
  login: (login: string, password: string) => Promise<boolean>;
  register: (firstName: string, lastName: string, login: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const saveCurrentUser = (user: User | null) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('accessToken');
    }
    window.dispatchEvent(new Event('auth-changed'));
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const savedUser = localStorage.getItem('currentUser');

    if (!token || !savedUser) {
      return;
    }

    setCurrentUser(JSON.parse(savedUser) as User);

    apiFetch<User>('/auth/me')
      .then((user) => {
        setCurrentUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
      })
      .catch(() => {
        saveCurrentUser(null);
      });
  }, []);

  const login = async (loginValue: string, password: string): Promise<boolean> => {
    try {
      const response = await apiFetch<{ access_token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ login: loginValue, password }),
      });

      localStorage.setItem('accessToken', response.access_token);
      saveCurrentUser(response.user);
      return true;
    } catch (error) {
      return false;
    }
  };

  const register = async (): Promise<boolean> => {
    return false;
  };

  const logout = () => {
    saveCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        register,
        logout,
        isAuthenticated: currentUser !== null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
