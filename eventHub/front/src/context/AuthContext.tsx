import { createContext, useState, useEffect } from "react";
import getRole from "../utils/auth";

interface AuthContextType {
  role: string | null;
  setRole: (role: string | null) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
      const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    getRole().then((r) => setRole(r));
  }, []);

  return (
    <AuthContext.Provider value={{ role, setRole }}>
      {children}
    </AuthContext.Provider>
  );
}
