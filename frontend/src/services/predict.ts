import { api } from "./api";
import { API_ENDPOINTS } from "./constants";

export interface PredictRequest {
  transaction_external_id: string;
  amount: number;
  card_brand: string;
  billing_country: string;
  ip_address: string;
  device_type: string;
  email_domain: string;
  card_country: string;
}

export interface FeatureReason {
  feature: string;
  impact: number;
}

export interface PredictionDetails {
  reasons: FeatureReason[];
}

export interface PredictResponse {
  prediction_id: string;
  transaction_id: string;
  transaction_external_id: string;
  risk_score: number;
  is_fraud: boolean;
  confidence_score?: number;
  confidence_level?: string;
  confidence_explanation?: string;
  dataset_id?: string;
  prediction_details: PredictionDetails;
  model_version: string;
  prediction_latency_ms?: number;
}

export interface CSVRowError {
  row_number: number;
  field: string;
  error: string;
}

export interface CSVUploadResponse {
  batch_id: string;
  total_rows: number;
  processed_rows: number;
  failed_rows: number;
  fraud_detected: number;
  validation_errors: CSVRowError[];
}

export interface TransactionItem {
  id: string;
  prediction_id: string;
  dataset_id?: string;
  transaction_external_id: string;
  amount: number;
  card_brand: string;
  billing_country: string;
  ip_address: string;
  device_type: string;
  email_domain: string;
  card_country: string;
  risk_score: number;
  is_fraud: boolean;
  confidence_score?: number;
  confidence_level?: string;
  prediction_details: any;
  model_version: string;
  threshold_used: number;
  threshold_version?: string;
  feature_schema_version?: string;
  source: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

export interface TransactionFilters {
  page?: number;
  page_size?: number;
  dataset_id?: string;
  source?: string;
  is_fraud?: boolean;
  date_from?: string;
  date_to?: string;
  risk_score_min?: number;
  risk_score_max?: number;
  search?: string;
  sort_by?: string;
  sort_order?: string;
}

// Analytics interfaces
export interface TopCountryItem {
  country: string;
  count: number;
  fraud_count: number;
}

export interface TopBrandItem {
  brand: string;
  count: number;
  fraud_count: number;
}

export interface DeviceDistributionItem {
  device_type: string;
  count: number;
}

export interface FraudByDeviceItem {
  device_type: string;
  fraud_count: number;
  total: number;
}

export interface FraudByCountryItem {
  country: string;
  fraud_count: number;
  total: number;
}

export interface AnalyticsSummary {
  total_transactions: number;
  total_fraud: number;
  fraud_rate: number;
  avg_risk_score: number;
  transactions_today: number;
  transactions_this_week: number;
  top_billing_countries: TopCountryItem[];
  top_card_brands: TopBrandItem[];
  device_distribution: DeviceDistributionItem[];
  fraud_by_device: FraudByDeviceItem[];
  fraud_by_country: FraudByCountryItem[];
  source_distribution: Record<string, number>;
}

export interface TimelinePoint {
  date: string;
  total: number;
  fraud: number;
  avg_risk: number;
}

export const predictionService = {
  async predictTransaction(data: PredictRequest): Promise<PredictResponse> {
    const response = await api.post<PredictResponse>(API_ENDPOINTS.PREDICT, data);
    return response.data;
  },

  async predict(data: PredictRequest): Promise<PredictResponse> {
    const response = await api.post<PredictResponse>(API_ENDPOINTS.PREDICT, data);
    return response.data;
  },

  async uploadCSV(
    file: File,
    onProgress?: (progressEvent: any) => void
  ): Promise<CSVUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    
    const response = await api.post<CSVUploadResponse>(API_ENDPOINTS.TRANSACTIONS_UPLOAD, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: onProgress,
    });
    return response.data;
  },

  async getTransactions(params: TransactionFilters): Promise<PaginatedResponse<TransactionItem>> {
    const response = await api.get<PaginatedResponse<TransactionItem>>(API_ENDPOINTS.TRANSACTIONS_LIST, {
      params,
    });
    return response.data;
  },

  async getTransaction(predictionId: string): Promise<TransactionItem> {
    const response = await api.get<TransactionItem>(`${API_ENDPOINTS.TRANSACTIONS_LIST}/${predictionId}`);
    return response.data;
  },

  async getAnalyticsSummary(datasetId?: string | null): Promise<AnalyticsSummary> {
    const params = datasetId ? { dataset_id: datasetId } : undefined;
    const response = await api.get<AnalyticsSummary>(`${API_ENDPOINTS.ANALYTICS}/summary`, {
      params,
    });
    return response.data;
  },

  async getAnalyticsTimeline(days: number = 30, datasetId?: string | null): Promise<TimelinePoint[]> {
    const params: any = { days };
    if (datasetId) params.dataset_id = datasetId;
    const response = await api.get<TimelinePoint[]>(`${API_ENDPOINTS.ANALYTICS}/timeline`, {
      params,
    });
    return response.data;
  },

  async getModelInformatics(): Promise<any> {
    const response = await api.get<any>(`${API_ENDPOINTS.ANALYTICS}/model-informatics`);
    return response.data;
  },
};

