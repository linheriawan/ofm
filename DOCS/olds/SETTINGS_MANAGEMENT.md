# Settings Management System

✅ **Complete** - Administrators can now configure SCIM and other application settings through the web UI without developer intervention.

## Overview

The settings management system allows administrators to configure sensitive credentials and application settings through a secure web interface. Settings are stored in MongoDB with AES-256-CBC encryption for sensitive values.

## Features

- **Database-backed Configuration**: Settings stored in MongoDB instead of `.env` files
- **Runtime Updates**: Changes take effect within 1 minute (cache TTL)
- **Encryption**: Sensitive values (passwords, secrets) are encrypted at rest
- **Categorized Settings**: Organized by SCIM, Email, and General categories
- **Test Connection**: Built-in SCIM connectivity test
- **User-friendly UI**: Clean interface with masked secrets and inline help

## Architecture

### Settings Flow

```
Admin UI → API Endpoint → Settings Module → MongoDB
                                ↓
                         SCIM Client (with cache)
```

### Cache Strategy

- **TTL**: 1 minute
- **Fallback Chain**: Database → env module → process.env
- **Auto-refresh**: Cache expires after 1 minute, new config loaded on next request

## File Structure

```
src/
├── routes/
│   ├── admin/
│   │   └── settings/
│   │       ├── +page.svelte          # Settings UI with tabs
│   │       └── +page.server.ts       # Load settings by category
│   └── api/v1/
│       ├── settings/
│       │   └── +server.ts            # GET/PUT settings API
│       └── scim/
│           └── test/
│               └── +server.ts        # Test SCIM connection
├── lib/server/
│   ├── settings.ts                   # Settings CRUD with encryption
│   ├── scim/
│   │   └── client.ts                 # Updated to read from DB
│   └── db/schemas/
│       └── settings.ts               # Schema & defaults
└── hooks.server.ts                   # Initialize settings on startup
```

## Usage

### For Administrators

1. Navigate to **Configuration → ⚙️ Settings**
2. Select category tab (SCIM, Email, or General)
3. Fill in required fields:
   - For secrets: Leave blank to keep current value
   - For new values: Enter the new value
4. Click **Test Connection** (SCIM only) to verify credentials
5. Click **Save Settings**
6. Changes take effect within 1 minute

### For Developers

#### Get a Setting

```typescript
import { getSetting } from '$lib/server/settings';

const scimBaseUrl = await getSetting('scim.base_url');
```

#### Get SCIM Config

```typescript
import { getSCIMConfig } from '$lib/server/settings';

const config = await getSCIMConfig();
// { baseUrl, clientId, clientSecret, webhookSecret }
```

#### Update a Setting

```typescript
import { updateSetting } from '$lib/server/settings';

await updateSetting('scim.client_id', 'new-client-id', userId);
```

## Settings Categories

### SCIM Integration (`scim`)

| Key | Label | Type | Required |
|-----|-------|------|----------|
| `scim.base_url` | SSO Base URL | text | Yes |
| `scim.client_id` | SCIM Client ID | text | Yes |
| `scim.client_secret` | SCIM Client Secret | secret | Yes |
| `scim.webhook_secret` | SCIM Webhook Secret | secret | No |

### Email Settings (`email`)

| Key | Label | Type | Required |
|-----|-------|------|----------|
| `email.smtp_host` | SMTP Host | text | No |
| `email.smtp_port` | SMTP Port | text | No |
| `email.smtp_user` | SMTP Username | text | No |
| `email.smtp_password` | SMTP Password | secret | No |

### General Settings (`general`)

| Key | Label | Type | Required |
|-----|-------|------|----------|
| `general.app_name` | Application Name | text | Yes |
| `general.app_url` | Application URL | text | Yes |

## Security

### Encryption

- **Algorithm**: AES-256-CBC
- **Key Source**: `SETTINGS_ENCRYPTION_KEY` environment variable
- **Key Length**: 32 bytes (padded if needed)
- **IV**: Random 16 bytes per encrypted value
- **Format**: `{iv}:{encrypted_data}` (hex-encoded)

### API Security

- **Authentication**: Required for all endpoints
- **Authorization**: Admin role recommended (not enforced yet)
- **Input Validation**: Settings must match predefined keys
- **Output Masking**: Secrets displayed as `***HIDDEN***`

## API Endpoints

### GET /api/v1/settings

Get settings by category.

**Query Parameters**:
- `category` (required): `scim`, `email`, or `general`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "key": "scim.base_url",
      "value": "http://localhost:5173",
      "category": "scim",
      "label": "SSO Base URL",
      "isSecret": false,
      "isRequired": true
    }
  ]
}
```

### PUT /api/v1/settings

Update multiple settings.

**Request Body**:
```json
{
  "settings": [
    {
      "key": "scim.client_id",
      "value": "new-client-id"
    },
    {
      "key": "scim.client_secret",
      "value": "new-client-secret"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Settings updated successfully"
}
```

### POST /api/v1/scim/test

Test SCIM connection using current settings.

**Response** (Success):
```json
{
  "success": true,
  "message": "Successfully connected to Aksara SSO SCIM API",
  "details": {
    "supportsBulk": true,
    "supportsFilter": true,
    "maxResults": 200
  }
}
```

**Response** (Error):
```json
{
  "success": false,
  "message": "Failed to get access token (401): Invalid credentials"
}
```

## Database Schema

```typescript
interface Setting {
  _id?: ObjectId;
  key: string;              // Unique key (e.g., 'scim.client_id')
  value: string;            // Encrypted if isSecret = true
  category: string;         // 'scim' | 'email' | 'general' | 'auth'
  label: string;            // Human-readable label
  description?: string;     // Help text
  isSecret: boolean;        // Whether to encrypt
  isRequired: boolean;      // Whether required
  updatedBy?: string;       // User ID who last updated
  updatedAt: Date;
  createdAt: Date;
}
```

## Initialization

Settings are automatically initialized on server startup:

1. Server starts → `hooks.server.ts` → `initializeDB()`
2. `initializeDB()` → `initializeSettings()`
3. `initializeSettings()` → Insert default settings if not exist
4. SCIM client uses `getConfig()` → Reads from database with 1-minute cache

## Migration from .env

If you have existing `.env` settings, they will still work as fallback:

1. Database setting (highest priority)
2. `env` module from `$env/dynamic/private`
3. `process.env` (lowest priority)

To migrate:

1. Go to Settings page
2. Enter your credentials from `.env`
3. Save settings
4. (Optional) Remove from `.env` file

## Troubleshooting

### Settings not taking effect

**Solution**: Wait 1 minute for cache to expire, or restart the server.

### SCIM test connection fails

**Checklist**:
1. Verify SSO server is running
2. Check credentials in settings
3. Test with curl: Settings page shows curl command for debugging
4. Check SSO terminal for authentication errors

### Encrypted values not decrypting

**Cause**: `SETTINGS_ENCRYPTION_KEY` changed after values were encrypted

**Solution**:
1. Set `SETTINGS_ENCRYPTION_KEY` back to original value, OR
2. Re-enter all secret values in Settings page

## Future Enhancements

- [ ] Role-based access control (only admins can edit settings)
- [ ] Setting validation (URL format, port ranges, etc.)
- [ ] Test email functionality
- [ ] Audit log for settings changes
- [ ] Backup/restore settings
- [ ] Import/export settings as JSON
- [ ] Setting templates for different environments

## Related Documentation

- [SCIM Integration Guide](DOCS/SCIM_INTEGRATION.md)
- [Database Setup](DOCS/DATABASE.md)
- [Settings Schema](src/lib/server/db/schemas/settings.ts)
