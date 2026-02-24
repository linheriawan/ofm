# Database

MongoDB Atlas. Auto-creates database on first write.

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=ofm_dev
```

---

## Seeding

```bash
bun run db:seed
```

Creates `ofm_dev`, clears all collections, inserts mock data (3 users, 4 vehicles, 2 drivers, 5 rooms, sample bookings). **Warning:** deletes all existing data.

---

## Collections

| Group | Collections |
|-------|------------|
| Organization | `companies`, `users`, `roles`, `locations` |
| Transportation | `vehicles`, `drivers`, `transportation_requests`, `vouchers`, `voucher_allocations`, `vehicle_tracking`, `obd_data` |
| Meeting | `meeting_rooms`, `meeting_requests` (includes embedded attendees), `meeting_licenses`, `facilities` |

---

## Key Schema: meeting_requests

Stores bookings AND attendance as an embedded array:

```javascript
{
  _id: ObjectId,
  title: String,
  roomId: String,             // Custom ID like "R101" (NOT MongoDB _id)
  organizerId: String,
  participants: [{ userId, email, name }],
  startTime: Date,
  endTime: Date,
  status: String,
  attendees: [{               // Embedded attendance
    type: 'internal' | 'external',
    userId: String | null,    // NIK for internal, null for external
    name: String,
    email: String,
    checkinTime: Date,
    method: 'qr' | 'manual'
  }],
  createdAt: Date,
  updatedAt: Date
}
```

**Field conventions:** `userId` = NIK (Employee ID), `roomId` = custom identifier (not MongoDB `_id`), attendees open to anyone (no invitation required).

---

## Key Files

```
src/lib/server/db/mongodb.ts   # connectDB(), getDB()
src/lib/server/db/schemas.ts   # 40+ TypeScript interfaces, generateRequestNumber()
src/lib/server/db/api.ts       # listDocuments(), createDocument()
```
