'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useDataTableSelection } from './data-table';
import { Button } from '@/components/ui/button';
import { X, CheckCircle2, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BulkActionToolbarProps {
  onVerify?: (ids: string[]) => void;
  onDelete?: (ids: string[]) => void;
  label?: string;
}

export function BulkActionToolbar({ onVerify, onDelete, label = 'documents' }: BulkActionToolbarProps) {
  const selection = useDataTableSelection();
  
  if (!selection || selection.selectedIds.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, x: '-50%', opacity: 0 }}
        animate={{ y: 0, x: '-50%', opacity: 1 }}
        exit={{ y: 100, x: '-50%', opacity: 0 }}
        className="fixed bottom-8 left-1/2 z-50 flex items-center gap-4 rounded-2xl border border-white/20 bg-background/60 p-4 shadow-2xl backdrop-blur-xl min-w-[400px]"
      >
        <div className="flex items-center gap-3 border-r border-white/10 pr-4">
          <Button 
            variant="ghost" 
            size="icon-sm" 
            onClick={() => selection.toggleAll([])}
            className="h-8 w-8 hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Selected</span>
            <span className="text-sm font-semibold">
              {selection.selectedIds.length} {selection.selectedIds.length === 1 ? label.slice(0, -1) : label}
            </span>
          </div>
        </div>

        <div className="flex flex-1 items-center gap-2">
          {onVerify && (
            <Button 
              size="sm" 
              onClick={() => onVerify(selection.selectedIds)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2 h-9 px-4 rounded-xl shadow-lg shadow-emerald-500/20"
            >
              <CheckCircle2 className="h-4 w-4" />
              Verify All
            </Button>
          )}
          {onDelete && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onDelete(selection.selectedIds)}
              className="border-destructive/30 text-destructive hover:bg-destructive/10 gap-2 h-9 px-4 rounded-xl"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
