# OnboardIQ: Production-Grade ACA Migration Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Securely migrate OnboardIQ to Azure Container Apps with a verified dependency chain, production CORS handling, and explicit subscription targeting.

**Architecture:** A multi-stage deployment using `azurerm` with Log Analytics, sensitive secret management, and a strictly ordered build-and-deploy cycle to handle the dynamic backend-frontend link.

**Tech Stack:** Terraform, Azure CLI, Azure Container Apps, Node.js/Express, React/Vite.

---

### Task 0: Account & Infrastructure Foundation

**Files:**
- Modify: `terraform/main.tf`
- Modify: `terraform/variables.tf`

**Step 1: Explicit Provider & Subscription Targeting**
Update `terraform/main.tf` and `terraform/variables.tf` to include the `subscription_id` variable and use it in the `azurerm` provider block.

**Step 2: Provision Mandatory Log Analytics Workspace**
Add `azurerm_log_analytics_workspace` to `main.tf`.

**Step 3: Add AI & ACR Data Sources**
Provision `azurerm_cognitive_account` (Document Intelligence) and reference the existing ACR.

**Step 4: Commit**
```bash
git add terraform/
git commit -m "infra: setup provider, subscription targeting, and log analytics"
```

---

### Task 1: Security & Git Hygiene

**Files:**
- Modify: `terraform/variables.tf`
- Modify: `.gitignore`
- Create: `terraform/terraform.tfvars`

**Step 1: Define Sensitive Variables**
Ensure all sensitive variables (DB passwords, API keys) in `variables.tf` have `sensitive = true`.

**Step 2: Update `.gitignore`**
Add `.terraform/`, `terraform.tfstate*`, and `terraform.tfvars` to `.gitignore`.

**Step 3: Commit**
```bash
git add .gitignore terraform/variables.tf
git commit -m "security: enforce secret masking and git hygiene"
```

---

### Task 2: Backend CORS & Containerization

**Files:**
- Modify: `backend/src/app.js`

**Step 1: Implement Precise CORS Handling**
Update `backend/src/app.js` to use `process.env.FRONTEND_URL || "*"`.

**Step 2: Build and Push Backend Image**
Build and push the backend image to ACR *before* the Terraform apply.

**Step 3: Commit**
```bash
git add backend/src/app.js
git commit -m "feat: implement precise CORS and push backend image"
```

---

### Task 3: Provision Backend ACA

**Files:**
- Modify: `terraform/main.tf`

**Step 1: Run Terraform Init & Plan**
`terraform init` and `terraform plan`.

**Step 2: Apply Backend Infrastructure**
Provision the Backend ACA and capture its FQDN.

**Step 3: Commit**
```bash
git add terraform/main.tf
git commit -m "infra: provision backend aca and capture fqdn"
```

---

### Task 4: Frontend Build & Provision

**Files:**
- Modify: `terraform/main.tf`

**Step 1: Rebuild Frontend with Backend FQDN**
Build the frontend image *after* the backend FQDN is known, then push to ACR.

**Step 2: Provision Frontend ACA**
Provision the Frontend ACA referencing the backend's `latest_revision_fqdn`.

**Step 3: Commit**
```bash
git add terraform/main.tf
git commit -m "infra: deploy frontend with verified backend link"
```

---

### Task 5: Production Verification Checklist

**Step 1: Execute Verification**
- [ ] Backend `/api/health` responds with `200 OK`.
- [ ] Frontend URL loads in browser.
- [ ] Verify Login/API calls succeed (CORS check).
- [ ] Check logs in Azure Portal.

**Step 2: Update Progress**
Update `docs/plans/task.md`.
