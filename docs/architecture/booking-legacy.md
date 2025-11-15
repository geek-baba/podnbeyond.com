# Booking Lifecycle & State Transitions

## Booking States

### State Definitions

```
HOLD          → Booking created, inventory held temporarily (15 minutes default)
PENDING       → Booking created, awaiting payment/confirmation
CONFIRMED     → Booking confirmed, payment received/authorized
CHECKED_IN    → Guest checked in, room assigned
CHECKED_OUT   → Guest checked out, stay completed
CANCELLED     → Booking cancelled, inventory released
NO_SHOW       → Guest didn't show up, no-show fee charged
REJECTED      → Booking rejected (e.g., OTA overbooking, invalid details)
COMPLETED     → Stay completed, all charges settled
FAILED        → Booking creation/payment failed
```

## State Transition Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      BOOKING LIFECYCLE                          │
└─────────────────────────────────────────────────────────────────┘

                                    ┌─────────┐
                                    │   NEW   │
                                    └────┬────┘
                                         │
                                         │ Create Booking
                                         │
                    ┌────────────────────┴────────────────────┐
                    │                                          │
                    ▼                                          ▼
            ┌──────────────┐                          ┌──────────────┐
            │    HOLD      │                          │   PENDING    │
            │ (15 min TTL) │                          │              │
            └──────┬───────┘                          └──────┬───────┘
                   │                                          │
                   │ Payment Success                          │ Payment Success
                   │ Manual Confirm                           │ Manual Confirm
                   │                                          │
                   └──────────────┬───────────────────────────┘
                                  │
                                  ▼
                          ┌──────────────┐
                          │  CONFIRMED   │
                          └──────┬───────┘
                                 │
                                 │ Check-In
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         │
            ┌──────────────┐                 │
            │ CHECKED_IN   │                 │
            └──────┬───────┘                 │
                   │                         │
                   │ Check-Out               │ No-Show
                   │                         │
                   └────────────┬────────────┘
                                │
                                ▼
                        ┌──────────────┐
                        │ CHECKED_OUT  │
                        └──────┬───────┘
                               │
                               │ All Charges Settled
                               │
                               ▼
                        ┌──────────────┐
                        │  COMPLETED   │
                        └──────────────┘

         ┌──────────────────────────────────────┐
         │         CANCELLATION PATH            │
         └──────────────────────────────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                      │
         ▼                      ▼                      ▼
    ┌─────────┐          ┌─────────┐          ┌─────────┐
    │ HOLD    │          │ PENDING │          │CONFIRMED│
    └────┬────┘          └────┬────┘          └────┬────┘
         │                    │                    │
         │ Cancel             │ Cancel             │ Cancel
         │                    │                    │
         └────────────────────┴────────────────────┘
                              │
                              ▼
                       ┌──────────────┐
                       │  CANCELLED   │
                       └──────────────┘

         ┌──────────────────────────────────────┐
         │         REJECTION PATH               │
         └──────────────────────────────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                      │
         ▼                      ▼                      ▼
    ┌─────────┐          ┌─────────┐          ┌─────────┐
    │ HOLD    │          │ PENDING │          │CONFIRMED│
    └────┬────┘          └────┬────┘          └────┬────┘
         │                    │                    │
         │ Reject             │ Reject             │ Reject
         │                    │                    │
         └────────────────────┴────────────────────┘
                              │
                              ▼
                       ┌──────────────┐
                       │  REJECTED    │
                       └──────────────┘

         ┌──────────────────────────────────────┐
         │         NO-SHOW PATH                 │
         └──────────────────────────────────────┘
                                │
                       ┌──────────────┐
                       │  CONFIRMED   │
                       └──────┬───────┘
                              │
                              │ After Check-In Time
                              │ Guest Doesn't Arrive
                              │
                              ▼
                       ┌──────────────┐
                       │   NO_SHOW    │
                       └──────────────┘
```

## State Transitions

### Valid Transitions

| From State | To State | Trigger | Notes |
|------------|----------|---------|-------|
| NEW | HOLD | Create booking with hold | 15-minute TTL |
| NEW | PENDING | Create booking without hold | Awaiting payment |
| HOLD | CONFIRMED | Payment success | Within TTL |
| HOLD | CANCELLED | Cancel booking | Release inventory |
| HOLD | REJECTED | Reject booking | Release inventory |
| HOLD | FAILED | Payment failure | Release inventory |
| PENDING | CONFIRMED | Payment success | Manual confirm |
| PENDING | CANCELLED | Cancel booking | Release inventory |
| PENDING | REJECTED | Reject booking | Release inventory |
| PENDING | FAILED | Payment failure | Release inventory |
| CONFIRMED | CHECKED_IN | Check-in | Assign room |
| CONFIRMED | CANCELLED | Cancel booking | Apply cancellation fee |
| CONFIRMED | NO_SHOW | Mark no-show | After check-in time |
| CONFIRMED | REJECTED | Reject booking | Rare case |
| CHECKED_IN | CHECKED_OUT | Check-out | Finalize charges |
| CHECKED_OUT | COMPLETED | All charges settled | End of lifecycle |
| CANCELLED | - | - | Terminal state |
| NO_SHOW | - | - | Terminal state |
| REJECTED | - | - | Terminal state |
| COMPLETED | - | - | Terminal state |
| FAILED | - | - | Terminal state |

### Invalid Transitions

- ❌ CHECKED_IN → PENDING (Cannot revert to pending)
- ❌ CHECKED_OUT → CHECKED_IN (Cannot revert to checked-in)
- ❌ COMPLETED → Any state (Terminal state)
- ❌ CANCELLED → Any state (Terminal state)
- ❌ NO_SHOW → Any state (Terminal state)
- ❌ REJECTED → Any state (Terminal state)
- ❌ FAILED → Any state (Terminal state)

## State Transition Rules

### 1. HOLD → CONFIRMED
**Conditions**:
- Payment successful OR manual confirmation
- Hold token valid (not expired)
- Inventory available

**Actions**:
- Update booking status to CONFIRMED
- Convert inventory holds to bookings
- Create payment record
- Generate confirmation number
- Send confirmation email
- Create audit log entry

### 2. PENDING → CONFIRMED
**Conditions**:
- Payment successful OR manual confirmation
- Inventory available

**Actions**:
- Update booking status to CONFIRMED
- Lock inventory
- Create payment record
- Generate confirmation number
- Send confirmation email
- Create audit log entry

### 3. CONFIRMED → CHECKED_IN
**Conditions**:
- Booking is CONFIRMED
- Check-in date has arrived
- Room available for assignment
- RBAC permission: STAFF_FRONTDESK, MANAGER, ADMIN

**Actions**:
- Update booking status to CHECKED_IN
- Assign room(s)
- Update stay status to CHECKED_IN
- Create room assignment record
- Send check-in confirmation
- Create audit log entry

### 4. CHECKED_IN → CHECKED_OUT
**Conditions**:
- Booking is CHECKED_IN
- Check-out date has arrived
- All charges finalized
- RBAC permission: STAFF_FRONTDESK, MANAGER, ADMIN

**Actions**:
- Update booking status to CHECKED_OUT
- Update stay status to CHECKED_OUT
- Finalize all charges
- Generate invoice
- Release room assignment
- Send check-out confirmation
- Create audit log entry

### 5. CONFIRMED → CANCELLED
**Conditions**:
- Booking is CONFIRMED
- Cancellation allowed by policy
- RBAC permission: MANAGER, ADMIN (or guest self-service)

**Actions**:
- Calculate cancellation fee
- Process refund (if applicable)
- Update booking status to CANCELLED
- Release inventory
- Send cancellation confirmation
- Create audit log entry

### 6. CONFIRMED → NO_SHOW
**Conditions**:
- Booking is CONFIRMED
- Check-in time has passed
- Guest hasn't checked in
- RBAC permission: STAFF_FRONTDESK, MANAGER, ADMIN

**Actions**:
- Update booking status to NO_SHOW
- Charge no-show fee (if applicable)
- Release inventory
- Send no-show notification
- Create audit log entry

### 7. Any State → REJECTED
**Conditions**:
- Booking is in HOLD, PENDING, or CONFIRMED
- Rejection reason valid (OTA overbooking, invalid details)
- RBAC permission: MANAGER, ADMIN

**Actions**:
- Update booking status to REJECTED
- Release inventory
- Send rejection notification
- Create audit log entry

## State-Based Permissions

### Staff Permissions by State

| State | Staff Actions Allowed |
|-------|---------------------|
| HOLD | Confirm, Cancel, Reject |
| PENDING | Confirm, Cancel, Reject |
| CONFIRMED | Check-in, Cancel, Mark No-Show, Reject, Modify |
| CHECKED_IN | Check-out, Modify |
| CHECKED_OUT | View, Generate Invoice |
| CANCELLED | View, Process Refund |
| NO_SHOW | View, Process Refund |
| REJECTED | View |
| COMPLETED | View, Generate Invoice |
| FAILED | View, Retry |

### Guest Permissions by State

| State | Guest Actions Allowed |
|-------|---------------------|
| HOLD | View, Cancel (if within policy) |
| PENDING | View, Cancel (if within policy) |
| CONFIRMED | View, Modify (if within policy), Cancel (if within policy) |
| CHECKED_IN | View |
| CHECKED_OUT | View, Request Invoice |
| CANCELLED | View |
| NO_SHOW | View |
| REJECTED | View |
| COMPLETED | View, Request Invoice |
| FAILED | View, Retry |

## State Validation

### Pre-Transition Validation

Before allowing a state transition, validate:

1. **Current State**: Booking must be in a valid source state
2. **Target State**: Target state must be reachable from current state
3. **Permissions**: User must have required RBAC permissions
4. **Business Rules**: Business rules must be satisfied (e.g., cancellation policy)
5. **Inventory**: Inventory must be available (for confirm/check-in)
6. **Payment**: Payment must be completed (for confirm)
7. **Time Constraints**: Time-based constraints must be met (e.g., check-in time)

### Post-Transition Actions

After state transition, execute:

1. **Status Update**: Update booking status
2. **Inventory Update**: Update inventory (lock/release)
3. **Payment Processing**: Process payment/refund if needed
4. **Notification**: Send notification to guest/staff
5. **Audit Log**: Create audit log entry
6. **Workflow Trigger**: Trigger automated workflows if applicable

## State Machine Implementation

### Service Layer

```javascript
// backend/services/bookingService.js

class BookingStateMachine {
  // Valid transitions
  static TRANSITIONS = {
    HOLD: ['CONFIRMED', 'CANCELLED', 'REJECTED', 'FAILED'],
    PENDING: ['CONFIRMED', 'CANCELLED', 'REJECTED', 'FAILED'],
    CONFIRMED: ['CHECKED_IN', 'CANCELLED', 'NO_SHOW', 'REJECTED'],
    CHECKED_IN: ['CHECKED_OUT'],
    CHECKED_OUT: ['COMPLETED'],
    // Terminal states
    CANCELLED: [],
    NO_SHOW: [],
    REJECTED: [],
    COMPLETED: [],
    FAILED: [],
  };

  // Check if transition is valid
  static canTransition(fromState, toState) {
    return this.TRANSITIONS[fromState]?.includes(toState) || false;
  }

  // Validate transition with business rules
  static async validateTransition(booking, toState, user, context) {
    // Check state transition validity
    if (!this.canTransition(booking.status, toState)) {
      throw new Error(`Invalid transition: ${booking.status} → ${toState}`);
    }

    // Check RBAC permissions
    const hasPermission = await this.checkPermission(booking, toState, user);
    if (!hasPermission) {
      throw new Error('Insufficient permissions for this transition');
    }

    // Check business rules
    await this.validateBusinessRules(booking, toState, context);

    return true;
  }

  // Execute state transition
  static async transition(booking, toState, user, context) {
    // Validate transition
    await this.validateTransition(booking, toState, user, context);

    // Execute transition
    const updatedBooking = await this.executeTransition(booking, toState, user, context);

    // Post-transition actions
    await this.postTransitionActions(updatedBooking, toState, user, context);

    return updatedBooking;
  }
}
```

## Booking Lifecycle Events

### Event Triggers

| Event | Trigger | Actions |
|-------|---------|---------|
| Booking Created | New booking created | Send confirmation email, Create audit log |
| Booking Confirmed | Status → CONFIRMED | Send confirmation email, Lock inventory, Generate confirmation number |
| Booking Checked In | Status → CHECKED_IN | Send check-in confirmation, Assign room, Create audit log |
| Booking Checked Out | Status → CHECKED_OUT | Send check-out confirmation, Generate invoice, Release room |
| Booking Cancelled | Status → CANCELLED | Send cancellation email, Process refund, Release inventory |
| Booking No-Show | Status → NO_SHOW | Send no-show notification, Charge no-show fee, Release inventory |
| Booking Rejected | Status → REJECTED | Send rejection notification, Release inventory |
| Pre-Arrival Reminder | 24-48 hours before check-in | Send pre-arrival email/SMS |
| Post-Stay Feedback | After check-out | Send feedback request email |

## Best Practices

### 1. State Management
- Always validate state transitions before executing
- Use transactions for state transitions
- Create audit log entries for all state changes
- Handle concurrent state transitions (optimistic locking)

### 2. Error Handling
- Provide clear error messages for invalid transitions
- Handle edge cases (e.g., expired holds, inventory conflicts)
- Implement retry logic for failed transitions
- Log all transition failures

### 3. Performance
- Index booking status fields for fast queries
- Cache state transition rules
- Use database transactions for consistency
- Optimize inventory queries

### 4. Security
- Validate RBAC permissions for all transitions
- Sanitize user input
- Prevent unauthorized state transitions
- Audit all state changes

## Conclusion

Understanding the booking lifecycle and state transitions is crucial for implementing a robust booking management system. This document provides a comprehensive guide to booking states, transitions, and implementation best practices.

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-XX  
**Related Documents**: 
- `BOOKING_MODULE_REDESIGN_PLAN.md` (Detailed implementation plan)
- `BOOKING_MODULE_REDESIGN_SUMMARY.md` (Executive summary)
- `RBAC_SYSTEM.md` (RBAC documentation)

