# SCIM Quick Start Guide - 5 Minutes Setup

## Prerequisites ✅

- [ ] Aksara SSO running at `http://localhost:5173`
- [ ] OFM running at `http://localhost:5174`
- [ ] MongoDB connection configured

---

## Step 1: Create SCIM Client (2 min)

1. Open **Aksara SSO**: http://localhost:5173/scim-clients
2. Click **"Create New SCIM Client"**
3. Fill in:
   - Name: `OFM Production`
   - Scopes: `read:users`, `read:groups`
4. Click **Create**
5. **Copy** the Client ID and Secret shown (secret shown only once!)

---

## Step 2: Configure OFM (1 min)

Edit `ofm/.env`:

```bash
# Add these lines:
SSO_BASE_URL=http://localhost:5173
SCIM_CLIENT_ID=scim-abc123           # Paste from Step 1
SCIM_CLIENT_SECRET=your-secret-here   # Paste from Step 1
SCIM_WEBHOOK_SECRET=$(openssl rand -hex 32)  # Or any random string
```

Restart OFM server:
```bash
bun run dev
```

---

## Step 3: Run Initial Sync (1 min)

**Option A: Web UI**
1. Open: http://localhost:5174/modules/sync
2. Click **"🔄 Sync All Data"**
3. Wait for success message

**Option B: Command Line**
```bash
bun run sync:scim
```

---

## Step 4: Enable Webhooks (1 min - Optional)

1. In Aksara SSO: http://localhost:5173/scim-clients → Your Client → Webhooks
2. Click **"Add Webhook"**
3. Enter:
   - URL: `http://localhost:5174/api/v1/scim/webhook`
   - Events: Select all
   - Secret: Copy from `SCIM_WEBHOOK_SECRET` in your `.env`
4. Save

---

## ✅ Done! You're all set.

### Verify It's Working

1. **Check connection**: http://localhost:5174/modules/sync
   - Should show green ✅ "Connected to Aksara SSO"

2. **Check users synced**:
   ```bash
   # In MongoDB
   db.users.count({ syncedAt: { $exists: true } })
   ```

3. **Test webhook** (if enabled):
   - Update a user in SSO
   - Check OFM logs for: `📥 Webhook received: user.updated`

---

## Common Commands

```bash
# Manual sync
bun run sync:scim

# Test SCIM connection
curl http://localhost:5173/scim/v2/ServiceProviderConfig

# Get OAuth token
curl -X POST http://localhost:5173/scim/v2/token \
  -d "grant_type=client_credentials" \
  -d "client_id=YOUR_ID" \
  -d "client_secret=YOUR_SECRET"

# Fetch users manually
curl http://localhost:5173/scim/v2/Users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Scheduled Sync (Production)

**Linux/macOS** - Add to crontab:
```bash
0 */6 * * * cd /path/to/ofm && bun run sync:scim >> /var/log/ofm-scim.log 2>&1
```

**Windows** - Task Scheduler:
- Program: `bun`
- Arguments: `run sync:scim`
- Repeat: Every 6 hours

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Connection Failed" | Check SSO is running, verify credentials |
| "Invalid signature" | Match `SCIM_WEBHOOK_SECRET` in both SSO and OFM |
| "Not configured" | Check `.env` file has SCIM variables |
| "Token expired" | Auto-refreshed, check client credentials |

**Full Guide**: `/DOCS/SCIM_INTEGRATION.md`

---

## What Gets Synced?

- ✅ All users (name, email, phone, department, position, manager)
- ✅ Organizational units (companies, departments, hierarchy)
- ✅ User activation status
- ✅ Organizational relationships

---

## Next Steps

- [ ] Schedule periodic sync (cron job)
- [ ] Monitor sync history: http://localhost:5174/modules/sync
- [ ] Review webhook events in MongoDB: `db.webhookEvents.find()`
- [ ] Set up alerts for sync failures

---

**Questions?** Check `/DOCS/SCIM_INTEGRATION.md` or `~/Project/Aksara/sso/DOCS/SCIM_COMPLETE_GUIDE.md`

**Last Updated**: 2025-10-18
