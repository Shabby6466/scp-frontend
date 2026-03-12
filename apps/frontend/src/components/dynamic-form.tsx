'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMemo, useRef } from 'react';
import type { SchemaField } from '@/store/features/documentTypeApi';
import { Button } from '@/components/ui/button';

interface DynamicFormProps {
  fields: SchemaField[];
  onSubmit: (data: Record<string, unknown>, files: Record<string, File>) => void;
  isLoading?: boolean;
  submitLabel?: string;
}

function buildZodSchema(fields: SchemaField[]) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    if (field.type === 'file') {
      // File fields handled separately
      continue;
    }

    let schema: z.ZodTypeAny;
    switch (field.type) {
      case 'number':
        schema = z.coerce.number();
        break;
      case 'date':
        schema = z.string().min(1, `${field.label} is required`);
        break;
      default:
        schema = z.string();
    }

    shape[field.name] = field.required
      ? field.type === 'number'
        ? schema
        : (schema as z.ZodString).min(1, `${field.label} is required`)
      : schema.optional().or(z.literal(''));
  }

  return z.object(shape);
}

export function DynamicForm({ fields, onSubmit, isLoading, submitLabel = 'Submit' }: DynamicFormProps) {
  const zodSchema = useMemo(() => buildZodSchema(fields), [fields]);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(zodSchema),
  });

  const handleFormSubmit = (data: Record<string, unknown>) => {
    const files: Record<string, File> = {};
    for (const field of fields) {
      if (field.type === 'file') {
        const input = fileRefs.current[field.name];
        const file = input?.files?.[0];
        if (file) files[field.name] = file;
        else if (field.required) return;
      }
    }
    onSubmit(data, files);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {fields.map((field) => (
        <div key={field.name}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {field.label}
            {field.required && <span className="ml-1 text-red-500">*</span>}
          </label>

          {field.type === 'textarea' ? (
            <textarea
              {...register(field.name)}
              rows={3}
              className="mt-1 block w-full rounded-md border px-3 py-2 text-sm
                         dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          ) : field.type === 'select' ? (
            <select
              {...register(field.name)}
              className="mt-1 block w-full rounded-md border px-3 py-2 text-sm
                         dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Select...</option>
              {field.options?.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : field.type === 'file' ? (
            <input
              type="file"
              ref={(el) => { fileRefs.current[field.name] = el; }}
              className="mt-1 block w-full text-sm"
            />
          ) : (
            <input
              type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
              {...register(field.name)}
              className="mt-1 block w-full rounded-md border px-3 py-2 text-sm
                         dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          )}

          {errors[field.name] && (
            <p className="mt-1 text-xs text-red-600">
              {errors[field.name]?.message as string}
            </p>
          )}
        </div>
      ))}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Submitting...' : submitLabel}
      </Button>
    </form>
  );
}
