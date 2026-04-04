import { Badge } from '@/components/ui/badge';
import { formatRoleLabel, getRoleBadgeVariant } from '@/lib/role-badge';

export function RoleBadge({ role, className }: { role: string; className?: string }) {
  return (
    <Badge variant={getRoleBadgeVariant(role)} className={className}>
      {formatRoleLabel(role)}
    </Badge>
  );
}
