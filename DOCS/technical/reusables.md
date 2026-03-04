# Reusables Reference Card

**Rule:** Always check this list before writing new code.

**CSS, modal, form patterns:** See [standards.md](standards.md)

---

## UI Components

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| **DataTable** | Paginated table with filters & actions | `columns, apiEndpoint, filters?, actions?, onEdit?, onAdd?` |
| **Modal** | Dialog wrapper (sticky header) | `isOpen, title, onClose, width?` |
| **LocationPicker** | Map-based location selector | `initialLat, initialLng` |
| **MeetingBookingForm** | Complex meeting form (15+ fields) | `booking, onSuccess, onCancel` |

**Paths:** `src/lib/components/*.svelte`

### DataTable

Handles ALL list/table pages (master data, transactional, conditional actions, custom rendering).

**Filter types:** `select`, `text`, `date`, `daterange`

**Column options:** `format` (value to string), `render` (custom HTML with global CSS classes)

---

## Server Utilities

| Module | Key Exports | Path |
|--------|-------------|------|
| **response.ts** | `success(), error(), ErrorCode` | `src/lib/server/api/response.ts` |
| **validation.ts** | `validateRequired(), isValidEmail()` | `src/lib/server/api/validation.ts` |
| **auth.ts** | `requireAuth(), hasRole()` | `src/lib/server/api/auth.ts` |
| **mongodb.ts** | `connectDB(), getDB()` | `src/lib/server/db/mongodb.ts` |
| **schemas.ts** | `40+ interfaces, generateRequestNumber()` | `src/lib/server/db/schemas.ts` |
| **api.ts** | `listDocuments(), createDocument()` | `src/lib/utils/api.ts` |

---

## Auth & Session

| Module | Key Functions | Path |
|--------|---------------|------|
| **session.ts** | `createSession(), getSession()` | `src/lib/server/auth/session.ts` |
| **oauth.ts** | `buildAuthorizationUrl(), exchangeCodeForTokens()` | `src/lib/server/auth/oauth.ts` |
| **pkce.ts** | `generatePKCEPair()` | `src/lib/server/auth/pkce.ts` |
| **sync.ts** | `syncUserFromSSO()` | `src/lib/server/auth/sync.ts` |

---

## Specialized

| Module | Purpose | Path |
|--------|---------|------|
| **vouchers/import.ts** | CSV import/export for billing | `src/lib/server/vouchers/import.ts` |
| **scim/client.ts** | SCIM 2.0 employee sync | `src/lib/server/scim/client.ts` |
| **settings.ts** | DB-backed system config | `src/lib/server/settings.ts` |

---

## Client API Wrapper

```typescript
import { api, transportApi, meetingApi } from '$lib/client/api';

await api.get('/api/v1/vehicles');
await transportApi.createRequest(data);
await meetingApi.listRequests({status: 'pending'});
```

**Path:** `src/lib/client/api.ts`

---

## Standardized Patterns

**API Response:** `{ success, data?, error?: { code, message }, meta?: { page, limit, total } }`

**REST Pattern:** `GET /list` | `GET /:id` | `POST /create` | `PATCH /:id` | `DELETE /:id`

**Request Numbers:** `generateRequestNumber('TR')` → `TR-20251107-0001` (also: MR, FR, EV)

**BaseDocument:** All DB docs include `_id, createdAt, updatedAt, createdBy?, updatedBy?`

---

## Quick Lookup

| I Need To... | Use This |
|--------------|----------|
| Show any list/table | **DataTable** |
| Form in overlay | **Modal** |
| Pick location on map | **LocationPicker** |
| Fetch data client-side | **client/api.ts** |
| Protect API endpoint | `requireAuth()` |
| Return API response | `success()` / `error()` |
| Validate input | **validation.ts** |
| Generate request ID | `generateRequestNumber()` |
| Sync employees from SSO | **scim/client.ts** |
| Get/set system config | **settings.ts** |
