import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Bell,
  Mail,
  Shield,
  Palette,
  Monitor,
  Smartphone,
} from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState("notifications");
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = React.useState(true);
  const [pushNotifications, setPushNotifications] = React.useState(true);
  const [newClaimNotifications, setNewClaimNotifications] = React.useState(true);
  const [statusChangeNotifications, setStatusChangeNotifications] = React.useState(true);
  const [reminderNotifications, setReminderNotifications] = React.useState(true);
  const [weeklyDigest, setWeeklyDigest] = React.useState(false);
  
  // Appearance settings
  const [theme, setTheme] = React.useState("system");
  const [language, setLanguage] = React.useState("english");
  const [compactMode, setCompactMode] = React.useState(false);
  
  // Security settings
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  const handleNotificationSave = () => {
    toast({
      title: "Notification settings saved",
      description: "Your notification preferences have been updated",
    });
  };

  const handleAppearanceSave = () => {
    toast({
      title: "Appearance settings saved",
      description: "Your appearance preferences have been updated",
    });
  };

  const handleSecuritySave = () => {
    if (newPassword.length < 8) {
      toast({
        title: "Password error",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Password error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Password changed",
      description: "Your password has been updated successfully",
    });
    
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Settings</h1>
          <p className="text-neutral-500">Manage your account settings and preferences</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="h-4 w-4 mr-2" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Notification Settings</CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Delivery Channels</h3>
                  <Separator />
                  
                  <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center">
                        <Mail className="h-5 w-5 text-primary mr-2" />
                        <label className="text-base font-medium">Email Notifications</label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch 
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>
                  
                  <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center">
                        <Smartphone className="h-5 w-5 text-primary mr-2" />
                        <label className="text-base font-medium">Push Notifications</label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications on your device
                      </p>
                    </div>
                    <Switch 
                      checked={pushNotifications}
                      onCheckedChange={setPushNotifications}
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Notification Types</h3>
                  <Separator />
                  
                  <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <label className="text-base font-medium">New Claim Notifications</label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when new claims are submitted
                      </p>
                    </div>
                    <Switch 
                      checked={newClaimNotifications}
                      onCheckedChange={setNewClaimNotifications}
                    />
                  </div>
                  
                  <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <label className="text-base font-medium">Status Change Notifications</label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when claim status changes
                      </p>
                    </div>
                    <Switch 
                      checked={statusChangeNotifications}
                      onCheckedChange={setStatusChangeNotifications}
                    />
                  </div>
                  
                  <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <label className="text-base font-medium">Reminder Notifications</label>
                      <p className="text-sm text-muted-foreground">
                        Get reminders for pending actions
                      </p>
                    </div>
                    <Switch 
                      checked={reminderNotifications}
                      onCheckedChange={setReminderNotifications}
                    />
                  </div>
                  
                  <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <label className="text-base font-medium">Weekly Digest</label>
                      <p className="text-sm text-muted-foreground">
                        Receive a weekly summary of activities
                      </p>
                    </div>
                    <Switch 
                      checked={weeklyDigest}
                      onCheckedChange={setWeeklyDigest}
                    />
                  </div>
                </div>

                <Button onClick={handleNotificationSave}>Save Notification Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Appearance Settings</CardTitle>
              <CardDescription>
                Customize how the application looks and feels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Display Settings</h3>
                  <Separator />
                  
                  <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center">
                        <Monitor className="h-5 w-5 text-primary mr-2" />
                        <label className="text-base font-medium">Theme</label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Choose your preferred theme mode
                      </p>
                    </div>
                    <select
                      className="rounded-md border p-2 text-sm"
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System</option>
                    </select>
                  </div>
                  
                  <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center">
                        <Palette className="h-5 w-5 text-primary mr-2" />
                        <label className="text-base font-medium">Language</label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Choose your preferred language
                      </p>
                    </div>
                    <select
                      className="rounded-md border p-2 text-sm"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                    >
                      <option value="english">English</option>
                      <option value="hindi">Hindi</option>
                      <option value="spanish">Spanish</option>
                    </select>
                  </div>
                  
                  <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <label className="text-base font-medium">Compact Mode</label>
                      <p className="text-sm text-muted-foreground">
                        Use compact layout to show more information
                      </p>
                    </div>
                    <Switch 
                      checked={compactMode}
                      onCheckedChange={setCompactMode}
                    />
                  </div>
                </div>

                <Button onClick={handleAppearanceSave}>Save Appearance Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Security Settings</CardTitle>
              <CardDescription>
                Manage your password and account security
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Change Password</h3>
                  <Separator />
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Current Password</label>
                      <Input 
                        type="password" 
                        placeholder="Enter current password" 
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">New Password</label>
                      <Input 
                        type="password" 
                        placeholder="Enter new password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Password should be at least 8 characters
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Confirm New Password</label>
                      <Input 
                        type="password" 
                        placeholder="Confirm new password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={handleSecuritySave}>Change Password</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}