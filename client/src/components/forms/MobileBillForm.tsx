import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { mobileBillSchema } from "@shared/schema";
import { useUser } from "@/components/auth/UserProvider";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { generateClaimId, formatCurrency } from "@/lib/utils";
import { ClaimStatus, ClaimTypes } from "@shared/schema";
import FormActions from "./common/FormActions";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { UploadCloud } from "lucide-react";

export default function MobileBillForm() {
  const { user } = useUser();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileName, setFileName] = useState("");

  const form = useForm({
    resolver: zodResolver(mobileBillSchema),
    defaultValues: {
      period: new Date().toISOString().split("T")[0].substring(0, 7), // YYYY-MM
      totalBill: 0,
      deductions: 0,
      gstAmount: 0,
      netClaim: 0,
      isdCalls: false,
      billAttachment: "",
      additionalNotes: "",
    },
  });

  // Watch for changes to calculate net claim
  const totalBill = form.watch("totalBill");
  const deductions = form.watch("deductions");

  // Calculate GST and net claim when bill or deductions change
  useEffect(() => {
    const gstRate = 0.18; // 18% GST
    const billBeforeGst = (totalBill || 0) / (1 + gstRate);
    const gstAmount = totalBill - billBeforeGst;
    
    form.setValue("gstAmount", parseFloat(gstAmount.toFixed(2)));
    form.setValue("netClaim", Math.max(0, (totalBill || 0) - (deductions || 0)));
  }, [totalBill, deductions, form]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      form.setValue("billAttachment", file.name);
      toast({
        description: `File "${file.name}" attached`,
      });
    }
  };

  const handleCancel = () => {
    navigate("/");
  };

  const handleSaveDraft = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save a claim",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Get form values without validation
      const formData = form.getValues();
      
      // Create claim object
      const claim = {
        claimId: generateClaimId(),
        userId: user.id,
        type: ClaimTypes.MOBILE_BILL,
        status: ClaimStatus.DRAFT,
        totalAmount: formData.netClaim,
        details: {
          ...formData,
        },
        notes: "Draft claim",
      };
      
      // Send to API
      await apiRequest("POST", "/api/claims", claim);
      
      // Show success message
      toast({
        title: "Draft Saved",
        description: "Your mobile bill reimbursement has been saved as a draft",
      });
      
      // Invalidate claims query to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
      
      // Navigate to dashboard
      navigate("/");
    } catch (error) {
      console.error("Failed to save draft:", error);
      toast({
        title: "Error",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to submit a claim",
        variant: "destructive",
      });
      return;
    }
    
    const result = await form.trigger();
    if (!result) {
      // Show first error message
      const firstError = Object.keys(form.formState.errors)[0];
      toast({
        title: "Validation Error",
        description: form.formState.errors[firstError]?.message as string || "Please check all fields",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Get validated form data
      const formData = form.getValues();
      
      // Create claim object
      const claim = {
        claimId: generateClaimId(),
        userId: user.id,
        type: ClaimTypes.MOBILE_BILL,
        status: ClaimStatus.SUBMITTED,
        totalAmount: formData.netClaim,
        details: {
          ...formData,
        },
        notes: "Awaiting approval",
      };
      
      // Send to API
      await apiRequest("POST", "/api/claims", claim);
      
      // Show success message
      toast({
        title: "Claim Submitted",
        description: "Your mobile bill reimbursement has been submitted for approval",
      });
      
      // Invalidate claims query to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
      
      // Navigate to dashboard
      navigate("/");
    } catch (error) {
      console.error("Failed to submit claim:", error);
      toast({
        title: "Error",
        description: "Failed to submit claim. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-neutral-700 mb-2">
          Mobile Bill Reimbursement
        </h2>
        <p className="text-neutral-500">
          Complete the form below to submit your mobile bill reimbursement
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <Form {...form}>
          <form className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-neutral-700 mb-4">
                Bill Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="period"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bill Period</FormLabel>
                      <FormControl>
                        <Input 
                          type="month" 
                          {...field} 
                          placeholder="YYYY-MM"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isdCalls"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          International Calls
                        </FormLabel>
                        <FormDescription>
                          Does your bill include ISD calls?
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Cost Details */}
            <div className="pt-4 border-t border-neutral-200">
              <h3 className="text-lg font-medium text-neutral-700 mb-4">
                Amount Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="totalBill"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Bill Amount</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-neutral-500">₹</span>
                          </div>
                          <Input
                            type="number"
                            placeholder="0.00"
                            className="pl-7"
                            {...field}
                            onChange={(e) => {
                              field.onChange(parseFloat(e.target.value) || 0);
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deductions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deductions (if any)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-neutral-500">₹</span>
                          </div>
                          <Input
                            type="number"
                            placeholder="0.00"
                            className="pl-7"
                            {...field}
                            onChange={(e) => {
                              field.onChange(parseFloat(e.target.value) || 0);
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Personal calls or non-reimbursable charges
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gstAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GST Component</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-neutral-500">₹</span>
                          </div>
                          <Input
                            type="number"
                            placeholder="0.00"
                            className="pl-7"
                            {...field}
                            disabled
                            value={field.value}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Automatically calculated (18% of bill amount)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="netClaim"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Net Claim Amount</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-neutral-500">₹</span>
                          </div>
                          <Input
                            type="number"
                            placeholder="0.00"
                            className="pl-7"
                            {...field}
                            disabled
                            value={field.value}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Total Bill - Deductions
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Bill Attachment */}
            <div className="pt-4 border-t border-neutral-200">
              <h3 className="text-lg font-medium text-neutral-700 mb-4">
                Bill Attachment
              </h3>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="billAttachment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Bill</FormLabel>
                      <FormControl>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-neutral-300 border-dashed rounded-md">
                          <div className="space-y-1 text-center">
                            <UploadCloud className="mx-auto h-12 w-12 text-neutral-400" />
                            <div className="flex text-sm text-neutral-600">
                              <label
                                htmlFor="mobile-bill-upload"
                                className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary/90 focus-within:outline-none"
                              >
                                <span>Upload bill</span>
                                <input
                                  id="mobile-bill-upload"
                                  name="mobile-bill-upload"
                                  type="file"
                                  className="sr-only"
                                  onChange={handleFileChange}
                                />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-neutral-500">
                              PDF or image file up to 10MB
                            </p>
                            {fileName && (
                              <p className="text-sm text-primary mt-2">
                                Attached: {fileName}
                              </p>
                            )}
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="additionalNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any additional information..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Form Actions */}
            <FormActions
              onCancel={handleCancel}
              onSaveDraft={handleSaveDraft}
              onSubmit={handleSubmit}
              draftDisabled={isSubmitting}
              submitDisabled={isSubmitting}
            />
          </form>
        </Form>
      </div>
    </div>
  );
}
