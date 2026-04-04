'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileUploadControl } from '@/components/documents/file-upload-control';
import type { Document } from '@/store/features/documentApi';
import { DocumentExpiryStatusBadge } from '@/components/documents/document-expiry-status-badge';
import { formatDocumentDate, getDocumentExpiryStatus } from '@/lib/document-expiry-status';
import { cn } from '@/lib/utils';
import { Check, Download } from 'lucide-react';

export interface DocumentChecklistRowProps {
  documentTypeName: string;
  mandatory?: boolean;
  doc?: Document | null;
  /** True while this row's upload is in progress */
  uploading?: boolean;
  canVerify?: boolean;
  onUpload: (file: File) => void;
  onDownload: () => void;
  onVerify: () => void;
}

export function DocumentChecklistRow({
  documentTypeName,
  mandatory,
  doc,
  uploading,
  canVerify,
  onUpload,
  onDownload,
  onVerify,
}: DocumentChecklistRowProps) {
  const isMandatory = mandatory === true;
  const expiryStatus = doc ? getDocumentExpiryStatus(doc.expiresAt) : null;

  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-l-4 py-3 pr-4 sm:flex-row sm:items-start sm:justify-between',
        isMandatory
          ? 'border-l-primary bg-primary/[0.07] pl-4 dark:bg-primary/10'
          : 'border-l-muted-foreground/25 bg-muted/40 pl-4 dark:bg-muted/50',
      )}
    >
      <div className="min-w-0 flex-1 space-y-2">
        <div>
          <span
            className={cn(
              'font-medium',
              isMandatory ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            {documentTypeName}
          </span>
          <Badge
            variant={isMandatory ? 'default' : 'outline'}
            className="ml-2 align-middle"
          >
            {isMandatory ? 'Mandatory' : 'Optional'}
          </Badge>
        </div>
        {doc ? (
          <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-1">
            <span>Issuance: {formatDocumentDate(doc.issuedAt)}</span>
            <span>Expiry: {formatDocumentDate(doc.expiresAt)}</span>
            {expiryStatus ? <DocumentExpiryStatusBadge status={expiryStatus} /> : null}
            {doc.verifiedAt ? (
              <Badge variant="secondary" className="w-fit">
                Verified
              </Badge>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
        {doc ? (
          <>
            <Button variant="ghost" size="sm" onClick={onDownload} title="Open document">
              <Download className="h-4 w-4" />
            </Button>
            {canVerify && !doc.verifiedAt && (
              <Button variant="ghost" size="sm" onClick={onVerify} title="Mark verified">
                <Check className="h-4 w-4" />
              </Button>
            )}
          </>
        ) : (
          <FileUploadControl busy={uploading} onFile={onUpload} />
        )}
      </div>
    </div>
  );
}
