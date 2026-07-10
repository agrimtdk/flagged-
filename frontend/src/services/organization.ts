import { api } from "./api";
import { API_ENDPOINTS } from "./constants";

export interface OrganizationProfile {
  id: string;
  name: string;
}

export const organizationService = {
  async getCurrentOrganization(): Promise<OrganizationProfile> {
    const response = await api.get<OrganizationProfile>(API_ENDPOINTS.ORGANIZATION_CURRENT || "/api/v1/organizations/current");
    return response.data;
  },
  async updateCurrentOrganization(name: string): Promise<OrganizationProfile> {
    const response = await api.patch<OrganizationProfile>(API_ENDPOINTS.ORGANIZATION_CURRENT || "/api/v1/organizations/current", { name });
    return response.data;
  },
  async pruneAuditLogs(): Promise<{ status: string; message: string; pruned_count?: number }> {
    const response = await api.delete<{ status: string; message: string; pruned_count?: number }>("/api/v1/organizations/current/audit-logs");
    return response.data;
  },
};
