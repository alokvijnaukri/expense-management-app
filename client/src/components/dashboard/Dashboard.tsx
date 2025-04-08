import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/components/auth/UserProvider";
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
  const { user } = useUser();
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  const { data: claims, isLoading } = useQuery({
    queryKey: ["/api/claims", user?.id],
    enabled: !!user?.id,
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

    const pending = claims.filter((claim: any) => claim.status === ClaimStatus.SUBMITTED);
    const approved = claims.filter((claim: any) => claim.status === ClaimStatus.APPROVED || claim.status === ClaimStatus.PAID);
    const rejected = claims.filter((claim: any) => claim.status === ClaimStatus.REJECTED);

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
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-700">
            Welcome back, {user?.name?.split(" ")[0] || "User"}!
          </h2>
          <p className="text-neutral-500 mt-1">
            Here's an overview of your expense claims
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button
            onClick={handleNewClaim}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            New Claim
          </Button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Claims"
          amount={stats.total}
          icon={<CoinsIcon className="h-5 w-5 text-primary" />}
          iconBgColor="bg-primary bg-opacity-10"
          footer={
            <>
              <span className="text-secondary flex items-center">
                <i className="ri-arrow-up-line mr-1"></i>12%
              </span>
              <span className="text-neutral-500 ml-2">from last month</span>
            </>
          }
        />

        <StatCard
          title="Pending Approval"
          amount={stats.pending}
          icon={<ClockIcon className="h-5 w-5 text-warning" />}
          iconBgColor="bg-warning bg-opacity-10"
          footer={
            <span className="text-neutral-500">
              {stats.pendingCount} claims awaiting approval
            </span>
          }
        />

        <StatCard
          title="Approved"
          amount={stats.approved}
          icon={<CheckIcon className="h-5 w-5 text-secondary" />}
          iconBgColor="bg-secondary bg-opacity-10"
          footer={
            <span className="text-neutral-500">
              {stats.approvedCount} claims approved
            </span>
          }
        />

        <StatCard
          title="Rejected"
          amount={stats.rejected}
          icon={<XIcon className="h-5 w-5 text-danger" />}
          iconBgColor="bg-danger bg-opacity-10"
          footer={
            <>
              <span className="text-danger flex items-center">
                <i className="ri-arrow-down-line mr-1"></i>
                {stats.rejectedCount}
              </span>
              <span className="text-neutral-500 ml-2">claims rejected</span>
            </>
          }
        />
      </div>

      {/* Recent Claims */}
      <RecentClaims />

      {/* Claim Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ExpenseBreakdown />
        <ApprovalTimeline />
      </div>
    </div>
  );
}
