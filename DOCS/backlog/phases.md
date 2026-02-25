# Development Phases

## Phase 1: API Foundation — Done
Build RESTful API to support both web and mobile clients.
- 22+ endpoint groups implemented (`/api/v1/*`)
- Authentication middleware (OAuth 2.0 + sessions)
- Standardized response format with pagination
- See: [M7-api](../modules/M7-api.md)

## Phase 2: Mobile Infrastructure — Planned
Enable mobile app authentication and data sync.
- Mobile OAuth 2.0 flow
- WebSocket server for live updates
- Push notification infrastructure (FCM)
- Real-time GPS tracking endpoint
- Geofencing for pickup/dropoff zones

## Phase 3: Android Driver App — Planned
Replace Arduino GPS with Android app for drivers.
- Kotlin + Jetpack Compose + Retrofit + Google Maps SDK
- Trip management (view, navigate, confirm ATA/ATD)
- Background GPS tracking (30s intervals, offline sync)
- Driver availability toggle, status updates
- See: M9.1 in [track.csv](track.csv)

## Phase 4: Android Employee App — Planned
Mobile alternative for employees to make requests.
- Kotlin + Jetpack Compose + Retrofit
- Transportation requests with map picker
- Meeting room browsing and booking
- Facility/supply requests
- Push notifications for approvals
- See: M9.2 in [track.csv](track.csv)

## Phase 5: Admin Approval Workflows — Planned
Enable admins to approve and manage requests.
- Pending requests dashboard with bulk actions
- Approval delegation
- Driver/vehicle auto-assignment and scheduling
- Facility inventory tracking and purchase orders
- See: M7.7 in [track.csv](track.csv)

## Phase 6: Advanced Features — Planned
- [✅] Multi-entity support
- Advanced reporting and analytics
- WhatsApp/Telegram notifications
- Excel import/export
- OBD-II integration
