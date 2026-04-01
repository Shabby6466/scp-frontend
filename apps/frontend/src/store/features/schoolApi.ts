import { api } from '../api';

export interface School {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  _count?: { users: number; branches: number };
}

export interface CreateSchoolDto {
  name: string;
  /** Optional — existing DIRECTOR to link to this school. */
  directorUserId?: string;
}

export interface UpdateSchoolDto {
  name?: string;
}

export const schoolApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSchools: builder.query<School[], void>({
      query: () => '/schools',
      providesTags: ['School'],
    }),
    getSchool: builder.query<School, string>({
      query: (id) => `/schools/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'School', id }],
    }),
    createSchool: builder.mutation<School, CreateSchoolDto>({
      query: (body) => ({
        url: '/schools',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['School', { type: 'User', id: 'ALL' }],
    }),
    updateSchool: builder.mutation<School, { id: string; data: UpdateSchoolDto }>({
      query: ({ id, data }) => ({
        url: `/schools/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _err, { id }) => [{ type: 'School', id }],
    }),
    deleteSchool: builder.mutation<void, string>({
      query: (id) => ({
        url: `/schools/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['School'],
    }),
  }),
});

export const {
  useGetSchoolsQuery,
  useGetSchoolQuery,
  useCreateSchoolMutation,
  useUpdateSchoolMutation,
  useDeleteSchoolMutation,
} = schoolApi;
