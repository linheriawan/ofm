# ZTNA - Product Backlog

**Version**: 1.0
**Last Updated**: [Date]

---

## MVP Backlog (45 Mandays)

| ID | Task | Estimate | Status | Phase |
|----|------|----------|--------|-------|
| CF-001 | Cloudflare Zero Trust account setup | 2 md | Todo | 1 |
| CF-002 | Team and groups configuration | 1 md | Todo | 1 |
| CF-003 | SSO/IdP integration | 2 md | Todo | 1 |
| WEB-001 | Deploy cloudflared tunnel (gateway) | 2 md | Todo | 2 |
| WEB-002 | Configure web app tunnels | 2 md | Todo | 2 |
| WEB-003 | Access policies for web apps | 1 md | Todo | 2 |
| RDP-001 | TCP tunnel for RDP | 2 md | Todo | 3 |
| RDP-002 | TCP tunnel for SSH | 2 md | Todo | 3 |
| RDP-003 | Custom port configuration | 1 md | Todo | 3 |
| H2H-001 | Service Token generation | 2 md | Todo | 4 |
| H2H-002 | Server-to-server tunnel config | 2 md | Todo | 4 |
| H2H-003 | Isolated network routing | 1 md | Todo | 4 |
| UAT-001 | User acceptance testing | 3 md | Todo | 5 |
| UAT-002 | Connectivity validation | 2 md | Todo | 5 |
| IP-001 | Public IP Removal - Wave 1 | 5 md | Todo | 6 |
| IP-002 | Public IP Removal - Wave 2 | 5 md | Todo | 7 |
| IP-003 | Public IP Removal - Wave 3 | 5 md | Todo | 8 |
| DOC-001 | Runbook & documentation | 3 md | Todo | 9 |
| DOC-002 | Monitoring setup | 2 md | Todo | 9 |
| **Total** | | **45 md** | | **9 phases** |

## Post-MVP Backlog

| ID | Task | Estimate | Target |
|----|------|----------|--------|
| OPT-001 | Legacy VPN decommission | 5 md | Q3 2026 |
| OPT-002 | Additional app onboarding | 5 md | Q3 2026 |
| OPT-003 | Advanced device posture | 5 md | Q4 2026 |
| SEC-001 | DLP policies | 10 md | Q4 2026 |
| SEC-002 | Browser isolation | 10 md | Q1 2027 |

---

## Phase Progress

| Phase | Goal | Mandays | Cumulative | Status |
|-------|------|---------|------------|--------|
| 1 | CF Zero Trust Setup | 5 | 5 | Planned |
| 2 | Web Apps Tunnel | 5 | 10 | Planned |
| 3 | RDP/SSH Tunnel | 5 | 15 | Planned |
| 4 | Host-to-Host | 5 | 20 | Planned |
| 5 | UAT & Testing | 5 | 25 | Planned |
| 6 | Public IP Removal - Wave 1 | 5 | 30 | Planned |
| 7 | Public IP Removal - Wave 2 | 5 | 35 | Planned |
| 8 | Public IP Removal - Wave 3 | 5 | 40 | Planned |
| 9 | Hardening & Documentation | 5 | 45 | Planned |

---

## Server Migration Tracker

| Server | Public IP | Services | Target Phase | Status |
|--------|-----------|----------|--------------|--------|
| [Server 1] | [IP] | Web, SSH | Phase 6 | Pending |
| [Server 2] | [IP] | RDP, DB | Phase 6 | Pending |
| [Server 3] | [IP] | API | Phase 7 | Pending |
| [Server 4] | [IP] | Internal App | Phase 7 | Pending |
| [Server 5] | [IP] | Isolated Network | Phase 8 | Pending |

---

## Notes
- **md** = mandays
- Total: 45 mandays (includes 20% buffer)
- For acceptance criteria: [`AC_MVP.md`](AC_MVP.md)
- For progress chart: [`Burnup_Chart.md`](Burnup_Chart.md)
