'use client';

import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FileUploadControlProps {
  accept?: string;
  disabled?: boolean;
  busy?: boolean;
  onFile: (file: File) => void;
  /** Replaces the default Upload label (still shown inside the trigger unless you omit it). */
  children?: React.ReactNode;
  className?: string;
}

export function FileUploadControl({
  accept,
  disabled,
  busy,
  onFile,
  children,
  className,
}: FileUploadControlProps) {
  const inactive = disabled || busy;

  return (
    <label
      className={cn(
        'inline-flex cursor-pointer',
        inactive && 'pointer-events-none opacity-50',
        className,
      )}
    >
      <input
        type="file"
        className="sr-only"
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = '';
        }}
        disabled={inactive}
      />
      <span className="inline-flex items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background hover:bg-accent hover:text-accent-foreground">
        {children ?? (
          <>
            <Upload className="mr-1 h-4 w-4" />
            {busy ? 'Uploading...' : 'Upload'}
          </>
        )}
      </span>
    </label>
  );
}
