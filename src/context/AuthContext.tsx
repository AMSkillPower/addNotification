import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, AuthContextType, Task } from '../types';
import { authService } from '../services/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Controlla se c'è un utente salvato nel localStorage
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Errore nel parsing dei dati utente salvati:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      const userData = await authService.login(credentials);
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('currentUser', JSON.stringify(userData));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Errore durante il login:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
  };

  const canModifyTask = (task: Task): boolean => {
    if (!user) return false;
    
    // Gli utenti Main possono modificare tutti i task
    if (user.role === 'Admin') return true;
    
    // Gli utenti User possono modificare solo i propri task
    return task.createdBy === user.id;
  };

  const contextValue: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated,
    canModifyTask,
  };

  return (
    <AuthContext.Provider value={contextValue}>
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