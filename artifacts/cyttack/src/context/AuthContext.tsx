import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Role = "SOC Analyst" | "CISO" | null;

interface AuthContextType {
  role: Role;
  setRole: (role: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(() => {
    const saved = localStorage.getItem("cyttack_role") as Role;
    return saved || "SOC Analyst";
  });

  useEffect(() => {
    const saved = localStorage.getItem("cyttack_role") as Role;
    if (saved) {
      setRoleState(saved);
    } else {
      localStorage.setItem("cyttack_role", "SOC Analyst");
    }
  }, []);

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    if (newRole) {
      localStorage.setItem("cyttack_role", newRole);
    } else {
      localStorage.removeItem("cyttack_role");
    }
  };

  const logout = () => {
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ role, setRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
