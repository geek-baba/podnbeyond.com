# Toast Copy Guidelines

This document defines the copywriting standards for toast notifications across the admin interface. All toast messages should follow these patterns for consistency, clarity, and professional tone.

## Voice & Tone

- **Short and direct**: Use concise, action-oriented language
- **Neutral-friendly**: Professional but approachable
- **No exclamation marks**: Avoid unless truly necessary (prefer none)
- **No emojis**: Keep toasts clean and professional
- **Simple past tense**: Prefer "Booking confirmed" over "Booking has been confirmed"

## Structure

### Success Toasts
- **Title**: `[Entity] [action]` (e.g., "Booking confirmed", "Perk deleted")
- **Description**: Optional, only when additional context is helpful
- **Examples**:
  - `title: "Booking confirmed"`
  - `title: "Perk created"`
  - `title: "Template updated"`

### Error Toasts
- **Title**: `"Couldn't [action] [entity]"` (e.g., "Couldn't save perk", "Couldn't delete campaign")
- **Description**: API error message if available (from `error.message` or `data.error`)
- **Examples**:
  - `title: "Couldn't save template"`, `message: data.error`
  - `title: "Couldn't load analytics"`, `message: errorMessage`

### Warning Toasts
- **Title**: `"Check [thing]"` or descriptive action (e.g., "Booking ID required", "No conversations selected")
- **Description**: Short reason or instruction
- **Examples**:
  - `title: "Booking ID required"`, `message: "Enter a booking ID to generate a preview"`
  - `title: "Phone number required"`, `message: "No phone number found"`

### Info Toasts
- **Title**: `"Heads up: [note]"` or descriptive (e.g., "Export started")
- **Description**: Additional context if needed
- **Examples**:
  - `title: "Export started"`, `message: "Downloading CSV file"`

## Terminology Consistency

Use canonical nouns from architecture docs:

- **Bookings**: "Booking" (capital B)
- **Loyalty**: "Perk", "Campaign", "Points rule", "Redemption item"
- **Templates**: "Template"
- **CMS**: "Image", "Testimonial", "Amenity"
- **Integrations**: "Integration", "API key"
- **Communication**: "Conversation", "Reply", "Note"

Use consistent action verbs:
- `create` / `update` / `delete` / `confirm` / `cancel`
- `check-in` / `check-out`
- Avoid mixing synonyms (e.g., don't alternate between "remove" and "delete")

## Title vs Description

- **Title**: 2–4 words, no trailing punctuation
- **Description**: Only when it adds value:
  - Dynamic details (IDs, names, counts)
  - Context about timing or impact
  - API error messages

**Good examples**:
```typescript
// Success with optional description
toast({
  variant: 'success',
  title: 'Bulk action completed',
  message: `${data.updated} conversation(s) ${action}ed`,
});

// Error with API message
toast({
  variant: 'error',
  title: "Couldn't save perk",
  message: err.response?.data?.error || err.message,
});

// Warning with instruction
toast({
  variant: 'warning',
  title: 'Booking ID required',
  message: 'Enter a booking ID to generate a preview',
});
```

## Domain-Specific Patterns

### Bookings
- Confirm: `title: "Booking confirmed"`
- Cancel: `title: "Booking cancelled"`
- Update: `title: "Booking updated"`
- Hold: `title: "Booking held"` (warning variant)
- Duplicate: `title: "Booking duplicated"`
- Errors: `title: "Couldn't [action] booking"`

### Loyalty
- Create: `title: "[Entity] created"` (e.g., "Perk created", "Campaign created")
- Update: `title: "[Entity] updated"`
- Delete: `title: "[Entity] deleted"`
- Errors: `title: "Couldn't [action] [entity]"`

### Templates
- Save: `title: "Template saved"` or `title: editingTemplate ? "Template updated" : "Template created"`
- Delete: `title: "Template deleted"`
- Preview: `title: "Couldn't preview template"` (errors only)
- Errors: `title: "Couldn't save template"` or `title: "Couldn't delete template"`

### CMS
- Images: `title: "Image uploaded"` / `title: "Image deleted"`
- Testimonials: `title: editingTestimonial ? "Testimonial updated" : "Testimonial created"`
- Amenities: `title: editingAmenity ? "Amenity updated" : "Amenity created"`
- Errors: `title: "Couldn't [action] [entity]"`

### Integrations
- Save: `title: "Integration updated"`
- Test: `title: "Connection test successful"` / `title: "Connection test failed"`
- Errors: `title: "Couldn't [action] integration"`

### Analytics
- Export: `title: "Export started"`, `message: "Downloading CSV file"`
- Load: `title: "Couldn't load analytics"`
- Errors: `title: "Couldn't [action]"`

### Communication Hub
- Reply: `title: "Reply sent"`
- Note: `title: "Note added"`
- Bulk: `title: "Bulk action completed"`, `message: "${count} conversation(s) ${action}ed"`
- Status/Priority/Assign: Errors only: `title: "Couldn't update status"` / `title: "Couldn't assign conversation"`
- Errors: `title: "Couldn't [action]"`

## Error Handling

- Always include API error messages in the `message` field when available
- Never expose raw stack traces or large payloads
- Use fallback messages only when no API error is available:
  ```typescript
  message: err.response?.data?.error || err.message
  ```

## Examples by Variant

### Success
```typescript
toast({ variant: 'success', title: 'Booking confirmed' });
toast({ variant: 'success', title: 'Perk created' });
toast({ variant: 'success', title: 'Template updated' });
toast({ variant: 'success', title: 'Bulk action completed', message: '5 conversation(s) archived' });
```

### Error
```typescript
toast({ variant: 'error', title: "Couldn't save perk", message: err.message });
toast({ variant: 'error', title: "Couldn't load analytics", message: errorMessage });
toast({ variant: 'error', title: "Couldn't delete campaign", message: data.error });
```

### Warning
```typescript
toast({ variant: 'warning', title: 'Booking ID required', message: 'Enter a booking ID to generate a preview' });
toast({ variant: 'warning', title: 'No conversations selected', message: 'Select at least one conversation' });
toast({ variant: 'warning', title: 'Phone number required', message: 'No phone number found' });
```

### Info
```typescript
toast({ variant: 'info', title: 'Export started', message: 'Downloading CSV file' });
```

## Anti-Patterns to Avoid

❌ **Don't**:
- Use exclamation marks: `"Success!"`, `"Failed!"`
- Add trailing periods in titles: `"Booking confirmed."`
- Use overly casual language: `"Oops! Something went wrong"`
- Include emojis: `"✅ Booking confirmed"`
- Mix tenses: `"Booking has been confirmed"` (prefer "Booking confirmed")
- Use "Failed to" instead of "Couldn't": `"Failed to save perk"` → `"Couldn't save perk"`
- Add redundant descriptions: `title: "Perk deleted"`, `message: "The perk has been removed"` (redundant)

✅ **Do**:
- Keep titles short and action-oriented
- Use "Couldn't" for errors
- Include API error messages in descriptions
- Use simple past tense
- Remove redundant success messages

## Implementation Notes

- All toasts use the `useToast` hook from `frontend/components/ui/toast`
- Variants: `'success'`, `'error'`, `'warning'`, `'info'`
- Duration: Use default (auto-dismiss) unless persistence is needed (`duration: null`)
- No business logic changes: Only string literals (title/description) should change

## Future Updates

When adding new toast notifications:
1. Follow the patterns above
2. Use consistent terminology
3. Keep titles under 4 words
4. Only add descriptions when they provide value
5. Test error messages with actual API responses

