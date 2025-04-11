import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { StatusBadge } from "@/components/ui/status-badge";
import { ClaimStatus } from "@shared/schema";
import { formatCurrency, formatDate, getClaimTypeName, getClaimTypeIcon } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import ExpenseTypeFilter from "@/components/claims/ExpenseTypeFilter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLocation } from "wouter";

export default function ApprovedClaims() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [claimTypeFilter, setClaimTypeFilter] = useState<string | null>(null);

  const { data: claims, isLoading } = useQuery({
    queryKey: ["/api/claims", "approved"],
    queryFn: async () => {
      const res = await fetch(`/api/claims?status=approved`);
      if (!res.ok) throw new Error("Failed to fetch approved claims");
      const data = await res.json();
      console.log("Approved claims response:", data);
      return data;
    },
    enabled: true,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 5000, // Refetch data every 5 seconds
  });

  const handleViewClick = (claim: any) => {
    toast({
      title: "View Claim",
      description: `Viewing claim ${claim.claimId}`,
    });
  };

  const handleDownloadPdf = (claim: any) => {
    toast({
      title: "Download PDF",
      description: `Downloading PDF for claim ${claim.claimId}`,
    });
  };

  const getIconForClaimType = (type: string) => {
    const iconName = getClaimTypeIcon(type);
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

  // Filter claims by type if a filter is selected
  const filteredClaims = claims
    ? claims.filter(
        (claim: any) =>
          !claimTypeFilter || claim.type === claimTypeFilter
      )
    : [];

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-700 mb-2">Approved Claims</h2>
          <p className="text-neutral-500">
            Claims that have been approved and are either paid or in process
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <ExpenseTypeFilter 
            selectedType={claimTypeFilter} 
            onTypeChange={setClaimTypeFilter}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-neutral-500">Loading approved claims...</p>
        </div>
      ) : filteredClaims.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClaims.map((claim: any) => (
            <Card key={claim.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{claim.claimId}</CardTitle>
                    <CardDescription>
                      <div className="flex items-center mt-1">
                        {getIconForClaimType(claim.type)}
                        <span>{getClaimTypeName(claim.type)}</span>
                      </div>
                    </CardDescription>
                  </div>
                  <StatusBadge status={claim.status} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-500">Amount:</span>
                    <span className="text-sm font-semibold">{formatCurrency(claim.approvedAmount || claim.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-500">Approved On:</span>
                    <span className="text-sm">{formatDate(claim.approvedAt || claim.updatedAt)}</span>
                  </div>
                  {claim.details.purpose && (
                    <div>
                      <span className="text-sm text-neutral-500">Purpose:</span>
                      <p className="text-sm mt-1 line-clamp-2">{claim.details.purpose}</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between space-x-2">
                <div className="flex items-center">
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                    {claim.paidAt ? "Paid" : "Processing"}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewClick(claim)}
                  >
                    <Eye className="h-4 w-4 mr-1" /> View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDownloadPdf(claim)}
                  >
                    <Download className="h-4 w-4 mr-1" /> PDF
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary/10 text-secondary mb-4">
            <span className="ri-check-double-line text-3xl"></span>
          </div>
          <h3 className="text-lg font-medium text-neutral-700 mb-2">No Approved Claims</h3>
          <p className="text-neutral-500 mb-6">
            You don't have any approved claims at the moment.
          </p>
          <Button onClick={() => navigate("/new-claim")}>
            Create New Claim
          </Button>
        </div>
      )}
    </div>
  );
}
