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
    queryKey: ["/api/claims", user?.id],
    enabled: !!user?.id,
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
    <div className="bg-white rounded-lg shadow-sm mb-8">
      {/* Claim Details Modal */}
      <ClaimDetailsModal 
        claim={selectedClaim} 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
      />

      <div className="p-6 border-b border-neutral-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-700">
            Recent Claims
          </h3>
          <div className="mt-2 sm:mt-0 flex">
            <div className="relative">
              <Select
                defaultValue="all"
                onValueChange={setClaimTypeFilter}
              >
                <SelectTrigger className="bg-neutral-100 border border-neutral-200 rounded-md text-sm h-9 w-36">
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
                <SelectTrigger className="bg-neutral-100 border border-neutral-200 rounded-md text-sm h-9 w-36">
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
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Claim ID
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Type
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Date
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Amount
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-neutral-500">
                  Loading claims...
                </td>
              </tr>
            ) : filteredClaims.length > 0 ? (
              filteredClaims.map((claim: any) => (
                <tr key={claim.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                    {claim.claimId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getIconForClaimType(claim.type)}
                      <span className="text-sm">{claim.type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                    {formatDate(claim.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-700">
                    {formatCurrency(claim.totalAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={claim.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                    <div className="flex space-x-2">
                      <button
                        className="text-primary hover:text-primary/80"
                        onClick={() => handleViewClick(claim.claimId)}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {claim.status === "draft" || claim.status === "rejected" ? (
                        <button
                          className="text-neutral-500 hover:text-neutral-700"
                          onClick={() => handleEditClick(claim.claimId)}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      ) : null}
                      {claim.status === "rejected" ? (
                        <button
                          className="text-neutral-500 hover:text-neutral-700"
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
                <td colSpan={6} className="px-6 py-4 text-center text-neutral-500">
                  No claims found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between">
        <div className="text-sm text-neutral-500">
          Showing <span className="font-medium">1</span> to{" "}
          <span className="font-medium">{filteredClaims.length}</span> of{" "}
          <span className="font-medium">{claimsArray.length || 0}</span> claims
        </div>
        <div className="flex space-x-2">
          <button
            className="px-3 py-1 border border-neutral-200 rounded-md text-neutral-500 hover:bg-neutral-50 disabled:opacity-50"
            disabled
          >
            Previous
          </button>
          <button
            className="px-3 py-1 border border-neutral-200 rounded-md text-neutral-500 hover:bg-neutral-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
