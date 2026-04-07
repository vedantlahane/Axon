```markdown
# Axon — Deployment Guide

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Infrastructure Map](#infrastructure-map)
- [Prerequisites](#prerequisites)
- [Phase 1: Dockerize Backend](#phase-1-dockerize-backend)
- [Phase 2: CI Pipeline — GitHub Actions](#phase-2-ci-pipeline--github-actions)
- [Phase 3: Kubernetes Manifests](#phase-3-kubernetes-manifests)
- [Phase 4: Local Testing with Kind](#phase-4-local-testing-with-kind)
- [Phase 5: kubeadm Cluster on AWS EC2](#phase-5-kubeadm-cluster-on-aws-ec2)
- [Phase 6: Ingress and HTTPS](#phase-6-ingress-and-https)
- [Phase 7: Monitoring Stack — Prometheus + Grafana](#phase-7-monitoring-stack--prometheus--grafana)
- [Phase 8: Autoscaling (HPA)](#phase-8-autoscaling-hpa)
- [Phase 9: CD — Continuous Deployment](#phase-9-cd--continuous-deployment)
- [External Services Setup](#external-services-setup)
- [Maintenance and Operations](#maintenance-and-operations)
- [Troubleshooting](#troubleshooting)
- [Cost Breakdown](#cost-breakdown)

---

## Architecture Overview

```
┌───────────────────────────────────────────────────────────────────┐
│                           INTERNET                                │
│                                                                   │
│   User → axonvercel.vercel.app ──HTTPS──→ Vercel (Frontend)      │
│                                                                   │
│   Frontend API calls → axon-api.duckdns.org ──HTTPS──→ EC2 K8s   │
└───────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────────┐
│                     GitHub Actions (CI)                            │
│                                                                   │
│   Push to main → Lint → Test → Build Docker Image → Push to Hub  │
└───────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────────┐
│                     Docker Hub (Registry)                          │
│                                                                   │
│   vedantlahane/axon-backend:latest                                │
│   vedantlahane/axon-backend:sha-abc1234                           │
└───────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────────┐
│              kubeadm Kubernetes Cluster (2x EC2)                  │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  MASTER NODE (t3.medium) — untainted for workloads          │  │
│  │                                                             │  │
│  │  K8s Control Plane:                                         │  │
│  │  ├── kube-apiserver                                         │  │
│  │  ├── etcd                                                   │  │
│  │  ├── kube-scheduler                                         │  │
│  │  └── kube-controller-manager                                │  │
│  │                                                             │  │
│  │  Infrastructure Pods:                                       │  │
│  │  ├── Nginx Ingress Controller (ports 80/443 on host)        │  │
│  │  ├── cert-manager (Let's Encrypt TLS)                       │  │
│  │  ├── Prometheus (metrics collection)                        │  │
│  │  ├── Grafana (dashboards + visualization)                   │  │
│  │  ├── Alertmanager (alert routing)                           │  │
│  │  └── metrics-server (HPA support)                           │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  WORKER NODE (t3.medium)                                    │  │
│  │                                                             │  │
│  │  Application Pods:                                          │  │
│  │  ├── axon-backend (1→5 replicas via HPA)                   │  │
│  │  │   ├── Port 8000                                          │  │
│  │  │   ├── ENV: DATABASE_URL → Supabase PostgreSQL            │  │
│  │  │   └── Volume: /app/uploads → PVC (10Gi)                 │  │
│  │  └── PersistentVolume (hostPath: /data/axon-uploads)        │  │
│  └─────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────────┐
│                     External Services (Free Tier)                 │
│                                                                   │
│  ├── Supabase     → PostgreSQL database (500MB)                   │
│  ├── Vercel       → Frontend hosting (axonvercel.vercel.app)      │
│  ├── Docker Hub   → Container image registry                      │
│  ├── DuckDNS      → Free subdomain (axon-api.duckdns.org)        │
│  └── Let's Encrypt → Trusted HTTPS certificates (auto-renewed)   │
└───────────────────────────────────────────────────────────────────┘
```

---

## Infrastructure Map

| Component              | Location                     | Technology              | Cost    |
| ---------------------- | ---------------------------- | ----------------------- | ------- |
| Frontend               | Vercel                       | React 19 + Vite 7       | Free    |
| Backend Image          | Docker Hub                   | FastAPI + Python 3.13    | Free    |
| App Database           | Supabase                     | PostgreSQL 15            | Free    |
| File Storage           | EC2 EBS (PVC)                | hostPath PV              | Incl.   |
| K8s Master             | AWS EC2 t3.medium            | kubeadm                  | ~$0.04/hr |
| K8s Worker             | AWS EC2 t3.medium            | kubeadm                  | ~$0.04/hr |
| Domain                 | DuckDNS                      | Dynamic DNS              | Free    |
| HTTPS Certs            | Let's Encrypt                | cert-manager             | Free    |
| CI Pipeline            | GitHub Actions               | Workflow YAML            | Free    |
| Monitoring             | In-cluster (Helm)            | Prometheus + Grafana     | Free    |

---

## Prerequisites

### Accounts Required

- [GitHub](https://github.com) — repo hosting + Actions CI
- [Docker Hub](https://hub.docker.com) — container registry
- [AWS Account](https://aws.amazon.com) — EC2 instances
- [Supabase](https://supabase.com) — PostgreSQL database
- [DuckDNS](https://www.duckdns.org) — free domain
- [Vercel](https://vercel.com) — frontend hosting (already deployed)

### Local Tools

**Ubuntu (primary dev + Kind testing):**

```bash
# Docker
sudo apt update
sudo apt install -y docker.io
sudo usermod -aG docker $USER
newgrp docker

# kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Kind (local K8s testing)
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.24.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind

# Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

**Windows (coding only, no Docker/K8s needed):**

```powershell
# Git, Node.js, Python — already installed
# No Docker or K8s tools needed on Windows
# All container/cluster work happens on Ubuntu or CI
```

---

## Phase 1: Dockerize Backend

### 1.1 Create Dockerfile

**File: `backend/Dockerfile`**

```dockerfile
# ============================================
# Stage 1: Build dependencies
# ============================================
FROM python:3.13-slim AS builder

WORKDIR /build

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ============================================
# Stage 2: Production image
# ============================================
FROM python:3.13-slim AS runtime

WORKDIR /app

# Install only runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && addgroup --system axon \
    && adduser --system --ingroup axon axon

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p /app/uploads && chown -R axon:axon /app

# Switch to non-root user
USER axon

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/api/health/ || exit 1

# Run with uvicorn
CMD ["python", "-m", "uvicorn", "backend.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "2"]
```

### 1.2 Create .dockerignore

**File: `backend/.dockerignore`**

```
__pycache__/
*.pyc
*.pyo
.env
.env.*
venv/
.venv/
*.db
uploads/*
!uploads/.gitkeep
tests/
.git/
.github/
*.md
.mypy_cache/
.pytest_cache/
alembic/versions/__pycache__/
```

### 1.3 Build and Test Locally (Ubuntu)

```bash
# From repo root
cd backend

# Build image
docker build -t axon-backend:local .

# Test run (quick smoke test)
docker run --rm -p 8000:8000 \
  -e SECRET_KEY=test-secret-key \
  -e DATABASE_URL=sqlite+aiosqlite:///./test.db \
  -e CORS_ORIGINS='["http://localhost:3000"]' \
  axon-backend:local

# Verify
curl http://localhost:8000/api/health/
# Expected: {"status": "healthy"}
```

---

## Phase 2: CI Pipeline — GitHub Actions

### 2.1 GitHub Secrets Configuration

Go to **GitHub → Repo → Settings → Secrets and variables → Actions** and add:

| Secret Name           | Value                              |
| --------------------- | ---------------------------------- |
| `DOCKERHUB_USERNAME`  | Your Docker Hub username            |
| `DOCKERHUB_TOKEN`     | Docker Hub access token (not password) |
| `SECRET_KEY`          | Random string for JWT signing       |
| `DATABASE_URL`        | `sqlite+aiosqlite:///./test.db` (for CI tests) |

### 2.2 CI Workflow

**File: `.github/workflows/ci.yml`**

```yaml
name: Axon CI Pipeline

on:
  push:
    branches: [main]
    paths:
      - "backend/**"
      - ".github/workflows/ci.yml"
  pull_request:
    branches: [main]
    paths:
      - "backend/**"

env:
  DOCKER_IMAGE: vedantlahane/axon-backend
  PYTHON_VERSION: "3.13"

jobs:
  # ──────────────────────────────────────────
  # Job 1: Lint and Validate
  # ──────────────────────────────────────────
  lint:
    name: Lint & Syntax Check
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Cache pip dependencies
        uses: actions/cache@v4
        with:
          path: ~/.cache/pip
          key: ${{ runner.os }}-pip-${{ hashFiles('backend/requirements.txt') }}
          restore-keys: |
            ${{ runner.os }}-pip-

      - name: Install dependencies
        run: |
          cd backend
          pip install --upgrade pip setuptools wheel
          pip install -r requirements.txt

      - name: Syntax validation
        run: |
          cd backend
          python -m compileall . -q

  # ──────────────────────────────────────────
  # Job 2: Run Tests
  # ──────────────────────────────────────────
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Cache pip dependencies
        uses: actions/cache@v4
        with:
          path: ~/.cache/pip
          key: ${{ runner.os }}-pip-${{ hashFiles('backend/requirements.txt') }}
          restore-keys: |
            ${{ runner.os }}-pip-

      - name: Install dependencies
        run: |
          cd backend
          pip install --upgrade pip setuptools wheel
          pip install -r requirements.txt

      - name: Run database migrations
        env:
          DATABASE_URL: sqlite+aiosqlite:///./test.db
          SECRET_KEY: ci-test-secret-key
        run: |
          cd backend
          alembic upgrade head

      - name: Run unit tests
        env:
          DATABASE_URL: sqlite+aiosqlite:///./test.db
          SECRET_KEY: ci-test-secret-key
          CORS_ORIGINS: '["http://localhost:3000"]'
        run: |
          cd backend
          python -m unittest -v \
            backend.tests.test_agent_pipeline \
            backend.tests.test_agent_chat_api \
            backend.tests.test_agent_model_preferences \
            backend.tests.test_api_end_to_end

  # ──────────────────────────────────────────
  # Job 3: Build and Push Docker Image
  # ──────────────────────────────────────────
  build-and-push:
    name: Build & Push Docker Image
    runs-on: ubuntu-latest
    needs: test
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.DOCKER_IMAGE }}
          tags: |
            type=raw,value=latest
            type=sha,prefix=sha-
            type=raw,value={{date 'YYYYMMDD-HHmmss'}}

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: ./backend
          file: ./backend/Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Print pushed tags
        run: |
          echo "Pushed image tags:"
          echo "${{ steps.meta.outputs.tags }}"
```

### 2.3 CI Pipeline Flow

```
Push to main (backend/ changes only)
        │
        ▼
   ┌─────────┐
   │  LINT    │  Syntax validation (compileall)
   └────┬────┘
        │ ✅
        ▼
   ┌─────────┐
   │  TEST    │  Alembic migrations + unit tests
   └────┬────┘
        │ ✅
        ▼
   ┌─────────────┐
   │  BUILD+PUSH  │  Docker buildx → Docker Hub
   └─────────────┘
        │
        ▼
   vedantlahane/axon-backend:latest
   vedantlahane/axon-backend:sha-abc1234
```

---

## Phase 3: Kubernetes Manifests

### 3.1 Directory Structure

```
k8s/
├── namespace.yaml
├── secrets.yaml              # Template — actual values via kubectl
├── configmap.yaml
├── storage.yaml              # PV + PVC
├── deployment.yaml           # Backend deployment
├── service.yaml              # ClusterIP service
├── hpa.yaml                  # Horizontal Pod Autoscaler
├── ingress.yaml              # Ingress rules + TLS
└── monitoring/
    ├── prometheus-values.yaml    # Helm override values
    └── grafana-dashboards/
        └── axon-dashboard.json
```

### 3.2 Namespace

**File: `k8s/namespace.yaml`**

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: axon
  labels:
    app: axon
    environment: production
```

### 3.3 Secrets

**File: `k8s/secrets.yaml`** (template — do NOT commit real values)

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: axon-secrets
  namespace: axon
type: Opaque
stringData:
  SECRET_KEY: "CHANGE_ME_IN_PRODUCTION"
  DATABASE_URL: "postgresql+asyncpg://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres"
  GEMINI_API_KEY: ""
  OPENAI_API_KEY: ""
```

> **Note:** Create secrets on the cluster directly:
> ```bash
> kubectl create secret generic axon-secrets \
>   --namespace=axon \
>   --from-literal=SECRET_KEY='your-real-secret-key' \
>   --from-literal=DATABASE_URL='postgresql+asyncpg://...' \
>   --from-literal=GEMINI_API_KEY='your-key' \
>   --from-literal=OPENAI_API_KEY='your-key'
> ```

### 3.4 ConfigMap

**File: `k8s/configmap.yaml`**

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: axon-config
  namespace: axon
data:
  APP_NAME: "Axon AI Platform"
  API_PREFIX: "/api"
  ALGORITHM: "HS256"
  ACCESS_TOKEN_EXPIRE_MINUTES: "60"
  CORS_ORIGINS: '["https://axonvercel.vercel.app"]'
  UVICORN_WORKERS: "2"
```

### 3.5 Persistent Storage

**File: `k8s/storage.yaml`**

```yaml
# PersistentVolume — maps to EC2 worker disk
apiVersion: v1
kind: PersistentVolume
metadata:
  name: axon-uploads-pv
  labels:
    type: local
    app: axon
spec:
  capacity:
    storage: 10Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  hostPath:
    path: /data/axon-uploads
    type: DirectoryOrCreate

---
# PersistentVolumeClaim — requested by backend pods
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: axon-uploads-pvc
  namespace: axon
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  selector:
    matchLabels:
      type: local
      app: axon
```

### 3.6 Backend Deployment

**File: `k8s/deployment.yaml`**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: axon-backend
  namespace: axon
  labels:
    app: axon
    component: backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: axon
      component: backend
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  template:
    metadata:
      labels:
        app: axon
        component: backend
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8000"
        prometheus.io/path: "/api/health/"
    spec:
      containers:
        - name: axon-backend
          image: vedantlahane/axon-backend:latest
          imagePullPolicy: Always
          ports:
            - containerPort: 8000
              name: http
              protocol: TCP
          envFrom:
            - configMapRef:
                name: axon-config
            - secretRef:
                name: axon-secrets
          volumeMounts:
            - name: uploads
              mountPath: /app/uploads
          resources:
            requests:
              cpu: 200m
              memory: 256Mi
            limits:
              cpu: 500m
              memory: 512Mi
          readinessProbe:
            httpGet:
              path: /api/health/
              port: 8000
            initialDelaySeconds: 10
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          livenessProbe:
            httpGet:
              path: /api/health/
              port: 8000
            initialDelaySeconds: 15
            periodSeconds: 20
            timeoutSeconds: 5
            failureThreshold: 3
      volumes:
        - name: uploads
          persistentVolumeClaim:
            claimName: axon-uploads-pvc
      restartPolicy: Always
```

### 3.7 Service

**File: `k8s/service.yaml`**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: axon-backend
  namespace: axon
  labels:
    app: axon
    component: backend
spec:
  type: ClusterIP
  selector:
    app: axon
    component: backend
  ports:
    - name: http
      port: 8000
      targetPort: 8000
      protocol: TCP
```

### 3.8 Horizontal Pod Autoscaler

**File: `k8s/hpa.yaml`**

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: axon-backend-hpa
  namespace: axon
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: axon-backend
  minReplicas: 1
  maxReplicas: 5
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Pods
          value: 2
          periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 120
      policies:
        - type: Pods
          value: 1
          periodSeconds: 60
```

### 3.9 Ingress

**File: `k8s/ingress.yaml`**

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: axon-backend-ingress
  namespace: axon
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/cors-allow-origin: "https://axonvercel.vercel.app"
    nginx.ingress.kubernetes.io/cors-allow-methods: "GET, POST, PUT, DELETE, OPTIONS"
    nginx.ingress.kubernetes.io/cors-allow-headers: "Content-Type, Authorization"
    nginx.ingress.kubernetes.io/enable-cors: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - axon-api.duckdns.org
      secretName: axon-tls-secret
  rules:
    - host: axon-api.duckdns.org
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: axon-backend
                port:
                  number: 8000
```

---

## Phase 4: Local Testing with Kind

Test everything locally on Ubuntu before deploying to EC2.

### 4.1 Create Kind Cluster

```bash
# Create cluster config
cat <<EOF > kind-config.yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
    extraPortMappings:
      - containerPort: 80
        hostPort: 80
        protocol: TCP
      - containerPort: 443
        hostPort: 443
        protocol: TCP
  - role: worker
EOF

# Create cluster
kind create cluster --name axon-dev --config kind-config.yaml

# Verify
kubectl cluster-info --context kind-axon-dev
kubectl get nodes
```

### 4.2 Deploy to Kind

```bash
# Load local image into Kind (skip Docker Hub pull)
docker build -t axon-backend:local ./backend
kind load docker-image axon-backend:local --name axon-dev

# Update deployment.yaml temporarily:
#   image: axon-backend:local
#   imagePullPolicy: Never

# Apply manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/storage.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# Create secrets inline for testing
kubectl create secret generic axon-secrets \
  --namespace=axon \
  --from-literal=SECRET_KEY='kind-test-secret' \
  --from-literal=DATABASE_URL='sqlite+aiosqlite:///./axon.db'

# Verify
kubectl get pods -n axon
kubectl logs -n axon deployment/axon-backend

# Port forward to test
kubectl port-forward -n axon svc/axon-backend 8000:8000
curl http://localhost:8000/api/health/
```

### 4.3 Cleanup Kind

```bash
kind delete cluster --name axon-dev
```

---

## Phase 5: kubeadm Cluster on AWS EC2

### 5.1 EC2 Instance Setup

Launch **2 EC2 instances** with the following configuration:

| Setting          | Master Node             | Worker Node             |
| ---------------- | ----------------------- | ----------------------- |
| AMI              | Ubuntu 22.04 LTS        | Ubuntu 22.04 LTS        |
| Instance Type    | t3.medium (2 vCPU, 4GB) | t3.medium (2 vCPU, 4GB) |
| Storage          | 30 GB gp3               | 30 GB gp3               |
| Security Group   | axon-k8s-sg             | axon-k8s-sg             |
| Key Pair         | Your SSH key             | Your SSH key             |

### 5.2 Security Group Rules

**Inbound rules for `axon-k8s-sg`:**

| Port Range  | Protocol | Source          | Purpose                          |
| ----------- | -------- | --------------- | -------------------------------- |
| 22          | TCP      | Your IP         | SSH access                       |
| 80          | TCP      | 0.0.0.0/0      | HTTP (redirect to HTTPS)         |
| 443         | TCP      | 0.0.0.0/0      | HTTPS (Ingress)                  |
| 6443        | TCP      | Security Group  | K8s API Server                   |
| 2379-2380   | TCP      | Security Group  | etcd                             |
| 10250       | TCP      | Security Group  | Kubelet API                      |
| 10259       | TCP      | Security Group  | kube-scheduler                   |
| 10257       | TCP      | Security Group  | kube-controller-manager          |
| 30000-32767 | TCP      | Security Group  | NodePort Services                |
| 8472        | UDP      | Security Group  | Flannel VXLAN                    |

### 5.3 Install Prerequisites (Both Nodes)

SSH into each EC2 instance and run:

```bash
#!/bin/bash
# File: scripts/k8s-prereqs.sh
# Run on BOTH master and worker nodes

set -euo pipefail

echo "=== Disabling swap ==="
sudo swapoff -a
sudo sed -i '/ swap / s/^/#/' /etc/fstab

echo "=== Loading kernel modules ==="
cat <<EOF | sudo tee /etc/modules-load.d/k8s.conf
overlay
br_netfilter
EOF

sudo modprobe overlay
sudo modprobe br_netfilter

echo "=== Setting sysctl params ==="
cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF

sudo sysctl --system

echo "=== Installing containerd ==="
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y containerd.io

# Configure containerd to use systemd cgroup
sudo mkdir -p /etc/containerd
containerd config default | sudo tee /etc/containerd/config.toml
sudo sed -i 's/SystemdCgroup = false/SystemdCgroup = true/g' /etc/containerd/config.toml
sudo systemctl restart containerd
sudo systemctl enable containerd

echo "=== Installing kubeadm, kubelet, kubectl ==="
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.31/deb/Release.key | \
  sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg

echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] \
  https://pkgs.k8s.io/core:/stable:/v1.31/deb/ /' | \
  sudo tee /etc/apt/sources.list.d/kubernetes.list

sudo apt-get update
sudo apt-get install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl

echo "=== Done. Ready for kubeadm init/join ==="
```

### 5.4 Initialize Master Node

```bash
# SSH into master node
ssh -i your-key.pem ubuntu@<MASTER_PUBLIC_IP>

# Initialize cluster (use master's private IP)
MASTER_PRIVATE_IP=$(hostname -I | awk '{print $1}')

sudo kubeadm init \
  --apiserver-advertise-address=$MASTER_PRIVATE_IP \
  --pod-network-cidr=10.244.0.0/16 \
  --node-name=axon-master

# Configure kubectl
mkdir -p $HOME/.kube
sudo cp /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

# Install Flannel CNI
kubectl apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml

# Untaint master to allow scheduling workloads
kubectl taint nodes axon-master node-role.kubernetes.io/control-plane:NoSchedule-

# Verify master is Ready
kubectl get nodes
# NAME          STATUS   ROLES           AGE   VERSION
# axon-master   Ready    control-plane   2m    v1.31.x

# SAVE the join command output! It looks like:
# kubeadm join <MASTER_PRIVATE_IP>:6443 --token <token> \
#   --discovery-token-ca-cert-hash sha256:<hash>
```

### 5.5 Join Worker Node

```bash
# SSH into worker node
ssh -i your-key.pem ubuntu@<WORKER_PUBLIC_IP>

# Run the join command from master init output
sudo kubeadm join <MASTER_PRIVATE_IP>:6443 \
  --token <token> \
  --discovery-token-ca-cert-hash sha256:<hash> \
  --node-name=axon-worker
```

### 5.6 Verify Cluster (on Master)

```bash
kubectl get nodes
# NAME          STATUS   ROLES           AGE   VERSION
# axon-master   Ready    control-plane   5m    v1.31.x
# axon-worker   Ready    <none>          2m    v1.31.x

# Label worker node
kubectl label nodes axon-worker node-role.kubernetes.io/worker=worker
```

### 5.7 Deploy Application

```bash
# Create uploads directory on worker node
ssh -i your-key.pem ubuntu@<WORKER_PUBLIC_IP> "sudo mkdir -p /data/axon-uploads && sudo chmod 777 /data/axon-uploads"

# Back on master — apply manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/storage.yaml

# Create secrets (use real values)
kubectl create secret generic axon-secrets \
  --namespace=axon \
  --from-literal=SECRET_KEY='your-production-secret-key-here' \
  --from-literal=DATABASE_URL='postgresql+asyncpg://postgres:PASS@db.PROJECT.supabase.co:5432/postgres' \
  --from-literal=GEMINI_API_KEY='your-gemini-key' \
  --from-literal=OPENAI_API_KEY='your-openai-key'

# Deploy backend
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/hpa.yaml

# Verify
kubectl get all -n axon
kubectl logs -n axon deployment/axon-backend --tail=50
```

---

## Phase 6: Ingress and HTTPS

### 6.1 Install Nginx Ingress Controller

```bash
# On master node
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.12.0/deploy/static/provider/baremetal/deploy.yaml

# Patch to use hostPort (expose 80/443 directly on node)
kubectl patch deployment ingress-nginx-controller \
  -n ingress-nginx \
  --type='json' \
  -p='[
    {"op": "add", "path": "/spec/template/spec/containers/0/ports/0/hostPort", "value": 80},
    {"op": "add", "path": "/spec/template/spec/containers/0/ports/1/hostPort", "value": 443}
  ]'

# Verify ingress controller is running
kubectl get pods -n ingress-nginx
kubectl get svc -n ingress-nginx
```

### 6.2 Set Up DuckDNS

1. Go to [https://www.duckdns.org](https://www.duckdns.org)
2. Log in with GitHub
3. Create subdomain: `axon-api` → `axon-api.duckdns.org`
4. Point it to your **master node's public IP**

```bash
# Verify DNS resolution
nslookup axon-api.duckdns.org
# Should return your master EC2 public IP
```

### 6.3 Install cert-manager

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.16.3/cert-manager.yaml

# Wait for it to be ready
kubectl wait --for=condition=Available deployment --all -n cert-manager --timeout=120s
```

### 6.4 Create Let's Encrypt ClusterIssuer

**File: `k8s/cluster-issuer.yaml`**

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com    # Change this
    privateKeySecretRef:
      name: letsencrypt-prod-key
    solvers:
      - http01:
          ingress:
            class: nginx
```

```bash
kubectl apply -f k8s/cluster-issuer.yaml

# Verify
kubectl get clusterissuer letsencrypt-prod
```

### 6.5 Apply Ingress

```bash
kubectl apply -f k8s/ingress.yaml

# Check certificate status
kubectl get certificate -n axon
kubectl describe certificate axon-tls-secret -n axon

# Verify HTTPS
curl https://axon-api.duckdns.org/api/health/
# Expected: {"status": "healthy"}
```

### 6.6 Update Frontend Environment

On Vercel, update the environment variable:

```
VITE_API_BASE_URL=https://axon-api.duckdns.org/api
```

Redeploy frontend on Vercel.

---

## Phase 7: Monitoring Stack — Prometheus + Grafana

### 7.1 Install Helm Repos

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
```

### 7.2 Prometheus + Grafana Values

**File: `k8s/monitoring/prometheus-values.yaml`**

```yaml
# kube-prometheus-stack Helm values
# Installs: Prometheus, Grafana, Alertmanager, node-exporter, kube-state-metrics

prometheus:
  prometheusSpec:
    retention: 7d
    storageSpec:
      volumeClaimTemplate:
        spec:
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 10Gi
    # Scrape Axon backend pods
    additionalScrapeConfigs:
      - job_name: "axon-backend"
        kubernetes_sd_configs:
          - role: pod
            namespaces:
              names:
                - axon
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_port]
            action: replace
            target_label: __address__
            regex: (.+)
            replacement: ${1}:8000

grafana:
  enabled: true
  adminUser: admin
  adminPassword: axon-grafana-2025    # Change in production
  service:
    type: NodePort
    nodePort: 31000
  dashboardProviders:
    dashboardproviders.yaml:
      apiVersion: 1
      providers:
        - name: default
          orgId: 1
          folder: ""
          type: file
          disableDeletion: false
          editable: true
          options:
            path: /var/lib/grafana/dashboards/default
  persistence:
    enabled: true
    size: 5Gi

alertmanager:
  enabled: true
  alertmanagerSpec:
    storage:
      volumeClaimTemplate:
        spec:
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 5Gi

# Node exporter for host metrics
nodeExporter:
  enabled: true

# kube-state-metrics for K8s object metrics
kubeStateMetrics:
  enabled: true
```

### 7.3 Install Monitoring Stack

```bash
# Create monitoring namespace
kubectl create namespace monitoring

# Install kube-prometheus-stack
helm install prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --values k8s/monitoring/prometheus-values.yaml \
  --wait --timeout 10m

# Verify
kubectl get pods -n monitoring
kubectl get svc -n monitoring
```

### 7.4 Install metrics-server (Required for HPA)

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# For kubeadm clusters, you may need to patch for insecure TLS
kubectl patch deployment metrics-server -n kube-system \
  --type='json' \
  -p='[{"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--kubelet-insecure-tls"}]'

# Verify
kubectl top nodes
kubectl top pods -n axon
```

### 7.5 Access Grafana

```bash
# Option 1: NodePort (already configured as 31000)
# Access: http://<MASTER_PUBLIC_IP>:31000
# Login: admin / axon-grafana-2025

# Option 2: Port forward (if NodePort blocked by security group)
kubectl port-forward -n monitoring svc/prometheus-stack-grafana 3000:80
# Access: http://localhost:3000
```

### 7.6 Grafana Dashboards to Import

| Dashboard ID | Name                            | Purpose                    |
| ------------ | ------------------------------- | -------------------------- |
| 15760        | Kubernetes Cluster Monitoring   | Cluster overview           |
| 315          | Kubernetes Pod Metrics          | Pod CPU/Memory             |
| 13770        | Node Exporter Full              | Node-level metrics         |
| Custom       | Axon Backend Dashboard          | App-specific metrics       |

Import via: **Grafana → Dashboards → Import → Enter ID**

### 7.7 Alertmanager Rules

**File: `k8s/monitoring/alert-rules.yaml`**

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: axon-alerts
  namespace: monitoring
  labels:
    release: prometheus-stack
spec:
  groups:
    - name: axon.rules
      rules:
        - alert: AxonBackendDown
          expr: up{job="axon-backend"} == 0
          for: 2m
          labels:
            severity: critical
          annotations:
            summary: "Axon backend is down"
            description: "Axon backend pod {{ $labels.pod }} has been down for 2 minutes."

        - alert: AxonHighCPU
          expr: rate(container_cpu_usage_seconds_total{namespace="axon"}[5m]) > 0.8
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "High CPU usage in Axon namespace"

        - alert: AxonHighMemory
          expr: container_memory_usage_bytes{namespace="axon"} / container_spec_memory_limit_bytes{namespace="axon"} > 0.9
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "High memory usage in Axon namespace"

        - alert: AxonPodRestarting
          expr: increase(kube_pod_container_status_restarts_total{namespace="axon"}[1h]) > 3
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "Axon pod restarting frequently"
```

```bash
kubectl apply -f k8s/monitoring/alert-rules.yaml
```

---

## Phase 8: Autoscaling (HPA)

### 8.1 Verify HPA is Working

```bash
# Check HPA status
kubectl get hpa -n axon

# Expected output:
# NAME               REFERENCE                 TARGETS   MINPODS   MAXPODS   REPLICAS
# axon-backend-hpa   Deployment/axon-backend   10%/70%   1         5         2
```

### 8.2 Load Test to Trigger Autoscaling

```bash
# Install hey (HTTP load generator)
sudo apt install -y hey

# Generate load
hey -z 120s -c 50 -q 10 https://axon-api.duckdns.org/api/health/

# In another terminal, watch scaling
watch kubectl get hpa,pods -n axon

# You should see replicas increase from 2 → 3 → 4 → 5
```

### 8.3 Monitor Scaling in Grafana

In Grafana, check:
- **Pod count** over time in axon namespace
- **CPU utilization** during load test
- **HPA scaling events** in Kubernetes events dashboard

---

## Phase 9: CD — Continuous Deployment

### 9.1 Manual Deployment (Simple)

After CI pushes a new image to Docker Hub:

```bash
# SSH to master node
ssh -i your-key.pem ubuntu@<MASTER_PUBLIC_IP>

# Rolling update
kubectl rollout restart deployment/axon-backend -n axon

# Watch rollout
kubectl rollout status deployment/axon-backend -n axon
```

### 9.2 Automated CD via GitHub Actions (Optional)

Add to `.github/workflows/ci.yml` after the build job:

```yaml
  # ──────────────────────────────────────────
  # Job 4: Deploy to K8s Cluster
  # ──────────────────────────────────────────
  deploy:
    name: Deploy to K8s
    runs-on: ubuntu-latest
    needs: build-and-push
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.EC2_MASTER_IP }}
          username: ubuntu
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            kubectl set image deployment/axon-backend \
              axon-backend=vedantlahane/axon-backend:sha-${{ github.sha }} \
              -n axon
            kubectl rollout status deployment/axon-backend -n axon --timeout=120s
```

**Additional GitHub Secrets needed:**

| Secret Name       | Value                           |
| ----------------- | ------------------------------- |
| `EC2_MASTER_IP`   | Master node public IP           |
| `EC2_SSH_KEY`     | Private SSH key content         |

### 9.3 Full CI/CD Pipeline Flow

```
Developer pushes to main
        │
        ▼
┌───────────────┐
│  LINT          │  Python syntax check
└───────┬───────┘
        │ ✅
        ▼
┌───────────────┐
│  TEST          │  Unit tests + migration check
└───────┬───────┘
        │ ✅
        ▼
┌───────────────┐
│  BUILD + PUSH  │  Docker image → Docker Hub
└───────┬───────┘
        │ ✅
        ▼
┌───────────────┐
│  DEPLOY        │  SSH → kubectl set image → rolling update
└───────┬───────┘
        │ ✅
        ▼
┌───────────────┐
│  RUNNING       │  New pods with updated image
│                │  Prometheus scraping ✅
│                │  Grafana dashboards ✅
│                │  Alertmanager watching ✅
└───────────────┘
```

---

## External Services Setup

### Supabase (PostgreSQL Database)

1. Go to [supabase.com](https://supabase.com) → New Project
2. Choose region closest to your EC2 instances
3. Copy the connection string:
   ```
   postgresql+asyncpg://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
   ```
4. Use this as `DATABASE_URL` in K8s secrets

### DuckDNS (Free Domain)

1. Go to [duckdns.org](https://www.duckdns.org)
2. Login with GitHub
3. Create subdomain: `axon-api`
4. Update IP to master node's public IP
5. Set up auto-update (optional):
   ```bash
   # Cron job on master node to keep DNS updated
   echo "*/5 * * * * curl -s 'https://www.duckdns.org/update?domains=axon-api&token=YOUR_TOKEN&ip=' > /dev/null" | crontab -
   ```

### Docker Hub

1. Go to [hub.docker.com](https://hub.docker.com) → Create repository
2. Repository: `vedantlahane/axon-backend`
3. Create access token: Account Settings → Security → New Access Token
4. Add token to GitHub Secrets as `DOCKERHUB_TOKEN`

---

## Maintenance and Operations

### Useful Commands

```bash
# ─── Cluster Status ───
kubectl get nodes -o wide
kubectl get all -n axon
kubectl get all -n monitoring

# ─── Logs ───
kubectl logs -n axon deployment/axon-backend --tail=100 -f
kubectl logs -n monitoring deployment/prometheus-stack-grafana --tail=50

# ─── Debug ───
kubectl describe pod <pod-name> -n axon
kubectl exec -it <pod-name> -n axon -- /bin/sh

# ─── Scaling ───
kubectl scale deployment axon-backend -n axon --replicas=3
kubectl get hpa -n axon -w

# ─── Rolling Update ───
kubectl rollout restart deployment/axon-backend -n axon
kubectl rollout status deployment/axon-backend -n axon
kubectl rollout undo deployment/axon-backend -n axon    # Rollback

# ─── Secrets ───
kubectl get secrets -n axon
kubectl describe secret axon-secrets -n axon

# ─── Storage ───
kubectl get pv,pvc -n axon
```

### Alembic Migrations in K8s

When you add new database migrations, run them as a K8s Job:

```bash
# One-time migration job
kubectl run axon-migrate \
  --namespace=axon \
  --image=vedantlahane/axon-backend:latest \
  --restart=Never \
  --env="DATABASE_URL=postgresql+asyncpg://..." \
  --command -- alembic upgrade head

# Check migration status
kubectl logs axon-migrate -n axon

# Cleanup
kubectl delete pod axon-migrate -n axon
```

---

## Troubleshooting

### Pods Stuck in Pending

```bash
kubectl describe pod <pod-name> -n axon
# Common causes:
# - Insufficient CPU/memory → reduce resource requests
# - PVC not bound → check PV exists and matches
# - Node not ready → check node status
```

### Ingress Not Working

```bash
# Check ingress controller
kubectl get pods -n ingress-nginx
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller --tail=50

# Check ingress resource
kubectl describe ingress axon-backend-ingress -n axon

# Check certificate
kubectl describe certificate axon-tls-secret -n axon
kubectl get challenges -n axon    # Should be empty if cert issued
```

### HTTPS Certificate Not Issuing

```bash
# Check cert-manager logs
kubectl logs -n cert-manager deployment/cert-manager --tail=50

# Common issues:
# - Port 80 not open in security group (HTTP-01 challenge needs it)
# - DNS not pointing to master node IP
# - cert-manager pods not ready
```

### HPA Not Scaling

```bash
# Check metrics-server
kubectl get deployment metrics-server -n kube-system
kubectl logs -n kube-system deployment/metrics-server --tail=50

# Check HPA status
kubectl describe hpa axon-backend-hpa -n axon
# Look for "unable to fetch metrics" errors
```

### Database Connection Issues

```bash
# Exec into a pod and test connection
kubectl exec -it <pod-name> -n axon -- /bin/sh
python -c "import asyncio, asyncpg; asyncio.run(asyncpg.connect('postgresql://...'))"
```

---

## Cost Breakdown

### Monthly Estimate (All Services)

| Service              | Specification              | Monthly Cost |
| -------------------- | -------------------------- | ------------ |
| EC2 Master           | t3.medium, on-demand       | ~$30         |
| EC2 Worker           | t3.medium, on-demand       | ~$30         |
| EBS Storage (2x30GB) | gp3                        | ~$5          |
| Supabase             | Free tier                  | $0           |
| Docker Hub           | Free tier                  | $0           |
| Vercel               | Free tier                  | $0           |
| DuckDNS              | Free                       | $0           |
| Let's Encrypt        | Free                       | $0           |
| GitHub Actions        | Free tier (2000 min/month) | $0           |
| **Total**            |                            | **~$65/month** |

### Cost Saving Tips

- **Spot instances:** Use t3.medium spot (~60-70% cheaper, ~$10-12/month each)
- **Stop when not demoing:** Stop EC2s overnight → ~50% savings
- **Reserved instances:** If running 1+ month → ~30% savings
- **Tear down after course:** Delete everything to stop charges

### Tear Down Checklist

```bash
# 1. Delete K8s resources
kubectl delete namespace axon
kubectl delete namespace monitoring

# 2. Terminate EC2 instances (AWS Console or CLI)
aws ec2 terminate-instances --instance-ids i-xxxxx i-yyyyy

# 3. Delete security group
aws ec2 delete-security-group --group-id sg-xxxxx

# 4. Remove DuckDNS subdomain (optional)
# 5. Delete Docker Hub repository (optional)
# 6. Pause Supabase project (Settings → Pause)
```

---

## Syllabus Coverage Map

This deployment covers the following INT334 course outcomes:

| Requirement (Syllabus)                              | Where Covered               |
| --------------------------------------------------- | --------------------------- |
| Containerization (Docker)                            | Phase 1 — Dockerfile        |
| kubeadm cluster setup                                | Phase 5 — EC2 cluster       |
| Minikube / Kind local setup                          | Phase 4 — Kind              |
| Deployments, Services, Ingress                       | Phase 3, 6 — K8s manifests  |
| PV, PVC, StorageClass                                | Phase 3 — storage.yaml      |
| Horizontal Pod Autoscaling                           | Phase 8 — HPA               |
| Resource Requests and Limits                         | Phase 3 — deployment.yaml   |
| RBAC, Secrets, ConfigMaps                            | Phase 3 — secrets, configmap |
| Prometheus installation + config                     | Phase 7 — Helm chart        |
| Grafana dashboards                                   | Phase 7 — dashboard import  |
| Alertmanager setup                                   | Phase 7 — alert rules       |
| Helm chart management                                | Phase 7 — kube-prometheus-stack |
| PromQL queries                                       | Phase 7 — Grafana explore   |
| Metrics collection + service discovery               | Phase 7 — scrape configs    |
| Monitoring Node, Pod, Container metrics              | Phase 7 — dashboards        |
| Automating monitoring with Helm                      | Phase 7 — Helm install      |
| End-to-end monitoring pipeline                       | Full pipeline               |

---

*Last updated: 2025*
*Project: Axon AI Platform*
*Author: Vedant Lahane*
```

This covers every phase we discussed. You can drop this directly into `docs/DEPLOYMENT.md`. Want me to start implementing **Phase 1 (Dockerfile)** now?