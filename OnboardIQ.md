# OnboardIQ
## Cloud-Native Employee Onboarding Portal

> **Product Requirement Document · Technical Specification · Design Document**

| Field | Value |
|---|---|
| **Document Type** | PRD + Technical Specification + Design Document |
| **Product** | OnboardIQ |
| **Version** | 1.0 |
| **Date** | April 2026 |
| **Classification** | Internal — Academic Project |
| **Review Cycle** | Review I → Review II → Review III |

---

# PART I — PRODUCT REQUIREMENT DOCUMENT

---

## 1. Executive Summary

OnboardIQ is a cloud-native employee onboarding portal built on Microsoft Azure. It digitizes and automates the full onboarding lifecycle — from new hire self-registration and document submission, through AI-powered document validation, to HR review, approval, and automated IT provisioning. The platform replaces manual, paper-based processes with a structured, role-aware, event-driven system that provides full audit visibility and zero-touch provisioning on HR approval.

---

## 2. Problem Statement

Traditional employee onboarding is fragmented, manual, and error-prone. HR teams spend significant time chasing documents, verifying submissions, and coordinating IT access setup. New hires experience delays and confusion due to inconsistent communication. There is no centralized tracking of onboarding status, no automated validation of submitted documents, and no audit trail for compliance purposes.

**OnboardIQ solves this by:**

- Giving new hires a self-service portal to register and upload all required documents
- Using Azure OpenAI to automatically validate and summarize each document
- Providing HR teams a structured dashboard to review, approve, or reject onboarding cases
- Triggering zero-touch IT provisioning automatically upon final HR approval
- Logging every action with timestamps for compliance and audit

---

## 3. Goals & Success Metrics

### 3.1 Product Goals

- Reduce average onboarding cycle time from 5–7 days to under 24 hours
- Eliminate manual document verification for at least 80% of standard submissions
- Achieve 100% audit traceability for all HR actions
- Enable zero-touch IT provisioning upon HR approval

### 3.2 Success Metrics

| Metric | Target |
|---|---|
| Document validation accuracy | >= 90% (AI vs manual) |
| Onboarding case resolution time | < 24 hours end-to-end |
| HR re-upload request rate | < 10% of submissions |
| Provisioning success rate | > 99% on approved cases |
| System uptime | 99.9% (Azure SLA backed) |

---

## 4. Scope

### 4.1 In Scope

- New hire self-registration portal with Auth0-based authentication and MFA
- Secure document upload to Azure Blob Storage with metadata tracking in Azure SQL
- Azure OpenAI (GPT-4o) document validation and summarization via Azure Functions
- HR reviewer dashboard with approve / reject / re-upload workflow
- HR admin dashboard with full case management and analytics
- IT admin dashboard for provisioning oversight
- Auto-provisioning pipeline triggered by HR final approval
- CI/CD pipeline with GitHub Actions, Docker, AKS deployment
- Infrastructure as Code via Terraform
- Security scanning: CodeQL (SAST) + OWASP ZAP (DAST)
- Observability: Azure Application Insights + Power BI Embedded analytics

### 4.2 Out of Scope

- Integration with live HRIS systems (e.g., SAP SuccessFactors, Workday)
- Payroll processing or benefits enrollment
- Mobile native applications (iOS / Android)
- Multi-tenant / multi-organization support

---

## 5. User Roles & Personas

| Role | Capabilities | Restrictions |
|---|---|---|
| **NEW_HIRE** | Register, upload documents, view upload status and notifications | Cannot access HR or IT dashboards |
| **HR_REVIEWER** | View pending cases, AI summaries, approve or reject individual documents, request re-uploads | Cannot provision accounts or access admin analytics |
| **HR_ADMIN** | Full case management, bulk approval, view Power BI analytics, manage HR team access | Cannot modify provisioning pipeline config |
| **IT_ADMIN** | View provisioning queue, confirm hardware/access assignments, view IT provisioning logs | Cannot approve/reject HR onboarding cases |

---

## 6. Feature Requirements

### 6.1 New Hire Registration & Identity *(Review I)*

New hires self-register via a public-facing portal. They provide name, email, employee ID, department, joining date, reporting manager, and create a password. Auth0 handles all authentication — supporting email/password login with MFA (TOTP or SMS). Social login via Google or Microsoft is optionally supported. Upon registration, a unique onboarding case ID is generated and the case status is set to `Pending Documents`.

| Field | Detail |
|---|---|
| **INPUT FIELDS** | Name, email, department, role, joining date, manager |
| **AUTH PROVIDER** | Auth0 (replaces Azure AD B2C / Entra CIAM) |
| **MFA** | TOTP (authenticator app) or SMS OTP |
| **ROLES CREATED** | new_hire, hr_reviewer, hr_admin, it_admin |
| **OUTPUT** | Onboarding case created, status = Pending Documents |
| **REVIEW TARGET** | Review I — Auth spec |

### 6.2 Document Upload & Storage *(Review I)*

After registration, the new hire sees a checklist of required documents: Government ID, Offer Letter, Education Certificates, Bank Details Form, and any role-specific NDAs. Each document slot has a defined accepted format (PDF/JPG), max file size (10MB), and a label. Files upload directly to Azure Blob Storage (Hot tier, GRS) via a SAS token — the backend never handles the binary. Each upload creates a metadata entry in Azure SQL (file name, size, blob path, upload timestamp, status).

| Field | Detail |
|---|---|
| **REQUIRED DOCS** | Gov ID, Offer Letter, Certificates, Bank Form, NDA |
| **STORAGE** | Azure Blob Storage (Hot tier, GRS) — SAS token upload |
| **METADATA DB** | Azure SQL — file path, status, timestamps |
| **VALIDATIONS** | File type, max size, mandatory doc checklist |
| **REVIEW TARGET** | Review I — Storage spec |

### 6.3 GenAI Document Validation & Summarization *(Review III)*

When all documents are uploaded, an Azure Function triggers and sends each document to Azure OpenAI GPT-4o (vision-capable). The AI performs two tasks per document: (1) **Validation** — checks if the document matches the expected type, flags missing fields, illegible scans, or name mismatches; (2) **Summarization** — produces a 3–5 line plain-English summary of key data (name, ID number, expiry, issuing authority). Both outputs are stored in Azure SQL and surfaced on the HR review card.

| Field | Detail |
|---|---|
| **AI TASKS** | Validate doc type + extract & summarize key fields |
| **MODEL** | Azure OpenAI GPT-4o (vision-capable) |
| **TRIGGER** | Azure Function on Blob upload event |
| **OUTPUT** | Validation status + summary stored in SQL |
| **REVIEW TARGET** | Review III — GenAI demo |

### 6.4 HR Review & Approval Workflow *(Review I / II)*

HR reviewers see a dashboard of all pending onboarding cases. Each case shows the hire's profile, AI-generated document summary cards, and a validation status badge (Valid / Needs Review / Flagged). Reviewers can approve or reject each document individually or approve the entire case at once. Rejected documents trigger an automatic email to the hire prompting re-upload. When all documents are approved, the case moves to `Approved — Pending Provisioning`. A full audit log records every action with reviewer ID and timestamp.

| Field | Detail |
|---|---|
| **HR VIEWS** | Case list, case detail, document viewer with AI summary |
| **ACTIONS** | Approve, reject with reason, request re-upload |
| **NOTIFICATIONS** | Email to hire on rejection/approval via Azure Communication Services |
| **AUDIT LOG** | Every action logged in SQL with reviewer ID + timestamp |
| **REVIEW TARGET** | Review I — Workflow spec; Review II — Full demo |

### 6.5 Auto-Provisioning on Approval *(Review II)*

Once a case is fully approved, an Azure Function provisioning pipeline executes automatically. It creates the user's Auth0 account, assigns the correct RBAC role based on department and job level, sends a welcome email with credentials and first-day instructions, and writes a `Provisioned` status to the SQL record. For demo purposes, the pipeline can also mock-provision access to internal tools (Slack workspace invite, Jira project membership) via simple API calls.

| Field | Detail |
|---|---|
| **STEPS** | Create Auth0 account → assign RBAC role → send welcome email |
| **TRIGGER** | HR final approval event via Azure Function |
| **MOCK INTEGRATIONS** | Slack, Jira, GitHub (demo-only API calls) |
| **STATUS UPDATE** | SQL record → Provisioned, timestamp logged |
| **REVIEW TARGET** | Review II — Event-driven demo |

### 6.6 CI/CD Pipeline & Infrastructure as Code *(Review II / III)*

The entire Azure infrastructure is defined in Terraform and stored in GitHub. A GitHub Actions pipeline runs on every push to `main`: Build stage compiles and tests the app; Security stage runs CodeQL static analysis and OWASP ZAP baseline scan; Deploy stage runs Terraform apply and pushes the Docker image to Azure Container Registry, then rolls out to AKS via kubectl. Blue-green deployment via App Service slots ensures zero-downtime updates.

| Field | Detail |
|---|---|
| **IAC** | Terraform for all Azure resources, stored in GitHub |
| **PIPELINE STAGES** | Build → Security Scan → Docker Build → Deploy to AKS |
| **CONTAINER** | Dockerfile + ACR + AKS with HPA scaling rules |
| **SECURITY** | CodeQL (SAST) + OWASP ZAP (DAST) in pipeline |
| **REVIEW TARGET** | Review II — DevOps demo; Review III — Security scan |

### 6.7 Monitoring & Observability *(Review III)*

Azure Application Insights is instrumented into the app to capture request rates, response times, failed requests, and dependency calls. A Power BI Embedded dashboard (accessible to HR admins) shows operational metrics: total cases this month, average time-to-approval, document rejection rates by type, and provisioning success rate. Three alert rules are configured: CPU > 70% triggers App Service scale-out, error rate > 5% fires a critical alert to the admin email, and any failed provisioning triggers an immediate incident notification.

| Field | Detail |
|---|---|
| **APM** | App Insights — requests, errors, latency, dependencies |
| **BUSINESS METRICS** | Power BI Embedded — cases, approval time, rejection rate |
| **ALERT RULES** | CPU > 70%, error rate > 5%, provisioning failures |
| **COST TRACKING** | Azure Cost Management with ₹8,000/month budget alert |
| **REVIEW TARGET** | Review III — Observability demo |

---

## 7. Review Milestone Mapping

| Review | Deliverables | Azure Services |
|---|---|---|
| **Review I** | New hire registration, Auth0 SSO + MFA, document upload, HR approve/reject workflow, Azure SQL schema, Blob Storage integration, RBAC middleware | Auth0, Azure App Service, Azure Blob Storage, Azure SQL, Azure Communication Services |
| **Review II** | GenAI document validation (Azure OpenAI), auto-provisioning pipeline, CI/CD with GitHub Actions, Dockerfile + ACR + AKS deployment, Terraform IaC, event-driven Azure Functions | Azure OpenAI, Azure Functions, GitHub Actions, AKS, ACR, Terraform |
| **Review III** | CodeQL SAST + OWASP ZAP DAST in pipeline, Application Insights instrumentation, Power BI Embedded dashboard, full end-to-end demo, cost management alerts, final security scan report | App Insights, Power BI Embedded, Azure Monitor, Azure Cost Management, CodeQL, OWASP ZAP |

---

## 8. Non-Functional Requirements

| Category | Requirement | Target |
|---|---|---|
| Performance | API response time (p95) | < 500ms under normal load |
| Performance | Document upload (10MB) | < 5 seconds |
| Availability | System uptime | 99.9% (Azure SLA) |
| Scalability | Concurrent onboarding cases | Supports 100+ simultaneous sessions |
| Security | Auth token expiry | JWT: 1hr access / 7d refresh |
| Security | Data at rest | AES-256 encryption (Azure default) |
| Security | Data in transit | TLS 1.2+ enforced |
| Compliance | Audit log retention | 90 days minimum |
| Compliance | Document storage | Azure Blob GRS (geo-redundant) |
| Cost | Monthly Azure spend | < ₹8,000/month (student tier) |

---

# PART II — TECHNICAL SPECIFICATION

---

## 9. System Architecture Overview

OnboardIQ is a three-tier, cloud-native application deployed on Microsoft Azure. The frontend is a React SPA served from Azure App Service. The backend is a Node.js/Express REST API, containerized in Docker and deployed to Azure Kubernetes Service (AKS). Authentication is delegated entirely to Auth0. Persistent data is stored in Azure SQL Database. Binary documents are stored in Azure Blob Storage. Asynchronous event processing is handled by Azure Functions. AI capabilities are provided by Azure OpenAI (GPT-4o).

| Layer | Technology |
|---|---|
| **Frontend** | React 18 (Vite), Tailwind CSS, Axios, Auth0 React SDK |
| **Backend** | Node.js 20 + Express, JWT middleware, Multer (metadata only) |
| **Authentication** | Auth0 (replaces Azure AD B2C / Entra CIAM) |
| **Database** | Azure SQL Database (Standard S2 tier) |
| **File Storage** | Azure Blob Storage (Hot tier, GRS, SAS token upload) |
| **Event Processing** | Azure Functions (v4, Node.js runtime) |
| **AI / GenAI** | Azure OpenAI Service — GPT-4o (vision) |
| **Container Registry** | Azure Container Registry (ACR) |
| **Orchestration** | Azure Kubernetes Service (AKS) with HPA |
| **IaC** | Terraform (azurerm provider, stored in GitHub) |
| **CI/CD** | GitHub Actions |
| **Monitoring** | Azure Application Insights + Power BI Embedded |
| **Security Scanning** | CodeQL (SAST) + OWASP ZAP (DAST) |

---

## 10. Authentication & Authorization

### 10.1 Auth Provider: Auth0

Auth0 replaces the previously planned Azure AD B2C / Microsoft Entra CIAM. Auth0 is significantly easier to configure for a React + Node.js stack, offers a generous free tier (7,000 MAU), and provides built-in role management via the Auth0 Management API. It is the recommended choice for this project given time constraints and the academic context.

### 10.2 Auth Flow

1. New hire visits the portal and clicks **Login**
2. Auth0 Universal Login redirects the user to the Auth0-hosted login page
3. User authenticates with email/password + MFA (TOTP or SMS OTP)
4. Auth0 issues an ID token (JWT) and an access token on successful authentication
5. Frontend stores tokens **in memory only** (not localStorage) and sends the access token as a `Bearer` header on all API calls
6. Backend Express middleware verifies the JWT signature against Auth0's JWKS endpoint
7. Backend reads the user's `app_metadata.role` claim (set via Auth0 Management API on registration) and attaches it to the request context
8. RBAC middleware checks the role against the required permission for each route
9. Frontend reads the role from the decoded token and routes to the correct dashboard (`NEW_HIRE`, `HR_REVIEWER`, `HR_ADMIN`, `IT_ADMIN`)

### 10.3 Token Configuration

| Parameter | Value |
|---|---|
| **Access token expiry** | 1 hour |
| **Refresh token** | Enabled, 7-day rolling expiry |
| **Token storage** | In-memory (React state) — never localStorage |
| **JWKS endpoint** | `https://{tenant}.auth0.com/.well-known/jwks.json` |
| **Audience** | `https://onboardiq-api` (custom API identifier) |
| **Roles claim** | `app_metadata.role` (set on user creation) |

### 10.4 Role Seeding

On new hire self-registration, the backend calls the Auth0 Management API to set `app_metadata.role = 'NEW_HIRE'` for the created user. HR, IT, and Admin users are pre-seeded in Auth0 with appropriate roles. No role escalation is possible through the self-registration flow.

---

## 11. Database Schema

### 11.1 `users`

| Column | Type / Notes |
|---|---|
| `user_id` | INT IDENTITY PRIMARY KEY |
| `auth0_sub` | VARCHAR(128) UNIQUE — Auth0 subject identifier |
| `email` | VARCHAR(255) UNIQUE NOT NULL |
| `full_name` | VARCHAR(255) NOT NULL |
| `department` | VARCHAR(100) |
| `role` | ENUM: new_hire, hr_reviewer, hr_admin, it_admin |
| `joining_date` | DATE |
| `manager_id` | INT FK → users.user_id |
| `created_at` | DATETIME2 DEFAULT GETUTCDATE() |

### 11.2 `onboarding_cases`

| Column | Type / Notes |
|---|---|
| `case_id` | INT IDENTITY PRIMARY KEY |
| `user_id` | INT FK → users.user_id |
| `case_status` | ENUM: pending_docs, under_review, approved, rejected, provisioned |
| `assigned_reviewer_id` | INT FK → users.user_id (nullable) |
| `created_at` | DATETIME2 DEFAULT GETUTCDATE() |
| `updated_at` | DATETIME2 |
| `provisioned_at` | DATETIME2 (nullable) |

### 11.3 `documents`

| Column | Type / Notes |
|---|---|
| `doc_id` | INT IDENTITY PRIMARY KEY |
| `case_id` | INT FK → onboarding_cases.case_id |
| `doc_type` | ENUM: gov_id, offer_letter, certificate, bank_form, nda |
| `blob_path` | VARCHAR(512) — Azure Blob URL |
| `file_name` | VARCHAR(255) |
| `file_size_kb` | INT |
| `upload_status` | ENUM: pending, uploaded, validated, rejected |
| `ai_validation_status` | ENUM: valid, flagged, missing_fields, illegible |
| `ai_summary` | NVARCHAR(MAX) — JSON blob of AI output |
| `uploaded_at` | DATETIME2 |
| `validated_at` | DATETIME2 (nullable) |

### 11.4 `audit_log`

| Column | Type / Notes |
|---|---|
| `log_id` | INT IDENTITY PRIMARY KEY |
| `case_id` | INT FK → onboarding_cases.case_id |
| `actor_id` | INT FK → users.user_id |
| `action` | VARCHAR(100) — e.g. DOC_APPROVED, CASE_REJECTED, PROVISIONED |
| `notes` | NVARCHAR(MAX) — reason or detail |
| `created_at` | DATETIME2 DEFAULT GETUTCDATE() |

---

## 12. API Reference

### 12.1 Auth Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new hire, create Auth0 user, set role in app_metadata | Public |
| `POST` | `/api/auth/callback` | Exchange Auth0 code for local session context | Public |
| `POST` | `/api/auth/logout` | Invalidate refresh token, call Auth0 /v2/logout | Bearer JWT |

### 12.2 Documents Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/docs/sas-token` | Generate a SAS token for direct Blob upload | Bearer JWT (new_hire) |
| `POST` | `/api/docs/metadata` | Save document metadata to SQL after upload | Bearer JWT (new_hire) |
| `GET` | `/api/docs/:caseId` | List all documents for a case | Bearer JWT (hr_reviewer+) |
| `PATCH` | `/api/docs/:docId/status` | Update document status (approve/reject) | Bearer JWT (hr_reviewer+) |

### 12.3 Cases Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/cases` | List onboarding cases (filtered by role) | Bearer JWT (hr_reviewer+) |
| `GET` | `/api/cases/:caseId` | Get full case detail with documents | Bearer JWT (hr_reviewer+) |
| `PATCH` | `/api/cases/:caseId/approve` | Mark case as approved, trigger provisioning Function | Bearer JWT (hr_reviewer+) |
| `PATCH` | `/api/cases/:caseId/reject` | Reject case with reason, trigger notification email | Bearer JWT (hr_reviewer+) |

### 12.4 Provisioning Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/provision/queue` | List cases pending IT provisioning | Bearer JWT (it_admin) |
| `POST` | `/api/provision/:caseId` | Manually trigger or confirm provisioning for a case | Bearer JWT (it_admin) |
| `GET` | `/api/provision/logs` | Get provisioning event log | Bearer JWT (it_admin, hr_admin) |

---

## 13. Azure Functions Specification

### 13.1 DocumentValidationFunction

| Property | Value |
|---|---|
| **Trigger** | Azure Blob Storage trigger — fires on new blob in `documents` container |
| **Runtime** | Node.js v20 (Azure Functions v4) |
| **Inputs** | Blob binary + metadata (doc_type, case_id, doc_id) from SQL |
| **Process** | 1. Fetch blob as base64. 2. Call Azure OpenAI GPT-4o with vision prompt. 3. Parse JSON response for validation_status and summary. 4. Write results to documents table. |
| **Outputs** | `UPDATE documents SET ai_validation_status, ai_summary, validated_at` |
| **Error handling** | On failure: set ai_validation_status = 'error', log to App Insights, alert HR admin |

### 13.2 ProvisioningFunction

| Property | Value |
|---|---|
| **Trigger** | HTTP trigger — called by backend on case approval |
| **Runtime** | Node.js v20 (Azure Functions v4) |
| **Inputs** | case_id, user_id, role, department from request body |
| **Process** | 1. Call Auth0 Management API to create/update user account. 2. Assign RBAC role. 3. Send welcome email via Azure Communication Services. 4. Mock-call Slack/Jira/GitHub APIs. 5. Update case status to Provisioned. |
| **Outputs** | `UPDATE onboarding_cases SET case_status = provisioned, provisioned_at = NOW()` |
| **Error handling** | Retry 3x with exponential backoff. On persistent failure: alert IT admin immediately. |

---

## 14. CI/CD Pipeline

### 14.1 GitHub Actions Workflow

| Stage | Steps |
|---|---|
| **Build** | Checkout → npm install → npm test → npm run build |
| **Security Scan** | CodeQL analysis (JavaScript/TypeScript) → OWASP ZAP baseline scan against staging URL |
| **Docker Build** | docker build → tag with git SHA → push to Azure Container Registry (ACR) |
| **Deploy** | terraform init → terraform plan → terraform apply (main branch only) → kubectl set image (AKS rolling update) |
| **Notify** | Send Slack/email notification on pipeline success or failure |

### 14.2 Terraform Resources

- `azurerm_resource_group` — onboardiq-rg
- `azurerm_app_service_plan` + `azurerm_app_service` — frontend hosting
- `azurerm_sql_server` + `azurerm_sql_database` — Azure SQL (Standard S2)
- `azurerm_storage_account` + `azurerm_storage_container` — Blob Storage (GRS)
- `azurerm_function_app` (×2) — DocumentValidation + Provisioning
- `azurerm_cognitive_account` — Azure OpenAI endpoint
- `azurerm_kubernetes_cluster` — AKS cluster (Standard_DS2_v2 nodes)
- `azurerm_container_registry` — ACR for Docker images
- `azurerm_application_insights` — APM instrumentation
- `azurerm_monitor_action_group` + `azurerm_monitor_metric_alert` — alert rules

---

## 15. Security Specification

### 15.1 Authentication Security

- Auth0 enforces MFA on all accounts — TOTP (Google Authenticator) or SMS OTP
- Access tokens stored in memory only — no localStorage, no cookies with sensitive data
- HTTPS enforced on all endpoints — TLS 1.2 minimum
- JWKS public key rotation handled automatically by Auth0

### 15.2 Data Security

- Azure Blob Storage: data encrypted at rest with AES-256 (Azure-managed keys)
- Azure SQL: Transparent Data Encryption (TDE) enabled
- SAS tokens for Blob upload: scoped to single container, expire in 15 minutes
- No document binaries pass through the Node.js backend — all uploads are direct client-to-Blob

### 15.3 Static Analysis (CodeQL)

- Runs on every push and pull request to `main` branch
- Scans JavaScript/TypeScript for: SQL injection, XSS, insecure randomness, path traversal, prototype pollution
- Pipeline fails and blocks merge if CodeQL finds any Critical or High severity findings

### 15.4 DAST Scanning (OWASP ZAP)

- ZAP baseline scan runs against the staging environment URL after each deployment
- Scans for OWASP Top 10 vulnerabilities including injection, broken auth, security misconfig
- ZAP report published as a GitHub Actions artifact on every run
- Pipeline sends alert email to admin if any High severity findings are detected

---

## 16. Monitoring & Observability

### 16.1 Application Insights Metrics

| Metric | Description |
|---|---|
| **Request rate** | HTTP requests per minute across all backend endpoints |
| **Response time (p95)** | 95th percentile response time — target < 500ms |
| **Failure rate** | Percentage of requests returning 4xx/5xx — alert if > 5% |
| **Dependency calls** | Latency and failure rate for SQL, Blob, Auth0, OpenAI calls |
| **Custom events** | DOC_UPLOADED, DOC_VALIDATED, CASE_APPROVED, PROVISIONING_SUCCESS |

### 16.2 Alert Rules

| Alert | Condition | Action |
|---|---|---|
| **High CPU** | CPU > 70% for 5 minutes | Trigger AKS HPA scale-out |
| **High Error Rate** | Error rate > 5% for 2 minutes | Send critical email to hr_admin |
| **Provisioning Failure** | ProvisioningFunction throws exception | Immediate incident notification to it_admin |
| **Cost Threshold** | Monthly spend > ₹8,000 | Email alert to project owner |

---

## 17. Deployment Architecture

| Environment | Description |
|---|---|
| **Development** | Local Docker Compose — React dev server, Node.js, local SQL (Docker), Auth0 dev tenant |
| **Staging** | AKS (1 node), Auth0 staging tenant, separate Azure SQL and Blob containers — used for OWASP ZAP scans |
| **Production** | AKS (2+ nodes with HPA), Azure SQL Standard S2, Blob GRS, App Insights, Power BI Embedded — blue-green via App Service slots |

---

## 18. Open Items & Risks

| Item | Status / Mitigation |
|---|---|
| Auth0 free tier limits (7,000 MAU) | Sufficient for academic project — no action needed |
| Azure OpenAI access approval | Submit access request early — fallback: use OpenAI API directly with same GPT-4o model |
| Power BI Embedded licensing | Requires Power BI Pro or Premium — use A1 SKU (pay-per-hour) to minimize cost |
| AKS student credit burn rate | Monitor via Azure Cost Management — scale down to 1 node outside of demo windows |
| OWASP ZAP false positives | Tune baseline scan with context file to suppress known false positives before Review III |

---

# PART III — DESIGN DOCUMENT

---

## 19. Design Philosophy

OnboardIQ follows three core design principles:

1. **Role-aware clarity** — Every screen shows only what is relevant to the current user's role. New hires never see HR tooling. HR admins never see raw IT provisioning config. The UI reflects the mental model of each persona.
2. **Progressive disclosure** — Complex information (AI summaries, audit logs, validation details) is hidden until the user needs it. Default views are clean and action-oriented.
3. **Status as the primary language** — Every entity (case, document, provisioning job) always has a visible, color-coded status. Users should never have to read text to understand what state something is in.

---

## 20. Design System

### 20.1 Color Palette

| Token | Hex | Usage |
|---|---|---|
| `--brand-dark` | `#1B3A5C` | Primary headings, nav background, key CTAs |
| `--brand-mid` | `#2E6DA4` | Section headers, links, secondary CTAs |
| `--brand-light` | `#D6E8F7` | Table headers, info boxes, hover states |
| `--accent` | `#E8A020` | Warnings, highlights, badge outlines |
| `--success` | `#2E7D32` | Approved status, success toasts |
| `--warning` | `#F57C00` | Needs review status, pending badges |
| `--danger` | `#C62828` | Rejected status, error alerts |
| `--surface` | `#F4F6F9` | Page background, card fills |
| `--text-dark` | `#1A1A2E` | Body copy |
| `--text-mid` | `#4A4A6A` | Labels, captions, secondary text |

### 20.2 Typography

| Role | Font | Size | Weight |
|---|---|---|---|
| Display / Product name | Inter | 32px | 700 |
| Page heading (H1) | Inter | 24px | 700 |
| Section heading (H2) | Inter | 18px | 600 |
| Card title (H3) | Inter | 15px | 600 |
| Body | Inter | 14px | 400 |
| Caption / Label | Inter | 12px | 400 |
| Code / Monospace | JetBrains Mono | 13px | 400 |

### 20.3 Spacing & Grid

- Base unit: **8px**
- Page max-width: **1280px**
- Side navigation width: **240px** (collapsed: 64px)
- Content grid: **12-column** with 24px gutters
- Card padding: **24px**
- Section vertical gap: **32px**

### 20.4 Component Library

All components are built with **React 18 + Tailwind CSS**. The following core components are defined:

| Component | Description |
|---|---|
| `<StatusBadge>` | Color-coded pill for case/doc status. Variants: `pending`, `under_review`, `approved`, `rejected`, `provisioned`, `flagged` |
| `<CaseCard>` | Summary card for an onboarding case — name, department, date, status badge, action CTA |
| `<DocumentCard>` | Document row with type icon, upload date, AI validation status, expand-for-summary |
| `<AISummaryPanel>` | Expandable panel showing GPT-4o validation result and key extracted fields |
| `<ActionBar>` | Sticky bottom bar on case detail — primary action (Approve All / Reject) + secondary actions |
| `<AuditTimeline>` | Vertical timeline of audit log entries with actor, action, timestamp |
| `<UploadSlot>` | Document upload dropzone with file type/size validation, progress indicator |
| `<MetricCard>` | KPI card for Power BI dashboard — icon, label, value, trend arrow |
| `<AlertBanner>` | Top-of-page banner for system alerts or case status changes |
| `<RoleGuard>` | Wrapper component that renders children only if current user has required role |

---

## 21. Information Architecture

```
OnboardIQ
├── Public
│   ├── /                    Landing / login redirect
│   ├── /register            New hire self-registration
│   └── /login               Auth0 Universal Login redirect
│
├── New Hire  [NEW_HIRE]
│   ├── /dashboard           Onboarding checklist & case status
│   ├── /upload              Document upload with slot checklist
│   └── /profile             Personal details & notifications
│
├── HR Reviewer  [HR_REVIEWER]
│   ├── /hr/cases            Pending cases list with filters
│   ├── /hr/cases/:id        Case detail — documents, AI summary, actions
│   └── /hr/history          Past approved/rejected cases
│
├── HR Admin  [HR_ADMIN]
│   ├── /admin/cases         Full case management with bulk actions
│   ├── /admin/analytics     Power BI Embedded dashboard
│   ├── /admin/team          HR reviewer team management
│   └── /admin/audit         System-wide audit log
│
└── IT Admin  [IT_ADMIN]
    ├── /it/queue            Provisioning queue
    ├── /it/logs             Provisioning event logs
    └── /it/config           Mock integration config (Slack, Jira, GitHub)
```

---

## 22. Screen Designs

### 22.1 New Hire — Registration Page

**Layout:** Centered single-column form, max-width 480px, white card on `--surface` background.

**Sections:**
1. **Header** — OnboardIQ logo + "Create your onboarding account" heading
2. **Personal Details** — Name, email, employee ID, department (dropdown), joining date, reporting manager (searchable dropdown)
3. **Account Setup** — Password + confirm password with strength indicator
4. **MFA Setup** — QR code for TOTP authenticator or phone number for SMS OTP
5. **Submit** — "Create Account" primary CTA → redirects to `/dashboard` on success

**Validation:** All fields validated inline on blur. Password requires min 8 chars, 1 uppercase, 1 number. Email domain validated against allowed list.

---

### 22.2 New Hire — Onboarding Dashboard

**Layout:** Top nav + side status panel + main content area.

**Status Panel (left, 280px):**
- Case ID and created date
- Large status badge (e.g., `Under Review`)
- Progress bar: Documents Submitted / Total Required
- Contact HR button

**Main Content:**
- Document checklist table with columns: Document Type | Status | Uploaded | Action
- Each row has a `StatusBadge` + Upload / Re-upload button
- Completed rows are grayed out; rejected rows are highlighted in `--danger` tint
- Bottom: "All documents submitted. Awaiting HR review." confirmation banner when complete

---

### 22.3 HR Reviewer — Cases List

**Layout:** Full-width with top filter bar + card grid.

**Filter Bar:**
- Status filter: All | Pending | Under Review | Flagged
- Department filter dropdown
- Date range picker
- Search by name or case ID

**Case Grid:**
- `<CaseCard>` components in a 3-column responsive grid
- Each card: Avatar initials, full name, department, joining date, number of documents, status badge, "Review" CTA button
- Flagged cases shown with `--accent` left border
- Skeleton loaders on initial fetch

---

### 22.4 HR Reviewer — Case Detail

**Layout:** Two-panel layout. Left: document list (400px). Right: document preview + AI summary.

**Left Panel — Document List:**
- Case header: Name, department, case ID, overall status badge
- List of `<DocumentCard>` components — one per required document
- Each card: doc type icon, file name, upload date, AI validation status badge
- Click to load preview in right panel
- Bottom: `<ActionBar>` — "Approve Case" (primary) | "Reject Case" (secondary) | "Request Re-upload" (tertiary)

**Right Panel — Document Viewer + AI:**
- PDF/image inline viewer (iframe for PDF, `<img>` for JPG)
- Below viewer: `<AISummaryPanel>` — expandable with fields:
  - **Validation Result:** Valid / Flagged / Missing Fields / Illegible
  - **Key Extracted Fields:** Name on document, ID number, expiry date, issuing authority
  - **AI Notes:** Free-text flagging reason (if flagged)
- Approve / Reject buttons per document with rejection reason text input

---

### 22.5 HR Admin — Analytics Dashboard

**Layout:** Full-width grid of `<MetricCard>` components + embedded Power BI iframe.

**Top KPI Row (4 cards):**
- Total Cases This Month
- Avg. Time to Approval (hours)
- Document Rejection Rate (%)
- Provisioning Success Rate (%)

**Charts (Power BI Embedded):**
- Cases by Status — donut chart
- Cases by Department — horizontal bar chart
- Rejection Reasons by Document Type — stacked bar chart
- Weekly Onboarding Volume — line chart

**Filters:** Date range, department, reviewer — applied across all charts.

---

### 22.6 IT Admin — Provisioning Queue

**Layout:** Standard list view with action column.

**Table Columns:**
- Case ID | New Hire Name | Department | Approved At | Provisioning Status | Actions

**Status values:** `Queued` | `In Progress` | `Provisioned` | `Failed`

**Actions per row:**
- "Provision Now" button (triggers ProvisioningFunction manually)
- "View Logs" link → opens `<AuditTimeline>` modal for that case
- "Retry" button (visible only on `Failed` status)

---

## 23. User Flows

### 23.1 New Hire Onboarding Flow

```
Register → Auth0 MFA setup → Dashboard (Pending Docs)
  → Upload Gov ID → Upload Offer Letter → Upload Certificates
  → Upload Bank Form → Upload NDA
  → "All documents submitted" confirmation
  → Status: Under Review
  → [Email notification] "Your case is under HR review"
  → Status: Approved / Rejected
  → [Email notification] "Your onboarding is approved — welcome email with credentials"
  → Status: Provisioned
```

### 23.2 HR Review Flow

```
Login → Cases List (filter: Pending)
  → Open Case → View document list
  → Click document → View in panel
  → Read AI Summary → Approve or Flag
  → Repeat for all documents
  → All approved? → Click "Approve Case"
    → Azure Function triggered → Status: Provisioned
  → Any rejected? → Add rejection reason → Click "Reject Case"
    → Email sent to new hire → Status: Needs Re-upload
```

### 23.3 Auto-Provisioning Flow

```
HR clicks "Approve Case"
  → Backend: PATCH /api/cases/:id/approve
  → Backend calls ProvisioningFunction (HTTP trigger)
  → Function: Auth0 Management API → create user account
  → Function: assign role based on department + job level
  → Function: send welcome email via Azure Communication Services
  → Function: mock Slack/Jira/GitHub API calls
  → Function: UPDATE SQL → case_status = provisioned
  → Frontend: case status badge updates to "Provisioned"
  → IT Admin queue: row moves to "Provisioned" with timestamp
```

---

## 24. Responsive Design

| Breakpoint | Width | Layout Changes |
|---|---|---|
| **Mobile** | < 768px | Single column, side nav collapses to bottom tab bar, tables become card stacks |
| **Tablet** | 768px – 1024px | Side nav collapses to icon-only (64px), 2-column card grids |
| **Desktop** | > 1024px | Full side nav (240px), 3-column grids, two-panel case detail layout |

Primary target is **desktop** — HR workflows are optimized for 1280px+ screens. Mobile is supported for new hire document upload.

---

## 25. Accessibility

- All interactive elements meet **WCAG 2.1 AA** contrast ratios (minimum 4.5:1 for text)
- Keyboard navigation supported across all dashboards — focus indicators visible
- `StatusBadge` components use both color and text/icon — never color alone
- All form fields have associated `<label>` elements
- Document viewer supports keyboard zoom
- Error messages are announced via `aria-live` regions
- Auth0 Universal Login is WCAG AA compliant out of the box

---

## 26. Loading & Error States

| State | Behaviour |
|---|---|
| **Initial page load** | Skeleton loaders for cards and tables — no blank white flash |
| **API error (5xx)** | `<AlertBanner>` at top of page: "Something went wrong. Please try again." with retry button |
| **Empty state** | Illustrated empty state with contextual message — e.g., "No pending cases right now" |
| **Upload in progress** | Per-slot progress bar + spinner, upload button disabled to prevent double-submit |
| **AI validation pending** | Document card shows "Analysing..." shimmer on AI status field |
| **Session expired** | Auth0 silent refresh attempted first; if fails, redirect to login with "Your session has expired" message |

---

## 27. Notification Design

All email notifications are sent via **Azure Communication Services** using HTML email templates.

| Trigger | Recipient | Subject | Content |
|---|---|---|---|
| Document rejected | New hire | "Action required: Re-upload document" | Document name, rejection reason, re-upload link |
| Case approved | New hire | "Welcome to [Company]! Your onboarding is complete" | Credentials, first-day instructions, IT access summary |
| Case flagged | HR reviewer | "Case flagged for review: [Name]" | Case ID, flagging reason, link to case detail |
| Provisioning failed | IT admin | "Provisioning failure: [Name]" | Case ID, error detail, retry link |
| New case submitted | HR reviewer | "New onboarding case: [Name]" | Employee name, department, case link |

---

*OnboardIQ — PRD, Technical Specification & Design Document v1.0 — April 2026*  
*Confidential — Academic Use Only*
