# Glassmorphism Refactor Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Refactor the entire frontend application to use a Glassmorphism design system, updating CSS tokens, layouts, and components.

**Architecture:** We will first update `index.css` with the new design tokens and glass utility classes. Then, we will methodically update each component layer (Login -> Layouts -> Dashboards -> Micro-components) to apply the new classes and structures, ensuring we maintain accessibility and existing logic.

**Tech Stack:** React, Tailwind CSS, Vite

---

### Task 1: Foundation and Tokens

**Files:**
- Modify: `frontend/src/index.css`

**Step 1: Write the minimal implementation**
Replace M3 variables in `index.css` with Glassmorphism tokens and utilities.

```css
@import "tailwindcss";

@theme {
  --color-primary: #1856FF;
  --color-secondary: #3A344E;
  --color-success: #07CA6B;
  --color-warning: #E89558;
  --color-danger: #EA2143;
  --color-surface: #FFFFFF;
  --color-text: #141414;
  --font-headline: "Plus Jakarta Sans";
  --font-body: "Plus Jakarta Sans";
  --font-mono: "JetBrains Mono";
}

@layer base {
  body { 
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: var(--color-surface);
    background-color: #0a0a12;
    background-image: 
      radial-gradient(circle at 15% 50%, rgba(24, 86, 255, 0.15), transparent 50%),
      radial-gradient(circle at 85% 30%, rgba(58, 52, 78, 0.2), transparent 50%);
    background-attachment: fixed;
    min-height: 100vh;
  }
}

@layer utilities {
  .glass-panel {
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.12);
  }
  .glass-surface {
    background: rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
  .glass-elevated {
    background: rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(32px);
    border: 1px solid rgba(255, 255, 255, 0.18);
  }
  .material-symbols-outlined {
    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  }
}
```

**Step 2: Commit**

```bash
git add frontend/src/index.css
git commit -m "style: update design tokens for glassmorphism"
```

### Task 2: Refactor Login Component

**Files:**
- Modify: `frontend/src/pages/Login.jsx`

**Step 1: Write the minimal implementation**
Update `Login.jsx` to use `glass-panel` and remove M3 specific classes (`bg-surface-container-lowest`, etc.). Adjust text colors for dark mode context.

**Step 2: Commit**

```bash
git add frontend/src/pages/Login.jsx
git commit -m "style: apply glassmorphism to Login page"
```

### Task 3: Refactor Layouts

**Files:**
- Modify: `frontend/src/components/DashboardLayout.jsx`
- Modify: `frontend/src/features/hr/HrDashboardLayout.jsx`

**Step 1: Write the minimal implementation**
Update the headers to float using `glass-elevated` and adjust background removals to expose the mesh background.

**Step 2: Commit**

```bash
git add frontend/src/components/DashboardLayout.jsx frontend/src/features/hr/HrDashboardLayout.jsx
git commit -m "style: apply glassmorphism to layouts"
```

### Task 4: Refactor New Hire Dashboards

**Files:**
- Modify: `frontend/src/pages/NewHireDashboard.jsx`
- Modify: `frontend/src/pages/StatusTracker.jsx`
- Modify: `frontend/src/pages/NewHireProfile.jsx`

**Step 1: Write the minimal implementation**
Change `bg-surface-container-lowest` to `glass-panel`. Update tables to use transparent or `glass-surface` headers/rows. Implement hollow glass badges for status indicators.

**Step 2: Commit**

```bash
git add frontend/src/pages/NewHireDashboard.jsx frontend/src/pages/StatusTracker.jsx frontend/src/pages/NewHireProfile.jsx
git commit -m "style: apply glassmorphism to new hire components"
```

### Task 5: Refactor HR Features

**Files:**
- Modify: `frontend/src/features/hr/pages/HrCasesPage.jsx`
- Modify: `frontend/src/features/hr/pages/HrAnalyticsPage.jsx`

**Step 1: Write the minimal implementation**
Update containers to `glass-panel`, lists and analytics cards to `glass-surface`. Adjust charts (if any) or text contrasts.

**Step 2: Commit**

```bash
git add frontend/src/features/hr/pages/HrCasesPage.jsx frontend/src/features/hr/pages/HrAnalyticsPage.jsx
git commit -m "style: apply glassmorphism to HR pages"
```

### Task 6: Refactor Reviewer Components

**Files:**
- Modify: `frontend/src/features/hr-reviewer/components/PendingCasesList.jsx`
- Modify: `frontend/src/features/hr-reviewer/components/CaseDetailView.jsx`
- Modify: `frontend/src/features/hr-reviewer/components/AuditLogView.jsx`
- Modify: `frontend/src/components/Avatar.jsx`

**Step 1: Write the minimal implementation**
Apply glass aesthetics to detail views and lists. Update Avatar component to match the visual language.

**Step 2: Commit**

```bash
git add frontend/src/features/hr-reviewer/components/ frontend/src/components/Avatar.jsx
git commit -m "style: apply glassmorphism to reviewer components"
```
