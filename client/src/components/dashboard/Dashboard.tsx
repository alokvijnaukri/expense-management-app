import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { PlusIcon, CoinsIcon, ClockIcon, CheckIcon, XIcon } from "lucide-react";
import StatCard from "./StatCard";
import RecentClaims from "./RecentClaims";
import ExpenseBreakdown from "./ExpenseBreakdown";
import ApprovalTimeline from "./ApprovalTimeline";
import { Button } from "@/components/ui/button";
import { ClaimStatus } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  const { data: claims, isLoading } = useQuery({
    queryKey: ["/api/claims"],
    queryFn: async () => {
      const res = await fetch("/api/claims");
      if (!res.ok) throw new Error("Failed to fetch claims");
      const data = await res.json();
      console.log("Dashboard claims response:", data);
      // Check the first claim to log its status value
      if (data && data.length > 0) {
        console.log("First claim status:", data[0].status);
        console.log("Status comparison:", data[0].status === ClaimStatus.APPROVED);
        console.log("ClaimStatus values:", ClaimStatus);
      }
      return data;
    },
    enabled: true,
    refetchOnWindowFocus: true, 
    refetchOnMount: true,
    refetchInterval: 5000, // Refetch data every 5 seconds
  });

  const handleNewClaim = () => {
    navigate("/new-claim");
  };

  // Calculate stats from claims data
  const stats = React.useMemo(() => {
    if (!claims) return {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      pendingCount: 0,
      approvedCount: 0,
      rejectedCount: 0
    };

    // Fixed the status comparison issue by using lowercase values
    const pending = claims.filter((claim: any) => claim.status === "pending");
    const approved = claims.filter((claim: any) => claim.status === "approved" || claim.status === "paid");
    const rejected = claims.filter((claim: any) => claim.status === "rejected");

    return {
      total: claims.reduce((sum: number, claim: any) => sum + (claim.totalAmount || 0), 0),
      pending: pending.reduce((sum: number, claim: any) => sum + (claim.totalAmount || 0), 0),
      approved: approved.reduce((sum: number, claim: any) => sum + (claim.approvedAmount || claim.totalAmount || 0), 0),
      rejected: rejected.reduce((sum: number, claim: any) => sum + (claim.totalAmount || 0), 0),
      pendingCount: pending.length,
      approvedCount: approved.length,
      rejectedCount: rejected.length
    };
  }, [claims]);

  return (
    <div className="p-6 bg-subtle-gradient min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 pb-6 border-b border-border/20">
        <div>
          <h2 className="text-4xl font-bold text-gradient leading-tight">
            Welcome back, {user?.name?.split(" ")[0] || "User"}!
          </h2>
          <p className="text-muted-foreground mt-3 text-lg max-w-xl">
            Here's an overview of your expense claims and approvals
          </p>
        </div>
        <div className="mt-6 md:mt-0">
          <Button
            onClick={handleNewClaim}
            className="btn-gradient shadow-md px-6 py-6 rounded-xl text-base"
            size="lg"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Claim
          </Button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Claims"
          amount={stats.total}
          icon={<CoinsIcon className="h-5 w-5 text-white" />}
          iconBgColor="bg-gradient-to-br from-primary to-primary/80"
          footer={
            <>
              <span className="text-emerald-500 flex items-center font-medium">
                <i className="ri-arrow-up-line mr-1"></i>12%
              </span>
              <span className="text-muted-foreground ml-2">from last month</span>
            </>
          }
        />

        <StatCard
          title="Pending Approval"
          amount={stats.pending}
          icon={<ClockIcon className="h-5 w-5 text-white" />}
          iconBgColor="bg-gradient-to-br from-amber-400 to-amber-500"
          footer={
            <span className="text-muted-foreground/90 font-medium">
              {stats.pendingCount} claims awaiting approval
            </span>
          }
        />

        <StatCard
          title="Approved"
          amount={stats.approved}
          icon={<CheckIcon className="h-5 w-5 text-white" />}
          iconBgColor="bg-gradient-to-br from-emerald-400 to-emerald-500"
          footer={
            <span className="text-muted-foreground/90 font-medium">
              {stats.approvedCount} claims approved
            </span>
          }
        />

        <StatCard
          title="Rejected"
          amount={stats.rejected}
          icon={<XIcon className="h-5 w-5 text-white" />}
          iconBgColor="bg-gradient-to-br from-red-400 to-red-500"
          footer={
            <>
              <span className="text-red-500 flex items-center font-medium">
                <i className="ri-arrow-down-line mr-1"></i>
                {stats.rejectedCount}
              </span>
              <span className="text-muted-foreground ml-2">claims rejected</span>
            </>
          }
        />
      </div>

      {/* Section Title */}
      <div className="mb-8 mt-10">
        <h3 className="text-xl font-semibold">Claim Activity</h3>
        <div className="h-1 w-20 bg-gradient-to-r from-primary to-primary/40 rounded mt-2"></div>
      </div>
      
      {/* Recent Claims */}
      <RecentClaims />

      {/* Section Title */}
      <div className="mb-8 mt-12">
        <h3 className="text-xl font-semibold">Analytics & Insights</h3>
        <div className="h-1 w-20 bg-gradient-to-r from-primary to-primary/40 rounded mt-2"></div>
      </div>
      
      {/* Claim Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <ExpenseBreakdown />
        <ApprovalTimeline />
      </div>
    </div>
  );
}
