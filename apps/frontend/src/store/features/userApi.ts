import { api } from '../api';
import { Document } from './documentApi';

export interface UserSummary {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  /** Optional teacher metadata used by compliance dashboards. */
  staffPosition?: string | null;
  staffClearanceActive?: boolean;
  /** Present on admin global list. */
  school?: { id: string; name: string } | null;
  branch?: { id: string; name: string; schoolId?: string } | null;
  schoolId?: string | null;
  branchId?: string | null;
}

export interface UserDetail extends UserSummary {
  school: { id: string; name: string } | null;
  branch: { id: string; name: string; schoolId: string } | null;
  directorProfile?: { officePhone?: string; notes?: string } | null;
  branchDirectorProfile?: { branchStartDate?: string; notes?: string } | null;
  teacherProfile?: { subjectArea?: string; employeeCode?: string; joiningDate?: string } | null;
  studentProfile?: { rollNumber?: string; guardianName?: string; guardianPhone?: string } | null;
  ownerDocuments: (Document & { documentType?: { name: string } })[];
  requiredDocTypes: { id: string; name: string; isMandatory: boolean; renewalPeriod: string }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
  };
}

export interface SearchUserParams {
  query?: string;
  role?: string;
  branchId?: string;
  staffPosition?: string;
  staffClearanceActive?: boolean;
  schoolId?: string;
  page?: number;
  limit?: number;
}

export interface CreateUserDto {
  email: string;
  name: string;
  role: 'DIRECTOR' | 'BRANCH_DIRECTOR' | 'TEACHER' | 'STUDENT';
  schoolId?: string;
  /** Required when creating a teacher (assign to a branch). */
  branchId?: string;
}

export const userApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAllUsers: builder.query<PaginatedResponse<UserSummary>, SearchUserParams | void>({
      query: (params) => ({ url: '/users', params: params || undefined }),
      providesTags: [{ type: 'User', id: 'ALL' }],
    }),
    getSchoolUsers: builder.query<
      PaginatedResponse<UserSummary>,
      { schoolId: string; params?: SearchUserParams }
    >({
      query: ({ schoolId, params }) => ({ url: `/schools/${schoolId}/users`, params }),
      providesTags: (_result, _err, { schoolId }) => [{ type: 'User', id: `school-${schoolId}` }],
    }),
    getTeachers: builder.query<UserSummary[], void>({
      query: () => '/teachers',
      providesTags: ['User'],
    }),
    getBranchDirectorCandidates: builder.query<UserSummary[], string>({
      query: (schoolId) => `/schools/${schoolId}/branch-director-candidates`,
      providesTags: (_r, _e, schoolId) => [{ type: 'User', id: `bd-candidates-${schoolId}` }],
    }),
    createUser: builder.mutation<
      UserSummary,
      { schoolId?: string; data: CreateUserDto }
    >({
      query: ({ schoolId, data }) => {
        const sid = schoolId?.trim();
        if (sid) {
          return {
            url: `/schools/${sid}/users`,
            method: 'POST',
            body: { ...data, schoolId: data.schoolId ?? sid },
          };
        }
        return { url: '/users', method: 'POST', body: data };
      },
      invalidatesTags: (_result, _err, { schoolId, data }) => {
        const tags: { type: 'User'; id: string }[] = [{ type: 'User', id: 'ALL' }];
        const sid = schoolId?.trim();
        if (sid) {
          tags.push({ type: 'User', id: `school-${sid}` });
          tags.push({ type: 'User', id: `bd-candidates-${sid}` });
        }
        const branchId = data.branchId?.trim();
        return [
          ...tags,
          ...(branchId ? ([{ type: 'Branch', id: `teachers-${branchId}` }] as const) : []),
        ];
      },
    }),
    updateUser: builder.mutation<
      UserSummary,
      {
        id: string;
        body: {
          name?: string;
          password?: string;
          /** Admin: assign director to school or BD to pool (empty clears). */
          schoolId?: string;
          /** Admin: assign teacher / BD to branch (empty clears teacher branch). */
          branchId?: string;
        };
      }
    >({
      query: ({ id, body }) => ({
        url: `/users/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['User'],
    }),
    searchUsers: builder.query<PaginatedResponse<UserSummary>, SearchUserParams>({
      query: (params) => ({ url: '/users/search', params }),
      providesTags: ['User'],
    }),
    getUserDetail: builder.query<UserDetail, string>({
      query: (id) => `/users/${id}/detail`,
      providesTags: (_r, _e, id) => [{ type: 'User', id }],
    }),
  }),
});

export const {
  useGetAllUsersQuery,
  useGetSchoolUsersQuery,
  useGetTeachersQuery,
  useGetBranchDirectorCandidatesQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useSearchUsersQuery,
  useGetUserDetailQuery,
} = userApi;
