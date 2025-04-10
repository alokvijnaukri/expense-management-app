import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save, Plus, Edit, Trash2, PlusCircle, MinusCircle } from "lucide-react";

const generalSettingsSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  fiscalYearStart: z.string().min(1, "Start date is required"),
  fiscalYearEnd: z.string().min(1, "End date is required"),
  defaultCurrency: z.string().min(1, "Currency is required"),
  approvalThreshold: z.string().transform(val => parseFloat(val)),
});

// Define field type enum for better type safety
const FieldType = {
  TEXT: "text",
  NUMBER: "number",
  DATE: "date",
  SELECT: "select",
  TEXTAREA: "textarea",
  FILE: "file",
  CHECKBOX: "checkbox"
} as const;

// Schema for form field edit/creation
const formFieldSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Field name is required"),
  label: z.string().min(1, "Field label is required"),
  type: z.enum([
    FieldType.TEXT, 
    FieldType.NUMBER, 
    FieldType.DATE, 
    FieldType.SELECT, 
    FieldType.TEXTAREA, 
    FieldType.FILE, 
    FieldType.CHECKBOX
  ]),
  required: z.boolean().default(false),
  placeholder: z.string().optional(),
  options: z.array(z.object({
    value: z.string(),
    label: z.string()
  })).optional(),
  defaultValue: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    customMessage: z.string().optional()
  }).optional()
});

// Schema for the entire form template
const formTemplateSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  fields: z.array(formFieldSchema)
});

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<number | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [isTemplateSubmitting, setIsTemplateSubmitting] = useState(false);

  const mockUsersList = [
    { id: 1, name: "Admin User", email: "admin@company.com", role: "admin", department: "Administration" },
    { id: 2, name: "Finance Manager", email: "finance@company.com", role: "finance", department: "Finance" },
    { id: 3, name: "John Manager", email: "manager@company.com", role: "manager", department: "Engineering" },
    { id: 4, name: "John Doe", email: "john.doe@company.com", role: "employee", department: "Engineering" },
  ];

  const mockApprovalConfig = [
    { id: 1, formType: "Travel Expense", threshold: 5000, approvers: "Manager, Finance" },
    { id: 2, formType: "Business Promotion", threshold: 2000, approvers: "Manager, Finance" },
    { id: 3, formType: "Conveyance", threshold: 1000, approvers: "Manager" },
    { id: 4, formType: "Mobile Bill", threshold: 1500, approvers: "Manager" },
    { id: 5, formType: "Relocation", threshold: 10000, approvers: "Manager, Finance, HR" },
  ];
  
  // Mock data for form templates
  const mockFormTemplates = [
    { 
      id: 1, 
      name: "Travel Expense", 
      description: "Form for travel related expense claims",
      fields: [
        { id: "1", name: "tripPurpose", label: "Trip Purpose", type: FieldType.TEXT, required: true, placeholder: "Enter the purpose of your trip" },
        { id: "2", name: "travelDate", label: "Travel Date", type: FieldType.DATE, required: true },
        { id: "3", name: "returnDate", label: "Return Date", type: FieldType.DATE, required: true },
        { id: "4", name: "destination", label: "Destination", type: FieldType.TEXT, required: true },
        { id: "5", name: "travelMode", label: "Mode of Travel", type: FieldType.SELECT, required: true, 
          options: [
            { value: "air", label: "Air" },
            { value: "train", label: "Train" },
            { value: "bus", label: "Bus" },
            { value: "car", label: "Car" },
            { value: "others", label: "Others" }
          ] 
        },
        { id: "6", name: "accommodation", label: "Accommodation Expense", type: FieldType.NUMBER, required: true },
        { id: "7", name: "foodExpense", label: "Food Expense", type: FieldType.NUMBER, required: true },
        { id: "8", name: "localTravel", label: "Local Travel Expense", type: FieldType.NUMBER, required: true },
        { id: "9", name: "otherExpense", label: "Other Expenses", type: FieldType.NUMBER, required: false },
        { id: "10", name: "totalAmount", label: "Total Amount", type: FieldType.NUMBER, required: true },
        { id: "11", name: "receiptsAttached", label: "Receipts Attached", type: FieldType.CHECKBOX, required: true },
        { id: "12", name: "additionalInfo", label: "Additional Information", type: FieldType.TEXTAREA, required: false }
      ]
    },
    { 
      id: 2, 
      name: "Business Promotion", 
      description: "Form for business promotion expense claims",
      fields: [
        { id: "1", name: "clientName", label: "Client Name", type: FieldType.TEXT, required: true },
        { id: "2", name: "eventDate", label: "Event Date", type: FieldType.DATE, required: true },
        { id: "3", name: "eventType", label: "Event Type", type: FieldType.SELECT, required: true,
          options: [
            { value: "lunch", label: "Business Lunch" },
            { value: "dinner", label: "Business Dinner" },
            { value: "gift", label: "Gift" },
            { value: "others", label: "Others" }
          ]
        },
        { id: "4", name: "location", label: "Location", type: FieldType.TEXT, required: true },
        { id: "5", name: "purpose", label: "Business Purpose", type: FieldType.TEXTAREA, required: true },
        { id: "6", name: "amount", label: "Amount Spent", type: FieldType.NUMBER, required: true },
        { id: "7", name: "receiptsAttached", label: "Receipts Attached", type: FieldType.CHECKBOX, required: true },
        { id: "8", name: "additionalInfo", label: "Additional Information", type: FieldType.TEXTAREA, required: false }
      ]
    },
    { 
      id: 3, 
      name: "Conveyance Claim", 
      description: "Form for local transportation expense claims",
      fields: [
        { id: "1", name: "date", label: "Date", type: FieldType.DATE, required: true },
        { id: "2", name: "fromLocation", label: "From Location", type: FieldType.TEXT, required: true },
        { id: "3", name: "toLocation", label: "To Location", type: FieldType.TEXT, required: true },
        { id: "4", name: "purpose", label: "Purpose", type: FieldType.TEXT, required: true },
        { id: "5", name: "modeOfTransport", label: "Mode of Transport", type: FieldType.SELECT, required: true,
          options: [
            { value: "taxi", label: "Taxi" },
            { value: "auto", label: "Auto Rickshaw" },
            { value: "bus", label: "Bus" },
            { value: "metro", label: "Metro" },
            { value: "own", label: "Own Vehicle" },
            { value: "others", label: "Others" }
          ]
        },
        { id: "6", name: "distance", label: "Distance (KM)", type: FieldType.NUMBER, required: false },
        { id: "7", name: "amount", label: "Amount", type: FieldType.NUMBER, required: true },
        { id: "8", name: "receiptsAttached", label: "Receipts Attached", type: FieldType.CHECKBOX, required: false },
        { id: "9", name: "remarks", label: "Remarks", type: FieldType.TEXTAREA, required: false }
      ]
    },
    { 
      id: 4, 
      name: "Mobile Bill", 
      description: "Form for mobile bill reimbursement claims",
      fields: [
        { id: "1", name: "billingMonth", label: "Billing Month", type: FieldType.SELECT, required: true,
          options: [
            { value: "jan", label: "January" },
            { value: "feb", label: "February" },
            { value: "mar", label: "March" },
            { value: "apr", label: "April" },
            { value: "may", label: "May" },
            { value: "jun", label: "June" },
            { value: "jul", label: "July" },
            { value: "aug", label: "August" },
            { value: "sep", label: "September" },
            { value: "oct", label: "October" },
            { value: "nov", label: "November" },
            { value: "dec", label: "December" }
          ]
        },
        { id: "2", name: "mobileNumber", label: "Mobile Number", type: "text", required: true },
        { id: "3", name: "billDate", label: "Bill Date", type: "date", required: true },
        { id: "4", name: "billAmount", label: "Bill Amount", type: "number", required: true },
        { id: "5", name: "claimAmount", label: "Claim Amount", type: "number", required: true },
        { id: "6", name: "billAttached", label: "Bill Attached", type: "checkbox", required: true },
        { id: "7", name: "remarks", label: "Remarks", type: "textarea", required: false }
      ]
    },
    { 
      id: 5, 
      name: "Relocation Expense", 
      description: "Form for relocation expense claims",
      fields: [
        { id: "1", name: "relocationType", label: "Relocation Type", type: "select", required: true,
          options: [
            { value: "domestic", label: "Domestic" },
            { value: "international", label: "International" }
          ]
        },
        { id: "2", name: "fromLocation", label: "From Location", type: "text", required: true },
        { id: "3", name: "toLocation", label: "To Location", type: "text", required: true },
        { id: "4", name: "relocateDate", label: "Relocation Date", type: "date", required: true },
        { id: "5", name: "travelExpense", label: "Travel Expense", type: "number", required: true },
        { id: "6", name: "packingExpense", label: "Packing & Moving Expense", type: "number", required: true },
        { id: "7", name: "temporaryStay", label: "Temporary Stay Expense", type: "number", required: false },
        { id: "8", name: "otherExpense", label: "Other Expenses", type: "number", required: false },
        { id: "9", name: "totalAmount", label: "Total Amount", type: "number", required: true },
        { id: "10", name: "receiptsAttached", label: "Receipts Attached", type: "checkbox", required: true }
      ]
    },
    { 
      id: 6, 
      name: "Other Claims", 
      description: "Form for miscellaneous expense claims",
      fields: [
        { id: "1", name: "expenseDate", label: "Expense Date", type: "date", required: true },
        { id: "2", name: "expenseType", label: "Expense Type", type: "text", required: true },
        { id: "3", name: "vendor", label: "Vendor/Payee", type: "text", required: true },
        { id: "4", name: "purpose", label: "Purpose", type: "textarea", required: true },
        { id: "5", name: "amount", label: "Amount", type: "number", required: true },
        { id: "6", name: "receiptsAttached", label: "Receipts Attached", type: "checkbox", required: true }
      ]
    }
  ];

  const generalSettingsForm = useForm<z.infer<typeof generalSettingsSchema>>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      companyName: "Acme Corporation",
      fiscalYearStart: "2023-04-01",
      fiscalYearEnd: "2024-03-31",
      defaultCurrency: "INR",
      approvalThreshold: "5000",
    },
  });

  const handleSaveGeneralSettings = async (values: z.infer<typeof generalSettingsSchema>) => {
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Settings Saved",
        description: "General settings have been updated successfully.",
      });
    }, 1000);

    console.log("General settings saved:", values);
  };

  const currencyOptions = [
    { value: "INR", label: "Indian Rupee (₹)" },
    { value: "USD", label: "US Dollar ($)" },
    { value: "EUR", label: "Euro (€)" },
    { value: "GBP", label: "British Pound (£)" },
  ];
  
  // Set up form template editing functionality
  const [currentTemplate, setCurrentTemplate] = useState<z.infer<typeof formTemplateSchema> | null>(null);
  
  const templateForm = useForm<z.infer<typeof formTemplateSchema>>({
    resolver: zodResolver(formTemplateSchema),
    defaultValues: {
      name: "",
      description: "",
      fields: []
    }
  });
  
  // Function to handle opening the template editor dialog
  const handleEditTemplate = (templateId: number) => {
    const template = mockFormTemplates.find(t => t.id === templateId);
    if (template) {
      setEditingTemplate(templateId);
      setCurrentTemplate(template);
      templateForm.reset(template);
      setTemplateDialogOpen(true);
    }
  };
  
  // Function to handle saving template changes
  const handleSaveTemplate = async (values: z.infer<typeof formTemplateSchema>) => {
    setIsTemplateSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsTemplateSubmitting(false);
      setTemplateDialogOpen(false);
      
      toast({
        title: "Template Saved",
        description: `The ${values.name} template has been updated successfully.`,
      });
      
      console.log("Template saved:", values);
    }, 1000);
  };
  
  // Add field to template
  const handleAddField = () => {
    const fields = templateForm.getValues("fields");
    const newField = { 
      id: `new-${fields.length + 1}`, 
      name: "", 
      label: "", 
      type: FieldType.TEXT, 
      required: false 
    };
    
    templateForm.setValue("fields", [...fields, newField]);
  };
  
  // Remove field from template
  const handleRemoveField = (index: number) => {
    const fields = templateForm.getValues("fields");
    fields.splice(index, 1);
    templateForm.setValue("fields", [...fields]);
  };

  if (user?.role !== "admin") {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-4">
            <span className="ri-lock-line text-3xl"></span>
          </div>
          <h3 className="text-lg font-medium text-neutral-700 mb-2">Access Restricted</h3>
          <p className="text-neutral-500 mb-6">
            You do not have permission to access the settings page. Please contact an administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-700 mb-2">System Settings</h2>
          <p className="text-neutral-500">
            Configure system settings and manage users
          </p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="approval">Approval Rules</TabsTrigger>
          <TabsTrigger value="forms">Form Templates</TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure general system settings for the expense management application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...generalSettingsForm}>
                <form onSubmit={generalSettingsForm.handleSubmit(handleSaveGeneralSettings)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={generalSettingsForm.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={generalSettingsForm.control}
                      name="defaultCurrency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Currency</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {currencyOptions.map((currency) => (
                                <SelectItem key={currency.value} value={currency.value}>
                                  {currency.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={generalSettingsForm.control}
                      name="fiscalYearStart"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fiscal Year Start</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={generalSettingsForm.control}
                      name="fiscalYearEnd"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fiscal Year End</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={generalSettingsForm.control}
                      name="approvalThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Approval Threshold</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-neutral-500">₹</span>
                              </div>
                              <Input className="pl-7" {...field} />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Claims above this amount will require additional approvals
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Settings
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage user accounts and permissions
                </CardDescription>
              </div>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockUsersList.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="capitalize">{user.role}</TableCell>
                      <TableCell>{user.department}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approval Rules Tab */}
        <TabsContent value="approval" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Approval Rules</CardTitle>
                <CardDescription>
                  Configure approval workflows for different expense types
                </CardDescription>
              </div>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Rule
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Form Type</TableHead>
                    <TableHead>Amount Threshold</TableHead>
                    <TableHead>Approvers</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockApprovalConfig.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell className="font-medium">{config.formType}</TableCell>
                      <TableCell>₹{config.threshold.toLocaleString()}</TableCell>
                      <TableCell>{config.approvers}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Form Templates Tab */}
        <TabsContent value="forms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Form Templates</CardTitle>
              <CardDescription>
                Customize form templates and field configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockFormTemplates.map((template) => (
                  <Card key={template.id} className="border border-neutral-200">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <CardDescription>{template.fields.length} fields configured</CardDescription>
                    </CardHeader>
                    <CardFooter className="p-4 pt-2 flex justify-end">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditTemplate(template.id)}
                      >
                        <Edit className="h-4 w-4 mr-1" /> Edit Template
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              
              {/* Template Editor Dialog */}
              <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit Form Template</DialogTitle>
                    <DialogDescription>
                      Customize the fields for this form template. Changes will be applied to all new claims.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...templateForm}>
                    <form onSubmit={templateForm.handleSubmit(handleSaveTemplate)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={templateForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Template Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={templateForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium">Form Fields</h3>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={handleAddField}
                          >
                            <PlusCircle className="h-4 w-4 mr-1" />
                            Add Field
                          </Button>
                        </div>
                        
                        <div className="border rounded-md p-0">
                          {templateForm.watch("fields").length === 0 ? (
                            <div className="p-4 text-center text-neutral-500">
                              No fields configured. Click "Add Field" to start.
                            </div>
                          ) : (
                            <div className="divide-y">
                              {templateForm.watch("fields").map((field, index) => (
                                <div key={field.id || index} className="p-4 bg-white">
                                  <div className="flex justify-between items-start mb-4">
                                    <h4 className="text-sm font-medium">Field #{index + 1}</h4>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveField(index)}
                                    >
                                      <MinusCircle className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                      control={templateForm.control}
                                      name={`fields.${index}.name`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Field ID</FormLabel>
                                          <FormControl>
                                            <Input {...field} />
                                          </FormControl>
                                          <FormDescription>
                                            Used in code, no spaces or special characters
                                          </FormDescription>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    
                                    <FormField
                                      control={templateForm.control}
                                      name={`fields.${index}.label`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Display Label</FormLabel>
                                          <FormControl>
                                            <Input {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    
                                    <FormField
                                      control={templateForm.control}
                                      name={`fields.${index}.type`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Field Type</FormLabel>
                                          <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                          >
                                            <FormControl>
                                              <SelectTrigger>
                                                <SelectValue placeholder="Select field type" />
                                              </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                              <SelectItem value="text">Text</SelectItem>
                                              <SelectItem value="number">Number</SelectItem>
                                              <SelectItem value="date">Date</SelectItem>
                                              <SelectItem value="select">Dropdown</SelectItem>
                                              <SelectItem value="textarea">Text Area</SelectItem>
                                              <SelectItem value="file">File Upload</SelectItem>
                                              <SelectItem value="checkbox">Checkbox</SelectItem>
                                            </SelectContent>
                                          </Select>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    
                                    <FormField
                                      control={templateForm.control}
                                      name={`fields.${index}.required`}
                                      render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                          <FormControl>
                                            <Switch
                                              checked={field.value}
                                              onCheckedChange={field.onChange}
                                            />
                                          </FormControl>
                                          <div className="space-y-1 leading-none">
                                            <FormLabel>Required Field</FormLabel>
                                            <FormDescription>
                                              Users must provide a value for this field
                                            </FormDescription>
                                          </div>
                                        </FormItem>
                                      )}
                                    />
                                    
                                    {field.type === "text" && (
                                      <FormField
                                        control={templateForm.control}
                                        name={`fields.${index}.placeholder`}
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Placeholder</FormLabel>
                                            <FormControl>
                                              <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                    )}
                                    
                                    {field.type === "select" && (
                                      <div className="col-span-2">
                                        <FormLabel className="block mb-2">Dropdown Options</FormLabel>
                                        <div className="space-y-2">
                                          {field.options?.map((option, optionIndex) => (
                                            <div key={optionIndex} className="flex gap-2">
                                              <FormField
                                                control={templateForm.control}
                                                name={`fields.${index}.options.${optionIndex}.value`}
                                                render={({ field }) => (
                                                  <FormItem className="flex-1">
                                                    <FormControl>
                                                      <Input placeholder="Value" {...field} />
                                                    </FormControl>
                                                  </FormItem>
                                                )}
                                              />
                                              <FormField
                                                control={templateForm.control}
                                                name={`fields.${index}.options.${optionIndex}.label`}
                                                render={({ field }) => (
                                                  <FormItem className="flex-1">
                                                    <FormControl>
                                                      <Input placeholder="Label" {...field} />
                                                    </FormControl>
                                                  </FormItem>
                                                )}
                                              />
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <DialogFooter>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setTemplateDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isTemplateSubmitting}>
                          {isTemplateSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Template
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-1" /> Create New Template
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
