# 🔐 POD N BEYOND - RBAC & User Management System

> **Production-Ready Role-Based Access Control with Property-Scoped Permissions**

---

## 📋 **Overview**

This document describes the comprehensive RBAC (Role-Based Access Control) system implemented for POD N BEYOND GROUP. The system provides:

- ✅ **7 Role Types** - From guest to superadmin
- ✅ **Property-Scoped Permissions** - Staff access limited to assigned properties
- ✅ **Magic Link Authentication** - Passwordless login via NextAuth
- ✅ **Audit Logging** - Complete trail of all admin actions
- ✅ **Invite System** - Secure staff onboarding workflow
- ✅ **Member Accounts** - Loyalty members can view bookings and points

---

## 👥 **Role Hierarchy**

### **Public Roles**

#### 1. **GUEST** (Unauthenticated)
- **Description**: Any visitor browsing the website
- **Permissions**:
  - `properties:read` - View property listings
  - `rooms:read` - View room types and pricing
  - `brands:read` - View brand information
- **Access**: Public website only
- **Scope**: N/A (no authentication required)

#### 2. **MEMBER** (Loyalty Customer)
- **Description**: Registered loyalty program member
- **Permissions**:
  - All GUEST permissions
  - `bookings:read:own` - View their own bookings
  - `loyalty:read:own` - View loyalty points and history
  - `profile:read:own` - View own profile
  - `profile:update:own` - Update own profile
- **Access**: `/account` member area
- **Scope**: Own data only

---

### **Staff Roles** (Property-Scoped)

#### 3. **STAFF_FRONTDESK** (Front Desk Staff)
- **Description**: Handle check-in/out, manage bookings for assigned properties
- **Permissions**:
  - `bookings:read:scoped` - View bookings at assigned properties
  - `bookings:write:scoped` - Create/modify bookings
  - `checkin:write:scoped` - Check guests in
  - `checkout:write:scoped` - Check guests out
  - `guests:read:scoped` - View guest information
  - `rooms:read:scoped` - View room inventory
  - `inventory:read:scoped` - View availability
- **Access**: `/admin` dashboard (limited to assigned properties)
- **Scope**: `PROPERTY` (one or more properties)

#### 4. **STAFF_OPS** (Operations Staff)
- **Description**: Manage inventory, room status, pricing for assigned properties
- **Permissions**:
  - `inventory:read:scoped` - View inventory status
  - `inventory:update:scoped` - Update room availability
  - `rooms:read:scoped` - View rooms
  - `rooms:update:scoped` - Update room details
  - `pricing:read:scoped` - View pricing
  - `pricing:update:scoped` - Update pricing calendars
  - `maintenance:write:scoped` - Mark rooms for maintenance
- **Access**: `/admin` dashboard (operations tabs)
- **Scope**: `PROPERTY` (one or more properties)

---

### **Management Roles**

#### 5. **MANAGER** (Property Manager)
- **Description**: Complete control over assigned properties
- **Permissions**:
  - All staff permissions for scoped properties
  - `bookings:*:scoped` - Full booking management
  - `inventory:*:scoped` - Full inventory control
  - `rooms:*:scoped` - Add/edit/delete rooms
  - `pricing:*:scoped` - Full pricing control
  - `staff:read:scoped` - View property staff
  - `staff:invite:scoped` - Invite staff to property
  - `refunds:write:scoped` - Process refunds
  - `comps:write:scoped` - Grant complimentary stays
  - `reports:read:scoped` - Property reports
  - `analytics:read:scoped` - Property analytics
- **Access**: `/admin` full dashboard for assigned properties
- **Scope**: `PROPERTY` or `BRAND` (one or more)

#### 6. **ADMIN** (Group Administrator)
- **Description**: Group-level access across ALL properties
- **Permissions**:
  - `properties:*` - Manage all properties
  - `brands:*` - Manage all brands
  - `bookings:*` - All bookings
  - `inventory:*` - All inventory
  - `rooms:*` - All rooms
  - `pricing:*` - All pricing
  - `ota:configure` - Configure OTA integrations
  - `payments:configure` - Configure payment settings
  - `cms:*` - Full CMS access
  - `users:invite` - Invite any role
  - `users:read` - View all users
  - `loyalty:adjust` - Manual point adjustments
  - `settings:update` - Update system settings
- **Access**: `/admin` full dashboard (all properties)
- **Scope**: `ORG` (entire organization)

#### 7. **SUPERADMIN** (Platform Administrator)
- **Description**: Complete platform control
- **Permissions**:
  - `*` - Wildcard (ALL permissions)
  - `secrets:manage` - Manage sensitive configuration
  - `users:impersonate` - Impersonate any user
  - `flags:manage` - Feature flag control
  - `audit:read` - View all audit logs
- **Access**: Everything
- **Scope**: `ORG` (platform-wide)

---

## 🔒 **Permission System**

### **Permission Format**

Permissions follow the pattern: `resource:action:scope`

**Examples**:
- `bookings:read` - Global read access to bookings
- `bookings:read:scoped` - Scoped read access (respects user's scope)
- `bookings:read:own` - Read only own bookings
- `bookings:*` - All actions on bookings (wildcard)
- `*` - All permissions (superadmin only)

### **Scope Types**

| Scope Type | Description | Example Use Case |
|------------|-------------|------------------|
| `ORG` | Organization-wide | Admin, Superadmin (all properties) |
| `BRAND` | Brand-wide | Manager of all Capsule properties |
| `PROPERTY` | Single property | Front desk staff at Kasidih location |

### **Scope Hierarchy**

```
ORG (highest)
 └── BRAND
      └── PROPERTY (lowest)
```

- ORG scope can access everything
- BRAND scope can access all properties within that brand
- PROPERTY scope limited to specific property

---

## 🔐 **Authentication Flow**

### **Magic Link (Email)**

1. User enters email at `/admin/login`
2. NextAuth sends magic link email
3. User clicks link in email
4. NextAuth verifies token and creates session
5. User redirected to `/admin` or `/account`

### **Session Management**

- **Session Type**: JWT-based
- **Storage**: HTTP-only cookies
- **Duration**: 30 days
- **Security**: 
  - `httpOnly: true` - Not accessible via JavaScript
  - `secure: true` - HTTPS only in production
  - `sameSite: 'lax'` - CSRF protection

### **Auto-Assignment**

When a new user signs in for the first time:
- Automatically assigned **MEMBER** role
- Loyalty account created automatically
- Starts with 0 points, SILVER tier

---

## 🎫 **Invite System**

### **Workflow**

1. **Admin/Manager creates invite**:
   - Go to `/admin` → Users tab → Invite User
   - Enter: email, role, scope (property/brand)
   - System generates secure token
   - Invite link sent to email (or shown in UI)

2. **Invitee receives email**:
   - Clicks magic link: `/admin/accept-invite?token=xxx`
   - Enters their name
   - Account created with assigned role

3. **Invitee signs in**:
   - Can now request magic link at `/admin/login`
   - Auto-redirected to appropriate dashboard

### **Invite Constraints**

- Valid for **7 days**
- One-time use
- Cannot invite existing users
- Inviter must have `users:invite` permission
- Manager can only invite to properties they manage

---

## 📊 **Database Models**

### **Core Auth Models** (NextAuth)

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

### **RBAC Models**

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

### **Audit & Logging**

```prisma
model AuditLog {
  actorUserId String
  action      String
  targetType  String?
  targetId    String?
  metadata    Json?
  ip          String?
  createdAt   DateTime
}

model PointsLedger {
  userId       String
  points       Int         // +earn / -burn
  reason       String
  balanceBefore Int
  balanceAfter  Int
}
```

---

## 🛡️ **Security Features**

### **Implemented**

- ✅ **Magic Link Auth** - No passwords to leak
- ✅ **HTTP-Only Cookies** - XSS protection
- ✅ **CORS Configuration** - Only allow frontend origin
- ✅ **Session Expiry** - Auto-logout after 30 days
- ✅ **Audit Logging** - Track all admin actions
- ✅ **Scope Enforcement** - Users can't access out-of-scope data

### **Ready to Add** (Flagged)

- ⚠️ **MFA** - Multi-factor authentication for managers/admins
- ⚠️ **Rate Limiting** - Prevent brute force
- ⚠️ **CSRF Tokens** - Additional form protection
- ⚠️ **Request Validation** - Zod schemas on all inputs

---

## 🚀 **Setup Instructions**

### **1. Install Dependencies**

```bash
# Backend
cd backend
npm install cookie-parser

# Frontend
cd frontend
npm install next-auth @next-auth/prisma-adapter nodemailer
```

### **2. Configure Environment**

Copy example files and fill in values:

```bash
# Backend
cp backend/env.example backend/.env
# Edit: DATABASE_URL, NEXTAUTH_SECRET, EMAIL_SERVER_*, BOOTSTRAP_SUPERADMIN_EMAIL

# Frontend  
cp frontend/env.local.example frontend/.env.local
# Edit: NEXT_PUBLIC_API_URL, NEXTAUTH_SECRET, EMAIL_SERVER_*
```

**Critical**: `NEXTAUTH_SECRET` must be the same in both files!

### **3. Run Migrations**

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

### **4. Seed Roles & Superadmin**

```bash
cd backend
BOOTSTRAP_SUPERADMIN_EMAIL="admin@podnbeyond.com" node seed_rbac.js
```

This creates:
- 1 Organization (POD N BEYOND GROUP)
- 7 Roles with permissions
- 1 Superadmin user

### **5. Start Services**

```bash
# Backend
cd backend
npm start

# Frontend
cd frontend
npm run dev
```

### **6. First Login**

1. Go to `http://localhost:3000/admin/login`
2. Enter superadmin email (`admin@podnbeyond.com`)
3. Check email for magic link
4. Click link to sign in
5. Access `/admin` dashboard

---

## 📝 **Role Matrix**

| Feature | Guest | Member | Front Desk | Ops | Manager | Admin | Super |
|---------|-------|--------|------------|-----|---------|-------|-------|
| **Public Website** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **View Own Bookings** | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Loyalty Points** | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Admin Dashboard** | ❌ | ❌ | ✅* | ✅* | ✅* | ✅ | ✅ |
| **Check-in/out** | ❌ | ❌ | ✅* | ❌ | ✅* | ✅ | ✅ |
| **Manage Bookings** | ❌ | ❌ | ✅* | ❌ | ✅* | ✅ | ✅ |
| **Update Inventory** | ❌ | ❌ | ❌ | ✅* | ✅* | ✅ | ✅ |
| **Set Pricing** | ❌ | ❌ | ❌ | ✅* | ✅* | ✅ | ✅ |
| **Manage Staff** | ❌ | ❌ | ❌ | ❌ | ✅* | ✅ | ✅ |
| **Process Refunds** | ❌ | ❌ | ❌ | ❌ | ✅* | ✅ | ✅ |
| **Configure OTA** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Configure Payments** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **CMS Management** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Adjust Loyalty Points** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Invite Users** | ❌ | ❌ | ❌ | ❌ | ✅* | ✅ | ✅ |
| **View Audit Logs** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **User Impersonation** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Feature Flags** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Platform Config** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

**\*** = Scoped to assigned properties only

---

## 🔑 **API Endpoints**

### **Authentication**

```
POST   /api/auth/signin         NextAuth magic link
GET    /api/auth/signout        Sign out
GET    /api/auth/session        Current session
GET    /api/auth/me             User + roles + scopes + properties
```

### **Member Account**

```
GET    /api/account/profile     User profile
GET    /api/account/bookings    User's bookings
GET    /api/account/points-ledger   Points history
```

### **Admin - User Management**

```
POST   /api/admin/invites       Create invite (admin/manager)
GET    /api/admin/invites       List invites
POST   /api/admin/invites/accept    Accept invite (public)
GET    /api/admin/users         List users (admin)
POST   /api/admin/users/:id/roles   Assign/remove roles
```

### **Admin - Audit**

```
GET    /api/admin/audit         Audit logs (admin/superadmin)
```

---

## 🔧 **Usage Examples**

### **Creating an Invite (Admin)**

```typescript
// POST /api/admin/invites
{
  "email": "staff@podnbeyond.com",
  "roleKey": "STAFF_FRONTDESK",
  "scopeType": "PROPERTY",
  "scopeId": 2  // Bistupur property ID
}

// Response
{
  "success": true,
  "invite": {
    "id": 1,
    "email": "staff@podnbeyond.com",
    "roleKey": "STAFF_FRONTDESK",
    "expiresAt": "2025-11-09T...",
    "inviteUrl": "http://localhost:3000/admin/accept-invite?token=xxx"
  }
}
```

### **Checking Permissions (Frontend)**

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

### **Protecting API Route (Backend)**

```javascript
const { authorize } = require('../lib/rbac');

router.post('/api/admin/bookings', async (req, res) => {
  // Get user from session
  const user = req.user;
  
  // Check permission
  const authorized = await authorize(user, 'bookings:write:scoped', {
    scopeType: 'PROPERTY',
    scopeId: req.body.propertyId
  });
  
  if (!authorized) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  
  // Proceed with booking creation...
});
```

---

## 📁 **File Structure**

```
backend/
├── lib/
│   └── rbac.js                 # Authorization utility
├── routes/
│   ├── auth.js                 # /api/auth/me
│   ├── account.js              # /api/account/*
│   └── invites.js              # /api/admin/invites
├── prisma/
│   └── schema.prisma           # +User, Role, UserRole, Audit, etc.
└── seed_rbac.js                # Seed roles & superadmin

frontend/
├── pages/
│   ├── api/auth/[...nextauth].ts   # NextAuth config
│   ├── admin/
│   │   ├── login.tsx           # Magic link login
│   │   ├── logout.tsx          # Sign out
│   │   ├── forbidden.tsx       # Access denied
│   │   ├── verify-email.tsx    # Email sent confirmation
│   │   └── accept-invite.tsx   # Accept staff invitation
│   └── account.tsx             # Member area
└── middleware.ts               # Route protection
```

---

## 🧪 **Testing**

### **Route Protection Test**

```bash
# Unauthenticated access to /admin should redirect to login
curl -I http://localhost:3000/admin
# Expected: 307 Redirect to /admin/login

# Access with valid session
curl -H "Cookie: next-auth.session-token=xxx" http://localhost:3000/admin
# Expected: 200 OK
```

### **Scope Enforcement Test**

```bash
# Front desk staff at Property A tries to access Property B
POST /api/admin/bookings HTTP/1.1
Cookie: next-auth.session-token=xxx
Content-Type: application/json

{
  "propertyId": 2  // User scoped to Property 1
}

# Expected: 403 Forbidden
```

---

## 🚨 **Important Notes**

### **Email Configuration**

Magic links require working email. For Gmail:
1. Enable 2FA on your Google account
2. Generate an "App Password"
3. Use app password in `EMAIL_SERVER_PASSWORD`

**Or use a service like**:
- SendGrid
- Mailgun
- AWS SES

### **NEXTAUTH_SECRET**

Generate a secure secret:
```bash
openssl rand -base64 32
```

Must be **same in both** `backend/.env` and `frontend/.env.local`!

### **Production Checklist**

- [ ] Set `NODE_ENV=production`
- [ ] Use production database
- [ ] Use live Razorpay keys
- [ ] Configure production email SMTP
- [ ] Set proper `NEXTAUTH_URL` (your domain)
- [ ] Enable HTTPS
- [ ] Set secure cookie flags
- [ ] Review and enable MFA for admins

---

## 📚 **Additional Resources**

- **NextAuth Docs**: https://next-auth.js.org/
- **Prisma Adapter**: https://next-auth.js.org/adapters/prisma
- **RBAC Best Practices**: https://auth0.com/docs/manage-users/access-control/rbac

---

**Document Version**: 1.0  
**Last Updated**: November 2, 2025

