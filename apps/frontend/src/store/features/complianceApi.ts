import { api } from '../api';

export interface HeatmapCell {
  schoolId: string;
  schoolName: string;
  branchId: string | null;
  branchName: string | null;
  documentTypeName: string;
  documentTypeId: string;
  total: number;
  valid: number;
  expired: number;
  pending: number;
  compliancePercent: number;
}

export interface AuditReadiness {
  score: number;
  totalRequired: number;
  totalValid: number;
  missing: { documentTypeName: string; count: number }[];
}

export const complianceApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getHeatmap: builder.query<HeatmapCell[], { schoolId?: string } | void>({
      query: (params) => ({
        url: '/compliance/heatmap',
        params: params ?? {},
      }),
    }),
    getAuditReadiness: builder.query<AuditReadiness, { schoolId?: string } | void>({
      query: (params) => ({
        url: '/compliance/audit-readiness',
        params: params ?? {},
      }),
    }),
  }),
});

export const { useGetHeatmapQuery, useGetAuditReadinessQuery } = complianceApi;
