import { api } from '../api';

export type FormsBucket = 'day' | 'week' | 'month';

export interface SubmissionsBucket {
  label: string;
  count: number;
}

export interface FormSubmissionsResponse {
  buckets: SubmissionsBucket[];
}

export interface FormUploaderRow {
  role: string;
  count: number;
}

export interface FormByUploaderResponse {
  byRole: FormUploaderRow[];
  total: number;
}

export interface FormExpiryRow {
  formName: string;
  total: number;
  active: number;
  nearExpiry: number;
  expired: number;
  noExpiry: number;
}

export interface FormExpiryByTypeResponse {
  rows: FormExpiryRow[];
}

export const analyticsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getFormSubmissions: builder.query<
      FormSubmissionsResponse,
      { from: string; to: string; bucket: FormsBucket; documentTypeId?: string }
    >({
      query: (params) => ({
        url: '/analytics/forms/submissions',
        params: {
          from: params.from,
          to: params.to,
          bucket: params.bucket,
          ...(params.documentTypeId ? { documentTypeId: params.documentTypeId } : {}),
        },
      }),
      providesTags: ['Analytics'],
    }),
    getFormByUploader: builder.query<
      FormByUploaderResponse,
      { from: string; to: string; bucket: FormsBucket; documentTypeId?: string }
    >({
      query: (params) => ({
        url: '/analytics/forms/by-uploader',
        params: {
          from: params.from,
          to: params.to,
          bucket: params.bucket,
          ...(params.documentTypeId ? { documentTypeId: params.documentTypeId } : {}),
        },
      }),
      providesTags: ['Analytics'],
    }),
    getFormExpiryByType: builder.query<FormExpiryByTypeResponse, { documentTypeId?: string } | void>({
      query: (arg) => ({
        url: '/analytics/forms/expiry-by-type',
        ...(arg?.documentTypeId ? { params: { documentTypeId: arg.documentTypeId } } : {}),
      }),
      providesTags: ['Analytics'],
    }),
  }),
});

export const {
  useGetFormSubmissionsQuery,
  useGetFormByUploaderQuery,
  useGetFormExpiryByTypeQuery,
} = analyticsApi;
