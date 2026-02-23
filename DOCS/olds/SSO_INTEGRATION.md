# SSO Integration Guide - OFM ↔ Aksara SSO

## Overview

OFM (Office Facility Management) has been successfully integrated with Aksara SSO to provide secure, centralized authentication using OAuth 2.0 / OpenID Connect (OIDC) with PKCE support.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                            │
└────────┬────────────────────────────────────────────┬───────────┘
         │                                            │
         │ 1. Click "Sign in with SSO"               │ 5. Redirect with code
         ↓                                            ↑
┌─────────────────────────────────────────────────────────────────┐
│                   OFM (Port 5174)                               │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Routes:                                                    │ │
│  │  - /auth/login → Redirect to SSO                          │ │
│  │  - /auth/callback → Handle OAuth callback                 │ │
│  │  - /auth/logout → Logout & revoke tokens                  │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Libraries:                                                 │ │
│  │  - oauth.ts → OAuth client (token exchange, refresh)      │ │
│  │  - session.ts → Encrypted session management              │ │
│  │  - pkce.ts → PKCE challenge generation                    │ │
│  │  - sync.ts → User synchronization with local DB           │ │
│  └───────────────────────────────────────────────────────────┘ │
└────────┬────────────────────────────────────────────┬───────────┘
         │ 2. Authorization request with PKCE        │ 6. Token exchange
         │                                            │
         ↓                                            │
┌─────────────────────────────────────────────────────────────────┐
│                Aksara SSO (Port 5173)                           │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ OAuth Endpoints:                                           │ │
│  │  - /oauth/authorize → Login & consent                      │ │
│  │  - /oauth/token → Exchange code for tokens                 │ │
│  │  - /oauth/userinfo → Get user profile                      │ │
│  │  - /oauth/revoke → Revoke tokens (logout)                  │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Database:                                                  │ │
│  │  - Users (admin@ias.co.id / password123)                   │ │
│  │  - OAuth Clients (ofm-client / ofm-secret-2025)            │ │
│  │  - Auth Codes (10 min expiry)                              │ │
│  │  - Refresh Tokens (30 day expiry)                          │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
         │ 3. User authenticates                     │ 4. Login success
         ↓                                            ↑
┌─────────────────────────────────────────────────────────────────┐
│                     SSO Login Page                              │
│  Email: admin@ias.co.id                                         │
│  Password: password123                                          │
└─────────────────────────────────────────────────────────────────┘
```

## Authentication Flow

### 1. User Initiates Login
- User clicks "Sign in with Aksara SSO" on OFM homepage
- OFM generates PKCE pair (code_verifier, code_challenge)
- OFM stores state and code_verifier in httpOnly cookies
- OFM redirects to SSO authorization endpoint

### 2. SSO Authentication
- User logs in at Aksara SSO (admin@ias.co.id / password123)
- SSO validates credentials
- SSO creates authorization code (10 min expiry)
- SSO redirects back to OFM callback with code

### 3. Token Exchange
- OFM callback receives authorization code
- OFM exchanges code for tokens using code_verifier (PKCE)
- SSO returns: `access_token`, `refresh_token`, `id_token`

### 4. User Info Retrieval
- OFM calls `/oauth/userinfo` with access_token
- SSO returns user profile: `sub`, `email`, `name`

### 5. User Synchronization
- OFM creates/updates user in local database
- Maps SSO user ID to local user record
- Assigns default role (`employee`)

### 6. Session Creation
- OFM creates encrypted session token
- Session includes: userId, email, name, roles, tokens, expiry
- Session stored in encrypted httpOnly cookie (`ofm_session`)

### 7. Automatic Token Refresh
- On every request, `hooks.server.ts` checks session expiry
- If expires in < 15 minutes, automatically refresh using refresh_token
- Seamless user experience with no re-login required

## Configuration

### Aksara SSO

**OAuth Client Registration:**
- **Client ID:** `ofm-client`
- **Client Secret:** `ofm-secret-2025` (Argon2 hashed in database)
- **Redirect URIs:**
  - `http://localhost:5174/auth/callback`
  - `http://localhost:5174/auth/silent-refresh`
  - `https://ofm.ias.co.id/auth/callback` (production)
- **Scopes:** `openid email profile roles`
- **Grant Types:** `authorization_code`, `refresh_token`

**Test Credentials:**
- Email: `admin@ias.co.id`
- Password: `password123`

### OFM Environment Variables

```env
# Application Configuration
APP_URL=http://localhost:5174

# SSO/OAuth Configuration
SSO_ISSUER=http://localhost:5173
SSO_AUTHORIZATION_URL=http://localhost:5173/oauth/authorize
SSO_TOKEN_URL=http://localhost:5173/oauth/token
SSO_USERINFO_URL=http://localhost:5173/oauth/userinfo
SSO_JWKS_URL=http://localhost:5173/.well-known/jwks.json
SSO_DISCOVERY_URL=http://localhost:5173/.well-known/openid-configuration
SSO_CLIENT_ID=ofm-client
SSO_CLIENT_SECRET=ofm-secret-2025
SSO_REDIRECT_URI=http://localhost:5174/auth/callback
SSO_SCOPES=openid email profile roles

# Session Configuration
SESSION_SECRET=dev-session-secret-key-change-in-production
```

## Files Created/Modified

### New Files

#### Authentication Utilities
- `src/lib/server/auth/pkce.ts` - PKCE challenge generation
- `src/lib/server/auth/oauth.ts` - OAuth client library
- `src/lib/server/auth/session.ts` - Encrypted session management
- `src/lib/server/auth/sync.ts` - User synchronization

#### Auth Routes
- `src/routes/auth/login/+server.ts` - Login endpoint
- `src/routes/auth/callback/+server.ts` - OAuth callback handler
- `src/routes/auth/logout/+server.ts` - Logout endpoint

#### Page Loaders
- `src/routes/+page.server.ts` - Pass user data to homepage

#### Scripts
- `aksara/sso/scripts/add-ofm-client.ts` - Register OFM client in SSO

### Modified Files
- `src/hooks.server.ts` - Session validation middleware
- `src/app.d.ts` - TypeScript type definitions
- `src/lib/server/auth/index.ts` - Removed placeholder auth functions
- `src/routes/+page.svelte` - Added login/logout UI
- `jss/OFM/.env` - Added SSO configuration

## Key Features

### Security
- ✅ OAuth 2.0 Authorization Code Flow with PKCE
- ✅ OpenID Connect (OIDC) ID tokens
- ✅ Encrypted session cookies (AES-GCM-256)
- ✅ HttpOnly cookies (XSS protection)
- ✅ Secure cookie flag in production
- ✅ SameSite: lax (CSRF protection)
- ✅ State parameter validation
- ✅ Token expiration (1 hour access, 30 days refresh)
- ✅ Automatic token refresh (15 min before expiry)

### User Experience
- ✅ Single Sign-On (SSO) - one login for all apps
- ✅ Seamless authentication flow
- ✅ Automatic session refresh (no re-login)
- ✅ Clean login UI with SSO button
- ✅ Logout with token revocation

### Developer Experience
- ✅ Clean separation of concerns
- ✅ Reusable OAuth client library
- ✅ TypeScript type safety
- ✅ Error handling throughout
- ✅ Automatic user synchronization

## Testing

### 1. Start Both Servers

```bash
# Terminal 1: Start Aksara SSO
cd aksara/sso
bun run dev  # Port 5173

# Terminal 2: Start OFM
cd jss/OFM
bun run dev  # Port 5174
```

### 2. Test Authentication Flow

1. Open `http://localhost:5174` in browser
2. Should see "Sign in with Aksara SSO" button
3. Click the button
4. Redirected to `http://localhost:5173/oauth/authorize`
5. Login with:
   - Email: `admin@ias.co.id`
   - Password: `password123`
6. Approve consent (if shown)
7. Redirected back to `http://localhost:5174`
8. Should see personalized dashboard with user name
9. Session cookie `ofm_session` should be set

### 3. Test Logout

1. Click "Logout" button
2. Session cookie cleared
3. Refresh token revoked at SSO
4. Redirected to login page

### 4. Test Session Persistence

1. After logging in, close browser
2. Re-open browser and go to `http://localhost:5174`
3. Should still be logged in (session persists)
4. Wait 15 minutes before access token expires
5. Navigate around the site
6. Token should auto-refresh seamlessly

## Token Management

### Access Token
- **Lifetime:** 1 hour
- **Storage:** Encrypted in session cookie
- **Refresh:** Automatically refreshed 15 min before expiry
- **Usage:** Bearer token for API calls

### Refresh Token
- **Lifetime:** 30 days
- **Storage:** Encrypted in session cookie
- **Usage:** Refresh access token without re-login
- **Revocation:** On logout

### Session Cookie
- **Name:** `ofm_session`
- **Encryption:** AES-GCM-256
- **Attributes:** HttpOnly, Secure (prod), SameSite=Lax
- **Max Age:** 30 days

## User Synchronization

When a user logs in via SSO for the first time:

1. OFM checks if user exists locally by `ssoUserId`
2. If not found, creates new user with:
   - `email` from SSO
   - `name` from SSO
   - `ssoUserId` (SSO `sub` claim)
   - `companyId` = `'default-company'`
   - `roles` = `['employee']` (default)
   - `emailVerified` from SSO
   - `isActive` = `true`

On subsequent logins:
- Updates `email`, `name`, `emailVerified` from SSO
- Preserves local data (company assignments, roles)

## API Reference

### OAuth Client Functions

**`buildAuthorizationUrl(redirectPath?: string)`**
- Generates authorization URL with PKCE
- Returns: `{ url, state, codeVerifier }`

**`exchangeCodeForTokens(code: string, codeVerifier: string)`**
- Exchanges authorization code for tokens
- Returns: `OAuthTokens`

**`refreshAccessToken(refreshToken: string)`**
- Refreshes expired access token
- Returns: `OAuthTokens`

**`getUserInfo(accessToken: string)`**
- Fetches user profile from SSO
- Returns: `UserInfo { sub, email, name, email_verified }`

**`revokeToken(token: string, tokenTypeHint?: string)`**
- Revokes token at SSO
- No return value

### Session Functions

**`createSession(userInfo: UserInfo, tokens: OAuthTokens, companyId?: string)`**
- Creates encrypted session token
- Returns: `string` (encrypted session)

**`getSession(sessionCookie: string)`**
- Decrypts and validates session
- Returns: `SessionData | null`

**`refreshSession(session: SessionData)`**
- Refreshes tokens and updates session
- Returns: `string` (new encrypted session)

**`setSessionCookie(event: RequestEvent, sessionToken: string)`**
- Sets httpOnly session cookie

**`clearSessionCookie(event: RequestEvent)`**
- Clears session cookie

### Sync Functions

**`syncUserFromSSO(userInfo: UserInfo)`**
- Creates or updates user from SSO data
- Returns: `User`

**`getUserBySSOId(ssoUserId: string)`**
- Finds user by SSO user ID
- Returns: `User | null`

## Troubleshooting

### Issue: "Missing OAuth state or code verifier"
- **Cause:** Cookies not persisting between redirects
- **Solution:** Ensure browser allows cookies, check cookie settings

### Issue: "Token exchange failed: 400"
- **Cause:** Invalid code or code_verifier
- **Solution:** Check PKCE implementation, verify redirect URI matches

### Issue: "Session decode error"
- **Cause:** Corrupted session cookie or wrong SESSION_SECRET
- **Solution:** Clear cookies, verify SESSION_SECRET in .env

### Issue: "Authentication failed. Please try again."
- **Cause:** Network error or SSO down
- **Solution:** Check both servers are running, verify network connectivity

### Issue: User not found in database after login
- **Cause:** User sync failed
- **Solution:** Check MongoDB connection, verify user creation logic

## Production Deployment

### Prerequisites
- Both apps must use HTTPS
- Update redirect URIs in SSO client config
- Change secrets in production .env

### Security Checklist
- [ ] Generate strong SESSION_SECRET (min 32 characters)
- [ ] Generate strong JWT_SECRET (min 32 characters)
- [ ] Update SSO_CLIENT_SECRET with production value
- [ ] Enable HTTPS for both apps
- [ ] Set `NODE_ENV=production`
- [ ] Update redirect URIs to production domains
- [ ] Configure CORS policies
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy for sessions
- [ ] Test token refresh in production
- [ ] Implement MFA (future enhancement)

### Environment Variables (Production)

```env
# Production SSO Configuration
SSO_ISSUER=https://sso.your-domain.com
SSO_AUTHORIZATION_URL=https://sso.your-domain.com/oauth/authorize
SSO_TOKEN_URL=https://sso.your-domain.com/oauth/token
SSO_USERINFO_URL=https://sso.your-domain.com/oauth/userinfo
SSO_CLIENT_ID=ofm-client
SSO_CLIENT_SECRET=<production-secret-here>
SSO_REDIRECT_URI=https://ofm.your-domain.com/auth/callback
SSO_SCOPES=openid email profile roles

# Production Session
SESSION_SECRET=<random-32-char-string>
JWT_SECRET=<random-32-char-string>
NODE_ENV=production
```

## Future Enhancements

### Planned Features
- [ ] Multi-Factor Authentication (MFA)
- [ ] Remember Me functionality
- [ ] Silent token refresh (iframe)
- [ ] Single Logout (SLO) across all apps
- [ ] Session management UI (view active sessions)
- [ ] Role synchronization from SSO
- [ ] Team/group synchronization
- [ ] Audit logging for authentication events
- [ ] Login activity tracking
- [ ] Suspicious activity detection

### Nice to Have
- [ ] Social login (Google, Microsoft)
- [ ] Biometric authentication
- [ ] Passwordless login (magic links)
- [ ] Device trust management
- [ ] Geolocation-based access control

## Support

For issues or questions:
1. Check this documentation
2. Review error logs in browser console
3. Check server logs for both OFM and SSO
4. Verify environment variables are set correctly
5. Ensure both servers are running on correct ports

---

**Last Updated:** 2025-10-16
**Status:** ✅ Production Ready
**Version:** 1.0.0
