# SCIM 2.0 Integration Guide for OFM

This guide explains how to set up SCIM (System for Cross-domain Identity Management) integration between Aksara SSO and OFM for automatic user and organizational data synchronization.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Setup Instructions](#setup-instructions)
4. [Synchronization Methods](#synchronization-methods)
5. [Webhook Configuration](#webhook-configuration)
6. [Troubleshooting](#troubleshooting)

---

## Overview

### What is SCIM?

SCIM 2.0 is an industry-standard REST API protocol for automated user provisioning and identity management. It eliminates the need for manual data entry and ensures your OFM database stays synchronized with Aksara SSO.

### Benefits

- ✅ **Automatic User Sync**: New employees automatically appear in OFM
- ✅ **Real-time Updates**: Changes in SSO instantly reflected in OFM via webhooks
- ✅ **Organizational Structure**: Complete sync of companies, departments, positions
- ✅ **Deactivation**: Employees leaving the company are automatically deactivated
- ✅ **No Manual Work**: Set it and forget it

### Architecture

```
┌─────────────────────────────────┐
│  Aksara SSO (Port 5173)         │
│  - SCIM API Endpoints           │
│  - OAuth 2.0 Token Server       │
│  - Webhook Sender               │
└──────────────┬──────────────────┘
               │
               │ HTTPS + OAuth 2.0
               │
┌──────────────▼──────────────────┐
│  OFM App (Port 5174)            │
│  - SCIM Client                  │
│  - Webhook Receiver             │
│  - Local MongoDB Cache          │
└─────────────────────────────────┘
```

---

## Prerequisites

1. **Aksara SSO Running**: Ensure Aksara SSO is running at `http://localhost:5173`
2. **SCIM Client Created**: Create a SCIM client in Aksara SSO admin console
3. **Environment Variables**: Configure SCIM credentials in OFM `.env` file

---

## Setup Instructions

### Step 1: Create SCIM Client in Aksara SSO

1. Navigate to **Aksara SSO Admin Console** → **SCIM Clients**
2. Click **"Create New SCIM Client"**
3. Fill in the form:
   - **Client Name**: `OFM Production`
   - **Description**: `SCIM client for OFM user synchronization`
   - **Scopes**: Select `read:users`, `read:groups`
   - **Rate Limit**: `100` requests/minute (or higher if needed)
   - **IP Whitelist**: Leave empty for development, or add your OFM server IP for production
4. Click **"Create"**
5. **IMPORTANT**: Copy the `Client ID` and `Client Secret` shown on screen (secret shown only once!)

### Step 2: Configure OFM Environment Variables

Edit your `.env` file in OFM project root:

```bash
# SCIM 2.0 Integration
SSO_BASE_URL=http://localhost:5173
SCIM_CLIENT_ID=scim-abc123xyz          # From Step 1
SCIM_CLIENT_SECRET=your-secret-here     # From Step 1
SCIM_WEBHOOK_SECRET=random-secret-key   # Generate your own strong secret
```

**Generate Webhook Secret**:
```bash
openssl rand -hex 32
```

### Step 3: Test Connection

1. Start OFM dev server:
   ```bash
   bun run dev
   ```

2. Navigate to: `http://localhost:5174/modules/sync`

3. You should see:
   - ✅ **Connected to Aksara SSO** (green box)
   - Connection details (Bulk Operations, Filtering support, Max Results)

If you see an error, check:
- Aksara SSO is running
- SCIM client credentials are correct
- No firewall blocking the connection

---

## Synchronization Methods

### Method 1: Manual Sync via Web UI

1. Go to `http://localhost:5174/modules/sync`
2. Click **"🔄 Sync All Data"** button
3. Wait for completion (you'll see a success/error alert)
4. Check the sync statistics displayed on the page

**Use Case**: Initial sync, testing, or troubleshooting.

### Method 2: Command Line Script

Run the standalone sync script:

```bash
bun run scripts/sync-from-scim.ts
```

**Expected Output**:
```
═══════════════════════════════════════════════════════
  OFM SCIM Synchronization Script
═══════════════════════════════════════════════════════
Started at: 2025-10-18T10:00:00.000Z

🔄 Starting SCIM full synchronization...
✅ Connected to Aksara SSO
📥 Fetching organizational units...
📥 Fetched 57 organizational units
📥 Fetching users...
📥 Fetched 8 users
✅ Synced 57 organizational units (10 created, 47 updated)
✅ Synced 8 users (2 created, 6 updated, 0 deactivated)
✅ SCIM synchronization complete!

═══════════════════════════════════════════════════════
✅ Synchronization Completed Successfully
═══════════════════════════════════════════════════════
📊 Summary:
  Users:       2 created, 6 updated, 0 deactivated
  Org Units:   10 created, 47 updated
  Errors:      0

Completed at: 2025-10-18T10:01:30.000Z
═══════════════════════════════════════════════════════
```

### Method 3: Scheduled Sync (Cron Job)

**For Linux/macOS**:

Edit crontab:
```bash
crontab -e
```

Add this line to sync every 6 hours:
```
0 */6 * * * cd /path/to/ofm && bun run scripts/sync-from-scim.ts >> /var/log/ofm-scim.log 2>&1
```

**For Windows (Task Scheduler)**:

1. Open Task Scheduler
2. Create Basic Task
3. Set Trigger: Daily, repeat every 6 hours
4. Action: Start a program
5. Program: `bun`
6. Arguments: `run scripts/sync-from-scim.ts`
7. Start in: `C:\path\to\ofm`

### Method 4: Real-Time Webhooks (Recommended for Production)

See [Webhook Configuration](#webhook-configuration) section below.

---

## Webhook Configuration

Webhooks provide **instant synchronization** without polling. When a user is created, updated, or deleted in Aksara SSO, OFM receives an immediate notification.

### Step 1: Register Webhook in Aksara SSO

1. In Aksara SSO, go to **SCIM Clients** → Your client → **Webhooks**
2. Click **"Add Webhook"**
3. Configure:
   - **Webhook URL**: `http://localhost:5174/api/v1/scim/webhook` (use your actual domain in production)
   - **Events**: Select all:
     - `user.created`
     - `user.updated`
     - `user.deleted`
     - `group.created`
     - `group.updated`
     - `group.deleted`
   - **Secret**: Use the same value as `SCIM_WEBHOOK_SECRET` from your `.env`
   - **Max Retries**: `3`
   - **Retry Delay**: `1000` ms
4. Click **"Save"**

### Step 2: Test Webhook

1. In Aksara SSO, update a user (e.g., change phone number)
2. Check OFM server logs, you should see:
   ```
   📥 Webhook received: user.updated (User)
   ✅ User updated via webhook: john.doe@ias.co.id
   ```
3. Verify the change in OFM database

### Webhook Security

Webhooks are secured using **HMAC SHA-256 signatures**. Every webhook request includes an `X-SCIM-Signature` header:

```
X-SCIM-Signature: sha256=abc123def456...
```

OFM automatically verifies this signature using `SCIM_WEBHOOK_SECRET`. Invalid signatures are rejected with `401 Unauthorized`.

**Never expose your webhook secret publicly!**

---

## Data Mapping

### SCIM User → OFM User

| SCIM Field | OFM Field | Notes |
|------------|-----------|-------|
| `id` | `ssoUserId` | Primary key for sync |
| `userName` | `email` | Email address |
| `name.givenName` | `firstName` | First name |
| `name.familyName` | `lastName` | Last name |
| `active` | `isActive` | Active status |
| `phoneNumbers[0].value` | `phone` | Phone number |
| `enterprise.employeeNumber` | `userId` | Employee ID |
| `enterprise.department` | `departmentId` | Department reference |
| `enterprise.organization` | `companyId` | Company reference |
| `enterprise.manager.value` | `managerId` | Manager reference |
| `x-position.id` | `positionId` | Position reference |

### SCIM Group → OFM Organizational Unit

| SCIM Field | OFM Field | Notes |
|------------|-----------|-------|
| `id` | `_id` | Primary key |
| `displayName` | `unitName` | Unit name |
| `x-orgUnit.unitType` | `unitType` | Type (company/division/department) |
| `x-orgUnit.level` | `level` | Hierarchy level |
| `x-orgUnit.parentUnitId` | `parentUnitId` | Parent unit reference |
| `x-orgUnit.managerId` | `managerId` | Manager reference |

---

## Sync Behavior

### Initial Sync

When you run the first sync:
- All users from SSO are **created** in OFM
- All organizational units are **created** in OFM
- Default role (`employee` or `super_admin`) is assigned based on email

### Subsequent Syncs

- **Existing users**: Updated with latest SSO data
- **New users in SSO**: Created in OFM
- **Deactivated users in SSO**: Marked as `isActive: false` in OFM
- **Deleted users in SSO**: Marked as `isActive: false` in OFM (soft delete)

### Conflict Resolution

- SCIM data **always wins** during sync
- Local changes to user data (made in OFM) will be **overwritten**
- To preserve local data, exclude those fields from sync mapping

---

## Monitoring & Logging

### Sync History

Every sync operation is logged to the `syncHistory` collection:

```javascript
{
  type: 'scim_full_sync',
  startedAt: ISODate("2025-10-18T10:00:00Z"),
  completedAt: ISODate("2025-10-18T10:01:30Z"),
  status: 'success',
  stats: {
    usersCreated: 2,
    usersUpdated: 6,
    usersDeactivated: 0,
    orgUnitsCreated: 10,
    orgUnitsUpdated: 47,
    errors: []
  }
}
```

### Webhook Events

Webhook deliveries are logged to the `webhookEvents` collection:

```javascript
{
  event: 'user.updated',
  resourceType: 'User',
  resourceId: '507f1f77bcf86cd799439011',
  action: 'update',
  receivedAt: ISODate("2025-10-18T10:30:00Z"),
  processedAt: ISODate("2025-10-18T10:30:00Z"),
  status: 'success'
}
```

### View Logs in MongoDB

```javascript
// Last 10 syncs
db.syncHistory.find().sort({ completedAt: -1 }).limit(10)

// Last 50 webhook events
db.webhookEvents.find().sort({ receivedAt: -1 }).limit(50)

// Failed syncs
db.syncHistory.find({ status: 'failed' })

// Failed webhooks
db.webhookEvents.find({ status: 'failed' })
```

---

## Troubleshooting

### Error: "SCIM_CLIENT_ID and SCIM_CLIENT_SECRET must be set"

**Cause**: Environment variables not configured.

**Solution**:
1. Check `.env` file exists in project root
2. Verify `SCIM_CLIENT_ID` and `SCIM_CLIENT_SECRET` are set
3. Restart OFM server after editing `.env`

### Error: "Failed to get access token"

**Cause**: Invalid client credentials or SSO not running.

**Solution**:
1. Verify Aksara SSO is running: `curl http://localhost:5173/health`
2. Check SCIM client credentials in SSO admin console
3. Test token endpoint manually:
   ```bash
   curl -X POST http://localhost:5173/scim/v2/token \
     -d "grant_type=client_credentials" \
     -d "client_id=YOUR_CLIENT_ID" \
     -d "client_secret=YOUR_SECRET"
   ```

### Error: "Connection Failed"

**Possible causes**:
- Aksara SSO not running
- Wrong `SSO_BASE_URL` in `.env`
- Firewall blocking connection
- Network issues

**Solution**:
1. Ping SSO: `curl http://localhost:5173/scim/v2/ServiceProviderConfig`
2. Check firewall rules
3. Verify URL in `.env` matches SSO address

### Error: "Invalid webhook signature"

**Cause**: Webhook secret mismatch between SSO and OFM.

**Solution**:
1. Ensure `SCIM_WEBHOOK_SECRET` in OFM `.env` matches the secret used in SSO webhook configuration
2. Regenerate webhook secret and update both SSO and OFM

### Users Not Syncing

**Debugging steps**:
1. Check sync history: `db.syncHistory.find().sort({ completedAt: -1 }).limit(1)`
2. Look for errors in `stats.errors` array
3. Check user `isActive` status in SSO (only active users synced by default)
4. Manually fetch users via SCIM API:
   ```bash
   curl http://localhost:5173/scim/v2/Users \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

### Webhook Not Working

**Debugging steps**:
1. Check webhook is registered in SSO admin console
2. Verify `SCIM_WEBHOOK_SECRET` is set in `.env`
3. Check OFM server logs for webhook events
4. Test webhook manually:
   ```bash
   curl -X POST http://localhost:5174/api/v1/scim/webhook \
     -H "Content-Type: application/json" \
     -H "X-SCIM-Signature: sha256=test" \
     -d '{"event":"user.updated","resourceType":"User",...}'
   ```
5. Check `webhookEvents` collection for delivery failures

---

## Best Practices

### Security

- ✅ Use HTTPS in production (required for webhooks)
- ✅ Rotate SCIM client secret every 90 days
- ✅ Use IP whitelisting in production
- ✅ Store secrets in environment variables, never in code
- ✅ Enable webhook signature verification

### Performance

- ✅ Run full sync during off-peak hours (e.g., 2 AM)
- ✅ Use webhooks for real-time updates instead of frequent polling
- ✅ Monitor sync duration and optimize if > 5 minutes
- ✅ Use pagination for large datasets (count=1000 max)

### Reliability

- ✅ Schedule periodic full sync as backup (every 12-24 hours)
- ✅ Monitor sync failures and set up alerts
- ✅ Keep sync history for auditing (at least 30 days)
- ✅ Test sync in staging before production deployments

### Maintenance

- ✅ Review sync errors weekly
- ✅ Clean up old sync history logs monthly
- ✅ Validate data integrity quarterly
- ✅ Keep SCIM client library up to date

---

## FAQ

**Q: How often should I run full sync?**
A: If using webhooks, once every 12-24 hours as backup. Without webhooks, every 4-6 hours.

**Q: What happens if sync fails?**
A: The error is logged to `syncHistory` collection. Users continue using cached data until next successful sync.

**Q: Can I customize which fields are synced?**
A: Yes, edit `/src/lib/server/scim/sync.ts` and modify the field mappings.

**Q: Will local user changes be overwritten?**
A: Yes, SCIM data always wins. Don't edit user data in OFM if you want to preserve it.

**Q: Can I sync only specific users?**
A: Yes, use SCIM filters. Example: `filter=department eq "507f..."` in the fetch call.

**Q: How do I handle deleted users?**
A: Deleted users are soft-deleted (marked inactive). To hard-delete, create a cleanup script.

**Q: What if SSO is down during sync?**
A: Sync will fail and log the error. Users continue using cached data. Next sync will retry.

**Q: Can I use SCIM with multiple SSO instances?**
A: Not currently. OFM connects to one SSO instance. For multi-tenant, use separate OFM deployments.

---

## Additional Resources

- [Aksara SSO SCIM Complete Guide](../../Aksara/sso/DOCS/SCIM_COMPLETE_GUIDE.md)
- [RFC 7643 - SCIM Core Schema](https://tools.ietf.org/html/rfc7643)
- [RFC 7644 - SCIM Protocol](https://tools.ietf.org/html/rfc7644)
- [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749)

---

## Support

For issues or questions:
1. Check this documentation
2. Review OFM server logs
3. Check Aksara SSO documentation
4. File an issue on GitHub

---

**Last Updated**: 2025-10-18
**Version**: 1.0
**Author**: OFM Team
