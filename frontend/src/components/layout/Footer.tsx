import React from "react";
import { Link } from "react-router-dom";

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border mt-auto transition-colors">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Product</h4>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/pricing" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/docs" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                  Documentation
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Company</h4>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/about" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Security</h4>
            <ul className="mt-4 space-y-2">
              <li>
                <span className="text-sm text-text-secondary">Row-Level Isolation</span>
              </li>
              <li>
                <span className="text-sm text-text-secondary">Google Auth</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Platform</h4>
            <div className="mt-4">
              <span className="text-xl font-bold tracking-tight text-text-primary flex items-center gap-0.5">
                <span>flagged</span>
                <span className="text-accent font-extrabold">!</span>
              </span>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                AI-Powered Fraud Detection Platform for Businesses. Secure, scalable, and instant.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-8 flex items-center justify-between">
          <p className="text-sm text-text-secondary">
            &copy; {currentYear} flagged!. All rights reserved.
          </p>
          <div className="text-xs text-text-secondary">
            Built for enterprise SaaS workloads.
          </div>
        </div>
      </div>
    </footer>
  );
};
