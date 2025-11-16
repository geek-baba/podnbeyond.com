# PHASE 2 UI/UX Cleanup Plan - Tables & Badges Standardization

**Date:** 2025-01-21  
**Phase:** PHASE 2 - Tables & Badges Only  
**Scope:** Standardize admin Tables + Badges across booking and loyalty pages

---

## STEP 1 — ANALYSIS

### Files Scanned

#### Booking Tables
1. ✅ `frontend/pages/admin/bookings/index.tsx` - Uses `BookingList` component
2. ✅ `frontend/pages/admin/bookings/[id].tsx` - No table, only detail view with badges
3. ✅ `frontend/components/booking/BookingList.tsx` - Contains main booking table

#### Loyalty & Guests Tables
4. ✅ `frontend/pages/admin/loyalty/index.tsx` - Contains loyalty members table
5. ❌ `frontend/pages/admin/guests/index.tsx` - **DOES NOT EXIST**

#### Property/Room Management Tables
6. ❌ `frontend/pages/admin/properties/index.tsx` - **DOES NOT EXIST**
7. ❌ `frontend/pages/admin/rooms/index.tsx` - **DOES NOT EXIST**

#### Shared UI Components
8. ✅ `frontend/components/ui/Badge.tsx` - **EXISTS** but needs enhancement
9. ❌ `frontend/components/ui/Table.tsx` - **DOES NOT EXIST** (needs to be created)

---

## Table Implementation Analysis

### 1. BookingList Component (`frontend/components/booking/BookingList.tsx`)

**Current State:**
- ✅ Uses raw `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>` markup
- ✅ Already uses `neutral-*` colors (updated in Phase 1)
- ✅ Uses `bg-neutral-100` for header
- ✅ Uses `divide-neutral-200` for borders
- ✅ Uses `hover:bg-neutral-50` for row hover
- ⚠️ Inconsistent spacing: `px-6 py-3` for headers, `px-6 py-4` for cells
- ⚠️ No shared Table component

**Table Structure:**
```
<table className="min-w-full divide-y divide-neutral-200">
  <thead className="bg-neutral-100">
    <tr>
      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
        Confirmation #
      </th>
      <!-- 8 more columns -->
    </tr>
  </thead>
  <tbody className="bg-white divide-y divide-neutral-200">
    <tr className="hover:bg-neutral-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <!-- Content -->
      </td>
      <!-- 8 more columns -->
    </tr>
  </tbody>
</table>
```

**Columns:** 9 columns (Confirmation #, Guest, Property, Dates, Status, Source, Total, Balance, Actions)

**Badge Usage:**
- Status badges: Raw `<span>` with `getStatusColor()` function
- Source badges: Raw `<span>` with `getSourceColor()` function
- Both use `inline-flex px-2 py-1 text-xs font-semibold rounded-full` + color classes

---

### 2. Loyalty Members Table (`frontend/pages/admin/loyalty/index.tsx`)

**Current State:**
- ❌ Uses raw `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>` markup
- ❌ Uses `gray-*` colors instead of `neutral-*` (needs updating)
- ❌ Uses `bg-gray-50` for header (should be `bg-neutral-100`)
- ❌ Uses `divide-gray-200` for borders (should be `divide-neutral-200`)
- ❌ Uses `hover:bg-gray-50` for row hover (should be `hover:bg-neutral-50`)
- ⚠️ Same spacing as BookingList: `px-6 py-3` for headers, `px-6 py-4` for cells
- ⚠️ No shared Table component

**Table Structure:**
```
<div className="bg-white shadow rounded-lg overflow-hidden">
  <div className="px-6 py-4 border-b border-gray-200">
    <!-- Header with title -->
  </div>
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Member
          </th>
          <!-- 6 more columns -->
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        <tr className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap">
            <!-- Content -->
          </td>
          <!-- 6 more columns -->
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

**Columns:** 7 columns (Member, Tier, Points, Lifetime Stays, Lifetime Nights, Lifetime Spend, Actions)

**Badge Usage:**
- Tier badges: Raw `<span>` with `getTierColor()` function (local function)
- Uses `inline-flex px-2 py-1 text-xs font-semibold rounded-full border` + color classes

**Color Issues:**
- Header: `bg-gray-50` → should be `bg-neutral-100`
- Dividers: `divide-gray-200` → should be `divide-neutral-200`
- Hover: `hover:bg-gray-50` → should be `hover:bg-neutral-50`
- Text: `text-gray-500`, `text-gray-900`, `text-gray-400` → should be `text-neutral-*`
- Border: `border-gray-200` → should be `border-neutral-200`

---

### 3. Booking Detail Page (`frontend/pages/admin/bookings/[id].tsx`)

**Current State:**
- No table implementation
- Uses badges in header section:
  - Status badge: Raw `<span>` with `getStatusColor()`
  - Source badge: Raw `<span>` with `getSourceColor()`

**Badge Usage:**
```tsx
<span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(booking.status)}`}>
  {booking.status.replace(/_/g, ' ')}
</span>
<span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getSourceColor(booking.source)}`}>
  {booking.source.replace(/_/g, ' ')}
</span>
```

---

## Badge Implementation Analysis

### Current Badge Component (`frontend/components/ui/Badge.tsx`)

**Available Variants:**
- `capsule`, `smart`, `sanctuary`, `sauna` (brand-specific)
- `neutral`, `success`, `warning`, `error` (system)

**Available Sizes:**
- `sm`: `px-2 py-0.5 text-xs`
- `md`: `px-3 py-1 text-sm`
- `lg`: `px-4 py-1.5 text-base`

**Current Color Tokens:**
- Uses semantic colors: `green-*`, `yellow-*`, `red-*`
- Uses brand colors: `capsule-*`, `smart-*`, etc.
- Uses `neutral-*` for neutral variant

**Gaps:**
- ❌ No booking status variants (confirmed, pending, hold, cancelled, noshow, etc.)
- ❌ No loyalty tier variants (silver, gold, platinum, diamond)
- ❌ No source variants (web_direct, ota_*, walk_in, phone, corporate)
- ⚠️ Color tokens use Tailwind defaults instead of design system semantic colors

---

### Badge Usage Patterns

#### 1. Booking Status Badges (via `getStatusColor()`)

**Function Location:** `frontend/lib/booking.ts:836`

**Status Mappings:**
- `HOLD` → `bg-yellow-100 text-yellow-800`
- `PENDING` → `bg-blue-100 text-blue-800`
- `CONFIRMED` → `bg-green-100 text-green-800`
- `CHECKED_IN` → `bg-purple-100 text-purple-800`
- `CHECKED_OUT` → `bg-gray-100 text-gray-800` ❌
- `CANCELLED` → `bg-red-100 text-red-800`
- `NO_SHOW` → `bg-orange-100 text-orange-800`
- `REJECTED` → `bg-red-100 text-red-800`
- `COMPLETED` → `bg-green-100 text-green-800`
- `FAILED` → `bg-red-100 text-red-800`
- default → `bg-gray-100 text-gray-800` ❌

**Issues:**
- Uses `gray-*` instead of `neutral-*`
- Uses Tailwind default colors instead of design system semantic colors
- Should map to Badge component variants

**Used In:**
- `frontend/components/booking/BookingList.tsx` (table)
- `frontend/pages/admin/bookings/[id].tsx` (header)

---

#### 2. Booking Source Badges (via `getSourceColor()`)

**Function Location:** `frontend/lib/booking.ts:866`

**Source Mappings:**
- `WEB_DIRECT` → `bg-blue-100 text-blue-800`
- `WALK_IN` → `bg-green-100 text-green-800`
- `PHONE` → `bg-purple-100 text-purple-800`
- `CORPORATE` → `bg-indigo-100 text-indigo-800`
- `OTA_*` (Booking.com, MMT, etc.) → `bg-yellow-100 text-yellow-800`
- default → `bg-gray-100 text-gray-800` ❌

**Issues:**
- Uses `gray-*` instead of `neutral-*`
- Uses Tailwind default colors
- Should map to Badge component variants

**Used In:**
- `frontend/components/booking/BookingList.tsx` (table)
- `frontend/pages/admin/bookings/[id].tsx` (header)

---

#### 3. Loyalty Tier Badges (via `getTierColor()`)

**Function Location:** `frontend/pages/admin/loyalty/index.tsx:119` (local function)

**Tier Mappings:**
- `DIAMOND` → `bg-purple-100 text-purple-800 border-purple-200`
- `PLATINUM` → `bg-gray-100 text-gray-800 border-gray-200` ❌
- `GOLD` → `bg-yellow-100 text-yellow-800 border-yellow-200`
- `SILVER` → `bg-gray-100 text-gray-600 border-gray-300` ❌
- `MEMBER` → `bg-blue-100 text-blue-800 border-blue-200`
- default → `bg-gray-100 text-gray-600 border-gray-300` ❌

**Issues:**
- Uses `gray-*` instead of `neutral-*`
- Uses Tailwind default colors
- Should map to Badge component variants

**Used In:**
- `frontend/pages/admin/loyalty/index.tsx` (table)

---

## Color Token Inconsistencies

### Tables

**BookingList (Already Updated in Phase 1):**
- ✅ Uses `neutral-*` colors
- ✅ Uses `bg-neutral-100` for header
- ✅ Uses `divide-neutral-200` for borders
- ✅ Uses `hover:bg-neutral-50` for hover

**Loyalty Table (Needs Updating):**
- ❌ `bg-gray-50` → should be `bg-neutral-100`
- ❌ `divide-gray-200` → should be `divide-neutral-200`
- ❌ `hover:bg-gray-50` → should be `hover:bg-neutral-50`
- ❌ `text-gray-500` → should be `text-neutral-500`
- ❌ `text-gray-900` → should be `text-neutral-900`
- ❌ `text-gray-400` → should be `text-neutral-400`
- ❌ `border-gray-200` → should be `border-neutral-200`

### Badges

**Status Colors:**
- Uses `yellow-*`, `blue-*`, `green-*`, `purple-*`, `orange-*`, `red-*`, `gray-*`
- Should use design system semantic colors where possible
- `gray-*` → should be `neutral-*`

**Source Colors:**
- Uses `blue-*`, `green-*`, `purple-*`, `indigo-*`, `yellow-*`, `gray-*`
- Should use design system colors
- `gray-*` → should be `neutral-*`

**Tier Colors:**
- Uses `purple-*`, `gray-*`, `yellow-*`, `blue-*`
- Should use design system colors
- `gray-*` → should be `neutral-*`

---

## Shared Component Status

### Badge Component (`frontend/components/ui/Badge.tsx`)

**Status:** ✅ EXISTS but needs enhancement

**Current API:**
```tsx
<Badge variant="neutral" size="md">
  Text
</Badge>
```

**Current Variants:**
- Brand: `capsule`, `smart`, `sanctuary`, `sauna`
- System: `neutral`, `success`, `warning`, `error`

**Needed Enhancements:**
- Add booking status variants: `pending`, `confirmed`, `hold`, `cancelled`, `checkedIn`, `checkedOut`, `noShow`, etc.
- Add loyalty tier variants: `member`, `silver`, `gold`, `platinum`, `diamond`
- Add booking source variants: `webDirect`, `walkIn`, `phone`, `corporate`, `ota`
- Ensure all colors use design system tokens

---

### Table Component (`frontend/components/ui/Table.tsx`)

**Status:** ❌ DOES NOT EXIST (needs to be created)

**Proposed Structure:**
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Column 1</TableHead>
      <TableHead>Column 2</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Data 1</TableCell>
      <TableCell>Data 2</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

**Requirements:**
- Use `neutral-*` color tokens
- Consistent spacing: `px-6 py-3` for headers, `px-6 py-4` for cells
- Header: `bg-neutral-100`, `text-neutral-500`, uppercase, tracking-wide
- Borders: `divide-neutral-200`
- Row hover: `hover:bg-neutral-50`
- Responsive: overflow-x-auto wrapper
- Accessible: proper ARIA labels

---

## Summary

### Tables Found: 2 tables

1. **BookingList** (`frontend/components/booking/BookingList.tsx`)
   - ✅ Already uses `neutral-*` colors (Phase 1)
   - ⚠️ Uses raw HTML markup
   - ⚠️ No shared component

2. **Loyalty Members** (`frontend/pages/admin/loyalty/index.tsx`)
   - ❌ Uses `gray-*` colors (needs updating)
   - ⚠️ Uses raw HTML markup
   - ⚠️ No shared component

### Badge Implementations Found: 3 types

1. **Booking Status** (via `getStatusColor()`)
   - Used in: BookingList, BookingDetail
   - Issues: Uses `gray-*`, raw `<span>` markup

2. **Booking Source** (via `getSourceColor()`)
   - Used in: BookingList, BookingDetail
   - Issues: Uses `gray-*`, raw `<span>` markup

3. **Loyalty Tier** (via `getTierColor()`)
   - Used in: Loyalty index
   - Issues: Uses `gray-*`, raw `<span>` markup

### Component Status

- ✅ **Badge Component:** EXISTS but needs enhancement (add booking/loyalty variants)
- ❌ **Table Component:** DOES NOT EXIST (needs to be created)

### Files to Modify

1. ✅ Create `frontend/components/ui/Table.tsx` (new)
2. ✅ Update `frontend/components/ui/Badge.tsx` (add variants)
3. ✅ Update `frontend/components/booking/BookingList.tsx` (use Table + Badge)
4. ✅ Update `frontend/pages/admin/bookings/[id].tsx` (use Badge)
5. ✅ Update `frontend/pages/admin/loyalty/index.tsx` (use Table + Badge)

---

## Color Token Mapping Reference

### Neutral Colors (Design System)
- `gray-50` → `neutral-50` (`#fafafa`)
- `gray-100` → `neutral-100` (`#f5f5f5`)
- `gray-200` → `neutral-200` (borders/dividers)
- `gray-300` → `neutral-300` (borders)
- `gray-400` → `neutral-400` (muted text)
- `gray-500` → `neutral-500` (`#737373` - body text)
- `gray-600` → `neutral-600` (body text)
- `gray-700` → `neutral-700` (labels)
- `gray-800` → `neutral-800` (headings)
- `gray-900` → `neutral-900` (`#171717` - headings)

### Semantic Colors (Design System)
- Success: `green-*` (acceptable, common semantic)
- Warning: `yellow-*` (acceptable, common semantic)
- Error/Danger: `red-*` (acceptable, common semantic)
- Info: `blue-*` (acceptable, common semantic)

**Note:** Semantic colors (`green-*`, `yellow-*`, `red-*`, `blue-*`) are acceptable as they represent meaning, not just neutral grays. However, we should ensure they match the design system if specific tokens are defined.

---

## Recommendations

### Table Component Features
1. **Base Component:** `Table` with responsive wrapper
2. **Sub-components:** `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`
3. **Styling:** Design system colors, consistent spacing, hover states
4. **Accessibility:** ARIA labels, keyboard navigation support
5. **Responsive:** Horizontal scroll on mobile, optional stacking

### Badge Component Enhancements
1. **Booking Status Variants:** Map all booking statuses to badge variants
2. **Loyalty Tier Variants:** Map all loyalty tiers to badge variants
3. **Booking Source Variants:** Map all booking sources to badge variants
4. **Color Consistency:** Ensure all variants use design system colors
5. **Size Consistency:** Support `sm`, `md`, `lg` sizes consistently

---

**Plan Status:** ✅ READY FOR REVIEW

*Analysis completed: 2025-01-21*
*Waiting for confirmation before proceeding to STEP 2 (Component API Design)*

