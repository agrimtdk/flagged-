import React, { useState, useRef, useEffect } from "react";
import { Database, ChevronDown, Check, Layers, Upload, Globe } from "lucide-react";
import { useDataset } from "../../contexts/DatasetContext";

export const CollectionSwitcher: React.FC = () => {
  const { collections, selectedCollectionId, selectedCollection, selectCollection, loading } = useDataset();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (id: string | null) => {
    selectCollection(id);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded-lg text-xs sm:text-sm font-medium text-text-primary hover:border-accent/50 transition-colors shadow-sm cursor-pointer"
        title="Switch Data Collection"
      >
        <Database className="h-4 w-4 text-accent" />
        <span className="max-w-[140px] sm:max-w-[200px] truncate">
          {selectedCollection ? selectedCollection.name : "All Collections"}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-text-secondary" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 rounded-xl bg-card border border-border shadow-xl z-50 py-2 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-1.5 border-b border-border/60 mb-1">
            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
              Data Collection View
            </span>
          </div>

          <button
            onClick={() => handleSelect(null)}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-background/80 transition-colors cursor-pointer ${
              selectedCollectionId === null ? "bg-accent/10 text-accent font-semibold" : "text-text-primary"
            }`}
          >
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-text-secondary" />
              <div>
                <div className="font-medium">All Collections (Aggregated)</div>
                <div className="text-[10px] text-text-secondary">View data across all uploads and APIs</div>
              </div>
            </div>
            {selectedCollectionId === null && <Check className="h-4 w-4 text-accent" />}
          </button>

          <div className="my-1 border-t border-border/40" />

          <div className="max-h-60 overflow-y-auto pr-1 custom-scrollbar">
            {loading ? (
              <div className="px-3 py-4 text-center text-xs text-text-secondary">Loading collections...</div>
            ) : collections.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-text-secondary">No collections created yet.</div>
            ) : (
              collections.map((col) => {
                const isSelected = col.id === selectedCollectionId;
                const isCSV = col.source === "CSV";
                return (
                  <button
                    key={col.id}
                    onClick={() => handleSelect(col.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-background/80 transition-colors cursor-pointer ${
                      isSelected ? "bg-accent/10 text-accent font-semibold" : "text-text-primary"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      {isCSV ? (
                        <Upload className="h-3.5 w-3.5 text-accent shrink-0" />
                      ) : (
                        <Globe className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                      )}
                      <div className="truncate">
                        <div className="font-medium truncate">{col.name}</div>
                        <div className="text-[10px] text-text-secondary flex items-center gap-1.5">
                          <span>{col.total_rows.toLocaleString()} txs</span>
                          <span>•</span>
                          <span className={col.status === "Completed" ? "text-green-500" : "text-amber-500"}>
                            {col.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-accent shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
