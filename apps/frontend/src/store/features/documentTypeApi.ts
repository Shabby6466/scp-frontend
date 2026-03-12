import { api } from '../api';

export interface SchemaField {
  name: string;
  type: 'text' | 'date' | 'number' | 'select' | 'file' | 'textarea';
  label: string;
  required: boolean;
  options?: string[];
}

export interface DocumentTypeSchema {
  fields: SchemaField[];
}

export interface DocumentType {
  id: string;
  name: string;
  schema: DocumentTypeSchema;
  isMandatory: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { documents: number };
}

interface CreateDocumentTypeRequest {
  name: string;
  schema: DocumentTypeSchema;
  isMandatory?: boolean;
}

interface UpdateDocumentTypeRequest {
  id: string;
  name?: string;
  schema?: DocumentTypeSchema;
  isMandatory?: boolean;
}

export const documentTypeApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDocumentTypes: builder.query<DocumentType[], void>({
      query: () => '/document-types',
      providesTags: ['DocumentType'],
    }),
    getDocumentType: builder.query<DocumentType, string>({
      query: (id) => `/document-types/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'DocumentType', id }],
    }),
    createDocumentType: builder.mutation<DocumentType, CreateDocumentTypeRequest>({
      query: (body) => ({
        url: '/document-types',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['DocumentType'],
    }),
    updateDocumentType: builder.mutation<DocumentType, UpdateDocumentTypeRequest>({
      query: ({ id, ...body }) => ({
        url: `/document-types/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'DocumentType', id },
        'DocumentType',
      ],
    }),
    deleteDocumentType: builder.mutation<void, string>({
      query: (id) => ({
        url: `/document-types/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['DocumentType'],
    }),
  }),
});

export const {
  useGetDocumentTypesQuery,
  useGetDocumentTypeQuery,
  useCreateDocumentTypeMutation,
  useUpdateDocumentTypeMutation,
  useDeleteDocumentTypeMutation,
} = documentTypeApi;
