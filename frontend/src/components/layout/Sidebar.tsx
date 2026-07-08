import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CreditCard,
  TrendingUp,
  Key,
  User,
  Settings,
  LogOut,
  X,
  Cpu,
  Upload,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    onClose();
    await logout();
    navigate("/login");
  };

  const menuItems = [
    { label: "Overview", path: "/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: "Transactions", path: "/dashboard/transactions", icon: <CreditCard className="h-5 w-5" /> },
    { label: "Analytics", path: "/dashboard/analytics", icon: <TrendingUp className="h-5 w-5" /> },
    { label: "CSV Center", path: "/dashboard/uploads", icon: <Upload className="h-5 w-5" /> },
    { label: "Model Informatics", path: "/dashboard/model-informatics", icon: <Cpu className="h-5 w-5" /> },
    { label: "API Keys", path: "/dashboard/api-keys", icon: <Key className="h-5 w-5" /> },
    { label: "Profile", path: "/dashboard/profile", icon: <User className="h-5 w-5" /> },
    { label: "Settings", path: "/dashboard/settings", icon: <Settings className="h-5 w-5" /> },
  ];


  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col transition-transform duration-100 ease-in-out md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-border">
          <Link
            to="/dashboard"
            onClick={onClose}
            className="text-lg font-bold tracking-tight text-text-primary flex items-center gap-1"
          >
            <span>flagged</span>
            <span className="text-accent font-extrabold text-xl">!</span>
          </Link>
          <button
            onClick={onClose}
            className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-border/30 md:hidden cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>


        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">

          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-text-secondary hover:text-text-primary hover:bg-border/20"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Logout */}
        <div className="p-4 border-t border-border bg-card/50">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-500/10 transition-colors text-left cursor-pointer"
          >
            <LogOut className="h-5 w-5 scale-x-[-1]" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
