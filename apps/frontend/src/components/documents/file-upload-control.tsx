'use client';

import { useState, useRef } from 'react';
import { Upload, CloudUpload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export interface FileUploadControlProps {
  accept?: string;
  disabled?: boolean;
  busy?: boolean;
  onFile: (file: File) => void;
  /** Replaces the default Upload label */
  children?: React.ReactNode;
  className?: string;
  /** If true, shows a larger dropzone style instead of a button */
  variant?: 'button' | 'dropzone';
}

export function FileUploadControl({
  accept,
  disabled,
  busy,
  onFile,
  children,
  className,
  variant = 'button',
}: FileUploadControlProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inactive = disabled || busy;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (inactive) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (inactive) return;
    
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    e.target.value = '';
  };

  if (variant === 'dropzone') {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200',
          isDragging 
            ? 'border-primary bg-primary/5 scale-[1.02]' 
            : 'border-muted-foreground/25 bg-muted/20 hover:border-primary/50',
          inactive && 'pointer-events-none opacity-50',
          className
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="absolute inset-0 cursor-pointer opacity-0"
          accept={accept}
          onChange={handleChange}
          disabled={inactive}
        />
        <div className="flex flex-col items-center gap-2 p-6 text-center">
          <motion.div
            animate={{ y: isDragging ? -5 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            {isDragging ? (
              <CloudUpload className="h-10 w-10 text-primary" />
            ) : (
              <Upload className="h-10 w-10 text-muted-foreground" />
            )}
          </motion.div>
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {busy ? 'Processing...' : isDragging ? 'Drop it here!' : 'Click or drag to upload'}
            </p>
            <p className="text-xs text-muted-foreground">PDF, PNG, JPG (max 10MB)</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <label
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'relative inline-flex cursor-pointer transition-transform active:scale-95',
        inactive && 'pointer-events-none opacity-50',
        isDragging && 'scale-105',
        className,
      )}
    >
      <input
        type="file"
        className="sr-only"
        accept={accept}
        onChange={handleChange}
        disabled={inactive}
      />
      <motion.span 
        animate={isDragging ? { 
          backgroundColor: 'var(--primary-foreground)', 
          borderColor: 'var(--primary)',
          boxShadow: '0 0 15px rgba(var(--primary), 0.2)' 
        } : {}}
        className={cn(
          'inline-flex items-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-all hover:bg-accent hover:text-accent-foreground shadow-sm',
          isDragging && 'border-primary ring-2 ring-primary/20'
        )}
      >
        <AnimatePresence mode="wait">
          {busy ? (
            <motion.div
              key="busy"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center"
            >
               <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
               Uploading...
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center"
            >
              {isDragging ? (
                <CloudUpload className="mr-2 h-4 w-4 text-primary animate-bounce" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {children ?? (isDragging ? 'Drop now' : 'Upload')}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.span>
    </label>
  );
}
