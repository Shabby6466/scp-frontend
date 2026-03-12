'use client';

import { useState } from 'react';
import {
  useGetDocumentTypesQuery,
  useCreateDocumentTypeMutation,
  useDeleteDocumentTypeMutation,
} from '@/store/features/documentTypeApi';
import type { SchemaField } from '@/store/features/documentTypeApi';
import { useAppSelector } from '@/store/hooks';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, FileText, ChevronDown, ChevronUp } from 'lucide-react';

const FIELD_TYPES = ['text', 'date', 'number', 'select', 'file', 'textarea'] as const;

export default function DocumentTypesPage() {
  const user = useAppSelector((s) => s.auth.user);
  const isSuperAdmin = user?.role === 'SUPERADMIN';
  const { data: docTypes, isLoading } = useGetDocumentTypesQuery();
  const [createDocType, { isLoading: creating }] = useCreateDocumentTypeMutation();
  const [deleteDocType] = useDeleteDocumentTypeMutation();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [isMandatory, setIsMandatory] = useState(false);
  const [fields, setFields] = useState<SchemaField[]>([
    { name: '', type: 'text', label: '', required: false },
  ]);
  const [expanded, setExpanded] = useState<string | null>(null);

  const addField = () =>
    setFields([...fields, { name: '', type: 'text', label: '', required: false }]);

  const removeField = (idx: number) =>
    setFields(fields.filter((_, i) => i !== idx));

  const updateField = (idx: number, patch: Partial<SchemaField>) =>
    setFields(fields.map((f, i) => (i === idx ? { ...f, ...patch } : f)));

  const handleCreate = async () => {
    if (!name.trim() || fields.some((f) => !f.name.trim() || !f.label.trim())) return;
    await createDocType({ name, schema: { fields }, isMandatory });
    setName('');
    setFields([{ name: '', type: 'text', label: '', required: false }]);
    setIsMandatory(false);
    setShowForm(false);
  };

  if (isLoading) {
    return <div className="p-6 text-sm text-gray-500">Loading document types...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Document Types
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Define compliance document schemas
          </p>
        </div>
        {isSuperAdmin && (
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-1 h-4 w-4" />
            New Type
          </Button>
        )}
      </div>

      {showForm && isSuperAdmin && (
        <div className="space-y-4 rounded-lg border bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Create Document Type
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Vehicle Fitness Certificate"
                className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={isMandatory}
                  onChange={(e) => setIsMandatory(e.target.checked)}
                  className="rounded"
                />
                Mandatory for compliance
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Schema Fields</span>
              <Button variant="outline" size="sm" onClick={addField}>
                <Plus className="mr-1 h-3 w-3" /> Add Field
              </Button>
            </div>
            {fields.map((field, idx) => (
              <div key={idx} className="flex gap-2 items-end">
                <div className="flex-1">
                  <input
                    value={field.name}
                    onChange={(e) => updateField(idx, { name: e.target.value })}
                    placeholder="fieldName"
                    className="block w-full rounded-md border px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="flex-1">
                  <input
                    value={field.label}
                    onChange={(e) => updateField(idx, { label: e.target.value })}
                    placeholder="Display Label"
                    className="block w-full rounded-md border px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <select
                  value={field.type}
                  onChange={(e) => updateField(idx, { type: e.target.value as SchemaField['type'] })}
                  className="rounded-md border px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  {FIELD_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <label className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(idx, { required: e.target.checked })}
                  />
                  Req
                </label>
                {fields.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => removeField(idx)}>
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? 'Creating...' : 'Create'}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {docTypes?.map((dt) => (
          <div
            key={dt.id}
            className="rounded-lg border bg-white dark:border-gray-800 dark:bg-gray-900"
          >
            <div
              className="flex cursor-pointer items-center justify-between p-4"
              onClick={() => setExpanded(expanded === dt.id ? null : dt.id)}
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">{dt.name}</span>
                  {dt.isMandatory && (
                    <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      Mandatory
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">{dt._count?.documents ?? 0} docs</span>
                {expanded === dt.id ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>
            {expanded === dt.id && (
              <div className="border-t px-4 pb-4 pt-3 dark:border-gray-800">
                <p className="mb-2 text-xs font-medium text-gray-500">Schema Fields:</p>
                <div className="space-y-1">
                  {(dt.schema as { fields: SchemaField[] }).fields.map((f) => (
                    <div key={f.name} className="flex gap-4 text-sm text-gray-700 dark:text-gray-300">
                      <span className="w-32 font-mono text-xs">{f.name}</span>
                      <span className="w-20 text-xs text-gray-500">{f.type}</span>
                      <span>{f.label}</span>
                      {f.required && <span className="text-xs text-red-500">required</span>}
                    </div>
                  ))}
                </div>
                {isSuperAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 text-red-600"
                    onClick={() => deleteDocType(dt.id)}
                  >
                    <Trash2 className="mr-1 h-3 w-3" /> Delete
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
        {docTypes?.length === 0 && (
          <p className="text-sm text-gray-500">No document types defined yet.</p>
        )}
      </div>
    </div>
  );
}
