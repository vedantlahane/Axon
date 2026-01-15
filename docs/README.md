# Axon Documentation

Comprehensive documentation for the Axon AI-Powered Document & Database Intelligence Platform.

## 📚 Documentation Index

### Deployment & Operations
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Complete production deployment guide
  - Infrastructure setup with Ansible
  - Security configuration
  - API keys setup
  - Troubleshooting common issues
  - Monitoring with Nagios

### Infrastructure
- **[ansible/README.md](../ansible/README.md)** - Ansible automation guide
  - Playbook documentation
  - Secrets management with Ansible Vault
  - Quick deployment commands
- **[ansible/VAULT_SETUP.md](../ansible/VAULT_SETUP.md)** - Detailed Ansible Vault guide
  - Encrypting secrets
  - Managing API keys securely
  - Vault commands reference

### Frontend
- **[frontend/README.md](../frontend/README.md)** - Frontend development guide
  - Installation & setup
  - Available scripts
  - Technology stack
  - Deployment to Vercel

### Presentations
- **[presentation/](presentation/)** - Project presentation materials
  - PRESENTATION_SCRIPT.md - Speaker notes and talking points
  - PRESENTATION_SLIDES.md - Slide deck content

## 🚀 Quick Links

### For Developers
- Start here: [Main README](../README.md)
- Backend setup: [Main README - Backend Setup](../README.md#2-backend-setup)
- Frontend setup: [Frontend README](../frontend/README.md)

### For DevOps/Deployment
- **Start here: [DEPLOYMENT.md](DEPLOYMENT.md)**
- Ansible quickstart: [ansible/README.md](../ansible/README.md#-usage)
- Secrets management: [ansible/README.md - Secrets Management](../ansible/README.md#-secrets-management)

### For Presentations
- Speaker notes: [presentation/PRESENTATION_SCRIPT.md](presentation/PRESENTATION_SCRIPT.md)
- Slide content: [presentation/PRESENTATION_SLIDES.md](presentation/PRESENTATION_SLIDES.md)

## 🔍 What's Where?

```
Axon/
├── README.md                          # Main project overview & quick start
├── docs/
│   ├── README.md                      # This file - documentation index
│   ├── DEPLOYMENT.md                  # Production deployment guide
│   └── presentation/                  # Presentation materials
│       ├── PRESENTATION_SCRIPT.md     # Speaker notes
│       └── PRESENTATION_SLIDES.md     # Slide deck
├── ansible/
│   ├── README.md                      # Ansible automation guide
│   └── VAULT_SETUP.md                 # Ansible Vault documentation
└── frontend/
    └── README.md                      # Frontend development guide
```

## ❓ Getting Help

### Common Tasks

**I want to deploy Axon to production:**
→ Follow [DEPLOYMENT.md](DEPLOYMENT.md)

**I need to set up API keys securely:**
→ See [ansible/README.md - Secrets Management](../ansible/README.md#-secrets-management)

**I want to develop the frontend:**
→ Check [frontend/README.md](../frontend/README.md)

**I need to present this project:**
→ Use [presentation/PRESENTATION_SCRIPT.md](presentation/PRESENTATION_SCRIPT.md)

**I'm getting deployment errors:**
→ Check [DEPLOYMENT.md - Common Issues](DEPLOYMENT.md#common-issues--solutions)

**I want to contribute:**
→ Start with the [Main README](../README.md)
