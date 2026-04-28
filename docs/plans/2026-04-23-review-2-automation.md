# Review 2 Automation Implementation Plan (Local-First)

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Complete the DevOps, Containerization, and Orchestration requirements for Project Review 2 using a **₹0 Cost Local Environment** (Docker + kind + Terraform).

**Architecture:** Use Docker Desktop for containerization, **kind** (Kubernetes in Docker) as our local cluster, and Terraform to manage the local K8s resources.

**Tech Stack:** Docker, kind, Terraform (Kubernetes Provider).

---

### Task 1: Containerization (Docker)

**Files:**
- Create: `backend/Dockerfile`
- Create: `backend/.dockerignore`
- Create: `frontend/Dockerfile`
- Create: `frontend/.dockerignore`
- Create: `docker-compose.yml`

**Step 1: Create Backend Dockerfile**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["node", "src/server.js"]
```

**Step 2: Create Backend .dockerignore**
```text
node_modules
npm-debug.log
.env
uploads
```

**Step 3: Create Frontend Dockerfile**
```dockerfile
# Build stage
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Step 4: Create Frontend .dockerignore**
```text
node_modules
dist
.env
```

**Step 5: Create docker-compose.yml**
```yaml
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    env_file: ./backend/.env
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

**Step 6: Commit**
```bash
git add backend/Dockerfile backend/.dockerignore frontend/Dockerfile frontend/.dockerignore docker-compose.yml
git commit -m "feat: add local containerization for Review 2"
```

---

### Task 2: Local Kubernetes Setup (kind)

**Goal:** Verify the `kind` cluster created via Docker Desktop.

**Step 1: Verify Cluster**
Run: `kubectl cluster-info`
Expected: "Kubernetes control plane is running at..."

**Step 2: Set Context**
Run: `kubectl config use-context docker-desktop`
Expected: "Switched to context 'docker-desktop'."

---

### Task 3: Infrastructure as Code (Terraform Local)

**Files:**
- Create: `terraform/local.tf`

**Step 1: Create terraform/local.tf**
Use the `kubernetes` provider to manage resources in the local cluster.
```hcl
provider "kubernetes" {
  config_path = "~/.kube/config"
  config_context = "docker-desktop"
}

resource "kubernetes_namespace" "onboardiq" {
  metadata {
    name = "onboardiq"
  }
}

resource "kubernetes_secret" "backend_env" {
  metadata {
    name      = "backend-secrets"
    namespace = kubernetes_namespace.onboardiq.metadata[0].name
  }

  data = {
    "PORT" = "5000"
    # Note: Real secrets should be provided via .env during apply or k8s secret create
  }
}
```

**Step 2: Commit**
```bash
git add terraform/local.tf
git commit -m "infra: add terraform for local orchestration"
```

---

### Task 4: Orchestration (Kubernetes Manifests)

**Files:**
- Create: `k8s/backend.yml`
- Create: `k8s/frontend.yml`

**Step 1: Create k8s/backend.yml**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: onboardiq
spec:
  replicas: 1
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: onboardiq-backend:latest
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 5000
---
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: onboardiq
spec:
  selector:
    app: backend
  ports:
  - port: 5000
```

**Step 2: Create k8s/frontend.yml**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: onboardiq
spec:
  replicas: 1
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: onboardiq-frontend:latest
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: frontend
  namespace: onboardiq
spec:
  type: NodePort
  selector:
    app: frontend
  ports:
  - port: 80
    targetPort: 80
    nodePort: 30080
```

**Step 3: Commit**
```bash
git add k8s/
git commit -m "feat: add k8s manifests for local cluster"
```
