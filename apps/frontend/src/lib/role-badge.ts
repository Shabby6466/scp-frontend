import type { VariantProps } from 'class-variance-authority';

import { badgeVariants } from '@/components/ui/badge';

export type RoleBadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  SCHOOL_ADMIN: 'School Admin',
  DIRECTOR: 'School director',
  BRANCH_DIRECTOR: 'Branch director',
  TEACHER: 'Teacher',
  STUDENT: 'Student',
};

export function formatRoleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role.replace(/_/g, ' ');
}

export function getRoleBadgeVariant(role: string): RoleBadgeVariant {
  switch (role) {
    case 'ADMIN':
      return 'default';
    case 'SCHOOL_ADMIN':
      return 'secondary';
    case 'DIRECTOR':
      return 'outline';
    case 'BRANCH_DIRECTOR':
      return 'outline';
    case 'TEACHER':
      return 'outline';
    case 'STUDENT':
      return 'secondary';
    default:
      return 'outline';
  }
}
