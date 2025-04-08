import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { conveyanceClaimSchema } from "@shared/schema";
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

export default function ConveyanceClaimForm() {
  const { user } = useUser();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(conveyanceClaimSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      fromLocation: "",
      toLocation: "",
      distance: 0,
      vehicleType: "",
      purpose: "",
      ratePerKm: 0,
      totalAmount: 0,
      documents: [],
      additionalNotes: "",
    },
  });

  // Watch for changes to calculate total amount
  const distance = form.watch("distance");
  const vehicleType = form.watch("vehicleType");
  const ratePerKm = form.watch("ratePerKm");

  // Set rate per km based on vehicle type and user band
  useEffect(() => {
    let rate = 0;
    
    if (vehicleType) {
      // Rates could be determined based on user band and vehicle type
      if (user?.band === "B5" || user?.band === "B4") {
        // Higher band gets higher rates
        rate = vehicleType === "car" ? 15 : 
              vehicleType === "bike" ? 8 : 
              vehicleType === "auto" ? 12 : 5;
      } else if (user?.band === "B3") {
        rate = vehicleType === "car" ? 12 : 
              vehicleType === "bike" ? 6 : 
              vehicleType === "auto" ? 10 : 4;
      } else {
        // Lower bands
        rate = vehicleType === "car" ? 10 : 
              vehicleType === "bike" ? 5 : 
              vehicleType === "auto" ? 8 : 3;
      }
    }
    
    form.setValue("ratePerKm", rate);
  }, [vehicleType, user?.band, form]);

  // Calculate total amount when distance or rate changes
  useEffect(() => {
    const total = distance * ratePerKm;
    form.setValue("totalAmount", total);
  }, [distance, ratePerKm, form]);

  const vehicleTypes = [
    { value: "car", label: "Car" },
    { value: "bike", label: "Bike" },
    { value: "auto", label: "Auto-rickshaw" },
    { value: "public", label: "Public Transport" },
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
        type: ClaimTypes.CONVEYANCE,
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
        description: "Your conveyance claim has been saved as a draft",
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
        type: ClaimTypes.CONVEYANCE,
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
        description: "Your conveyance claim has been submitted for approval",
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
          Conveyance Claim
        </h2>
        <p className="text-neutral-500">
          Complete the form below to submit your local conveyance expense claim
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <Form {...form}>
          <form className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-neutral-700 mb-4">
                Journey Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Journey Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
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
                      <FormLabel>Purpose</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Client Meeting, Office Visit"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fromLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Location</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Office, Home"
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
                          placeholder="e.g., Client Site, Conference Venue"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vehicleType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mode of Transport</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select vehicle type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {vehicleTypes.map((type) => (
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
                  name="distance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Distance (KM)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0.1"
                          step="0.1"
                          placeholder="0.0"
                          {...field}
                          onChange={(e) => {
                            field.onChange(parseFloat(e.target.value) || 0);
                          }}
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
                  name="ratePerKm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rate per KM</FormLabel>
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
                        Rate based on your band ({user?.band}) and vehicle type
                      </FormDescription>
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
                      <FormDescription>
                        Distance × Rate per KM
                      </FormDescription>
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
                  <FormLabel>Receipts/Tickets (if any)</FormLabel>
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
