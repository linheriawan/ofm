# M9 - Mobile Apps

Android applications for drivers and employees. Both apps share the OFM backend API (`/api/v1/*`) and authenticate via Aksara SSO (OAuth 2.0).

**Status:** Planned

| Component | Technology |
|-----------|-----------|
| Language | Kotlin |
| UI | Jetpack Compose |
| HTTP | Retrofit |
| Maps | Google Maps SDK |
| Push | Firebase Cloud Messaging (FCM) |
| Auth | OAuth 2.0 via [M1](M1-authentication.md) |

---

## M9.1 Driver App

Android app for company car drivers. Replaces Arduino GPS module (lower cost, better UX, simpler deployment, real-time push notifications, dual-purpose navigation + tracking).

### Features

**Trip Management**
- View assigned trips (today's schedule)
- Trip details: pickup, destination, passenger info
- Navigation integration (Google Maps turn-by-turn)
- Confirm ATA (Actual Time of Arrival) and ATD (Actual Time of Departure)

**GPS Tracking**
- Background GPS service (continuous during active trips)
- Location updates every 30 seconds
- Route recording and submission on trip complete
- Offline mode with local storage and sync when online

**Status Management**
- Driver availability toggle (on duty / off duty)
- Emergency / SOS button
- Push notifications for new assignments
- Biometric authentication (fingerprint)

---

## M9.2 Employee App

Android app for employees to make requests and view bookings.

### Features

**Transportation** -- Request company car or voucher, view history, cancel/modify

**Meeting Rooms** -- Browse rooms, book with details, view calendar, cancel/modify

**Facilities** -- Request office supplies (ATK), equipment, track status

**Notifications** -- Push for approvals/rejections, trip reminders (2h before), meeting reminders

---

## Mobile Token Storage

Same OAuth 2.0 flow as web ([M1](M1-authentication.md)), but token-based instead of session-based:

- Access token in encrypted SharedPreferences
- Refresh token in Android Keystore
- Auto-refresh before token expiry
- Biometric unlock for Keystore access (driver app)

---

## Push Notifications (FCM)

| Event | Recipient | Content |
|-------|-----------|---------|
| Trip assigned | Driver | "New trip assigned: pickup at {location}" |
| Trip reminder | Driver | "Trip in 2 hours: {passenger} at {location}" |
| Request approved | Employee | "Your transport request has been approved" |
| Request rejected | Employee | "Your transport request was rejected: {reason}" |
| Meeting reminder | Employee | "Meeting in 30 minutes: {title} at {room}" |

Device registration: register FCM token on first login, refresh on app update, unregister on logout.

---

## Offline Support

**Driver App** -- Cache today's trips, store GPS coordinates offline, sync on reconnect

**Employee App** -- Cache recent bookings/history, queue requests offline, show "offline" indicator

---

**API Endpoints:** See [M7-api](M7-api.md) -- Driver API, M7.17 (Transport), M7.15 (Meeting), M7.13 (Facilities)

**Related:** [M1 Auth](M1-authentication.md), [M5 Transport](M5-transportation.md), [M4 Meeting](M4-meeting.md)
