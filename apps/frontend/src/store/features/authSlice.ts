import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  schoolId: string | null;
  branchId?: string | null;
  school?: { id: string; name: string } | null;
  branch?: { id: string; name: string; schoolId?: string } | null;
  authorities?: string[];
  emailVerifiedAt?: string | null;
  staffPosition?: string | null;
  staffClearanceActive?: boolean;
  assignedBy?: { id: string; name: string | null; email: string } | null;
  directorProfile?: { officePhone: string | null; notes: string | null } | null;
  branchDirectorProfile?: {
    branchStartDate: string | null;
    notes: string | null;
  } | null;
  teacherProfile?: {
    subjectArea: string | null;
    employeeCode: string | null;
    joiningDate: string | null;
  } | null;
  studentProfile?: {
    rollNumber: string | null;
    guardianName: string | null;
    guardianPhone: string | null;
  } | null;
  ownerDirector?: { id: string; name: string | null; email: string } | null;
  ownerBranchDirector?: { id: string; name: string | null; email: string } | null;
  /** From GET /auth/me — login payloads may omit this until sync. */
  hasPassword?: boolean;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: AuthUser; accessToken: string }>,
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
