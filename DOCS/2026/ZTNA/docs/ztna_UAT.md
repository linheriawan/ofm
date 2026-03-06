# UAT Sign-off Document

**Project**: Zero Trust Network Access (ZTNA)
**Version**: 1.0
**UAT Period**: [Start Date] - [End Date]
**UAT Environment**: [Production / Staging]

---

## UAT Summary

| Item | Status |
|------|--------|
| Total Test Scenarios | 20 |
| Passed | [ ] |
| Failed | [ ] |
| Blocked | [ ] |
| UAT Result | ☐ PASS ☐ FAIL (with conditions) |

---

# 1. Web Application Access

## 1.1 Internal Web App Access
| Test ID | Scenario | Expected Result | Actual | Status | Sign-off |
|---------|----------|-----------------|--------|--------|----------|
| WEB-01 | User accesses internal web app via browser | Page loads successfully | | ☐ Pass ☐ Fail | |
| WEB-02 | SSO authentication required | Redirect to IdP login | | ☐ Pass ☐ Fail | |
| WEB-03 | Access policy enforced | Authorized user granted access | | ☐ Pass ☐ Fail | |
| WEB-04 | Unauthorized user denied | Access denied message shown | | ☐ Pass ☐ Fail | |

---

# 2. RDP/SSH Access

## 2.1 SSH Access
| Test ID | Scenario | Expected Result | Actual | Status | Sign-off |
|---------|----------|-----------------|--------|--------|----------|
| SSH-01 | User SSH via tunnel | Connection established | | ☐ Pass ☐ Fail | |
| SSH-02 | SSH authentication | User authenticated to server | | ☐ Pass ☐ Fail | |
| SSH-03 | Custom SSH port | Port forwarding works | | ☐ Pass ☐ Fail | |

## 2.2 RDP Access
| Test ID | Scenario | Expected Result | Actual | Status | Sign-off |
|---------|----------|-----------------|--------|--------|----------|
| RDP-01 | User RDP via tunnel | Desktop accessible | | ☐ Pass ☐ Fail | |
| RDP-02 | RDP authentication | User logged in | | ☐ Pass ☐ Fail | |
| RDP-03 | RDP session stability | Session stable > 1 hour | | ☐ Pass ☐ Fail | |

---

# 3. Host-to-Host Connectivity

| Test ID | Scenario | Expected Result | Actual | Status | Sign-off |
|---------|----------|-----------------|--------|--------|----------|
| H2H-01 | Server A calls Server B API | 200 OK response | | ☐ Pass ☐ Fail | |
| H2H-02 | Service Token authentication | Authenticated successfully | | ☐ Pass ☐ Fail | |
| H2H-03 | Isolated network access | Resource accessible | | ☐ Pass ☐ Fail | |
| H2H-04 | Database connection via tunnel | Connection successful | | ☐ Pass ☐ Fail | |

---

# 4. Public IP Removal

## 4.1 Pre-Removal Validation
| Test ID | Scenario | Expected Result | Actual | Status | Sign-off |
|---------|----------|-----------------|--------|--------|----------|
| IP-01 | ZTNA access verified before removal | All services accessible | | ☐ Pass ☐ Fail | |
| IP-02 | Rollback procedure documented | Document available | | ☐ Pass ☐ Fail | |

## 4.2 Post-Removal Validation
| Test ID | Scenario | Expected Result | Actual | Status | Sign-off |
|---------|----------|-----------------|--------|--------|----------|
| IP-03 | Services accessible after IP removal | No disruption | | ☐ Pass ☐ Fail | |
| IP-04 | Public IP ping fails | IP unreachable | | ☐ Pass ☐ Fail | |
| IP-05 | Direct IP access blocked | Connection refused | | ☐ Pass ☐ Fail | |

---

# 5. Performance & Reliability

| Test ID | Scenario | Expected Result | Actual | Status | Sign-off |
|---------|----------|-----------------|--------|--------|----------|
| PERF-01 | Web app load time | < 500ms | | ☐ Pass ☐ Fail | |
| PERF-02 | SSH connection time | < 300ms | | ☐ Pass ☐ Fail | |
| PERF-03 | RDP session latency | < 500ms | | ☐ Pass ☐ Fail | |
| PERF-04 | Tunnel stability (24h) | 99.9% uptime | | ☐ Pass ☐ Fail | |

---

# 6. Security Validation

| Test ID | Scenario | Expected Result | Actual | Status | Sign-off |
|---------|----------|-----------------|--------|--------|----------|
| SEC-01 | Revoked user access | Access denied | | ☐ Pass ☐ Fail | |
| SEC-02 | Expired Service Token | Authentication failed | | ☐ Pass ☐ Fail | |
| SEC-03 | Non-compliant device | Access denied | | ☐ Pass ☐ Fail | |
| SEC-04 | Access logs recorded | Logs visible in dashboard | | ☐ Pass ☐ Fail | |

---

# UAT Issues Log

| Issue ID | Related Test | Description | Severity | Status |
|----------|--------------|-------------|----------|--------|
| UAT-001 | | | ☐ Critical ☐ High ☐ Medium ☐ Low | Open |

---

# UAT Approval

**UAT Completion Date**: [Date]

| Role | Name | Signature | Date | Decision |
|------|------|-----------|------|----------|
| Product Owner | IT Infrastructure | | | ☐ Approved ☐ Rejected |
| Project Manager | IT Operation Div Head | | | ☐ Approved ☐ Rejected |
| Tech Lead | [Name] | | | ☐ Approved ☐ Rejected |
| Security Lead | IT Security | | | ☐ Approved ☐ Rejected |

---

**Notes**:
- All Critical/High issues must be resolved before approval
- Medium/Low issues can be deferred with agreed timeline
- This sign-off confirms ZTNA MVP meets Acceptance Criteria
- Public IP Removal can proceed after UAT approval

[Planning Document](plan_draft_ztna_id.md#22-acceptance-criteria-ac) | [AC Details](docs/AC_MVP.md)
