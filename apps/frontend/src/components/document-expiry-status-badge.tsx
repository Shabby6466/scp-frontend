'use client';

import { Badge } from '@/components/ui/badge';
import {
  type DocumentExpiryStatus,
  expiryStatusLabel,
} from '@/lib/document-expiry-status';

export function DocumentExpiryStatusBadge({ status }: { status: DocumentExpiryStatus }) {
  const label = expiryStatusLabel(status);
  if (status === 'expired') {
    return <Badge variant="destructive">{label}</Badge>;
  }
  if (status === 'near_expiry') {
    return <Badge variant="warning">{label}</Badge>;
  }
  if (status === 'active') {
    return <Badge variant="secondary">{label}</Badge>;
  }
  return <Badge variant="outline">{label}</Badge>;
}
