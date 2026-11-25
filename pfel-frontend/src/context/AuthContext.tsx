// File: src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Utilisateur, Role } from '../types';
import { login as apiLogin, getProfile } from '../api/services';

export interface LoginRequest {
  email: string;
  mot_de_passe?: string;
  password?: string;
}

interface AuthContextType {
  token: string | null;
  role: Role | null;
  user: Utilisateur | null;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}

const normalizeRole = (r?: string | null): Role | null => {
  if (!r) return null;
  return r.toUpperCase() as Role;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [role, setRole] = useState<Role | null>(
    normalizeRole(localStorage.getItem('role'))
  );
  const [user, setUser] = useState<Utilisateur | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (token) {
        try {
          const profile = await getProfile();
          const normalized = normalizeRole(profile.role) ?? normalizeRole(localStorage.getItem('role'));
          setUser(profile);
          setRole(normalized);
          if (normalized) {
            localStorage.setItem('role', normalized);
          }
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
    const normalized = normalizeRole(data.role);
    localStorage.setItem('token', data.token);
    if (normalized) {
      localStorage.setItem('role', normalized);
    }
    setToken(data.token);
    setRole(normalized);

    // Fetch profile immediately after login
    const profile = await getProfile();
    setUser(profile);
    const profileRole = normalizeRole(profile.role) ?? normalized;
    if (profileRole) {
      setRole(profileRole);
      localStorage.setItem('role', profileRole);
    }
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
