# 📋 Documentation Restructure Plan - STEP 1

**Status:** ⏸️ **PLAN ONLY - NO FILE CHANGES YET**  
**Date:** 2025-01-21  
**Awaiting:** Explicit confirmation before proceeding

---

## 1. Current Repository Structure (Confirmed)

```
podnbeyond.com/
├── backend/                    # Node.js/Express backend
│   ├── routes/                 # API route handlers
│   ├── services/               # Business logic services
│   ├── prisma/                 # Prisma schema & migrations
│   ├── lib/                    # Utility libraries (rbac.js, etc.)
│   ├── middleware/             # Express middleware
│   ├── modules/                # Feature modules (channelManager.js)
│   ├── scripts/                # Utility scripts
│   ├── CHANNEL_MANAGER.md      # Backend feature doc
│   ├── CRON_SERVICE.md         # Backend feature doc
│   └── LOYALTY_SYSTEM.md       # Backend feature doc (OUTDATED - see note)
├── frontend/                   # Next.js frontend
│   ├── pages/                  # Next.js pages
│   ├── components/              # React components
│   └── lib/                    # Frontend utilities
├── docs/                       # Documentation (80 .md files)
├── scripts/                    # Root-level scripts
└── README.md                   # Main project README
```

**Note:** `backend/LOYALTY_SYSTEM.md` appears outdated (references old schema with `guestName`, `email` fields directly on LoyaltyAccount, but current schema uses `userId` relation to User model). Will verify during Step 2.

---

## 2. Proposed Documentation Structure v1 (Adjusted)

```
docs/
├── README.md                          # Documentation overview & index
│
├── architecture/                      # System architecture documentation
│   ├── booking.md                    # Booking system architecture
│   ├── booking-state-machine.md      # State machine details
│   ├── communication-hub.md          # Communication Hub architecture
│   ├── rbac.md                       # RBAC system architecture
│   ├── loyalty.md                    # Loyalty system architecture
│   ├── database.md                   # Database schema overview
│   └── integrations.md               # Third-party integrations overview
│
├── specs/                            # Feature specifications & plans
│   ├── booking-redesign.md           # Booking redesign plan (with status)
│   └── communication-hub-v2.md      # Comm Hub redesign (archive candidate)
│
├── operations/                       # Operations & deployment guides
│   ├── deployment.md                 # Deployment guide (staging & production)
│   ├── local-dev.md                  # Local development setup
│   ├── environment-variables.md      # Environment variables reference
│   ├── seed-data.md                  # Seed data guide (consolidated)
│   ├── troubleshooting.md            # Troubleshooting guide (new)
│   └── staging-setup.md              # Staging environment setup
│
├── integrations/                     # Integration-specific guides
│   ├── payment-razorpay.md           # Razorpay payment integration
│   ├── email-postmark.md             # Postmark email integration
│   ├── whatsapp-gupshup.md           # Gupshup WhatsApp/SMS integration
│   └── redis.md                      # Redis setup & configuration
│
├── api/                              # API documentation (extracted from routes)
│   ├── booking-api.md                # Booking API endpoints
│   ├── conversations-api.md          # Conversations API endpoints
│   ├── loyalty-api.md                # Loyalty API endpoints
│   └── rbac-api.md                   # RBAC/auth API endpoints
│
├── meta/                             # Meta documentation
│   ├── backlog.md                    # Post-MVP enhancements
│   ├── design-system.md              # Design system documentation
│   └── changelog.md                  # Changelog (maintain or remove)
│
└── archive/                          # Archived/historical documentation
    ├── deployment-legacy/             # Old deployment docs
    ├── progress-tracking/            # Historical progress summaries
    ├── phase-completions/            # Phase completion summaries
    └── outdated/                     # Other outdated docs
```

**Adjustments Made:**
- Added `architecture/integrations.md` for overview (separate from specific integration guides)
- Added `operations/troubleshooting.md` (new, to be created)
- Kept `backend/*.md` files in place (CHANNEL_MANAGER.md, CRON_SERVICE.md) - these are feature docs close to code
- Created `api/` folder for extracted API documentation
- Added `archive/outdated/` for miscellaneous outdated docs

---

## 3. New Consolidated Documentation Files

### 3.1 Architecture Documentation

#### `docs/architecture/booking.md`
**Description:** Complete booking system architecture including current implementation status, models, APIs, services, and UI components.

**Consolidates:**
- `BOOKING_MODULE_ANALYSIS.md` (current state - authoritative)
- `BOOKING_LIFECYCLE.md` (state machine - authoritative)
- Relevant IMPLEMENTED parts from `BOOKING_MODULE_REDESIGN_PLAN.md` (Phases 1-2, partial Phase 3)

**Excludes:**
- Future plans from `BOOKING_MODULE_REDESIGN_PLAN.md` (moves to `specs/booking-redesign.md`)

---

#### `docs/architecture/booking-state-machine.md`
**Description:** Detailed booking lifecycle state machine with transitions, validation rules, and implementation details.

**Consolidates:**
- `BOOKING_LIFECYCLE.md` (complete content - this is authoritative and accurate)

**Note:** May merge into `booking.md` or keep separate for detailed reference.

---

#### `docs/architecture/communication-hub.md`
**Description:** Complete Communication Hub architecture including Thread model, unified conversations, workflow management, templates, analytics, and RBAC integration.

**Consolidates:**
- `COMMUNICATION_HUB_AGENT_CONTEXT.md` (canonical source - all 4 phases complete)

**Excludes:**
- `COMMUNICATION_HUB_STATUS.md` (duplicate)
- `COMMUNICATION_HUB_PHASED_PLAN_V2.md` (superseded)
- `COMMUNICATION_HUB_PHASED_PLAN.md` (original plan)
- `COMMUNICATION_HUB_REDESIGN.md` (vision doc - archive)

---

#### `docs/architecture/rbac.md`
**Description:** Complete RBAC system documentation including roles, permissions, scopes, authentication flow, and API endpoints.

**Consolidates:**
- `RBAC_SYSTEM.md` (main doc - authoritative)
- Useful quick reference parts from `RBAC_QUICK_START.md` (merge as "Quick Reference" section)

**Excludes:**
- `RBAC_COMPLETE_SUMMARY.md` (duplicate summary)
- `RBAC_IMPLEMENTATION_STATUS.md` (status doc - archive)
- `RBAC_TEST_RESULTS.md` (historical test results - archive)

---

#### `docs/architecture/loyalty.md`
**Description:** Loyalty system architecture including models, tier structure, earning rules, redemption, campaigns, referrals, and current implementation status.

**Consolidates:**
- `LOYALTY_TIER_STRUCTURE.md` (tier structure)
- `backend/LOYALTY_SYSTEM.md` (backend doc - verify accuracy first)
- Relevant parts from `LOYALTY_PROGRAM_REDESIGN_PLAN.md` (if implemented)
- Code analysis from `backend/routes/loyalty.js` and `backend/services/loyaltyService.js`

**Note:** Will verify against current Prisma schema and code before drafting.

---

#### `docs/architecture/database.md`
**Description:** Database schema overview including all models, relationships, indexes, and key design decisions.

**Consolidates:**
- Information extracted from `backend/prisma/schema.prisma`
- Model relationships and foreign keys
- Index information

**Note:** New document - will be created from schema analysis.

---

#### `docs/architecture/integrations.md`
**Description:** Overview of all third-party integrations (Postmark, Razorpay, Gupshup, Exotel, Redis) with links to detailed guides.

**Consolidates:**
- `THIRD_PARTY_INTEGRATIONS.md` (overview)

**Note:** High-level overview linking to specific integration guides.

---

### 3.2 Specifications

#### `docs/specs/booking-redesign.md`
**Description:** Booking module redesign plan with clear status indicators showing what's implemented vs planned.

**Consolidates:**
- `BOOKING_MODULE_REDESIGN_PLAN.md` (full plan with status updates)
- `BOOKING_MODULE_REDESIGN_SUMMARY.md` (executive summary - merge as intro)

**Updates:**
- Mark Phase 1-2 as ✅ Complete
- Mark Phase 3 as ⚠️ Partial (missing "Create Booking" UI)
- Mark Phase 4-6 as ❌ Not Started

---

#### `docs/specs/communication-hub-v2.md`
**Description:** Original Communication Hub redesign vision and phased plan (historical reference).

**Consolidates:**
- `COMMUNICATION_HUB_REDESIGN.md` (vision)
- `COMMUNICATION_HUB_PHASED_PLAN.md` (original plan)
- `COMMUNICATION_HUB_PHASED_PLAN_V2.md` (updated plan)

**Note:** Archive candidate - keep for historical reference only.

---

### 3.3 Operations Documentation

#### `docs/operations/deployment.md`
**Description:** Current deployment process for staging and production environments with step-by-step instructions.

**Consolidates:**
- `FRESH_CLEAN_DEPLOYMENT.md` (current process - authoritative)

**Excludes:**
- `DEPLOYMENT_GUIDE.md` (old automated deployment - archive)
- `DEPLOYMENT_STAGING_STEPS.md` (old staging steps - archive)
- `DEPLOYMENT_SUCCESS.md` (historical completion - archive)
- `DEPLOYMENT_STRATEGY.md` (old strategy - archive)
- `DEPLOYMENT_WARNINGS_ANALYSIS.md` (historical analysis - archive)
- `DEPLOYMENT_WORKFLOW_ANALYSIS.md` (historical analysis - archive)
- `DEPLOYMENT_BOOKING_MODULE.md` (completed deployment - archive)

---

#### `docs/operations/local-dev.md`
**Description:** Local development environment setup guide.

**Consolidates:**
- `LOCAL_DEV_GUIDE.md` (current guide)

---

#### `docs/operations/environment-variables.md`
**Description:** Complete environment variables reference for backend and frontend.

**Consolidates:**
- `ENVIRONMENT_VARIABLES.md` (current reference)

**Excludes:**
- `ENVIRONMENT_AUDIT.md` (historical audit - archive)

---

#### `docs/operations/seed-data.md`
**Description:** Complete guide to seed data scripts, usage, and strategies.

**Consolidates:**
- `SEED_PLAN_SUMMARY.md`
- `SEED_DATA_RULES.md`
- `SEED_DATA_ON_SERVER.md`
- `MASTER_SEED_STRATEGY.md`
- `MASTER_SEED_USAGE.md`
- `LOYALTY_SEED_STRATEGY.md`
- `LOYALTY_SEED_USAGE.md`
- `COMPREHENSIVE_SEED_DATA_PLAN.md`
- `backend/SEED_MASTER_README.md` (reference)
- `backend/SEED_CONVERSATIONS.md` (reference)

**Note:** Large consolidation - will organize by script type and usage.

---

#### `docs/operations/troubleshooting.md`
**Description:** Common issues and troubleshooting guide.

**Consolidates:**
- `ADMIN_LOGIN_FIX.md` (OTP route fix - merge as troubleshooting example)
- Common issues from various docs

**Note:** New document - will be created.

---

#### `docs/operations/staging-setup.md`
**Description:** Staging environment setup guide.

**Consolidates:**
- `STAGING_SETUP.md` (current guide)

---

### 3.4 Integration Documentation

#### `docs/integrations/payment-razorpay.md`
**Description:** Razorpay payment integration guide including setup, API usage, and webhook handling.

**Consolidates:**
- `PAYMENT_INTEGRATION.md` (current guide)

---

#### `docs/integrations/email-postmark.md`
**Description:** Postmark email integration guide including setup, templates, and inbound email handling.

**Consolidates:**
- `EMAIL_SYSTEM_COMPLETE.md` (current guide)

---

#### `docs/integrations/whatsapp-gupshup.md`
**Description:** Gupshup WhatsApp/SMS integration guide including setup and webhook configuration.

**Consolidates:**
- `GUPSHUP_SETUP.md` (current guide)

---

#### `docs/integrations/redis.md`
**Description:** Redis setup and configuration guide including BullMQ queue setup.

**Consolidates:**
- `REDIS_SETUP_GUIDE.md`
- `REDIS_SINGLE_SERVER_SETUP.md`
- `REDIS_ENABLEMENT_SUMMARY.md`
- `REDIS_BULLMQ_STATUS.md`

---

### 3.5 API Documentation

#### `docs/api/booking-api.md`
**Description:** Complete Booking API reference extracted from route files.

**Consolidates:**
- API documentation extracted from `backend/routes/booking.js`
- Request/response examples
- Authentication requirements
- RBAC permissions

**Note:** New document - will extract from code.

---

#### `docs/api/conversations-api.md`
**Description:** Complete Conversations API reference.

**Consolidates:**
- API documentation extracted from `backend/routes/conversations.js`
- Request/response examples
- RBAC permissions

**Note:** New document - will extract from code.

---

#### `docs/api/loyalty-api.md`
**Description:** Complete Loyalty API reference.

**Consolidates:**
- API documentation extracted from `backend/routes/loyalty.js`
- Request/response examples

**Note:** New document - will extract from code.

---

#### `docs/api/rbac-api.md`
**Description:** RBAC and Authentication API reference.

**Consolidates:**
- API documentation extracted from `backend/routes/auth.js`, `backend/routes/invites.js`, `backend/routes/users.js`
- Request/response examples

**Note:** New document - will extract from code.

---

### 3.6 Meta Documentation

#### `docs/meta/backlog.md`
**Description:** Post-MVP enhancements and future work items.

**Consolidates:**
- `BACKLOG.md` (authoritative - clean up completed items)

---

#### `docs/meta/design-system.md`
**Description:** Design system documentation including 9h-inspired principles and components.

**Consolidates:**
- `DESIGN_SYSTEM.md` (current guide)

---

#### `docs/meta/changelog.md`
**Description:** Project changelog (maintain or remove based on decision).

**Consolidates:**
- `CHANGELOG.md` (current - generic content, needs decision)

**Note:** Either maintain properly or remove if using GitHub Releases.

---

## 4. Files to Archive

### 4.1 Historical Progress Tracking (→ `archive/progress-tracking/`)

| Current Path | Archive Path | Status | Reason |
|-------------|--------------|--------|--------|
| `STEP_5_ACTION_MODALS_COMPLETE.md` | `archive/progress-tracking/` | Historical | Step 5 completion summary |
| `STEP_5_BOOKING_TS_RESTORED.md` | `archive/progress-tracking/` | Historical | Step 5 completion summary |
| `STEP_5_COMPLETE_SUMMARY.md` | `archive/progress-tracking/` | Historical | Step 5 completion summary |
| `STEP_5_COMPONENTS_COMPLETE.md` | `archive/progress-tracking/` | Historical | Step 5 completion summary |
| `STEP_5_GUEST_SELF_SERVICE_COMPLETE.md` | `archive/progress-tracking/` | Historical | Step 5 completion summary |
| `STEP_5_PAYMENT_MODALS_COMPLETE.md` | `archive/progress-tracking/` | Historical | Step 5 completion summary |
| `STEP_5_UI_IMPLEMENTATION_STARTED.md` | `archive/progress-tracking/` | Historical | Step 5 completion summary |
| `STEPS_1_3_COMPLETION.md` | `archive/progress-tracking/` | Historical | Steps 1-3 completion summary |
| `STEPS_1_4_COMPLETE_AND_STEP_5_PLAN.md` | `archive/progress-tracking/` | Historical | Steps 1-4 completion summary |
| `STEPS_1_4_COMPLETION.md` | `archive/progress-tracking/` | Historical | Steps 1-4 completion summary |
| `STEPS_1_5_PROGRESS_SUMMARY.md` | `archive/progress-tracking/` | Historical | Steps 1-5 progress summary |
| `NEXT_STEPS_RECOMMENDATION.md` | `archive/progress-tracking/` | Historical | Historical recommendations |

**Total:** 12 files

---

### 4.2 Phase Completion Summaries (→ `archive/phase-completions/`)

| Current Path | Archive Path | Status | Reason |
|-------------|--------------|--------|--------|
| `PHASE1_COMPLETION_SUMMARY.md` | `archive/phase-completions/` | Historical | Phase 1 completion summary |
| `PHASE2_COMPLETION_SUMMARY.md` | `archive/phase-completions/` | Historical | Phase 2 completion summary |
| `PHASE2_ROUTE_INTEGRATION.md` | `archive/phase-completions/` | Historical | Phase 2 route integration summary |
| `LOYALTY_PHASE2_COMPLETE.md` | `archive/phase-completions/` | Historical | Loyalty Phase 2 completion |
| `LOYALTY_PHASE3_COMPLETE.md` | `archive/phase-completions/` | Historical | Loyalty Phase 3 completion |
| `LOYALTY_PHASE4_COMPLETE.md` | `archive/phase-completions/` | Historical | Loyalty Phase 4 completion |
| `LOYALTY_PHASE5_COMPLETE.md` | `archive/phase-completions/` | Historical | Loyalty Phase 5 completion |
| `LOYALTY_PHASE6_COMPLETE.md` | `archive/phase-completions/` | Historical | Loyalty Phase 6 completion |
| `LOYALTY_PHASE7_COMPLETE.md` | `archive/phase-completions/` | Historical | Loyalty Phase 7 completion |

**Total:** 9 files

---

### 4.3 Old Deployment Documentation (→ `archive/deployment-legacy/`)

| Current Path | Archive Path | Status | Reason |
|-------------|--------------|--------|--------|
| `DEPLOYMENT_GUIDE.md` | `archive/deployment-legacy/` | Outdated | Old automated deployment guide |
| `DEPLOYMENT_STAGING_STEPS.md` | `archive/deployment-legacy/` | Outdated | Old staging deployment steps |
| `DEPLOYMENT_SUCCESS.md` | `archive/deployment-legacy/` | Historical | Historical deployment completion |
| `DEPLOYMENT_STRATEGY.md` | `archive/deployment-legacy/` | Outdated | Old deployment strategy |
| `DEPLOYMENT_WARNINGS_ANALYSIS.md` | `archive/deployment-legacy/` | Historical | Historical warnings analysis |
| `DEPLOYMENT_WORKFLOW_ANALYSIS.md` | `archive/deployment-legacy/` | Historical | Historical workflow analysis |
| `DEPLOYMENT_BOOKING_MODULE.md` | `archive/deployment-legacy/` | Historical | Booking module deployment (completed) |

**Total:** 7 files

---

### 4.4 Outdated/Historical Documentation (→ `archive/outdated/`)

| Current Path | Archive Path | Status | Reason |
|-------------|--------------|--------|--------|
| `COMMUNICATION_HUB_STATUS.md` | `archive/outdated/` | Duplicate | Duplicate of AGENT_CONTEXT.md |
| `COMMUNICATION_HUB_PHASED_PLAN_V2.md` | `archive/outdated/` | Superseded | Superseded by AGENT_CONTEXT.md |
| `COMMUNICATION_HUB_PHASED_PLAN.md` | `archive/outdated/` | Superseded | Original plan, superseded |
| `COMMUNICATION_HUB_REDESIGN.md` | `archive/outdated/` | Historical | Original vision document |
| `RBAC_COMPLETE_SUMMARY.md` | `archive/outdated/` | Duplicate | Duplicate summary of RBAC_SYSTEM.md |
| `RBAC_IMPLEMENTATION_STATUS.md` | `archive/outdated/` | Historical | Implementation status (completed) |
| `RBAC_TEST_RESULTS.md` | `archive/outdated/` | Historical | Historical test results |
| `BOOKING_MODULE_REDESIGN_SUMMARY.md` | `archive/outdated/` | Merged | Will be merged into specs/booking-redesign.md |
| `LOYALTY_PROGRAM_REDESIGN_PLAN.md` | `archive/outdated/` | Status Unknown | Need to verify implementation status |
| `LOYALTY_PROGRAM_REDESIGN_SUMMARY.md` | `archive/outdated/` | Status Unknown | Need to verify implementation status |
| `LOYALTY_PROGRAM_REDESIGN.md` | `archive/outdated/` | Status Unknown | Need to verify implementation status |
| `LOYALTY_BOOKING_INTEGRATION.md` | `archive/outdated/` | Status Unknown | Need to verify implementation status |
| `LOYALTY_MIGRATION_FIX.md` | `archive/outdated/` | Historical | Migration fix (completed) |
| `ENVIRONMENT_AUDIT.md` | `archive/outdated/` | Historical | Historical environment audit |
| `DEMO_DAY_SUMMARY.md` | `archive/outdated/` | Historical | Historical demo day summary |
| `SECURITY_VULNERABILITIES_ANALYSIS.md` | `archive/outdated/` | Historical | Historical security analysis |
| `REQUIREMENTS.md` | `archive/outdated/` | Possibly Outdated | Original requirements (may be outdated) |
| `QUICK_INFO_NEEDED.md` | `archive/outdated/` | Possibly Outdated | Quick reference (may be outdated) |
| `PRODUCTION_READINESS_CHECKLIST.md` | **KEEP** | Active | Launch checklist - keep in root or move to operations |

**Total:** 18 files to archive, 1 to keep/review

---

## 5. Files to Keep in Root `/docs/`

| File | Reason |
|------|--------|
| `DOCUMENTATION_AUDIT_REPORT.md` | Audit report - keep for reference |
| `DOCUMENTATION_RESTRUCTURE_PLAN.md` | This plan - keep for reference |
| `DOCUMENTATION_INDEX.md` | Will be updated to reflect new structure |
| `PRODUCTION_READINESS_CHECKLIST.md` | Active checklist - may move to operations |

---

## 6. Summary Statistics

- **New consolidated docs to create:** ~20 files
- **Files to archive:** ~46 files
- **Files to keep/update:** ~4 files
- **Total files in current `/docs/`:** ~80 files
- **Estimated reduction:** ~46 files archived, ~20 new consolidated docs = net reduction in active docs

---

## 7. Verification Needed Before Step 2

1. ✅ **Booking system** - Documentation matches code (verified)
2. ✅ **Communication Hub** - Documentation matches code (verified)
3. ✅ **RBAC** - Documentation matches code (verified)
4. ⚠️ **Loyalty system** - Need to verify `backend/LOYALTY_SYSTEM.md` matches current schema
5. ⚠️ **Seed data** - Need to review all seed scripts to understand current usage
6. ⚠️ **API documentation** - Need to extract from route files

---

## 8. Next Steps (After Approval)

1. **Step 2:** Draft full content for 10 key consolidated docs in chat
2. **Step 3:** After review, apply changes to filesystem
3. **Update:** `.cursorrules`, `DOCUMENTATION_INDEX.md`, `README.md` with new paths

---

**Status:** ⏸️ **AWAITING CONFIRMATION**

Please review this plan and confirm:
1. ✅ Folder structure looks good
2. ✅ Consolidation plan makes sense
3. ✅ Archive decisions are appropriate
4. ✅ Any adjustments needed before proceeding to Step 2

Once confirmed, I will proceed to **Step 2** (drafting content in chat only, no file changes).

