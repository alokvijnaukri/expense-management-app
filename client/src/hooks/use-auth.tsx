import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User, UserRoles } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null | undefined;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
  adminUser: User | null; // Add admin user from localStorage
};

type LoginData = {
  username: string;
  password: string;
};

type RegisterData = {
  username: string;
  password: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  branch: string;
  eCode: string;
  band: string;
  businessUnit: string;
  role: string;
  managerId?: number | null;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [adminUser, setAdminUser] = useState<User | null>(null);
  
  // Check for admin token in localStorage
  useEffect(() => {
    const checkAdminToken = () => {
      try {
        const adminToken = localStorage.getItem('adminToken');
        if (adminToken === 'admin-special-access-token') {
          console.log("AuthProvider - Admin token found, creating admin user");
          const adminData: User = {
            id: 1,
            username: 'admin',
            password: '', // Add empty password to satisfy type
            name: 'Admin User',
            email: 'admin@company.com',
            department: 'Administration',
            designation: 'System Administrator',
            branch: 'Head Office',
            eCode: 'E001',
            band: 'B5',
            businessUnit: 'IT',
            role: UserRoles.ADMIN,
            managerId: null,
            createdAt: new Date()
          };
          setAdminUser(adminData);
        }
      } catch (error) {
        console.error("Error checking admin token in AuthProvider:", error);
      }
    };
    
    checkAdminToken();
  }, []);
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    select: (data) => data || null,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      const userData = await res.json();
      console.log("Login API response:", userData);
      return userData;
    },
    onSuccess: (data: User) => {
      console.log("Login successful, setting user data:", data);
      // Invalidate the query cache to force a refetch
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      // Also set the data directly
      queryClient.setQueryData(["/api/user"], data);
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.name}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: (data: User) => {
      queryClient.setQueryData(["/api/user"], data);
      toast({
        title: "Registration successful",
        description: "Your account has been created",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      // Clear user data from cache
      queryClient.setQueryData(["/api/user"], null);
      // Also invalidate the query to force a refetch next time
      queryClient.invalidateQueries({queryKey: ["/api/user"]});
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      
      // Force navigate to auth page (this will be picked up by the components)
      window.location.href = "/auth";
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Use either normal user or admin user from token
  const effectiveUser = user || adminUser;
  
  return (
    <AuthContext.Provider
      value={{
        user: effectiveUser,
        adminUser,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}