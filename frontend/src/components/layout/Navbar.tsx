import React from "react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "../ui/ThemeToggle";

export const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 bg-card border-b border-border transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold tracking-tight text-text-primary flex items-center gap-1.5 hover:text-accent transition-colors">
              <span>flagged</span>
              <span className="text-accent font-extrabold text-2xl leading-none">!</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-8">
            <Link to="/about" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              About
            </Link>
            <Link to="/pricing" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              Pricing
            </Link>
            <Link to="/docs" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              Documentation
            </Link>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link to="/login" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              Sign In
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center px-4 py-2 border border-accent rounded text-sm font-medium text-accent-foreground bg-accent hover:bg-accent/90 transition-colors font-bold"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
