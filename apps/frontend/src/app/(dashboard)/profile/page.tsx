'use client';

import { useState } from 'react';
import { useGetMeQuery } from '@/store/features/authApi';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldContent, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RoleBadge } from '@/components/users/role-badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InlineLoading } from '@/components/layout/inline-loading';
import { Eye, EyeOff, Info } from 'lucide-react';

/** Placeholder only — the real password is never sent from the server. */
const PASSWORD_MASK = '••••••••••••';

export default function ProfilePage() {
  const { data: me, isLoading, isError } = useGetMeQuery();
  const [passwordVisible, setPasswordVisible] = useState(false);

  if (isLoading) {
    return <InlineLoading message="Loading profile…" />;
  }

  if (isError || !me) {
    return (
      <p className="text-sm text-destructive">Could not load your profile. Try signing in again.</p>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader
        title="My profile"
        description="Your account details. Only a supervisor can change your name or password."
      />

      <Card className="border-border/80 shadow-elevated">
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
          <CardDescription>
            Read-only. Use show/hide to switch how the password placeholder is displayed — your real
            password is not stored in plain text and cannot be retrieved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field>
            <FieldLabel>Name</FieldLabel>
            <FieldContent>
              <Input readOnly value={me.name ?? '—'} className="bg-muted/40" />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Email</FieldLabel>
            <FieldContent>
              <Input readOnly value={me.email} className="bg-muted/40" />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Role</FieldLabel>
            <FieldContent>
              <div className="flex h-10 items-center">
                <RoleBadge role={me.role} />
              </div>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>Password</FieldLabel>
            <FieldContent>
              {me.hasPassword ? (
                <div className="relative">
                  <Input
                    readOnly
                    type={passwordVisible ? 'text' : 'password'}
                    value={PASSWORD_MASK}
                    className="bg-muted/40 pr-10 font-mono text-sm"
                    aria-label={passwordVisible ? 'Password placeholder (visible)' : 'Password placeholder (hidden)'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 w-10 text-muted-foreground hover:text-foreground"
                    onClick={() => setPasswordVisible((v) => !v)}
                    aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                  >
                    {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              ) : (
                <Input readOnly value="No password set" className="bg-muted/40 text-sm" />
              )}
            </FieldContent>
          </Field>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Need a change?</AlertTitle>
            <AlertDescription>
              Only a platform admin can change your name or password (from <strong>Users</strong> in
              the sidebar). Your actual password is stored securely and cannot be displayed.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
