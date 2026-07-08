import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "../../components/ui/Button";

export const Unauthorized: React.FC = () => {
  return (
    <div className="flex-grow flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 mb-6 shadow-sm">
        <ShieldAlert className="h-12 w-12" />
      </div>
      <h1 className="text-4xl font-extrabold text-text-primary mb-2 font-solway">Access Denied</h1>
      <p className="text-sm text-text-secondary max-w-sm mb-8 leading-relaxed">
        You do not have the required permission scopes to view this console screen. Contact your organization owner.
      </p>
      <Link to="/dashboard">
        <Button size="md">Back to Console</Button>
      </Link>
    </div>
  );
};
