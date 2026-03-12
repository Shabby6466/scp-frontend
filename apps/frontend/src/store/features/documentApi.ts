import { api } from '../api';

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  filePath: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface Document {
  id: string;
  documentTypeId: string;
  documentType: { id: string; name: string };
  metadata: Record<string, unknown> | null;
  filePath: string;
  version: number;
  status: 'PENDING' | 'VALID' | 'EXPIRED' | 'ARCHIVED';
  expiresAt: string | null;
  uploadedBy: string;
  schoolId: string;
  branchId: string | null;
  createdAt: string;
  updatedAt: string;
  versions?: DocumentVersion[];
}

interface DocumentList {
  items: Document[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface DocumentStats {
  total: number;
  valid: number;
  expired: number;
  pending: number;
  expiringSoon: number;
}

interface QueryParams {
  schoolId?: string;
  branchId?: string;
  documentTypeId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export const documentApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDocuments: builder.query<DocumentList, QueryParams | void>({
      query: (params) => ({
        url: '/documents',
        params: params ?? {},
      }),
      providesTags: ['Document'],
    }),
    getDocument: builder.query<Document, string>({
      query: (id) => `/documents/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Document', id }],
    }),
    getDocumentStats: builder.query<DocumentStats, { schoolId?: string; branchId?: string } | void>({
      query: (params) => ({
        url: '/documents/stats',
        params: params ?? {},
      }),
      providesTags: ['Document'],
    }),
    uploadDocument: builder.mutation<Document, FormData>({
      query: (formData) => ({
        url: '/documents/upload',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Document'],
    }),
    reuploadDocument: builder.mutation<Document, { id: string; formData: FormData }>({
      query: ({ id, formData }) => ({
        url: `/documents/${id}/reupload`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Document', id }, 'Document'],
    }),
    getDownloadUrl: builder.query<{ url: string; expiresIn: number }, string>({
      query: (id) => `/documents/${id}/download`,
    }),
  }),
});

export const {
  useGetDocumentsQuery,
  useGetDocumentQuery,
  useGetDocumentStatsQuery,
  useUploadDocumentMutation,
  useReuploadDocumentMutation,
  useLazyGetDownloadUrlQuery,
} = documentApi;
