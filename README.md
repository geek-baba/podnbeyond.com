# POD N BEYOND GROUP - Multi-Brand Capsule Hotel Network

> India's First Multi-Brand Pod Hotel Group - Experience the Future of Hospitality

[![Website](https://img.shields.io/badge/Website-capsulepodhotel.com-blue)](https://capsulepodhotel.com)
[![Status](https://img.shields.io/badge/Status-Live-success)](https://capsulepodhotel.com)
[![License](https://img.shields.io/badge/License-Proprietary-red)]()

**Website**: [https://capsulepodhotel.com](https://capsulepodhotel.com)  
**Locations**: 3 Properties Across Jamshedpur  
**Contact**: info@podnbeyond.com | +91-90310 00931

---

## 🏢 About POD N BEYOND GROUP

**POD N BEYOND GROUP** is India's pioneering multi-brand pod hotel network, bringing Japanese-inspired minimalist hospitality to Jamshedpur. Our innovative brand architecture features **4 distinct sub-brands**, each designed for different traveler needs, all managed under one unified platform.

### 🎯 Our Brand Philosophy

Inspired by the revolutionary design principles of **9h (ninehours)** in Japan, we've created a hospitality ecosystem that values:
- **Simplicity** - Clean, minimalist design that enhances comfort
- **Efficiency** - Streamlined experiences from booking to checkout
- **Innovation** - Technology-driven solutions for modern travelers
- **Accessibility** - Affordable luxury for everyone

---

## 🏨 Our Sub-Brands

### 1. **POD N BEYOND | Capsule** 🔵
*Budget-Conscious Travelers*
- Ultra-compact, efficient capsule pods
- Essential amenities at competitive prices
- Perfect for solo travelers and backpackers
- **Status**: Active | **Location**: Kasidih

### 2. **POD N BEYOND | Smart** 🟠
*Business & Tech-Savvy Professionals*
- Premium amenities with smart technology
- Work-friendly spaces and high-speed connectivity
- Modern design with business facilities
- **Status**: Active | **Locations**: Bistupur, Sakchi

### 3. **POD N BEYOND | Sanctuary** 🩷
*Women-Only Safe Haven*
- Exclusively for women travelers
- Enhanced security and privacy features
- Wellness-focused amenities
- **Status**: Coming Soon

### 4. **POD N BEYOND | Sauna+Sleep** 🟢
*Wellness & Relaxation Seekers*
- Integrated sauna and spa facilities
- Wellness programs and relaxation spaces
- Premium sleep experience
- **Status**: Coming Soon

---

## ✨ Complete Website Redesign (2025)

### 🎨 9h-Inspired Design System

We've completely reimagined our platform with a **Japanese minimalist aesthetic** inspired by 9h:

- **Minimalist UI** - Clean typography, generous white space
- **Neutral Color Palette** - Sophisticated grays with brand accent colors
- **Modern Components** - Consistent UI library across all pages
- **Mobile-First** - Responsive design optimized for all devices
- **Smooth Animations** - Subtle transitions and micro-interactions

### 📱 New Pages

1. **Homepage** - Hero section, brand grid, search widget, philosophy
2. **Our Brands** - Showcase all 4 sub-brands with unique identities
3. **Locations** - Interactive property listings with filtering
4. **Concept Page** - Brand philosophy and multi-brand strategy
5. **Membership** - 3-tier loyalty program (Silver, Gold, Platinum)
6. **Search Results** - Advanced filtering and sorting
7. **Booking Flow** - 3-step seamless reservation process
8. **Admin Dashboard** - Comprehensive 8-tab management console

---

## 🛠️ Technology Stack

### Frontend (Complete Rewrite 2025)
- **Next.js 14** - React framework with SSR
- **TypeScript** - Full type safety
- **Tailwind CSS** - Custom design system
- **Framer Motion** - Smooth animations
- **Component Library** - Reusable UI, layout, brand, and section components

### Backend
- **Node.js & Express** - RESTful API server
- **PostgreSQL** - Relational database
- **Prisma ORM** - Type-safe database client
- **Multi-Brand Architecture** - Brands, Properties, Rooms hierarchy

### Infrastructure
- **CloudPanel** - Server management
- **GitHub Actions** - CI/CD pipeline
- **PM2** - Process management
- **SSL/HTTPS** - Secure communications

---

## 🎯 Key Features

### For Guests 👥

- ✅ **Multi-Brand Search** - Search across all brands and locations
- ✅ **Real-Time Availability** - Live booking calendar
- ✅ **Secure Payments** - Razorpay integration (UPI, cards, wallets)
- ✅ **Loyalty Program** - Earn points, redeem rewards
- ✅ **Responsive Design** - Seamless experience on any device
- ✅ **Brand Filtering** - Find properties by brand identity

### For Management 🔧

#### **Enhanced Admin Dashboard (8 Tabs)**

1. **Overview** - Dashboard stats, recent bookings, analytics
2. **Brands** - Manage all 4 sub-brands and their identities
3. **Properties** - Manage locations, rooms, and amenities
4. **Bookings** - View and manage all reservations
5. **Loyalty** - Track member rewards and tiers
6. **CMS** - Upload images, manage content sections
7. **Payment Gateway** - Configure Razorpay settings
8. **OTA Integration** - Connect Booking.com, MakeMyTrip, Airbnb, Goibibo

---

## 📁 Project Structure

```
podnbeyond.com/
├── frontend/
│   ├── components/
│   │   ├── ui/           # Buttons, Cards, Badges, Inputs
│   │   ├── layout/       # Header, Footer, Container
│   │   ├── brand/        # BrandCard, PropertyCard
│   │   └── sections/     # Hero, SearchWidget, BrandGrid
│   ├── pages/
│   │   ├── index.tsx     # New 9h-inspired homepage
│   │   ├── brands/       # Brand detail pages
│   │   ├── locations/    # Location detail & listing
│   │   ├── admin.tsx     # 8-tab dashboard
│   │   ├── concept.tsx   # Philosophy page
│   │   ├── membership.tsx # Loyalty program
│   │   ├── search.tsx    # Search results
│   │   └── book.tsx      # Booking flow
│   ├── public/logos/     # Brand logos (SVG)
│   └── tailwind.config.js # Custom design system
├── backend/
│   ├── routes/
│   │   ├── brands.js     # Brand API endpoints
│   │   ├── properties.js # Property endpoints
│   │   ├── booking.js    # Booking management
│   │   ├── loyalty.js    # Loyalty system
│   │   ├── payment.js    # Razorpay integration
│   │   ├── cms.js        # Content management
│   │   └── channels.js   # OTA integration
│   ├── prisma/
│   │   └── schema.prisma # Database schema with Brand model
│   ├── seed_brands.js    # Brand data seeding
│   └── server.js         # Express server
└── docs/
    ├── DESIGN_SYSTEM.md     # 9h-inspired design reference
    ├── LOCAL_DEV_GUIDE.md   # Local development setup
    ├── DEPLOYMENT_GUIDE.md  # Production deployment
    ├── REQUIREMENTS.md      # Original requirements
    └── CHANGELOG.md         # Version history
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### Quick Start

```bash
# Clone repository
git clone https://github.com/geek-baba/podnbeyond.com.git
cd podnbeyond.com

# Setup backend
cd backend
npm install
cp .env.example .env  # Configure your environment
npx prisma migrate deploy
node seed_properties.js
node seed_brands.js
npm start

# Setup frontend (in new terminal)
cd ../frontend
npm install
cp .env.local.example .env.local
npm run dev

# Visit http://localhost:3000
```

For detailed instructions, see [docs/LOCAL_DEV_GUIDE.md](docs/LOCAL_DEV_GUIDE.md)

---

## 📚 Documentation

- **[Design System](docs/DESIGN_SYSTEM.md)** - 9h-inspired design principles and components
- **[Local Development](docs/LOCAL_DEV_GUIDE.md)** - Setup and development guide
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Production deployment instructions
- **[Requirements](docs/REQUIREMENTS.md)** - Original project requirements
- **[Changelog](docs/CHANGELOG.md)** - Version history and updates

---

## 🎨 Design Philosophy

Our redesign draws inspiration from **9h (ninehours.co.jp)**, the iconic Japanese capsule hotel chain:

### Core Principles

1. **Minimalism** - Every element serves a purpose
2. **Clarity** - Clear hierarchy and intuitive navigation
3. **Consistency** - Unified design language across all touchpoints
4. **Scalability** - Architecture supports multiple brands and locations
5. **Accessibility** - Inclusive design for all users

### Brand Architecture

```
POD N BEYOND GROUP (Parent)
├── Capsule (Budget - Blue)
├── Smart (Business - Orange)
├── Sanctuary (Women - Pink)
└── Sauna+Sleep (Wellness - Green)
```

---

## 💳 Integrations

### Payment Gateway
- **Razorpay** - Full payment integration
  - Credit/Debit cards
  - UPI
  - Net banking
  - Wallets
  - Test mode for development

### OTA Channels (Coming Soon)
- **Booking.com** - Global distribution
- **MakeMyTrip** - Domestic travelers
- **Airbnb** - Alternative accommodation seekers
- **Goibibo** - Indian travel market

---

## 📊 Multi-Brand System Benefits

### For Guests
- **Choice** - Select brand that matches travel style
- **Consistency** - Quality standards across all brands
- **Flexibility** - Switch brands based on needs
- **Loyalty** - Earn/redeem points across all brands

### For Business
- **Market Segmentation** - Target different customer personas
- **Premium Positioning** - Differentiated pricing strategies
- **Scalability** - Easy to add new brands/locations
- **Brand Equity** - Strong group identity + unique sub-brands

---

## 🎯 Target Markets

### By Brand

| Brand | Target Audience | Price Range | Key Features |
|-------|----------------|-------------|--------------|
| **Capsule** | Budget travelers, backpackers | ₹999-₹1,499 | Essential amenities, compact |
| **Smart** | Business professionals, tech-savvy | ₹1,499-₹2,999 | Premium tech, work facilities |
| **Sanctuary** | Women travelers | ₹1,999-₹3,499 | Safety, privacy, wellness |
| **Sauna+Sleep** | Wellness seekers | ₹2,499-₹3,699 | Spa, sauna, premium comfort |

---

## 📞 Contact & Support

### For Guests
- **Website**: [capsulepodhotel.com](https://capsulepodhotel.com)
- **Email**: info@podnbeyond.com
- **Phone**: +91-90310 00931
- **Location**: Jamshedpur, Jharkhand, India

### For Developers
- **Repository**: [github.com/geek-baba/podnbeyond.com](https://github.com/geek-baba/podnbeyond.com)
- **Documentation**: See [docs/DOCUMENTATION_INDEX.md](docs/DOCUMENTATION_INDEX.md) for complete documentation
- **Deployment**: See [docs/FRESH_CLEAN_DEPLOYMENT.md](docs/FRESH_CLEAN_DEPLOYMENT.md) for current deployment process
- **Issues**: GitHub Issues

---

## 🔒 Security

- PCI DSS compliant payment processing (via Razorpay)
- SSL/HTTPS encryption on all pages
- Secure session management
- Regular security audits
- GDPR-compliant data handling

---

## 📈 Roadmap

### ✅ Completed (2025)
- Complete frontend redesign (9h-inspired)
- Multi-brand architecture implementation
- Enhanced admin dashboard (8 tabs)
- Membership tier system
- Modern booking flow

### 🚧 In Progress
- OTA channel integration
- Mobile app development
- Women-only brand launch (Sanctuary)
- Wellness brand launch (Sauna+Sleep)

### 🔮 Future
- Multi-city expansion
- Smart pod IoT controls
- AI-powered pricing
- Biometric check-in
- Multi-language support

---

## 📜 License

Copyright © 2025 POD N BEYOND GROUP. All rights reserved.

This is proprietary commercial software. Unauthorized copying, modification, distribution, or use is strictly prohibited.

---

## 🙏 Acknowledgments

**Inspired by**: 9h (ninehours.co.jp) - Revolutionary capsule hotel design  
**Built with**: Next.js, PostgreSQL, Prisma, Tailwind CSS  
**Deployed on**: CloudPanel (staging & production environments)

Special thanks to our guests, technology partners, and the open-source community.

---

**Experience the Future of Hospitality** - [Visit POD N BEYOND →](https://capsulepodhotel.com) 🏨✨
