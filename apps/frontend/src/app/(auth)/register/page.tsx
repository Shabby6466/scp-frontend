'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useRegisterMutation } from '@/store/features/authApi';
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
import { AuthLayout } from '@/components/auth/auth-layout';
import { useGetPublicSettingsQuery } from '@/store/features/settingsApi';
import { UserPlus, Eye, EyeOff } from 'lucide-react';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [registerUser, { isLoading, error }] = useRegisterMutation();
  const { data: publicSettings, isLoading: settingsLoading } = useGetPublicSettingsQuery();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      const result = await registerUser(data).unwrap();
      if (result.skipVerification) {
        router.push(`/login?registered=1`);
        return;
      }
      router.push(`/verify?email=${encodeURIComponent(data.email)}`);
    } catch {
      // error is handled below
    }
  };

  const apiMessage =
    error && 'data' in error
      ? (error.data as { message?: string })?.message ?? 'Registration failed'
      : error
        ? 'Network error. Please try again.'
        : null;

  if (!settingsLoading && publicSettings?.selfRegistrationEnabled === false) {
    return (
      <AuthLayout>
        <Card className="shadow-elevated">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl tracking-tight">Sign up unavailable</CardTitle>
            <CardDescription>
              Self-service registration is turned off. Ask an administrator to invite you by email.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center border-t pt-6">
            <Link href="/login" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
              Back to sign in
            </Link>
          </CardFooter>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
        <Card className="shadow-overlay overflow-visible border-0">
          <CardHeader className="space-y-2 pb-8 pt-10 text-center">
            <CardTitle className="font-serif text-4xl tracking-tight text-primary">Create an account</CardTitle>
            <CardDescription className="text-base">
              {publicSettings?.otpEmailVerificationEnabled === false
                ? 'Sign up with your email and password. You can sign in right away once your account is created.'
                : 'Sign up with your email. You&apos;ll receive a verification code.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 flex flex-col gap-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="name" className="text-primary font-semibold">Name</FieldLabel>
                <FieldContent>
                  <Input
                    id="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Your name"
                    {...register('name')}
                    className="h-12 rounded-2xl"
                    aria-invalid={!!errors.name}
                  />
                  <FieldError>{errors.name?.message}</FieldError>
                </FieldContent>
              </Field>

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
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
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

              <Button
                type="submit"
                className="h-12 w-full rounded-2xl font-bold shadow-md"
                size="lg"
                disabled={isLoading || settingsLoading}
              >
                {isLoading ? 'Creating account...' : 'Sign up'}
                {!isLoading && <UserPlus className="ml-2 h-5 w-5" />}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center pb-10 pt-4">
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="font-bold text-primary underline-offset-4 hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
    </AuthLayout>
  );
}
