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
│       └── vault.yml                  # Encrypted secrets (optional)
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

### Quick Start

1. Update `inventory/hosts.ini` with your server IPs and SSH key paths
2. Adjust variables in `inventory/group_vars/` as needed
3. Run playbooks in order:

```bash
# 1. Prepare the server (install dependencies, create users)
ansible-playbook -i ansible/inventory/hosts.ini ansible/playbooks/setup_backend.yml

# 2. Deploy the Django backend
ansible-playbook -i ansible/inventory/hosts.ini ansible/playbooks/deploy_backend.yml

# 3. Set up monitoring (optional)
ansible-playbook -i ansible/inventory/hosts.ini ansible/playbooks/provision_ngaios.yml
```

## ⚙️ Backend Deployment

The `deploy_backend.yml` playbook:

- Deploys Django backend with Gunicorn as a systemd service (`axon-gunicorn`)
- Loads environment from `/etc/axon/axon.env`
- Configurable via `inventory/group_vars/webserver.yml`:
  - `gunicorn_bind`: Address and port (default: `0.0.0.0:8000`)
  - `gunicorn_workers`: Number of workers (use `1` for SQLite)
  - `gunicorn_timeout`: Request timeout
  - `backend_env`: Additional environment variables

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
