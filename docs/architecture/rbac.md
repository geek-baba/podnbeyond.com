# RBAC Architecture

**Last Updated:** 2025-01-21  
**Status:** ✅ **Production-Ready**

---

## Overview

The Role-Based Access Control (RBAC) system provides property-scoped permissions, magic link authentication, and a comprehensive role hierarchy from guest to superadmin.

---

## Role Hierarchy

### Public Roles

#### GUEST (Unauthenticated)
- **Permissions:** `properties:read`, `rooms:read`, `brands:read`
- **Access:** Public website only
- **Scope:** N/A

#### MEMBER (Loyalty Customer)
- **Permissions:** All GUEST permissions + `bookings:read:own`, `loyalty:read:own`, `profile:read:own`, `profile:update:own`
- **Access:** `/account` member area
- **Scope:** Own data only

### Staff Roles (Property-Scoped)

#### STAFF_FRONTDESK
- **Permissions:** `bookings:read:scoped`, `bookings:write:scoped`, `checkin:write:scoped`, `checkout:write:scoped`, `guests:read:scoped`, `rooms:read:scoped`, `inventory:read:scoped`
- **Access:** `/admin` dashboard (limited to assigned properties)
- **Scope:** `PROPERTY` (one or more properties)

#### STAFF_OPS
- **Permissions:** `inventory:read:scoped`, `inventory:update:scoped`, `rooms:read:scoped`, `rooms:update:scoped`, `pricing:read:scoped`, `pricing:update:scoped`, `maintenance:write:scoped`
- **Access:** `/admin` dashboard (operations tabs)
- **Scope:** `PROPERTY` (one or more properties)

### Management Roles

#### MANAGER
- **Permissions:** All staff permissions + `bookings:*:scoped`, `inventory:*:scoped`, `rooms:*:scoped`, `pricing:*:scoped`, `staff:read:scoped`, `staff:invite:scoped`, `refunds:write:scoped`, `comps:write:scoped`, `reports:read:scoped`, `analytics:read:scoped`
- **Access:** `/admin` full dashboard for assigned properties
- **Scope:** `PROPERTY` or `BRAND` (one or more)

#### ADMIN
- **Permissions:** `properties:*`, `brands:*`, `bookings:*`, `inventory:*`, `rooms:*`, `pricing:*`, `ota:configure`, `payments:configure`, `cms:*`, `users:invite`, `users:read`, `loyalty:adjust`, `settings:update`
- **Access:** `/admin` full dashboard (all properties)
- **Scope:** `ORG` (entire organization)

#### SUPERADMIN
- **Permissions:** `*` (wildcard - ALL permissions) + `secrets:manage`, `users:impersonate`, `flags:manage`, `audit:read`
- **Access:** Everything
- **Scope:** `ORG` (platform-wide)

---

## Permission Format

Permissions follow: `resource:action:scope`

**Examples:**
- `bookings:read` - Global read access
- `bookings:read:scoped` - Scoped read access (respects user's scope)
- `bookings:read:own` - Read only own bookings
- `bookings:*` - All actions on bookings (wildcard)
- `*` - All permissions (superadmin only)

### Scope Types

| Scope Type | Description | Example Use Case |
|------------|-------------|------------------|
| `ORG` | Organization-wide | Admin, Superadmin (all properties) |
| `BRAND` | Brand-wide | Manager of all Capsule properties |
| `PROPERTY` | Single property | Front desk staff at Kasidih location |

### Scope Hierarchy

```
ORG (highest)
 └── BRAND
      └── PROPERTY (lowest)
```

---

## Authentication Flow

### Magic Link (Email)

1. User enters email at `/admin/login`
2. NextAuth sends magic link email
3. User clicks link in email
4. NextAuth verifies token and creates session
5. User redirected to `/admin` or `/account`

### Session Management

- **Session Type:** JWT-based
- **Storage:** HTTP-only cookies
- **Duration:** 30 days
- **Security:** `httpOnly: true`, `secure: true` (HTTPS only), `sameSite: 'lax'`

### Auto-Assignment

When a new user signs in for the first time:
- Automatically assigned **MEMBER** role
- Loyalty account created automatically
- Starts with 0 points, MEMBER tier

---

## Invite System

### Workflow

1. **Admin/Manager creates invite:**
   - Go to `/admin` → Users tab → Invite User
   - Enter: email, role, scope (property/brand)
   - System generates secure token
   - Invite link sent to email (or shown in UI)

2. **Invitee receives email:**
   - Clicks magic link: `/admin/accept-invite?token=xxx`
   - Enters their name
   - Account created with assigned role

3. **Invitee signs in:**
   - Can now request magic link at `/admin/login`
   - Auto-redirected to appropriate dashboard

### Invite Constraints

- Valid for **7 days**
- One-time use
- Cannot invite existing users
- Inviter must have `users:invite` permission
- Manager can only invite to properties they manage

---

## Database Models

### Core Auth Models (NextAuth)

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  emailVerified DateTime?
  phone         String?
  
  accounts      Account[]
  sessions      Session[]
  userRoles     UserRole[]
  loyaltyAccount LoyaltyAccount?
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
}
```

### RBAC Models

```prisma
model Role {
  key         RoleKey  @unique
  name        String
  permissions String[]
}

model UserRole {
  userId    String
  roleKey   RoleKey
  scopeType ScopeType  // ORG | BRAND | PROPERTY
  scopeId   Int?       // ID of org/brand/property
}
```

---

## API Endpoints

### Authentication

```
POST   /api/auth/signin         NextAuth magic link
GET    /api/auth/signout        Sign out
GET    /api/auth/session        Current session
GET    /api/auth/me             User + roles + scopes + properties
```

### Member Account

```
GET    /api/account/profile     User profile
GET    /api/account/bookings    User's bookings
GET    /api/account/points-ledger   Points history
```

### Admin - User Management

```
POST   /api/admin/invites       Create invite (admin/manager)
GET    /api/admin/invites       List invites
POST   /api/admin/invites/accept    Accept invite (public)
GET    /api/admin/users         List users (admin)
POST   /api/admin/users/:id/roles   Assign/remove roles
```

### Admin - Audit

```
GET    /api/admin/audit         Audit logs (admin/superadmin)
```

---

## Security Features

### Implemented

- ✅ **Magic Link Auth** - No passwords to leak
- ✅ **HTTP-Only Cookies** - XSS protection
- ✅ **CORS Configuration** - Only allow frontend origin
- ✅ **Session Expiry** - Auto-logout after 30 days
- ✅ **Audit Logging** - Track all admin actions
- ✅ **Scope Enforcement** - Users can't access out-of-scope data

---

## Setup Instructions

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install cookie-parser

# Frontend
cd frontend
npm install next-auth @next-auth/prisma-adapter nodemailer
```

### 2. Configure Environment

**Backend (.env):**
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret-here"  # Generate with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="noreply@podnbeyond.com"
BOOTSTRAP_SUPERADMIN_EMAIL="admin@podnbeyond.com"
```

**Frontend (.env.local):**
```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="same-secret-as-backend"  # MUST BE SAME!
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="noreply@podnbeyond.com"
```

**Critical:** `NEXTAUTH_SECRET` must be the same in both files!

### 3. Run Migrations

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

### 4. Seed Roles & Superadmin

```bash
cd backend
BOOTSTRAP_SUPERADMIN_EMAIL="admin@podnbeyond.com" node seed_rbac.js
```

This creates:
- 1 Organization (POD N BEYOND GROUP)
- 7 Roles with permissions
- 1 Superadmin user

### 5. First Login

1. Go to `http://localhost:3000/admin/login`
2. Enter superadmin email (`admin@podnbeyond.com`)
3. Check email for magic link
4. Click link to sign in
5. Access `/admin` dashboard

---

## Usage Examples

### Checking Permissions (Frontend)

```typescript
import { useSession } from 'next-auth/react';

const { data: session } = useSession();

// Check if user has admin role
const isAdmin = session?.user?.roles?.some(r => 
  ['ADMIN', 'SUPERADMIN'].includes(r.key)
);

// Check if user can edit bookings
const canEditBookings = session?.user?.roles?.some(r =>
  r.permissions.includes('bookings:write:scoped') ||
  r.permissions.includes('bookings:*') ||
  r.permissions.includes('*')
);
```

### Protecting API Route (Backend)

```javascript
const { requirePermission } = require('../lib/rbac');

router.post('/api/bookings', requirePermission('bookings:write:scoped'), async (req, res) => {
  // User is authenticated and has permission
  // req.user contains user info
  // req.user.scope contains accessible property IDs
});
```

---

## Related Documentation

- [Booking Architecture](./booking.md) - Booking permissions
- [Communication Hub Architecture](./communication-hub.md) - Conversation permissions
- [Deployment Guide](../operations/deployment.md) - Environment setup

---

**Code Locations:**
- RBAC Library: `backend/lib/rbac.js`
- Auth Routes: `backend/routes/auth.js`
- Invite Routes: `backend/routes/invites.js`
- User Routes: `backend/routes/users.js`
- Seed Script: `backend/seed_rbac.js`
- Database Schema: `backend/prisma/schema.prisma` (User, Role, UserRole models)

