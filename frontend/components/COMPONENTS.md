# Component Library Documentation
*9h-Inspired Design System*

## 📦 Component Structure

```
components/
├── ui/              # Base UI components
├── layout/          # Layout components
├── brand/           # Brand-specific components
└── sections/        # Page sections
```

---

## 🎨 UI Components

### Button
Versatile button component with brand variants.

**Variants:**
- `primary` - Black background (default)
- `secondary` - Bordered outline
- `capsule` - Blue brand color
- `smart` - Amber brand color
- `sanctuary` - Pink brand color
- `sauna` - Green brand color
- `ghost` - Transparent with hover

**Sizes:** `sm`, `md`, `lg`, `xl`

**Usage:**
```tsx
import { Button } from '@/components/ui';

<Button variant="primary" size="lg">
  Book Now
</Button>

<Button variant="capsule" size="md" fullWidth>
  View Capsule Brand
</Button>
```

---

### Card
Flexible card container with variants.

**Variants:**
- `default` - Standard shadow
- `elevated` - Deeper shadow
- `bordered` - Border instead of shadow

**Padding:** `none`, `sm`, `md`, `lg`

**Usage:**
```tsx
import { Card } from '@/components/ui';

<Card variant="default" padding="md" hover>
  Card content
</Card>
```

---

### Badge
Small status/info badges with brand colors.

**Variants:** `capsule`, `smart`, `sanctuary`, `sauna`, `neutral`, `success`, `warning`, `error`

**Sizes:** `sm`, `md`, `lg`

**Usage:**
```tsx
import { Badge } from '@/components/ui';

<Badge variant="capsule" size="sm">
  3 Locations
</Badge>

<Badge variant="warning">
  Coming Soon
</Badge>
```

---

### Input
Form input with label, error, and helper text support.

**Usage:**
```tsx
import { Input } from '@/components/ui';

<Input
  label="Email"
  type="email"
  placeholder="your@email.com"
  error={errors.email}
  fullWidth
/>
```

---

## 🏗️ Layout Components

### Container
Responsive container with centered content and padding.

**Sizes:** `sm`, `md`, `lg`, `xl`, `full`

**Usage:**
```tsx
import { Container } from '@/components/layout';

<Container size="xl">
  Page content
</Container>
```

---

### Header
Navigation header with desktop and mobile menus.

**Props:**
- `transparent` - Transparent background (for hero sections)

**Usage:**
```tsx
import { Header } from '@/components/layout';

<Header transparent={true} />
```

---

### Footer
Site footer with brand links, quick links, and contact info.

**Usage:**
```tsx
import { Footer } from '@/components/layout';

<Footer />
```

---

## 🏷️ Brand Components

### BrandCard
Card displaying brand information with logo and CTA.

**Usage:**
```tsx
import { BrandCard } from '@/components/brand';

<BrandCard brand={brandData} showDetails={true} />
```

**Data Structure:**
```typescript
{
  id: number;
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  logoUrl?: string;
  primaryColor?: string;
  status: 'ACTIVE' | 'COMING_SOON';
  _count?: { properties: number };
}
```

---

### PropertyCard
Card displaying property/location information.

**Usage:**
```tsx
import { PropertyCard } from '@/components/brand';

<PropertyCard property={propertyData} brandSlug="capsule" />
```

**Data Structure:**
```typescript
{
  id: number;
  name: string;
  slug: string;
  location: string;
  city: string;
  description?: string;
  rating?: number;
  images?: string[];
  _count?: { rooms: number };
}
```

---

## 📐 Section Components

### Hero
Full-width hero section with background image and CTAs.

**Props:**
- `title` (required)
- `subtitle`
- `description`
- `backgroundImage`
- `primaryCTA` - `{ text, href }`
- `secondaryCTA` - `{ text, href }`
- `height` - `screen`, `large`, `medium`
- `overlay` - Dark overlay on background

**Usage:**
```tsx
import { Hero } from '@/components/sections';

<Hero
  title="POD N BEYOND"
  subtitle="India's First Pod Hotel Group"
  description="Experience the future of hospitality"
  backgroundImage="/hero.jpg"
  primaryCTA={{ text: "Book Now", href: "/book" }}
  secondaryCTA={{ text: "Our Brands", href: "/brands" }}
  height="screen"
  overlay={true}
/>
```

---

### BrandGrid
Grid of brand cards fetched from API.

**Props:**
- `title` - Section heading
- `subtitle` - Section description
- `showComingSoon` - Include coming soon brands

**Usage:**
```tsx
import { BrandGrid } from '@/components/sections';

<BrandGrid
  title="Our Brands"
  subtitle="Discover our collection"
  showComingSoon={true}
/>
```

---

### SearchWidget
Booking search form with date pickers and brand selector.

**Variants:**
- `inline` - White background
- `hero` - Transparent background for hero sections

**Usage:**
```tsx
import { SearchWidget } from '@/components/sections';

<SearchWidget variant="hero" />
```

---

## 🎯 Import Examples

**Single import:**
```tsx
import Button from '@/components/ui/Button';
```

**Multiple imports:**
```tsx
import { Button, Card, Badge } from '@/components/ui';
import { Header, Footer, Container } from '@/components/layout';
import { Hero, BrandGrid } from '@/components/sections';
```

---

## 🎨 Design Principles

1. **Consistent Spacing**: Use design system spacing (4px increments)
2. **Brand Colors**: Use brand-specific variants for brand pages
3. **Minimal Shadows**: Keep elevation subtle
4. **Smooth Animations**: 300-500ms transitions
5. **Mobile-First**: All components are responsive
6. **Accessibility**: Proper focus states and ARIA labels

---

## 🔧 Customization

All components accept a `className` prop for additional Tailwind classes:

```tsx
<Button className="mt-8">
  Custom Margin
</Button>

<Card className="border-2 border-capsule-500">
  Custom Border
</Card>
```

---

## 📱 Responsive Breakpoints

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

---

*Last Updated: November 2, 2025*

