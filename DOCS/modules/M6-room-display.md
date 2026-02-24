# M6 - Room Display

Tablet/Raspberry Pi display system for meeting rooms. Shows real-time schedule, room availability status, and provides QR codes for quick booking and attendance check-in.

---

## Sub-Modules

### M6.1 Auth

Device authentication for tablets.

**Route:** `/device/auth`

- Device registration and pairing with a specific room
- Token-based authentication for unattended devices
- Persistent device sessions (no user login required after initial setup)

---

### M6.2 Display

Full-screen room schedule display.

**Route:** `/device/display` or `/display/room/[roomId]`

#### Display Features

- **Real-time clock** -- Updates every second
- **Room status indicator** -- Color-coded:
  - Green: Available
  - Red: Occupied (meeting in progress)
  - Orange: Upcoming (meeting starting within 30 minutes)
- **Current meeting details** -- Title, organizer, time, participants
- **Next meeting preview** -- Next scheduled meeting info
- **Today's full schedule** -- All meetings with active meeting highlighted
- **Room info** -- Name, floor, capacity
- **Auto-refresh** -- Schedule data refreshes every 30 seconds

#### Dual QR Code System

1. **Quick Book QR** (always visible)
   - Points to: `/modules/meetings/new?roomId={roomId}`
   - Allows anyone to quickly book the room from their phone

2. **Mark Attendance QR** (during meetings only)
   - Points to: check-in page for current meeting
   - Visible only when `currentMeeting` exists
   - Includes "Manual Entry" button as fallback
   - Supports internal (NIK) and external (name) check-in

---

## Display Page API

**GET** `/api/v1/rooms/{roomId}/schedule`

Returns:
- Room information (name, capacity, facilities)
- Current meeting details (if any)
- Next meeting details
- Full day's schedule
- Availability status
- Available until time

Auto-refreshes every 30 seconds.

---

## Admin Management

**Route:** `/admin/room-displays` (or `/modules/room-displays`)

- Lists all meeting rooms
- Generates QR codes for each room display URL (via QR Server API, 300x300px)
- Copy display URL to clipboard
- Preview display link
- Print all QR codes for physical posting

---

## Setup

1. Open `http://<HOST>:5174/display/room/{roomId}` (or scan QR from admin page)
2. Set browser to kiosk mode (full-screen), disable sleep mode
3. Uses custom `roomId` (e.g., `R101`), **not** MongoDB `_id`
4. Ensure `vite.config.ts` has `host: '0.0.0.0'` for network access

---

## Route Summary

| Route | Sub-Module |
|-------|------------|
| `/device/auth` | M6.1 Device authentication |
| `/device/display` | M6.2 Room display |
| `/display/room/[roomId]` | M6.2 Fullscreen room display |
| `/admin/room-displays` | QR code management (admin) |

---

**Related:** [M2 Admin](M2-admin.md) (Devices, Rooms), [M4 Meeting](M4-meeting.md), [M7 API](M7-api.md) (M7.11, M7.12)
