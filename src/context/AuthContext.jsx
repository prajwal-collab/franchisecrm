import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usersDB } from '../services/db';

const AuthContext = createContext(null);

const SESSION_KEY = 'ej_session';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); }
    catch { return null; }
  });

  const login = useCallback(async (email, password) => {
    try {
      const user = await usersDB.authenticate(email, password);
      if (user) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
        setCurrentUser(user);
        return user;
      }
    } catch (err) {
      console.error('Login Error:', err);
    }
    return null;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
  }, []);

  // Permissions helper
  const can = useCallback((action) => {
    if (!currentUser) return false;
    const role = currentUser.role;
    const perms = {
      Admin: ['read', 'create', 'edit', 'delete', 'manage_users', 'view_all', 'close_won', 'export', 'import'],
      Closer: ['read', 'create', 'edit', 'view_all', 'close_won', 'export', 'import'],
      SDR: ['read', 'create', 'edit', 'export'],
      Viewer: ['read', 'export'],
    };
    return (perms[role] || []).includes(action);
  }, [currentUser]);

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
