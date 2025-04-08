import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { businessPromotionSchema } from "@shared/schema";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UploadCloud } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function BusinessPromotionForm() {
  const { user } = useUser();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(businessPromotionSchema),
    defaultValues: {
      clientName: "",
      eventDate: new Date().toISOString().split("T")[0],
      expenseType: "",
      totalCost: 0,
      attendees: 1,
      costPerPerson: 0,
      purpose: "",
      documents: [],
      additionalNotes: "",
    },
  });

  // Watch for changes to calculate cost per person
  const totalCost = form.watch("totalCost");
  const attendees = form.watch("attendees");

  // Update cost per person when either value changes
  React.useEffect(() => {
    if (attendees > 0) {
      form.setValue("costPerPerson", totalCost / attendees);
    } else {
      form.setValue("costPerPerson", 0);
    }
  }, [totalCost, attendees, form]);

  const expenseTypes = [
    { value: "food", label: "Food & Beverages" },
    { value: "gifts", label: "Gifts" },
    { value: "entertainment", label: "Entertainment" },
    { value: "tips", label: "Tips & Gratuities" },
    { value: "venue", label: "Venue Charges" },
    { value: "other", label: "Other" },
  ];

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
        type: ClaimTypes.BUSINESS_PROMOTION,
        status: ClaimStatus.DRAFT,
        totalAmount: formData.totalCost,
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
        description: "Your business promotion claim has been saved as a draft",
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
        type: ClaimTypes.BUSINESS_PROMOTION,
        status: ClaimStatus.SUBMITTED,
        totalAmount: formData.totalCost,
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
        description: "Your business promotion claim has been submitted for approval",
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
          Business Promotion Claim
        </h2>
        <p className="text-neutral-500">
          Complete the form below to submit your business promotion expense claim
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <Form {...form}>
          <form className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-neutral-700 mb-4">
                Event Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client/Company Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., ABC Corporation"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="eventDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expenseType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type of Expense</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select expense type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {expenseTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
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
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purpose</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Business Discussion, Client Relationship"
                          {...field}
                        />
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="totalCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Cost</FormLabel>
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
                  name="attendees"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Attendees</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) => {
                            field.onChange(parseInt(e.target.value) || 0);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="costPerPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Average Cost Per Person</FormLabel>
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
                            value={field.value.toFixed(2)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Per-person cost warning */}
              {form.watch("costPerPerson") > 1000 && (
                <Card className="mt-4 border-warning bg-warning/10">
                  <CardContent className="pt-4">
                    <p className="text-warning">
                      <i className="ri-alert-line mr-2"></i>
                      The average cost per person exceeds ₹1,000. This may require additional approval.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Supporting Documents */}
            <div className="pt-4 border-t border-neutral-200">
              <h3 className="text-lg font-medium text-neutral-700 mb-4">
                Supporting Documents
              </h3>

              <div className="space-y-4">
                <FormItem>
                  <FormLabel>Bill/Invoice</FormLabel>
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
