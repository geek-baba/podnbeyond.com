# POD N BEYOND - Design System Documentation
*Inspired by 9h nine hours*

## Overview
This design system implements a minimalist, sophisticated aesthetic inspired by Japan's 9h nine hours capsule hotels. The focus is on clean typography, generous white space, subtle interactions, and a clear brand hierarchy.

---

## Brand Architecture

### POD N BEYOND GROUP
Parent company overseeing multiple sub-brands

#### Sub-Brands

1. **POD N BEYOND | Capsule** (Blue)
   - **Tagline**: Budget-Friendly Capsule Experience
   - **Target**: Budget travelers, backpackers, solo travelers
   - **Color**: `#3b82f6` (Blue)
   - **Current Locations**: Kasidih

2. **POD N BEYOND | Smart** (Amber/Gold)
   - **Tagline**: Premium Smart Hotel Experience
   - **Target**: Business professionals, couples, quality-conscious travelers
   - **Color**: `#f59e0b` (Amber)
   - **Current Locations**: Bistupur, Sakchi

3. **POD N BEYOND | Sanctuary** (Pink) [Coming Soon]
   - **Tagline**: Women-Only Safe Haven
   - **Target**: Women travelers, female professionals
   - **Color**: `#ec4899` (Pink)
   - **Status**: Coming Soon

4. **POD N BEYOND | Sauna+Sleep** (Green) [Coming Soon]
   - **Tagline**: Wellness-Focused Relaxation
   - **Target**: Wellness enthusiasts, health-conscious travelers
   - **Color**: `#10b981` (Green)
   - **Status**: Coming Soon

---

## Color Palette

### Brand Colors

Each sub-brand has a full color scale (50-900):

```javascript
// Capsule (Blue)
capsule-500: '#3b82f6'

// Smart (Amber)
smart-500: '#f59e0b'

// Sanctuary (Pink)
sanctuary-500: '#ec4899'

// Sauna (Green)
sauna-500: '#10b981'
```

### Neutral Colors

Minimal, clean neutrals for backgrounds and text:

```javascript
neutral-50: '#fafafa'   // Backgrounds
neutral-100: '#f5f5f5'  // Light backgrounds
neutral-500: '#737373'  // Body text
neutral-900: '#171717'  // Headings
neutral-950: '#0a0a0a'  // Pure black
```

---

## Typography

### Font Families

- **Sans**: `-apple-system, BlinkMacSystemFont, "SF Pro", "Inter"` 
- **Display**: Same as Sans with tighter letter-spacing
- **Mono**: `ui-monospace, SFMono-Regular, Menlo, Monaco`

### Font Sizes

```css
hero: 4rem (64px) - Hero headings
display: 3rem (48px) - Section headings
text-5xl: 3rem
text-4xl: 2.25rem
text-3xl: 1.875rem
text-2xl: 1.5rem
text-xl: 1.25rem
text-lg: 1.125rem
text-base: 1rem
text-sm: 0.875rem
text-xs: 0.75rem
```

### Letter Spacing

- Hero/Display: `-0.02em` (tight)
- Body: Default
- Uppercase labels: `0.05em-0.1em` (wide)

---

## Spacing

Generous white space following 9h's aesthetic:

```css
Base scale: 0.25rem increments (4px)
Extended: 18, 22, 30, 34, 38 (4.5rem - 9.5rem)
```

### Section Spacing
- Hero sections: `py-30` or `py-38`
- Content sections: `py-20` or `py-22`
- Card padding: `p-8` or `p-10`

---

## Shadows

Subtle, minimal shadows:

```css
minimal: Light shadow for subtle elevation
card: Standard card shadow
card-hover: Elevated card on hover
hero: Deep shadow for hero elements
```

---

## Border Radius

```css
card: 0.75rem (12px)
button: 0.5rem (8px)
rounded-lg: 0.5rem
rounded-xl: 0.75rem
rounded-2xl: 1rem
```

---

## Animations

### Keyframes

```css
fade-in: Opacity 0 → 1 (0.5s)
slide-up: Translate Y(20px) → 0 with fade (0.5s)
slide-down: Translate Y(-20px) → 0 with fade (0.5s)
scale-up: Scale 0.95 → 1 with fade (0.3s)
```

### Usage

```html
<div class="animate-fade-in">Fades in</div>
<div class="animate-slide-up">Slides up</div>
```

---

## Components

### Button Styles

**Primary Button**
```html
<button class="px-8 py-4 bg-neutral-900 text-white rounded-button hover:bg-neutral-800 transition-colors">
  Button Text
</button>
```

**Secondary Button**
```html
<button class="px-8 py-4 border-2 border-neutral-900 text-neutral-900 rounded-button hover:bg-neutral-900 hover:text-white transition-all">
  Button Text
</button>
```

**Brand-Specific Button**
```html
<!-- Capsule -->
<button class="px-8 py-4 bg-capsule-500 text-white rounded-button hover:bg-capsule-600">
  Capsule Action
</button>

<!-- Smart -->
<button class="px-8 py-4 bg-smart-500 text-white rounded-button hover:bg-smart-600">
  Smart Action
</button>
```

### Card Styles

**Standard Card**
```html
<div class="bg-white rounded-card shadow-card p-8 hover:shadow-card-hover transition-shadow">
  Card content
</div>
```

**Brand Card**
```html
<div class="bg-white rounded-card shadow-card overflow-hidden group">
  <div class="aspect-[16/9] relative">
    <img src="..." class="w-full h-full object-cover" />
  </div>
  <div class="p-8">
    <h3 class="text-2xl font-bold mb-2">Brand Name</h3>
    <p class="text-neutral-600">Description</p>
  </div>
</div>
```

### Hero Section

```html
<section class="relative min-h-screen flex items-center justify-center bg-neutral-950">
  <div class="container px-4">
    <h1 class="text-hero text-white text-center mb-8">
      Welcome to POD N BEYOND
    </h1>
    <p class="text-xl text-neutral-300 text-center max-w-2xl mx-auto">
      Experience India's pod hotel revolution
    </p>
  </div>
</section>
```

---

## Layout Grid

### Container

```html
<div class="container">
  <!-- Automatically centered with responsive padding -->
</div>
```

### Standard Grid

```html
<!-- 3-column grid -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
  <!-- Items -->
</div>

<!-- 4-column grid (brands) -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <!-- Brand cards -->
</div>
```

---

## Responsive Breakpoints

```css
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

---

## Accessibility

- **Focus states**: All interactive elements have visible focus indicators
- **Color contrast**: All text meets WCAG AA standards
- **Semantic HTML**: Proper heading hierarchy and ARIA labels
- **Keyboard navigation**: Tab through all interactive elements

---

## Best Practices

1. **White Space**: Use generous padding and margins
2. **Typography**: Limit to 2-3 font sizes per section
3. **Colors**: Stick to brand colors, use neutrals for text
4. **Shadows**: Use sparingly, keep subtle
5. **Animations**: Smooth, not distracting (0.3-0.5s)
6. **Images**: High-quality, consistent aspect ratios
7. **Mobile-first**: Design for mobile, enhance for desktop

---

## Implementation Files

- **Tailwind Config**: `/frontend/tailwind.config.js`
- **Global Styles**: `/frontend/styles/globals.css`
- **Components**: `/frontend/components/`
- **Logos**: `/frontend/public/logos/`

---

## References

- **Inspiration**: [9h nine hours](https://ninehours.co.jp/en)
- **Design Philosophy**: Minimalism, functionality, wellness
- **Brand Vision**: India's first multi-brand pod hotel group

---

*Last Updated: November 2, 2025*

