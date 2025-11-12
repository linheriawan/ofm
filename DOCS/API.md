# OFM API Documentation

RESTful API for Office Facility Management System

**Base URL**: `http://localhost:5174/api/v1`

**Authentication**: Bearer token (JWT from Aksara SSO) or Session cookie

---

## 📋 Response Format

All API responses follow this standard format:

```json
{
  "success": true|false,
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

- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Input validation failed
- `DUPLICATE_ERROR` - Duplicate entry
- `INTERNAL_ERROR` - Server error
- `BAD_REQUEST` - Invalid request
- `CONFLICT` - Resource conflict

---

## 🚗 Transportation Module

### Create Transport Request

**POST** `/transport/requests`

Create a new transportation request (company car or voucher).

**Body:**
```json
{
  "type": "company_car" | "voucher",
  "pickup": {
    "address": "Jakarta Office",
    "latitude": -6.2088,
    "longitude": 106.8456
  },
  "destination": {
    "address": "Surabaya Office",
    "latitude": -7.2575,
    "longitude": 112.7521
  },
  "scheduledTime": "2025-10-20T09:00:00Z",
  "returnTime": "2025-10-20T17:00:00Z",
  "isRoundTrip": true,
  "passengerCount": 2,
  "passengers": ["colleague@example.com"],
  "purpose": "Business meeting",
  "priority": "medium",
  "specialRequirements": "Need wheelchair accessible vehicle"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "requestNumber": "TR-20251020-1234",
    "status": "pending",
    ...
  }
}
```

### List Transport Requests

**GET** `/transport/requests`

List all transportation requests with filters.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)
- `status` (pending | approved | rejected | cancelled | completed)
- `type` (company_car | voucher)
- `startDate` (ISO 8601)
- `endDate` (ISO 8601)
- `userId` (string, admin only)

**Response:** `200 OK`

### Get Request Details

**GET** `/transport/requests/:id`

Get detailed information about a specific request.

**Response:** `200 OK`

### Update Request

**PATCH** `/transport/requests/:id`

Update request status (approve/reject/cancel).

**Body (Admin - Approve):**
```json
{
  "status": "approved",
  "vehicleId": "507f1f77bcf86cd799439012",
  "driverId": "507f1f77bcf86cd799439013"
}
```

**Body (Admin - Reject):**
```json
{
  "status": "rejected",
  "rejectionReason": "No vehicles available"
}
```

**Body (User - Cancel):**
```json
{
  "status": "cancelled"
}
```

**Response:** `200 OK`

### Delete Request

**DELETE** `/transport/requests/:id`

Cancel a request (soft delete).

**Response:** `200 OK`

---

## 🚙 Driver Module

### Get Driver Assignments

**GET** `/driver/assignments`

Get assigned trips for the authenticated driver.

**Query Parameters:**
- `date` (ISO 8601 date, default: today)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "date": "2025-10-20",
    "driverId": "user123",
    "driverName": "John Doe",
    "assignedVehicleId": "vehicle456",
    "trips": [
      {
        "_id": "trip789",
        "requestNumber": "TR-20251020-1234",
        "scheduledTime": "2025-10-20T09:00:00Z",
        "pickup": { ... },
        "destination": { ... },
        "passengerName": "Jane Smith",
        "passengerEmail": "jane@example.com"
      }
    ],
    "totalTrips": 3
  }
}
```

### Update Driver Location

**POST** `/driver/location`

Update driver's GPS location.

**Body:**
```json
{
  "latitude": -6.2088,
  "longitude": 106.8456,
  "accuracy": 10,
  "speed": 60,
  "heading": 180,
  "tripId": "trip789",
  "isOnDuty": true
}
```

**Response:** `200 OK`

### Start Trip

**POST** `/driver/trip/:id/start`

Confirm trip start (ATA - Actual Time of Arrival at pickup).

**Body:**
```json
{
  "location": {
    "address": "Jakarta Office",
    "latitude": -6.2088,
    "longitude": 106.8456
  },
  "notes": "Arrived on time",
  "photos": ["url1", "url2"]
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "message": "Trip started successfully",
    "delayMinutes": 0
  }
}
```

### Complete Trip

**POST** `/driver/trip/:id/complete`

Confirm trip completion (ATD - Actual Time of Departure/Delivery).

**Body:**
```json
{
  "location": {
    "address": "Surabaya Office",
    "latitude": -7.2575,
    "longitude": 112.7521
  },
  "notes": "Passenger delivered safely",
  "photos": ["url1"],
  "passengerSignature": "base64_encoded_image"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "message": "Trip completed successfully",
    "duration": 480
  }
}
```

---

## 🏢 Meeting Module

### Create Meeting Request

**POST** `/meeting/requests`

Create a new meeting request.

**Body:**
```json
{
  "title": "Board Meeting",
  "description": "Q4 Review",
  "type": "hybrid",
  "startTime": "2025-10-25T14:00:00Z",
  "endTime": "2025-10-25T16:00:00Z",
  "participantCount": 10,
  "participants": ["user1@example.com", "user2@example.com"],
  "externalParticipants": 2,
  "roomId": "room123",
  "locationId": "loc456",
  "platform": "zoom",
  "requiredFacilities": ["projector", "whiteboard"],
  "cateringRequired": true,
  "cateringDetails": {
    "type": "lunch",
    "itemCount": 12,
    "notes": "Vegetarian options needed"
  }
}
```

**Response:** `201 Created`

### List Meeting Requests

**GET** `/meeting/requests`

List all meeting requests with filters.

**Query Parameters:**
- `page`, `limit` (pagination)
- `status` (pending | approved | rejected | cancelled | completed)
- `type` (online | offline | hybrid)
- `roomId` (string)
- `startDate`, `endDate` (ISO 8601)

**Response:** `200 OK`

### Meeting Check-In (Attendance)

**POST** `/api/v1/meetings/{id}/checkin`

Record meeting attendance. Supports both internal employees and external guests. No invitation required - anyone can check in during the meeting window (15 minutes before to meeting end).

**Path Parameters:**
- `id` (string) - Meeting ID (MongoDB ObjectId)

**Body:**
```json
// Internal employee check-in
{
  "userId": "123456",  // NIK (Nomor Induk Karyawan)
  "method": "qr" | "manual",
  "isExternal": false
}

// External guest check-in
{
  "name": "John Client",
  "email": "john@client.com",  // optional
  "method": "qr" | "manual",
  "isExternal": true
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Check-in successful",
  "data": {
    "meetingId": "meeting123",
    "meetingTitle": "Team Planning",
    "type": "internal" | "external",
    "userId": "123456",
    "name": "Employee Name",
    "email": "employee@company.com",
    "checkinTime": "2025-01-12T10:30:00Z",
    "method": "qr"
  }
}
```

**Error Responses:**
- `404` - Meeting not found
- `400` - Check-in window not open yet or meeting has ended
- `400` - Employee not found (internal) or name missing (external)
- `409` - Already checked in

### Get Meeting Attendance

**GET** `/api/v1/meetings/{id}/checkin`

Retrieve attendance list for a meeting with statistics.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "meetingId": "meeting123",
    "meetingTitle": "Team Planning",
    "startTime": "2025-01-12T10:00:00Z",
    "endTime": "2025-01-12T11:00:00Z",
    "totalInvited": 10,
    "totalCheckedIn": 7,
    "attendanceRate": 70.0,
    "attendees": [
      {
        "type": "internal",
        "userId": "123456",
        "name": "Employee Name",
        "email": "employee@company.com",
        "checkinTime": "2025-01-12T10:05:00Z",
        "method": "qr"
      },
      {
        "type": "external",
        "userId": null,
        "name": "Guest Name",
        "email": "guest@client.com",
        "checkinTime": "2025-01-12T10:10:00Z",
        "method": "manual"
      }
    ]
  }
}
```

---

## 📦 Facility Module (NEW)

### Create Facility Request

**POST** `/facility/requests`

Create a new facility/office supplies request.

**Body:**
```json
{
  "type": "atk",
  "category": "office_supplies",
  "items": [
    {
      "itemName": "Ballpoint Pen",
      "itemCode": "PEN-001",
      "quantity": 50,
      "unit": "pcs",
      "description": "Blue ink",
      "estimatedPrice": 2000
    },
    {
      "itemName": "A4 Paper",
      "itemCode": "PAPER-001",
      "quantity": 10,
      "unit": "ream",
      "estimatedPrice": 35000
    }
  ],
  "deliveryLocation": "Building A, Floor 3",
  "deliveryDate": "2025-10-22T00:00:00Z",
  "urgency": "medium",
  "purpose": "Monthly office supplies restocking",
  "notes": "Please deliver during office hours"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "_id": "req123",
    "requestNumber": "FR-20251020-5678",
    "status": "pending",
    "estimatedCost": 450000,
    ...
  }
}
```

### List Facility Requests

**GET** `/facility/requests`

List all facility requests with filters.

**Query Parameters:**
- `page`, `limit` (pagination)
- `status` (pending | approved | rejected | cancelled | completed)
- `type` (atk | equipment | furniture | other)
- `category` (string)
- `urgency` (low | medium | high | urgent)

**Response:** `200 OK`

---

## 🔐 Authentication

### Session-based (Web App)

Include session cookie `ofm_session` in requests.

### Token-based (Mobile Apps)

Include Bearer token in Authorization header:

```
Authorization: Bearer <jwt_token>
```

**Get Token from SSO:**

1. Redirect to: `http://localhost:5173/oauth/authorize`
2. Exchange code for token: `POST http://localhost:5173/oauth/token`
3. Use access token for API requests

---

## 📊 Common Patterns

### Pagination

All list endpoints support pagination:

**Request:**
```
GET /api/v1/transport/requests?page=2&limit=50
```

**Response:**
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "page": 2,
    "limit": 50,
    "total": 150
  }
}
```

### Filtering

Use query parameters to filter results:

```
GET /api/v1/transport/requests?status=pending&type=company_car&startDate=2025-10-01
```

### Error Handling

**Example Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "scheduledTime",
        "message": "scheduledTime is required"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-10-16T10:00:00.000Z"
  }
}
```

---

## 🧪 Testing

### Get Session Cookie

To test API endpoints, you need authentication:

1. **Via Browser:**
   - Open DevTools (F12)
   - Go to Application → Cookies
   - Look for `ofm_session`
   - Copy the value

2. **Via Login:**
   - Login at `http://localhost:5174`
   - Use SSO credentials
   - Cookie is automatically set

### Test 1: Create Transport Request

```bash
curl -X POST http://localhost:5174/api/v1/transport/requests \
  -H "Content-Type: application/json" \
  -H "Cookie: ofm_session=<your_session>" \
  -d '{
    "type": "company_car",
    "pickup": {
      "address": "Jakarta Office",
      "latitude": -6.2088,
      "longitude": 106.8456
    },
    "destination": {
      "address": "Bandung Office",
      "latitude": -6.9175,
      "longitude": 107.6191
    },
    "scheduledTime": "2025-10-25T09:00:00Z",
    "isRoundTrip": false,
    "passengerCount": 2,
    "purpose": "Client meeting"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "requestNumber": "TR-20251025-1234",
    "status": "pending",
    "type": "company_car",
    ...
  },
  "meta": {
    "timestamp": "2025-10-25T10:00:00.000Z"
  }
}
```

### Test 2: List Requests

```bash
curl http://localhost:5174/api/v1/transport/requests?page=1&limit=10 \
  -H "Cookie: ofm_session=<your_session>"
```

### Verify in Database

After creating requests, verify in MongoDB:

```javascript
// In MongoDB Compass or Atlas
db.transportation_requests.find({}).limit(10)
```

**Should see:**
- ✅ Correct `requestNumber` format (TR-YYYYMMDD-XXXX)
- ✅ Status = "pending"
- ✅ All required fields populated
- ✅ Timestamps (`createdAt`, `updatedAt`)

### Using Postman

1. Import collection: `DOCS/OFM_API.postman_collection.json` (TODO)
2. Set environment variables:
   - `BASE_URL`: `http://localhost:5174/api/v1`
   - `SESSION_COOKIE`: Your session cookie or Bearer token

---

## 📝 Notes

- All dates must be in ISO 8601 format
- Maximum request size: 10MB
- Rate limit: 100 requests per minute per user
- Responses are cached for 60 seconds for GET requests

---

**Last Updated:** 2025-10-16
