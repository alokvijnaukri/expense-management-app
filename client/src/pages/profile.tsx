import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { UserCircle, Mail, Building, BriefcaseBusiness, Users, MapPin, BadgeCheck, ChevronRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function Profile() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">My Profile</h1>
          <p className="text-neutral-500">Manage your account information and preferences</p>
        </div>
      </div>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="work">Work Details</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Personal Information</CardTitle>
              <CardDescription>
                Your personal information and account details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex flex-col items-center justify-center p-6 bg-neutral-50 rounded-lg">
                    <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-medium mb-4">
                      {user.name.charAt(0)}
                      {user.name.split(" ")[1]?.charAt(0) || ""}
                    </div>
                    <h2 className="text-xl font-semibold text-neutral-800">{user.name}</h2>
                    <p className="text-neutral-500">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Account Details</h3>
                    <Separator />
                    
                    <div className="flex items-center">
                      <div className="p-2 rounded-full bg-primary/10 mr-3">
                        <UserCircle className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-neutral-500">Username</p>
                        <p className="font-medium">{user.username}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="p-2 rounded-full bg-primary/10 mr-3">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-neutral-500">Email</p>
                        <p className="font-medium">{user.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="p-2 rounded-full bg-primary/10 mr-3">
                        <BadgeCheck className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-neutral-500">Employee Code</p>
                        <p className="font-medium">{user.eCode}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Work Profile</h3>
                    <Separator />
                    
                    <div className="flex items-center">
                      <div className="p-2 rounded-full bg-primary/10 mr-3">
                        <Building className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-neutral-500">Department</p>
                        <p className="font-medium">{user.department}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="p-2 rounded-full bg-primary/10 mr-3">
                        <BriefcaseBusiness className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-neutral-500">Designation</p>
                        <p className="font-medium">{user.designation}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="p-2 rounded-full bg-primary/10 mr-3">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-neutral-500">Band</p>
                        <p className="font-medium">{user.band}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="p-2 rounded-full bg-primary/10 mr-3">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-neutral-500">Branch</p>
                        <p className="font-medium">{user.branch}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="work">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Work Information</CardTitle>
              <CardDescription>
                Your organization and business unit details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-8">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Organization Details</h3>
                    <Separator />
                    
                    <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="p-2 rounded-full bg-primary/10 mr-3">
                          <Building className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-neutral-500">Business Unit</p>
                          <p className="font-medium">{user.businessUnit}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="p-2 rounded-full bg-primary/10 mr-3">
                          <BriefcaseBusiness className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-neutral-500">Department</p>
                          <p className="font-medium">{user.department}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="p-2 rounded-full bg-primary/10 mr-3">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-neutral-500">Role</p>
                          <p className="font-medium">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
                        </div>
                      </div>
                    </div>
                    
                    {user.managerId && (
                      <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="p-2 rounded-full bg-primary/10 mr-3">
                            <UserCircle className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-neutral-500">Reports To</p>
                            <p className="font-medium">Manager ID: {user.managerId}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}