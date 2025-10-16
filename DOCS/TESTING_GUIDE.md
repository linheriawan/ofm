# API Testing Guide

Before building mobile apps, we **MUST** verify the API works correctly!

---

## 🎯 Why Test Now?

**Problem**: If API has bugs and we build mobile apps, we'll waste time debugging mobile code when the issue is in the backend.

**Solution**: Test and fix API first, then build mobile apps confidently.

---

## ⚡ Quick Start

### 1. Start the Server

```bash
cd /Users/heriawan/Project/jss/ofm
bun run dev
```

Server should be running on `http://localhost:5174`

### 2. Login to Get Session

1. Open browser: `http://localhost:5174`
2. Click "Sign in with Aksara SSO"
3. Login with: `admin@ias.co.id` / `password123`
4. You should see the dashboard

### 3. Run API Tests

```bash
# In a new terminal
bun run test:api
```

This will test:
- ✅ Creating transportation requests
- ✅ Creating meeting requests
- ✅ Creating facility requests
- ✅ Listing requests with pagination
- ✅ Filtering by status
- ✅ Validation errors
- ✅ Edge cases

### 4. Check Results

Expected output:
```
🧪 Testing: Transportation: Create company car request...
✅ PASSED (234ms)

🧪 Testing: Transportation: List all requests...
✅ PASSED (123ms)

...

📊 TEST RESULTS SUMMARY
========================================
Total Tests: 12
✅ Passed: 12
❌ Failed: 0
⏱️  Average Duration: 145.67ms

Success Rate: 100.0%

✅ All tests passed! API is ready for mobile app development.
```

---

## 🧪 Manual Testing with cURL

### Test 1: Create Transport Request

```bash
curl -X POST http://localhost:5174/api/v1/transport/requests \
  -H "Content-Type: application/json" \
  -H "Cookie: ofm_session=YOUR_SESSION_COOKIE" \
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
    "requestNumber": "TR-20251016-1234",
    "status": "pending",
    "type": "company_car",
    ...
  },
  "meta": {
    "timestamp": "2025-10-16T10:00:00.000Z"
  }
}
```

### Test 2: List Requests

```bash
curl http://localhost:5174/api/v1/transport/requests?page=1&limit=10 \
  -H "Cookie: ofm_session=YOUR_SESSION_COOKIE"
```

### Test 3: Get Session Cookie

Open browser DevTools → Application → Cookies → Look for `ofm_session`

---

## 🔍 What to Check

### 1. Database Verification

After creating requests, check MongoDB:

```javascript
// In MongoDB Compass or Atlas
db.transportation_requests.find({}).limit(10)
```

Should see your created requests with:
- ✅ Correct `requestNumber` format (TR-YYYYMMDD-XXXX)
- ✅ Status = "pending"
- ✅ All required fields populated
- ✅ Timestamps (`createdAt`, `updatedAt`)

### 2. Web UI Verification

1. Go to `/transportation/request`
2. Fill and submit form
3. Should redirect to `/transportation/bookings`
4. Check if request appears in the list

### 3. Permission Testing

**Test as Employee** (default user):
- ✅ Can create requests
- ✅ Can see own requests
- ❌ Cannot see other users' requests
- ❌ Cannot approve/reject requests

**Test as Admin** (change role in database):
- ✅ Can see all requests
- ✅ Can approve/reject requests
- ✅ Can assign drivers/vehicles

---

## 🐛 Common Issues & Fixes

### Issue 1: "Authentication required"

**Cause**: No session cookie or expired session

**Fix**:
1. Login again in browser
2. Get fresh session cookie
3. Make sure SSO server is running (port 5173)

### Issue 2: "Validation failed"

**Cause**: Missing required fields or wrong format

**Fix**: Check API docs for required fields and format

### Issue 3: "Internal server error"

**Cause**: Database connection or server error

**Fix**:
1. Check MongoDB connection in `.env`
2. Check server console for errors
3. Restart server

### Issue 4: Empty response / No data

**Cause**: Database is empty

**Fix**: Create some test data first (use web UI or test script)

---

## 📋 Test Checklist

Before building mobile apps, verify:

- [ ] **Transportation Module**
  - [ ] Can create company car request
  - [ ] Can create voucher request
  - [ ] Can list requests with pagination
  - [ ] Can filter by status
  - [ ] Can get single request
  - [ ] Validation works (missing fields)
  - [ ] Request number is generated correctly

- [ ] **Meeting Module**
  - [ ] Can create meeting request
  - [ ] Can handle online/offline/hybrid types
  - [ ] Duration validation works (max 8 hours)
  - [ ] Can list meetings
  - [ ] Participants are saved

- [ ] **Facility Module**
  - [ ] Can create facility request
  - [ ] Multiple items work
  - [ ] Cost calculation is correct
  - [ ] Can list facility requests

- [ ] **General**
  - [ ] Pagination works (page, limit)
  - [ ] Filtering works (status, date, type)
  - [ ] Error messages are clear
  - [ ] Response format is consistent
  - [ ] Timestamps are correct

- [ ] **Performance**
  - [ ] API responds < 500ms
  - [ ] Can handle 10+ concurrent requests
  - [ ] Large lists load quickly

---

## 🚀 Next Steps After Testing

Once all tests pass:

1. ✅ **Fix any bugs found**
2. ✅ **Add database indexes** (for performance)
3. ✅ **Create more seed data** (for realistic testing)
4. ✅ **Document edge cases**
5. 🎯 **Start building Android Driver App** (Week 3-4)

---

## 📊 Success Criteria

API is ready for mobile development when:

✅ All automated tests pass (12/12)
✅ Manual testing works for all modules
✅ Data saves correctly in MongoDB
✅ Web UI can create and view requests
✅ No console errors
✅ Response times < 500ms
✅ Error messages are user-friendly

---

**Current Status**: ⏳ Ready to test
**Next Action**: Run `bun run test:api`

