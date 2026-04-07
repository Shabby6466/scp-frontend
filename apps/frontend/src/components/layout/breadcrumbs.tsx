'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  /** If not provided, will try to derive from pathname */
  customItems?: BreadcrumbItem[];
}

const pathLabels: Record<string, string> = {
  school: 'School',
  schools: 'Schools',
  branches: 'Branches',
  users: 'Users',
  children: 'Children',
  staff: 'Teacher Documents',
  classes: 'Classes',
  facility: 'Facility',
  new: 'Add new',
  teachers: 'Teachers',
  students: 'Students',
  directors: 'Directors',
  'branch-directors': 'Branch directors',
  dashboard: 'Dashboard',
  'my-branch': 'My Branch',
  'my-children': 'My student',
  'my-staff-file': 'My Documents',
  'my-documents': 'My Documents',
  compliance: 'Compliance',
  settings: 'Settings',
  profile: 'My profile',
  'document-uploading': 'My Documents',
  'document-requirements': 'Document Requirements',
  'document-types': 'Document Types',
};

export function Breadcrumbs({ items: customItems }: BreadcrumbsProps) {
  const pathname = usePathname();

  if (customItems && customItems.length > 0) {
    return (
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground">
        {customItems.map((item, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-4 w-4" />}
            {item.href ? (
              <Link href={item.href} className="hover:text-foreground transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground font-medium">{item.label}</span>
            )}
          </span>
        ))}
      </nav>
    );
  }

  const segments = pathname.split('/').filter(Boolean);
  if (segments.length <= 1) return null;

  const isLikelyId = (s: string) => /^[a-z0-9_-]{20,}$/i.test(s) || /^c[a-z0-9]{24}$/i.test(s);

  const items: BreadcrumbItem[] = [];
  let href = '';
  for (let i = 0; i < segments.length; i++) {
    href += `/${segments[i]}`;
    const segment = segments[i];
    const knownLabel = pathLabels[segment];
    const isBranchTeachers =
      segment === 'staff' &&
      i >= 2 &&
      segments[i - 2] === 'branches' &&
      isLikelyId(segments[i - 1] ?? '');
    const label =
      (isBranchTeachers ? 'Teachers' : knownLabel) ?? (isLikelyId(segment) ? '…' : segment);
    const isLast = i === segments.length - 1;
    items.push({
      label,
      href: isLast ? undefined : href,
    });
  }

  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 overflow-x-auto py-1 text-sm text-muted-foreground">
      <Link href="/dashboard" className="shrink-0 hover:text-foreground transition-colors">
        Home
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex shrink-0 items-center gap-1">
          <ChevronRight className="h-4 w-4 shrink-0" />
          {item.href ? (
            <Link href={item.href} className="hover:text-foreground transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
