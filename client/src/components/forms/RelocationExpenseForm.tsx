import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { relocationExpenseSchema } from "@shared/schema";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UploadCloud } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function RelocationExpenseForm() {
  const { user } = useUser();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(relocationExpenseSchema),
    defaultValues: {
      fromLocation: "",
      toLocation: "",
      movingDate: new Date().toISOString().split("T")[0],
      ticketCost: 0,
      goodsTransportCost: 0,
      otherExpenses: 0,
      totalAmount: 0,
      documents: [],
      additionalNotes: "",
    },
  });

  // Watch for changes to calculate total amount
  const ticketCost = form.watch("ticketCost");
  const goodsTransportCost = form.watch("goodsTransportCost");
  const otherExpenses = form.watch("otherExpenses");

  // Calculate total amount when any cost changes
  useEffect(() => {
    const total = (ticketCost || 0) + (goodsTransportCost || 0) + (otherExpenses || 0);
    form.setValue("totalAmount", total);
  }, [ticketCost, goodsTransportCost, otherExpenses, form]);

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
        type: ClaimTypes.RELOCATION,
        status: ClaimStatus.DRAFT,
        totalAmount: formData.totalAmount,
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
        description: "Your relocation expense claim has been saved as a draft",
      });
      
      // Invalidate claims query to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
      // Also invalidate any specific claim status queries
      queryClient.invalidateQueries({ queryKey: ["/api/claims", user?.id] });
      
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
        type: ClaimTypes.RELOCATION,
        status: ClaimStatus.SUBMITTED,
        totalAmount: formData.totalAmount,
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
        description: "Your relocation expense claim has been submitted for approval",
      });
      
      // Invalidate claims query to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
      // Also invalidate any specific claim status queries
      queryClient.invalidateQueries({ queryKey: ["/api/claims", user?.id] });
      
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
          Relocation Expense Claim
        </h2>
        <p className="text-neutral-500">
          Complete the form below to submit your relocation expenses
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <Form {...form}>
          <form className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-neutral-700 mb-4">
                Relocation Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="fromLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Location</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Mumbai"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="toLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To Location</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Bangalore"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="movingDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Moving Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Cost Details */}
            <div className="pt-4 border-t border-neutral-200">
              <h3 className="text-lg font-medium text-neutral-700 mb-4">
                Cost Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="ticketCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ticket Cost</FormLabel>
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
                  name="goodsTransportCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goods Transport Cost</FormLabel>
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
                  name="otherExpenses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other Expenses</FormLabel>
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
                  name="totalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Amount</FormLabel>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Supporting Documents */}
            <div className="pt-4 border-t border-neutral-200">
              <h3 className="text-lg font-medium text-neutral-700 mb-4">
                Supporting Documents
              </h3>

              <div className="space-y-4">
                <FormItem>
                  <FormLabel>Receipts & Invoices</FormLabel>
                  <FormControl>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-neutral-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <UploadCloud className="mx-auto h-12 w-12 text-neutral-400" />
                        <div className="flex text-sm text-neutral-600">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary/90 focus-within:outline-none"
                          >
                            <span>Upload files</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              multiple
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-neutral-500">
                          PNG, JPG, PDF up to 10MB each
                        </p>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>

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
