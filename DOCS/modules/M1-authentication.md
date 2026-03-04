# M1 - Authentication

SSO login, OAuth 2.0 / OIDC session management, and employee synchronization via SCIM 2.0. Integrates with **Aksara SSO** as the identity provider.

**Route:** `/login` (public), `/auth/*` (OAuth callbacks)

---

## OAuth 2.0 Flow

```
User Browser                OFM (:5174)                Aksara SSO (:5173)
     |                          |                              |
     |-- Click "Sign in" ----->|                              |
     |                          |-- Generate PKCE pair ------->|
     |                          |-- Store state + verifier --->| (cookies)
     |<-- Redirect ------------|                              |
     |                          |                              |
     |-- Login at SSO ------------------------------------------->|
     |<-- Redirect with code ------------------------------------|
     |                          |                              |
     |-- /auth/callback ------>|                              |
     |                          |-- Exchange code + verifier ->|
     |                          |<-- access, refresh, id_token-|
     |                          |-- GET /oauth/userinfo ------>|
     |                          |<-- user profile -------------|
     |                          |-- Sync user to local DB      |
     |                          |-- Create encrypted session   |
     |<-- Set ofm_session ------|                              |
```

### Steps

1. **Initiate** -- User clicks "Sign in with Aksara SSO"
2. **PKCE** -- OFM generates `code_verifier` + `code_challenge`, stores in httpOnly cookies
3. **Authorize** -- Redirect to `SSO/oauth/authorize` with state and PKCE challenge
4. **Authenticate** -- User logs in at Aksara SSO
5. **Callback** -- SSO redirects to `/auth/callback` with authorization code
6. **Token exchange** -- OFM exchanges code + `code_verifier` for tokens
7. **User info** -- OFM calls `/oauth/userinfo` to get profile
8. **Sync** -- Create or update user in local MongoDB
9. **Session** -- Create AES-GCM-256 encrypted session cookie

---

## Session Management

| Property | Value |
|----------|-------|
| Cookie name | `ofm_session` |
| Encryption | AES-GCM-256 |
| Attributes | HttpOnly, Secure (prod), SameSite=Lax |
| Max age | 30 days |
| Auto-refresh | 15 min before access token expiry |

### Token Lifetimes

| Token | Lifetime | Storage |
|-------|----------|---------|
| Access token | 1 hour | Encrypted in session cookie |
| Refresh token | 30 days | Encrypted in session cookie |
| ID token | 1 hour | Encrypted in session cookie |

### Auto-Refresh

`hooks.server.ts` checks session expiry on every request. If access token expires within 15 minutes, it automatically refreshes using the refresh token. No user re-login required.

---

## Route Protection

The `hooks.server.ts` middleware protects routes:

- **Public routes:** `/login`, `/auth/*`, `/device/*`, `/display/*`
- **Protected routes:** Everything else requires a valid session
- Unauthenticated requests redirect to `/login`
- Navigation conditionally renders based on `event.locals.user`

---

## User Synchronization

### First Login

When a user logs in via SSO for the first time, OFM creates a local user record:

| Field | Source |
|-------|--------|
| `ssoUserId` | SSO `sub` claim |
| `email` | SSO `email` |
| `name` | SSO `name` |
| `companyId` | `'default-company'` |
| `roles` | `['employee']` |
| `emailVerified` | SSO `email_verified` |
| `isActive` | `true` |

### Subsequent Logins

Updates `email`, `name`, `emailVerified` from SSO. Preserves local data (company assignments, roles).

---

## SCIM 2.0 Integration

Automated employee provisioning from Aksara SSO.

### Sync Methods

| Method | Use Case |
|--------|----------|
| Web UI (`/modules/sync`) | Manual sync, testing |
| CLI (`bun run sync:scim`) | Scripted sync |
| Cron job | Scheduled sync (every 6-12 hours) |
| Webhooks | Real-time sync (recommended for production) |

### Webhook Endpoint

**POST** `/api/v1/scim/webhook`

- Events: `user.created`, `user.updated`, `user.deleted`, `group.created`, `group.updated`, `group.deleted`
- Security: HMAC SHA-256 signature via `X-SCIM-Signature` header
- Secret: `SCIM_WEBHOOK_SECRET` environment variable

### Data Mapping

**SCIM User -> OFM User:**

| SCIM Field | OFM Field |
|------------|-----------|
| `id` | `ssoUserId` |
| `userName` | `email` |
| `name.givenName` | `firstName` |
| `name.familyName` | `lastName` |
| `active` | `isActive` |
| `phoneNumbers[0].value` | `phone` |
| `enterprise.employeeNumber` | `userId` |
| `enterprise.department` | `departmentId` |
| `enterprise.organization` | `companyId` |

### Sync Behavior

- SCIM data **always wins** during sync (overwrites local changes)
- Deleted users are **soft-deleted** (`isActive: false`)
- Sync history logged to `syncHistory` collection
- Webhook events logged to `webhookEvents` collection

---

## OAuth Client Configuration

| Setting | Value |
|---------|-------|
| Client ID | `ofm-client` |
| Client Secret | `ofm-secret-2025` (Argon2 hashed in SSO) |
| Redirect URIs | `http://localhost:5174/auth/callback` (dev), `https://ofm.ias.co.id/auth/callback` (prod) |
| Scopes | `openid email profile roles` |
| Grant Types | `authorization_code`, `refresh_token` |

---

## Security Features

- OAuth 2.0 Authorization Code Flow with PKCE
- OpenID Connect (OIDC) ID tokens
- Encrypted session cookies (AES-GCM-256)
- HttpOnly cookies (XSS protection)
- SameSite: lax (CSRF protection)
- State parameter validation
- Token revocation on logout

---

## Route Summary

| Route | Description |
|-------|-------------|
| `/login` | Public login page with SSO button |
| `/auth/login` | Redirect to SSO authorization |
| `/auth/callback` | Handle OAuth callback, create session |
| `/auth/logout` | Logout, revoke tokens, clear session |

---

**Related:** [M2 Admin](M2-admin.md) (SCIM credentials in Settings), [M7 API](M7-api.md) (M7.8, M7.9), [M9 Mobile](M9-mobile.md) (token-based auth)
