# Documentation Index

**Last Updated:** 2025-01-21

This is the main documentation index for the POD N BEYOND project. All documentation is organized by category for easy navigation.

---

## 🚀 Quick Start

- **[Deployment Guide](operations/deployment.md)** - Deploy to staging and production
- **[Production Readiness Checklist](operations/production-readiness.md)** - Pre-launch checklist
- **[Environment Variables](operations/environment-variables.md)** - Complete environment reference

---

## 📚 Documentation Structure

```
docs/
├── README.md                    # This file (main index)
│
├── architecture/                # System architecture documentation
│   ├── booking.md              # Booking lifecycle and API
│   ├── communication-hub.md    # Unified conversation management
│   ├── rbac.md                 # Role-based access control
│   └── loyalty.md              # Loyalty program and points
│
├── operations/                  # Deployment and operations guides
│   ├── deployment.md           # Staging and production deployment
│   ├── production-readiness.md # Launch checklist
│   ├── seed-data.md            # Seed data scripts and usage
│   ├── environment-variables.md # Environment variables reference
│   ├── local-dev.md            # Local development setup
│   ├── staging-setup.md        # Staging environment setup
│   └── troubleshooting.md     # Common issues and fixes
│
├── integrations/                # Third-party integrations
│   ├── payment-razorpay.md     # Razorpay payment integration
│   ├── email-postmark.md       # Postmark email system
│   ├── whatsapp-gupshup.md     # Gupshup WhatsApp/SMS
│   └── redis.md                 # Redis setup and BullMQ
│
├── specs/                       # Historical redesign plans (implemented)
│   ├── booking-redesign.md     # Historical booking redesign plan
│   ├── loyalty-redesign.md     # Historical loyalty redesign plan
│   └── communication-hub-v2.md # Historical Communication Hub redesign plan
│
├── meta/                        # Project metadata
│   ├── backlog.md              # Post-MVP enhancements
│   ├── design-system.md        # Design system documentation
│   └── changelog.md            # Project changelog
│
└── archive/                     # Historical and outdated docs
    ├── progress-tracking/       # Historical progress summaries
    ├── phase-completions/       # Phase completion summaries
    ├── deployment-legacy/      # Old deployment guides
    └── outdated/                # Superseded documentation
```

---

## 🏗️ Architecture Documentation

### Core Systems

- **[Booking Architecture](architecture/booking.md)** - Complete booking lifecycle, state machine, API endpoints, and frontend components
- **[Communication Hub Architecture](architecture/communication-hub.md)** - Unified conversation management across Email, WhatsApp, SMS, and Voice
- **[RBAC Architecture](architecture/rbac.md)** - Role-based access control, authentication, and permissions
- **[Loyalty Architecture](architecture/loyalty.md)** - Multi-tier loyalty program, points calculation, and tier progression

---

## 🔧 Operations Documentation

### Deployment

- **[Deployment Guide](operations/deployment.md)** ⭐ **USE THIS** - Current manual deployment process for staging and production
- **[Production Readiness Checklist](operations/production-readiness.md)** - Complete pre-launch checklist
- **[Staging Setup](operations/staging-setup.md)** - Staging environment setup guide
- **[Local Development](operations/local-dev.md)** - Local development environment setup

### Configuration

- **[Environment Variables](operations/environment-variables.md)** - Complete environment variables reference
- **[Seed Data Guide](operations/seed-data.md)** - Master seed script usage and data generation
- **[Troubleshooting](operations/troubleshooting.md)** - Common issues and solutions

---

## 🔌 Integration Documentation

- **[Payment - Razorpay](integrations/payment-razorpay.md)** ⚠️ **Partial Implementation** - Payment integration (client-side only, security gaps noted)
- **[Email - Postmark](integrations/email-postmark.md)** ✅ **Fully Functional** - Transactional email system with BullMQ queue
- **[WhatsApp/SMS - Gupshup](integrations/whatsapp-gupshup.md)** ✅ **Configured** - WhatsApp and SMS messaging integration
- **[Redis](integrations/redis.md)** - Redis setup and BullMQ queue configuration

---

## 📋 Planning & Specifications

### Future Enhancements

- **[Backlog](meta/backlog.md)** ⭐ **USE THIS** - Post-MVP enhancements and GitHub Actions CI/CD setup

### Historical Redesign Plans (Implemented)

- **[Booking Redesign](specs/booking-redesign.md)** - Historical redesign plan (led to current implementation in `architecture/booking.md`)
- **[Loyalty Redesign](specs/loyalty-redesign.md)** - Historical redesign plan (led to current implementation in `architecture/loyalty.md` - includes perks, campaigns, redemption catalog, points rules engine)
- **[Communication Hub V2](specs/communication-hub-v2.md)** - Historical redesign plan (led to current implementation in `architecture/communication-hub.md`)

---

## 🎯 Quick Reference

### I want to...

**Deploy to staging:**
→ See [Deployment Guide](operations/deployment.md)

**Deploy to production:**
→ See [Deployment Guide](operations/deployment.md)

**Set up environment variables:**
→ See [Environment Variables](operations/environment-variables.md)

**Understand the booking system:**
→ See [Booking Architecture](architecture/booking.md)

**Understand RBAC:**
→ See [RBAC Architecture](architecture/rbac.md)

**Understand the Communication Hub:**
→ See [Communication Hub Architecture](architecture/communication-hub.md)

**Understand the loyalty program:**
→ See [Loyalty Architecture](architecture/loyalty.md)

**Check what's next:**
→ See [Backlog](meta/backlog.md)

**Understand email system:**
→ See [Email Integration](integrations/email-postmark.md)

**Understand payment integration:**
→ See [Payment Integration](integrations/payment-razorpay.md)

**Understand WhatsApp integration:**
→ See [WhatsApp Integration](integrations/whatsapp-gupshup.md)

**Seed test data:**
→ See [Seed Data Guide](operations/seed-data.md)

**Check production readiness:**
→ See [Production Readiness Checklist](operations/production-readiness.md)

---

## 📖 Documentation Status

### ✅ Authoritative (Current Implementation)

These documents reflect the current state of the codebase:

- `architecture/booking.md` - Booking system (fully implemented)
- `architecture/communication-hub.md` - Communication Hub (all 4 phases complete)
- `architecture/rbac.md` - RBAC system (production-ready)
- `architecture/loyalty.md` - Loyalty program (fully implemented - includes perks, campaigns, redemption catalog, points rules engine)
- `operations/deployment.md` - Current deployment process
- `operations/seed-data.md` - Seed data scripts
- `integrations/payment-razorpay.md` - Payment integration (partial, gaps noted)
- `integrations/email-postmark.md` - Email system (fully functional)
- `integrations/whatsapp-gupshup.md` - WhatsApp/SMS integration
- `meta/backlog.md` - Post-MVP enhancements

### 📋 Specifications (Historical Reference)

These documents are historical redesign plans that led to the current implementation:

- `specs/booking-redesign.md` - Historical redesign plan (led to current implementation in `architecture/booking.md`)
- `specs/loyalty-redesign.md` - Historical redesign plan (led to current implementation in `architecture/loyalty.md` - includes perks, campaigns, redemption catalog, points rules engine)
- `specs/communication-hub-v2.md` - Historical redesign plan (led to current implementation in `architecture/communication-hub.md`)

### 📦 Archive (Historical Reference)

Historical and outdated documentation is archived in `archive/`:

- `archive/progress-tracking/` - Historical progress summaries
- `archive/phase-completions/` - Phase completion summaries
- `archive/deployment-legacy/` - Old deployment guides
- `archive/outdated/` - Superseded documentation

---

## ⚠️ Important Notes

- **⭐ Marked docs** are the primary references for current processes
- **Architecture docs** (`architecture/*`) describe current implementation
- **Specs docs** (`specs/*`) are historical redesign plans that led to current implementation
- **Archive docs** (`archive/*`) are kept for historical reference only
- All documentation is version controlled in Git

---

## 🔗 Related Resources

- **Code Locations:** See individual architecture docs for code references
- **Database Schema:** `backend/prisma/schema.prisma`
- **Environment Examples:** `backend/env.example`, `frontend/env.local.example`

---

**For questions or updates to this index, please update this file directly.**

