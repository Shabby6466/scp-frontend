import { api } from '../api';

export interface AuditLogEntry {
  id: string;
  action: string;
  entityId: string | null;
  userId: string;
  details: Record<string, unknown> | null;
  createdAt: string;
}

interface AuditLogList {
  items: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface AuditQuery {
  userId?: string;
  action?: string;
  page?: number;
  limit?: number;
}

export const auditApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAuditLogs: builder.query<AuditLogList, AuditQuery | void>({
      query: (params) => ({
        url: '/audit-logs',
        params: params ?? {},
      }),
      providesTags: ['AuditLog'],
    }),
  }),
});

export const { useGetAuditLogsQuery } = auditApi;
