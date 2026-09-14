import { createContext, useContext, useState, type ReactNode } from "react";
import { api } from "@/lib/api";

interface AuthContextValue {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem("tww_token")
  );

  const login = async (username: string, password: string) => {
    const { access_token } = await api.login(username, password);
    localStorage.setItem("tww_token", access_token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("tww_token");
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
