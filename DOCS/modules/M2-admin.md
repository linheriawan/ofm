# M2 - Admin Panel

Administrative panel for managing master data, system settings, and operational resources. All routes are under `/admin/*`.

---

## Sub-Modules

### M2.1 Devices

Management of IoT devices used across the system (room tablets, Raspberry Pi displays).

- CRUD for device records
- Device status tracking (online/offline)
- Assignment to rooms or vehicles

| Route | Description |
|-------|-------------|
| `/admin/devices` | Device list and management |

**Related:** M6 (Room Display) for tablet devices assigned to meeting rooms.

---

### M2.2 Drivers

Driver master data and availability management.

- CRUD for driver records (name, license, rating)
- Availability status (on duty / off duty)
- Assignment history

| Route | Description |
|-------|-------------|
| `/admin/drivers` | Driver list and management |

**Related:** M5 (Transportation) for driver assignment to trips; M9 (Mobile Apps) for mobile-side status management.

---

### M2.3 Rooms

Meeting room master data with capacity and facility details.

- CRUD for room records (name, floor, capacity, facilities)
- Room status management (available / maintenance)
- QR code generation for room tablet access

| Route | Description |
|-------|-------------|
| `/admin/rooms` | Room list and management |

**Related:** M4 (Meeting) for room reservation; M6 (Room Display) for tablet schedule display.

---

### M2.4 Settings

Database-backed configuration system with web UI. Replaces `.env`-based configuration for runtime-editable settings.

#### Architecture

```
Admin UI --> API Endpoint --> Settings Module --> MongoDB
                                   |
                            SCIM Client (with cache)
```

#### Encryption

- **Algorithm:** AES-256-CBC
- **Key source:** `SETTINGS_ENCRYPTION_KEY` environment variable
- **Key length:** 32 bytes (padded if needed)
- **IV:** Random 16 bytes per encrypted value
- **Storage format:** `{iv}:{encrypted_data}` (hex-encoded)

#### Cache Strategy

- TTL: 1 minute
- Fallback chain: Database -> env module -> process.env
- Auto-refresh on cache expiry

#### Settings Categories

**SCIM Integration (`scim`)**

| Key | Label | Type | Required |
|-----|-------|------|----------|
| `scim.base_url` | SSO Base URL | text | Yes |
| `scim.client_id` | SCIM Client ID | text | Yes |
| `scim.client_secret` | SCIM Client Secret | secret | Yes |
| `scim.webhook_secret` | SCIM Webhook Secret | secret | No |

**Email (`email`)**

| Key | Label | Type | Required |
|-----|-------|------|----------|
| `email.smtp_host` | SMTP Host | text | No |
| `email.smtp_port` | SMTP Port | text | No |
| `email.smtp_user` | SMTP Username | text | No |
| `email.smtp_password` | SMTP Password | secret | No |

**General (`general`)**

| Key | Label | Type | Required |
|-----|-------|------|----------|
| `general.app_name` | Application Name | text | Yes |
| `general.app_url` | Application URL | text | Yes |

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/settings?category={cat}` | Get settings by category |
| PUT | `/api/v1/settings` | Update multiple settings |
| POST | `/api/v1/scim/test` | Test SCIM connection |

#### Security Notes

- Secrets are displayed as `***HIDDEN***` in the UI
- Input validation: settings must match predefined keys
- Authentication required for all endpoints
- Admin role recommended (RBAC enforcement pending)

#### Key Files

```
src/routes/admin/settings/+page.svelte        # Settings UI with tabs
src/routes/admin/settings/+page.server.ts      # Load settings by category
src/routes/api/v1/settings/+server.ts          # GET/PUT settings API
src/routes/api/v1/scim/test/+server.ts         # Test SCIM connection
src/lib/server/settings.ts                     # Settings CRUD with encryption
src/lib/server/db/schemas/settings.ts          # Schema and defaults
```

| Route | Description |
|-------|-------------|
| `/admin/settings` | Settings management UI (SCIM, Email, General tabs) |

**Related:** M1 (Authentication) for SCIM integration settings.

---

### M2.5 Transport Companies

Management of transportation voucher providers (Gojek, Grab, etc.).

- CRUD for transport company records
- Active/inactive toggle
- Provider-specific configuration

| Route | Description |
|-------|-------------|
| `/admin/transport-companies` | Transport company list and management |

**Related:** M5 (Transportation) for voucher provider selection; M2.9 (Vouchers) for voucher pool management per provider.

---

### M2.6 Trip Purpose

Master data for trip purposes, used for analytics and reporting.

- CRUD for trip purpose records
- Category assignment
- Approval flags (some purposes may require additional approval)

| Route | Description |
|-------|-------------|
| `/admin/trip-purposes` | Trip purpose list and management |

**Related:** M5 (Transportation) for purpose selection in transport request forms.

---

### M2.7 Vehicles

Vehicle fleet master data management.

- CRUD for vehicle records (plate, model, capacity, type)
- Vehicle status tracking (available / in-use / maintenance)
- Driver assignment linkage

| Route | Description |
|-------|-------------|
| `/admin/vehicles` | Vehicle list and management |

**Related:** M5 (Transportation) for vehicle assignment to trips.

---

### M2.8 Videos

Video content management for room displays and informational screens.

- CRUD for video records
- Upload and playback management

| Route | Description |
|-------|-------------|
| `/admin/videos` | Video list and management |

---

### M2.9 Vouchers

Transportation voucher pool management with CSV import/export for billing reconciliation.

- CRUD for voucher records
- CSV import for bulk voucher entry
- CSV export for billing reconciliation
- Pool tracking by provider (Gojek, Grab)
- Allocation and usage status

| Route | Description |
|-------|-------------|
| `/admin/vouchers` | Voucher list and management |

**Related:** M2.5 (Transport Companies) for provider master data; M5 (Transportation) for voucher allocation to employees.

---

## Shared Patterns

All admin master data pages use:

- **DataTable component** -- reusable table with pagination and sorting
- **Modal component** -- reusable modal for create/edit forms
- **Standardized API response format** with pagination metadata
- **REST conventions** under `/api/v1/*`

## Route Summary

| Route | Sub-Module |
|-------|------------|
| `/admin/devices` | M2.1 Devices |
| `/admin/drivers` | M2.2 Drivers |
| `/admin/rooms` | M2.3 Rooms |
| `/admin/settings` | M2.4 Settings |
| `/admin/transport-companies` | M2.5 Transport Companies |
| `/admin/trip-purposes` | M2.6 Trip Purpose |
| `/admin/vehicles` | M2.7 Vehicles |
| `/admin/videos` | M2.8 Videos |
| `/admin/vouchers` | M2.9 Vouchers |
