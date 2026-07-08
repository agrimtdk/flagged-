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
};
