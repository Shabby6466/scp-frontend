import { api } from '../api';
import type { AuthUser } from './authSlice';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

interface VerifyEmailRequest {
  email: string;
  code?: string;
  token?: string;
  password?: string;
}

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
    }),
    register: builder.mutation<{ message: string; skipVerification?: boolean }, RegisterRequest>({
      query: (body) => ({
        url: '/auth/register',
        method: 'POST',
        body,
      }),
    }),
    verifyEmail: builder.mutation<AuthResponse, VerifyEmailRequest>({
      query: (body) => ({
        url: '/auth/verify-email',
        method: 'POST',
        body,
      }),
    }),
    resendVerification: builder.mutation<{ message: string }, { email: string }>({
      query: (body) => ({
        url: '/auth/resend-verification',
        method: 'POST',
        body,
      }),
    }),
    getMe: builder.query<AuthUser, void>({
      query: () => '/auth/me',
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useVerifyEmailMutation,
  useResendVerificationMutation,
  useGetMeQuery,
  useLogoutMutation,
} = authApi;
