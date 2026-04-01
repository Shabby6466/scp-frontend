'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import {
  useGetAppSettingsQuery,
  useUpdateAppSettingsMutation,
} from '@/store/features/settingsApi';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { InlineLoading } from '@/components/inline-loading';
import { toast, toastError } from '@/lib/toast';
import { Settings2 } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const user = useAppSelector((s) => s.auth.user);
  const { data, isLoading, isFetching } = useGetAppSettingsQuery(undefined, {
    skip: user?.role !== 'ADMIN',
  });
  const [updateSettings, { isLoading: saving }] = useUpdateAppSettingsMutation();

  const [otpEnabled, setOtpEnabled] = useState(true);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (data) {
      setOtpEnabled(data.otpEmailVerificationEnabled);
      setRegistrationEnabled(data.selfRegistrationEnabled);
    }
  }, [data]);

  const handleSave = async () => {
    try {
      await updateSettings({
        otpEmailVerificationEnabled: otpEnabled,
        selfRegistrationEnabled: registrationEnabled,
      }).unwrap();
      toast('Settings saved');
    } catch (err) {
      toastError(err, 'Could not save settings');
    }
  };

  const dirty =
    data &&
    (otpEnabled !== data.otpEmailVerificationEnabled ||
      registrationEnabled !== data.selfRegistrationEnabled);

  if (user?.role !== 'ADMIN') {
    return <InlineLoading message="Redirecting…" />;
  }

  if (isLoading || !data) {
    return <InlineLoading message="Loading settings…" />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="System settings"
        description="Control how people sign up and verify their email. Only platform admins can change these options."
      />

      <Card className="border-border/80 shadow-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings2 className="h-4 w-4" />
            Authentication
          </CardTitle>
          <CardDescription>
            These apply to the whole application. With OTP off, no verification or invite emails are sent;
            admin-created users are added immediately.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 p-4">
            <Checkbox
              id="otp-toggle"
              checked={otpEnabled}
              onCheckedChange={(v) => setOtpEnabled(v === true)}
              className="mt-0.5"
            />
            <div className="min-w-0 space-y-1">
              <Label htmlFor="otp-toggle" className="text-sm font-medium leading-none">
                Email OTP verification
              </Label>
              <p className="text-sm text-muted-foreground">
                When on, sign-up and admin invites send a 6-digit code by email. When off, no email is sent:
                self-signup is verified immediately, and users you add from the Users screen are created
                without an invite (set their password another way if they need to sign in).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 p-4">
            <Checkbox
              id="reg-toggle"
              checked={registrationEnabled}
              onCheckedChange={(v) => setRegistrationEnabled(v === true)}
              className="mt-0.5"
            />
            <div className="min-w-0 space-y-1">
              <Label htmlFor="reg-toggle" className="text-sm font-medium leading-none">
                Self-service account creation
              </Label>
              <p className="text-sm text-muted-foreground">
                When off, the public &quot;Sign up&quot; flow is disabled. Admins can still create users from
                the Users area.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button type="button" onClick={handleSave} disabled={!dirty || saving || isFetching}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
            {dirty ? (
              <span className="text-xs text-muted-foreground">You have unsaved changes.</span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
