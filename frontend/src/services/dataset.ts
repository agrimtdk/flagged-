import { api } from "./api";
import { API_ENDPOINTS } from "./constants";

export type CollectionSource = "API" | "CSV" | string;
export type CollectionStatus = "Uploading" | "Processing" | "Completed" | "Failed" | "Archived" | string;

export interface CollectionItem {
  id: string;
  name: string;
  organization_id: string;
  source: CollectionSource;
  original_filename?: string;
  created_by: string;
  file_size_bytes?: number;
  total_rows: number;
  fraud_count: number;
  avg_risk_score: number;
  model_version: string;
  threshold_version: string;
  feature_schema_version: string;
  processing_duration_ms?: number;
  status: CollectionStatus;
  created_at: string;
  updated_at: string;
}

export interface CollectionListResponse {
  items: CollectionItem[];
  total: number;
}

export interface CollectionFilters {
  source?: string;
  status?: string;
  limit?: number;
}

export const collectionService = {
  async listCollections(params?: CollectionFilters): Promise<CollectionListResponse> {
    const response = await api.get<CollectionListResponse>(API_ENDPOINTS.COLLECTIONS, {
      params,
    });
    return response.data;
  },

  async getCollection(id: string): Promise<CollectionItem> {
    const response = await api.get<CollectionItem>(`${API_ENDPOINTS.COLLECTIONS}/${id}`);
    return response.data;
  },
};
