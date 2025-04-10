import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();
  console.log(`ProtectedRoute (${path}) - user:`, user);
  console.log(`ProtectedRoute (${path}) - isLoading:`, isLoading);

  if (isLoading) {
    console.log(`ProtectedRoute (${path}) - Loading...`);
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    console.log(`ProtectedRoute (${path}) - Redirecting to /auth`);
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  console.log(`ProtectedRoute (${path}) - Rendering component`);
  return <Route path={path} component={Component} />;
}