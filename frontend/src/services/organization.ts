import { api } from "./api";
import { API_ENDPOINTS } from "./constants";

export interface OrganizationProfile {
  id: string;
  name: string;
  risk_threshold?: number;
}

export const organizationService = {
  async getCurrentOrganization(): Promise<OrganizationProfile> {
    const response = await api.get<OrganizationProfile>(API_ENDPOINTS.ORGANIZATION_CURRENT || "/api/v1/organizations/current");
    return response.data;
  },
  async updateCurrentOrganization(name: string, risk_threshold?: number): Promise<OrganizationProfile> {
    const payload: any = { name };
    if (risk_threshold !== undefined) payload.risk_threshold = risk_threshold;
    const response = await api.patch<OrganizationProfile>(API_ENDPOINTS.ORGANIZATION_CURRENT || "/api/v1/organizations/current", payload);
    return response.data;
  },
  async getThreshold(): Promise<{ risk_threshold: number }> {
    const response = await api.get<{ risk_threshold: number }>("/api/v1/organizations/current/threshold");
    return response.data;
  },
  async updateThreshold(risk_threshold: number): Promise<{ risk_threshold: number }> {
    const response = await api.patch<{ risk_threshold: number }>("/api/v1/organizations/current/threshold", { risk_threshold });
    return response.data;
  },
  async pruneAuditLogs(): Promise<{ status: string; message: string; pruned_count?: number }> {
    const response = await api.delete<{ status: string; message: string; pruned_count?: number }>("/api/v1/organizations/current/audit-logs");
    return response.data;
  },
};
