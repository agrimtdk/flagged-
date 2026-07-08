import React from "react";
import { Link } from "react-router-dom";
import { AlertOctagon } from "lucide-react";
import { Button } from "../../components/ui/Button";

export const ServerError: React.FC = () => {
  return (
    <div className="flex-grow flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 text-red-600 mb-6 shadow-sm">
        <AlertOctagon className="h-12 w-12" />
      </div>
      <h1 className="text-4xl font-extrabold text-text-primary mb-2 font-solway">Server Error</h1>
      <p className="text-sm text-text-secondary max-w-sm mb-8 leading-relaxed">
        An unexpected error occurred in our fraud detection cluster. Our engineering team has been notified.
      </p>
      <Link to="/">
        <Button size="md">Return Home</Button>
      </Link>
    </div>
  );
};
