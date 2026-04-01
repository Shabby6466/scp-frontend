-- Ensure BRANCH_DIRECTOR exists on UserRole (fixes DBs that never applied 20250328120000 or drifted).
DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    INNER JOIN pg_type t ON e.enumtypid = t.oid
    INNER JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.typname = 'UserRole'
      AND e.enumlabel = 'BRANCH_DIRECTOR'
  ) THEN
    ALTER TYPE "UserRole" ADD VALUE 'BRANCH_DIRECTOR';
  END IF;
END
$migration$;
