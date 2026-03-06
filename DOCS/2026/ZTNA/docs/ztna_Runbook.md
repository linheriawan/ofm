# ZTNA - Release Runbook

**Version**: 1.0
**Last Updated**: [Date]
**Owner**: IT Infrastructure & Operation

---

## System Overview

| Component | Description |
|-----------|-------------|
| Platform | Cloudflare Zero Trust |
| Tunnel Daemon | cloudflared |
| Access Types | Web, RDP, SSH, Custom TCP |
| Authentication | SSO + Service Tokens |

---

## Pre-Deployment Checklist

| Task | Status | Owner |
|------|--------|-------|
| Cloudflare Zero Trust account ready | ☐ | |
| SSO/IdP integration tested | ☐ | |
| Server inventory documented | ☐ | |
| Rollback procedure documented | ☐ | |
| Stakeholders notified | ☐ | |

---

## Deployment Steps

### 1. Cloudflare Zero Trust Setup
```bash
# Login to Cloudflare Zero Trust Dashboard
# Navigate to: https://one.dash.cloudflare.com/

# Create Access Groups
# - All Users
# - IT Admins
# - Developers

# Configure Identity Provider
# - Add SSO provider (Azure AD / Okta / Google)
# - Test SSO connection
```

### 2. Deploy Cloudflare Tunnel
```bash
# Install cloudflared on gateway server
# Debian/Ubuntu
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Install and run tunnel
cloudflared tunnel login
cloudflared tunnel create --name ztna-tunnel
cloudflared tunnel run ztna-tunnel

# Configure as systemd service
cloudflared service install
```

### 3. Configure Web App Tunnel
```yaml
# /etc/cloudflared/config.yml
tunnel: ztna-tunnel
credentials-file: /root/.cloudflared/uuid.json

ingress:
  - hostname: app.internal.company.com
    service: http://localhost:8080
  - hostname: api.internal.company.com
    service: http://localhost:3000
  - service: http_status:404
```

### 4. Configure RDP/SSH Tunnel
```yaml
# /etc/cloudflared/config.yml
tunnel: ztna-tunnel

ingress:
  - hostname: ssh.internal.company.com
    service: tcp://localhost:22
  - hostname: rdp.internal.company.com
    service: tcp://localhost:3389
  - service: http_status:404
```

### 5. Configure Access Policies
```bash
# In Cloudflare Zero Trust Dashboard:
# Access > Applications > Add Application

# For Web Apps:
# - Policy: Allow SSO users
# - Device posture: [requirements]

# For SSH/RDP:
# - Policy: Allow specific groups
# - Service Auth: Generate Service Token
```

### 6. Server-to-Server Tunnel
```bash
# Generate Service Token
# Access > Service Auth > Add Service Token
# - Name: server-a-to-b
# - Service: server-b.internal.company.com
# - Duration: 1 year

# On Server A, configure cloudflared with Service Token
export TUNNEL_SERVICE_TOKEN_ID=<token-id>
export TUNNEL_SERVICE_TOKEN_SECRET=<token-secret>
```

---

## Public IP Removal Procedure

### Per-Server Checklist
| Step | Action | Status |
|------|--------|--------|
| 1 | Verify tunnel connectivity | ☐ |
| 2 | Test access via ZTNA | ☐ |
| 3 | Notify users of maintenance | ☐ |
| 4 | Remove public IP assignment | ☐ |
| 5 | Verify services still accessible | ☐ |
| 6 | Update documentation | ☐ |
| 7 | Close maintenance window | ☐ |

### Rollback Procedure
```bash
# If issues detected after IP removal:

# 1. Re-assign public IP
# [Cloud provider specific command]

# 2. Update DNS if needed
# [DNS provider specific command]

# 3. Notify stakeholders
# [Communication template]

# Target: Restore within 30 minutes
```

---

## Monitoring

| Metric | Dashboard | Alert Threshold |
|--------|-----------|-----------------|
| Tunnel status | Cloudflare Dashboard | Tunnel down |
| Connection success rate | Cloudflare Logs | < 99% |
| Access denied rate | Cloudflare Logs | > 10% |
| Latency | Cloudflare Dashboard | > 500ms |

---

## Support Contacts

| Role | Name | Contact |
|------|------|---------|
| On-call | [Name] | [Phone/Email] |
| Tech Lead | [Name] | [Phone/Email] |
| Cloudflare Support | Enterprise | [Portal/Phone] |

---

## Troubleshooting

| Issue | Possible Cause | Resolution |
|-------|----------------|------------|
| Tunnel disconnected | Network issue, daemon stopped | Restart cloudflared service |
| Access denied | Policy misconfiguration | Review Access policies |
| High latency | Network path issue | Check Cloudflare status |
| SSH/RDP timeout | TCP tunnel misconfigured | Verify ingress config |

---

[Planning Document](../ztna_plan_draft.md)
