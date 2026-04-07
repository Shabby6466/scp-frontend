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
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

function todayDateInputValue(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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

  // Controlled `open` from parent does not always invoke `onOpenChange(true)`; reset when dialog opens.
  useEffect(() => {
    if (open) {
      /* eslint-disable react-hooks/set-state-in-effect -- sync fields when opening with a new file (parent-driven open) */
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
      <DialogContent className="sm:max-w-md border-primary/20 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 shadow-2xl overflow-hidden">
        {/* Top Accent Gradient */}
        <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-primary/40 via-primary to-primary/40" />

        <form onSubmit={handleSubmit} className="relative">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-bold tracking-tight">Final Details</DialogTitle>
            <DialogDescription className="text-muted-foreground/80">
              Provide issuance and expiry dates to finalize your compliance document.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* File Info Section */}
            <div className="rounded-xl border border-border/50 bg-muted/30 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background border shadow-sm">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold truncate text-foreground">{documentTypeLabel}</p>
                  <p className="text-xs text-muted-foreground truncate">{file?.name ?? 'No file selected'}</p>
                </div>
              </div>
              {file && (
                <div className="flex gap-2">
                  <Badge variant="secondary" className="bg-background/80 text-[10px]">
                    {file.name.split('.').pop()?.toUpperCase()}
                  </Badge>
                  <Badge variant="secondary" className="bg-background/80 text-[10px]">
                    {formatBytes(file.size)}
                  </Badge>
                </div>
              )}
            </div>

            <div className="grid gap-5">
              <div className="space-y-2.5">
                <Label htmlFor="doc-issued" className="flex items-center gap-2 text-sm font-semibold">
                  <Calendar className="h-4 w-4 text-primary" />
                  Issuance Date
                </Label>
                <div className="relative group">
                  <Input
                    id="doc-issued"
                    type="date"
                    required
                    value={issuedAt}
                    onChange={(e) => setIssuedAt(e.target.value)}
                    className="pl-3 h-11 border-border/50 focus:border-primary transition-all bg-white/50 dark:bg-black/20"
                  />
                  <div className="absolute inset-0 rounded-md pointer-events-none border border-transparent group-focus-within:border-primary/20 group-hover:border-border transition-colors" />
                </div>
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="doc-expires" className="flex items-center gap-2 text-sm font-semibold">
                  <Clock className="h-4 w-4 text-primary" />
                  Expiry Date
                </Label>
                <div className="relative group">
                  <Input
                    id="doc-expires"
                    type="date"
                    placeholder="Optional"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="pl-3 h-11 border-border/50 focus:border-primary transition-all bg-white/50 dark:bg-black/20"
                  />
                  <div className="absolute inset-0 rounded-md pointer-events-none border border-transparent group-focus-within:border-primary/20 group-hover:border-border transition-colors" />
                </div>
                <p className="text-[10px] text-muted-foreground/60 px-1 italic">
                  Leave empty to use automatic renewal rules.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-8 gap-2 sm:gap-0">
            <Button 
               type="button" 
               variant="ghost" 
               onClick={() => onOpenChange(false)}
               className="h-11 rounded-xl text-muted-foreground hover:text-foreground"
            >
              Back
            </Button>
            <Button 
               type="submit" 
               disabled={isSubmitting || !issuedAt}
               className="h-11 rounded-xl px-8 font-bold shadow-lg shadow-primary/20 relative group overflow-hidden"
            >
               <motion.span
                 initial={false}
                 animate={{ y: isSubmitting ? -20 : 0 }}
                 className="flex items-center gap-2"
               >
                 {isSubmitting ? 'Uploading...' : 'Confirm Upload'}
               </motion.span>
               {isSubmitting && (
                 <motion.div
                   initial={{ y: 20 }}
                   animate={{ y: 0 }}
                   className="absolute inset-0 flex items-center justify-center bg-primary"
                 >
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                 </motion.div>
               )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
