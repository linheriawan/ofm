# M7 - API

Backend REST API serving web and mobile clients. Built with SvelteKit API routes under `/api/v1/*`. 22+ endpoint groups with standardized response format, pagination, and session/token authentication.

**Base URL:** `http://localhost:5174/api/v1`

---

## Authentication

### Session-based (Web App)

Include session cookie `ofm_session` in requests.

### Token-based (Mobile Apps)

Include Bearer token in Authorization header:

```
Authorization: Bearer <jwt_token>
```

---

## Response Format

All endpoints return a standardized JSON format:

```json
{
  "success": true,
  "data": { ... },
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": { ... }
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "timestamp": "2025-10-16T10:00:00.000Z"
  }
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Input validation failed |
| `DUPLICATE_ERROR` | Duplicate entry |
| `INTERNAL_ERROR` | Server error |
| `BAD_REQUEST` | Invalid request |
| `CONFLICT` | Resource conflict |

---

## Pagination

All list endpoints support pagination via query parameters:

| Parameter | Default | Max |
|-----------|---------|-----|
| `page` | 1 | - |
| `limit` | 20 | 100 |

Response includes `meta.page`, `meta.limit`, `meta.total`.

---

## Endpoint Groups

### M7.1 Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/settings?category={cat}` | Get settings by category |
| PUT | `/settings` | Update multiple settings |

---

### M7.2 Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | List users (paginated) |
| GET | `/users/:id` | Get user details |
| POST | `/users` | Create user |
| PUT | `/users/:id` | Update user |
| DELETE | `/users/:id` | Delete user |

---

### M7.3 Roles

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/roles` | List roles |
| POST | `/roles` | Create role |

---

### M7.4 Positions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/positions` | List positions |
| POST | `/positions` | Create position |

---

### M7.5 Departments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/departments` | List departments |
| POST | `/departments` | Create department |

---

### M7.6 Companies

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/companies` | List companies |
| POST | `/companies` | Create company |

---

### M7.7 Approval Workflows (Planned)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/approval-workflows` | List pending approvals |
| POST | `/approval-workflows/:id/approve` | Approve request |
| POST | `/approval-workflows/:id/reject` | Reject request |

---

### M7.8 Sync

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/sync` | Trigger full SCIM sync |
| GET | `/sync/status` | Get sync status |

---

### M7.9 SCIM

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/scim/webhook` | Receive SCIM webhook events |
| POST | `/scim/test` | Test SCIM connection |

---

### M7.10 Locations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/locations` | List locations |
| POST | `/locations` | Create location |

---

### M7.11 Rooms

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/rooms` | List rooms |
| GET | `/rooms/:id` | Get room details |
| GET | `/rooms/:id/schedule` | Get room day schedule |
| POST | `/rooms` | Create room |
| PUT | `/rooms/:id` | Update room |
| DELETE | `/rooms/:id` | Delete room |

---

### M7.12 Devices

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/devices` | List devices |
| POST | `/devices` | Register device |
| PUT | `/devices/:id` | Update device |
| DELETE | `/devices/:id` | Remove device |

---

### M7.13 Facilities (Planned)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/facilities/requests` | Create facility request |
| GET | `/facilities/requests` | List facility requests |

---

### M7.14 Videos

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/videos` | List videos |
| POST | `/videos` | Upload video |

---

### M7.15 Meeting (Single)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/meeting/requests` | Create meeting request |
| GET | `/meeting/requests` | List meeting requests |
| GET | `/meeting/requests/:id` | Get meeting details |
| PATCH | `/meeting/requests/:id` | Update meeting status |
| DELETE | `/meeting/requests/:id` | Cancel meeting |

---

### M7.16 Meetings (Collection)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/meetings` | List all meetings |
| POST | `/meetings/:id/checkin` | Record attendance |
| GET | `/meetings/:id/checkin` | Get attendance list |

---

### M7.17 Transport

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/transport/requests` | Create transport request |
| GET | `/transport/requests` | List transport requests |
| GET | `/transport/requests/:id` | Get request details |
| PATCH | `/transport/requests/:id` | Update status (approve/reject/cancel) |
| DELETE | `/transport/requests/:id` | Cancel request |

---

### M7.18 Drivers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/drivers` | List drivers |
| GET | `/drivers/:id` | Get driver details |
| POST | `/drivers` | Create driver |
| PUT | `/drivers/:id` | Update driver |
| DELETE | `/drivers/:id` | Delete driver |

---

### M7.19 Vehicles

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/vehicles` | List vehicles |
| GET | `/vehicles/:id` | Get vehicle details |
| POST | `/vehicles` | Create vehicle |
| PUT | `/vehicles/:id` | Update vehicle |
| DELETE | `/vehicles/:id` | Delete vehicle |

---

### M7.20 Trip Purposes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/trip-purposes` | List trip purposes |
| POST | `/trip-purposes` | Create trip purpose |
| PUT | `/trip-purposes/:id` | Update trip purpose |
| DELETE | `/trip-purposes/:id` | Delete trip purpose |

---

### M7.21 Transport Companies

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/transport-companies` | List transport companies |
| POST | `/transport-companies` | Create transport company |
| PUT | `/transport-companies/:id` | Update transport company |
| DELETE | `/transport-companies/:id` | Delete transport company |

---

### M7.22 Vouchers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/vouchers` | List vouchers |
| POST | `/vouchers` | Create voucher |
| POST | `/vouchers/import` | CSV import |
| GET | `/vouchers/export` | CSV export |
| PUT | `/vouchers/:id` | Update voucher |
| DELETE | `/vouchers/:id` | Delete voucher |

---

### Driver API (Mobile)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/driver/assignments` | Get driver's assigned trips |
| POST | `/driver/location` | Update GPS location |
| POST | `/driver/trip/:id/start` | Confirm ATA (trip start) |
| POST | `/driver/trip/:id/complete` | Confirm ATD (trip complete) |

---

## Common Patterns

- **Filtering:** Query params on list endpoints (e.g., `?status=pending&type=company_car&startDate=2025-10-01`)
- **Request numbers:** See [reusables.md](../technical/reusables.md) for `generateRequestNumber()` format
- **Dates:** ISO 8601 format
- **Max request size:** 10MB
- **Rate limit:** 100 req/min per user
- **Cache:** GET responses cached 60 seconds
