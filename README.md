# Enterprise KPI Dashboard & Management Portal

An enterprise-grade, real-time KPI tracking, team scorecard, and performance analytics dashboard. Built with Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, and powered by Airtable as the primary relational database.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Key Features](#key-features)
3. [Technology Stack](#technology-stack)
4. [Application Architecture](#application-architecture)
5. [Folder Structure](#folder-structure)
6. [Airtable Data Model & Setup Guide](#airtable-data-model--setup-guide)
7. [Environment Variables](#environment-variables)
8. [Installation & Local Development](#installation--local-development)
9. [Build & Deployment Configuration](#build--deployment-configuration)
10. [Developer Guide & Conventions](#developer-guide--conventions)
11. [Production Configuration & Security](#production-configuration--security)
12. [Error Documentation & Troubleshooting](#error-documentation--troubleshooting)
13. [FAQ & Known Limitations](#faq--known-limitations)
14. [Contribution Guide & License](#contribution-guide--license)

---

## 1. Project Overview
This portal provides executives, department managers, and employees with a unified interface to align goals, evaluate performance metrics, assign tasks, track achievements, and approve scorecard adjustments. It supports strict relational integrity validations and background synchronization with Airtable.

---

## 2. Key Features
- **Executive Overviews & Analytics**: Performance trend charts, leaderboards, and rankings.
- **KPI Lifecycle Management**: KPI target calculations, history audits, and approval workflows.
- **Unified Global Filters**: Persistent navigation-wide query filters.
- **Global Search System**: Debounced, categorized search with arrow key navigation and highlights.
- **Enterprise Settings**: Brand management, role matrices, security timeouts, and database import schemes.
- **Diagnostics Validation Center**: Real-time scanners identifying duplicates, missing values, or broken relations.
- **Live Background Syncing**: Auto-polls Airtable every 30 seconds with flash notifications.

---

## 3. Technology Stack
- **Framework**: Next.js 16.2 (App Router)
- **Library**: React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3 & PostCSS 8
- **Database**: Airtable API Client
- **State & Fetching**: TanStack Query v5 (React Query)
- **Charts**: Recharts
- **Forms**: React Hook Form & Zod
- **Testing**: Vitest

---

## 4. Application Architecture
```mermaid
graph TD
    UI[Next.js Client Components] --> State[React Context & Global Filters]
    State --> Query[React Query Cache]
    Query --> APIs[Next.js App Route Handlers]
    APIs --> Airtable[Airtable API / Primary Database]
    Sync[Airtable Actions sync runner] --> Airtable
```

---

## 5. Folder Structure
```
├── adapters/           # Model data adapters
├── airtable-imports/   # Database initialization and sync utilities
├── app/
│   ├── api/            # Route API endpoints (GET/POST/PUT/DELETE)
│   ├── settings/       # Settings and diagnostics pages
│   └── layout.tsx      # Root HTML layout with context providers
├── components/
│   ├── layout/         # Header, Sidebar, GlobalSearch, notifications
│   └── ui/             # Reusable UI elements (Button, Card, Inputs)
├── constants/          # Static layout configs (Sidebar menus)
├── hooks/              # Custom React Query hooks (useData, useFilters)
├── layouts/            # Dashboard layout wrappers
├── providers/          # QueryClient & Filter contexts
├── services/           # Airtable Client service wrapper
├── styles/             # Global stylesheets
├── types/              # TypeScript interface models
└── utils/              # General helpers (escaping, string checks)
```

---

## 6. Airtable Data Model & Setup Guide

### Base Setup
1. Create a new Airtable Base.
2. Generate an **API Personal Access Token** with scopes: `data.records:read`, `data.records:write`, `schema.bases:read`.
3. Obtain your **Base ID** from the Airtable API URL or dashboard.

### Required Tables Schema

#### 1. `Settings`
- **Setting Name**: Single Line Text (Primary Key)
- **Setting Value**: Long Text (JSON serializations)
- **Category**: Single Line Text
- **Description**: Long Text

#### 2. `Departments`
- **ID**: Single Line Text (Primary Key)
- **Department Name**: Single Line Text
- **Manager**: Single Line Text
- **Description**: Long Text

#### 3. `Teams`
- **ID**: Single Line Text (Primary Key)
- **Team Name**: Single Line Text
- **Team Manager**: Single Line Text
- **Status**: Single Select (`active`, `archived`)

#### 4. `Employees`
- **ID**: Single Line Text (Primary Key)
- **Name**: Single Line Text
- **Email**: Single Line Text
- **Department**: Single Line Text
- **Team**: Single Line Text
- **Position**: Single Line Text

#### 5. `KPIs`
- **ID**: Single Line Text (Primary Key)
- **KPI Name**: Single Line Text
- **Target Value**: Number
- **Actual Value**: Number
- **Status**: Single Select (`not-started`, `in-progress`, `at-risk`, `completed`, `overdue`)
- **Category**: Single Line Text

#### 6. `Tasks`
- **ID**: Single Line Text (Primary Key)
- **Task Name**: Single Line Text
- **Status**: Single Select (`todo`, `in-progress`, `completed`, `blocked`)
- **Assigned To**: Single Line Text
- **Due Date**: Date

---

## 7. Environment Variables
Create a `.env.local` file in the root directory:
```env
AIRTABLE_API_KEY=pat_your_personal_access_token_here
AIRTABLE_BASE_ID=appYourBaseIdHere
NEXT_PUBLIC_APP_URL=http://localhost:3000

# To use Google Sheets as data source:
DATA_SOURCE=google-sheets
GOOGLE_SHEET_ID=your_google_sheet_id_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC..."
```

### Google Sheets Setup
To point the application at a different Google Sheet in the future:
1. **Share the Sheet:** Open your target Google Sheet and share it with your Google Service Account email (e.g., `your-service-account@...iam.gserviceaccount.com`) as a **Viewer** or **Editor**.
2. **Obtain Sheet ID:** Copy the Sheet ID from the URL of your browser (the alphanumeric string between `/d/` and `/edit` in the address bar).
3. **Update `.env.local`:** Update `GOOGLE_SHEET_ID` with the new ID.
4. **Ensure Tabs Exist:** The new sheet must contain tabs named exactly: `KPIs`, `Employees`, `Departments`, `Tasks`, and `Achievements` with headers in the first row matching the normalized field names.

---


## 8. Installation & Local Development
```bash
# Clone the repository and install dependencies
npm install

# Start development server
npm run dev

# Run unit tests
npm run test
```

---

## 9. Build & Deployment Configuration
To compile the production package:
```bash
npm run build
```

### Vercel Deployment
1. Connect your repository to Vercel.
2. In Project Settings, add the Environment Variables:
   - `AIRTABLE_API_KEY`
   - `AIRTABLE_BASE_ID`
3. Set the build command to `next build` and output directory to `.next`.

---

## 10. Developer Guide & Conventions
- **Client Components**: All UI views that use hooks or local state must begin with `"use client"`.
- **Naming Conventions**: Use PascalCase for component files (e.g. `GlobalSearch.tsx`) and camelCase for utilities/hooks.
- **Shared States**: Global Filter state is managed in `providers/GlobalFilterProvider.tsx` and consumed via the `useGlobalFilters` hook.

---

## 11. Production Configuration & Security
- **CSV Injection Protection**: Prepends a single quote `'` to any exported cell starting with `=`, `+`, `-`, or `@`.
- **API Rate Limiting**: Enabled via configuration limits in API routes.
- **Sensitive Data Visibility**: Evaluated on the backend; fields containing salary information or authentication metrics are omitted for employee/visitor scopes.

---

## 12. Error Documentation & Troubleshooting

| Error | Cause | Solution |
|---|---|---|
| **Airtable Connection Failure** | Invalid API Key or Base ID | Check scopes and verify variables in `.env.local`. |
| **Duplicate Records** | Duplicate emails or names in database | Use settings Diagnostics scan to identify and merge records. |
| **Sync Failure** | Network latency or Airtable rate limits | Click "Retry Sync" in Settings System Health to re-establish sync queues. |
| **Missing required fields** | Empty properties in forms | Forms validate fields before API dispatch using Zod schemas. |

---

## 13. FAQ & Known Limitations
- **Background Polling Rate**: Set to 30 seconds. Higher frequencies may hit Airtable's 5 requests/sec API rate limits.
- **Database Limits**: Max 500 records per sync payload.

---

## 14. Contribution Guide & License
For code contributions:
1. Create a feature branch.
2. Ensure `npm run build` and `npm run test` succeed locally.
3. Submit a pull request.

**License**: Proprietary / Enterprise KPI Portal.
