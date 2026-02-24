# M4 - Meeting

Meeting room booking system supporting online, offline, and hybrid meetings. Includes room reservation, calendar views, participant management, catering, and calendar invitation generation.

---

## Sub-Modules

### M4.1 Book

Meeting room booking form with comprehensive options.

**Route:** `/meeting/book`

#### Meeting Types

| Type | Description |
|------|-------------|
| Online | Video conference only (Zoom, Google Meet, MS Teams) |
| Offline | Physical room reservation |
| Hybrid | Both online platform + physical room |

#### Form Fields

- **Title** -- Meeting title
- **Date & Time** -- Start time, end time, duration calculator
- **Meeting type** -- Online / Offline / Hybrid
- **Room selection** -- Visual room cards filtered by meeting type (offline/hybrid only)
- **Platform** -- Zoom, Google Meet, MS Teams (online/hybrid only)
- **Internal participants** -- Tag-based email input
- **External participants** -- Email addresses for non-employees
- **External participant count** -- For guests without email
- **Required facilities** -- Checklist: projector, whiteboard, etc.
- **Catering** -- Type (snacks, lunch), item count, notes
- **Recurring** -- Recurring meeting settings (requires Super Admin approval)

#### Validation

- Room capacity validated against participant count
- Max duration: 8 hours
- Room availability conflict detection (planned)

---

### M4.2 Bookings

View and manage meeting bookings.

**Route:** `/meeting/bookings`

- List of all bookings with status filters
- Booking details: title, room, time, participants, status
- Cancel / modify actions
- Status: pending, approved, rejected, cancelled, completed

---

### M4.3 Calendar

Calendar view for meeting room schedules.

**Route:** `/meeting/calendar`

- Room-based calendar view
- Day / week / month views
- Visual room availability
- Links to booking form for available slots

---

## Booking Process

```mermaid
flowchart TD
    Start([Employee needs meeting]) --> CheckType{Meeting Type?}

    CheckType -->|Online| ReqOnline[Request Online Meeting]
    CheckType -->|Offline| ReqOffline[Request Physical Room]
    CheckType -->|Hybrid| ReqHybrid[Request Hybrid Meeting]

    ReqOnline --> CheckLicense{Check License Availability}
    CheckLicense -->|Available| CreateLink[Create Meeting Link]
    CheckLicense -->|Not Available| QueueOnline[Queue / Find Alternative]

    ReqOffline --> CheckRoom{Check Room Availability}
    ReqHybrid --> CheckRoom
    CheckRoom -->|Available| BookRoom[Book Room]
    CheckRoom -->|Not Available| FindAlt{Find Alternative?}
    FindAlt -->|Yes| OfferAlt[Offer Alternative Room/Time]
    FindAlt -->|No| NotifyReject[Notify Rejection]

    BookRoom --> CheckFacility{Facilities Needed?}
    CheckFacility -->|Yes| ArrangeFacility[Arrange Projector/Whiteboard/etc]
    CheckFacility -->|No| CheckCatering
    ArrangeFacility --> CheckCatering{Catering Needed?}
    CheckCatering -->|Yes| OrderCatering[Order Snacks/Lunch]
    CheckCatering -->|No| ConfirmBooking
    OrderCatering --> ConfirmBooking[Confirm Booking]

    ReqHybrid --> CreateLink
    ConfirmBooking --> NotifyAll[Notify Participants]
    CreateLink --> NotifyAll
    NotifyAll --> UpdateTablet[Update Room Tablet Display]
    UpdateTablet --> Meeting[Meeting Conducted]
    Meeting --> CheckIn[Attendance Check-in via Tablet]
    CheckIn --> MeetingEnd[Meeting Ends]
    MeetingEnd --> UpdateUtil[Update Utilization Dashboard]
    UpdateUtil --> End([End])
```

---

## Attendance / Check-In

Supports both internal employees and external guests via QR code or manual entry.

- **Check-in window:** 15 minutes before meeting start to meeting end
- **No invitation required** -- Anyone can check in during the meeting window
- **Methods:** QR scan (from room tablet) or manual entry (NIK for internal, name for external)

### Attendee Data Structure

```javascript
attendees: [{
  type: 'internal' | 'external',
  userId: String | null,    // NIK for internal, null for external
  name: String,
  email: String,
  checkinTime: Date,
  method: 'qr' | 'manual'
}]
```

---

## Calendar Invitation (.ics)

- Generates `.ics` calendar files for meeting notifications
- Includes meeting title, time, room, participants
- Actual email sending: planned

---

## Business Rules

- **Max duration:** 8 hours per booking
- **Recurring meetings:** Require Super Admin approval
- **Cancellation:** Requires re-approval from admin
- **Room capacity:** Validated against participant count
- **Approval:** Configurable per room (VIP rooms need approval, regular rooms auto-approved -- pending implementation)

---

## Route Summary

| Route | Sub-Module |
|-------|------------|
| `/meeting` | Meeting overview (stats, upcoming, quick actions) |
| `/meeting/book` | M4.1 Book |
| `/meeting/bookings` | M4.2 Bookings |
| `/meeting/calendar` | M4.3 Calendar |

---

**API Endpoints:** See [M7-api](M7-api.md) sections M7.15, M7.16

**Related:** [M2.3 Rooms](M2-admin.md), [M6 Room Display](M6-room-display.md), [M7 API](M7-api.md)
