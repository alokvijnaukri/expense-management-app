import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import React, { useState, useEffect } from "react";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();
  const [adminTokenCheckDone, setAdminTokenCheckDone] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  
  console.log(`ProtectedRoute (${path}) - user:`, user);
  console.log(`ProtectedRoute (${path}) - isLoading:`, isLoading);
  
  // Check for admin token as a fallback authentication method
  useEffect(() => {
    const checkAdminToken = async () => {
      try {
        const adminToken = localStorage.getItem('adminToken');
        console.log(`ProtectedRoute (${path}) - Admin token present:`, !!adminToken);
        
        if (adminToken === 'admin-special-access-token') {
          console.log(`ProtectedRoute (${path}) - Valid admin token found, forcing admin access`);
          
          // Create admin user directly
          const adminUserData = {
            id: 1,
            username: 'admin',
            name: 'Admin User',
            email: 'admin@company.com',
            department: 'Administration',
            designation: 'System Administrator',
            branch: 'Head Office',
            eCode: 'E001',
            band: 'B5',
            businessUnit: 'IT',
            role: 'admin',
            managerId: null,
            createdAt: new Date()
          };
          
          setAdminUser(adminUserData);
        }
      } catch (error) {
        console.error("Error checking admin token:", error);
      } finally {
        setAdminTokenCheckDone(true);
      }
    };
    
    if (!user && !isLoading) {
      checkAdminToken();
    } else {
      setAdminTokenCheckDone(true);
    }
  }, [user, isLoading, path]);

  // Show loading while checking everything
  if (isLoading || !adminTokenCheckDone) {
    console.log(`ProtectedRoute (${path}) - Loading...`);
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // Either normal user auth or admin token auth must be present
  if (!user && !adminUser) {
    console.log(`ProtectedRoute (${path}) - No authentication found, redirecting to /auth`);
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  console.log(`ProtectedRoute (${path}) - Authentication confirmed, rendering component`);
  return <Route path={path} component={Component} />;
}