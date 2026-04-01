-- Branch-scoped directors become teachers (branch leads use TEACHER + StaffProfile).
UPDATE "User"
SET role = 'TEACHER'
WHERE role = 'DIRECTOR' AND "branchId" IS NOT NULL;

-- School admins become school-scoped directors (single owner model).
UPDATE "User"
SET role = 'DIRECTOR', "branchId" = NULL
WHERE role = 'SCHOOL_ADMIN';

-- Directors must not have staff profiles.
DELETE FROM "StaffProfile" sp
USING "User" u
WHERE sp."userId" = u.id AND u.role = 'DIRECTOR';

-- At most one director user per school (PostgreSQL partial unique index).
CREATE UNIQUE INDEX "User_one_director_per_school_idx"
ON "User" ("schoolId")
WHERE role = 'DIRECTOR'::"UserRole" AND "schoolId" IS NOT NULL;
