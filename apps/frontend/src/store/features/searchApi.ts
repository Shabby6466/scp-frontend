import { api } from '../api';
import type { Document } from './documentApi';

interface SearchResult {
  items: Document[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface SearchParams {
  q?: string;
  status?: string;
  schoolId?: string;
  documentTypeId?: string;
  page?: number;
  limit?: number;
}

export const searchApi = api.injectEndpoints({
  endpoints: (builder) => ({
    searchDocuments: builder.query<SearchResult, SearchParams>({
      query: (params) => ({
        url: '/search',
        params,
      }),
    }),
  }),
});

export const { useSearchDocumentsQuery, useLazySearchDocumentsQuery } = searchApi;
