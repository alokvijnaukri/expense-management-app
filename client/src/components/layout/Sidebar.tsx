import React from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  HomeIcon,
  PlusCircleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  LayersIcon,
  BarChartIcon,
  SettingsIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const [location, navigate] = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => {
    return location === path;
  };

  const navItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: <HomeIcon className="h-5 w-5 mr-3" />,
      roles: ["employee", "manager", "finance", "admin"],
    },
    {
      name: "New Claim",
      path: "/new-claim",
      icon: <PlusCircleIcon className="h-5 w-5 mr-3" />,
      badge: null,
      roles: ["employee", "manager", "finance", "admin"],
    },
    {
      name: "Pending Claims",
      path: "/pending-claims",
      icon: <ClockIcon className="h-5 w-5 mr-3" />,
      badge: 36,
      roles: ["employee", "manager", "finance", "admin"],
    },
    {
      name: "Approved Claims",
      path: "/approved-claims",
      icon: <CheckCircleIcon className="h-5 w-5 mr-3" />,
      badge: null,
      roles: ["employee", "manager", "finance", "admin"],
    },
    {
      name: "Rejected Claims",
      path: "/rejected-claims",
      icon: <XCircleIcon className="h-5 w-5 mr-3" />,
      badge: null,
      roles: ["employee", "manager", "finance", "admin"],
    },
    {
      name: "Approval Queue",
      path: "/approval-queue",
      icon: <LayersIcon className="h-5 w-5 mr-3" />,
      badge: 24,
      roles: ["manager", "finance", "admin"],
    },
    {
      name: "Reports",
      path: "/reports",
      icon: <BarChartIcon className="h-5 w-5 mr-3" />,
      badge: null,
      roles: ["finance", "admin"],
    },
    {
      name: "Settings",
      path: "/settings",
      icon: <SettingsIcon className="h-5 w-5 mr-3" />,
      badge: null,
      roles: ["admin"],
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <aside
      className={cn(
        "fixed top-16 left-0 bottom-0 w-64 bg-white shadow-md transform transition-transform duration-200 ease-in-out z-10",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex flex-col h-full">
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems
            .filter((item) => item.roles.includes(user?.role || "employee"))
            .map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={cn(
                  "flex items-center w-full px-3 py-2 rounded-md transition duration-150 ease-in-out",
                  isActive(item.path)
                    ? "bg-primary text-white"
                    : "text-neutral-700 hover:bg-neutral-100"
                )}
              >
                {item.icon}
                <span>{item.name}</span>
                {item.badge && (
                  <span className="ml-auto bg-warning text-neutral-700 text-xs font-medium rounded-full px-2 py-0.5">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
        </nav>

        <div className="p-4 border-t border-neutral-200">
          <div className="flex items-center">
            <div className="relative w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-medium">
              {user?.name ? user.name.charAt(0) : "?"}
              {user?.name ? (user.name.split(" ")[1]?.charAt(0) || "") : ""}
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-neutral-700">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-neutral-400">{user?.designation || "Loading..."}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
