# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Documentation restructure and consolidation (January 2025)
- Master development agent prompt (`docs/prompt.md`)
- Updated backlog with implementation status for GitHub Actions CI/CD and Redis Email Queue

### Changed
- Updated documentation to reflect all redesigns (Booking, Communication Hub, Loyalty) as fully implemented
- Fixed branch references in backlog (use `production` instead of `prod`)

### Fixed
- Documentation inconsistencies across architecture docs
- Backlog status for implemented features

---

## [1.0.0] - 2025-01-21

### Added

#### Core Features
- **Booking Module** - Complete booking lifecycle management
  - State machine with 9 states (HOLD, PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED, NO_SHOW, REJECTED, COMPLETED, FAILED)
  - Support for multiple booking sources (WEB_DIRECT, OTA_BOOKING_COM, OTA_MMT, OTA_EASEMYTRIP, OTA_CLEARTRIP, WALK_IN, PHONE, CORPORATE, OTHER)
  - Booking calendar view
  - Create Booking UI for staff
  - Booking-specific navigation
  - Hold release job with Redis/BullMQ integration
  - Payment integration (partial - client-side Razorpay)

- **Communication Hub** - Unified conversation management
  - Email, WhatsApp, SMS, and Voice conversation support
  - Thread linking and auto-assignment
  - SLA tracking and priority management
  - Real-time updates via Server-Sent Events (SSE)
  - Message templates and analytics
  - Staff assignment dropdown
  - Admin Email Center UI

- **Loyalty Program** - Multi-tier loyalty system
  - 5-tier structure (MEMBER, SILVER, GOLD, PLATINUM, DIAMOND)
  - Points earning and tracking
  - Tier progression based on stays, nights, and spend
  - Points Rules Engine for flexible earning rules
  - Perk System with redemption tracking
  - Campaign management
  - Redemption Catalog with dynamic pricing
  - Automatic account creation on booking
  - Points ledger with transaction history
  - Tier history tracking

- **RBAC System** - Role-based access control
  - 7 role types (GUEST, MEMBER, STAFF_FRONTDESK, STAFF_OPS, MANAGER, ADMIN, SUPERADMIN)
  - Permission system with `resource:action:scope` format
  - Scope types (ORG, BRAND, PROPERTY)
  - Magic link authentication via NextAuth.js
  - Invite system for staff onboarding
  - Session management

#### Infrastructure & Operations
- **GitHub Actions CI/CD**
  - Auto-deploy to staging on `main` branch push
  - Auto-deploy to production on `production` branch push
  - Health checks after deployment
  - Smart restart logic (only restarts when code/dependencies change)
  - Migration handling with recovery logic
  - Comprehensive error handling and logging

- **Redis Email Queue**
  - BullMQ integration for asynchronous email processing
  - Queue worker with concurrency control (5 concurrent emails)
  - Retry logic (3 attempts with exponential backoff)
  - Job cleanup (completed jobs removed after 24h, failed jobs after 7 days)
  - Queue statistics endpoint
  - Environment-specific queue prefixes (staging/prod separation)
  - Fallback to synchronous sending if Redis unavailable

- **Seed Scripts**
  - Comprehensive master seed script for 3 years of hotel operations
  - Staff, loyalty users, bookings, and communication hub data generation
  - Realistic data distributions and relationships
  - Seed script for loyalty program testing

#### Integrations
- **Email (Postmark)**
  - Transactional email system
  - Inbound email processing
  - Event tracking (bounces, opens, clicks)
  - Suppression list management
  - Admin Email Center UI

- **WhatsApp/SMS (Gupshup)**
  - WhatsApp messaging integration
  - SMS messaging support
  - Webhook handlers for message delivery
  - Message logging and thread linking

- **Payment (Razorpay)** - Partial Implementation
  - Client-side payment integration
  - Payment recording in backend
  - Refund support (partial)
  - Card charging on file (partial)

#### Documentation
- Complete architecture documentation
  - `docs/architecture/booking.md` - Booking lifecycle and API
  - `docs/architecture/communication-hub.md` - Communication Hub architecture
  - `docs/architecture/rbac.md` - RBAC system documentation
  - `docs/architecture/loyalty.md` - Loyalty program documentation
- Operations documentation
  - `docs/operations/deployment.md` - Deployment guide
  - `docs/operations/production-readiness.md` - Production checklist
  - `docs/operations/seed-data.md` - Seed data guide
  - `docs/operations/environment-variables.md` - Environment variables reference
- Integration documentation
  - `docs/integrations/payment-razorpay.md` - Payment integration
  - `docs/integrations/email-postmark.md` - Email system
  - `docs/integrations/whatsapp-gupshup.md` - WhatsApp/SMS integration
- Main documentation index (`docs/README.md`)
- Backlog and future enhancements (`docs/meta/backlog.md`)

### Changed
- Migrated from manual deployment to automated CI/CD
- Email system upgraded to use Redis queue for better performance
- Documentation structure reorganized for better maintainability

### Fixed
- Migration recovery logic for failed PostgreSQL migrations
- Git divergence issues in production deployment
- Staff assignment in Communication Hub
- Loyalty account creation and points tracking
- Booking state transitions
- RBAC permission checks
- Seed script data generation issues
- TypeScript errors in frontend components
- Conversation details API null reference errors
- Enum migration issues in PostgreSQL

### Security
- Added authentication to all API routes
- RBAC enforcement across all endpoints
- Secure session management with NextAuth.js

---

## [0.9.0] - 2024-12-XX

### Added
- Initial Communication Hub implementation
- Basic RBAC system
- Loyalty program foundation

### Changed
- Database schema updates for multi-property support

---

## [0.8.0] - 2024-11-XX

### Added
- Booking module Phase 1 implementation
- Basic payment integration
- Email system integration

---

## [0.1.0] - 2024-XX-XX

### Added
- Initial project setup
- Basic hotel management system structure
- Database schema foundation

---

**Note:** This changelog tracks major features and changes. For detailed commit history, see the git log.

[Unreleased]: https://github.com/geek-baba/podnbeyond.com/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/geek-baba/podnbeyond.com/releases/tag/v1.0.0
