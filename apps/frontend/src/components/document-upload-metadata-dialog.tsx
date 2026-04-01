'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

function todayDateInputValue(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export interface DocumentUploadMetadataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentTypeLabel: string;
  file: File | null;
  onSubmit: (meta: { issuedAt: string; expiresAt: string | undefined }) => Promise<void>;
  isSubmitting: boolean;
}

export function DocumentUploadMetadataDialog({
  open,
  onOpenChange,
  documentTypeLabel,
  file,
  onSubmit,
  isSubmitting,
}: DocumentUploadMetadataDialogProps) {
  const [issuedAt, setIssuedAt] = useState(todayDateInputValue);
  const [expiresAt, setExpiresAt] = useState('');

  useEffect(() => {
    if (open) {
      setIssuedAt(todayDateInputValue());
      setExpiresAt('');
    }
  }, [open, file?.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issuedAt.trim()) return;
    await onSubmit({
      issuedAt: issuedAt.trim(),
      expiresAt: expiresAt.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Document details</DialogTitle>
            <DialogDescription>
              Add issuance and expiry before uploading. Leave expiry empty to use document-type renewal
              rules when available.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">{documentTypeLabel}</p>
              {file ? (
                <p className="truncate text-xs text-muted-foreground" title={file.name}>
                  {file.name}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-issued">Issuance date</Label>
              <Input
                id="doc-issued"
                type="date"
                required
                value={issuedAt}
                onChange={(e) => setIssuedAt(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-expires">Expiry date (optional)</Label>
              <Input
                id="doc-expires"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !issuedAt}>
              {isSubmitting ? 'Uploading…' : 'Upload'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
