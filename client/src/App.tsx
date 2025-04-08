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
import { useUser, UserProvider } from "./components/auth/UserProvider";

function Router() {
  const { user } = useUser();
  const isManager = user?.role === "manager" || user?.role === "finance" || user?.role === "admin";
  const isFinance = user?.role === "finance" || user?.role === "admin";
  const isAdmin = user?.role === "admin";

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/new-claim" component={NewClaim} />
      <Route path="/new-claim/:type" component={NewClaim} />
      <Route path="/pending-claims" component={PendingClaims} />
      <Route path="/approved-claims" component={ApprovedClaims} />
      <Route path="/rejected-claims" component={RejectedClaims} />
      
      {/* Role-restricted routes */}
      {isManager && <Route path="/approval-queue" component={ApprovalQueue} />}
      {isFinance && <Route path="/reports" component={Reports} />}
      {isAdmin && <Route path="/settings" component={Settings} />}
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <UserProvider>
      <AppLayout>
        <Router />
      </AppLayout>
    </UserProvider>
  );
}

export default App;
