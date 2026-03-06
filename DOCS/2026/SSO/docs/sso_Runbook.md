# SSO - Release Runbook

**Version**: 1.0
**Last Updated**: [Date]
**Owner**: IT Infrastructure & Operation

---

## System Overview

| Component | Description |
|-----------|-------------|
| Application | SSO Service |
| IdP Provider | Azure AD / Okta |
| Protocol | SAML 2.0, OIDC |
| Provisioning | SCIM 2.0 |

---

## Pre-Deployment Checklist

| Task | Status | Owner |
|------|--------|-------|
| Backup current configuration | ☐ | |
| Verify IdP connection settings | ☐ | |
| Test certificates validity | ☐ | |
| Notify stakeholders | ☐ | |

---

## Deployment Steps

### 1. Deploy Application
```bash
# Pull latest image
docker pull [registry]/sso-service:[version]

# Deploy to staging
kubectl apply -f k8s/staging/

# Run smoke tests
./scripts/smoke-test.sh staging

# Deploy to production
kubectl apply -f k8s/production/

# Verify deployment
kubectl rollout status deployment/sso-service
```

### 2. Configure IdP Connection
```bash
# Update IdP metadata
./scripts/update-idp-metadata.sh [idp-entity-id]

# Verify connection
./scripts/test-sso-connection.sh
```

### 3. Enable SCIM
```bash
# Configure SCIM endpoint
./scripts/configure-scim.sh [scim-token]

# Test provisioning
./scripts/test-scim-sync.sh
```

---

## Rollback Procedure

If deployment fails:

```bash
# Rollback to previous version
kubectl rollout undo deployment/sso-service

# Verify rollback
kubectl rollout status deployment/sso-service

# Notify stakeholders
```

---

## Post-Deployment Verification

| Check | Command/URL | Expected |
|-------|-------------|----------|
| Health endpoint | `GET /health` | 200 OK |
| SSO Login | `GET /auth/sso` | Redirect to IdP |
| SCIM endpoint | `GET /scim/Users` | 200 OK |
| Certificate expiry | `openssl s_client` | > 30 days |

---

## Monitoring

| Metric | Alert Threshold | Dashboard |
|--------|-----------------|-----------|
| Auth success rate | < 99% | [Link] |
| Response time | > 2s | [Link] |
| Error rate | > 1% | [Link] |
| Active sessions | [baseline] | [Link] |

---

## Support Contacts

| Role | Name | Contact |
|------|------|---------|
| On-call | [Name] | [Phone/Email] |
| Tech Lead | [Name] | [Phone/Email] |
| IdP Vendor | [Support] | [Phone/Email] |

---

## Troubleshooting

| Issue | Possible Cause | Resolution |
|-------|----------------|------------|
| SSO login fails | Certificate expired | Renew certificate |
| SCIM sync fails | Token invalid | Regenerate SCIM token |
| High latency | Resource constraint | Scale up pods |

---

[Planning Document](../sso_plan_draft.md)
