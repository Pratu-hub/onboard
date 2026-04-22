# HR Role Integration & Dashboard Redesign Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Integrate HRAdmin and HRReviewer roles into a unified HR role and implement the new nested dashboard UI based on high-fidelity mockups.

**Architecture:** Database schema migration to a single 'HR' role, API middleware adjustments to recognize the new role, and a React nested routing structure featuring a master layout component with child views for Case Management and Analytics.

**Tech Stack:** React, Tailwind CSS, Express, MSSQL, SQL Server, Node.js

---

### Task 1: Database Migration

**Files:**
- Create: `backend/src/db/migrate_hr_roles.js`

**Step 1: Write Migration Script**
Write a Node.js script using `mssql` to update the `users` table constraint and existing user roles.
- Drop the existing check constraint on `role` column.
- Update `HR_ADMIN` and `HR_REVIEWER` roles to `HR` in the `users` table.
- Add a new check constraint allowing `HR`.

**Step 2: Run Migration**
Run: `node backend/src/db/migrate_hr_roles.js`
Expected: Success log indicating rows updated and constraint applied.

**Step 3: Update Seed Data**
Update `backend/src/db/seed.js` and `backend/src/db/schema.sql` so future setups use `HR` instead of `HR_ADMIN` or `HR_REVIEWER`.

**Step 4: Commit**
```bash
git add backend/src/db/migrate_hr_roles.js backend/src/db/seed.js backend/src/db/schema.sql
git commit -m "chore(db): migrate hr roles to unified HR role"
```

### Task 2: Backend Role Updates

**Files:**
- Modify: `backend/src/routes/auth.js`
- Modify: `backend/src/routes/documents.js`
- Modify: `backend/src/routes/users.js`
- Modify: `backend/src/routes/onboarding.js`

**Step 1: Update API Route Authorizations**
Replace all instances of `requireRole('HR_ADMIN', 'HR_REVIEWER')` and `requireRole('HR_ADMIN')` with `requireRole('HR')`. Update `validRoles` array in `auth.js` to include `HR` instead of the other two.

**Step 2: Update Auth Controller Logic**
Update logic checking `req.user.role === 'HR_ADMIN'` etc. to check for `'HR'`. Ensure Microsoft Graph Group mappings (`HR_ADMIN_GROUP` / `HR_REVIEWER_GROUP`) both map to the `HR` role.

**Step 3: Test Backend Functionality**
Run a few test curls or rely on existing tests if applicable to ensure login generates the correct `HR` token.

**Step 4: Commit**
```bash
git add backend/src/routes/auth.js backend/src/routes/documents.js backend/src/routes/users.js backend/src/routes/onboarding.js
git commit -m "feat(api): update endpoints to use unified HR role"
```

### Task 3: Frontend Routing & Layout Setup

**Files:**
- Modify: `frontend/src/Router.jsx`
- Modify: `frontend/src/pages/Login.jsx`
- Create: `frontend/src/features/hr/HrDashboardLayout.jsx`

**Step 1: Update Login Routing**
Update `frontend/src/pages/Login.jsx` to direct users with `HR` role to `/dashboard/hr`.

**Step 2: Setup React Router**
Update `Router.jsx` to map `<Route path="/dashboard/hr" element={<HrDashboardLayout />}>`. Add nested routes `<Route path="cases" element={<HrCasesPage />} />` and `<Route path="analytics" element={<HrAnalyticsPage />} />`. Redirect `/dashboard/hr` to `cases`. Add a ProtectedRoute specifically for the `HR` role.

**Step 3: Scaffold Layout Component**
Create `frontend/src/features/hr/HrDashboardLayout.jsx` featuring the Sidebar and TopAppBar from the "Admin Case Management" HTML mockup. Use `<Outlet />` for the main content area. Make sure to use `<NavLink>` for the sidebar links so they indicate active state.

**Step 4: Commit**
```bash
git add frontend/src/Router.jsx frontend/src/pages/Login.jsx frontend/src/features/hr/HrDashboardLayout.jsx
git commit -m "feat(ui): setup nested routing and dashboard layout for HR"
```

### Task 4: Implement HrCasesPage (Case Management View)

**Files:**
- Create: `frontend/src/features/hr/pages/HrCasesPage.jsx`
- Modify: `frontend/src/features/hr-reviewer/components/PendingCasesList.jsx` -> move logic to `HrCasesPage.jsx`
- Modify: `frontend/src/features/hr-reviewer/components/CaseDetailView.jsx` -> use existing component.

**Step 1: Build the Page Wrapper**
Create `HrCasesPage.jsx` and implement the KPI Grid ("Total Cases", "Avg Time", "Rejection Rate", "Provisioning Success") from the mockup. Fetch documents/cases data from the API just like the old `HrReviewerDashboard` did.

**Step 2: Build the Data Table**
Implement the "Data Table" from the mockup inside `HrCasesPage.jsx`. It should display the fetched cases. Add state to track which row is clicked.

**Step 3: Detail View Transition**
When a row is clicked, hide the data table and render the existing `CaseDetailView` component, passing down the necessary props (`currentCase`, `onBack`, `onVerify`, `onReject`).

**Step 4: Cleanup Old Dashboard**
Delete the now unused `HrReviewerDashboard.jsx` and `HrAdminDashboard.jsx` files.

**Step 5: Commit**
```bash
git add frontend/src/features/hr/pages/HrCasesPage.jsx
git rm frontend/src/features/hr-reviewer/HrReviewerDashboard.jsx frontend/src/pages/HrAdminDashboard.jsx
git commit -m "feat(ui): implement case management view with data table and KPI grid"
```

### Task 5: Implement HrAnalyticsPage

**Files:**
- Create: `frontend/src/features/hr/pages/HrAnalyticsPage.jsx`

**Step 1: Scaffold Analytics Page**
Create `HrAnalyticsPage.jsx`. Implement the top header ("Analytics Engine" and Export buttons).

**Step 2: Build Visualizations**
Implement the specific sections from the "Analytics Engine" mockup: The large KPI Tile, Line Chart placeholder, Bar Chart ("Case Volume by Department"), and Donut Chart ("Rejections by Doc Type"). These can be static for now or fetch basic summary metrics if available.

**Step 3: Build Provisioning Audit Log**
Add the "Provisioning Audit Log" section at the bottom of the page, matching the visual styles from the mockup.

**Step 4: Commit**
```bash
git add frontend/src/features/hr/pages/HrAnalyticsPage.jsx
git commit -m "feat(ui): implement enterprise analytics dashboard page"
```
