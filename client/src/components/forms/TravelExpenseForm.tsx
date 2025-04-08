import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { travelExpenseSchema } from "@shared/schema";
import { useUser } from "@/components/auth/UserProvider";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { generateClaimId } from "@/lib/utils";
import { ClaimStatus, ClaimTypes } from "@shared/schema";
import ExpenseTable, { ExpenseItem } from "./common/ExpenseTable";
import FormActions from "./common/FormActions";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { UploadCloud } from "lucide-react";

export default function TravelExpenseForm() {
  const { user } = useUser();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([
    {
      date: new Date().toISOString().split("T")[0],
      category: "",
      description: "",
      amount: 0,
    },
  ]);

  const form = useForm({
    resolver: zodResolver(travelExpenseSchema),
    defaultValues: {
      destination: "",
      purpose: "",
      departureDate: new Date().toISOString().split("T")[0],
      returnDate: new Date().toISOString().split("T")[0],
      travelMode: "",
      travelClass: "",
      advanceAmount: 0,
      expenses: expenses,
      checklist: {
        receiptsAttached: false,
        policyCompliance: false,
        detailsAccurate: false,
      },
      documents: [],
      additionalNotes: "",
    },
  });

  const travelModes = [
    { value: "flight", label: "Flight" },
    { value: "train", label: "Train" },
    { value: "bus", label: "Bus" },
    { value: "car", label: "Car" },
    { value: "other", label: "Other" },
  ];

  const travelClasses = [
    { value: "economy", label: "Economy" },
    { value: "business", label: "Business" },
    { value: "first", label: "First Class" },
    { value: "ac2", label: "AC 2-Tier" },
    { value: "ac3", label: "AC 3-Tier" },
    { value: "sleeper", label: "Sleeper" },
  ];

  const expenseCategories = [
    { value: "flight", label: "Flight" },
    { value: "train", label: "Train" },
    { value: "hotel", label: "Hotel" },
    { value: "meals", label: "Meals" },
    { value: "transport", label: "Local Transport" },
    { value: "other", label: "Other" },
  ];

  const handleExpensesChange = (newExpenses: ExpenseItem[]) => {
    setExpenses(newExpenses);
    form.setValue("expenses", newExpenses);
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
      
      // Calculate total amount
      const totalAmount = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
      
      // Create claim object
      const claim = {
        claimId: generateClaimId(),
        userId: user.id,
        type: ClaimTypes.TRAVEL,
        status: ClaimStatus.DRAFT,
        totalAmount: Math.max(0, totalAmount - (formData.advanceAmount || 0)),
        details: {
          ...formData,
          expenses: expenses,
        },
        notes: "Draft claim",
      };
      
      // Send to API
      await apiRequest("POST", "/api/claims", claim);
      
      // Show success message
      toast({
        title: "Draft Saved",
        description: "Your travel expense claim has been saved as a draft",
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
      
      // Calculate total amount
      const totalAmount = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
      
      // Create claim object
      const claim = {
        claimId: generateClaimId(),
        userId: user.id,
        type: ClaimTypes.TRAVEL,
        status: ClaimStatus.SUBMITTED,
        totalAmount: Math.max(0, totalAmount - (formData.advanceAmount || 0)),
        details: {
          ...formData,
          expenses: expenses,
        },
        notes: "Awaiting approval",
      };
      
      // Send to API
      await apiRequest("POST", "/api/claims", claim);
      
      // Show success message
      toast({
        title: "Claim Submitted",
        description: "Your travel expense claim has been submitted for approval",
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
          Travel Expense Claim
        </h2>
        <p className="text-neutral-500">
          Complete the form below to submit your travel expense claim
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <Form {...form}>
          <form className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-neutral-700 mb-4">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="destination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Mumbai to Bangalore"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purpose of Travel</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Client Meeting, Training"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="departureDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departure Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="returnDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Return Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="travelMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mode of Travel</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select travel mode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {travelModes.map((mode) => (
                            <SelectItem key={mode.value} value={mode.value}>
                              {mode.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="travelClass"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Travel Class</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {travelClasses.map((travelClass) => (
                            <SelectItem
                              key={travelClass.value}
                              value={travelClass.value}
                            >
                              {travelClass.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="advanceAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Advance Amount (if any)</FormLabel>
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
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Expense Details */}
            <div className="pt-4 border-t border-neutral-200">
              <ExpenseTable
                expenses={expenses}
                onChange={handleExpensesChange}
                categories={expenseCategories}
                advanceAmount={form.getValues("advanceAmount")}
              />
            </div>

            {/* Checklist and Documents */}
            <div className="pt-4 border-t border-neutral-200">
              <h3 className="text-lg font-medium text-neutral-700 mb-4">
                Checklist & Documents
              </h3>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="checklist.receiptsAttached"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          I have attached all original receipts/invoices
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="checklist.policyCompliance"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          All expenses are in compliance with company travel policy
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="checklist.detailsAccurate"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          I have provided all required details accurately
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <div className="mt-6 space-y-4">
                <FormItem>
                  <FormLabel>Supporting Documents</FormLabel>
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
