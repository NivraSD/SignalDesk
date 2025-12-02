# NIV Platform UI Migration Roadmap

## Overview

This document outlines the migration of the existing SignalDesk/NIV platform from the current lavender/dark theme to the new NIV design system (burnt orange/cream editorial theme).

**Current Design:** Dark charcoal background with lavender (mauve) accents
**New Design:** Cream/white background with burnt orange accents, editorial typography

**Design Reference:** `supabase/migrations/design-mockups/platform-design-system.html`

---

## Current State Assessment

### Existing Frontend Structure
```
src/
├── app/
│   ├── api/              # API routes (keep as-is)
│   ├── auth/             # Login, signup, reset-password, callback
│   ├── campaign-builder/ # Campaign wizard
│   ├── dashboard/        # Main dashboard
│   ├── onboarding/       # User onboarding
│   ├── settings/         # User/org settings
│   ├── globals.css       # Current design tokens (needs migration)
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Landing/home page
├── components/
│   ├── auth/             # Auth forms
│   ├── campaign-builder/ # Campaign wizard components
│   ├── canvas/           # Canvas/workspace components
│   ├── command-center/   # Command center UI
│   ├── crisis/           # Crisis management
│   ├── execute/          # Content execution
│   ├── intelligence/     # Intelligence displays
│   ├── modules/          # Module components
│   ├── niv/              # NIV advisor chat
│   ├── predictions/      # Prediction displays
│   ├── proposals/        # Proposal components
│   ├── settings/         # Settings components
│   └── ...
├── hooks/                # Custom React hooks (keep as-is)
├── lib/                  # Utilities (keep as-is)
├── services/             # API services (keep as-is)
├── stores/               # Zustand stores (keep as-is)
└── types/                # TypeScript types (keep as-is)
```

### Design Token Migration Map

| Current (Lavender Theme) | New (NIV Editorial Theme) |
|-------------------------|---------------------------|
| `--charcoal: #1a1a1a` | `--charcoal: #1a1a1a` (same) |
| `--charcoal-light: #2a2a2a` | `--grey-900: #212121` |
| `--pearl: #ffffff` | `--white: #ffffff` (same) |
| `--pearl-soft: #f5f5f5` | `--cream: #faf9f7` |
| `--mauve: #b8a0c8` | `--burnt-orange: #c75d3a` |
| `--mauve-light: #cebcda` | `--burnt-orange-light: #e07b5a` |
| `--mauve-dark: #9d84ad` | `--terracotta: #b54d2e` |
| `--background: var(--charcoal)` | `--background: var(--cream)` |
| `--foreground: var(--pearl)` | `--foreground: var(--charcoal)` |

### Typography Migration

| Current | New |
|---------|-----|
| Geist Sans | Space Grotesk (display), Inter (body) |
| Geist Mono | Playfair Display (serif accents) |

---

## Phase 1: Design Foundation

**Duration:** 1-2 days

### 1.1 Update Global CSS Variables
- [ ] Replace `globals.css` with new design tokens
- [ ] Add Google Fonts imports (Space Grotesk, Playfair Display, Inter)
- [ ] Update color palette from lavender to burnt orange
- [ ] Flip light/dark - cream backgrounds, dark text
- [ ] Update shadow utilities for light theme

### 1.2 Create Shared UI Components
- [ ] Create `components/ui/Button.tsx` matching design system
- [ ] Create `components/ui/Input.tsx` with new styling
- [ ] Create `components/ui/Card.tsx` with cream/white backgrounds
- [ ] Create `components/ui/Badge.tsx` with burnt orange accents
- [ ] Create `components/ui/Logo.tsx` - NIV | by nivria SVG component

### 1.3 Layout Components
- [ ] Create new `components/layout/Nav.tsx` matching design system nav
- [ ] Create `components/layout/Sidebar.tsx` for dashboard
- [ ] Create `components/layout/Footer.tsx` with new branding

---

## Phase 2: Authentication Pages

**Duration:** 1 day

### 2.1 Sign In Page (`app/auth/login/page.tsx`)
- [ ] Update to split-screen layout (form left, brand right)
- [ ] Replace Nivria logo with NIV | by nivria
- [ ] Update colors from lavender to burnt orange
- [ ] Add brand side with headline + decorative circles
- [ ] Style form inputs with new design tokens

### 2.2 Sign Up Page (`app/auth/signup/page.tsx`)
- [ ] Mirror sign-in layout
- [ ] Update headline to "Seize opportunities others miss"
- [ ] Apply new color scheme

### 2.3 Forgot Password (`app/auth/reset-password/page.tsx`)
- [ ] Update to match new auth page design
- [ ] Apply new styling

### 2.4 Auth Components (`components/auth/`)
- [ ] Update `AuthForm.tsx` with new input/button styles
- [ ] Update social auth buttons styling

---

## Phase 3: Navigation & Layout Shell

**Duration:** 1-2 days

### 3.1 Root Layout (`app/layout.tsx`)
- [ ] Update font imports
- [ ] Set cream background as default
- [ ] Update metadata/branding

### 3.2 Dashboard Layout
- [ ] Create dashboard layout wrapper
- [ ] Implement new top navigation bar
  - NIV | by nivria logo
  - Nav links (Hub, Intelligence, Opportunities, Campaigns, Execute, Crisis)
  - Org switcher
  - User profile dropdown
- [ ] Implement sidebar (if applicable)

### 3.3 Landing Page (`app/page.tsx`)
- [ ] Integrate landing page from design system
- [ ] Hero section with loop animation
- [ ] Statement section (24/7 + timelapse)
- [ ] One-click power section
- [ ] Features section
- [ ] GEO section
- [ ] CTA section
- [ ] Footer

---

## Phase 4: Hub/Dashboard

**Duration:** 1-2 days

### 4.1 Dashboard Page (`app/dashboard/page.tsx`)
- [ ] Update background to cream
- [ ] Restyle stat cards with white backgrounds, subtle borders
- [ ] Update activity feed styling
- [ ] Apply burnt orange for accents/highlights
- [ ] Update opportunity cards styling

### 4.2 Dashboard Components
- [ ] Update any dashboard-specific components
- [ ] Ensure consistent card styling
- [ ] Update charts/graphs color schemes

---

## Phase 5: Intelligence Module

**Duration:** 2-3 days

### 5.1 Intelligence Display (`components/IntelligenceSynthesisDisplay.tsx`)
- [ ] Update 59KB component to new design
- [ ] Restyle synthesis cards
- [ ] Update tab navigation styling
- [ ] Apply new typography (Playfair for headlines)
- [ ] Update signal indicators with burnt orange

### 5.2 Intelligence Sub-components
- [ ] Update Executive Intelligence display
- [ ] Update Competitive Intelligence display
- [ ] Update Narrative Intelligence display
- [ ] Update real-time monitor styling
- [ ] Update prediction cards

### 5.3 Intelligence Module (`components/intelligence/`)
- [ ] Update all intelligence-related components
- [ ] Ensure consistent styling across tabs

---

## Phase 6: Opportunities Module

**Duration:** 1 day

### 6.1 Opportunities Display (`components/OpportunitiesDisplay.tsx`)
- [ ] Update opportunity cards to new design
- [ ] Restyle score badges (burnt orange gradient)
- [ ] Update urgency indicators
- [ ] Apply new card styling (white bg, subtle shadows)

### 6.2 Opportunity Detail View
- [ ] Update detail panel styling
- [ ] Restyle action buttons
- [ ] Update media targeting section

---

## Phase 7: Campaign Builder

**Duration:** 2-3 days

### 7.1 Campaign Builder Wizard (`components/campaign-builder/`)
- [ ] Update wizard step indicators
- [ ] Restyle form sections
- [ ] Update progress indicators with burnt orange
- [ ] Apply new card/panel styling

### 7.2 Campaign Builder Stages
- [ ] Stage 1: Intent Capture - update form styling
- [ ] Stage 2: Research - update display panels
- [ ] Stage 3: Positioning - update selection cards
- [ ] Stage 4: Blueprint - update timeline/phase displays
- [ ] Stage 5: Presentation - update preview styling
- [ ] Stage 6: Execution Manager - update tracking UI

---

## Phase 8: Execute Module (Content)

**Duration:** 2-3 days

### 8.1 Execute Components (`components/execute/`)
- [ ] Update content library grid/list views
- [ ] Restyle content type cards
- [ ] Update editor interface
- [ ] Apply new styling to batch generation UI

### 8.2 Content Editor
- [ ] Update rich text editor chrome
- [ ] Restyle toolbar
- [ ] Update export/save buttons

---

## Phase 9: NIV Advisor (Chat)

**Duration:** 1-2 days

### 9.1 NIV Components (`components/niv/`)
- [ ] Update chat interface styling
- [ ] Restyle message bubbles
- [ ] Update input area
- [ ] Apply NIV branding to avatar/indicators

### 9.2 Canvas Integration (`components/canvas/`)
- [ ] Update canvas/workspace styling
- [ ] Restyle draggable panels
- [ ] Update panel headers

---

## Phase 10: Crisis Module

**Duration:** 1-2 days

### 10.1 Crisis Components (`components/crisis/`)
- [ ] Update crisis plan generator wizard
- [ ] Restyle monitoring mode display
- [ ] Update active crisis mode (keep red for alerts)
- [ ] Apply new card/panel styling

---

## Phase 11: Settings & Admin

**Duration:** 1 day

### 11.1 Settings Pages (`app/settings/`, `components/settings/`)
- [ ] Update settings layout
- [ ] Restyle form inputs
- [ ] Update navigation tabs
- [ ] Apply new styling throughout

### 11.2 Admin Components (`components/admin/`)
- [ ] Update admin interfaces
- [ ] Apply consistent styling

---

## Phase 12: Final Polish

**Duration:** 1-2 days

### 12.1 Consistency Pass
- [ ] Audit all pages for color consistency
- [ ] Ensure all lavender/mauve references replaced
- [ ] Verify typography consistency
- [ ] Check all interactive states (hover, focus, active)

### 12.2 Animation & Transitions
- [ ] Update any animations to match design system
- [ ] Ensure smooth transitions
- [ ] Add subtle micro-interactions where appropriate

### 12.3 Responsive Review
- [ ] Test all breakpoints
- [ ] Ensure mobile layouts work with new design
- [ ] Fix any responsive issues

### 12.4 Accessibility
- [ ] Verify color contrast ratios
- [ ] Test keyboard navigation
- [ ] Screen reader testing

---

## Migration Strategy

### Approach: Component-by-Component
1. Start with global CSS tokens (immediate visual impact)
2. Create new shared UI components
3. Update auth pages (high visibility, low complexity)
4. Update navigation (affects all pages)
5. Work through each module systematically
6. Final polish pass

### Parallel Development
- Design tokens can be updated immediately
- New UI components can be built in parallel
- Page updates can happen module by module

### Rollback Safety
- Keep old component versions until migration complete
- Use feature flags if needed for gradual rollout
- Test each migration step before proceeding

---

## Files to Modify (Priority Order)

### Critical (Do First)
1. `src/app/globals.css` - Design tokens
2. `src/app/layout.tsx` - Font imports, base styling
3. `src/app/auth/login/page.tsx` - Sign in
4. `src/app/auth/signup/page.tsx` - Sign up
5. `src/components/auth/AuthForm.tsx` - Auth form styling

### High Priority
6. Navigation components (create new)
7. `src/app/page.tsx` - Landing page
8. `src/app/dashboard/page.tsx` - Dashboard
9. `src/components/IntelligenceSynthesisDisplay.tsx` - Intelligence

### Medium Priority
10. `src/components/OpportunitiesDisplay.tsx`
11. `src/components/campaign-builder/*`
12. `src/components/execute/*`
13. `src/components/niv/*`

### Lower Priority
14. `src/components/crisis/*`
15. `src/components/settings/*`
16. `src/components/predictions/*`
17. Remaining components

---

## Estimated Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Design Foundation | 1-2 days | None |
| Phase 2: Auth Pages | 1 day | Phase 1 |
| Phase 3: Navigation & Layout | 1-2 days | Phase 1 |
| Phase 4: Hub/Dashboard | 1-2 days | Phase 3 |
| Phase 5: Intelligence | 2-3 days | Phase 3 |
| Phase 6: Opportunities | 1 day | Phase 3 |
| Phase 7: Campaign Builder | 2-3 days | Phase 3 |
| Phase 8: Execute | 2-3 days | Phase 3 |
| Phase 9: NIV Advisor | 1-2 days | Phase 3 |
| Phase 10: Crisis | 1-2 days | Phase 3 |
| Phase 11: Settings | 1 day | Phase 3 |
| Phase 12: Polish | 1-2 days | All |

**Total Estimated: 2-3 weeks**

---

## Quick Reference: Design System Colors

```css
/* Primary */
--burnt-orange: #c75d3a;
--burnt-orange-light: #e07b5a;
--terracotta: #b54d2e;
--rust: #8b3a2f;

/* Neutrals */
--charcoal: #1a1a1a;
--grey-900: #212121;
--grey-800: #2e2e2e;
--grey-600: #555555;
--grey-500: #757575;
--grey-400: #9e9e9e;
--grey-300: #bdbdbd;
--grey-200: #e0e0e0;
--grey-100: #f0f0f0;
--white: #ffffff;
--cream: #faf9f7;

/* Typography */
--font-display: "Space Grotesk", sans-serif;
--font-serif: "Playfair Display", serif;
--font-body: "Inter", sans-serif;
```

---

*Last Updated: November 2025*
*Version: 1.0*
