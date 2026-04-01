'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLoginMutation } from '@/store/features/authApi';
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
import { AuthLayout } from '@/components/auth-layout';
import { getPostLoginPath } from '@/lib/post-login-path';
import { useGetPublicSettingsQuery } from '@/store/features/settingsApi';
import { toast } from '@/lib/toast';
import { LogIn, Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [login, { isLoading, error }] = useLoginMutation();
  const { data: publicSettings } = useGetPublicSettingsQuery();
  const registeredToastShown = useRef(false);

  useEffect(() => {
    if (searchParams.get('registered') !== '1' || registeredToastShown.current) return;
    registeredToastShown.current = true;
    toast('Account created. You can sign in now.');
    router.replace('/login', { scroll: false });
  }, [searchParams, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const result = await login(data).unwrap();
      dispatch(setCredentials({ user: result.user, accessToken: result.accessToken }));
      router.push(getPostLoginPath(result.user.role, result.user));
    } catch {
      // error is handled below
    }
  };

  const apiMessage =
    error && 'data' in error
      ? (error.data as { message?: string })?.message ?? 'Login failed'
      : error
        ? 'Network error. Please try again.'
        : null;

  return (
    <AuthLayout>
        <Card className="shadow-overlay overflow-visible border-0">
          <CardHeader className="space-y-2 pb-8 pt-10 text-center">
            <CardTitle className="font-serif text-4xl tracking-tight text-primary">School System</CardTitle>
            <CardDescription className="text-base">Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent className="px-8 flex flex-col gap-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="email" className="text-primary font-semibold">Email</FieldLabel>
                <FieldContent>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    {...register('email')}
                    className="h-12 rounded-2xl"
                    aria-invalid={!!errors.email}
                  />
                  <FieldError>{errors.email?.message}</FieldError>
                </FieldContent>
              </Field>

              <Field data-invalid={!!errors.password}>
                <FieldLabel htmlFor="password" className="text-primary font-semibold">Password</FieldLabel>
                <FieldContent>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      {...register('password')}
                      className="h-12 rounded-2xl pr-12"
                      aria-invalid={!!errors.password}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-12 w-12 text-muted-foreground hover:text-primary transition-colors"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                  <FieldError>{errors.password?.message}</FieldError>
                </FieldContent>
              </Field>

              {apiMessage && (
                <Alert variant="destructive" className="rounded-2xl border-0 bg-destructive/10 text-destructive shadow-none">
                  <AlertDescription className="font-medium text-sm">{apiMessage}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="h-12 w-full rounded-2xl font-bold shadow-md" size="lg" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign in'}
                {!isLoading && <LogIn className="ml-2 h-5 w-5" />}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center pb-10 pt-4">
            {publicSettings?.selfRegistrationEnabled === false ? (
              <p className="text-center text-sm text-muted-foreground">
                New accounts are invite-only. Contact your administrator if you need access.
              </p>
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="font-bold text-primary underline-offset-4 hover:underline">
                  Sign up
                </Link>
              </p>
            )}
          </CardFooter>
        </Card>
    </AuthLayout>
  );
}
