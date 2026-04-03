import { api } from '../api';

export interface DocumentType {
  id: string;
  name: string;
  category?: string;
  targetRole?: string | null;
  createdById?: string | null;
  isMandatory: boolean;
  renewalPeriod: string;
  isConditional?: boolean;
  conditionField?: string | null;
  appliesToPositions?: unknown;
}

export const documentTypeApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDocumentTypes: builder.query<
      DocumentType[],
      { schoolId?: string; targetRole?: string }
    >({
      query: (params) => ({
        url: '/document-types',
        params,
      }),
      providesTags: ['DocumentType'],
    }),
    getDocumentType: builder.query<DocumentType, string>({
      query: (id) => `/document-types/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'DocumentType', id }],
    }),
    createDocumentType: builder.mutation<
      DocumentType,
      {
        name: string;
        targetRole: string;
        schoolId?: string;
        renewalPeriod?: string;
      }
    >({
      query: (body) => ({
        url: '/document-types',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['DocumentType'],
    }),
    assignDocumentTypeUsers: builder.mutation<
      {
        id: string;
        name: string;
        targetRole: string | null;
        requiredUsers: Array<{
          id: string;
          name: string | null;
          email: string;
          role: string;
          schoolId: string | null;
          branchId: string | null;
        }>;
      },
      { documentTypeId: string; userIds: string[] }
    >({
      query: ({ documentTypeId, userIds }) => ({
        url: `/document-types/${documentTypeId}/assign`,
        method: 'POST',
        body: { userIds },
      }),
      invalidatesTags: ['DocumentType', 'Document'],
    }),
    unassignDocumentTypeUser: builder.mutation<
      unknown,
      { documentTypeId: string; userId: string }
    >({
      query: ({ documentTypeId, userId }) => ({
        url: `/document-types/${documentTypeId}/assign/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['DocumentType', 'Document'],
    }),
    getAssignedDocumentTypesForMe: builder.query<DocumentType[], void>({
      query: () => '/document-types/assigned/me',
      providesTags: ['DocumentType', 'Document'],
    }),
    getDocumentTypeAssignees: builder.query<
      {
        id: string;
        name: string;
        targetRole: string | null;
        requiredUsers: Array<{
          id: string;
          name: string | null;
          email: string;
          role: string;
          schoolId: string | null;
          branchId: string | null;
        }>;
      },
      string
    >({
      query: (documentTypeId) => `/document-types/${documentTypeId}/assignees`,
      providesTags: (_result, _err, id) => [{ type: 'DocumentType', id }],
    }),
  }),
});

export const {
  useGetDocumentTypesQuery,
  useGetDocumentTypeQuery,
  useCreateDocumentTypeMutation,
  useAssignDocumentTypeUsersMutation,
  useUnassignDocumentTypeUserMutation,
  useGetAssignedDocumentTypesForMeQuery,
  useGetDocumentTypeAssigneesQuery,
} = documentTypeApi;
