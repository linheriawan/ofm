# OFM - Office Facility Management

A comprehensive office facility management system built with SvelteKit 5 and MongoDB.

## Features

### Employee Transportation Support
- Voucher allocation and management (Gojek, Grab, etc.)
- Company car booking and scheduling
- Real-time GPS and OBD tracking
- Driver and vehicle asset management
- Dashboard for utilization monitoring

### Meeting Room Management
- Online, offline, and hybrid meeting bookings
- Video conferencing integration (Zoom, Google Meet, Teams)
- Room and facility management
- Catering orders
- Attendance tracking via tablets/Raspberry Pi
- License utilization monitoring

### Multi-Entity Support
- Supports holding companies and subsidiaries
- Role-based access control
- Regional and departmental administration

## Tech Stack

- **Frontend**: Svelte 5
- **Backend**: SvelteKit (server-side)
- **Database**: MongoDB Atlas
- **Runtime**: Bun
- **Language**: TypeScript
- **IoT**: Arduino (GPS/OBD), Raspberry Pi Zero W (room displays)
- **Auth**: Keycloak/SSO (to be implemented)

## Getting Started

### Prerequisites

- Bun runtime installed
- MongoDB Atlas account or local MongoDB instance
- Node.js 18+ (optional, for compatibility)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd OFM
```

2. Install dependencies
```bash
bun install
```

3. Set up environment variables
```bash
cp .env.example .env
```

Edit `.env` and configure:
- MongoDB connection string
- JWT secrets
- API keys for external services (optional)

### Development

Run the development server:
```bash
bun run dev
```

The application will be available at `http://localhost:5173`

### Build

Build for production:
```bash
bun run build
```

Preview production build:
```bash
bun run preview
```

### Type Checking

Check TypeScript types:
```bash
bun run check
```

Watch mode:
```bash
bun run check:watch
```

## Project Structure

```
OFM/
├── src/
│   ├── lib/
│   │   ├── components/      # Svelte components
│   │   ├── server/
│   │   │   ├── auth/       # Authentication logic
│   │   │   ├── db/         # Database connection
│   │   │   └── models/     # Data models
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   ├── routes/             # SvelteKit routes
│   ├── app.html            # HTML template
│   └── hooks.server.ts     # Server hooks
├── static/                 # Static assets
├── .env.example            # Environment template
├── CLAUDE.md              # Project documentation
└── package.json
```

## API Integrations

### Current
- MongoDB (database)

### Planned
- Gojek/Grab API (ride-hailing vouchers)
- Zoom/Google Meet/MS Teams (video conferencing)
- Telegram/WhatsApp (notifications)
- Keycloak (SSO authentication)

## IoT Devices

### Vehicle Tracking
- Arduino with GPS module
- OBD-II reader (standard vehicles)
- CAN bus adapter (for EVs like BYD)
- Real-time location and diagnostics

### Room Displays
- Raspberry Pi Zero W / Tablets
- Display meeting schedules
- QR/NFC attendance check-in
- Room status indicators

## Contributing

See `CLAUDE.md` for detailed project requirements and business processes.

## License

Proprietary - All rights reserved
