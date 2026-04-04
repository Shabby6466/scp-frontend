'use client';

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useVerifyEmailMutation, useResendVerificationMutation } from '@/store/features/authApi';
import { useGetPublicSettingsQuery } from '@/store/features/settingsApi';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/features/authSlice';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Field, FieldContent, FieldError, FieldLabel } from '@/components/ui/field';
import { toast, toastError } from '@/lib/toast';
import { AuthLayout } from '@/components/auth/auth-layout';
import { getPostLoginPath } from '@/lib/post-login-path';
import { Shield } from 'lucide-react';

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') ?? '';
  const tokenParam = searchParams.get('token') ?? '';
  const isInvite = searchParams.get('invite') === '1';
  const useMagicLinkInvite = isInvite && tokenParam.length >= 32;
  const dispatch = useAppDispatch();
  const [verifyEmail, { isLoading, error }] = useVerifyEmailMutation();
  const [resendVerification, { isLoading: resending }] = useResendVerificationMutation();
  const { data: publicSettings } = useGetPublicSettingsQuery();

  const formSchema = useMemo(
    () =>
      z
        .object({
          email: z.string().email('Invalid email address'),
          password: z.string().optional(),
          code: z.string().optional(),
        })
        .superRefine((data, ctx) => {
          if (useMagicLinkInvite) {
            if (!data.password?.trim() || data.password.length < 8) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Password must be at least 8 characters',
                path: ['password'],
              });
            }
            return;
          }
          if (isInvite) {
            if (!data.password?.trim() || data.password.length < 8) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Password must be at least 8 characters',
                path: ['password'],
              });
            }
            if (!data.code?.trim() || !/^\d{6}$/.test(data.code)) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Enter the 6-digit code',
                path: ['code'],
              });
            }
            return;
          }
          if (!data.code?.trim() || !/^\d{6}$/.test(data.code)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Enter the 6-digit code',
              path: ['code'],
            });
          }
        }),
    [useMagicLinkInvite, isInvite],
  );

  type FormValues = z.infer<typeof formSchema>;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: emailParam,
      password: '',
      code: '',
    },
  });

  const emailValue = watch('email');

  const onSubmit = async (data: FormValues) => {
    try {
      const result = await verifyEmail({
        email: data.email,
        ...(useMagicLinkInvite
          ? { token: tokenParam }
          : { code: data.code?.trim() ?? '' }),
        ...(isInvite && data.password ? { password: data.password } : {}),
      }).unwrap();
      dispatch(setCredentials({ user: result.user, accessToken: result.accessToken }));
      router.push(getPostLoginPath(result.user.role, result.user));
    } catch {
      // error is handled below
    }
  };

  const handleResend = async () => {
    if (!emailValue) {
      toastError(null, 'Enter your email first');
      return;
    }
    try {
      await resendVerification({ email: emailValue }).unwrap();
      toast('Verification code sent. Check your email.');
    } catch (err) {
      toastError(err, 'Failed to resend code');
    }
  };

  const apiMessage =
    error && 'data' in error
      ? (error.data as { message?: string })?.message ?? 'Verification failed'
      : error
        ? 'Network error. Please try again.'
        : null;

  const showResend =
    !useMagicLinkInvite && publicSettings?.otpEmailVerificationEnabled !== false;

  return (
    <AuthLayout>
      <Card className="shadow-elevated">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl tracking-tight">Verify your email</CardTitle>
          <CardDescription>
            {useMagicLinkInvite
              ? 'Set your password to finish accepting your invite.'
              : isInvite
                ? 'Enter the code from your invite email and set your password.'
                : 'We sent a 6-digit code to your email. Enter it below.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <FieldContent>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className="h-10"
                  aria-invalid={!!errors.email}
                />
                <FieldError>{errors.email?.message}</FieldError>
              </FieldContent>
            </Field>

            {isInvite && (
              <Field data-invalid={!!errors.password}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <FieldContent>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    {...register('password')}
                    className="h-10"
                    aria-invalid={!!errors.password}
                  />
                  <FieldError>{errors.password?.message}</FieldError>
                </FieldContent>
              </Field>
            )}

            {!useMagicLinkInvite && (
              <Field data-invalid={!!errors.code}>
                <FieldLabel htmlFor="code">Verification code</FieldLabel>
                <FieldContent>
                  <Input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                    {...register('code')}
                    className="h-12 text-center text-lg tracking-[0.5em]"
                    aria-invalid={!!errors.code}
                  />
                  <FieldError>{errors.code?.message}</FieldError>
                </FieldContent>
              </Field>
            )}

            {apiMessage && (
              <Alert variant="destructive">
                <AlertDescription>{apiMessage}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              <Shield className="mr-2 h-4 w-4" />
              {isLoading ? 'Verifying...' : 'Verify and sign in'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 border-t pt-6 sm:flex-row sm:justify-center">
          {showResend ? (
            <p className="text-center text-sm text-muted-foreground">
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
              >
                {resending ? 'Sending...' : 'Resend code'}
              </button>
              {' · '}
              <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
                Back to login
              </Link>
            </p>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
                Back to login
              </Link>
            </p>
          )}
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}
