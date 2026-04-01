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
