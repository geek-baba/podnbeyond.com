# PHASE 1 UI/UX Cleanup Plan - Admin Booking Pages

**Date:** 2025-01-21  
**Phase:** PHASE 1 - Booking Pages Only  
**Scope:** Admin booking pages and booking-specific components

---

## Files to Modify

### 1. `frontend/pages/admin/bookings/index.tsx`
**Approximate `gray-*` instances:** ~5 instances

**Color replacements:**
- Line 239: `shadow rounded-lg` → `shadow-card rounded-card` (and card wrapper)
- Line 254: `text-neutral-700 bg-white border border-neutral-300 rounded-md` → Use Button component
- Line 261: Same as above

**Button replacements:**
- Lines 251-257: Pagination "Previous" button → Use `Button` component with `variant="secondary"`, `size="sm"`
- Lines 258-264: Pagination "Next" button → Use `Button` component with `variant="secondary"`, `size="sm"`

**Card replacements:**
- Line 239: `<div className="bg-white shadow rounded-lg overflow-hidden">` → Wrap with `Card` component
  - Replace with: `<Card variant="default" padding="none">` (padding none because BookingList handles its own padding)

**Summary:**
- ~5 `gray-*` → `neutral-*` replacements
- 2 raw buttons → Button component
- 1 card-like div → Card component

---

### 2. `frontend/pages/admin/bookings/[id].tsx`
**Approximate `gray-*` instances:** ~35 instances

**Color replacements:**
- Line 79: `bg-gray-50` → `bg-neutral-50`
- Line 81: `border-gray-900` → `border-neutral-900`
- Line 82: `text-gray-600` → `text-neutral-600`
- Line 90: `bg-gray-50` → `bg-neutral-50`
- Line 95: `bg-blue-600` → Keep (action button color, will use Button component)
- Line 176: `bg-gray-50` → `bg-neutral-50`
- Line 218: `text-gray-600 hover:text-gray-900` → `text-neutral-600 hover:text-neutral-900`
- Line 224: `text-gray-900` → `text-neutral-900`
- Line 227: `text-gray-600` → `text-neutral-600`
- Line 251: `border-gray-200` → `border-neutral-200`
- Line 260: `text-gray-500 hover:text-gray-700 hover:border-gray-300` → `text-neutral-500 hover:text-neutral-700 hover:border-neutral-300`
- Line 275: `text-gray-900` → `text-neutral-900` (multiple instances in tab content)
- Line 278-360: All `text-gray-*` → `text-neutral-*` (labels and values in summary tab)
- Line 373: `text-gray-900` → `text-neutral-900`
- Line 383: `text-gray-900` → `text-neutral-900`
- Line 404: `text-gray-900` → `text-neutral-900`
- Line 414: `text-gray-900` → `text-neutral-900`
- Line 474: `bg-gray-50` → `bg-neutral-50`
- Line 475: `text-gray-600` → `text-neutral-600`

**Button replacements:**
- Line 93-98: Error state "Back to Bookings" button → Use `Button` component with `variant="primary"`
- Line 216-220: "Back to Bookings" link button → Keep as link, but style with neutral colors
- Line 254-264: Tab buttons → Keep as is (tabs will be addressed in future phase with Tabs component)
- Lines 418-423: "Confirm Booking" button → Use `Button` component with `variant="primary"` (green, but use primary variant)
- Lines 427-432: "Modify Booking" button → Use `Button` component with `variant="primary"`
- Lines 433-438: "Hold Booking" button → Use `Button` component with `variant="secondary"`
- Lines 439-444: "Cancel Booking" button → Use `Button` component (destructive action - may need variant)
- Lines 448-453: "Check-in" button → Use `Button` component with `variant="primary"`
- Lines 456-461: "Check-out" button → Use `Button` component with `variant="primary"`
- Lines 465-470: "Duplicate Booking" button → Use `Button` component with `variant="secondary"`

**Card replacements:**
- Line 270: `<div className="bg-white shadow rounded-lg p-6">` → Use `Card` component
  - Replace with: `<Card variant="default" padding="lg">`

**Tab styling:**
- Line 259: `border-blue-500 text-blue-600` → Consider using brand color or neutral (will address in future phase)

**Summary:**
- ~35 `gray-*` → `neutral-*` replacements
- ~8 raw buttons → Button component (action buttons)
- 1 card-like div → Card component
- Note: Tab buttons kept as-is (will be addressed in future phase with Tabs component)

---

### 3. `frontend/components/booking/BookingList.tsx`
**Approximate `gray-*` instances:** ~20 instances

**Color replacements:**
- Line 31: `divide-gray-200` → `divide-neutral-200`
- Line 32: `bg-gray-50` → `bg-neutral-100` (table header background per design system)
- Line 34-60: All `text-gray-500`, `text-gray-700` → `text-neutral-500`, `text-neutral-700` (table headers)
- Line 63: `divide-gray-200` → `divide-neutral-200`
- Line 67: `hover:bg-gray-50` → `hover:bg-neutral-50`
- Line 69: `text-gray-900` → `text-neutral-900` (multiple instances)
- Line 75: `text-gray-500` → `text-neutral-500`
- Line 78: `text-gray-900` → `text-neutral-900`
- Line 80: `text-gray-500` → `text-neutral-500`
- Line 84: `text-gray-900` → `text-neutral-900`
- Line 85: `text-gray-500` → `text-neutral-500`
- Line 106: `text-gray-900` → `text-neutral-900`
- Line 122: `text-blue-600 hover:text-blue-900` → Keep link color but ensure focus states
- Line 129: `text-gray-600 hover:text-gray-900` → `text-neutral-600 hover:text-neutral-900`
- Line 142: `text-gray-500` → `text-neutral-500`

**Button replacements:**
- Line 127-132: Three-dot menu button → Use `Button` component with `variant="ghost"`, `size="sm"`

**Summary:**
- ~20 `gray-*` → `neutral-*` replacements
- 1 raw button → Button component (three-dot menu)

---

### 4. `frontend/components/booking/BookingFilters.tsx`
**Approximate `gray-*` instances:** ~15 instances

**Color replacements:**
- Line 54: `bg-white p-4 rounded-lg shadow-md` → Use Card component with `padding="md"`
- Line 58: `text-gray-700` → `text-neutral-700` (labels)
- Line 66: `border-gray-300 rounded-md` → `border-neutral-300 rounded-button` (inputs)
- Line 73: `text-gray-700` → `text-neutral-700` (labels)
- Line 79: `border-gray-300 rounded-md` → `border-neutral-300 rounded-button` (selects)
- Line 93: `text-gray-700` → `text-neutral-700` (labels)
- Line 99: `border-gray-300 rounded-md` → `border-neutral-300 rounded-button` (selects)
- Line 112: `text-gray-700` → `text-neutral-700` (labels)
- Line 118: `border-gray-300 rounded-md` → `border-neutral-300 rounded-button` (selects)
- Line 131: `text-gray-700` → `text-neutral-700` (labels)
- Line 138: `border-gray-300 rounded-md` → `border-neutral-300 rounded-button` (date inputs)
- Line 144: `text-gray-700` → `text-neutral-700` (labels)
- Line 151: `border-gray-300 rounded-md` → `border-neutral-300 rounded-button` (date inputs)
- Line 157: `text-gray-700` → `text-neutral-700` (labels)
- Line 164: `border-gray-300 rounded-md` → `border-neutral-300 rounded-button` (date inputs)
- Line 170: `text-gray-700` → `text-neutral-700` (labels)
- Line 177: `border-gray-300 rounded-md` → `border-neutral-300 rounded-button` (date inputs)
- Line 186: `text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50` → Use Button component

**Button replacements:**
- Line 184-189: "Reset Filters" button → Use `Button` component with `variant="secondary"`, `size="sm"`

**Card replacements:**
- Line 54: `<div className="bg-white p-4 rounded-lg shadow-md mb-4">` → Use `Card` component
  - Replace with: `<Card variant="default" padding="md">`

**Note:** Input and select elements will remain raw HTML for now (addressed in future phase when we create Input/Select components or standardize form usage)

**Summary:**
- ~15 `gray-*` → `neutral-*` replacements
- 1 raw button → Button component (reset button)
- 1 card-like div → Card component

---

## Summary of Changes

### Files to Modify: 4 files

1. **frontend/pages/admin/bookings/index.tsx**
   - ~5 `gray-*` → `neutral-*` replacements
   - 2 raw buttons → Button component
   - 1 card-like div → Card component

2. **frontend/pages/admin/bookings/[id].tsx**
   - ~35 `gray-*` → `neutral-*` replacements
   - ~8 raw buttons → Button component
   - 1 card-like div → Card component

3. **frontend/components/booking/BookingList.tsx**
   - ~20 `gray-*` → `neutral-*` replacements
   - 1 raw button → Button component

4. **frontend/components/booking/BookingFilters.tsx**
   - ~15 `gray-*` → `neutral-*` replacements
   - 1 raw button → Button component
   - 1 card-like div → Card component

### Total Estimated Changes:
- **~75 `gray-*` → `neutral-*` color replacements**
- **~12 raw buttons → Button component**
- **3 card-like divs → Card component**

---

## Components to Import

All files will need:
```tsx
import Button from '../../../components/ui/Button'; // or appropriate relative path
import Card from '../../../components/ui/Card';     // or appropriate relative path
```

---

## Design System Compliance

### Color Mappings:
- `gray-50` → `neutral-50` (backgrounds)
- `gray-100` → `neutral-100` (light backgrounds, table headers)
- `gray-200` → `neutral-200` (borders, dividers)
- `gray-300` → `neutral-300` (borders)
- `gray-500` → `neutral-500` (muted text)
- `gray-600` → `neutral-600` (body text)
- `gray-700` → `neutral-700` (labels)
- `gray-900` → `neutral-900` (headings, primary text)

### Button Variants:
- Primary actions (Confirm, Check-in, Check-out) → `variant="primary"`
- Secondary actions (Modify, Hold, Duplicate) → `variant="secondary"`
- Reset/Filter actions → `variant="secondary"`, `size="sm"`
- Ghost actions (three-dot menu) → `variant="ghost"`, `size="sm"`

### Card Usage:
- Main content cards → `Card variant="default" padding="lg"`
- Filter panels → `Card variant="default" padding="md"`
- Table wrappers → `Card variant="default" padding="none"` (let table handle spacing)

---

## Things NOT Changing in This Phase

1. **Tab buttons** - Will be addressed in future phase with Tabs component
2. **Input/Select elements** - Will be addressed when Input/Select components are standardized
3. **Badge components** - Status badges will remain raw HTML for now (addressed in future phase)
4. **Table styling** - Table HTML structure remains, only colors change
5. **Modal components** - Modals remain unchanged (addressed in future phase)
6. **Business logic** - No changes to booking state, payment, or RBAC logic
7. **Navigation** - Admin header navigation remains unchanged
8. **Page routing** - No routing changes

---

## Testing Considerations

After implementation, verify:
1. ✅ All `gray-*` classes replaced with `neutral-*`
2. ✅ Buttons use Button component correctly
3. ✅ Cards use Card component correctly
4. ✅ Visual appearance matches design system
5. ✅ All click handlers still work
6. ✅ No console errors
7. ✅ Responsive behavior unchanged
8. ✅ Booking actions (confirm, modify, cancel, check-in, check-out) still work

---

## Next Steps After This Phase

**PHASE 2** should address:
- Badge component standardization
- Input/Select component standardization
- Tab component creation
- Table component creation
- Modal component standardization
- Accessibility improvements (ARIA labels, keyboard navigation)

---

*Plan created: 2025-01-21*  
*Ready for review and confirmation before implementation*

