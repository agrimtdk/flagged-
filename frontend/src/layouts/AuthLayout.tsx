import React from "react";
import { Link, Outlet } from "react-router-dom";
import { ThemeToggle } from "../components/ui/ThemeToggle";

export const AuthLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background text-text-primary transition-colors">
      {/* Small Header */}
      <header className="h-16 flex items-center justify-between px-6 bg-card border-b border-border">
        <Link to="/" className="text-xl font-bold tracking-tight text-text-primary flex items-center gap-1">
          <span>flagged</span>
          <span className="text-accent font-extrabold text-2xl">!</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Centered Login Box */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
