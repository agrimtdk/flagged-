import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight, FileText, BarChart2, Key, Upload, Settings, User, Activity, Zap, Sun, Moon } from "lucide-react";
import { ROUTES } from "../../router/constants";
import { useTheme } from "../../hooks/useTheme";

interface SearchItem {
  id: string;
  title: string;
  category: "Navigation" | "Quick Action" | "Governance";
  icon: React.ReactNode;
  action: () => void;
}

export const GlobalSearchModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const items: SearchItem[] = [
    {
      id: "nav-home",
      title: "Dashboard Overview",
      category: "Navigation",
      icon: <Activity className="h-4 w-4" />,
      action: () => navigate(ROUTES.DASHBOARD),
    },
    {
      id: "nav-tx",
      title: "Transaction Center",
      category: "Navigation",
      icon: <FileText className="h-4 w-4" />,
      action: () => navigate(ROUTES.TRANSACTIONS),
    },
    {
      id: "nav-analytics",
      title: "Analytics Center",
      category: "Navigation",
      icon: <BarChart2 className="h-4 w-4" />,
      action: () => navigate(ROUTES.ANALYTICS),
    },
    {
      id: "nav-uploads",
      title: "CSV Center (Uploads)",
      category: "Navigation",
      icon: <Upload className="h-4 w-4" />,
      action: () => navigate(ROUTES.UPLOADS || "/dashboard/uploads"),
    },
    {
      id: "nav-keys",
      title: "API Key Management",
      category: "Navigation",
      icon: <Key className="h-4 w-4" />,
      action: () => navigate(ROUTES.API_KEYS),
    },
    {
      id: "nav-model",
      title: "Model Informatics (12 Governance Sections)",
      category: "Governance",
      icon: <Zap className="h-4 w-4" />,
      action: () => navigate(ROUTES.MODEL_INFORMATICS),
    },
    {
      id: "nav-profile",
      title: "User Profile",
      category: "Navigation",
      icon: <User className="h-4 w-4" />,
      action: () => navigate(ROUTES.PROFILE),
    },
    {
      id: "nav-settings",
      title: "Organization Settings",
      category: "Navigation",
      icon: <Settings className="h-4 w-4" />,
      action: () => navigate(ROUTES.SETTINGS),
    },
    {
      id: "action-theme",
      title: `Switch to ${theme === "dark" ? "Light" : "Dark"} Theme`,
      category: "Quick Action",
      icon: theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-400" />,
      action: () => toggleTheme(),
    },
    {
      id: "action-upload-csv",
      title: "Upload CSV Transactions Batch",
      category: "Quick Action",
      icon: <Upload className="h-4 w-4 text-accent" />,
      action: () => navigate(ROUTES.UPLOADS || "/dashboard/uploads"),
    },
    {
      id: "action-gen-key",
      title: "Provision New API Key Credential",
      category: "Quick Action",
      icon: <Key className="h-4 w-4 text-accent" />,
      action: () => navigate(ROUTES.API_KEYS),
    },
  ];

  const filteredItems = items.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  const handleSelect = (index: number) => {
    const item = filteredItems[index];
    if (item) {
      item.action();
      setIsOpen(false);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === "Enter" && filteredItems.length > 0) {
      e.preventDefault();
      handleSelect(selectedIndex);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-border bg-background/50">
          <Search className="h-5 w-5 text-text-secondary shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search sections... (e.g., transactions, keys)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            className="w-full bg-transparent text-text-primary placeholder-text-secondary text-sm focus:outline-none"
          />
          <button
            onClick={() => setIsOpen(false)}
            className="px-1.5 py-0.5 text-[10px] font-mono font-semibold uppercase bg-border/40 text-text-secondary rounded border border-border/60 hover:bg-border transition-colors ml-2 shrink-0 cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[360px] overflow-y-auto py-2 px-2 flex flex-col gap-1">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-sm text-text-secondary">
              No matching pages or commands found for "{query}".
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(idx)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-sm transition-all cursor-pointer ${
                    isSelected
                      ? "bg-accent/20 text-text-primary border border-accent/40 font-medium shadow-sm"
                      : "text-text-secondary hover:bg-border/30 hover:text-text-primary border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={isSelected ? "text-accent" : "text-text-secondary"}>{item.icon}</span>
                    <span className="truncate">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background/60 border border-border/40 text-text-secondary uppercase">
                      {item.category}
                    </span>
                    {isSelected && <ArrowRight className="h-3.5 w-3.5 text-accent animate-pulse" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border bg-background/30 flex items-center justify-between text-[11px] text-text-secondary">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1 py-0.5 rounded bg-border/40 font-mono text-[10px]">↑</kbd> <kbd className="px-1 py-0.5 rounded bg-border/40 font-mono text-[10px]">↓</kbd> to navigate</span>
            <span><kbd className="px-1 py-0.5 rounded bg-border/40 font-mono text-[10px]">ESC</kbd> to close</span>
          </div>
          <span><kbd className="px-1 py-0.5 rounded bg-border/40 font-mono text-[10px]">↵</kbd> to select</span>
        </div>
      </div>
    </div>
  );
};
