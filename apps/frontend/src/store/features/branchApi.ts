import { api } from '../api';

export interface Branch {
  id: string;
  name: string;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
  school?: { id: string; name: string };
  /** Present on GET/PATCH /branches/:id — branch directors assigned to this location. */
  users?: { id: string; email: string; name: string | null; role: string }[];
}

export interface BranchDashboardSummary {
  branchId: string;
  schoolId: string;
  studentCount: number;
  teacherCount: number;
  teachersConsidered: number;
  teachersWithAllRequiredForms: number;
  formsNearExpiryCount: number;
  compliance: {
    requiredSlots: number;
    satisfiedSlots: number;
    missingSlots: number;
  };
}

export interface BranchRecentDocument {
  id: string;
  formRef: string;
  fileName: string;
  documentTypeName: string;
  category: string;
  issuedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  addedBy: { id: string; name: string | null; email: string };
}

export interface ComplianceStudentRow {
  kind: 'STUDENT';
  userId: string;
  name: string;
  guardianName: string | null;
  guardianEmail: string | null;
  requiredCount: number;
  uploadedSatisfiedCount: number;
  missingCount: number;
}

export interface ComplianceTeacherRow {
  kind: 'TEACHER';
  userId: string;
  name: string;
  email: string;
  requiredCount: number;
  uploadedSatisfiedCount: number;
  missingCount: number;
}

export interface BranchCompliancePeople {
  students: ComplianceStudentRow[];
  teachers: ComplianceTeacherRow[];
}

export interface BranchTeacherUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  schoolId?: string | null;
  branchId?: string | null;
  createdAt: string;
  staffPosition?: string | null;
  staffClearanceActive?: boolean;
  branch?: { id: string; name: string; schoolId?: string } | null;
}

export const branchApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getBranchDashboardSummary: builder.query<BranchDashboardSummary, string>({
      query: (branchId) => `/branches/${branchId}/dashboard-summary`,
      providesTags: (_r, _e, branchId) => [{ type: 'Branch', id: `dash-${branchId}` }],
    }),
    getBranchRecentDocuments: builder.query<BranchRecentDocument[], { branchId: string; limit?: number }>({
      query: ({ branchId, limit = 20 }) => ({
        url: `/branches/${branchId}/documents/recent`,
        params: { limit },
      }),
      providesTags: (_r, _e, { branchId }) => [{ type: 'Branch', id: `recent-${branchId}` }],
    }),
    getBranchCompliancePeople: builder.query<BranchCompliancePeople, string>({
      query: (branchId) => `/branches/${branchId}/compliance/people`,
      providesTags: (_r, _e, branchId) => [{ type: 'Branch', id: `people-${branchId}` }],
    }),
    getBranches: builder.query<Branch[], string>({
      query: (schoolId) => `/schools/${schoolId}/branches`,
      providesTags: (_result, _err, schoolId) => [{ type: 'School', id: `branches-${schoolId}` }],
    }),
    getBranch: builder.query<Branch, string>({
      query: (id) => `/branches/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'School', id }],
    }),
    getBranchTeachers: builder.query<BranchTeacherUser[], string>({
      query: (branchId) => `/branches/${branchId}/teachers`,
      providesTags: (_result, _err, branchId) => [{ type: 'Branch', id: `teachers-${branchId}` }],
    }),
    createBranch: builder.mutation<
      Branch,
      { schoolId: string; name: string; branchDirectorUserId?: string }
    >({
      query: ({ schoolId, name, branchDirectorUserId }) => ({
        url: `/schools/${schoolId}/branches`,
        method: 'POST',
        body: {
          name,
          ...(branchDirectorUserId ? { branchDirectorUserId } : {}),
        },
      }),
      invalidatesTags: (_result, _err, { schoolId }) => [
        'School',
        'User',
        { type: 'School', id: schoolId },
        { type: 'School', id: `branches-${schoolId}` },
        { type: 'User', id: `bd-candidates-${schoolId}` },
      ],
    }),
    updateBranch: builder.mutation<
      Branch,
      {
        branchId: string;
        schoolId: string;
        data: { name?: string; branchDirectorUserId?: string };
      }
    >({
      query: ({ branchId, data }) => ({
        url: `/branches/${branchId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_r, _e, { branchId, schoolId }) => [
        'School',
        'User',
        { type: 'School', id: branchId },
        { type: 'School', id: `branches-${schoolId}` },
        { type: 'User', id: `bd-candidates-${schoolId}` },
      ],
    }),
  }),
});

export const {
  useGetBranchesQuery,
  useGetBranchQuery,
  useGetBranchTeachersQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useGetBranchDashboardSummaryQuery,
  useGetBranchRecentDocumentsQuery,
  useGetBranchCompliancePeopleQuery,
} = branchApi;
