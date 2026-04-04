'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Search, FilterX } from 'lucide-react';
import { Button } from './ui/button';
import { useGetBranchesQuery } from '@/store/features/branchApi';

export interface UserFilters {
  query: string;
  role: string;
  branchId: string;
  staffClearanceActive: boolean | undefined;
}

interface UserSearchFiltersProps {
  schoolId?: string;
  filters: UserFilters;
  onFiltersChange: (filters: UserFilters) => void;
}

export function UserSearchFilters({
  schoolId,
  filters,
  onFiltersChange,
}: UserSearchFiltersProps) {
  const { data: branches } = useGetBranchesQuery(schoolId ?? '', {
    skip: !schoolId,
  });

  const updateFilter = <K extends keyof UserFilters>(key: K, value: UserFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      query: '',
      role: 'ALL',
      branchId: 'ALL',
      staffClearanceActive: undefined,
    });
  };

  const hasActiveFilters = 
    filters.query || 
    filters.role !== 'ALL' || 
    filters.branchId !== 'ALL' || 
    filters.staffClearanceActive !== undefined;

  return (
    <div className="flex flex-col gap-4 p-4 bg-card border rounded-lg shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[240px] space-y-1.5">
          <Label htmlFor="search-users">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search-users"
              placeholder="Search by name or email..."
              className="pl-9"
              value={filters.query}
              onChange={(e) => updateFilter('query', e.target.value)}
            />
          </div>
        </div>

        <div className="w-[180px] space-y-1.5">
          <Label>Role</Label>
          <Select
            value={filters.role}
            onValueChange={(v) => updateFilter('role', v || 'ALL')}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="DIRECTOR">Director</SelectItem>
              <SelectItem value="BRANCH_DIRECTOR">Branch Director</SelectItem>
              <SelectItem value="TEACHER">Teacher</SelectItem>
              <SelectItem value="STUDENT">Student</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {schoolId && branches && branches.length > 0 && (
          <div className="w-[180px] space-y-1.5">
            <Label>Branch</Label>
            <Select
              value={filters.branchId}
              onValueChange={(v) => updateFilter('branchId', v || 'ALL')}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Branches</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center space-x-2 h-10 px-2 pb-1">
          <Checkbox
            id="clearance-toggle"
            checked={filters.staffClearanceActive === true}
            onCheckedChange={(checked) => 
              updateFilter('staffClearanceActive', checked === true ? true : undefined)
            }
          />
          <Label
            htmlFor="clearance-toggle"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Cleared Only
          </Label>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-10 text-muted-foreground hover:text-foreground"
          >
            <FilterX className="mr-2 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
