import React from "react";
import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ToastProvider } from "./contexts/ToastContext";
import { AuthProvider } from "./contexts/AuthContext";
import { DatasetProvider } from "./contexts/DatasetContext";
import { router } from "./router";

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <DatasetProvider>
            <RouterProvider router={router} />
          </DatasetProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};
