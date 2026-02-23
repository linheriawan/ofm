# Database Setup Guide

## MongoDB Atlas Setup

### 1. Database Configuration

The application is configured to connect to MongoDB Atlas. The connection string is stored in `.env`:

```env
MONGODB_URI=mongodb+srv://root:pass123word@devday.wmveufv.mongodb.net/?retryWrites=true&w=majority&appName=DevDay
MONGODB_DB=ofm_dev
```

### 2. Database will be automatically created

MongoDB Atlas will **automatically create** the database (`ofm_dev`) when you run the seed script. You don't need to manually create it in Atlas.

## Seeding the Database

### Run the seed script:

```bash
bun run db:seed
```

This will:
1. Connect to MongoDB Atlas
2. Create the `ofm_dev` database (if it doesn't exist)
3. Clear existing data in all collections
4. Insert mock data

### What gets seeded:

**Organizations:**
- 1 Company (Indonesian Aviation Services - IAS)
- 2 Locations (Jakarta, Surabaya)

**Users & Permissions:**
- 4 Roles (Super Admin, Admin, Employee, Driver)
- 3 Users:
  - `admin@ias.co.id` (Super Admin)
  - `john.doe@ias.co.id` (Employee)
  - `jane.smith@ias.co.id` (Employee)

**Transportation:**
- 4 Vehicles (SUV, Sedan, MPV, BYD EV)
- 2 Drivers
- 3 Vouchers (Gojek, Grab)
- 2 Sample bookings

**Meeting Rooms:**
- 5 Meeting Rooms (Board Room, Conference Rooms, Training Room)
- 2 Sample bookings

## Database Collections

The following collections will be created:

### Organization
- `companies` - Company information
- `users` - User accounts
- `roles` - User roles and permissions
- `locations` - Office locations

### Transportation
- `vehicles` - Company vehicles
- `drivers` - Company drivers
- `transportation_requests` - Car bookings
- `vouchers` - Transportation vouchers
- `voucher_allocations` - Voucher assignments
- `vehicle_tracking` - GPS data
- `obd_data` - Vehicle diagnostics

### Meeting Rooms
- `meeting_rooms` - Available rooms
- `meeting_requests` - Room booking requests (unified collection for all meeting bookings, **includes embedded attendees array**)
- `meeting_licenses` - Video conferencing licenses
- `facilities` - Room facilities

## Key Schema Structures

### Meeting Requests with Attendance

The `meeting_requests` collection stores meeting bookings AND attendance as an embedded array:

```javascript
{
  _id: ObjectId,
  title: String,              // Meeting title
  roomId: String,             // Custom room identifier (e.g., "R101")
  organizerId: String,
  participants: [{
    userId: String,           // NIK (Nomor Induk Karyawan)
    email: String,
    name: String
  }],
  startTime: Date,
  endTime: Date,
  status: String,
  // Attendance tracking (embedded array)
  attendees: [{
    type: String,             // "internal" | "external"
    userId: String,           // NIK for internal, null for external
    name: String,             // Employee or guest name
    email: String,            // Email address
    checkinTime: Date,        // When they checked in
    method: String            // "qr" | "manual"
  }],
  createdAt: Date,
  updatedAt: Date
}
```

**Field Notes:**
- `userId` in users collection = NIK (Nomor Induk Karyawan / Employee ID Number)
- `roomId` in meeting_rooms = Custom identifier like "R101", "CONF-A" (NOT MongoDB _id)
- `attendees` array supports both internal employees and external guests
- No invitation requirement for check-in - anyone can attend

## Verifying the Data

After seeding, you can verify the data in MongoDB Atlas:

1. Go to https://cloud.mongodb.com
2. Navigate to your cluster
3. Click "Browse Collections"
4. Select the `ofm_dev` database
5. Browse through the collections

## Re-seeding

To reset the database with fresh mock data:

```bash
bun run db:seed
```

**⚠️ Warning:** This will delete ALL existing data and replace it with mock data.

## Production Deployment

For production:

1. Create a separate production database in MongoDB Atlas
2. Update `.env` with production credentials
3. **DO NOT** run the seed script in production
4. Use proper migration scripts instead

## Sample Credentials

After seeding, you can login with:

- **Admin:** `admin@ias.co.id` / `admin123`
- **Employee:** `john.doe@ias.co.id` / `password123`
- **Employee:** `jane.smith@ias.co.id` / `password123`

Note: Passwords are hashed in the database. Authentication will be implemented in the next phase.
