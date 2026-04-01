# School System — UX flow

This document describes the end-to-end user experience in the web app: where users land, how they authenticate, how the shell works, and how each role moves through schools, branches, people, and documents.

---

## 1. High-level journey

```mermaid
flowchart LR
  subgraph public [Public]
    LP[Landing /]
    Login[/login]
    Register[/register]
    Verify[/verify]
  end
  subgraph app [Authenticated app]
    Dash[/dashboard]
    RoleRoutes[Role-specific pages]
  end
  LP --> Login
  LP --> Register
  Register --> Verify
  Login --> Home[Role_home]
  Verify --> Home
  Home --> Dash[Dashboard_or_Schools]
  Dash --> RoleRoutes
```

- **Unauthenticated** users see the marketing landing page (`/`) or auth screens (`/login`, `/register`, `/verify`).
- **After login or successful email verification**, the app sends the user to a **role-based home**: **`/schools`** for **ADMIN** and **SCHOOL_ADMIN**; **`/dashboard`** for **DIRECTOR**, **TEACHER**, and **PARENT** (see [`getPostLoginPath`](apps/frontend/src/lib/post-login-path.ts)).
- **Protected routes** live under the dashboard route group; an auth guard redirects to `/login` if there is no session in the client store.

---

## 2. Marketing landing (`/`)

- **Header**: brand, anchor links to Features and Pricing, **theme toggle** (light/dark), **Sign in** → `/login`.
- **Hero**: primary CTA **Get started** → `/login`; secondary **Learn more** → `#features`.
- **Features** (`#features`): grid of product capabilities (compliance, roles, expiry, etc.).
- **Pricing** (`#pricing`): tiers with **Get started** → `/login`.
- **Footer CTA**: **Start your free trial** → `/login`.

There is no “Register” link in the main landing nav; new accounts are reached from **Sign up** on the login page (`/login` → `/register`).

---

## 3. Authentication

### 3.1 Login (`/login`)

- Form: email, password (show/hide).
- Submit calls the API; on success the app stores **user + access token** and navigates to the **role-based home** (typically `/schools` for org admins, `/dashboard` for everyone else).
- Footer link: **Sign up** → `/register`.

### 3.2 Register (`/register`)

- Form: name, email, password (min 8 characters).
- On success: redirect to **`/verify?email=...`** (no token yet until verified).

### 3.3 Verify email (`/verify`)

- **Normal registration**: email (pre-filled from query) + **6-digit code**. Submit verifies and then logs the user in → same **role-based home** as login.
- **Invite flow** (`?invite=1`): same code path but the form also requires **password** (account completion).
- **Resend code**: user can request another verification email (toast feedback).
- Errors surface inline / via alerts.

---

## 4. Authenticated shell (dashboard layout)

All main app pages use a shared layout:

| Area | Behavior |
|------|----------|
| **Auth guard** | If not authenticated, show a short loading state and **replace** the URL with `/login`. |
| **Sidebar** | Role-based primary navigation (see §5). Brand header, footer user menu. |
| **Top bar** | Sidebar toggle, **breadcrumbs**, **theme toggle**, **Log out**. |
| **Main** | Scrollable content with consistent padding. |

### 4.1 Sidebar footer (user menu)

- Shows name/email and **role badge**.
- **Dashboard** shortcut.
- **Log out** (API logout + clear store + go to `/login`).

### 4.2 Breadcrumbs

- **Home** always links to `/dashboard`.
- Path segments are mapped to readable labels; long IDs show as **…**.
- Deep links (e.g. `/schools/:id/branches`) build a trail automatically.

---

## 5. Role-based navigation (sidebar)

Primary nav items depend on `user.role`:

| Role | Sidebar items |
|------|-----------------|
| **ADMIN** | Schools, Users |
| **SCHOOL_ADMIN** | Schools, Users |
| **DIRECTOR** | Teachers, Users, My Branch |
| **TEACHER** | Dashboard, My Branch, My Staff File |
| **PARENT** | Dashboard, My Children |

Other routes (e.g. `/branches/:id`, `/children/:id`) are reached via **links from these hubs**, not always as top-level nav items.

---

## 6. Dashboard hub (`/dashboard`)

- **Page header**: “Dashboard” + personalized welcome.
- **Branch Director** (`DIRECTOR` with a `branchId`): **branch overview** backed by the API — enrollment bar chart (students vs teachers), **compliance** donut (satisfied vs missing required document slots across children, staff with profiles, and facility), **teachers fully up to date** (among staff with a `StaffProfile` in the branch), **forms near expiry** (next 30 days), a **Latest forms** table (added by, short form ref, document type, expiry), and a link to **Compliance by person** (`/branches/:branchId/compliance`).
- **Shortcuts**: role cards below the overview (when applicable) for quick navigation (same themes as the sidebar).
- If the role has no defined actions and no branch overview, a **dashed empty state** explains that nothing is available.

### 6.1 Branch compliance by person (`/branches/:id/compliance`)

- **ADMIN**, **SCHOOL_ADMIN** (for branches in their school), and **DIRECTOR** (only their own branch id) can open this page.
- **Teachers** tab: each branch teacher with required vs uploaded (non-expired) staff document counts and a link to **`/staff/:userId`**.
- **Students** tab: each child with parent name, counts, and a link to **`/children/:childId`**.

---

## 7. Flows by persona

### 7.1 ADMIN & SCHOOL_ADMIN — Schools and structure

1. **`/schools`** — List schools; **Add school** (dialog); per school: user/branch counts, **Branches** link, delete school (confirm dialog).
2. **`/users`** (sidebar) — User management: **ADMIN** picks a school when there are several; **SCHOOL_ADMIN** and **DIRECTOR** use their school context. Same invite/create flow as before.
3. **`/schools/:id/branches`** — List branches; **Add branch** (if ADMIN or SCHOOL_ADMIN); click through to a branch.
4. **`/schools/:id/users`** — Same user UI as **`/users`**, reachable via direct URL (e.g. bookmark); **Back** returns to schools.

### 7.2 Branch workspace (`/branches/:id`)

- **Back** link to `/schools/:schoolId/branches`.
- **Tabs**:
  - **Children** — Table of children; **Add child** (if ADMIN, SCHOOL_ADMIN, or DIRECTOR); row actions to open a child.
  - **Staff** — Staff list and links to staff document pages.
  - **Classes** — Classes for the branch; flows to create/open class detail.
  - **Facility Docs** — Facility document checklist for the branch.

Supporting routes (examples):

- `/branches/:id/children/new` — Create child.
- `/branches/:id/classes/new` — Create class.
- `/branches/:id/staff` — Staff-focused view.
- `/branches/:id/facility` — Facility documents.
- `/classes/:id` — Class detail.

### 7.3 DIRECTOR

- **Home** — After login, directors still use `/dashboard` as their app home; if they have a `branchId`, the dashboard shows **metrics and recent uploads** for that branch (see §6).
- **`/teachers`** — List teachers; **invite teacher** (dialog: email, name); uses school context from the user’s assignment.
- **`/my-branch`** — If the user has a `branchId`, the app **immediately redirects** to `/branches/:branchId` (same branch hub as above). If unassigned, shows a short message.
- **Backend** (for dashboards): `GET /branches/:id/dashboard-summary`, `GET /branches/:id/documents/recent`, `GET /branches/:id/compliance/people` — branch-scoped, with directors restricted to their own `branchId`.

### 7.4 TEACHER

- **`/dashboard`** — Entry + cards to **My Branch** and **My Staff File**.
- **`/my-branch`** — Redirect to **`/branches/:branchId`**.
- **`/my-staff-file`** — Redirect to **`/staff/:userId`** (own staff document checklist).

### 7.5 PARENT

- **`/my-children`** — Cards for each linked child; **View documents** → **`/children/:id`**.
- Empty state if no children: explains contacting the school to get children added.

### 7.6 Child documents (`/children/:id`)

- **Back** to the child’s branch or dashboard if branch unknown.
- Checklist of **CHILD** document types (conditional types can hide/show based on child fields).
- **Upload**: presigned URL → direct **PUT** to storage → **complete** document on the API → success toast.
- **Download** opens a time-limited URL in a new tab.
- **Verify** (ADMIN, SCHOOL_ADMIN, DIRECTOR): mark documents verified where the UI allows.

### 7.7 Staff documents (`/staff/:id`)

- Same pattern as child docs for **STAFF** document types.
- **Back** defaults toward **dashboard**.
- Title reflects **My staff file** when viewing your own profile vs **Staff documents** for someone else.
- Verify actions follow the same role rules as child docs.

---

## 8. Document upload UX (conceptual)

1. User picks a file for a required document type.
2. Client requests a **presign** payload (upload URL + key).
3. Browser **PUT**s the file to storage.
4. Client calls **complete** with metadata so the backend records the document version.
5. List/checklist refreshes; toasts confirm or report errors.

Downloads use a **lazy fetch** of a short-lived download URL, then open it.

---

## 9. Cross-cutting UX patterns

- **Loading**: skeletons on list pages, inline spinners on simple redirects, full-page loading for guarded routes while auth is resolving.
- **Empty states**: illustrated messages with optional primary actions (e.g. “Add school”).
- **Confirm dialogs**: destructive actions (e.g. delete school).
- **Toasts**: success and error feedback for mutations (create, upload, invite, etc.).
- **Forms**: shared field components with validation messages; auth uses Zod + react-hook-form.

---

## 10. Route quick reference

| Path | Purpose |
|------|---------|
| `/` | Marketing landing |
| `/login` | Sign in |
| `/register` | Sign up |
| `/verify` | Email verification (and invite completion) |
| `/dashboard` | Authenticated home for Director, Teacher, Parent; branch metrics for Directors with a branch |
| `/users` | Invite and list users (Admin, School Admin, Director); Admin selects school when multiple |
| `/schools` | School list; default post-login for Admin and School Admin |
| `/schools/:id/branches` | Branches for a school |
| `/schools/:id/users` | Users for a school |
| `/branches/:id` | Branch hub (children, staff, classes, facility) |
| `/branches/:id/compliance` | Teachers and students compliance table for the branch |
| `/children/:id` | Child profile + document checklist |
| `/staff/:id` | Staff document checklist |
| `/classes/:id` | Class detail |
| `/teachers` | Director teacher list + invites |
| `/my-branch` | Redirect to user’s branch |
| `/my-children` | Parent’s children |
| `/my-staff-file` | Redirect to own `/staff/:id` |

---

*This file reflects the frontend routes and components under `apps/frontend` as of the date it was written. If you add pages or change roles, update this document in the same PR.*
