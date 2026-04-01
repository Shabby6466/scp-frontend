'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'destructive',
  onConfirm,
  isLoading: externalLoading = false,
}: ConfirmDialogProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const isLoading = externalLoading || internalLoading;

  const handleConfirm = async () => {
    setInternalLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{cancelLabel}</AlertDialogCancel>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            variant={variant === 'destructive' ? 'destructive' : 'default'}
          >
            {isLoading ? 'Please wait...' : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
