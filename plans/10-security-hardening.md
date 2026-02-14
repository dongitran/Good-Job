# Phase 10 — Security Hardening

## Objective

Add production-grade security measures. The grading criteria specifically mention rate limiting, CSRF protection, and advanced auth (SSO/OIDC or 2FA). This phase crosses the **>70 point Senior threshold**.

---

## What the Grading Requires

- Rate limiting
- CSRF protection
- Advanced Auth: SSO via OIDC/SAML **or** 2FA implementation

---

## 1. Rate Limiting

### Approach

Use `@nestjs/throttler` module with Redis-backed store.

### Configuration

| Endpoint Group | Limit | Window | Reason |
|:---------------|:------|:-------|:-------|
| Global default | 100 req | 1 minute | General abuse prevention |
| POST /api/auth/login | 5 req | 1 minute | Brute-force protection |
| POST /api/auth/register | 3 req | 1 minute | Spam prevention |
| POST /api/kudos | 20 req | 1 minute | Kudo spam prevention |
| POST /api/redemptions | 10 req | 1 minute | Redemption abuse |
| POST /api/ai/* | 5 req | 1 minute | Expensive API calls |

### Implementation

- Install `@nestjs/throttler`
- Configure Redis store (distributed rate limiting across instances)
- Apply global throttler guard
- Use `@Throttle()` decorator for endpoint-specific overrides
- Use `@SkipThrottle()` for health check and public read endpoints
- Return `429 Too Many Requests` with `Retry-After` header

---

## 2. CSRF Protection

### Approach for SPA

Traditional CSRF tokens are for server-rendered forms. For a React SPA with JWT auth, use the **double-submit cookie pattern**:

1. Server sets a random CSRF token in a cookie (`csrf-token`, not httpOnly)
2. Frontend reads the cookie and sends it as a header (`X-CSRF-Token`)
3. Server compares cookie value vs header value
4. Attacker sites cannot read cross-origin cookies, so they can't forge the header

### Implementation

- Middleware to generate and validate CSRF token
- Apply to all state-changing methods (POST, PUT, PATCH, DELETE)
- Skip for login/register (no session to protect yet)
- Frontend: Axios interceptor reads cookie and attaches header

### Additional Headers (Helmet)

Install `helmet` middleware for security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security` (HSTS)
- `Content-Security-Policy`
- `X-XSS-Protection`

---

## 3. Two-Factor Authentication (TOTP)

### Why 2FA over SSO?

- SSO (OIDC/SAML) requires an external identity provider — hard to demo
- TOTP 2FA is self-contained and fully demonstrable
- Works with Google Authenticator, Authy, or any TOTP app
- Uses standard RFC 6238 algorithm

### User Flow

**Setup 2FA:**
1. User goes to Settings → Security → Enable 2FA
2. Click "Enable" → server generates TOTP secret
3. Server returns QR code (base64 image) + secret string
4. User scans QR with authenticator app
5. User enters 6-digit code to verify
6. Server validates code → marks 2FA as enabled

**Login with 2FA:**
1. User submits email + password → server validates credentials
2. If 2FA enabled → server returns `{ requires2FA: true, tempToken }`
3. Frontend shows 2FA input screen
4. User enters 6-digit code from authenticator app
5. Server validates code + tempToken → returns full JWT pair
6. If code invalid → "Invalid code, try again"

### Backend Endpoints

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| POST | /api/auth/2fa/setup | Generate TOTP secret + QR code |
| POST | /api/auth/2fa/verify | Verify code and enable 2FA |
| POST | /api/auth/2fa/validate | Validate code during login |
| POST | /api/auth/2fa/disable | Turn off 2FA (requires current code) |

### Libraries

- `otplib` — TOTP generation and validation
- `qrcode` — QR code generation (PNG/base64)

### Storage

- Add to users table: `two_factor_secret` (encrypted), `two_factor_enabled` (boolean)
- Encrypt the secret at rest (not plain text in DB)

---

## 4. Additional Security

- **Input sanitization**: Sanitize kudo messages to prevent stored XSS
- **Payload size limit**: Max request body 1MB
- **JWT blacklist**: On logout, add token to Redis blacklist (TTL = token expiry)
- **Password policy**: Minimum 8 chars, require uppercase + lowercase + number

---

## Tests

**Rate Limiting Tests**:
- Send requests exceeding limit → verify 429 response
- Verify `Retry-After` header present
- Verify different limits per endpoint group

**CSRF Tests**:
- POST without CSRF token → 403
- POST with valid CSRF token → success
- GET requests not affected by CSRF

**2FA Tests**:
- Setup flow: generate secret → verify code → 2FA enabled
- Login with 2FA: correct code → success
- Login with 2FA: wrong code → 401
- Disable 2FA: requires valid current code

**Security Header Tests**:
- Verify Helmet headers present in responses

---

## Expected Output

- Rate limiting active on all endpoints with proper limits
- CSRF protection functional for state-changing requests
- 2FA setup and login flow works with authenticator apps
- Security headers present
- All security tests pass

## Grading Points

- **Security** (complete): Rate limiting + CSRF + 2FA = full 10 points

## Next

→ Phase 11: Event Sourcing & Engineering
