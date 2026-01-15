# Axon Ansible Playbooks

Infrastructure automation for provisioning and deploying the Axon backend services.

## 📁 Structure

```
ansible/
├── inventory/
│   ├── hosts.ini                      # Server definitions (web + monitoring)
│   └── group_vars/
│       ├── webserver.yml              # Backend host variables
│       ├── monitoring.yml             # Nagios admin creds + monitored hosts
│       └── vault.yml                  # Encrypted secrets (API keys)
├── playbooks/
│   ├── setup_backend.yml              # Base OS preparation
│   ├── deploy_backend.yml             # Deploy Django backend via Gunicorn
│   └── provision_ngaios.yml           # Install Nagios monitoring
├── templates/
│   ├── axon-gunicorn.service.j2       # Systemd unit for Gunicorn
│   ├── axon.env.j2                    # Environment variables template
│   └── nagios-axon-backend.cfg.j2     # Nagios host + service definitions
└── README.md
```

## 🚀 Usage

### Prerequisites

- Ansible 2.9+
- SSH access to target servers
- Python 3.x on target hosts
- API keys (OpenAI, Tavily)

### Quick Start

1. Update `inventory/hosts.ini` with your server IPs and SSH key paths
2. Configure secrets in Ansible Vault (see [Secrets Management](#-secrets-management))
3. Run playbooks in order:

```bash
# 1. Prepare the server (install dependencies, create users)
ansible-playbook -i inventory/hosts.ini playbooks/setup_backend.yml

# 2. Deploy the Django backend with vault
ansible-playbook -i inventory/hosts.ini playbooks/deploy_backend.yml --vault-password-file .vault_password

# 3. Set up monitoring (optional)
ansible-playbook -i inventory/hosts.ini playbooks/provision_ngaios.yml
```

## 🔐 Secrets Management

### Required API Keys

Axon requires the following API keys for full functionality:

1. **OPENAI_API_KEY** (Required) - For AI chat functionality
   - Get it: https://platform.openai.com/api-keys
   - Cost: Pay-as-you-go (~$0.002-0.03 per 1K tokens)

2. **TAVILY_API_KEY** (Recommended) - For web search functionality
   - Get it: https://app.tavily.com/
   - Cost: Free tier (1000 searches/month)

3. **LANGCHAIN_API_KEY** (Optional) - For AI debugging/tracing
   - Get it: https://smith.langchain.com/

### Setting Up Ansible Vault

All sensitive data (API keys, secret keys) are encrypted using Ansible Vault.

**Initial Setup:**
```bash
cd ansible

# The vault password is: axon-vault-2024
# Store it in a local file (NOT committed to git)
echo "axon-vault-2024" > .vault_password
chmod 600 .vault_password
```

**Edit Secrets:**
```bash
# Edit encrypted vault file
ansible-vault edit inventory/group_vars/vault.yml --vault-password-file .vault_password
```

**Vault File Contents:**
```yaml
# Variables stored in vault.yml (encrypted)
django_secret_key: 'your-generated-django-secret-key'
openai_api_key: 'sk-proj-...'
tavily_api_key: 'tvly-...'
langchain_api_key: 'lsv2_pt_...'  # Optional
```

**View Secrets (without editing):**
```bash
ansible-vault view inventory/group_vars/vault.yml --vault-password-file .vault_password
```

**Generate Django Secret Key:**
```bash
cd ..  # Go back to project root
python3 scripts/generate_secret_key.py
# Copy the generated key and add it to vault.yml
```

### Deploying with Vault

When running playbooks that use encrypted variables:

```bash
# Using password file (recommended)
ansible-playbook -i inventory/hosts.ini playbooks/deploy_backend.yml --vault-password-file .vault_password

# Or prompt for password
ansible-playbook -i inventory/hosts.ini playbooks/deploy_backend.yml --ask-vault-pass
```

### Security Best Practices

✅ **DO:**
- Keep vault password secure (use password manager)
- Commit encrypted `vault.yml` to git
- Use `.vault_password` file for convenience (already in .gitignore)

❌ **DON'T:**
- Commit plaintext API keys
- Share vault password via chat/email
- Commit `.vault_password` file

## ⚙️ Backend Deployment

The `deploy_backend.yml` playbook:

- Deploys Django backend with Gunicorn as a systemd service (`axon-gunicorn`)
- Loads environment from `/etc/axon/axon.env`
- Automatically decrypts and applies secrets from vault
- Configurable via `inventory/group_vars/webserver.yml`:
  - `gunicorn_bind`: Address and port (default: `0.0.0.0:8000`)
  - `gunicorn_workers`: Number of workers (use `1` for SQLite)
  - `gunicorn_timeout`: Request timeout
  - `backend_env`: Additional environment variables (references vault variables)

> **Note**: For production, use PostgreSQL/MySQL instead of SQLite to avoid "database is locked" errors with multiple workers.

## 📊 Monitoring

The `provision_ngaios.yml` playbook sets up Nagios monitoring:

- Checks Gunicorn TCP port availability
- Monitors HTTP health endpoint (`/api/health/`)
- OS-aware: Uses apt on Debian/Ubuntu systems

Configure in `inventory/group_vars/monitoring.yml`:
- `nagios_version`
- `nagios_plugins_version`
- Monitored host/port/path settings

## 📚 Additional Documentation

- **Deployment Guide**: See `../docs/DEPLOYMENT.md` for comprehensive deployment instructions
- **Vault Details**: See `VAULT_SETUP.md` for in-depth Ansible Vault documentation
