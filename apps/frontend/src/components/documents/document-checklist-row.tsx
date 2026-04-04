'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileUploadControl } from '@/components/documents/file-upload-control';
import type { Document } from '@/store/features/documentApi';
import { DocumentExpiryStatusBadge } from '@/components/documents/document-expiry-status-badge';
import { formatDocumentDate, getDocumentExpiryStatus } from '@/lib/document-expiry-status';
import { cn } from '@/lib/utils';
import { Check, Download, FileText, AlertCircle, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const isVerified = doc?.verifiedAt != null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={cn(
        'group relative overflow-hidden rounded-xl border p-4 transition-all duration-300',
        'backdrop-blur-md bg-white/40 dark:bg-slate-900/40',
        isMandatory && !doc 
          ? 'border-primary/20 shadow-[0_0_15px_-5px_rgba(var(--primary),0.1)] ring-1 ring-primary/5' 
          : 'border-border/50 shadow-sm',
        isVerified && 'bg-emerald-500/[0.03] border-emerald-500/20',
        doc && !isVerified && 'bg-blue-500/[0.03] border-blue-500/20'
      )}
    >
      {/* Status Glow */}
      <div className={cn(
        "absolute left-0 top-0 h-full w-1 transition-all duration-500",
        isMandatory && !doc ? "bg-primary animate-pulse" : "bg-transparent",
        isVerified ? "bg-emerald-500" : "",
        doc && !isVerified ? "bg-blue-500" : ""
      )} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-start gap-3">
          <div className={cn(
            "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors",
            isVerified ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600" : 
            doc ? "border-blue-500/20 bg-blue-500/10 text-blue-600" :
            isMandatory ? "border-primary/20 bg-primary/10 text-primary" : "border-border bg-muted/50 text-muted-foreground"
          )}>
            <AnimatePresence mode="wait">
              {isVerified ? (
                 <motion.div key="verified" initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                   <ShieldCheck className="h-5 w-5" />
                 </motion.div>
              ) : doc ? (
                <motion.div key="file" initial={{ scale: 0.5 }} animate={{ scale: 1 }}>
                  <FileText className="h-5 w-5" />
                </motion.div>
              ) : isMandatory ? (
                <motion.div key="alert" initial={{ scale: 0.5 }} animate={{ scale: 1 }}>
                  <AlertCircle className="h-5 w-5" />
                </motion.div>
              ) : (
                <FileText className="h-5 w-5" />
              )}
            </AnimatePresence>
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn(
                'text-base font-semibold tracking-tight',
                isVerified ? 'text-emerald-900 dark:text-emerald-100' : 'text-foreground'
              )}>
                {documentTypeName}
              </span>
              <Badge
                variant={isMandatory ? 'default' : 'outline'}
                className={cn(
                  "text-[10px] uppercase tracking-wider",
                  isMandatory ? "bg-primary/90" : "text-muted-foreground"
                )}
              >
                {isMandatory ? 'Required' : 'Optional'}
              </Badge>
              {expiryStatus === 'expired' && (
                <Badge variant="destructive" className="h-5 text-[10px] animate-pulse">
                  Expired
                </Badge>
              )}
            </div>

            {doc?.fileName && (
              <p className="text-[11px] text-muted-foreground/70 truncate max-w-[200px] font-mono">
                {doc.fileName}
              </p>
            )}

            <AnimatePresence mode="wait">
              {doc ? (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex flex-col gap-2 text-xs font-medium text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-1"
                >
                  <div className="flex items-center gap-1.5 backdrop-blur-sm bg-white/20 dark:bg-black/20 px-2 py-0.5 rounded-full border border-border/50">
                    <span className="opacity-70">Issued</span>
                    <span className="text-foreground">{formatDocumentDate(doc.issuedAt)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 backdrop-blur-sm bg-white/20 dark:bg-black/20 px-2 py-0.5 rounded-full border border-border/50">
                    <span className="opacity-70">Expires</span>
                    <span className={cn(
                      "text-foreground",
                      expiryStatus === 'expired' && "text-destructive font-bold"
                    )}>
                      {formatDocumentDate(doc.expiresAt)}
                    </span>
                  </div>
                  {expiryStatus && (
                    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
                       <DocumentExpiryStatusBadge status={expiryStatus} />
                    </motion.div>
                  )}
                  {doc.verifiedAt && (
                    <div className="flex items-center gap-1 text-emerald-600 font-bold uppercase tracking-tighter text-[10px]">
                      <Check className="h-3 w-3" />
                      Verified System
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-muted-foreground/80 italic"
                >
                  {isMandatory ? 'This document is critical for compliance.' : 'Supporting document for your profile.'}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 pt-2 sm:pt-0">
          <AnimatePresence mode="wait">
            {doc ? (
              <motion.div 
                key="actions" 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2"
              >
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onDownload} 
                  className="h-9 w-9 rounded-full border-border/50 bg-white/50 p-0 hover:bg-primary hover:text-primary-foreground dark:bg-slate-800/50"
                  title="View"
                >
                  <Download className="h-4 w-4" />
                </Button>
                {canVerify && !doc.verifiedAt && (
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={onVerify}
                    className="h-9 px-4 rounded-full font-bold shadow-sm ring-1 ring-emerald-500/20 hover:bg-emerald-500 hover:text-white"
                  >
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                    Verify
                  </Button>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="upload" 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full sm:w-auto"
              >
                <FileUploadControl 
                  busy={uploading} 
                  onFile={onUpload}
                  className="w-full sm:w-auto"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
