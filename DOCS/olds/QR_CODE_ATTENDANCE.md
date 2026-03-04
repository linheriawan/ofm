# QR Code & Attendance System

## ✅ Changes Made

### **1. Replaced External QR Code API with Internal Generator**

**Before:**
- Used external API: `https://api.qrserver.com/v1/create-qr-code/`
- Required internet connection
- Privacy concern: Room URLs sent to external service
- Slower (network latency)

**After:**
- Internal QR code generation using `qrcode` library
- Works completely offline ✅
- Secure: No data sent externally ✅
- Faster: Generated client-side ✅

### **2. Redesigned Check-In System for Meeting Attendance**

**Before:**
- One QR code for booking
- Manual check-in button (unclear purpose)

**After:**
- **Two QR codes** with different purposes:
  1. **Quick Book** - When no meeting (for booking the room)
  2. **Mark Attendance** - When meeting active (for attendance)
- **Manual Entry button** - Fallback for participants without QR scanner

---

## 🏗️ Architecture

### QR Code Component

**Location:** `src/lib/components/QRCode.svelte`

**Features:**
- Reusable Svelte component
- Canvas-based rendering
- Configurable size, colors, error correction
- Reactive: Updates when value changes
- Error handling with fallback UI

**Usage:**
```svelte
<QRCode
  value="https://example.com/page"
  size={200}
  errorCorrectionLevel="M"
  darkColor="#000000"
  lightColor="#ffffff"
  margin={1}
/>
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | string | required | Data to encode |
| `size` | number | 200 | Width/height in pixels |
| `errorCorrectionLevel` | 'L'\|'M'\|'Q'\|'H' | 'M' | Error correction level |
| `margin` | number | 1 | Quiet zone size |
| `darkColor` | string | '#000000' | Dark module color |
| `lightColor` | string | '#ffffff' | Light module color |

---

## 📱 Attendance Workflow

### Scenario 1: QR Code Check-In (Primary Method)

```
Meeting starts
    ↓
Room display shows "MARK ATTENDANCE" QR code
    ↓
Participant scans QR with phone
    ↓
Opens: /display/attendance/{roomId}
    ↓
Mobile-optimized page loads
    ↓
Shows: Room name + Meeting title
    ↓
Participant enters Employee ID
    ↓
Clicks "Check In"
    ↓
POST /api/v1/meetings/{id}/checkin
{
  "userId": "123456",      // NIK (Nomor Induk Karyawan)
  "method": "qr",
  "isExternal": false
}
    ↓
Success: Shows confirmation ✓
Failure: Shows error message ⚠️
```

### Scenario 2: Manual Entry (Fallback)

```
Participant doesn't have phone / QR scanner not working
    ↓
Participant clicks "Manual Entry" button on display
    ↓
Modal appears on room display
    ↓
Admin/organizer enters participant's Employee ID
    ↓
Submits check-in
    ↓
POST /api/v1/meetings/{id}/checkin
{
  "userId": "123456",      // Internal participant (NIK)
  "method": "manual",
  "isExternal": false
}

// OR for external guest:
{
  "name": "John Client",
  "email": "john@client.com",  // Optional
  "method": "manual",
  "isExternal": true
}
```

---

## 🎨 Room Display - Right Sidebar

### When No Meeting (Available/Upcoming)

```
┌─────────────────┐
│   QUICK BOOK    │
│   [QR Code]     │  ← Booking QR (always visible)
│ Scan to book    │
│  this room      │
├─────────────────┤
│      NEXT       │
│    14:00        │  ← Next meeting
│  Team Meeting   │
└─────────────────┘
```

### When Meeting Active (Occupied)

```
┌─────────────────┐
│   QUICK BOOK    │
│   [QR Code]     │  ← Booking QR (always visible)
│ Scan to book    │
│  this room      │
├─────────────────┤
│ MARK ATTENDANCE │
│   [QR Code]     │  ← Attendance QR (meeting only)
│ Scan to check   │
│      in         │
│ [Manual Entry]  │  ← Manual button
├─────────────────┤
│      ENDS       │
│    15:00        │  ← Meeting end time
└─────────────────┘
```

---

## 📄 Files Modified/Created

### Created:
1. **`src/lib/components/QRCode.svelte`**
   - Reusable QR code component
   - Canvas-based rendering
   - Error handling

2. **`src/routes/(fullscreen)/display/attendance/[roomId]/+page.svelte`**
   - Mobile-optimized attendance page
   - Participant check-in interface
   - Success/error states

### Modified:
1. **`src/routes/(fullscreen)/display/room/[roomId]/+page.svelte`**
   - Import QRCode component
   - Added `attendanceUrl` state
   - Conditional QR display (booking vs attendance)
   - Renamed button to "Manual Entry"
   - Updated styling

2. **`src/routes/(app)/modules/room-displays/+page.svelte`**
   - Import QRCode component
   - Replaced external API with internal component

### Added Dependency:
```json
{
  "dependencies": {
    "qrcode": "^1.5.4"
  },
  "devDependencies": {
    "@types/qrcode": "^1.5.6"
  }
}
```

---

## 🔧 API Endpoint Required

### POST `/api/v1/meetings/{id}/checkin`

**Purpose:** Record meeting attendance (supports internal employees & external guests)

**Request (Internal Employee):**
```json
{
  "userId": "123456",      // NIK (Nomor Induk Karyawan)
  "method": "qr" | "manual",
  "isExternal": false
}
```

**Request (External Guest):**
```json
{
  "name": "John Client",
  "email": "john@client.com",  // Optional
  "method": "qr" | "manual",
  "isExternal": true
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Check-in successful",
  "data": {
    "meetingId": "meeting123",
    "meetingTitle": "Team Planning",
    "type": "internal" | "external",
    "userId": "123456",        // NIK for internal, null for external
    "name": "John Doe",
    "email": "john@company.com",
    "checkinTime": "2025-01-12T10:30:00Z",
    "method": "qr"
  }
}
```

**Error Responses:**

**404 - Meeting Not Found:**
```json
{
  "success": false,
  "error": "Meeting not found"
}
```

**400 - Check-In Window Not Open:**
```json
{
  "success": false,
  "error": "Check-in not available yet. Opens 15 minutes before meeting start."
}
```

**400 - Invalid Employee (Internal):**
```json
{
  "success": false,
  "error": "Employee not found"
}
```

**400 - Missing Name (External):**
```json
{
  "success": false,
  "error": "Name is required for external participants"
}
```

**409 - Already Checked In:**
```json
{
  "success": false,
  "error": "Already checked in to this meeting"
}
```

**Note:** No invitation requirement - anyone can check in during the meeting window (15 minutes before to meeting end)

---

## 💾 Database Schema

### Meeting Requests Collection (meeting_requests)

Attendance is stored as an embedded array within the meeting document:

```typescript
{
  _id: ObjectId,
  title: string,       // Meeting title (backward compatible with meetingTitle)
  roomId: string,      // Custom identifier like "R101" (NOT MongoDB _id)
  organizerId: string,
  participants: [{
    userId: string,    // NIK/Employee number
    email: string,
    name: string
  }],
  startTime: Date,
  endTime: Date,
  // Attendance tracking (supports internal & external)
  attendees: [{
    type: "internal" | "external",
    userId: string | null,  // NIK for internal, null for external
    name: string,
    email: string,
    checkinTime: Date,
    method: "qr" | "manual"
  }],
  updatedAt: Date,
  createdAt: Date
}
```

**Field Notes:**
- `userId` in users collection = NIK (Nomor Induk Karyawan / Employee ID Number)
- `roomId` = Custom identifier like "R101", "CONF-A" (NOT MongoDB ObjectId)
- `title` = Meeting title field (some older code may reference `meetingTitle`)
- `attendees` = Supports both internal employees and external guests
- No invitation requirement for check-in

**Benefits:**
- Atomic operations (no separate collection needed)
- Faster queries (no joins required)
- Duplicate prevention via array lookup before `$push`

---

## 🧪 Testing

### Test Internal QR Code Generation

1. Navigate to `/modules/room-displays`
2. Should see QR codes for each room
3. **Verify:** No network request to `api.qrserver.com`
4. **Verify:** QR codes visible and scannable
5. **Test offline:** Disconnect network, refresh page
6. **Expected:** QR codes still generate ✅

### Test Quick Book QR (No Meeting)

1. Navigate to room display with no active meeting
2. Right sidebar shows "QUICK BOOK" QR
3. Scan with phone
4. **Expected:** Opens `/modules/meetings/new?roomId={roomId}`

### Test Attendance QR (During Meeting)

1. Navigate to room display with active meeting
2. Right sidebar shows "MARK ATTENDANCE" QR
3. Scan with phone
4. **Expected:** Opens `/display/attendance/{roomId}`
5. Enter employee ID
6. Click "Check In"
7. **Expected:** Success message if API implemented

### Test Manual Entry

1. During active meeting, click "Manual Entry" button
2. **Expected:** Modal appears
3. Enter employee ID
4. Submit
5. **Expected:** API call to check-in endpoint

---

## 🎯 Benefits

### Security
- ✅ No external API dependency
- ✅ No room URLs sent to third parties
- ✅ Works in isolated/airgapped networks

### Performance
- ✅ Faster QR generation (client-side)
- ✅ No network latency
- ✅ Works offline completely

### User Experience
- ✅ Clear distinction: Booking vs Attendance
- ✅ Mobile-optimized attendance page
- ✅ Manual entry fallback for accessibility

### Tracking
- ✅ Track who attended vs who was invited
- ✅ Attendance method (QR vs manual)
- ✅ Check-in timestamps
- ✅ Attendance reports and analytics

---

## 📊 Use Cases

### 1. Compliance Tracking
- Mandatory meetings (HR, Safety)
- Track who actually attended
- Generate compliance reports

### 2. Room Utilization Analytics
- Actual attendance vs booked capacity
- No-show rate calculation
- Right-sizing recommendations

### 3. Department Billing
- Bill departments for actual room usage
- Hours used × attendees present
- Fair cost allocation

### 4. Meeting Effectiveness
- Attendance rate trends
- Late arrival tracking (if extended)
- Engagement metrics

---

## 🚀 Future Enhancements

### Attendance System
- [ ] Late arrival tracking (timestamp analysis)
- [ ] Auto check-out when meeting ends
- [ ] Check-in reminders (push notifications)
- [ ] Attendance reports dashboard
- [ ] Export attendance to Excel/PDF
- [ ] Integration with HR systems

### QR Code
- [ ] Customizable QR code branding (logo embed)
- [ ] Color-coded QR codes by status
- [ ] Animated QR codes for attention
- [ ] Multi-language attendance pages
- [ ] Accessibility improvements (voice input)

### Advanced Features
- [ ] Facial recognition check-in
- [ ] NFC tag check-in
- [ ] Bluetooth beacon auto check-in
- [ ] Integration with calendar invites
- [ ] Participant photo capture on check-in

---

## 🔍 Troubleshooting

### QR Code Not Generating

**Check:**
1. Is `qrcode` package installed?
   ```bash
   bun install
   ```
2. Browser console for errors
3. Canvas support in browser

**Debug:**
```typescript
console.log('QR Value:', value);
console.log('Canvas:', canvas);
```

### QR Code Not Scanning

**Common Issues:**
- QR code too small (increase `size` prop)
- Poor lighting (adjust phone camera)
- Reflections on screen (adjust viewing angle)
- Damaged QR code (check error correction level)

**Fix:**
```svelte
<QRCode
  value={url}
  size={150}              <!-- Increase size -->
  errorCorrectionLevel="H" <!-- Higher error correction -->
/>
```

### Attendance Page Not Loading

**Check:**
1. URL correct: `/display/attendance/{roomId}`
2. Room ID valid
3. API endpoint accessible
4. Mobile viewport settings

**Debug:**
```bash
# Check route exists
curl http://localhost:5174/display/attendance/R101
```

### Check-In API Failing

**Check:**
1. API endpoint implemented?
2. Employee ID format valid?
3. Meeting ID correct?
4. Network connectivity?

**Debug:**
```javascript
console.log('Meeting ID:', roomData.currentMeeting.bookingId);
console.log('Employee ID:', employeeId);
```

---

## 📚 Related Documentation

- [ROOM_DISPLAY.md](./ROOM_DISPLAY.md) - Room display system
- [ROOM_DISPLAY_FEATURES.md](./ROOM_DISPLAY_FEATURES.md) - Display features
- [API.md](./API.md) - API reference
- [BUSINESS_PROCESS.md](./BUSINESS_PROCESS.md) - Business workflows

---

**Last Updated:** 2025-01-12
**Version:** 1.0.0
