import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/components/auth/UserProvider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency, formatDate, getClaimTypeName } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, ThumbsUp, ThumbsDown, User, FileText, Calendar, DollarSign } from "lucide-react";

export default function ApprovalQueue() {
  const { user } = useUser();
  const { toast } = useToast();
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: claimsForApproval, isLoading: isLoadingApprovals } = useQuery({
    queryKey: ["/api/claims/approval", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/claims/approval?approverId=${user?.id}`);
      if (!res.ok) throw new Error("Failed to fetch claims for approval");
      return res.json();
    },
    enabled: !!user?.id,
  });

  const handleViewClaim = (claim: any) => {
    setSelectedClaim(claim);
  };

  const handleApproveClick = (claim: any) => {
    setSelectedClaim(claim);
    setApprovalModalOpen(true);
  };

  const handleRejectClick = (claim: any) => {
    setSelectedClaim(claim);
    setRejectionModalOpen(true);
  };

  const handleCloseModal = () => {
    setApprovalModalOpen(false);
    setRejectionModalOpen(false);
    setNotes("");
  };

  const handleApproveClaim = async () => {
    if (!selectedClaim) return;
    
    try {
      setIsProcessing(true);

      // Update claim status
      await apiRequest("PATCH", `/api/claims/${selectedClaim.id}`, {
        status: "approved",
        approvedAmount: selectedClaim.totalAmount,
        notes: notes || "Approved"
      });

      // Show success message
      toast({
        title: "Claim Approved",
        description: `The claim ${selectedClaim.claimId} has been approved successfully.`,
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
      queryClient.invalidateQueries({ queryKey: ["/api/claims/approval"] });

      // Close modal
      handleCloseModal();
    } catch (error) {
      console.error("Failed to approve claim:", error);
      toast({
        title: "Error",
        description: "Failed to approve claim. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectClaim = async () => {
    if (!selectedClaim) return;
    
    if (!notes.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsProcessing(true);

      // Update claim status
      await apiRequest("PATCH", `/api/claims/${selectedClaim.id}`, {
        status: "rejected",
        notes: notes
      });

      // Show success message
      toast({
        title: "Claim Rejected",
        description: `The claim ${selectedClaim.claimId} has been rejected.`,
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
      queryClient.invalidateQueries({ queryKey: ["/api/claims/approval"] });

      // Close modal
      handleCloseModal();
    } catch (error) {
      console.error("Failed to reject claim:", error);
      toast({
        title: "Error",
        description: "Failed to reject claim. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderClaimDetails = () => {
    if (!selectedClaim) return null;

    const details = selectedClaim.details;
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-neutral-500" />
            <span className="text-sm text-neutral-600">
              <strong>Submitted by:</strong> Employee ID {selectedClaim.userId}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-neutral-500" />
            <span className="text-sm text-neutral-600">
              <strong>Type:</strong> {getClaimTypeName(selectedClaim.type)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-neutral-500" />
            <span className="text-sm text-neutral-600">
              <strong>Submitted on:</strong> {formatDate(selectedClaim.submittedAt || selectedClaim.createdAt)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-neutral-500" />
            <span className="text-sm text-neutral-600">
              <strong>Amount:</strong> {formatCurrency(selectedClaim.totalAmount)}
            </span>
          </div>
        </div>

        <div className="rounded-md border border-neutral-200 p-4">
          <h3 className="text-sm font-medium mb-2">Claim Details</h3>
          <div className="space-y-2 text-sm">
            {Object.entries(details).map(([key, value]: [string, any]) => {
              // Skip arrays and objects for simple display
              if (Array.isArray(value) || typeof value === 'object') return null;
              
              return (
                <div key={key} className="grid grid-cols-2">
                  <span className="text-neutral-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                  <span className="text-neutral-700">
                    {typeof value === 'boolean' 
                      ? value ? 'Yes' : 'No' 
                      : key.toLowerCase().includes('date')
                        ? formatDate(value)
                        : key.toLowerCase().includes('amount') || key.toLowerCase().includes('cost')
                          ? formatCurrency(value)
                          : value}
                  </span>
                </div>
              );
            })}
          </div>
          
          {details.expenses && details.expenses.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Expense Items</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Category</th>
                      <th className="px-3 py-2 text-left">Description</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {details.expenses.map((expense: any, index: number) => (
                      <tr key={index}>
                        <td className="px-3 py-2">{formatDate(expense.date)}</td>
                        <td className="px-3 py-2 capitalize">{expense.category}</td>
                        <td className="px-3 py-2">{expense.description}</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(expense.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-700 mb-2">Approval Queue</h2>
          <p className="text-neutral-500">
            Review and approve expense claims submitted by your team members
          </p>
        </div>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">Pending Approval</TabsTrigger>
          <TabsTrigger value="history">Approval History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending">
          {isLoadingApprovals ? (
            <div className="text-center py-8">
              <p className="text-neutral-500">Loading approval queue...</p>
            </div>
          ) : claimsForApproval && claimsForApproval.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {claimsForApproval.map((claim: any) => (
                <Card key={claim.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{claim.claimId}</CardTitle>
                        <CardDescription>{getClaimTypeName(claim.type)}</CardDescription>
                      </div>
                      <StatusBadge status={claim.status} />
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-neutral-500">Amount:</span>
                        <span className="text-sm font-medium">{formatCurrency(claim.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-neutral-500">Submitted:</span>
                        <span className="text-sm">{formatDate(claim.createdAt)}</span>
                      </div>
                      {claim.details.purpose && (
                        <div className="text-sm text-neutral-600 line-clamp-2">
                          {claim.details.purpose}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewClaim(claim)}>
                      <Eye className="h-4 w-4 mr-1" /> View
                    </Button>
                    <div className="space-x-2">
                      <Button variant="outline" size="sm" className="border-green-500 text-green-500 hover:bg-green-50" onClick={() => handleApproveClick(claim)}>
                        <ThumbsUp className="h-4 w-4 mr-1" /> Approve
                      </Button>
                      <Button variant="outline" size="sm" className="border-red-500 text-red-500 hover:bg-red-50" onClick={() => handleRejectClick(claim)}>
                        <ThumbsDown className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-neutral-500">No claims pending your approval</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="history">
          <div className="text-center py-8">
            <p className="text-neutral-500">Approval history will be shown here</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* View Claim Modal */}
      <Dialog open={!!selectedClaim && !approvalModalOpen && !rejectionModalOpen} onOpenChange={() => setSelectedClaim(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Claim Details</DialogTitle>
            <DialogDescription>
              {selectedClaim?.claimId} - {getClaimTypeName(selectedClaim?.type)}
            </DialogDescription>
          </DialogHeader>
          
          {renderClaimDetails()}
          
          <DialogFooter className="flex justify-between gap-2">
            <Button variant="outline" onClick={() => setSelectedClaim(null)}>
              Close
            </Button>
            <div className="space-x-2">
              <Button 
                variant="outline" 
                className="border-green-500 text-green-500 hover:bg-green-50"
                onClick={() => handleApproveClick(selectedClaim)}
              >
                <ThumbsUp className="h-4 w-4 mr-1" /> Approve
              </Button>
              <Button 
                variant="outline" 
                className="border-red-500 text-red-500 hover:bg-red-50"
                onClick={() => handleRejectClick(selectedClaim)}
              >
                <ThumbsDown className="h-4 w-4 mr-1" /> Reject
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Claim Modal */}
      <Dialog open={approvalModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Claim</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this claim?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-neutral-600">Claim ID:</span>
                <span className="font-medium">{selectedClaim?.claimId}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-neutral-600">Type:</span>
                <span>{getClaimTypeName(selectedClaim?.type)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Amount:</span>
                <span className="font-medium">{formatCurrency(selectedClaim?.totalAmount)}</span>
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="notes" className="block text-sm font-medium text-neutral-700 mb-1">
                Notes (Optional)
              </label>
              <Textarea
                id="notes"
                placeholder="Add any notes or comments for this approval"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleApproveClaim} className="bg-green-600 hover:bg-green-700" disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Approve Claim"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Claim Modal */}
      <Dialog open={rejectionModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Claim</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this claim.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-neutral-600">Claim ID:</span>
                <span className="font-medium">{selectedClaim?.claimId}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-neutral-600">Type:</span>
                <span>{getClaimTypeName(selectedClaim?.type)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Amount:</span>
                <span className="font-medium">{formatCurrency(selectedClaim?.totalAmount)}</span>
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="rejection-reason" className="block text-sm font-medium text-neutral-700 mb-1">
                Reason for Rejection*
              </label>
              <Textarea
                id="rejection-reason"
                placeholder="Please provide a reason for rejection"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                required
              />
              <p className="mt-1 text-xs text-neutral-500">
                This reason will be shared with the employee.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal} disabled={isProcessing}>
              Cancel
            </Button>
            <Button 
              onClick={handleRejectClaim} 
              variant="destructive" 
              disabled={isProcessing || !notes.trim()}
            >
              {isProcessing ? "Processing..." : "Reject Claim"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
