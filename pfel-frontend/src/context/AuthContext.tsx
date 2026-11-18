// File: src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Utilisateur, Role, LoginRequest } from '../types';
import { login as apiLogin, getProfile } from '../api/services';

interface AuthContextType {
  token: string | null;
  role: Role | null;
  user: Utilisateur | null;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [role, setRole] = useState<Role | null>(
    (localStorage.getItem('role') as Role) || null
  );
  const [user, setUser] = useState<Utilisateur | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (token) {
        try {
          const profile = await getProfile();
          setUser(profile);
          setRole(profile.role);
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          logout();
        }
      }
      setIsLoading(false);
    };

    fetchUserProfile();
  }, [token]);

  const login = async (credentials: LoginRequest) => {
    const data = await apiLogin(credentials);
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role);
    setToken(data.token);
    setRole(data.role);
    
    // Fetch profile immediately after login
    const profile = await getProfile();
    setUser(profile);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setToken(null);
    setRole(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, role, user, isLoading, login, logout }}>
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
