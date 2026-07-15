# Enterprise KPI Dashboard - MVP Completion Implementation Plan

## Executive Summary

**Objective:** Complete all remaining MVP features for the Enterprise KPI Dashboard, making it production-ready and deployment-ready on Vercel.

**Scope:** Implement authentication, RBAC, enhanced pages, backend APIs, business logic engines, approval workflows, UI polish, and full documentation.

**Current State:** Days 1-6 complete with foundation, basic pages, and GET APIs implemented.

**Estimated Deliverables:** 80+ new files, 5000+ lines of production code

---

## Phase 1: Authentication & Authorization Foundation (CRITICAL PATH)

**Priority:** HIGHEST - Everything else depends on this

### 1.1 Install Dependencies
```bash
npm install next-auth@beta bcryptjs jsonwebtoken
npm install --save-dev @types/bcryptjs @types/jsonwebtoken
```

### 1.2 Auth.js Configuration
- `lib/auth/auth.config.ts` - NextAuth configuration
- `lib/auth/auth.ts` - Auth instance
- `app/api/auth/[...nextauth]/route.ts` - Auth API route

### 1.3 User Types & Roles
- `types/auth.ts` - User, Session, Role types
- `lib/auth/roles.ts` - Role definitions and hierarchy
- `lib/auth/permissions.ts` - Permission matrix by role

### 1.4 Authentication Pages
- `app/login/page.tsx` - Professional login page
- `app/logout/page.tsx` - Logout confirmation
- `app/access-denied/page.tsx` - 403 page

### 1.5 Middleware & Route Protection
- `middleware.ts` - Route protection middleware
- `lib/auth/guards.ts` - Permission guard utilities
- `components/auth/RequireAuth.tsx` - Component-level guard
- `components/auth/RequireRole.tsx` - Role-based guard

### 1.6 Session Management
- `lib/auth/session.ts` - Session utilities
- `hooks/useSession.ts` - Session hook
- `hooks/usePermissions.ts` - Permission check hook

### 1.7 Demo Users
Create 5 demo users with different roles:
- admin@example.com (Admin)
- executive@example.com (Executive)
- manager@example.com (Department Manager)
- lead@example.com (Team Lead)
- employee@example.com (Employee)

### 1.8 User Menu Component
- `components/layout/UserMenu.tsx` - Avatar dropdown with profile/settings/logout

**Deliverables:** 15 files, ~1200 lines
**Dependencies:** None
**Testing:** Verify login, session persistence, role-based redirects

---

## Phase 2: Business Logic Engines (CRITICAL PATH)

**Priority:** HIGH - Required for accurate KPI calculations

### 2.1 KPI Scoring Engine
- `lib/scoring/calculateKPIScore.ts`
  - Support calculation types:
    - More Than Better (revenue, sales)
    - Less Than Better (costs, errors)
    - Equal To Better (exact targets)
    - Range (min-max scoring)
    - Milestone (binary completion)
    - Yes/No (boolean targets)
  - Handle edge cases (division by zero, negative values, missing data)
  - Cap scores at 100%
  - Pure function with comprehensive tests

### 2.2 KPI Status Engine
- `lib/scoring/calculateKPIStatus.ts`
  - Priority-based status determination:
    - Awaiting Approval (pending updates)
    - Awaiting Data (no actual value)
    - Missed (past due, score < 50%)
    - Behind (score 50-69%)
    - At Risk (score 70-79%)
    - On Track (score 80-99%)
    - Overachieved (score >= 100%)
    - Completed (marked complete)

### 2.3 Overdue Detection Engine
- `lib/scoring/isOverdue.ts`
  - Check if KPI is past due date
  - Exclude completed/overachieved/cancelled statuses

### 2.4 Unit Tests
- `__tests__/lib/scoring/calculateKPIScore.test.ts`
- `__tests__/lib/scoring/calculateKPIStatus.test.ts`
- `__tests__/lib/scoring/isOverdue.test.ts`
- Install Vitest: `npm install --save-dev vitest @testing-library/react`

**Deliverables:** 6 files, ~600 lines
**Dependencies:** None
**Testing:** 20+ unit tests covering edge cases

---

## Phase 3: Backend APIs & Data Persistence (CRITICAL PATH)

**Priority:** HIGH - Connect frontend to backend

### 3.1 KPI CRUD APIs
- `app/api/kpis/route.ts` - Extend with POST
- `app/api/kpis/[id]/route.ts` - PUT, DELETE
- Use Zod validation schemas
- Write to Airtable via airtableService
- Apply business logic engines for score/status calculation

### 3.2 KPI Update Submission System
- `types/models.ts` - Add KPIUpdate interface
- `schemas/validation.ts` - Add KPIUpdateSchema
- `app/api/kpi-updates/route.ts` - POST (submit update), GET (list updates)
- `app/api/kpi-updates/[id]/route.ts` - GET single update
- `app/api/kpi-updates/[id]/approve/route.ts` - PUT (approve)
- `app/api/kpi-updates/[id]/reject/route.ts` - PUT (reject)
- `app/api/kpi-updates/pending/route.ts` - GET pending updates

### 3.3 React Query Mutations
- `hooks/useKPIMutations.ts`
  - useCreateKPI
  - useUpdateKPI
  - useDeleteKPI
  - useSubmitKPIUpdate
  - useApproveKPIUpdate
  - useRejectKPIUpdate

### 3.4 Airtable Service Extensions
- `services/airtable.service.ts` - Add createKPI, updateKPI, deleteKPI methods
- Add KPI Updates table support

**Deliverables:** 10 files, ~1000 lines
**Dependencies:** Phase 2 (scoring engines)
**Testing:** API route testing with Postman/Thunder Client

---

## Phase 4: Approval Queue System

**Priority:** MEDIUM - Admin/Manager feature

### 4.1 Approval Queue Page
- `app/approvals/page.tsx`
  - Display pending KPI updates
  - Table with: KPI Name, Employee, Current Value, Proposed Value, Submitted Date
  - Actions: Approve, Reject, Request Revision buttons
  - Filter by department, employee, date range
  - Role-based access (Admin, Executive, Manager only)

### 4.2 Approval Components
- `features/approvals/components/ApprovalCard.tsx`
- `features/approvals/components/ApprovalActions.tsx`
- `features/approvals/components/ApprovalHistory.tsx`

### 4.3 Connect Frontend to APIs
- Wire up approve/reject actions to mutation hooks
- Toast notifications for success/error
- Optimistic updates with React Query

**Deliverables:** 5 files, ~400 lines
**Dependencies:** Phase 1 (auth), Phase 3 (APIs)
**Testing:** Verify approval flow as Manager role

---

## Phase 5: Enhanced Task Tracking Dashboard

**Priority:** MEDIUM - Enhance existing page

### 5.1 Extend Task Model
- Add fields to types/models.ts:
  - departmentId, departmentName
  - teamName
  - relatedKPIId, relatedKPIName
  - completionScore
  - impactLevel
  - isOverdue

### 5.2 Enhanced Task Table
- Update `app/task-tracking/page.tsx`
- Add columns:
  - Department
  - Team
  - Related KPI
  - Completion Score
  - Impact Level
  - Overdue Indicator (red badge)
  - Last Updated
- Add table features:
  - Search input (filter by task name, employee)
  - Column sorting (sortable headers)
  - Pagination (show 20 per page)
  - Priority filter dropdown
  - Status filter dropdown
  - Department filter dropdown

### 5.3 Enhanced Charts
- Task Status Donut Chart (already exists, keep)
- Add: Completion Trend Line Chart (7 days)
- Add: Tasks by Department Bar Chart
- Add: Tasks by Priority Pie Chart

### 5.4 Enhanced Stats
- Add more stat cards:
  - Overdue Tasks
  - Cancelled Tasks
  - High Priority
  - Completion %

**Deliverables:** 3 files modified, ~300 lines added
**Dependencies:** None
**Testing:** Verify search, sort, filter functionality

---

## Phase 6: Enhanced Achievements Page

**Priority:** MEDIUM - Enhance existing page

### 6.1 Enhanced Achievement Cards
- Add new stat cards:
  - Top Employee (highest points)
  - Recent Achievements (this week)
  - Achievement Categories count

### 6.2 Leaderboard Section
- `features/achievements/components/Leaderboard.tsx`
- Top 10 employees by achievement points
- Display: Rank, Avatar, Name, Points, Latest Achievement
- Medal icons for top 3

### 6.3 Recent Achievements Section
- `features/achievements/components/RecentAchievements.tsx`
- Timeline view of last 10 achievements
- Display: Badge, Title, Employee, Date, Points

### 6.4 Enhanced Charts
- Achievements by Employee (top 10 bar chart)
- Points Distribution (histogram)

### 6.5 Enhanced Table
- Add filters:
  - Department filter
  - Employee filter
  - Category filter
  - Date range filter

**Deliverables:** 4 files, ~400 lines
**Dependencies:** None
**Testing:** Verify leaderboard sorting, filters

---

## Phase 7: Enhanced Reports Page

**Priority:** MEDIUM - Enhance existing page

### 7.1 Date Range Picker
- `components/reports/DateRangePicker.tsx`
- Use shadcn/ui calendar component
- Preset ranges: This Week, This Month, This Quarter, This Year, Custom

### 7.2 Export Functionality
- `lib/reports/exportPDF.ts` - Placeholder function
- `lib/reports/exportExcel.ts` - Placeholder function
- Wire up Export PDF button (show toast: "Export feature coming soon")
- Wire up Export Excel button (show toast: "Export feature coming soon")

### 7.3 Print Functionality
- Add Print CSS styles
- Wire up Print button to window.print()

### 7.4 Additional Report Sections
- Add: Achievement Summary card
- Add: Department Performance detailed table
- Add: Employee Scorecard detailed table

**Deliverables:** 4 files, ~300 lines
**Dependencies:** None
**Testing:** Verify date picker, print functionality

---

## Phase 8: Import Mapping Page (UI ONLY)

**Priority:** LOW - UI placeholder only

### 8.1 Import Mapping Page
- `app/import-mapping/page.tsx`
- Display mapping table:
  - Columns: Source Field, Target Field, Transformation Rule, Required, Active
- Mock data with common field mappings
- Add/Edit/Delete buttons (non-functional, show toast)
- Banner: "Import functionality coming in future release"

**Deliverables:** 1 file, ~200 lines
**Dependencies:** None
**Testing:** Visual review only

---

## Phase 9: Global Search Component

**Priority:** MEDIUM - Useful feature

### 9.1 Global Search
- `components/layout/GlobalSearch.tsx`
  - Search input in header (desktop)
  - Opens dropdown with results
  - Searches across: KPIs, Departments, Employees, Tasks, Achievements
  - Client-side filtering (uses existing React Query cache)
  - Group results by entity type
  - Click result → navigate to detail page
  - Keyboard navigation support (arrow keys, enter)

### 9.2 Add to Header
- Update `components/layout/Header.tsx`
- Place search between title and user menu

**Deliverables:** 2 files, ~250 lines
**Dependencies:** None
**Testing:** Test search across entities, keyboard nav

---

## Phase 10: Global Notifications

**Priority:** MEDIUM - Good UX feature

### 10.1 Notification Dropdown
- `components/layout/NotificationDropdown.tsx`
  - Bell icon with badge count
  - Dropdown with notification list
  - Notification types:
    - KPI Updates (new submissions)
    - Approvals Required (pending your approval)
    - Overdue KPIs (past due date)
    - Failed Syncs (data source errors)
    - Task Deadlines (due soon)
  - Mark as read functionality
  - "View All" link

### 10.2 Dummy Notification Data
- `lib/notifications/mockNotifications.ts`
- Generate 5-10 dummy notifications
- Mix of types and timestamps

### 10.3 Add to Header
- Update `components/layout/Header.tsx`
- Place notification bell next to user menu

**Deliverables:** 3 files, ~300 lines
**Dependencies:** Phase 1 (auth for user context)
**Testing:** Verify dropdown, mark as read

---

## Phase 11: UI Polish & Performance

**Priority:** MEDIUM - Production quality

### 11.1 Loading Skeletons
- `components/ui/Skeleton.tsx` (if not exists)
- Add skeletons to all data tables
- Add skeletons to charts
- Replace generic "Loading..." with skeletons

### 11.2 Empty States
- Review all pages for empty states
- Ensure meaningful messages and actions
- Add illustrations/icons where appropriate

### 11.3 Error Boundaries
- `components/ErrorBoundary.tsx`
- Wrap main app sections
- User-friendly error messages
- Report error to console

### 11.4 Transitions & Animations
- Add smooth transitions to modals (slide-in)
- Add hover effects to interactive elements
- Add loading spinners to buttons during mutations
- Ensure transitions use GPU acceleration (transform/opacity)

### 11.5 Dark Theme Polish
- Review all components for dark theme consistency
- Ensure proper contrast ratios
- Test glassmorphism effects

### 11.6 Responsive Design
- Review all pages on mobile (375px), tablet (768px), desktop (1024px+)
- Fix any layout issues
- Ensure tables are horizontally scrollable on mobile
- Ensure modals are full-screen on mobile

### 11.7 Performance Optimizations
- Add React.memo to expensive components
- Use dynamic imports for large pages: `const Page = dynamic(() => import('./Page'))`
- Optimize chart re-renders with useMemo
- Review React Query cache settings

**Deliverables:** 5 files, ~200 lines
**Dependencies:** None
**Testing:** Visual review, Lighthouse audit

---

## Phase 12: Accessibility

**Priority:** MEDIUM - Inclusive design

### 12.1 Keyboard Navigation
- Ensure all interactive elements are keyboard accessible
- Verify tab order is logical
- Add keyboard shortcuts (e.g., / for search)

### 12.2 ARIA Labels
- Add aria-labels to icon buttons
- Add aria-live regions for dynamic content
- Add role attributes where needed

### 12.3 Focus States
- Ensure visible focus indicators on all interactive elements
- Test with keyboard-only navigation

### 12.4 Accessible Forms
- Associate labels with inputs
- Add error message announcements
- Ensure error messages are descriptive

**Deliverables:** Modifications throughout codebase
**Dependencies:** None
**Testing:** axe DevTools, keyboard-only testing

---

## Phase 13: Testing Infrastructure

**Priority:** MEDIUM - Quality assurance

### 13.1 Setup Vitest
- `vitest.config.ts` - Vitest configuration
- `__tests__/setup.ts` - Test setup file

### 13.2 Unit Tests
- Business logic engine tests (Phase 2)
- Utility function tests
- Helper function tests

### 13.3 Test Coverage
- Aim for 80%+ coverage on business logic
- 60%+ coverage on utilities

**Deliverables:** 10+ test files, ~500 lines
**Dependencies:** Phase 2 (engines to test)
**Testing:** Run `npm run test`

---

## Phase 14: Documentation & Deployment Prep

**Priority:** HIGH - Production readiness

### 14.1 Environment Variables
- `.env.example` - Complete with all required vars
- `.env.local` - Template with descriptions
- Document in README

### 14.2 README.md
- Project overview with screenshot
- Features list (comprehensive)
- Tech stack breakdown
- Architecture overview
- Folder structure explanation
- Installation instructions
- Environment setup guide
- Running locally instructions
- Deployment to Vercel guide
- Demo user credentials
- Roadmap (future features)
- Contributing guidelines
- License

### 14.3 Deployment Configuration
- `vercel.json` - Vercel configuration
- Ensure build works: `npm run build`
- Ensure linting passes: `npm run lint`
- Ensure type checking passes: `tsc --noEmit`

### 14.4 Production Checklist
- Create `DEPLOYMENT_CHECKLIST.md`:
  - Environment variables set
  - Database seeded
  - Build successful
  - No TypeScript errors
  - No ESLint errors
  - Lighthouse score > 90
  - All features tested
  - Demo users working
  - Mobile responsive
  - Cross-browser tested

**Deliverables:** 4 documentation files, ~800 lines
**Dependencies:** All phases
**Testing:** Build and deploy to Vercel preview

---

## Phase 15: Final Polish & Feature Verification

**Priority:** HIGH - Quality check

### 15.1 Feature Verification
- Create comprehensive feature list
- Test each feature systematically
- Verify RBAC for each protected route
- Verify all CRUD operations work

### 15.2 Browser Testing
- Test on Chrome, Firefox, Safari, Edge
- Test on mobile browsers

### 15.3 Performance Audit
- Run Lighthouse audit
- Fix any critical issues
- Aim for 90+ performance score

### 15.4 Security Review
- Verify all routes are protected
- Check for exposed secrets
- Verify input validation on all forms
- Check for XSS vulnerabilities

### 15.5 Final Code Review
- Remove console.logs
- Remove commented code
- Ensure consistent formatting
- Ensure consistent naming

**Deliverables:** FINAL_FEATURE_LIST.md, TEST_RESULTS.md
**Dependencies:** All phases
**Testing:** Complete system test

---

## Deliverables Summary

**New Files:** ~80 files
**Modified Files:** ~15 files
**Lines of Code:** ~5000+ lines
**Test Coverage:** 70%+ on business logic

**File Breakdown by Category:**
- Authentication: 15 files
- Business Logic: 6 files
- API Routes: 10 files
- Pages: 5 files (new/enhanced)
- Components: 25 files
- Hooks: 5 files
- Utils: 8 files
- Tests: 10 files
- Documentation: 6 files

---

## Dependencies & Critical Path

```
Phase 1 (Auth) → Phase 3 (APIs) → Phase 4 (Approvals)
Phase 2 (Engines) → Phase 3 (APIs)
All other phases can proceed in parallel after Phase 1
```

**Critical Path:** Phase 1 → Phase 2 → Phase 3 → Phase 4
**Estimated Time:** Full implementation across all phases

---

## Implementation Approach

**Strategy:** Systematic, phase-by-phase implementation
**Code Style:** Match existing patterns, extend not replace
**Testing:** Test after each phase before moving forward
**Quality:** Production-ready, enterprise-grade code

---

## Risk Mitigation

1. **Authentication Complexity:** Use established Auth.js patterns, test thoroughly
2. **Business Logic Accuracy:** Comprehensive unit tests, edge case handling
3. **API Integration:** Validate with Zod, handle errors gracefully
4. **Performance:** Profile and optimize, use memoization
5. **Security:** Follow OWASP guidelines, validate all inputs

---

## Success Criteria

✅ All MVP features implemented
✅ Authentication with 5 roles working
✅ RBAC protecting all routes
✅ All CRUD operations functional
✅ Business logic engines tested
✅ Approval workflow complete
✅ UI polished and responsive
✅ Documentation complete
✅ Deployable to Vercel
✅ Zero TypeScript errors
✅ Zero ESLint errors
✅ Lighthouse score > 90

---

This plan systematically builds all remaining MVP features while maintaining production quality and following clean architecture principles.
