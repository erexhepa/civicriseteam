import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'civicrise_user';

export interface User {
  id: string;
  name: string;
  email: string;
  zipCode?: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, zipCode: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function saveUser(user: User | null) {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUser(loadUser());
    setIsLoading(false);
  }, []);

  const signIn = useCallback(async (email: string, _password: string) => {
    setIsLoading(true);
    const existing = loadUser();
    if (existing && existing.email === email) {
      setUser(existing);
    } else {
      const newUser: User = {
        id: crypto.randomUUID(),
        name: email.split('@')[0] || 'User',
        email,
        zipCode: undefined,
      };
      setUser(newUser);
      saveUser(newUser);
    }
    setIsLoading(false);
  }, []);

  const signUp = useCallback(
    async (name: string, email: string, _password: string, zipCode: string) => {
      setIsLoading(true);
      const newUser: User = {
        id: crypto.randomUUID(),
        name,
        email,
        zipCode,
      };
      setUser(newUser);
      saveUser(newUser);
      setIsLoading(false);
    },
    []
  );

  const signOut = useCallback(() => {
    setUser(null);
    saveUser(null);
  }, []);

  const value: AuthContextValue = {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

export function useOptionalAuth(): AuthContextValue | null {
  return useContext(AuthContext);
}
