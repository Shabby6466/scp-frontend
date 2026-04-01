import { api } from '../api';

export interface Document {
  id: string;
  documentTypeId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  issuedAt: string | null;
  expiresAt: string | null;
  verifiedAt: string | null;
  createdAt: string;
  documentType?: { id: string; name: string; category: string; isMandatory?: boolean; renewalPeriod?: string };
}

export const documentApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDocumentsByChild: builder.query<Document[], string>({
      query: (childId) => `/documents/child/${childId}`,
      providesTags: (_result, _err, childId) => [{ type: 'Document', id: `child-${childId}` }],
    }),
    getDocumentsByStaff: builder.query<Document[], string>({
      query: (staffId) => `/documents/staff/${staffId}`,
      providesTags: (_result, _err, staffId) => [{ type: 'Document', id: `staff-${staffId}` }],
    }),
    getDocumentsByBranchFacility: builder.query<Document[], string>({
      query: (branchId) => `/documents/branch/${branchId}/facility`,
      providesTags: (_result, _err, branchId) => [{ type: 'Document', id: `facility-${branchId}` }],
    }),
    presign: builder.mutation<
      { uploadUrl: string; s3Key: string; uploadToken?: string },
      { category: string; entityId: string; documentTypeId: string; fileName: string; mimeType: string }
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
        category: string;
        entityId: string;
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
      invalidatesTags: (_result, _err, { category, entityId }) => [
        { type: 'Document', id: category === 'CHILD' ? `child-${entityId}` : category === 'STAFF' ? `staff-${entityId}` : `facility-${entityId}` },
        'Branch',
        'Analytics',
      ],
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
  }),
});

export const {
  useGetDocumentsByChildQuery,
  useGetDocumentsByStaffQuery,
  useGetDocumentsByBranchFacilityQuery,
  usePresignMutation,
  useCompleteDocumentMutation,
  useLazyGetDownloadUrlQuery,
  useVerifyDocumentMutation,
} = documentApi;
