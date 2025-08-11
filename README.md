# POD N BEYOND - Smart Hotel Booking System

A comprehensive full-stack hotel booking application for India's first pod hotel in Jamshedpur. Built with modern technologies and advanced features including payment integration, loyalty programs, and channel management.

## 🌟 Features

### 🏨 Core Booking System
- **Double-booking Prevention**: Intelligent room availability checking
- **Real-time Pricing**: Dynamic pricing with seasonal rate plans
- **Guest Management**: Complete guest information and preferences tracking
- **Booking Status Tracking**: PENDING → CONFIRMED → COMPLETED workflow

### 💳 Payment Integration
- **Razorpay Integration**: Secure online payment processing
- **Payment Verification**: Webhook-based payment confirmation
- **Transaction History**: Complete payment and booking records

### 🎯 Loyalty Program
- **Points System**: Earn 1 point per ₹100 spent
- **Tier System**: Silver, Gold, Platinum tiers with benefits
- **Redemption**: Point-based discounts and rewards
- **Account Management**: Complete loyalty account dashboard

### 📊 Admin Dashboard
- **Booking Management**: View, edit, and cancel bookings
- **Room Management**: CRUD operations for room inventory
- **Loyalty Management**: Monitor and manage loyalty accounts
- **Search & Filter**: Advanced search capabilities across all data

### 🖼️ Content Management System (CMS)
- **Dynamic Content**: Manage website content without code changes
- **Image Management**: Upload and organize hotel images
- **Gallery System**: Curated image galleries with metadata
- **Testimonials**: Guest review management system

### 🔗 Channel Manager
- **OTA Integration**: Connect with MakeMyTrip, Yatra, and other platforms
- **Availability Sync**: Automated room availability updates
- **External Booking Sync**: Import bookings from external channels
- **Cron Jobs**: Automated synchronization every 15 minutes

### 🎨 Modern UI/UX
- **Responsive Design**: Mobile-first approach
- **Indian Rupee (INR)**: Localized currency display
- **POD N BEYOND Branding**: Custom hotel theme and branding
- **Interactive Elements**: Hover effects, animations, and smooth transitions

## 🏗️ Project Structure

```
podnbeyond.com/
├── backend/                    # Express.js API server
│   ├── controllers/           # Business logic controllers
│   ├── models/                # Data models and interfaces
│   ├── modules/               # Business modules (Channel Manager, etc.)
│   ├── prisma/                # Database schema and migrations
│   │   ├── schema.prisma      # Database schema definition
│   │   ├── seed_cms.js        # CMS initial data seeding
│   │   └── migrations/        # Database migration files
│   ├── routes/                # API route handlers
│   │   ├── booking.js         # Booking and room management
│   │   ├── loyalty.js         # Loyalty program endpoints
│   │   ├── payment.js         # Razorpay payment processing
│   │   ├── cms.js             # Content management system
│   │   ├── channels.js        # Channel manager API
│   │   └── cron.js            # Scheduled task management
│   ├── services/              # Background services
│   │   └── cronService.js     # Automated OTA synchronization
│   ├── uploads/               # File uploads (images, etc.)
│   ├── scripts/               # Utility scripts
│   │   ├── import_gallery_images.js
│   │   └── add_remaining_gallery_images.js
│   └── server.js              # Main server file
├── frontend/                   # Next.js React application
│   ├── components/            # Reusable React components
│   ├── pages/                 # Next.js pages and routing
│   │   ├── index.tsx          # Main hotel booking page
│   │   ├── admin.tsx          # Admin dashboard
│   │   ├── admin/cms.tsx      # CMS management interface
│   │   ├── loyalty.tsx        # Loyalty program page
│   │   ├── _app.tsx           # Global app wrapper
│   │   └── _document.tsx      # Custom document structure
│   ├── config/                # Configuration files
│   │   └── razorpay.ts        # Razorpay configuration
│   └── styles/                # CSS and styling
│       └── globals.css        # Global Tailwind CSS
├── scripts/                    # Deployment and setup scripts
│   ├── deploy.sh              # Generic deployment script
│   ├── deploy-cloudpanel.sh   # CloudPanel-specific deployment
│   └── setup-cloudpanel-server.sh
├── ecosystem.config.js         # PM2 process management
├── package.json               # Root package.json
└── README.md                  # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm (comes with Node.js)
- PostgreSQL database
- Razorpay account (for payments)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/geek-baba/podnbeyond.com.git
cd podnbeyond.com
```

2. **Install dependencies:**
```bash
npm run install:all
```

3. **Set up environment variables:**
```bash
# Backend (.env)
DATABASE_URL="postgresql://username:password@localhost:5432/podnbeyond"
RAZORPAY_KEY_ID="your_razorpay_key_id"
RAZORPAY_KEY_SECRET="your_razorpay_secret"
JWT_SECRET="your_jwt_secret"

# Frontend (.env.local)
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_RAZORPAY_KEY_ID="your_razorpay_key_id"
```

4. **Set up the database:**
```bash
cd backend
npx prisma generate
npx prisma db push
npx prisma db seed
```

5. **Import gallery images:**
```bash
node scripts/import_gallery_images.js
```

### Development

**Start both servers:**
```bash
npm run dev
```

**Or start separately:**
```bash
# Backend only
npm run dev:backend

# Frontend only  
npm run dev:frontend
```

### Production Deployment

**Using PM2:**
```bash
npm run build
pm2 start ecosystem.config.js
```

**Using CloudPanel:**
```bash
./scripts/deploy-cloudpanel.sh
```

## 📡 API Endpoints

### Booking Management
- `GET /api/booking/availability` - Check room availability
- `POST /api/booking/book` - Create new booking
- `POST /api/booking/confirm/:id` - Confirm booking after payment
- `GET /api/booking/bookings` - List all bookings
- `PUT /api/booking/bookings/:id` - Update booking
- `DELETE /api/booking/bookings/:id` - Cancel booking

### Room Management
- `GET /api/booking/rooms` - List active rooms
- `GET /api/booking/rooms/all` - List all rooms (admin)
- `POST /api/booking/rooms` - Create new room
- `PUT /api/booking/rooms/:id` - Update room
- `DELETE /api/booking/rooms/:id` - Delete room

### Payment Processing
- `POST /api/payment/create-order` - Create Razorpay order
- `POST /api/payment/verify-payment` - Verify payment signature

### Loyalty Program
- `GET /api/loyalty/:userId` - Get loyalty account
- `GET /api/loyalty/accounts` - List all accounts (admin)
- `PUT /api/loyalty/accounts/:id` - Update loyalty account
- `POST /api/loyalty/redeem` - Redeem points for discount

### Content Management
- `GET /api/cms/content/all` - Get all content
- `POST /api/cms/content` - Create/update content
- `GET /api/cms/images/all` - Get all images
- `POST /api/cms/images/upload` - Upload new image
- `GET /api/cms/images/:type` - Get images by type

### Channel Management
- `POST /api/channels/:channelId/push-availability` - Push availability to OTA
- `GET /api/channels/:channelId/fetch-bookings` - Fetch external bookings
- `GET /api/channels/sync-logs` - View sync activity logs

## 🛠️ Technologies Used

### Backend
- **Express.js** - Web framework
- **Prisma** - Database ORM with PostgreSQL
- **Node-cron** - Scheduled task management
- **Multer** - File upload handling
- **Razorpay** - Payment gateway integration
- **CORS** - Cross-origin resource sharing

### Frontend
- **Next.js 14** - React framework with SSR
- **TypeScript** - Type safety and better DX
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client for API calls
- **Razorpay Checkout** - Payment integration

### Database
- **PostgreSQL** - Primary database
- **Prisma** - Type-safe database client
- **Migrations** - Version-controlled schema changes

### Deployment & DevOps
- **PM2** - Process management
- **GitHub Actions** - CI/CD pipeline
- **CloudPanel** - Server management
- **Docker** - Containerization (optional)

## 🎨 UI Components

### Main Pages
- **Homepage** - Hero section, gallery, booking form
- **Admin Dashboard** - Booking, room, and loyalty management
- **CMS Interface** - Content and image management
- **Loyalty Portal** - Points, tiers, and redemption history

### Key Features
- **Responsive Design** - Works on all devices
- **Dark/Light Mode** - User preference support
- **Loading States** - Smooth user experience
- **Error Handling** - Comprehensive error messages
- **Form Validation** - Client and server-side validation

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```env
DATABASE_URL="postgresql://..."
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="..."
JWT_SECRET="your-secret-key"
NODE_ENV="development"
PORT=4000
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_..."
NEXT_PUBLIC_LOGO_URL="https://podnbeyond.com/logo.png"
```

### Database Schema

The application uses a comprehensive database schema with the following main entities:
- **Rooms** - Hotel room inventory
- **Bookings** - Guest reservations
- **Payments** - Transaction records
- **LoyaltyAccounts** - Customer loyalty data
- **Content** - CMS content management
- **Images** - File management
- **OTASyncLog** - Channel manager logs

## 🚀 Deployment

### CloudPanel Deployment
1. Set up CloudPanel server
2. Configure domain and SSL
3. Set up PostgreSQL database
4. Configure environment variables
5. Deploy using provided scripts

### Manual Deployment
1. Build frontend: `npm run build`
2. Start backend: `npm start`
3. Configure reverse proxy (nginx)
4. Set up SSL certificates
5. Configure PM2 for process management

## 📊 Monitoring & Maintenance

### Health Checks
- `GET /api/health` - Backend health status
- Database connection monitoring
- External service status checks

### Logs
- Application logs via PM2
- Database query logs
- Payment transaction logs
- OTA sync activity logs

### Backup
- Database backups (daily)
- File uploads backup
- Configuration backup

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is proprietary software for POD N BEYOND hotel.

## 🆘 Support

For support and questions:
- Email: info@podnbeyond.com
- Phone: (91) 82350 71333
- Website: https://podnbeyond.com

---

**Built with ❤️ for POD N BEYOND - India's First Pod Hotel in Jamshedpur** 