import { createContext, useContext, useMemo, useState } from 'react';
import api, { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  async function login(username, password) {
    try {
      const { data } = await api.post('/auth/login', {
        username,
        password,
      });

      localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
      setUser(data.user);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      isLoggedIn: Boolean(user),
      login,
      logout,
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used inside AuthProvider');
  }
  return context;
}
