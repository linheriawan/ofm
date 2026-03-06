# UAT Sign-off Document

**Project**: Single Sign-On (SSO)
**Version**: 1.0
**UAT Period**: [Start Date] - [End Date]
**UAT Environment**: [Staging URL]

---

## UAT Summary

| Item | Status |
|------|--------|
| Total Test Scenarios | 15 |
| Passed | [ ] |
| Failed | [ ] |
| Blocked | [ ] |
| UAT Result | ☐ PASS ☐ FAIL (with conditions) |

---

# 1. SSO Login

## 1.1 Successful Login
| Test ID | Scenario | Expected Result | Actual | Status | Sign-off |
|---------|----------|-----------------|--------|--------|----------|
| SSO-01 | User clicks "Login with SSO" | Redirected to IdP | | ☐ Pass ☐ Fail | |
| SSO-02 | User enters valid credentials | Authentication successful | | ☐ Pass ☐ Fail | |
| SSO-03 | User redirected to dashboard | Dashboard loads | | ☐ Pass ☐ Fail | |
| SSO-04 | Session token created | Token stored securely | | ☐ Pass ☐ Fail | |

## 1.2 Failed Login Handling
| Test ID | Scenario | Expected Result | Actual | Status | Sign-off |
|---------|----------|-----------------|--------|--------|----------|
| SSO-05 | User enters invalid credentials | Error message displayed | | ☐ Pass ☐ Fail | |
| SSO-06 | User can retry login | Retry option available | | ☐ Pass ☐ Fail | |
| SSO-07 | Account lockout after N failures | Account locked | | ☐ Pass ☐ Fail | |

## 1.3 Session Timeout
| Test ID | Scenario | Expected Result | Actual | Status | Sign-off |
|---------|----------|-----------------|--------|--------|----------|
| SSO-08 | Session expires (idle > 30 min) | Redirected to login | | ☐ Pass ☐ Fail | |
| SSO-09 | "Session expired" message shown | Message displayed | | ☐ Pass ☐ Fail | |
| SSO-10 | User can re-login | Re-authentication successful | | ☐ Pass ☐ Fail | |

---

# 2. SCIM Provisioning

## 2.1 User Creation
| Test ID | Scenario | Expected Result | Actual | Status | Sign-off |
|---------|----------|-----------------|--------|--------|----------|
| SCIM-01 | New user created in IdP | User auto-created in app | | ☐ Pass ☐ Fail | |
| SCIM-02 | Welcome email sent | Email received | | ☐ Pass ☐ Fail | |

## 2.2 User Attribute Sync
| Test ID | Scenario | Expected Result | Actual | Status | Sign-off |
|---------|----------|-----------------|--------|--------|----------|
| SCIM-03 | User email changed in IdP | Email updated in app | | ☐ Pass ☐ Fail | |
| SCIM-04 | User name changed in IdP | Name updated in app | | ☐ Pass ☐ Fail | |

## 2.3 User Deactivation
| Test ID | Scenario | Expected Result | Actual | Status | Sign-off |
|---------|----------|-----------------|--------|--------|----------|
| SCIM-05 | User disabled in IdP | User disabled in app | | ☐ Pass ☐ Fail | |
| SCIM-06 | Active sessions terminated | User logged out everywhere | | ☐ Pass ☐ Fail | |
| SCIM-07 | Disabled user cannot login | Access denied | | ☐ Pass ☐ Fail | |

---

# 3. Security

## 3.1 MFA Enforcement
| Test ID | Scenario | Expected Result | Actual | Status | Sign-off |
|---------|----------|-----------------|--------|--------|----------|
| SEC-01 | User login requires MFA | MFA challenge presented | | ☐ Pass ☐ Fail | |
| SEC-02 | User completes MFA | Access granted | | ☐ Pass ☐ Fail | |
| SEC-03 | User fails MFA | Access denied | | ☐ Pass ☐ Fail | |

## 3.2 Logout
| Test ID | Scenario | Expected Result | Actual | Status | Sign-off |
|---------|----------|-----------------|--------|--------|----------|
| SEC-04 | User clicks "Logout" | Session cleared | | ☐ Pass ☐ Fail | |
| SEC-05 | User redirected to login | Login page shown | | ☐ Pass ☐ Fail | |
| SEC-06 | Global logout (SLO) | All app sessions terminated | | ☐ Pass ☐ Fail | |

---

# 4. Performance & Reliability

| Test ID | Scenario | Expected Result | Actual | Status | Sign-off |
|---------|----------|-----------------|--------|--------|----------|
| PERF-01 | SSO login response time | < 2 seconds | | ☐ Pass ☐ Fail | |
| PERF-02 | SCIM sync completion | < 1 minute | | ☐ Pass ☐ Fail | |
| PERF-03 | Token validation time | < 500ms | | ☐ Pass ☐ Fail | |
| PERF-04 | System handles concurrent logins | No failures at [N] users | | ☐ Pass ☐ Fail | |

---

# 5. Browser Compatibility

| Test ID | Browser | Expected Result | Actual | Status | Sign-off |
|---------|---------|-----------------|--------|--------|----------|
| BROW-01 | Chrome (Latest) | SSO flow works | | ☐ Pass ☐ Fail | |
| BROW-02 | Firefox (Latest) | SSO flow works | | ☐ Pass ☐ Fail | |
| BROW-03 | Edge (Latest) | SSO flow works | | ☐ Pass ☐ Fail | |
| BROW-04 | Safari (Latest) | SSO flow works | | ☐ Pass ☐ Fail | |

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
- This sign-off confirms SSO MVP meets Acceptance Criteria

[Planning Document](plan_draft_sso.md#22-acceptance-criteria-ac) | [AC Details](docs/AC_MVP.md)
