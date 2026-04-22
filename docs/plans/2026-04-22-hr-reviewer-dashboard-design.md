# HR Reviewer Dashboard Redesign (Google Stitch)

## 1. Overview
The goal is to redesign the `HrReviewerDashboard.jsx` using the design tokens from the Google Stitch project (`9210366092241557597`). The redesign implements "The Industrial Orchestrator" theme, providing a premium, editorial feel that replaces the generic SaaS dashboard look.

## 2. Architecture & Component Structure
We are moving away from a single monolithic file in `pages/` to a feature-based folder structure.

**Path:** `frontend/src/features/hr-reviewer/`
- `HrReviewerDashboard.jsx`: The parent container and state manager.
- `components/PendingCasesList.jsx`: The data table displaying pending document reviews.
- `components/CaseDetailView.jsx`: The deep-dive view into a specific document case.
- `components/AuditLogView.jsx`: The rejection flow and audit log history.

*Note: The main routing will be updated to point to `features/hr-reviewer/HrReviewerDashboard.jsx` instead of `pages/HrReviewerDashboard.jsx`.*

## 3. State Management
The parent `HrReviewerDashboard.jsx` orchestrates the multi-screen flow using local state:
- `activeView`: Enum string (`'LIST'`, `'DETAIL'`, `'AUDIT'`).
- `selectedCase`: The current document object being reviewed.

**Flow:**
1. List view renders by default.
2. Clicking a case sets `selectedCase` and changes view to `'DETAIL'`.
3. In the detail view, clicking "Reject" changes the view to `'AUDIT'`.
4. Child components are provided an `onBack` callback to return to previous states.

## 4. Aesthetics & The "Industrial Orchestrator" Theme
The design will strictly use Tailwind CSS utility classes mapped to the Stitch design tokens.

- **Surface Colors:**
  - Base: `#fdf8f6` (surface)
  - Sectioning: `#f7f3f1` (surface-container-low)
  - Content Cards: `#ffffff` (surface-container-lowest)
- **Borders:** "No-Line Rule" enforced. Sections separated by tonal background shifts. Fallback ghost borders (`#c0c7d4` at 15% opacity) only used when strictly necessary for data-dense table rows.
- **Typography:** Headlines use tight tracking (`tracking-tight` for -0.02em). Buttons use uppercase with `tracking-wider` (0.05em).
- **Primary Actions:** Signature gradients (`bg-gradient-to-br from-[#005faa] to-[#0078d4]`) on CTA buttons with `rounded-md` corners.
- **Glassmorphism:** Sticky headers or floating elements use `bg-[#fdf8f6]/80 backdrop-blur-[20px]`.
