'use client';

import { useState, useEffect } from 'react';
import { useLazySearchDocumentsQuery } from '@/store/features/searchApi';
import { Search, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';

const STATUS_ICON = {
  VALID: CheckCircle,
  EXPIRED: XCircle,
  PENDING: Clock,
  ARCHIVED: FileText,
} as const;

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [trigger, { data, isFetching }] = useLazySearchDocumentsQuery();

  useEffect(() => {
    if (query.trim().length < 2) return;
    const timer = setTimeout(() => {
      trigger({ q: query, limit: 8 });
      setIsOpen(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, trigger]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
        <Search className="h-4 w-4 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder="Search documents..."
          className="w-64 bg-transparent text-sm text-gray-900 outline-none dark:text-white"
        />
        {isFetching && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
        )}
      </div>

      {isOpen && data && data.items.length > 0 && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
          {data.items.map((doc) => {
            const Icon = STATUS_ICON[doc.status] ?? FileText;
            return (
              <div
                key={doc.id}
                className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
              >
                <Icon className="h-4 w-4 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm text-gray-900 dark:text-white">
                    {doc.documentType.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    v{doc.version} · {doc.status}
                    {doc.expiresAt && ` · Expires ${new Date(doc.expiresAt).toLocaleDateString()}`}
                  </p>
                </div>
              </div>
            );
          })}
          {data.total > 8 && (
            <div className="border-t px-3 py-2 text-xs text-gray-500 dark:border-gray-700">
              {data.total - 8} more results...
            </div>
          )}
        </div>
      )}

      {isOpen && data && data.items.length === 0 && query.length >= 2 && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-500">No documents found.</p>
        </div>
      )}
    </div>
  );
}
