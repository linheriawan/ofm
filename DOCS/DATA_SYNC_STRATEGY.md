# Data Synchronization Strategy: SSO ↔ OFM

## Overview

This document explains how data flows between Aksara SSO and OFM, what data is synced, and what data is managed separately.

---

## Data Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Aksara SSO                          │
│  (Source of Truth for Employee & Org Data)             │
├─────────────────────────────────────────────────────────┤
│  Collections:                                           │
│  - employees (NIK, name, phone, email, etc.)           │
│  - organizations (companies/entities)                   │
│  - org_units (departments, divisions, etc.)            │
│  - positions (job positions with levels)                │
│  - users (authentication accounts)                      │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ OAuth 2.0 Login + /oauth/userinfo
                  │ API calls for org data
                  ↓
┌─────────────────────────────────────────────────────────┐
│                        OFM                              │
│  (Office Facility Management)                           │
├─────────────────────────────────────────────────────────┤
│  Collections:                                           │
│  - users (synced from SSO employees)                    │
│  - roles (OFM-specific roles)                           │
│  - locations (OFM-managed physical locations)           │
│  - meeting_rooms (at OFM locations)                     │
│  - vehicles, drivers, bookings, etc.                    │
└─────────────────────────────────────────────────────────┘
```

---

## Data Sync Rules

### 1. Organizations/Companies

**Source**: SSO `organizations` collection
**OFM Storage**: Not stored, fetched on-demand
**Access**: Via `/api/companies` → proxies to SSO `/api/organizations`

**Why on-demand?**
- SSO is the single source of truth
- Org structure changes should immediately reflect in OFM
- No risk of stale data

**User Field Mapping:**
```javascript
// In SSO:
employee.organizationId = "ORG001"

// In OFM user record:
user.companyId = "ORG001"  // Same value, different field name
```

---

### 2. Departments/Org Units

**Source**: SSO `org_units` collection
**OFM Storage**: Not stored, fetched on-demand
**Access**: Via `/api/departments` → proxies to SSO `/api/org-units`

**Why on-demand?**
- Organizational restructuring is common
- SSO manages the hierarchy (parent/child relationships)
- OFM only needs to reference, not manage

**User Field Mapping:**
```javascript
// In SSO:
employee.orgUnitId = ObjectId("...")

// In OFM user record:
user.departmentId = "..." // Same ObjectId as string
```

---

### 3. Positions

**Source**: SSO `positions` collection
**OFM Storage**: Not stored, fetched on-demand
**Access**: Could add `/api/positions` if needed (not yet implemented)

**User Field Mapping:**
```javascript
// In SSO:
employee.positionId = ObjectId("...")

// In OFM user record:
user.positionId = "..." // Same ObjectId as string
```

---

### 4. Locations (Physical Office Locations)

**Source**: **OFM-managed** (NOT from SSO)
**OFM Storage**: `locations` collection
**Reason**:

SSO has `workLocation` field (text like "Jakarta HQ"), but:
- Meeting rooms are at specific physical buildings
- OFM needs structured location data (address, coordinates, etc.)
- Work location ≠ meeting room location (e.g., remote workers)

**Structure:**
```javascript
{
  _id: ObjectId("..."),
  locationId: "LOC-JKT-01",
  name: "Jakarta Head Office",
  address: "Jl. Sudirman No. 123",
  city: "Jakarta",
  province: "DKI Jakarta",
  country: "Indonesia",
  latitude: -6.2088,
  longitude: 106.8456,
  isActive: true
}
```

**User Assignment:**
- Admin manually assigns users to OFM locations via `/modules/users`
- Used for meeting room booking (show rooms at user's location first)

---

### 5. Employees/Users

**Source**: SSO `employees` collection
**OFM Storage**: **Synced to** `users` collection
**Sync Method**:
- **On Login**: Individual user synced via `syncUserFromSSO()`
- **Bulk Sync**: Run `scripts/sync-employees-from-sso.ts` to sync all

**Why sync instead of on-demand?**
- Users need OFM-specific data (roleIds, locationId, etc.)
- Manager relationships need to reference OFM user._id
- Approval workflows need to query user data quickly
- Booking history tied to OFM user records

**User Record Structure:**
```javascript
{
  _id: ObjectId("..."),              // OFM user ID
  ssoUserId: "68f1e89...",           // Link to SSO user._id
  userId: "12345",                   // Employee ID / NIK
  email: "john.doe@ias.co.id",
  username: "john.doe",
  firstName: "John",
  lastName: "Doe",
  phone: "+62-811-1234-5678",

  // From SSO (synced on login):
  companyId: "ORG001",               // organizationId from SSO
  departmentId: "68f123...",         // orgUnitId from SSO
  positionId: "68f456...",           // positionId from SSO

  // OFM-managed:
  locationId: "68f789...",           // OFM location._id (manually assigned)
  managerId: "68fabc...",            // OFM user._id (NOT SSO userId)
  roleIds: ["68fdef..."],            // OFM role._id references

  isActive: true,
  createdAt: Date,
  updatedAt: Date
}
```

---

### 6. Manager Relationships

**Challenge**: SSO has `managerId` but it references SSO `user._id`, not OFM `user._id`

**Solution**: Two-step sync process

**Step 1** - Sync all employees:
```bash
bun run scripts/sync-employees-from-sso.ts
```
- Creates OFM user for every SSO employee
- Initially stores SSO `userId` in OFM `user.managerId`

**Step 2** - Fix manager references:
```javascript
// Script automatically maps SSO userId → OFM user._id
const ssoToOfmMap = Map<string, string>
ssoToOfmMap.set(ssoUserId, ofmUser._id)

// Update all users
user.managerId = ssoToOfmMap.get(employee.managerId)
```

**Result**:
- `user.managerId` now references another OFM `user._id`
- Can query managers directly: `db.users.findOne({ _id: user.managerId })`

---

### 7. Roles & Permissions

**Source**: **OFM-only** (NOT in SSO)
**Storage**: `roles` collection
**Reason**: SSO handles authentication, OFM handles authorization

**Role Structure:**
```javascript
{
  _id: ObjectId("68f20c1b..."),
  roleId: "super_admin",             // Unique role identifier
  roleName: "Super Administrator",
  description: "Full system access",
  permissions: [
    "transportation.create",
    "transportation.approve",
    "meeting.create",
    "admin.users.manage",
    // ... 40+ permissions
  ],
  isActive: true
}
```

**User-Role Mapping:**
```javascript
// In OFM user record:
user.roleIds = [
  "68f20c1b3ab7bbf6679726bd",      // Reference to roles._id
  "68f20c1b3ab7bbf6679726be"
]
```

**Default Role Assignment:**
- New users (on first login): `employee` role
- Special case: `admin@ias.co.id` → `super_admin` role
- Admins can assign additional roles via `/modules/users`

---

## Sync Operations

### 1. On User Login (Automatic)

**Trigger**: Every OAuth 2.0 login
**Function**: `syncUserFromSSO()` in `/lib/server/auth/sync.ts`
**Process**:

```javascript
1. User logs in via SSO
2. Get userInfo from /oauth/userinfo (includes all SSO employee data)
3. Check if user exists in OFM by ssoUserId
4. If exists:
   - Update firstName, lastName, phone, companyId, departmentId, positionId
   - Keep existing roleIds, locationId, managerId
5. If new:
   - Create new user with SSO data
   - Assign default role (employee)
   - locationId and managerId are null (admin assigns later)
6. Load user's roleIds from OFM roles collection
7. Create session with complete user data
```

**Limitations**:
- Only syncs the logged-in user
- Manager might not exist in OFM yet (if they haven't logged in)

### 2. Bulk Employee Sync (Manual)

**When to run**:
- Initial setup
- After organizational changes (new hires, transfers)
- When manager relationships are needed

**Command**:
```bash
bun run scripts/sync-employees-from-sso.ts
```

**Process**:
```javascript
1. Connect to both SSO and OFM databases
2. Fetch all active employees from SSO
3. For each employee:
   - Check if exists in OFM (by email or ssoUserId)
   - Create or update user record
4. Build map: SSO userId → OFM user._id
5. Fix all managerId references to point to OFM user._id
```

**Result**:
- All employees exist in OFM
- Manager relationships are correct
- Users dropdown shows all employees for manager selection

---

## Data Flow Examples

### Example 1: New Employee First Login

```
1. Employee "jane.smith@ias.co.id" clicks "Login with SSO"
2. OAuth redirects to SSO login page
3. Employee enters credentials (in SSO)
4. SSO authenticates and redirects back with code
5. OFM exchanges code for access token
6. OFM calls /oauth/userinfo with token
7. SSO returns:
   {
     sub: "68f123...",
     email: "jane.smith@ias.co.id",
     employeeId: "EMP001",
     firstName: "Jane",
     lastName: "Smith",
     organizationId: "ORG001",
     orgUnitId: "DEPT001",
     positionId: "POS001",
     managerId: "68f999..." // SSO userId of manager
   }
8. OFM runs syncUserFromSSO()
9. User doesn't exist, so create:
   {
     _id: ObjectId("68faaa..."),  // NEW OFM ID
     ssoUserId: "68f123...",
     userId: "EMP001",
     email: "jane.smith@ias.co.id",
     firstName: "Jane",
     lastName: "Smith",
     companyId: "ORG001",
     departmentId: "DEPT001",
     positionId: "POS001",
     managerId: "68f999...",      // PROBLEM: SSO userId, not OFM _id
     roleIds: ["68femployee..."], // Default employee role
     locationId: null,            // Admin assigns later
   }
10. Load roleIds and create session
11. Redirect to dashboard
```

**Issue**: `managerId` references SSO userId, not OFM user._id
**Fix**: Run bulk sync to fix manager references

### Example 2: Admin Assigns Location and Manager

```
1. Admin opens /modules/users
2. Clicks "Edit" on Jane Smith
3. Modal loads dropdowns:
   - Companies: fetched from /api/companies (SSO data)
   - Departments: fetched from /api/departments (SSO data)
   - Locations: fetched from /api/v1/locations (OFM data)
   - Manager: fetched from /api/users (OFM data - all synced employees)
   - Roles: fetched from /api/v1/roles (OFM data)
4. Admin selects:
   - Location: "Jakarta HQ" (68floc...)
   - Manager: "John Doe" (68fmgr...)
   - Roles: [Super Admin, Employee]
5. Saves → PUT /api/users/68faaa...
6. OFM updates:
   {
     locationId: "68floc...",
     managerId: "68fmgr...",     // Now OFM user._id (correct!)
     roleIds: ["68fadmin...", "68femployee..."]
   }
```

---

## API Endpoints Reference

### SSO APIs (called by OFM)

| Endpoint | Method | Purpose | Called By |
|----------|--------|---------|-----------|
| `/oauth/authorize` | GET | Initiate login | User browser |
| `/oauth/token` | POST | Exchange code for tokens | OFM backend |
| `/oauth/userinfo` | GET | Get logged-in user data | OFM backend (on login) |
| `/api/organizations` | GET | List companies | OFM `/api/companies` |
| `/api/org-units` | GET | List departments | OFM `/api/departments` |
| `/api/positions` | GET | List positions | (Not yet used) |

### OFM APIs

| Endpoint | Method | Purpose | Data Source |
|----------|--------|---------|-------------|
| `/api/companies` | GET | List companies | Proxy to SSO |
| `/api/departments` | GET | List departments | Proxy to SSO |
| `/api/v1/locations` | GET | List locations | OFM database |
| `/api/users` | GET | List users | OFM database (synced from SSO) |
| `/api/users/[id]` | PUT | Update user | OFM database |
| `/api/v1/roles` | GET | List roles | OFM database |

---

## Best Practices

### 1. Initial Setup

```bash
# Step 1: Seed OFM roles (if not already done)
bun run scripts/seed-roles.ts

# Step 2: Sync all employees from SSO
bun run scripts/sync-employees-from-sso.ts

# Step 3: Fix duplicate users (if any)
bun run scripts/fix-duplicate-users.ts

# Step 4: Fix role IDs (if migrating from old structure)
bun run scripts/fix-user-roleids.ts
```

### 2. Regular Operations

- **New employees**: Automatically synced on first login
- **Employee updates**: Automatically synced on each login
- **Org structure changes**: Immediately reflected (on-demand from SSO)
- **Manager changes**: Re-run bulk sync if needed

### 3. Data Consistency

**What's always up-to-date**:
- ✅ Employee names, phone, email (synced on login)
- ✅ Company/department/position (synced on login)
- ✅ Org structure (fetched on-demand from SSO)

**What requires manual admin work**:
- ⚙️ Location assignment (OFM-specific)
- ⚙️ Role assignment (OFM-specific)
- ⚙️ Manager relationships (initially from SSO, can be overridden)

---

## Troubleshooting

### Issue: Manager dropdown shows no options

**Cause**: Managers haven't logged in yet, so they don't exist in OFM
**Fix**: Run bulk employee sync
```bash
bun run scripts/sync-employees-from-sso.ts
```

### Issue: Department/Company dropdown shows nothing

**Cause**: SSO API call failed or auth token expired
**Check**: Browser console for 401/404 errors
**Fix**: Re-login to get fresh access token

### Issue: User roles not showing in modal

**Cause**: `roleIds` contains role names instead of ObjectIds
**Fix**: Run role fix script
```bash
bun run scripts/fix-user-roleids.ts
```

### Issue: Duplicate users

**Cause**: Old records missing `ssoUserId` field
**Fix**: Run duplicate fix script
```bash
bun run scripts/fix-duplicate-users.ts
```

---

## Future Enhancements

### 1. SCIM Employee Sync (Planned)

Instead of bulk sync script, implement SCIM protocol:
- SSO pushes employee changes to OFM automatically
- Real-time sync when employees are added/updated/removed
- Webhook-based instead of polling

### 2. Location Sync from SSO (Optional)

If SSO adds structured location data:
- Sync locations from SSO instead of managing in OFM
- Map `workLocation` text to actual location records

### 3. Automated Manager Mapping

- When SSO `managerId` changes, automatically update OFM reference
- Background job to keep manager relationships in sync

---

## Summary

| Data | Source | Storage | Sync Method |
|------|--------|---------|-------------|
| Companies | SSO | On-demand | API proxy |
| Departments | SSO | On-demand | API proxy |
| Positions | SSO | On-demand | API proxy |
| **Locations** | **OFM** | **OFM DB** | **Manual** |
| Employees | SSO | OFM DB | On login + bulk sync |
| **Roles** | **OFM** | **OFM DB** | **Manual** |
| **Manager** | SSO (initial) | OFM DB | Bulk sync (mapped to OFM _id) |

**Key Principle**: SSO owns employee and org data, OFM owns operational data (roles, locations, bookings).
