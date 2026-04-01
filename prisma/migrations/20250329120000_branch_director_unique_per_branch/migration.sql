-- At most one BRANCH_DIRECTOR user per branch (PostgreSQL partial unique index).
CREATE UNIQUE INDEX "User_branch_director_branch_unique"
ON "User" ("branchId")
WHERE role = 'BRANCH_DIRECTOR' AND "branchId" IS NOT NULL;
