# Review 3 Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Complete the Final Review III deliverables: Security Scanning (CodeQL, OWASP ZAP), Monitoring & Observability (App Insights, Dashboards), Cost Management, and the final Employee Welcome Hub.

**Architecture:** We will implement DevSecOps in GitHub Actions, add Application Insights to our Node.js backend for APM, define budget alerts in Terraform, and finalize the "Welcome Hub" frontend view for fully onboarded employees.

**Tech Stack:** GitHub Actions (CodeQL, ZAP), Azure Application Insights, Terraform, Node.js, React.

---

### Task 1: Security Scanning — CodeQL (SAST)

**Files:**
- Create: `.github/workflows/codeql.yml`

**Step 1: Create the CodeQL workflow**
```yaml
name: "CodeQL Advanced"

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]
  schedule:
    - cron: '30 1 * * 0'

jobs:
  analyze:
    name: Analyze (${{ matrix.language }})
    runs-on: ubuntu-latest
    permissions:
      security-events: write
      packages: read
      actions: read
      contents: read

    strategy:
      fail-fast: false
      matrix:
        include:
          - language: javascript-typescript
            build-mode: none

    steps:
    - name: Checkout repository
      uses: actions/checkout@v4

    - name: Initialize CodeQL
      uses: github/codeql-action/init@v3
      with:
        languages: ${{ matrix.language }}
        build-mode: ${{ matrix.build-mode }}

    - name: Perform CodeQL Analysis
      uses: github/codeql-action/analyze@v3
      with:
        category: "/language:${{matrix.language}}"
```

**Step 2: Commit**
```bash
git add .github/workflows/codeql.yml
git commit -m "ci: add CodeQL SAST workflow for Review 3"
```

---

### Task 2: Security Scanning — OWASP ZAP (DAST)

**Files:**
- Create: `.github/workflows/zap-dast.yml`

**Step 1: Create the ZAP workflow**
```yaml
name: OWASP ZAP DAST Scan

on:
  workflow_dispatch:
  # Can be triggered after deployment to staging/production

jobs:
  zap_scan:
    runs-on: ubuntu-latest
    name: Scan frontend app
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: ZAP Scan
        uses: zaproxy/action-baseline@v0.12.0
        with:
          target: 'https://onboardiq-frontend.ashysand-f85aeb04.eastasia.azurecontainerapps.io'
          fail_action: false
```

**Step 2: Commit**
```bash
git add .github/workflows/zap-dast.yml
git commit -m "ci: add OWASP ZAP DAST scan workflow"
```

---

### Task 3: Cost Management Alerts (Terraform)

**Files:**
- Modify: `terraform/main.tf`
- Modify: `terraform/variables.tf`

**Step 1: Add budget alert to Terraform**
Add to `terraform/main.tf`:
```hcl
resource "azurerm_consumption_budget_resource_group" "onboardiq" {
  name              = "onboardiq-budget"
  resource_group_id = data.azurerm_resource_group.onboardiq.id
  amount            = 8000
  time_grain        = "Monthly"

  time_period {
    start_date = "2026-04-01T00:00:00Z"
    end_date   = "2027-04-01T00:00:00Z"
  }

  notification {
    enabled        = true
    threshold      = 90.0
    operator       = "EqualTo"
    contact_emails = [var.admin_email]
  }
}
```

Add to `terraform/variables.tf`:
```hcl
variable "admin_email" {
  description = "Admin email for budget alerts"
  type        = string
  default     = "admin@example.com"
}
```

**Step 2: Commit**
```bash
git add terraform/main.tf terraform/variables.tf
git commit -m "infra: add budget alert for cost management"
```

---

### Task 4: Application Insights (Observability)

**Files:**
- Modify: `terraform/main.tf`
- Modify: `backend/package.json`
- Modify: `backend/src/server.js`

**Step 1: Add App Insights to Terraform**
Add to `terraform/main.tf`:
```hcl
resource "azurerm_application_insights" "onboardiq" {
  name                = "onboardiq-appinsights"
  location            = var.location
  resource_group_name = data.azurerm_resource_group.onboardiq.name
  workspace_id        = azurerm_log_analytics_workspace.onboardiq.id
  application_type    = "Node.JS"
}

output "app_insights_instrumentation_key" {
  value     = azurerm_application_insights.onboardiq.instrumentation_key
  sensitive = true
}

output "app_insights_connection_string" {
  value     = azurerm_application_insights.onboardiq.connection_string
  sensitive = true
}
```
Update the backend container app env vars in `main.tf` to include:
```hcl
      env {
        name  = "APPLICATIONINSIGHTS_CONNECTION_STRING"
        value = azurerm_application_insights.onboardiq.connection_string
      }
```

**Step 2: Install backend SDK**
Run: `cd backend && npm install applicationinsights`

**Step 3: Instrument backend server**
Add to the very top of `backend/src/server.js`:
```javascript
// Application Insights Initialization
const appInsights = require("applicationinsights");
if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
  appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
    .setAutoDependencyCorrelation(true)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true, true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectConsole(true, true)
    .start();
  console.log("Application Insights initialized.");
}
```

**Step 4: Commit**
```bash
git add terraform/main.tf backend/package.json backend/package-lock.json backend/src/server.js
git commit -m "feat: instrument backend with Application Insights"
```

---

### Task 5: Welcome Hub Smart Routing

**Files:**
- Modify: `frontend/src/pages/NewHireDashboard.jsx`

**Step 1: Add Smart Routing logic**
In `NewHireDashboard.jsx`, check the case status when it loads. If `case_status` is `'approved'` or `'provisioned'`, navigate to the Welcome Hub.

```javascript
  // Inside NewHireDashboard.jsx
  import { useNavigate } from 'react-router-dom';
  // ...
  const navigate = useNavigate();
  // ... inside useEffect after fetching caseData:
  if (data.case_status === 'approved' || data.case_status === 'provisioned') {
      navigate('/dashboard/welcome-hub', { replace: true });
      return;
  }
```

**Step 2: Commit**
```bash
git add frontend/src/pages/NewHireDashboard.jsx
git commit -m "feat: route approved hires to Welcome Hub"
```
