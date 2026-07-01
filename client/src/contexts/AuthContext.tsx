import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

import { api } from "../services/api";

interface User {
  id: string;

  name: string;

  email: string;

  cpf: string;

  role: "ADMIN" | "GESTOR" | "ENGENHEIRO" | "AUDITOR" | "FINANCEIRO";

  twoFactorEnabled: boolean;
}

interface AuthContextType {
  user: User | null;

  isLoading: boolean;

  isAuthenticated: boolean;

  login: (
    login: string,
    password: string,
    totpCode?: string
  ) => Promise<{ requiresTwoFactor?: boolean }>;

  register: (data: RegisterData) => Promise<void>;

  logout: () => Promise<void>;

  refreshUser: () => Promise<void>;
}

interface RegisterData {
  name: string;

  cpf: string;

  email: string;

  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");

      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (login: string, password: string, totpCode?: string) => {
    const { data } = await api.post("/auth/login", {
      login,
      password,
      totpCode,
    });

    if (data.requiresTwoFactor) {
      return { requiresTwoFactor: true };
    }

    setUser(data.user);

    return {};
  };

  const register = async (registerData: RegisterData) => {
    await api.post("/auth/register", registerData);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,

        isLoading,

        isAuthenticated: !!user,

        login,

        register,

        logout,

        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }

  return context;
}
