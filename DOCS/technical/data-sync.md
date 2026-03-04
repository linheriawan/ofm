# Data Synchronization: SSO to OFM

**Key Principle:** SSO owns employee and org data, OFM owns operational data (roles, locations, bookings).

---

## What Syncs Where

| Data | Source | OFM Storage | Sync Method |
|------|--------|-------------|-------------|
| Companies | SSO `organizations` | On-demand (not stored) | API proxy `/api/companies` → SSO |
| Departments | SSO `org_units` | On-demand (not stored) | API proxy `/api/departments` → SSO |
| Positions | SSO `positions` | On-demand (not stored) | API proxy (if needed) |
| **Employees** | SSO `employees` | **Synced to `users`** | On-login + bulk sync |
| **Locations** | **OFM** | **`locations` collection** | Manual (admin assigns) |
| **Roles** | **OFM** | **`roles` collection** | Manual (OFM-specific permissions) |
| **Manager** | SSO (initial) | OFM `users.managerId` | Bulk sync (mapped to OFM `_id`) |

---

## Field Mapping

| SSO Field | OFM Field |
|-----------|-----------|
| `employee.organizationId` | `user.companyId` |
| `employee.orgUnitId` | `user.departmentId` |
| `employee.positionId` | `user.positionId` |
| `sub` (OIDC claim) | `user.ssoUserId` |
| `employeeId` / NIK | `user.userId` |

OFM-managed fields (not from SSO): `locationId`, `managerId` (mapped to OFM `_id`), `roleIds`

---

## Sync Operations

### On Login (Automatic)

Every OAuth login triggers `syncUserFromSSO()` (`src/lib/server/auth/sync.ts`):

- **Existing user:** Updates name, phone, email, companyId, departmentId, positionId. Keeps roleIds, locationId, managerId.
- **New user:** Creates record with default `employee` role. locationId and managerId are null (admin assigns later).

### Bulk Sync (Manual)

```bash
bun run scripts/sync-employees-from-sso.ts
```

Run on: initial setup, after org changes, when manager relationships needed.

Process: fetch all SSO employees → create/update OFM users → build SSO-to-OFM ID map → fix managerId references.

---

## Initial Setup

```bash
bun run scripts/seed-roles.ts                # 1. Seed OFM roles
bun run scripts/sync-employees-from-sso.ts   # 2. Sync all employees
bun run scripts/fix-duplicate-users.ts       # 3. Fix duplicates (if any)
bun run scripts/fix-user-roleids.ts          # 4. Fix role IDs (if migrating)
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Manager dropdown empty | Run bulk sync (managers haven't logged in) |
| Department dropdown empty | Re-login for fresh SSO token |
| Roles not showing | Run `fix-user-roleids.ts` (names instead of ObjectIds) |
| Duplicate users | Run `fix-duplicate-users.ts` (missing ssoUserId) |
