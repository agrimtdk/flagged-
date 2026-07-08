import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { collectionService, CollectionItem } from "../services/dataset";
import { useAuth } from "./AuthContext";

interface DatasetContextType {
  collections: CollectionItem[];
  selectedCollectionId: string | null;
  selectedCollection: CollectionItem | null;
  loading: boolean;
  error: string | null;
  selectCollection: (id: string | null) => void;
  refreshCollections: () => Promise<void>;
}

const DatasetContext = createContext<DatasetContextType | undefined>(undefined);

export const DatasetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, org } = useAuth();
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(() => {
    return localStorage.getItem("selected_collection_id") || null;
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCollections = useCallback(async () => {
    if (!isAuthenticated || !org) {
      setCollections([]);
      setSelectedCollectionId(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await collectionService.listCollections({ limit: 100 });
      setCollections(res.items);

      // Verify that if a selectedCollectionId exists in localStorage, it still exists in the list
      if (selectedCollectionId && !res.items.some((c) => c.id === selectedCollectionId)) {
        setSelectedCollectionId(null);
        localStorage.removeItem("selected_collection_id");
      }
    } catch (err: any) {
      console.error("Failed to load data collections:", err);
      setError("Could not load transaction collections.");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, org, selectedCollectionId]);

  useEffect(() => {
    refreshCollections();
  }, [isAuthenticated, org]);

  const selectCollection = (id: string | null) => {
    setSelectedCollectionId(id);
    if (id) {
      localStorage.setItem("selected_collection_id", id);
    } else {
      localStorage.removeItem("selected_collection_id");
    }
  };

  const selectedCollection = collections.find((c) => c.id === selectedCollectionId) || null;

  return (
    <DatasetContext.Provider
      value={{
        collections,
        selectedCollectionId,
        selectedCollection,
        loading,
        error,
        selectCollection,
        refreshCollections,
      }}
    >
      {children}
    </DatasetContext.Provider>
  );
};

export const useDataset = (): DatasetContextType => {
  const context = useContext(DatasetContext);
  if (!context) {
    throw new Error("useDataset must be used within a DatasetProvider");
  }
  return context;
};
