import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export type UserRole = "employee" | "manager" | "finance" | "admin";

interface User {
  id: number;
  username: string;
  name: string;
  role: UserRole;
  department: string;
  designation: string;
  branch: string;
  eCode: string;
  band: string;
  businessUnit: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/users/me", {
          credentials: "include",
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // For demo purposes, auto-login as employee
          const demoUser = {
            id: 4,
            username: "employee",
            name: "John Doe",
            role: "employee" as UserRole,
            department: "Engineering",
            designation: "Software Engineer",
            branch: "Main Branch",
            eCode: "E004",
            band: "B2",
            businessUnit: "Technology",
          };
          setUser(demoUser);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        // For demo, use default user
        const demoUser = {
          id: 4,
          username: "employee",
          name: "John Doe",
          role: "employee" as UserRole,
          department: "Engineering",
          designation: "Software Engineer",
          branch: "Main Branch",
          eCode: "E004",
          band: "B2",
          businessUnit: "Technology",
        };
        setUser(demoUser);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await apiRequest("POST", "/api/auth/login", { username, password });
      const userData = await response.json();
      setUser(userData);
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.name}!`,
      });
      return true;
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  const switchRole = (role: UserRole) => {
    if (!user) return;
    
    // Role mapping to user data
    const roleMap: Record<UserRole, Partial<User>> = {
      employee: {
        id: 4,
        username: "employee",
        name: "John Doe",
        role: "employee",
        department: "Engineering",
        designation: "Software Engineer",
        band: "B2",
      },
      manager: {
        id: 3,
        username: "manager",
        name: "John Manager",
        role: "manager",
        department: "Engineering",
        designation: "Engineering Manager",
        band: "B3",
      },
      finance: {
        id: 2,
        username: "finance",
        name: "Finance Manager",
        role: "finance",
        department: "Finance",
        designation: "Finance Manager",
        band: "B4",
      },
      admin: {
        id: 1,
        username: "admin",
        name: "Admin User",
        role: "admin",
        department: "Administration",
        designation: "Admin Manager",
        band: "B5",
      },
    };
    
    // Update user with the role's data, keeping other fields
    setUser((prevUser) => ({
      ...prevUser!,
      ...roleMap[role],
    }));
    
    toast({
      title: "Role switched",
      description: `You are now viewing as ${role.charAt(0).toUpperCase() + role.slice(1)}`,
    });
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useUser() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
