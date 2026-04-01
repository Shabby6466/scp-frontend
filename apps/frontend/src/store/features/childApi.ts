import { api } from '../api';

export interface Child {
  id: string;
  firstName: string;
  lastName: string;
  branchId: string;
  studentUserId: string;
  guardianName: string | null;
  guardianEmail: string | null;
  guardianPhone: string | null;
  hasAllergies: boolean;
  hasAsthma: boolean;
  hasDiabetes: boolean;
  hasSeizures: boolean;
  takesMedsAtSchool: boolean;
  student?: { id: string; email: string; name: string | null };
  branch?: { id: string; name: string };
}

export interface CreateChildPayload {
  firstName: string;
  lastName: string;
  studentEmail: string;
  studentName?: string;
  guardianName?: string;
  guardianEmail?: string;
  guardianPhone?: string;
  hasAllergies?: boolean;
  hasAsthma?: boolean;
  hasDiabetes?: boolean;
  hasSeizures?: boolean;
  takesMedsAtSchool?: boolean;
}

export const childApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMyChildren: builder.query<Child[], void>({
      query: () => '/children/my',
      providesTags: ['User'],
    }),
    getChildren: builder.query<Child[], { branchId: string }>({
      query: ({ branchId }) => `/branches/${branchId}/children`,
      providesTags: (_result, _err, { branchId }) => [{ type: 'Branch', id: branchId }],
    }),
    getChild: builder.query<Child, string>({
      query: (id) => `/children/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Branch', id }],
    }),
    createChild: builder.mutation<Child, { branchId: string; data: CreateChildPayload }>({
      query: ({ branchId, data }) => ({
        url: `/branches/${branchId}/children`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _err, { branchId }) => [
        { type: 'Branch', id: branchId },
        { type: 'User', id: 'ALL' },
      ],
    }),
    updateChild: builder.mutation<Child, { id: string; data: Record<string, unknown> }>({
      query: ({ id, data }) => ({
        url: `/children/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _err, { id }) => [{ type: 'Branch', id }],
    }),
    deleteChild: builder.mutation<void, string>({
      query: (id) => ({
        url: `/children/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Branch', { type: 'User', id: 'ALL' }],
    }),
  }),
});

export const {
  useGetMyChildrenQuery,
  useGetChildrenQuery,
  useGetChildQuery,
  useCreateChildMutation,
  useUpdateChildMutation,
  useDeleteChildMutation,
} = childApi;
