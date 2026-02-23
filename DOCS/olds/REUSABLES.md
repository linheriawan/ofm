# OFM Reusables Reference Card

**Rule**: Always check this list before writing new code.

**Also see**: `DOCS/STANDARDS.md` for CSS, Modal, and Form standards.

---

## 🎨 GLOBAL CSS

**Location**: `src/lib/styles/global.css` (auto-imported in +layout.svelte)

**Available Classes:**
- **Buttons**: `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-success`, `.btn-sm`
- **Action Buttons**: `.btn-view`, `.btn-cancel`, `.btn-edit` (for DataTable actions)
- **Badges**: `.badge`, `.badge-pending`, `.badge-approved`, `.badge-completed`, `.badge-cancelled`, `.badge-type`
- **Status**: `.status-badge`, `.status-blue`, `.status-green`, `.status-red`, `.status-gray`
- **Forms**: `.form-grid`, `.form-group`, `.form-actions`, `.checkbox-group`
- **Cards**: `.card`, `.panel`
- **Utilities**: `.text-center`, `.text-muted`, `.mb-1`, `.mb-2`, `.flex`, `.gap-1`, etc.
- **Animations**: `.fade-in`, `.slide-up`

**CSS Variables**: `--color-primary`, `--color-danger`, `--border-color`, `--radius-md`, etc.

**CRITICAL RULE:** ❌ **NO `<style>` tags in `.svelte` files!**
- ✅ Use global CSS classes ONLY
- ❌ Don't duplicate these styles in components
- ❌ Don't add `<style>` tags to any .svelte files

---

## 📦 UI COMPONENTS

| Component | Purpose | Key Props | Usage |
|-----------|---------|-----------|-------|
| **DataTable** ⭐ **ENHANCED** | Universal paginated table with filters & actions | `columns, apiEndpoint, filters?, actions?, onEdit?, onAdd?` | See detailed examples below |
| **Modal** | Dialog wrapper (sticky header) | `isOpen, title, onClose, width?` | `<Modal {isOpen} title="Edit" {onClose} width="80%">{form}</Modal>` |
| **LocationPicker** | Map-based location selector | `initialLat, initialLng` | `<LocationPicker on:select={handleSelect} />` |
| **MeetingBookingForm** | Complex meeting form (15+ fields) | `booking, onSuccess, onCancel` | `<MeetingBookingForm {booking} {onSuccess} />` |

**Paths**: `src/lib/components/*.svelte`

**📏 Modal Width Standards:**
- Default: `600px` (simple forms < 10 fields)
- Complex: `width="80%"` (forms with 10-20 fields)
- Very Complex: `width="90%"` (forms with 20+ fields)

**🪟 Form Component Decision:**
- **< 10 fields**: Inline form in page (see `/admin/vehicles`)
- **10+ fields**: Separate component (see `MeetingBookingForm`)
- **See**: `DOCS/STANDARDS.md` for complete guidelines

---

### 🆕 DataTable Enhanced Capabilities

**DataTable now supports:**
- ✅ **Filters** (select, text, date, daterange)
- ✅ **Conditional actions** (show buttons based on row data)
- ✅ **Custom cell rendering** (badges, HTML, complex formatting)
- ✅ **Simple & Complex use cases** (backward compatible)

**Basic Usage (Master Data):**
```svelte
<DataTable
  title="Vehicles"
  columns={[
    { key: 'plateNumber', label: 'Plate' },
    { key: 'model', label: 'Model' },
    { key: 'isActive', label: 'Active', format: (val) => val ? 'Yes' : 'No' }
  ]}
  apiEndpoint="/api/v1/vehicles"
  onEdit={openEditModal}
  onAdd={openAddModal}
/>
```

**Advanced Usage (With Filters & Custom Rendering):**
```svelte
<DataTable
  title="Meeting Bookings"
  columns={[
    { key: 'requestNumber', label: 'Request #' },
    {
      key: 'status',
      label: 'Status',
      render: (val) => `<span class="badge badge-${val}">${val}</span>`
    },
    {
      key: 'startTime',
      label: 'Start',
      format: (val) => new Date(val).toLocaleString()
    }
  ]}
  filters={[
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' }
      ]
    },
    {
      key: 'date',
      label: 'Date Range',
      type: 'daterange'
    }
  ]}
  actions={[
    {
      label: 'View/Edit',
      class: 'btn-view',
      onClick: openEditModal
    },
    {
      label: 'Cancel',
      class: 'btn-cancel',
      onClick: handleCancel,
      show: (row) => row.status === 'pending'  // Conditional visibility
    }
  ]}
  apiEndpoint="/api/v1/meeting/requests"
  onAdd={openCreateModal}
/>
```

**Filter Types:**
- `select` - Dropdown with options
- `text` - Text input
- `date` - Single date picker
- `daterange` - From/To date range

**Column Options:**
- `format` - Transform value to string
- `render` - Custom HTML rendering (use with `:global()` CSS)

---

## 🔧 SERVER API UTILITIES

| Module | Purpose | Key Exports | Usage |
|--------|---------|-------------|-------|
| **response.ts** | Standardized API responses | `success(), error(), ErrorCode` | `return json(success(data, meta))` |
| **validation.ts** | Input validation | `validateRequired(), isValidEmail()` | `validateRequired(body, ['name', 'email'])` |
| **auth.ts** | Auth middleware | `requireAuth(), hasRole()` | `const user = await requireAuth(event)` |

**Paths**: `src/lib/server/api/*.ts`

---

## 💾 DATABASE UTILITIES

| Module | Purpose | Key Exports | Usage |
|--------|---------|-------------|-------|
| **mongodb.ts** | Connection manager | `connectDB(), getDB(), collections` | `await connectDB(); const db = getDB()` |
| **schemas.ts** | TypeScript types + helpers | `40+ interfaces, generateRequestNumber()` | `import type { Vehicle } from 'schemas'` |
| **api.ts** | Generic CRUD | `listDocuments(), createDocument()` | `await listDocuments('vehicles', {page, limit})` |

**Paths**: `src/lib/server/db/*.ts`, `src/lib/utils/api.ts`

---

## 🔐 AUTHENTICATION & SESSION

| Module | Purpose | Key Functions | Usage |
|--------|---------|---------------|-------|
| **session.ts** | Encrypted sessions | `createSession(), getSession()` | `const token = await createSession(userInfo, tokens)` |
| **oauth.ts** | OAuth 2.0 flow | `buildAuthorizationUrl(), exchangeCodeForTokens()` | `const {url, state} = await buildAuthorizationUrl()` |
| **pkce.ts** | PKCE for OAuth | `generatePKCEPair()` | `const {codeVerifier, codeChallenge} = await generatePKCEPair()` |
| **oauth-state.ts** | OAuth state mgmt | `saveOAuthState(), getOAuthState()` | `saveOAuthState(cookies, state, verifier)` |
| **sync.ts** | User sync from SSO | `syncUserFromSSO()` | `await syncUserFromSSO(userInfo)` |

**Paths**: `src/lib/server/auth/*.ts`

---

## 🎯 SPECIALIZED UTILITIES

| Module | Purpose | When to Use | Usage |
|--------|---------|-------------|-------|
| **vouchers/import.ts** | CSV import/export | Voucher billing reconciliation | `await importVouchers(csv, filename, companyId)` |
| **scim/client.ts** | SCIM 2.0 client | Employee sync from SSO | `await scimClient.fetchAllUsers()` |
| **scim/sync.ts** | Org data sync | Sync departments/positions | `await syncEmployees(scimUsers)` |
| **settings.ts** | DB-backed settings | System configuration | `await getSetting('scim.baseUrl')` |

**Paths**: `src/lib/server/vouchers/*.ts`, `src/lib/server/scim/*.ts`, `src/lib/server/settings.ts`

---

## 🌐 CLIENT API WRAPPER

```typescript
// Import
import { api, transportApi, meetingApi } from '$lib/client/api';

// Generic
const response = await api.get('/api/v1/vehicles');
await api.post('/api/v1/vehicles', data);

// Namespaced
await transportApi.createRequest(data);
await meetingApi.listRequests({status: 'pending'});
```

**Path**: `src/lib/client/api.ts`

---

## 🎨 STANDARDIZED PATTERNS

### API Response Format
```typescript
{
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: any };
  meta?: { page: number; limit: number; total: number; totalPages: number };
}
```

### REST Endpoints Pattern
```
GET    /api/v1/[resource]       → List with pagination
GET    /api/v1/[resource]/[id]  → Get single item
POST   /api/v1/[resource]       → Create new
PATCH  /api/v1/[resource]/[id]  → Update existing
DELETE /api/v1/[resource]/[id]  → Delete
```

### Request Number Format
- Transport: `TR-20251107-0001`
- Meeting: `MR-20251107-0001`
- Facility: `FR-20251107-0001`
- Event: `EV-20251107-0001`

Generated with: `generateRequestNumber('TR')`

### BaseDocument Schema
All DB documents include:
```typescript
{
  _id?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}
```

---

## 🧭 DECISION TREE: "What Should I Use?"

| I Need To... | Use This |
|--------------|----------|
| Show any list/table (simple or complex) | **DataTable** component ⭐ (now handles ALL cases) |
| Display a form in overlay | **Modal** component (default 600px, or specify width, sticky header) |
| Pick location on map | **LocationPicker** component |
| Create/edit meeting booking | **MeetingBookingForm** component |
| Fetch data from API (client-side) | **client/api.ts** wrapper |
| Protect an API endpoint | **auth.ts** → `requireAuth()` |
| Return API response | **response.ts** → `success()` or `error()` |
| Validate user input | **validation.ts** functions |
| Connect to database | **mongodb.ts** → `connectDB()` |
| Define data types | **schemas.ts** interfaces |
| Generate request ID | **schemas.ts** → `generateRequestNumber()` |
| Handle OAuth login | **oauth.ts** functions |
| Manage user session | **session.ts** functions |
| Import voucher codes | **vouchers/import.ts** |
| Sync employees from SSO | **scim/client.ts** + **scim/sync.ts** |
| Get/set system config | **settings.ts** |

### 🎯 DataTable - Universal Solution

**✅ ALWAYS use DataTable for ALL list/table pages:**
- ✅ Simple master data (vehicles, drivers, rooms, etc.)
- ✅ Complex transactional pages (bookings with filters)
- ✅ Conditional actions (show buttons based on row data)
- ✅ Custom cell rendering (badges, HTML, formatting)

**All Pages Now Using DataTable:** ✅
- **Master Data**: `/admin/vehicles`, `/admin/drivers`, `/admin/rooms`, `/admin/transport-companies`, `/admin/trip-purposes`, `/admin/vouchers`, `/modules/*`
- **Transactional**: `/meeting/bookings`, `/transportation/bookings`

**❌ Custom tables are NO LONGER NEEDED**
- DataTable now handles filters, conditional actions, and custom rendering
- No need to build custom tables anymore!

---

## ⚠️ GAPS: What's MISSING (Don't Rebuild These)

### UI Components (Need to Create)
- ❌ Toast/Notification (currently using `alert()`)
- ❌ ConfirmDialog (currently using `confirm()`)
- ❌ FormField with validation
- ❌ Loading/Spinner
- ❌ Select with search
- ❌ DatePicker
- ❌ FileUpload
- ❌ Badge (status indicators)

### Infrastructure (Future Needs)
- ❌ Email sender utility
- ❌ File upload handler (server)
- ❌ Excel export utility
- ❌ Calendar (.ics) generator
- ❌ PDF generator
- ❌ QR code generator
- ❌ WebSocket utilities
- ❌ Push notification helpers

**If you need these**: Ask before building to avoid duplication.

---

## 📐 STYLING STANDARDS

### Colors
- Primary: `#667eea` → `#764ba2` (gradient)
- Success: `#48bb78` → `#38a169`
- Error: `#e53e3e`
- Background: `#f9fafb`
- Border: `#e2e8f0`

### Spacing
- Border radius: `6px`, `8px`, `12px`
- Gaps: `0.5rem`, `1rem`, `1.5rem`

### Breakpoint
- Mobile: `@media (max-width: 768px)`

---

## ✅ CHECKLIST: Before Writing New Code

1. ☐ Did I check this REUSABLES.md?
2. ☐ Did I check STANDARDS.md for CSS/Modal/Form standards?
3. ☐ Does a component/utility already exist?
4. ☐ Am I using global CSS classes (not duplicating styles)?
5. ☐ **Am I adding NO `<style>` tags to .svelte files?** ⭐ CRITICAL
6. ☐ Am I using DataTable for list/table pages?
7. ☐ Am I using Modal + form (not building custom dialog)?
8. ☐ Should my form be inline (< 10 fields) or separate component (10+)?
9. ☐ Am I using edit-as-view pattern (one form for create/view/edit)?
10. ☐ Am I using the client API wrapper (not raw fetch)?
11. ☐ Am I using response format in APIs?
12. ☐ Am I using validation utilities?
13. ☐ Am I using auth middleware for protected routes?

**If yes to all**: Proceed. **If no to any**: Use the reusable/standard first.
