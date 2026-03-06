# UAT Sign-off Document

**Project**: Office Facility Management (OFM)
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

# 1. Meeting Room Booking

## 1.1 Room Reservation
| Test ID | Scenario | Expected Result | Actual | Status | Sign-off |
|---------|----------|-----------------|--------|--------|----------|
| MRB-01 | User can create room booking | Booking created with confirmation | | ☐ Pass ☐ Fail | |
| MRB-02 | User can view available rooms | Room list with availability status | | ☐ Pass ☐ Fail | |
| MRB-03 | User can select date/time | Date/time picker functional | | ☐ Pass ☐ Fail | |
| MRB-04 | User can specify attendees | Attendee list saved | | ☐ Pass ☐ Fail | |
| MRB-05 | Double booking prevented | System rejects conflicting bookings | | ☐ Pass ☐ Fail | |

## 1.2 Meeting Type Support
| Test ID | Scenario | Expected Result | Actual | Status | Sign-off |
|---------|----------|-----------------|--------|--------|----------|
| MRB-06 | Online meeting can be created | Meeting link generated | | ☐ Pass ☐ Fail | |
| MRB-07 | Offline meeting can be created | Room assigned, no link | | ☐ Pass ☐ Fail | |
| MRB-08 | Hybrid meeting can be created | Room + meeting link | | ☐ Pass ☐ Fail | |

---

# 2. Transportation Management

## 2.1 Transportation Reservation
| Test ID | Scenario | Expected Result | Actual | Status | Sign-off |
|---------|----------|-----------------|--------|--------|----------|
| TRP-01 | User can request transportation | Request submitted | | ☐ Pass ☐ Fail | |
| TRP-02 | User can select vehicle type | Vehicle options displayed | | ☐ Pass ☐ Fail | |
| TRP-03 | User can specify trip details | Date, time, route saved | | ☐ Pass ☐ Fail | |

## 2.2 Company Car + Driver
| Test ID | Scenario | Expected Result | Actual | Status | Sign-off |
|---------|----------|-----------------|--------|--------|----------|
| TRP-04 | Admin can schedule company car | Car booked in calendar | | ☐ Pass ☐ Fail | |
| TRP-05 | Admin can assign driver | Driver notified, assignment saved | | ☐ Pass ☐ Fail | |
| TRP-06 | Driver can view schedule | Driver sees assigned trips | | ☐ Pass ☐ Fail | |

## 2.3 Voucher Allocation
| Test ID | Scenario | Expected Result | Actual | Status | Sign-off |
|---------|----------|-----------------|--------|--------|----------|
| TRP-07 | Admin can allocate vouchers | Voucher assigned to user | | ☐ Pass ☐ Fail | |
| TRP-08 | User can view voucher balance | Balance displayed correctly | | ☐ Pass ☐ Fail | |
| TRP-09 | Voucher usage tracked | Usage history recorded | | ☐ Pass ☐ Fail | |

---

# 3. Multi-Entity Support

| Test ID | Scenario | Expected Result | Actual | Status | Sign-off |
|---------|----------|-----------------|--------|--------|----------|
| MES-01 | User sees only their entity data | Data filtered by entity | | ☐ Pass ☐ Fail | |
| MES-02 | Admin can switch entity view | Entity selector functional | | ☐ Pass ☐ Fail | |
| MES-03 | Reports show consolidated data | Multi-entity report generated | | ☐ Pass ☐ Fail | |

---

# 4. SSO

## 4.1 Successful SSO Login
| Test ID | Scenario | Expected Result | Actual | Status | Sign-off |
|---------|----------|-----------------|--------|--------|----------|
| SSO-01 | User can login via SSO | Redirected to IdP, then dashboard | | ☐ Pass ☐ Fail | |
| SSO-02 | Session token created | Token stored securely | | ☐ Pass ☐ Fail | |
| SSO-03 | Logout clears session | User redirected to login | | ☐ Pass ☐ Fail | |

---

# 5. SCIM

| Test ID | Scenario | Expected Result | Actual | Status | Sign-off |
|---------|----------|-----------------|--------|--------|----------|
| SCIM-01 | New user synced from IdP | User auto-created in OFM | | ☐ Pass ☐ Fail | |
| SCIM-02 | User update synced | Profile updated automatically | | ☐ Pass ☐ Fail | |
| SCIM-03 | User offboarding synced | User disabled in OFM | | ☐ Pass ☐ Fail | |

---

# 6. Display Device

## 6.1 Device Can Run Application
| Test ID | Scenario | Expected Result | Actual | Status | Sign-off |
|---------|----------|-----------------|--------|--------|----------|
| DEV-01 | Device browser can access app | App loads without errors | | ☐ Pass ☐ Fail | |
| DEV-02 | Touch interface works | UI responsive to touch | | ☐ Pass ☐ Fail | |

## 6.2 Device Assignment
| Test ID | Scenario | Expected Result | Actual | Status | Sign-off |
|---------|----------|-----------------|--------|--------|----------|
| DEV-03 | Admin can assign device to room | Device-room mapping saved | | ☐ Pass ☐ Fail | |
| DEV-04 | Device shows assigned room info | Correct room displayed | | ☐ Pass ☐ Fail | |

## 6.3 Device Can Display Room Information
| Test ID | Scenario | Expected Result | Actual | Status | Sign-off |
|---------|----------|-----------------|--------|--------|----------|
| DEV-05 | Device shows room schedule | Schedule visible | | ☐ Pass ☐ Fail | |
| DEV-06 | Device shows availability status | Available/Busy indicator | | ☐ Pass ☐ Fail | |
| DEV-07 | Display updates in real-time | Changes reflected immediately | | ☐ Pass ☐ Fail | |

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
| Product Owner | General Affairs | | | ☐ Approved ☐ Rejected |
| Project Manager | IT Development Div Head | | | ☐ Approved ☐ Rejected |
| Tech Lead | Heriawan | | | ☐ Approved ☐ Rejected |

---

**Notes**:
- All Critical/High issues must be resolved before approval
- Medium/Low issues can be deferred with agreed timeline
- This sign-off confirms MVP meets Acceptance Criteria

[Planning Document](plan_draft_ofm_id.md#22-acceptance-criteria-ac) | [AC Details](docs/AC_MVP.md)
