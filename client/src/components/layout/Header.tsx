import React from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BellIcon,
  UserIcon,
  ChevronDownIcon,
  MenuIcon,
  Loader2,
} from "lucide-react";
import { UserRoles } from "@shared/schema";

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function Header({ sidebarOpen, setSidebarOpen }: HeaderProps) {
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-20">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        <div className="flex items-center">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-neutral-500 hover:text-primary p-2 focus:outline-none"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold ml-2 hidden sm:block">
            <span className="text-primary">Expen</span>
            <span className="text-neutral-700">Flow</span>
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications button */}
          <button className="text-neutral-500 hover:text-primary">
            <BellIcon className="h-5 w-5" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center focus:outline-none">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                {user?.name ? user.name.charAt(0) : "?"}
                {user?.name ? (user.name.split(" ")[1]?.charAt(0) || "") : ""}
              </div>
              <span className="hidden md:block ml-2 text-sm">{user?.name || "User"}</span>
              <ChevronDownIcon className="h-4 w-4 ml-1" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} disabled={logoutMutation.isPending}>
                {logoutMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
