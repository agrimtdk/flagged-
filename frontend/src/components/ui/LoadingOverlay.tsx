import React from "react";
import { Spinner } from "./Spinner";

export interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isVisible, message }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-background/80 backdrop-blur-[2px] transition-all">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        {message && <p className="text-sm font-semibold text-text-primary">{message}</p>}
      </div>
    </div>
  );
};
