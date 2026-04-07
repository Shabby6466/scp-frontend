import { api } from '../api';

export interface Document {
  id: string;
  documentTypeId: string;
  ownerUserId?: string | null;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  issuedAt: string | null;
  expiresAt: string | null;
  verifiedAt: string | null;
  createdAt: string;
  documentType?: {
    id: string;
    name: string;
    targetRole?: string;
    isMandatory?: boolean;
    renewalPeriod?: string;
  };
  ownerUser?: { id: string; name: string; email: string; role: string };
}

export interface SearchDocumentParams {
  query?: string;
  schoolId?: string;
  branchId?: string;
  documentTypeId?: string;
  verified?: boolean;
  ownerRole?: string;
}

export const documentApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDocumentsByOwner: builder.query<Document[], string>({
      query: (ownerUserId) => `/documents/owner/${ownerUserId}`,
      providesTags: (_result, _err, ownerUserId) => [{ type: 'Document', id: `owner-${ownerUserId}` }],
    }),
    getDocumentsByStaff: builder.query<Document[], string>({
      query: (staffId) => `/documents/staff/${staffId}`,
      providesTags: (_result, _err, staffId) => [{ type: 'Document', id: `staff-${staffId}` }],
    }),
    presign: builder.mutation<
      { uploadUrl: string; s3Key: string; uploadToken?: string },
      {
        ownerUserId: string;
        documentTypeId: string;
        fileName: string;
        mimeType: string;
      }
    >({
      query: (body) => ({
        url: '/documents/presign',
        method: 'POST',
        body,
      }),
    }),
    completeDocument: builder.mutation<
      Document,
      {
        ownerUserId: string;
        documentTypeId: string;
        s3Key: string;
        fileName: string;
        mimeType: string;
        sizeBytes: number;
        issuedAt?: string;
        expiresAt?: string;
      }
    >({
      query: (body) => ({
        url: '/documents/complete',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _err, { ownerUserId }) => [
        { type: 'Document' as const, id: `owner-${ownerUserId}` },
        'Branch',
        'Analytics',
      ],
    }),
    getAssignedSummary: builder.query<
      {
        assignedCount: number;
        uploadedCount: number;
        remainingCount: number;
        items: Array<{
          documentType: { id: string; name: string; renewalPeriod: string; targetRole?: string | null };
          latestDocument: Document | null;
          remainingDays: number | null;
        }>;
      },
      void
    >({
      query: () => '/documents/assigned/me/summary',
      providesTags: ['Document', 'DocumentType'],
    }),
    getPerFormDetail: builder.query<
      {
        owner: { id: string; name: string | null; email: string };
        documentType: { id: string; name: string; renewalPeriod: string } | null;
        latestDocument: Document | null;
        uploadedDate: string | null;
        dueDate: string | null;
        remainingDays: number | null;
      },
      { ownerUserId: string; documentTypeId: string }
    >({
      query: ({ ownerUserId, documentTypeId }) =>
        `/documents/owner/${ownerUserId}/type/${documentTypeId}`,
      providesTags: (_r, _e, arg) => [{ type: 'Document', id: `owner-${arg.ownerUserId}` }],
    }),
    exportPerFormPdf: builder.mutation<
      Blob,
      { ownerUserId: string; documentTypeId: string }
    >({
      query: ({ ownerUserId, documentTypeId }) => ({
        url: `/documents/owner/${ownerUserId}/type/${documentTypeId}/export`,
        method: 'GET',
        responseHandler: async (response) => response.blob(),
      }),
    }),
    getDownloadUrl: builder.query<string, string>({
      query: (id) => `/documents/${id}/download`,
    }),
    verifyDocument: builder.mutation<Document, string>({
      query: (id) => ({
        url: `/documents/${id}/verify`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Document', 'Branch', 'Analytics'],
    }),
    verifyMany: builder.mutation<{ count: number; total: number }, string[]>({
      query: (ids) => ({
        url: '/documents/verify-many',
        method: 'PATCH',
        body: { ids },
      }),
      invalidatesTags: ['Document', 'Branch', 'Analytics'],
    }),
    nudge: builder.mutation<{ success: boolean }, { ownerUserId: string; documentTypeId: string }>({
      query: ({ ownerUserId, documentTypeId }) => ({
        url: `/documents/owner/${ownerUserId}/type/${documentTypeId}/nudge`,
        method: 'POST',
      }),
    }),
    searchDocuments: builder.query<Document[], SearchDocumentParams>({
      query: (params) => ({ url: '/documents/search', params }),
      providesTags: ['Document'],
    }),
  }),
});

export const {
  useGetDocumentsByOwnerQuery,
  useGetDocumentsByStaffQuery,
  usePresignMutation,
  useCompleteDocumentMutation,
  useGetAssignedSummaryQuery,
  useGetPerFormDetailQuery,
  useExportPerFormPdfMutation,
  useLazyGetDownloadUrlQuery,
  useVerifyDocumentMutation,
  useVerifyManyMutation,
  useNudgeMutation,
  useSearchDocumentsQuery,
} = documentApi;
