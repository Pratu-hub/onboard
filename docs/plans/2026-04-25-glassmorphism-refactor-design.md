# Glassmorphism Design Refactor

## Overview
This document outlines the design foundation and component rules for a full application refactor to a "Glassmorphism" aesthetic, replacing the existing Material Design 3 (M3) implementation. The new design focuses on frosted glass effects, translucent layers, subtle blur, luminous borders, and a dark, high-contrast base for modern enterprise elegance.

## Brand & Style Foundations
- **Visual Style**: Clean, high-contrast, bold, enterprise, liquid glass effect, glassmorphism.
- **Theme**: Dark mode default (gradient mesh backgrounds).
- **Typography Scale**: Mobile-first compact scale.
- **Fonts**: 
  - Primary/Display: Plus Jakarta Sans (weights 100-900)
  - Mono: JetBrains Mono

### Color Tokens
- **Primary**: `#1856FF` (vibrant electric blue)
- **Secondary**: `#3A344E` (muted purple-gray)
- **Success**: `#07CA6B` (neon green)
- **Warning**: `#E89558` (warm amber)
- **Danger**: `#EA2143` (hot red)
- **Surface**: `#FFFFFF`
- **Text**: `#141414` (for light mode) / `#FFFFFF` (for dark mode default)

### Glass Surface System (Tiers)
- **glass-panel**: `rgba(255,255,255,0.08)`, blur: `24px`, border: `1px solid rgba(255,255,255,0.12)` (Use for cards, modals)
- **glass-surface**: `rgba(255,255,255,0.04)`, blur: `16px`, border: `1px solid rgba(255,255,255,0.08)` (Use for table rows, list items, inputs)
- **glass-elevated**: `rgba(255,255,255,0.12)`, blur: `32px`, border: `1px solid rgba(255,255,255,0.18)` (Use for headers, dropdowns, floating elements)

## Component-Level Rules

### Backgrounds & Layout Shells
- **App Background**: Dark gradient mesh base (e.g., `#0a0a12`) with soft, slow-moving radial glows of primary (`#1856FF` at 15%) and secondary (`#3A344E` at 20%) colors.
- **Headers (`DashboardLayout`, `HrDashboardLayout`)**: Floating `glass-elevated` pill at the top of the screen with padding separating it from viewport edges. Navigation links use `rgba(255,255,255,0.1)` on hover.
- **Bento Grids**: Main content areas follow a bento box layout using `glass-panel` containers with uniform gaps.

### Authentication (`Login.jsx`)
- **Container**: A single prominent `glass-panel` bento card centered over the dark gradient mesh.
- **Inputs**: `glass-surface` with 1px translucent borders. `:focus` state applies a primary color `#1856FF` glow/border.
- **Buttons**: Primary buttons are high-contrast solid elements (e.g., solid `#1856FF` background, white text) with a subtle inner shadow and hover lift (`translateY(-1px)`) to ground the UI.

### Data Tables & Lists
- **Container**: Wrapped in `glass-panel`.
- **Headers**: Transparent background with uppercase, tracked-out text and a bottom border of `rgba(255,255,255,0.1)`.
- **Rows**: Transparent by default, switching to `glass-surface` on hover. High contrast white text to maintain WCAG AA compliance.

### Badges & Avatars
- **Status Badges**: Hollow glass style. 
  - *Verified/Success*: `bg-success/15`, `border-success`, `text-success`.
  - *Flagged/Danger*: `bg-danger/15`, `border-danger`, `text-danger`.
- **Avatars**: Soft translucent borders.

## Accessibility Requirements
- **Contrast**: Text against glass surfaces must meet WCAG 2.2 AA contrast ratios (minimum 4.5:1). Dark themes must use sufficiently bright text colors.
- **Focus States**: Visible focus outlines (using primary color glow) must be present for all interactive elements (keyboard-first interactions).
- **Motion**: Reduced motion queries must disable background orbs and hover lifts.

## Micro-Animations
- **Hover on Panels**: Subtle `scale(1.01)` and slight increase in border opacity/glow.
- **Transitions**: Fade-in with slight upward translate (`slide-in-from-bottom`) for page mounting.

## Anti-Patterns
- Avoid using solid opaque backgrounds for containers unless it's a primary CTA button.
- Do not mix light gray backgrounds (`bg-slate-50`) with the dark glassmorphism mesh.
- Do not use low-contrast text on translucent layers.

## Migration Checklist
- [ ] Update `index.css` with new glass utility classes, CSS variables, and font imports.
- [ ] Refactor `Login.jsx` to use the dark mesh background and glass panels.
- [ ] Refactor `DashboardLayout.jsx` and `HrDashboardLayout.jsx` headers.
- [ ] Refactor `NewHireDashboard.jsx` (Tables, Cards, Progress Bars).
- [ ] Refactor `NewHireProfile.jsx` (Inputs, Forms).
- [ ] Refactor `StatusTracker.jsx` (Timelines, Badges).
- [ ] Refactor HR features (`HrCasesPage.jsx`, `HrAnalyticsPage.jsx`, `CaseDetailView.jsx`, etc.).
