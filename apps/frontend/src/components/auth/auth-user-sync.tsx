'use client';

import { useEffect } from 'react';
import { useGetMeQuery } from '@/store/features/authApi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setCredentials } from '@/store/features/authSlice';

/** Refreshes user (including branch.schoolId) from the API so persisted auth stays accurate for /users etc. */
export function AuthUserSync() {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const { data } = useGetMeQuery(undefined, { skip: !accessToken });

  useEffect(() => {
    if (data && accessToken) {
      dispatch(
        setCredentials({
          user: {
            id: data.id,
            email: data.email,
            name: data.name,
            role: data.role,
            schoolId: data.schoolId,
            branchId: data.branchId ?? null,
            school: data.school ?? null,
            branch: data.branch ?? null,
            hasPassword: data.hasPassword,
          },
          accessToken,
        }),
      );
    }
  }, [data, accessToken, dispatch]);

  return null;
}
