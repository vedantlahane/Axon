# Deployment Guide

Complete guide for deploying Axon to production using Ansible automation.

## Table of Contents
- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Deployment Steps](#deployment-steps)
- [Common Issues & Solutions](#common-issues--solutions)
- [Infrastructure Details](#infrastructure-details)

---

## Quick Start

### 1. Generate Secret Key
```bash
cd /home/vedant/Desktop/Axon
python3 scripts/generate_secret_key.py
```

### 2. Configure Ansible Vault
```bash
cd ansible
# Edit encrypted secrets
ansible-vault edit inventory/group_vars/vault.yml --vault-password-file .vault_password
```

### 3. Deploy Backend
```bash
cd ansible
ansible-playbook -i inventory/hosts.ini playbooks/deploy_backend.yml --vault-password-file .vault_password
```

---

## Prerequisites

### Required Tools
- Python 3.13+
- Ansible 2.9+
- SSH access to target EC2 instances
- AWS EC2 instances running Ubuntu/Debian

### Required Credentials
- SSH key pair (axon.pem)
- OpenAI API key
- Tavily API key (optional but recommended)
- Django secret key

---

## Initial Setup

### Backend Security Configuration

The following environment variables are configured in Django settings:

- `DJANGO_SECRET_KEY` - Secure random string (generate using `scripts/generate_secret_key.py`)
- `DJANGO_DEBUG` - Set to 'False' for production
- `DJANGO_ALLOWED_HOSTS` - EC2 IP and domain names
- `FRONTEND_ORIGINS` - Vercel deployment URLs for CORS

These are automatically applied via Ansible during deployment.

### Database Configuration

**Important:** Axon uses SQLite by default. For production:

**Option A: SQLite (Current Setup)**
- ✅ Gunicorn workers MUST be set to 1
- ✅ Already configured in `ansible/inventory/group_vars/webserver.yml`
- ⚠️ Limited to single-server deployment

**Option B: PostgreSQL (Recommended for Scale)**
- Allows multiple Gunicorn workers
- Better for high-traffic deployments
- Requires additional setup

---

## Deployment Steps

### Step 1: Prepare Backend Server

```bash
cd /home/vedant/Desktop/Axon
ansible-playbook -i ansible/inventory/hosts.ini ansible/playbooks/setup_backend.yml
```

This will:
- Install Python, pip, git
- Create `axon` system user
- Set up virtual environment
- Install system dependencies

### Step 2: Deploy Backend Application

```bash
ansible-playbook -i ansible/inventory/hosts.ini ansible/playbooks/deploy_backend.yml --vault-password-file ansible/.vault_password
```

This will:
- Clone/update repository
- Install Python dependencies
- Configure environment variables
- Set up Gunicorn systemd service
- Collect static files
- Run database migrations
- Start the backend service

### Step 3: Deploy Monitoring (Optional)

```bash
ansible-playbook -i ansible/inventory/hosts.ini ansible/playbooks/provision_ngaios.yml
```

This sets up Nagios monitoring with:
- Backend health checks
- System resource monitoring
- Web interface at monitoring server IP

---

## Common Issues & Solutions

### Issue 1: Database Locking (500 Error on Chat)

**Symptoms:**
```
OperationalError at /api/chat/
HTTP 500 error when sending messages
```

**Root Cause:** Multiple Gunicorn workers trying to write to SQLite simultaneously.

**Solution:** Already fixed in current deployment
- Gunicorn workers set to 1 in `webserver.yml`
- Verified in deployment playbook

**If issue persists:**
```bash
# SSH into EC2 instance
ssh -i ~/Downloads/axon.pem ubuntu@ec2-13-235-83-16.ap-south-1.compute.amazonaws.com

# Verify Gunicorn config
sudo cat /etc/systemd/system/axon-gunicorn.service | grep workers

# Should show: --workers 1

# If not, restart service
sudo systemctl daemon-reload
sudo systemctl restart axon-gunicorn
```

### Issue 2: AI Not Responding

**Symptoms:**
```
"Sorry, I could not generate a response right now."
```

**Root Cause:** Missing or invalid OpenAI API key.

**Solution:**
1. Get API key from https://platform.openai.com/api-keys
2. Update Ansible Vault:
```bash
cd ansible
ansible-vault edit inventory/group_vars/vault.yml --vault-password-file .vault_password
```
3. Update the `openai_api_key` value
4. Redeploy:
```bash
ansible-playbook -i inventory/hosts.ini playbooks/deploy_backend.yml --vault-password-file .vault_password
```

### Issue 3: CORS Errors from Frontend

**Symptoms:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:** Update `FRONTEND_ORIGINS` in `inventory/group_vars/webserver.yml` to include all Vercel deployment URLs:
```yaml
FRONTEND_ORIGINS: 'https://axoncanvas.vercel.app,https://axon-*.vercel.app'
```

Then redeploy backend.

### Issue 4: Static Files Not Loading

**Solution:**
```bash
# SSH into backend server
cd /home/axon/Axon/backend
source /home/axon/.venv/bin/activate
python manage.py collectstatic --noinput

# Restart Gunicorn
sudo systemctl restart axon-gunicorn
```

---

## Infrastructure Details

### Current Production Setup

**Backend Server**
- Host: ec2-13-235-83-16.ap-south-1.compute.amazonaws.com
- Region: ap-south-1 (Mumbai)
- Service: Gunicorn (1 worker) + Django
- Database: SQLite
- Status: ✅ Operational

**Frontend**
- Platform: Vercel
- URL: https://axoncanvas.vercel.app
- Auto-deployment: main branch
- Status: ✅ Operational

**Monitoring Server**
- Host: ec2-15-206-165-206.ap-south-1.compute.amazonaws.com
- Service: Nagios 4.5.3
- Web UI: http://ec2-15-206-165-206.ap-south-1.compute.amazonaws.com/nagios
- Credentials: vedant / 9420
- Status: ✅ Operational

### Ansible Configuration

**Files Structure:**
```
ansible/
├── inventory/
│   ├── hosts.ini                 # Server definitions
│   └── group_vars/
│       ├── webserver.yml         # Backend configuration
│       ├── monitoring.yml        # Nagios configuration
│       └── vault.yml            # Encrypted secrets (API keys)
├── playbooks/
│   ├── setup_backend.yml        # Initial server setup
│   ├── deploy_backend.yml       # Application deployment
│   └── provision_ngaios.yml     # Monitoring setup
└── templates/
    ├── axon-gunicorn.service.j2
    ├── axon.env.j2
    └── nagios-axon-backend.cfg.j2
```

### Environment Variables (Production)

Configured via Ansible in production:

```bash
# Django Settings
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=[Generated secure key]
DJANGO_ALLOWED_HOSTS=ec2-13-235-83-16.ap-south-1.compute.amazonaws.com,axoncanvas.vercel.app
FRONTEND_ORIGINS=https://axoncanvas.vercel.app,https://axon-*.vercel.app

# AI API Keys
OPENAI_API_KEY=[Encrypted in vault.yml]
TAVILY_API_KEY=[Encrypted in vault.yml]
LANGCHAIN_API_KEY=[Optional - for debugging]

# Database
# Uses SQLite by default - no additional config needed
```

### Security Best Practices

✅ **Implemented:**
- Debug mode disabled in production
- Secret key stored in Ansible Vault (encrypted)
- API keys encrypted with Ansible Vault (AES256)
- Vault password stored locally only (`.vault_password` in .gitignore)
- CORS properly configured with frontend origins
- SSH key-based authentication

⚠️ **Recommendations:**
- Consider migrating to PostgreSQL for better scalability
- Set up SSL/TLS certificates (Let's Encrypt)
- Implement rate limiting on API endpoints
- Set up automated backups for database
- Configure log rotation

---

## API Keys Setup

### OpenAI API Key (Required)

**Get it here:** https://platform.openai.com/api-keys

1. Sign in to OpenAI platform
2. Navigate to API Keys section
3. Create new secret key
4. Copy the key (starts with `sk-...`)
5. Add to Ansible Vault (see deployment steps)

**Cost:** Pay-as-you-go pricing
- ~$0.002-0.03 per 1K tokens
- Requires payment method

### Tavily API Key (Recommended)

**Get it here:** https://app.tavily.com/

1. Sign up for free account
2. Copy API key from dashboard
3. Add to Ansible Vault

**Cost:** Free tier available
- 1000 searches/month

### LangChain API Key (Optional)

**Get it here:** https://smith.langchain.com/

Used for AI interaction debugging and tracing.

---

## Troubleshooting

### Check Service Status
```bash
# SSH into backend server
ssh -i ~/Downloads/axon.pem ubuntu@<backend-ip>

# Check Gunicorn service
sudo systemctl status axon-gunicorn

# View logs
sudo journalctl -u axon-gunicorn -n 50 -f
```

### Test Backend Health
```bash
curl http://<backend-ip>/api/health/
# Should return: {"status": "healthy"}
```

### Verify Environment Variables
```bash
# SSH into backend server
sudo cat /etc/systemd/system/axon-gunicorn.service
# Check EnvironmentFile path

# View environment file (sensitive!)
sudo cat /home/axon/Axon/backend/.env
```

### Database Issues
```bash
# SSH into backend server
cd /home/axon/Axon/backend
source /home/axon/.venv/bin/activate

# Run migrations
python manage.py migrate

# Create superuser if needed
python manage.py createsuperuser
```

---

## Rollback Procedures

If deployment fails:

```bash
# SSH into backend server
cd /home/axon/Axon

# Check git log
git log --oneline -5

# Rollback to previous commit
git checkout <previous-commit-hash>

# Restart service
sudo systemctl restart axon-gunicorn
```

---

## Support

For issues or questions:
- Check logs: `sudo journalctl -u axon-gunicorn -n 100`
- Review Ansible playbook outputs
- Verify all API keys are set correctly in vault
- Ensure `.vault_password` file exists with correct password
