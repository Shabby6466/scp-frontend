import { api } from '../api';

export interface DocumentType {
  id: string;
  name: string;
  category: string;
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
      { category?: string; schoolId?: string; position?: string; childId?: string }
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
  }),
});

export const {
  useGetDocumentTypesQuery,
  useGetDocumentTypeQuery,
} = documentTypeApi;
