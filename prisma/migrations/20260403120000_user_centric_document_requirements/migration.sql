-- User authority and assignment chain
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "authorities" "UserRole"[] DEFAULT ARRAY[]::"UserRole"[],
  ADD COLUMN IF NOT EXISTS "assignedById" TEXT;

CREATE INDEX IF NOT EXISTS "User_assignedById_idx" ON "User"("assignedById");

ALTER TABLE "User"
  ADD CONSTRAINT "User_assignedById_fkey"
  FOREIGN KEY ("assignedById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Document type owner/target role metadata
ALTER TABLE "DocumentType"
  ADD COLUMN IF NOT EXISTS "targetRole" "UserRole",
  ADD COLUMN IF NOT EXISTS "createdById" TEXT;

CREATE INDEX IF NOT EXISTS "DocumentType_targetRole_idx" ON "DocumentType"("targetRole");
CREATE INDEX IF NOT EXISTS "DocumentType_createdById_idx" ON "DocumentType"("createdById");

ALTER TABLE "DocumentType"
  ADD CONSTRAINT "DocumentType_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- User-centric document ownership
ALTER TABLE "Document"
  ADD COLUMN IF NOT EXISTS "ownerUserId" TEXT;

CREATE INDEX IF NOT EXISTS "Document_ownerUserId_idx" ON "Document"("ownerUserId");

ALTER TABLE "Document"
  ADD CONSTRAINT "Document_ownerUserId_fkey"
  FOREIGN KEY ("ownerUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Implicit m:n bridge for User.requiredDocTypes <-> DocumentType.requiredUsers
CREATE TABLE IF NOT EXISTS "_UserRequiredDocTypes" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "_UserRequiredDocTypes_AB_unique"
  ON "_UserRequiredDocTypes"("A", "B");
CREATE INDEX IF NOT EXISTS "_UserRequiredDocTypes_B_index"
  ON "_UserRequiredDocTypes"("B");

ALTER TABLE "_UserRequiredDocTypes"
  ADD CONSTRAINT "_UserRequiredDocTypes_A_fkey"
  FOREIGN KEY ("A") REFERENCES "DocumentType"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_UserRequiredDocTypes"
  ADD CONSTRAINT "_UserRequiredDocTypes_B_fkey"
  FOREIGN KEY ("B") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Role-specific profile tables
CREATE TABLE IF NOT EXISTS "DirectorProfile" (
  "userId" TEXT NOT NULL,
  "officePhone" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DirectorProfile_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE IF NOT EXISTS "BranchDirectorProfile" (
  "userId" TEXT NOT NULL,
  "branchStartDate" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BranchDirectorProfile_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE IF NOT EXISTS "TeacherProfile" (
  "userId" TEXT NOT NULL,
  "subjectArea" TEXT,
  "employeeCode" TEXT,
  "joiningDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TeacherProfile_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE IF NOT EXISTS "StudentProfile" (
  "userId" TEXT NOT NULL,
  "rollNumber" TEXT,
  "guardianName" TEXT,
  "guardianPhone" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("userId")
);

ALTER TABLE "DirectorProfile"
  ADD CONSTRAINT "DirectorProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BranchDirectorProfile"
  ADD CONSTRAINT "BranchDirectorProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TeacherProfile"
  ADD CONSTRAINT "TeacherProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudentProfile"
  ADD CONSTRAINT "StudentProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
