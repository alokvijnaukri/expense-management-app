import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency, formatDate, getClaimTypeIcon } from "@/lib/utils";
import { Eye, Edit, CopyIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import ClaimDetailsModal from "@/components/claims/ClaimDetailsModal";

export default function RecentClaims() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [claimTypeFilter, setClaimTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("30");
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: claims, isLoading } = useQuery({
    queryKey: ["/api/claims"],
    queryFn: async () => {
      const res = await fetch("/api/claims");
      if (!res.ok) throw new Error("Failed to fetch claims");
      const data = await res.json();
      console.log("RecentClaims data:", data);
      return data;
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const handleViewClick = (claimId: string) => {
    // Find the claim by claimId
    const claimsArray = Array.isArray(claims) ? claims : [];
    const claim = claimsArray.find((c: any) => c.claimId === claimId);
    if (claim) {
      setSelectedClaim(claim);
      setIsModalOpen(true);
      toast({
        title: "Viewing Claim",
        description: `Details for claim ${claimId}`,
      });
    }
  };

  const handleEditClick = (claimId: string) => {
    toast({
      title: "Edit Claim",
      description: `Editing claim ${claimId}`,
    });
  };

  const handleCopyClick = (claimId: string) => {
    toast({
      title: "Copy Claim",
      description: `Creating a copy of claim ${claimId}`,
    });
  };

  const getIconForClaimType = (type: string) => {
    const iconName = getClaimTypeIcon(type);
    // This maps to Lucide icons that match Remix icon names from the design
    const iconMap: Record<string, React.ReactNode> = {
      plane: <span className="ri-plane-line text-primary mr-2"></span>,
      gift: <span className="ri-gift-line text-primary mr-2"></span>,
      taxi: <span className="ri-taxi-line text-primary mr-2"></span>,
      smartphone: <span className="ri-smartphone-line text-primary mr-2"></span>,
      home: <span className="ri-home-line text-primary mr-2"></span>,
      "file-list-3": <span className="ri-file-list-3-line text-primary mr-2"></span>,
    };
    return iconMap[iconName] || <span className="ri-file-line text-primary mr-2"></span>;
  };

  // Filter and sort claims
  const claimsArray = Array.isArray(claims) ? claims : [];
  const filteredClaims = claimsArray
    .filter(
      (claim: any) =>
        claimTypeFilter === "all" || claim.type === claimTypeFilter
    )
    .sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  return (
    <div className="gradient-card mb-8">
      {/* Claim Details Modal */}
      <ClaimDetailsModal 
        claim={selectedClaim} 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
      />

      <div className="p-6 border-b border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <h3 className="text-lg font-bold text-gradient">
            Recent Claims
          </h3>
          <div className="mt-2 sm:mt-0 flex">
            <div className="relative">
              <Select
                defaultValue="all"
                onValueChange={setClaimTypeFilter}
              >
                <SelectTrigger className="glass-card bg-background/50 border-border/40 text-sm h-9 w-36">
                  <SelectValue placeholder="All Claims" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Claims</SelectItem>
                  <SelectItem value="travel">Travel</SelectItem>
                  <SelectItem value="business_promotion">Business Promotion</SelectItem>
                  <SelectItem value="conveyance">Conveyance</SelectItem>
                  <SelectItem value="mobile_bill">Mobile Bill</SelectItem>
                  <SelectItem value="relocation">Relocation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="relative ml-2">
              <Select
                defaultValue="30"
                onValueChange={setDateFilter}
              >
                <SelectTrigger className="glass-card bg-background/50 border-border/40 text-sm h-9 w-36">
                  <SelectValue placeholder="Last 30 Days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="90">Last Quarter</SelectItem>
                  <SelectItem value="365">Last Year</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border/30">
          <thead className="bg-subtle-gradient">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider"
              >
                Claim ID
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider"
              >
                Type
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider"
              >
                Date
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider"
              >
                Amount
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-background/40 backdrop-blur-sm divide-y divide-border/20">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground">
                  Loading claims...
                </td>
              </tr>
            ) : filteredClaims.length > 0 ? (
              filteredClaims.map((claim: any) => (
                <tr key={claim.id} className="hover:bg-primary/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    {claim.claimId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getIconForClaimType(claim.type)}
                      <span className="text-sm font-medium">{claim.type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {formatDate(claim.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-foreground">
                    {formatCurrency(claim.totalAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={claim.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    <div className="flex space-x-3">
                      <button
                        className="text-primary hover:text-primary/80 transition-colors"
                        onClick={() => handleViewClick(claim.claimId)}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {claim.status === "draft" || claim.status === "rejected" ? (
                        <button
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => handleEditClick(claim.claimId)}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      ) : null}
                      {claim.status === "rejected" ? (
                        <button
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => handleCopyClick(claim.claimId)}
                        >
                          <CopyIcon className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground">
                  No claims found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 border-t border-border/30 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-medium">1</span> to{" "}
          <span className="font-medium">{filteredClaims.length}</span> of{" "}
          <span className="font-medium">{claimsArray.length || 0}</span> claims
        </div>
        <div className="flex space-x-2">
          <button
            className="px-3 py-1 border border-border/40 rounded-md text-muted-foreground hover:bg-primary/5 disabled:opacity-50 transition-colors"
            disabled
          >
            Previous
          </button>
          <button
            className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-md text-primary hover:bg-primary/20 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
