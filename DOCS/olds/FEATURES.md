# OFM Features Documentation

## Completed Features

### 1. Dashboard (/)
- **Overview statistics** for transportation and meeting rooms
- **Quick action buttons** for common tasks
- **Recent activities** feed
- **Upcoming bookings** list
- Responsive design with hover effects

### 2. Navigation
- **Dropdown menus** for Transportation and Meeting Rooms modules
- **Smooth animations** for dropdown transitions
- **Active state** highlighting for current page
- **Mobile responsive** with hamburger menu

### 3. Transportation Module

#### Transportation Overview (/transportation)
- Vehicle fleet statistics (total, available, in-use, maintenance)
- Driver availability status
- Voucher pool by provider (Gojek, Grab)
- Recent bookings table
- Quick action buttons

#### Request Transportation (/transportation/request)
- **Two request types:**
  - Company Car with driver
  - Transportation Voucher
- **Complete booking form:**
  - Date and time selection
  - From/To locations
  - Purpose and passengers
  - Vehicle selection with capacity info
  - Voucher provider selection
- **Visual vehicle cards** with availability
- **Form validation**
- Success notification

### 4. Meeting Room Module

#### Meeting Room Overview (/meeting)
- Room availability statistics
- Today's meeting statistics
- License usage by platform (Zoom, Google Meet, MS Teams)
- Upcoming meetings table
- Room status overview cards (Available/Occupied/Maintenance)
- Quick action buttons

#### Book Meeting Room (/meeting/book)
- **Three meeting types:**
  - Online (video conference only)
  - Offline (physical room only)
  - Hybrid (both online and offline)
- **Comprehensive booking form:**
  - Meeting title, date, and time
  - Duration calculator
  - Room selection (with capacity and facilities)
  - Platform selection (for online/hybrid)
  - Internal participants management
  - External participants (email)
  - Additional facilities checklist
  - Catering options
  - Recurring meeting settings
- **Smart filtering:** Rooms filtered by meeting type
- **Visual room cards** with floor and capacity info
- **Form validation**
- Success notification

### 5. Room Display Screen (/display/room/[roomId])
**For tablets/Raspberry Pi mounted on meeting room doors:**

- **Real-time clock** and date display
- **Color-coded status:**
  - Green: Available
  - Red: Occupied
  - Orange: Meeting Soon
- **Current meeting details:**
  - Title, organizer, time, participants
  - Check-in button with QR/NFC scanner modal
- **Today's schedule** with active meeting highlighting
- **Auto-refresh** every second
- **Responsive design** for tablets
- **Status changes** based on schedule

## Database

### Seeded Collections:
- Companies (1 - IAS)
- Locations (2 - Jakarta, Surabaya)
- Roles (4 - Super Admin, Admin, Employee, Driver)
- Users (3 sample users)
- Vehicles (4 - including BYD EV)
- Drivers (2 with ratings)
- Meeting Rooms (5 with various capacities)
- Vouchers (3 from different providers)
- Sample Bookings (2 transport, 2 meeting)

### Run seed:
```bash
bun run db:seed
```

## Access Points

### Main Application
- Dashboard: http://localhost:5173/
- Transportation: http://localhost:5173/transportation
- Request Transport: http://localhost:5173/transportation/request
- Meeting Rooms: http://localhost:5173/meeting
- Book Meeting: http://localhost:5173/meeting/book

### Room Display (for tablets)
- Room A-301: http://localhost:5173/display/room/ROOM-A301
- Room A-302: http://localhost:5173/display/room/ROOM-A302
- Room B-101: http://localhost:5173/display/room/ROOM-B101
- Room B-102: http://localhost:5173/display/room/ROOM-B102
- Room B-205: http://localhost:5173/display/room/ROOM-B205

## UI/UX Features

### Design System
- **Color scheme:**
  - Transportation: Purple gradient (#667eea - #764ba2)
  - Meeting Rooms: Green gradient (#48bb78 - #38a169)
  - Admin: Orange gradient (#f6ad55 - #ed8936)
- **Consistent spacing** and border-radius
- **Smooth transitions** and hover effects
- **Card-based layouts** with shadows
- **Responsive grid** system

### Interactions
- **Dropdown navigation** with animations
- **Radio button** styled cards
- **Tag-based input** for participants
- **Real-time calculations** (duration, availability)
- **Form validation** with required field indicators
- **Success notifications** after submission

### Accessibility
- Semantic HTML
- Keyboard navigation support
- Focus states for all interactive elements
- Proper label associations
- ARIA-friendly structure

## Next Steps

### API Implementation (Todo)
1. Create SvelteKit API routes (+server.ts files)
2. Connect forms to database
3. Implement authentication
4. Real-time data fetching
5. WebSocket for room display updates

### Additional Features (Planned)
1. User authentication and authorization
2. Real-time notifications
3. Calendar integration
4. GPS tracking display
5. OBD data visualization
6. Reporting and analytics
7. Admin management pages
8. Voucher management
9. Driver assignment
10. Export/Import functionality

## Business Process Flows

All business processes are documented with mermaid diagrams in CLAUDE.md:
1. Employee Transportation Support Process
2. Meeting Room Booking Process
3. Admin Dashboard & Monitoring Process
4. IoT Integration Process

## IoT Integration Points

### Vehicle Tracking (Future)
- Arduino with GPS module
- OBD-II reader for vehicle diagnostics
- Real-time location updates
- Route tracking

### Room Display Tablets
- Raspberry Pi Zero W or Android tablets
- Check-in via QR code or NFC
- Real-time schedule updates
- Room status indicator

## Technologies Used

- **Frontend:** Svelte 5 (Runes API)
- **Backend:** SvelteKit (SSR + API routes)
- **Database:** MongoDB Atlas
- **Runtime:** Bun
- **Language:** TypeScript
- **Styling:** Scoped CSS (no framework)

## Mobile Responsive
All pages are fully responsive:
- Tablet: 768px and below
- Mobile: Adaptive grid layouts
- Touch-friendly buttons and inputs
- Hamburger menu for navigation
