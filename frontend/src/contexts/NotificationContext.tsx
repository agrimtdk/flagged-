import React, { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from "lucide-react";

export type NotificationType = "success" | "warning" | "error" | "info";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  autoDismiss?: boolean;
}

interface NotificationContextType {
  addNotification: (notification: Omit<NotificationItem, "id">) => void;
  removeNotification: (id: string) => void;
  addToast: (message: string, type?: NotificationType) => void;
}

const defaultNotificationContext: NotificationContextType = {
  addNotification: () => {},
  removeNotification: () => {},
  addToast: (message: string, type?: NotificationType) => {
    console.log(`[Toast ${type || "info"}]: ${message}`);
  },
};

const NotificationContext = createContext<NotificationContextType>(defaultNotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback((item: Omit<NotificationItem, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const notification: NotificationItem = {
      id,
      autoDismiss: item.autoDismiss !== undefined ? item.autoDismiss : true,
      ...item,
    };
    setNotifications((prev) => [...prev, notification]);

    if (notification.autoDismiss) {
      setTimeout(() => {
        removeNotification(id);
      }, 4500);
    }
  }, [removeNotification]);

  const addToast = useCallback((message: string, type: NotificationType = "info") => {
    addNotification({
      type,
      message,
      autoDismiss: true,
    });
  }, [addNotification]);

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-accent" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
  };

  const borderColors = {
    success: "border-accent/40",
    warning: "border-amber-500/40",
    error: "border-red-500/40",
    info: "border-blue-500/40",
  };

  return (
    <NotificationContext.Provider value={{ addNotification, removeNotification, addToast }}>
      {children}
      
      {/* Notification Portal Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 w-full max-w-md pointer-events-none" role="live">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`pointer-events-auto flex items-start gap-3.5 p-4 rounded-lg border bg-card text-text-primary shadow-2xl transition-all duration-200 transform translate-y-0 ${borderColors[n.type]}`}
          >
            <div className="shrink-0 mt-0.5">{icons[n.type]}</div>
            <div className="flex-1 min-w-0">
              {n.title && <p className="font-semibold text-sm text-text-primary mb-0.5">{n.title}</p>}
              <p className="text-xs text-text-secondary leading-relaxed break-words">{n.message}</p>
            </div>
            <button
              onClick={() => removeNotification(n.id)}
              className="shrink-0 p-1 rounded text-text-secondary hover:text-text-primary hover:bg-border/40 transition-colors cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  return useContext(NotificationContext);
};

export const useToast = useNotification;
