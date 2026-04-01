'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGetBranchQuery } from '@/store/features/branchApi';
import { useCreateChildMutation } from '@/store/features/childApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
} from '@/components/ui/field';
import { Checkbox } from '@/components/ui/checkbox';
import { FormShell } from '@/components/form-shell';
import { PageBackLink } from '@/components/page-back-link';
import { PageHeader } from '@/components/page-header';
import { InlineLoading } from '@/components/inline-loading';

const CONDITION_FIELDS = [
  { key: 'hasAllergies' as const, label: 'Has allergies' },
  { key: 'hasAsthma' as const, label: 'Has asthma' },
  { key: 'hasDiabetes' as const, label: 'Has diabetes' },
  { key: 'hasSeizures' as const, label: 'Has seizures' },
  { key: 'takesMedsAtSchool' as const, label: 'Takes meds at school' },
];

export default function NewChildPage() {
  const params = useParams();
  const branchId = params.id as string;
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    studentEmail: '',
    studentName: '',
    guardianName: '',
    guardianEmail: '',
    guardianPhone: '',
    hasAllergies: false,
    hasAsthma: false,
    hasDiabetes: false,
    hasSeizures: false,
    takesMedsAtSchool: false,
  });

  const { data: branch } = useGetBranchQuery(branchId);
  const [createChild, { isLoading }] = useCreateChildMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.studentEmail.trim()) return;
    try {
      const child = await createChild({
        branchId,
        data: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          studentEmail: form.studentEmail.trim(),
          studentName: form.studentName.trim() || undefined,
          guardianName: form.guardianName.trim() || undefined,
          guardianEmail: form.guardianEmail.trim() || undefined,
          guardianPhone: form.guardianPhone.trim() || undefined,
          hasAllergies: form.hasAllergies,
          hasAsthma: form.hasAsthma,
          hasDiabetes: form.hasDiabetes,
          hasSeizures: form.hasSeizures,
          takesMedsAtSchool: form.takesMedsAtSchool,
        },
      }).unwrap();
      router.push(`/children/${child.id}`);
    } catch {
      // error handled by mutation
    }
  };

  if (!branch) return <InlineLoading />;

  return (
    <div className="space-y-6">
      <PageBackLink href={`/branches/${branchId}`} />

      <PageHeader
        title={`Add child to ${branch.name}`}
        description="Creates a student login for this child. Guardian details are stored on the student record only (not a separate user)."
      />

      <FormShell>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="child-first">First name</FieldLabel>
            <Input
              id="child-first"
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="child-last">Last name</FieldLabel>
            <Input
              id="child-last"
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="student-email">Student login email</FieldLabel>
            <Input
              id="student-email"
              type="email"
              autoComplete="email"
              value={form.studentEmail}
              onChange={(e) => setForm((f) => ({ ...f, studentEmail: e.target.value }))}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="student-name">Display name (optional)</FieldLabel>
            <Input
              id="student-name"
              placeholder="Defaults to first + last name"
              value={form.studentName}
              onChange={(e) => setForm((f) => ({ ...f, studentName: e.target.value }))}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="guardian-name">Guardian name (optional)</FieldLabel>
            <Input
              id="guardian-name"
              value={form.guardianName}
              onChange={(e) => setForm((f) => ({ ...f, guardianName: e.target.value }))}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="guardian-email">Guardian email (optional)</FieldLabel>
            <Input
              id="guardian-email"
              type="email"
              value={form.guardianEmail}
              onChange={(e) => setForm((f) => ({ ...f, guardianEmail: e.target.value }))}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="guardian-phone">Guardian phone (optional)</FieldLabel>
            <Input
              id="guardian-phone"
              type="tel"
              value={form.guardianPhone}
              onChange={(e) => setForm((f) => ({ ...f, guardianPhone: e.target.value }))}
            />
          </Field>
          <FieldGroup data-slot="checkbox-group">
            <FieldLegend variant="label">Conditions</FieldLegend>
            {CONDITION_FIELDS.map(({ key, label }) => (
              <Field key={key} orientation="horizontal" className="items-center gap-3">
                <Checkbox
                  id={`child-cond-${key}`}
                  checked={form[key]}
                  onCheckedChange={(checked) =>
                    setForm((f) => ({ ...f, [key]: checked === true }))
                  }
                />
                <FieldLabel htmlFor={`child-cond-${key}`} className="font-normal">
                  {label}
                </FieldLabel>
              </Field>
            ))}
          </FieldGroup>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isLoading}>
              Create
            </Button>
            <Link href={`/branches/${branchId}`}>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </FormShell>
    </div>
  );
}
