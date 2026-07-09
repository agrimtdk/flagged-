import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Menu, LogOut, User as UserIcon, Settings as SettingsIcon } from "lucide-react";
import { Sidebar } from "../components/layout/Sidebar";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { Avatar } from "../components/ui/Avatar";
import { Dropdown } from "../components/ui/Dropdown";
import { GlobalSearchModal } from "../components/ui/GlobalSearchModal";
import { CollectionSwitcher } from "../components/dashboard/CollectionSwitcher";
import { useAuth } from "../contexts/AuthContext";
export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, org, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const dropdownItems = [
    {
      label: "My Profile",
      icon: <UserIcon className="h-4 w-4" />,
      onClick: () => navigate("/dashboard/profile"),
    },
    {
      label: "Settings",
      icon: <SettingsIcon className="h-4 w-4" />,
      onClick: () => navigate("/dashboard/settings"),
    },
    {
      label: "Sign Out",
      icon: <LogOut className="h-4 w-4 scale-x-[-1]" />,
      variant: "danger" as const,
      onClick: handleLogout,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-text-primary flex transition-colors">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 h-16 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 transition-colors">
          {/* Left Side: Mobile Toggle, Org Indicator & Collection Switcher */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-border/30 md:hidden cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm bg-accent/15 text-accent px-2.5 py-1 rounded shrink-0">
                {org?.name || "Loading Org..."}
              </span>
              <div className="hidden sm:block h-4 w-px bg-border mx-1" />
              <CollectionSwitcher />
            </div>
          </div>

          {/* Right Side: Theme Toggle & Avatar Dropdown */}
          <div className="flex items-center gap-3.5">
            <ThemeToggle />
            <Dropdown
              trigger={
                <button className="flex items-center gap-2 focus:outline-none cursor-pointer">
                  <Avatar name={user?.full_name || "Guest"} src={user?.avatar_url || undefined} />
                  <span className="hidden sm:inline text-sm font-medium text-text-secondary">
                    {user?.full_name || "Guest"}
                  </span>
                </button>
              }
              items={dropdownItems}
            />
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-grow p-4 sm:p-6 lg:p-8 overflow-y-auto custom-scrollbar">
          <Outlet />
          <GlobalSearchModal />
        </main>
      </div>
    </div>
  );
};

