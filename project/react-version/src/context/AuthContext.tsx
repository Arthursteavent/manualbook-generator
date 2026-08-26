import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatar?: string;
}

export interface UserAccount {
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  addUser: (name: string, email: string, password: string, role?: string) => Promise<{ success: boolean; message?: string }>;
  listUsers: () => UserAccount[];
  deleteUser: (email: string) => Promise<boolean>;
  logout: () => void;
}

const STORAGE_KEY_USER = 'manualarch_auth_user';
const STORAGE_KEY_USERS_DB = 'manualarch_users_db';

const DEFAULT_USERS: Record<string, { name: string; password: string; role: string }> = {
  'admin@manualarch.com': {
    name: 'Administrator',
    password: 'password123',
    role: 'Admin',
  },
  'user@manualarch.com': {
    name: 'Standard User',
    password: 'user123',
    role: 'Editor',
  },
  'viewer@manualarch.com': {
    name: 'Viewer User',
    password: 'viewer123',
    role: 'Viewer',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [usersCache, setUsersCache] = useState<UserAccount[]>([]);

  // Ensure initial local fallback users DB exists
  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY_USERS_DB)) {
      localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(DEFAULT_USERS));
    }
  }, []);

  // Fetch remote users list from MySQL backend
  const fetchRemoteUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/users');
      if (res.ok) {
        const data = await res.json();
        if (data.users && Array.isArray(data.users)) {
          const formatted: UserAccount[] = data.users.map((u: any) => ({
            email: u.email,
            name: u.name,
            role: u.role || 'Editor',
          }));
          setUsersCache(formatted);
          return formatted;
        }
      }
    } catch {
      // Ignore remote fetch error
    }

    // Fallback to local storage
    try {
      const raw = localStorage.getItem(STORAGE_KEY_USERS_DB);
      const db = raw ? JSON.parse(raw) : DEFAULT_USERS;
      const local: UserAccount[] = Object.entries(db).map(([email, info]: [string, any]) => ({
        email,
        name: info.name,
        role: info.role || 'Editor',
      }));
      setUsersCache(local);
      return local;
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    fetchRemoteUsers();
  }, [fetchRemoteUsers]);

  const login = useCallback(async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Try MySQL backend API login
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'ok' && data.user) {
        const loggedUser: User = data.user;
        setUser(loggedUser);
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(loggedUser));
        return { success: true };
      } else if (res.status === 400 && data.error) {
        // Explicit password error from MySQL DB
        return { success: false, message: data.error };
      }
    } catch (e) {
      console.warn('[Auth] MySQL API login unavailable, falling back to local auth:', e);
    }

    // 2. Local fallback check
    await new Promise((r) => setTimeout(r, 300));
    let usersDb = DEFAULT_USERS;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_USERS_DB);
      if (raw) usersDb = JSON.parse(raw);
    } catch {
      // fallback
    }

    const found = usersDb[cleanEmail];
    if (!found) {
      return { success: false, message: 'Email tidak terdaftar.' };
    }

    if (found.password !== password) {
      return { success: false, message: 'Password salah.' };
    }

    const loggedUser: User = {
      id: `usr_${Date.now()}`,
      name: found.name,
      email: cleanEmail,
      role: found.role || 'Editor',
    };

    setUser(loggedUser);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(loggedUser));
    return { success: true };
  }, []);

  const addUser = useCallback(
    async (name: string, email: string, password: string, role: string = 'Editor') => {
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name.trim();

      if (!cleanEmail || !password || !cleanName) {
        return { success: false, message: 'Mohon isi semua field (Nama, Email, Password).' };
      }

      // 1. Try MySQL backend API
      try {
        const res = await fetch('/api/auth/add-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: cleanName, email: cleanEmail, password, role }),
        });
        const data = await res.json();
        if (res.ok && data.status === 'ok') {
          await fetchRemoteUsers();
          return { success: true, message: data.message };
        } else if (data.error) {
          return { success: false, message: data.error };
        }
      } catch (e) {
        console.warn('[Auth] MySQL API add-user unavailable, using local fallback:', e);
      }

      // 2. Local storage fallback
      let usersDb: Record<string, { name: string; password: string; role: string }> = { ...DEFAULT_USERS };
      try {
        const raw = localStorage.getItem(STORAGE_KEY_USERS_DB);
        if (raw) usersDb = JSON.parse(raw);
      } catch {
        // fallback
      }

      if (usersDb[cleanEmail]) {
        return { success: false, message: 'Email tersebut sudah terdaftar dalam sistem.' };
      }

      usersDb[cleanEmail] = {
        name: cleanName,
        password: password,
        role: role || 'Editor',
      };

      localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(usersDb));
      await fetchRemoteUsers();
      return { success: true };
    },
    [fetchRemoteUsers],
  );

  const listUsers = useCallback((): UserAccount[] => {
    return usersCache.length > 0 ? usersCache : Object.entries(DEFAULT_USERS).map(([email, info]) => ({
      email,
      name: info.name,
      role: info.role,
    }));
  }, [usersCache]);

  const deleteUser = useCallback(
    async (emailToDelete: string): Promise<boolean> => {
      const cleanEmail = emailToDelete.trim().toLowerCase();

      // 1. Try MySQL API
      try {
        await fetch('/api/auth/delete-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail }),
        });
      } catch {
        // Ignore API failure
      }

      // 2. Update local fallback storage
      try {
        const raw = localStorage.getItem(STORAGE_KEY_USERS_DB);
        const db = raw ? JSON.parse(raw) : { ...DEFAULT_USERS };
        if (db[cleanEmail]) {
          delete db[cleanEmail];
          localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(db));
        }
      } catch {
        // ignore
      }

      await fetchRemoteUsers();
      return true;
    },
    [fetchRemoteUsers],
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY_USER);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        addUser,
        listUsers,
        deleteUser,
        logout,
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
