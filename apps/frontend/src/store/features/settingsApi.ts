import { api } from '../api';

export interface AppSettingsPublic {
  otpEmailVerificationEnabled: boolean;
  selfRegistrationEnabled: boolean;
}

export const settingsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPublicSettings: builder.query<AppSettingsPublic, void>({
      query: () => '/settings/public',
      providesTags: ['AppSettings'],
    }),
    getAppSettings: builder.query<AppSettingsPublic, void>({
      query: () => '/settings',
      providesTags: ['AppSettings'],
    }),
    updateAppSettings: builder.mutation<AppSettingsPublic, Partial<AppSettingsPublic>>({
      query: (body) => ({
        url: '/settings',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['AppSettings'],
    }),
  }),
});

export const {
  useGetPublicSettingsQuery,
  useGetAppSettingsQuery,
  useUpdateAppSettingsMutation,
} = settingsApi;
