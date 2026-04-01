-- Add STUDENT to UserRole (keep PARENT until we remap / delete)
ALTER TYPE "UserRole" ADD VALUE 'STUDENT';

-- Teacher compliance fields on User (replaces StaffProfile)
ALTER TABLE "User" ADD COLUMN "staffPosition" "StaffPosition",
ADD COLUMN "staffClearanceActive" BOOLEAN NOT NULL DEFAULT false;

UPDATE "User" u
SET
  "staffPosition" = sp.position,
  "staffClearanceActive" = sp."isActive"
FROM "StaffProfile" sp
WHERE sp."userId" = u.id;

DROP TABLE "StaffProfile";

-- Child: guardian + student login
ALTER TABLE "Child" ADD COLUMN "studentUserId" TEXT,
ADD COLUMN "guardianName" TEXT,
ADD COLUMN "guardianEmail" TEXT,
ADD COLUMN "guardianPhone" TEXT;

UPDATE "Child" c
SET
  "guardianName" = p.name,
  "guardianEmail" = p.email
FROM "User" p
WHERE c."parentId" = p.id;

INSERT INTO "User" (id, email, password, name, role, "schoolId", "branchId", "staffPosition", "staffClearanceActive", "emailVerifiedAt", "createdAt", "updatedAt")
SELECT
  'st_' || c.id,
  'student+' || c.id || '@migrated.local',
  NULL,
  trim(c."firstName" || ' ' || c."lastName"),
  'STUDENT'::"UserRole",
  NULL,
  c."branchId",
  NULL,
  false,
  NULL,
  NOW(),
  NOW()
FROM "Child" c;

UPDATE "Child" c SET "studentUserId" = 'st_' || c.id;

ALTER TABLE "Child" ALTER COLUMN "studentUserId" SET NOT NULL;

ALTER TABLE "Child" DROP CONSTRAINT "Child_parentId_fkey";
DROP INDEX IF EXISTS "Child_parentId_idx";
ALTER TABLE "Child" DROP COLUMN "parentId";

CREATE UNIQUE INDEX "Child_studentUserId_key" ON "Child"("studentUserId");
ALTER TABLE "Child" ADD CONSTRAINT "Child_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DELETE FROM "User" WHERE role = 'PARENT'::"UserRole";

-- Rebuild UserRole without PARENT
CREATE TYPE "UserRole_new" AS ENUM ('ADMIN', 'SCHOOL_ADMIN', 'DIRECTOR', 'TEACHER', 'STUDENT');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
