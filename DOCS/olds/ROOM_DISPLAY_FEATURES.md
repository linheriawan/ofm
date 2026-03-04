# Room Display Features Guide

## QR Code - Quick Book

### What It Does
Displays a scannable QR code on the room display that allows employees to quickly book the meeting room using their mobile device.

### How It Works

1. **QR Code Generation**
   - Uses free API: `https://api.qrserver.com/v1/create-qr-code/`
   - Generates a 200x200px QR code
   - Points to: `{origin}/modules/meetings/new?roomId={roomId}`

2. **User Flow**
   ```
   Employee → Scans QR code on room display
           → Opens booking page on phone
           → Pre-filled with room ID
           → Fills in meeting details
           → Submits booking
   ```

3. **Location**
   - Right sidebar of room display
   - Above "Next Meeting" widget
   - Always visible

### Implementation

**Code Location:** `src/routes/(fullscreen)/display/room/[roomId]/+page.svelte`

**QR Code URL Function:**
```typescript
function getQRCodeUrl(url: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
}
```

**Booking URL:**
```typescript
bookingUrl = `${window.location.origin}/modules/meetings/new?roomId=${roomId}`;
```

**Render:**
```svelte
<div class="qr-section">
  <div class="qr-label">QUICK BOOK</div>
  <div class="qr-code">
    {#if bookingUrl}
      <img src={getQRCodeUrl(bookingUrl)} alt="Scan to book this room" class="qr-image" />
    {:else}
      <div class="qr-placeholder">Loading...</div>
    {/if}
  </div>
</div>
```

---

## Check-In Feature

### What It Does
Allows meeting participants to check in to the current meeting using:
1. **Employee ID** (manual entry)
2. **QR Code scan** (coming soon)

### How It Works

1. **Trigger Check-In**
   - Click "CHECK IN" button (appears when meeting is active)
   - Button location: Right sidebar, when `roomData.currentMeeting` exists

2. **Check-In Modal**
   ```
   User clicks "CHECK IN"
   → Modal appears with:
      - Meeting title
      - Employee ID input field
      - QR scanner placeholder
      - Submit/Cancel buttons
   ```

3. **Manual Check-In Flow**
   ```
   User enters Employee ID (e.g., E12345)
   → Clicks "Check In" button
   → POST /api/v1/meetings/{meetingId}/checkin
   → Server validates employee
   → Success: Shows confirmation
   → Failure: Shows error message
   ```

### Implementation

**Check-In Button:**
```svelte
{#if roomData.currentMeeting}
  <div class="current-meeting-widget">
    <div class="widget-label">ENDS</div>
    <div class="end-time">{formatTime(roomData.currentMeeting.endTime)}</div>
    <button class="checkin-btn-small" onclick={handleCheckin}>
      CHECK IN
    </button>
  </div>
{/if}
```

**Handle Check-In:**
```typescript
function handleCheckin() {
  isCheckinMode = true;         // Open modal
  employeeIdInput = '';         // Clear input
  checkinError = '';            // Clear errors
}
```

**Submit Check-In:**
```typescript
async function handleCheckinSubmit() {
  if (!employeeIdInput.trim()) {
    checkinError = 'Please enter your Employee ID';
    return;
  }

  if (!roomData.currentMeeting) {
    checkinError = 'No active meeting to check in to';
    return;
  }

  checkingIn = true;
  checkinError = '';

  try {
    const response = await fetch(`/api/v1/meetings/${roomData.currentMeeting.id}/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: employeeIdInput.trim(),
        method: 'manual'
      })
    });

    const result = await response.json();

    if (result.success) {
      alert(`Check-in successful!\nMeeting: ${result.data.meetingTitle}`);
      isCheckinMode = false;
      loadSchedule(); // Refresh to update status
    } else {
      checkinError = result.error || 'Check-in failed';
    }
  } catch (error) {
    console.error('Check-in error:', error);
    checkinError = 'Failed to connect to server';
  } finally {
    checkingIn = false;
  }
}
```

**Modal UI:**
```svelte
{#if isCheckinMode}
  <div class="modal">
    <div class="modal-content">
      <h2>Check In</h2>
      {#if roomData.currentMeeting}
        <p class="meeting-info">Meeting: <strong>{roomData.currentMeeting.title}</strong></p>
      {/if}
      <p>Scan your QR code or enter your employee ID</p>

      <div class="qr-scanner">
        <div class="scanner-frame">
          📷 QR Scanner (Coming Soon)
        </div>
      </div>

      <input
        type="text"
        placeholder="Enter Employee ID (e.g., E12345)"
        class="employee-id-input"
        bind:value={employeeIdInput}
        disabled={checkingIn}
        onkeydown={(e) => e.key === 'Enter' && handleCheckinSubmit()}
      />

      {#if checkinError}
        <div class="checkin-error">
          ⚠️ {checkinError}
        </div>
      {/if}

      <div class="modal-actions">
        <button class="btn-cancel" onclick={() => isCheckinMode = false} disabled={checkingIn}>
          Cancel
        </button>
        <button class="btn-submit" onclick={handleCheckinSubmit}
                disabled={checkingIn || !employeeIdInput.trim()}>
          {checkingIn ? 'Checking in...' : 'Check In'}
        </button>
      </div>
    </div>
  </div>
{/if}
```

### API Endpoint

**POST** `/api/v1/meetings/{id}/checkin`

**Request Body:**
```json
{
  "userId": "123456",  // NIK (Nomor Induk Karyawan)
  "method": "manual",
  "isExternal": false
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Check-in successful",
  "data": {
    "meetingId": "meeting123",
    "meetingTitle": "Project Planning",
    "type": "internal",
    "userId": "123456",
    "name": "Employee Name",
    "email": "employee@company.com",
    "checkinTime": "2025-01-12T10:30:00Z",
    "method": "manual"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Employee not found" // No invitation required - anyone can check in
}
```

---

## Styling

### QR Code Section
```css
.qr-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.qr-label {
  font-size: 0.7rem;
  color: #fbbf24;
  font-weight: 700;
  letter-spacing: 1px;
  text-shadow: 0 0 6px rgba(0, 0, 0, 0.9);
}

.qr-code {
  padding: 0.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
}

.qr-image {
  display: block;
  width: 100px;
  height: 100px;
  border-radius: 4px;
}
```

### Check-In Button
```css
.checkin-btn-small {
  margin-top: 0.5rem;
  padding: 0.8rem 1.2rem;
  font-size: 0.8rem;
  font-weight: 700;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  letter-spacing: 1px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
}

.checkin-btn-small:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.6);
}
```

### Modal
```css
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  padding: 3rem;
  border-radius: 16px;
  max-width: 500px;
  width: 90%;
}
```

---

## Troubleshooting

### QR Code Not Showing

**Check:**
1. Is `bookingUrl` set? (Check browser console)
2. Is the API accessible? (Check network tab)
3. Image blocked by firewall/CSP?

**Debug:**
```typescript
console.log('Booking URL:', bookingUrl);
console.log('QR Code URL:', getQRCodeUrl(bookingUrl));
```

**Fix:**
- Ensure `onMount` runs and sets `bookingUrl`
- Check Content Security Policy allows external images
- Verify API is accessible: `https://api.qrserver.com/v1/create-qr-code/`

### Check-In Button Not Working

**Check:**
1. Is there an active meeting? (`roomData.currentMeeting`)
2. Is modal appearing? (z-index issue?)
3. Any JavaScript errors in console?

**Debug:**
```typescript
function handleCheckin() {
  console.log('Check-in clicked!');
  console.log('Current meeting:', roomData.currentMeeting);
  isCheckinMode = true;
}
```

**Fix:**
- Modal has `z-index: 2000` (should be visible above all)
- Button only shows when `roomData.currentMeeting` exists
- Check browser console for errors

### Check-In Submission Fails

**Check:**
1. Is API endpoint implemented? (`/api/v1/meetings/{id}/checkin`)
2. Employee ID valid?
3. Network errors?

**Debug:**
```typescript
console.log('Submitting check-in for:', employeeIdInput);
console.log('Meeting ID:', roomData.currentMeeting.id);
```

**Common Errors:**
- `"Employee not found"` - Invalid employee ID
- `"Employee not invited"` - Employee not in participant list
- `"No active meeting"` - Meeting already ended
- `"Failed to connect"` - API endpoint not implemented

---

## Future Enhancements

### QR Code
- [ ] Add tap-to-copy booking URL
- [ ] Show booking QR code for upcoming meetings
- [ ] Generate Wi-Fi QR code for room
- [ ] Customizable QR code colors/branding

### Check-In
- [ ] Actual QR code scanner (camera)
- [ ] NFC tag support
- [ ] Biometric check-in (fingerprint/face)
- [ ] Attendance tracking and reports
- [ ] Late check-in penalties
- [ ] Auto check-out when meeting ends

---

**Related Documentation:**
- [ROOM_DISPLAY.md](./ROOM_DISPLAY.md) - Room display system
- [API.md](./API.md) - API endpoints
- [BUSINESS_PROCESS.md](./BUSINESS_PROCESS.md) - Business workflows
