import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  UserIcon,
  Mail,
  Building,
  Briefcase,
  MapPin,
  Hash,
  Target,
  Layers,
  Users,
  Edit,
} from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  
  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Loading profile...</p>
      </div>
    );
  }

  // Determine user role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case "finance":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200";
      case "manager":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      default:
        return "bg-green-100 text-green-800 hover:bg-green-200";
    }
  };

  // Format the role name for display
  const formatRoleName = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">My Profile</h1>
          <p className="text-neutral-500">View and manage your account information</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Edit className="h-4 w-4" />
          Edit Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your basic account details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4 pb-6">
              <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-semibold">
                {user.name.charAt(0)}
                {user.name.split(" ")[1]?.charAt(0) || ""}
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold">{user.name}</h3>
                <p className="text-sm text-neutral-500">{user.email}</p>
                <Badge className={`mt-2 ${getRoleBadgeColor(user.role)}`}>
                  {formatRoleName(user.role)}
                </Badge>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <dl className="space-y-4">
              <div className="flex items-start">
                <dt className="w-10 flex-shrink-0">
                  <UserIcon className="h-5 w-5 text-neutral-500" />
                </dt>
                <dd className="flex-grow">
                  <span className="block text-sm font-medium">Username</span>
                  <span className="block text-sm text-neutral-500">{user.username}</span>
                </dd>
              </div>
              
              <div className="flex items-start">
                <dt className="w-10 flex-shrink-0">
                  <Mail className="h-5 w-5 text-neutral-500" />
                </dt>
                <dd className="flex-grow">
                  <span className="block text-sm font-medium">Email</span>
                  <span className="block text-sm text-neutral-500">{user.email}</span>
                </dd>
              </div>
              
              <div className="flex items-start">
                <dt className="w-10 flex-shrink-0">
                  <Hash className="h-5 w-5 text-neutral-500" />
                </dt>
                <dd className="flex-grow">
                  <span className="block text-sm font-medium">Employee Code</span>
                  <span className="block text-sm text-neutral-500">{user.eCode}</span>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle>Work Information</CardTitle>
            <CardDescription>Your work and organization details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start">
                  <dt className="w-10 flex-shrink-0">
                    <Building className="h-5 w-5 text-neutral-500" />
                  </dt>
                  <dd className="flex-grow">
                    <span className="block text-sm font-medium">Department</span>
                    <span className="block text-sm text-neutral-500">{user.department}</span>
                  </dd>
                </div>
                
                <div className="flex items-start">
                  <dt className="w-10 flex-shrink-0">
                    <Briefcase className="h-5 w-5 text-neutral-500" />
                  </dt>
                  <dd className="flex-grow">
                    <span className="block text-sm font-medium">Designation</span>
                    <span className="block text-sm text-neutral-500">{user.designation}</span>
                  </dd>
                </div>
                
                <div className="flex items-start">
                  <dt className="w-10 flex-shrink-0">
                    <MapPin className="h-5 w-5 text-neutral-500" />
                  </dt>
                  <dd className="flex-grow">
                    <span className="block text-sm font-medium">Branch</span>
                    <span className="block text-sm text-neutral-500">{user.branch}</span>
                  </dd>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start">
                  <dt className="w-10 flex-shrink-0">
                    <Target className="h-5 w-5 text-neutral-500" />
                  </dt>
                  <dd className="flex-grow">
                    <span className="block text-sm font-medium">Band</span>
                    <span className="block text-sm text-neutral-500">{user.band}</span>
                  </dd>
                </div>
                
                <div className="flex items-start">
                  <dt className="w-10 flex-shrink-0">
                    <Layers className="h-5 w-5 text-neutral-500" />
                  </dt>
                  <dd className="flex-grow">
                    <span className="block text-sm font-medium">Business Unit</span>
                    <span className="block text-sm text-neutral-500">{user.businessUnit}</span>
                  </dd>
                </div>
                
                <div className="flex items-start">
                  <dt className="w-10 flex-shrink-0">
                    <Users className="h-5 w-5 text-neutral-500" />
                  </dt>
                  <dd className="flex-grow">
                    <span className="block text-sm font-medium">Manager ID</span>
                    <span className="block text-sm text-neutral-500">{user.managerId || "No Manager"}</span>
                  </dd>
                </div>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            <div>
              <h3 className="font-medium mb-3">Account Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium">Role</p>
                  <p className="text-2xl font-bold text-blue-800 mt-1">{formatRoleName(user.role)}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">Account Created</p>
                  <p className="text-sm font-medium text-green-800 mt-1">
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-800 font-medium">Account ID</p>
                  <p className="text-sm font-medium text-purple-800 mt-1">#{user.id}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}