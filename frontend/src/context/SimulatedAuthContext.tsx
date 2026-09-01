import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';

export type UserRole = 'ADMIN' | 'SUPERVISOR' | 'EMPLOYEE' | 'ESTABLISHMENT_OFFICER' | 'PAYROLL_OFFICER' | 'DEPARTMENT_OFFICER' | 'MANAGEMENT';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: 'ADMIN' | 'SUPERVISOR' | 'EMPLOYEE'; // Actual DB role
  employeeId?: string;
  employee?: {
    departmentId: string;
  };
}

interface AuthContextType {
  user: User | null;
  simulatedRole: UserRole;
  token: string | null;
  loading: boolean;
  initialLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [simulatedRole, setSimulatedRole] = useState<UserRole>('ADMIN');
  const [loading, setLoading] = useState(false);       // login mutation loading
  const [initialLoading, setInitialLoading] = useState(true); // page-refresh token check

  // Sync actual user from token on load
  useEffect(() => {
    const fetchMe = async () => {
      if (token) {
        try {
          const res = await apiClient.get('/auth/me');
          setUser(res.data);
          // Set initial simulated role based on real database role
          setSimulatedRole(res.data.role);
        } catch (err) {
          console.error('Invalid token, logging out', err);
          logout();
        }
      }
      setInitialLoading(false);
    };

    fetchMe();
  }, [token]);

  const login = async (phone: string, password: string) => {
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/login', { phone, password });
      const { accessToken, user } = res.data;

      localStorage.setItem('auth_token', accessToken);
      
      setToken(accessToken);
      setUser(user);
      setSimulatedRole(user.role);
    } catch (err: any) {
      setLoading(false);
      throw new Error(err.response?.data?.message || 'Login failed');
    }
    setLoading(false);
  };

  const logout = async () => {
    if (token) {
      try {
        await apiClient.post('/auth/logout');
      } catch (e) {
        console.error('Logout request failed', e);
      }
    }
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  };

  const switchRole = (role: UserRole) => {
    setSimulatedRole(role);
  };

  return (
    <AuthContext.Provider value={{ user, simulatedRole, token, loading, initialLoading, login, logout, switchRole }}>
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

export const SimulatedAuthProvider = AuthProvider;
