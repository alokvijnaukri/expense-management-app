import { Switch, Route } from "wouter";
import NotFound from "@/pages/not-found";
import AppLayout from "@/components/layout/AppLayout";
import Home from "@/pages/home";
import NewClaim from "@/pages/new-claim";
import PendingClaims from "@/pages/pending-claims";
import ApprovedClaims from "@/pages/approved-claims";
import RejectedClaims from "@/pages/rejected-claims";
import ApprovalQueue from "@/pages/approval-queue";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import Profile from "@/pages/profile";
import AuthPage from "@/pages/auth-page";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { useAuth } from "@/hooks/use-auth";

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user } = useAuth();
  
  return (
    <>
      {user ? (
        <AppLayout>
          <RoutesWithAuth />
        </AppLayout>
      ) : (
        <Routes />
      )}
    </>
  );
}

function RoutesWithAuth() {
  const { user } = useAuth();
  const isManager = user?.role === "manager" || user?.role === "finance" || user?.role === "admin";
  const isFinance = user?.role === "finance" || user?.role === "admin";
  const isAdmin = user?.role === "admin";

  return (
    <Switch>
      {/* Auth route */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Protected routes */}
      <ProtectedRoute path="/" component={Home} />
      <ProtectedRoute path="/new-claim" component={NewClaim} />
      <ProtectedRoute path="/new-claim/:type" component={NewClaim} />
      <ProtectedRoute path="/pending-claims" component={PendingClaims} />
      <ProtectedRoute path="/approved-claims" component={ApprovedClaims} />
      <ProtectedRoute path="/rejected-claims" component={RejectedClaims} />
      <ProtectedRoute path="/profile" component={Profile} />
      <ProtectedRoute path="/settings" component={Settings} />
      
      {/* Role-restricted routes */}
      {isManager && <ProtectedRoute path="/approval-queue" component={ApprovalQueue} />}
      {isFinance && <ProtectedRoute path="/reports" component={Reports} />}
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function Routes() {
  return (
    <Switch>
      {/* Auth route */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Protected routes - redirect to auth */}
      <ProtectedRoute path="/" component={Home} />
      <ProtectedRoute path="/new-claim" component={NewClaim} />
      <ProtectedRoute path="/new-claim/:type" component={NewClaim} />
      <ProtectedRoute path="/pending-claims" component={PendingClaims} />
      <ProtectedRoute path="/approved-claims" component={ApprovedClaims} />
      <ProtectedRoute path="/rejected-claims" component={RejectedClaims} />
      <ProtectedRoute path="/profile" component={Profile} />
      <ProtectedRoute path="/approval-queue" component={ApprovalQueue} />
      <ProtectedRoute path="/reports" component={Reports} />
      <ProtectedRoute path="/settings" component={Settings} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

export default App;
