# HR Role Integration & Dashboard Redesign

## 1. Overview
The goal is to consolidate the `HR_ADMIN` and `HR_REVIEWER` roles into a single unified `HR` role across the stack. Additionally, we will implement a new enterprise-grade UI using nested React routing. The new UI will feature a master layout with a sidebar and top bar, and two main child views: "Case Management" (formerly Pending Cases) and "Analytics" (formerly Admin Dashboard), strictly adhering to the user-provided high-fidelity HTML mockups.

## 2. Database & Backend Refactor
- **Schema Update:** Run a SQL migration to alter the `role` column constraint in the `users` table to replace `HR_ADMIN` and `HR_REVIEWER` with `HR`.
- **Data Migration:** Update existing users with `HR_ADMIN` or `HR_REVIEWER` to the new `HR` role.
- **Backend Middleware:** Replace all instances of `requireRole('HR_ADMIN', 'HR_REVIEWER')` and similar checks in `auth.js`, `documents.js`, `users.js`, and `onboarding.js` with `requireRole('HR')`. Update token generation logic if necessary.

## 3. Frontend Architecture
We will use a Nested Routing architecture (Approach A).
- **`Router.jsx`:** Update routing logic so that any user with the `HR` role maps to `/dashboard/hr`.
- **`HrDashboardLayout.jsx`:** A new layout component containing the shared Sidebar and TopAppBar from the mockups. Uses `<Outlet />` to render sub-pages.
- **Routes:**
  - `/dashboard/hr` -> Redirects to `/dashboard/hr/cases`
  - `/dashboard/hr/cases` -> `HrCasesPage.jsx`
  - `/dashboard/hr/analytics` -> `HrAnalyticsPage.jsx`

## 4. Frontend Views
- **`HrCasesPage.jsx`:** Implement the "Admin Case Management" mockup. It will display the KPI grid and the Cases Data Table. Selecting a case will transition to the existing `CaseDetailView` for document review.
- **`HrAnalyticsPage.jsx`:** Implement the "Analytics Engine" mockup exactly as provided, featuring the Power BI container, metric visualizations, and the Provisioning Audit Log.
- **Styling:** Strictly copy the Tailwind utility classes, custom CSS (`.ghost-border`, `.primary-gradient`, etc.), and Material Symbols from the provided HTML mockups.
