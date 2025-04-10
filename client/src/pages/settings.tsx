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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save, Plus, Edit, Trash2 } from "lucide-react";

const generalSettingsSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  fiscalYearStart: z.string().min(1, "Start date is required"),
  fiscalYearEnd: z.string().min(1, "End date is required"),
  defaultCurrency: z.string().min(1, "Currency is required"),
  approvalThreshold: z.string().transform(val => parseFloat(val)),
});

export default function Settings() {
  const { user } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

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
                {[
                  { id: 1, name: "Travel Expense", fields: 12 },
                  { id: 2, name: "Business Promotion", fields: 8 },
                  { id: 3, name: "Conveyance Claim", fields: 9 },
                  { id: 4, name: "Mobile Bill", fields: 7 },
                  { id: 5, name: "Relocation Expense", fields: 10 },
                  { id: 6, name: "Other Claims", fields: 6 },
                ].map((template) => (
                  <Card key={template.id} className="border border-neutral-200">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <CardDescription>{template.fields} fields configured</CardDescription>
                    </CardHeader>
                    <CardFooter className="p-4 pt-2 flex justify-end">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" /> Edit Template
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
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
