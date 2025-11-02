# 🚀 POD N BEYOND - Production Readiness Checklist

> **Complete Checklist for Public Launch & Demo**  
> Last Updated: November 2, 2025

This comprehensive checklist covers everything needed to make your website production-ready. Use this for your demo and final launch.

---

## 📋 **TABLE OF CONTENTS**

1. [API Keys & Credentials](#1-api-keys--credentials)
2. [Property Information](#2-property-information)
3. [Brand Content & Images](#3-brand-content--images)
4. [Contact Information](#4-contact-information)
5. [Database Content](#5-database-content)
6. [Legal & Compliance](#6-legal--compliance)
7. [Configuration & Settings](#7-configuration--settings)
8. [Testing & Quality Assurance](#8-testing--quality-assurance)

---

## 1. 🔑 **API Keys & Credentials**

### **Required (Critical for Launch)**

#### Razorpay Payment Gateway
- [ ] **Razorpay Key ID** (Production)
  - Format: `rzp_live_xxxxxxxxxxxx`
  - Where to get: [Razorpay Dashboard](https://dashboard.razorpay.com/app/keys) → API Keys
  - **Current Status**: ⚠️ Using placeholder
  - **Location**: `backend/.env` → `RAZORPAY_KEY_ID`
  - **Also update**: `frontend/.env.local` → `NEXT_PUBLIC_RAZORPAY_KEY_ID`

- [ ] **Razorpay Key Secret** (Production)
  - Format: Secret string
  - Where to get: Same as above (keep this secure!)
  - **Current Status**: ⚠️ Using placeholder
  - **Location**: `backend/.env` → `RAZORPAY_KEY_SECRET`

**Note**: Without Razorpay keys, payment processing will NOT work. Demo mode will auto-confirm bookings without payment.

---

### **Optional (OTA Channel Integration)**

These are optional for launch but recommended for distribution:

#### Booking.com
- [ ] **API Key**: `BOOKING_COM_API_KEY`
- [ ] **API Secret**: `BOOKING_COM_API_SECRET`
- [ ] **Hotel ID**: `BOOKING_COM_HOTEL_ID`
- [ ] **Enable**: Set `BOOKING_COM_ENABLED=true`
- **Where to get**: [Booking.com Partner Hub](https://admin.booking.com/)

#### MakeMyTrip
- [ ] **API Key**: `MAKEMYTRIP_API_KEY`
- [ ] **API Secret**: `MAKEMYTRIP_API_SECRET`
- [ ] **Hotel ID**: `MAKEMYTRIP_HOTEL_ID`
- [ ] **Enable**: Set `MAKEMYTRIP_ENABLED=true`
- **Where to get**: [MakeMyTrip Partner Portal](https://www.makemytrip.com/partners/)

#### Airbnb
- [ ] **API Key**: `AIRBNB_API_KEY`
- [ ] **API Secret**: `AIRBNB_API_SECRET`
- [ ] **Property ID**: Configure via admin panel
- **Where to get**: [Airbnb Host Dashboard](https://www.airbnb.com/hosting/)

#### Goibibo
- [ ] **API Key**: `GOIBIBO_API_KEY`
- [ ] **API Secret**: `GOIBIBO_API_SECRET`
- [ ] **Hotel ID**: `GOIBIBO_HOTEL_ID`
- **Where to get**: [Goibibo Partner Platform](https://partners.goibibo.com/)

---

## 2. 🏨 **Property Information**

### **For Each Property (3 locations)**

#### **Property 1: Capsule Pod Hotel, Kasidih**
- [ ] **Property Name**: ✅ "Capsule Pod Hotel" (Already set)
- [ ] **Full Address**: 
  - Current: Generic address
  - **Need**: Complete street address, landmarks
  - Example: "Plot No. 123, Near Bus Stand, Kasidih, Jamshedpur - 831001"
- [ ] **Phone Number**: 
  - **Need**: Direct phone number for this property
  - Current: Generic number
- [ ] **Email**: 
  - **Need**: Property-specific email (e.g., kasidih@podnbeyond.com)
- [ ] **Check-in/Check-out Times**
  - Check-in time: ____ (e.g., 2:00 PM)
  - Check-out time: ____ (e.g., 11:00 AM)
- [ ] **Coordinates** (for maps):
  - Latitude: ____
  - Longitude: ____
- [ ] **Property Features** (select all that apply):
  - [ ] Free WiFi
  - [ ] Parking
  - [ ] 24/7 Reception
  - [ ] CCTV Security
  - [ ] Air Conditioning
  - [ ] Hot Water
  - [ ] Breakfast
  - Other: ____________

#### **Property 2: Pod n Beyond Smart Hotel @Bistupur**
- [ ] **Property Name**: ✅ Already set
- [ ] **Full Address**: ____________________
- [ ] **Phone Number**: ____________________
- [ ] **Email**: ____________________
- [ ] **Check-in/Check-out Times**: ____/____
- [ ] **Coordinates**: Lat ____, Lng ____
- [ ] **Property Features**: (same as above)

#### **Property 3: Pod n Beyond Smart Hotel @Sakchi**
- [ ] **Property Name**: ✅ Already set
- [ ] **Full Address**: 
  - Current partial: "Near Howrah Bridge, Sakchi"
  - **Need**: Complete address
- [ ] **Phone Number**: 
  - Current: "(91) 82350 74555"
  - Verify or update
- [ ] **Email**: ____________________
- [ ] **Check-in/Check-out Times**: ____/____
- [ ] **Coordinates**: Lat ____, Lng ____
- [ ] **Property Features**: (same as above)

---

## 3. 🎨 **Brand Content & Images**

### **Photography Needed (High Priority)**

Currently using Unsplash placeholders. You need real photos:

#### **Property Exterior & Interior** (For each of 3 properties)
- [ ] **Exterior Building Shot** (1-2 photos per property)
  - High resolution (min 1920x1080px)
  - Well-lit, professional angle
  - Shows signage if available

- [ ] **Reception/Lobby Area** (1-2 photos per property)
  - Shows check-in desk
  - Clean, welcoming atmosphere

- [ ] **Common Areas** (2-3 photos per property)
  - Lounge/seating area
  - Dining area (if applicable)
  - Any recreational spaces

#### **Pod/Room Photos** (For each room type)
You have 8 room types across properties. Need photos for:

1. **Capsule Pod**
   - [ ] Interior shot showing bed, amenities
   - [ ] Close-up of pod features (charging ports, reading light, etc.)

2. **Single Pod**
   - [ ] Interior shot
   - [ ] Detail shots

3. **Double Pod**
   - [ ] Interior shot
   - [ ] Detail shots

4. **Bunk Pod**
   - [ ] Full room shot
   - [ ] Upper/lower bunk details

5. **Tri Pod**
   - [ ] Full room shot
   - [ ] Layout view

6. **Quadra Pod**
   - [ ] Full room shot
   - [ ] Layout view

7. **Queen Pod**
   - [ ] Interior shot showing spaciousness
   - [ ] Bed and amenities

8. **King Pod**
   - [ ] Premium interior shot
   - [ ] Luxury features highlighted

#### **Facilities Photos**
- [ ] **Bathroom/Washroom** (2-3 photos)
  - Clean, modern facilities
  - Shower area
  
- [ ] **Amenities** (photos of actual amenities)
  - WiFi router/connectivity
  - Breakfast area
  - Lockers/storage
  - Any unique features

#### **Brand Logos** (Optional Enhancement)
Currently using SVG placeholders:
- [ ] Professional logo for **POD N BEYOND GROUP**
- [ ] Sub-brand logos:
  - [ ] Capsule brand logo
  - [ ] Smart brand logo  
  - [ ] Sanctuary brand logo (coming soon)
  - [ ] Sauna+Sleep brand logo (coming soon)

**Format**: SVG or high-res PNG (transparent background)  
**Location**: `frontend/public/logos/`

---

### **Brand Descriptions** (Review & Update if needed)

Current brand content is in `backend/seed_brands.js`. Review these:

- [ ] **Capsule Brand**
  - Description: ✅ Good (India's first capsule pod hotel...)
  - Tagline: ✅ Good
  - Features: ✅ Listed
  - **Action**: Review and update if needed

- [ ] **Smart Brand**
  - Description: ✅ Good (Elevated pod experience...)
  - Tagline: ✅ Good
  - Features: ✅ Listed
  - **Action**: Review and update if needed

- [ ] **Sanctuary** (Coming Soon)
  - Status: Not yet launched
  - **Action**: Keep as-is for now

- [ ] **Sauna+Sleep** (Coming Soon)
  - Status: Not yet launched
  - **Action**: Keep as-is for now

---

## 4. 📞 **Contact Information**

### **Update All Contact Details**

#### **Primary Contact**
- [ ] **Main Email**: 
  - Current: info@podnbeyond.com
  - **Action**: Verify this email exists and is monitored
  
- [ ] **Main Phone Number**:
  - Current: +91-90310 00931
  - **Action**: Verify this number is active
  - Add to footer, contact page, all property listings

- [ ] **Support Email**:
  - Suggested: support@podnbeyond.com
  - For booking queries, customer service

#### **Admin/Management Contact**
- [ ] **Admin Email**: 
  - For system notifications
  - Current placeholder: admin@capsulepodhotel.com
  - **Update to**: Your actual admin email

#### **Social Media** (Optional but Recommended)
- [ ] Facebook Page: ____________________
- [ ] Instagram Handle: ____________________
- [ ] Twitter/X Handle: ____________________
- [ ] LinkedIn Page: ____________________

**Add these to footer if available**

---

## 5. 💾 **Database Content**

### **Property Pricing** (CRITICAL)

Review and update pricing in database:

- [ ] **Capsule Pods**: Currently ₹999/night
  - Is this correct? □ Yes □ No, update to ₹____

- [ ] **Single Pods**: Currently ₹1,499-₹1,999/night
  - Is this correct? □ Yes □ No, update to ₹____

- [ ] **Double Pods**: Currently ₹1,999-₹2,499/night
  - Is this correct? □ Yes □ No, update to ₹____

- [ ] **Bunk Pods**: Currently ₹1,299-₹2,299/night
  - Is this correct? □ Yes □ No, update to ₹____

- [ ] **Tri Pods**: Currently ₹2,699/night
  - Is this correct? □ Yes □ No, update to ₹____

- [ ] **Quadra Pods**: Currently ₹2,899-₹2,999/night
  - Is this correct? □ Yes □ No, update to ₹____

- [ ] **Queen Pods**: Currently ₹2,999/night
  - Is this correct? □ Yes □ No, update to ₹____

- [ ] **King Pods**: Currently ₹3,699/night
  - Is this correct? □ Yes □ No, update to ₹____

**To update**: Access Admin Dashboard → Properties → Edit room pricing

---

### **Inventory & Availability**

- [ ] **Verify Room Counts**
  - Kasidih property: 3 rooms listed
  - Bistupur property: 4 rooms listed
  - Sakchi property: 8 rooms listed
  - **Are these accurate?** □ Yes □ No, update

- [ ] **Set Blackout Dates** (if any)
  - Maintenance periods
  - Holidays when not accepting bookings
  - Access via: Admin → Properties → Manage Availability

---

### **Test Data Cleanup**

Before launch, remove test/demo data:

- [ ] **Delete Test Bookings**
  - Current: 5 test bookings (Rajesh Kumar, Priya Sharma, etc.)
  - **Location**: Admin Dashboard → Bookings → Delete test entries

- [ ] **Delete Test Loyalty Accounts**
  - Current: 4 test accounts (user_rajesh_001, user_priya_002, etc.)
  - **Location**: Admin Dashboard → Loyalty → Delete test entries

- [ ] **Verify Real Bookings Protected**
  - Ensure only test data is deleted

---

## 6. ⚖️ **Legal & Compliance**

### **Required Legal Pages**

- [ ] **Privacy Policy**
  - **Status**: ⚠️ Need to create
  - **URL**: Should be at `/privacy`
  - **Content Needed**: 
    - Data collection practices
    - Cookie usage
    - Third-party services (Razorpay, analytics)
    - User rights
  - **Template**: Can provide GDPR-compliant template if needed

- [ ] **Terms of Service**
  - **Status**: ⚠️ Need to create
  - **URL**: Should be at `/terms`
  - **Content Needed**:
    - Booking terms & conditions
    - Cancellation policy
    - Refund policy
    - House rules
    - Liability disclaimers

- [ ] **Cancellation Policy**
  - **Define**:
    - Cancellation window (e.g., 24 hours before check-in)
    - Refund percentage
    - No-show policy
  - **Where to update**: Admin Dashboard or contact developer

- [ ] **Refund Policy**
  - **Define**:
    - Refund processing time
    - Conditions for full/partial refunds
    - Razorpay refund integration

---

### **GDPR & Data Compliance**

- [ ] **Cookie Consent Banner**
  - **Status**: ⚠️ Need to implement
  - Required in EU/India for data protection

- [ ] **Data Retention Policy**
  - How long you keep booking data
  - Customer data deletion requests

---

## 7. ⚙️ **Configuration & Settings**

### **Environment Variables**

#### **Backend (.env)**

```env
# Database (✅ Already configured)
DATABASE_URL="postgresql://..."

# Razorpay (⚠️ UPDATE REQUIRED)
RAZORPAY_KEY_ID="rzp_live_XXXXX"  ← Replace with your key
RAZORPAY_KEY_SECRET="secret_XXXXX" ← Replace with your secret

# Server
NODE_ENV="production"  ✅
PORT=4000  ✅

# CORS (verify your domain)
ALLOWED_ORIGINS="https://capsulepodhotel.com,https://www.capsulepodhotel.com"
```

#### **Frontend (.env.local)**

```env
# API Endpoint (✅ Already set)
NEXT_PUBLIC_API_URL="https://api.capsulepodhotel.com"

# Razorpay (⚠️ UPDATE REQUIRED)
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_XXXXX"  ← Replace with your key
```

---

### **Domain & DNS**

- [ ] **Domain Name**: capsulepodhotel.com
  - **Status**: ✅ Active
  - **SSL Certificate**: ✅ Valid

- [ ] **Subdomains** (verify):
  - [ ] www.capsulepodhotel.com → redirects to main
  - [ ] api.capsulepodhotel.com → backend API

- [ ] **Email DNS Records** (for info@podnbeyond.com):
  - **MX Records**: Set up if using custom email
  - **SPF Record**: Prevent email spoofing
  - **DKIM**: Email authentication

---

### **Admin Dashboard Access**

- [ ] **Create Admin User**
  - **URL**: `/admin`
  - **Authentication**: Currently open (⚠️ should add password protection)
  - **Recommended**: Add basic auth or login system

- [ ] **Test All Admin Features**:
  - [ ] Overview tab
  - [ ] Brands tab
  - [ ] Properties tab
  - [ ] Bookings tab
  - [ ] Loyalty tab
  - [ ] CMS tab (image upload)
  - [ ] Payment tab (Razorpay settings)
  - [ ] OTA tab (channel connections)

---

## 8. ✅ **Testing & Quality Assurance**

### **Pre-Launch Testing Checklist**

#### **Booking Flow (Critical)**
- [ ] **Test Full Booking Process**:
  1. [ ] Select property and dates
  2. [ ] Choose room type
  3. [ ] Enter guest details
  4. [ ] Complete payment (test mode first)
  5. [ ] Receive confirmation email
  6. [ ] Verify booking appears in admin dashboard

- [ ] **Test Payment Integration**:
  - [ ] Test with Razorpay test cards first
  - [ ] Verify payment success redirects correctly
  - [ ] Verify payment failure handling
  - [ ] Check booking status updates correctly

- [ ] **Test Cancellation**:
  - [ ] Cancel a booking
  - [ ] Verify refund initiated
  - [ ] Check email notification sent

#### **User Experience**
- [ ] **Mobile Responsiveness**:
  - [ ] Homepage renders correctly on mobile
  - [ ] Booking flow works on mobile
  - [ ] Images load properly
  - [ ] Navigation menu works

- [ ] **Browser Compatibility**:
  - [ ] Chrome ✅
  - [ ] Firefox
  - [ ] Safari
  - [ ] Edge
  - [ ] Mobile browsers

- [ ] **Page Load Speed**:
  - [ ] Homepage loads in < 3 seconds
  - [ ] Images optimized
  - [ ] No console errors

#### **Content Verification**
- [ ] **All Pages Accessible**:
  - [ ] Homepage (/)
  - [ ] Brands (/brands)
  - [ ] Locations (/locations)
  - [ ] Search (/search)
  - [ ] Concept (/concept)
  - [ ] Membership (/membership)
  - [ ] Book (/book)
  - [ ] Admin (/admin)

- [ ] **No Placeholder Content**:
  - [ ] No "Lorem ipsum" text
  - [ ] No example.com emails
  - [ ] No 555-xxxx phone numbers
  - [ ] No Unsplash placeholder images (or acceptable for now)

- [ ] **All Links Work**:
  - [ ] Footer links
  - [ ] Navigation links
  - [ ] Brand pages
  - [ ] Property pages
  - [ ] Social media links (if added)

#### **SEO & Analytics**
- [ ] **Meta Tags**:
  - [ ] Homepage has proper title and description
  - [ ] All pages have unique titles
  - [ ] Open Graph tags for social sharing

- [ ] **Google Analytics** (Optional):
  - [ ] Tracking ID added
  - [ ] Events configured (bookings, page views)

- [ ] **Google Search Console**:
  - [ ] Domain verified
  - [ ] Sitemap submitted

#### **Security**
- [ ] **SSL Certificate**: ✅ Active
- [ ] **HTTPS Redirect**: ✅ Working
- [ ] **SQL Injection Protection**: ✅ (using Prisma ORM)
- [ ] **XSS Protection**: ✅ (React escaping)
- [ ] **Rate Limiting**: Consider adding for API endpoints

---

## 📸 **Image Upload Guide**

### **How to Upload Real Photos**

1. **Prepare Your Images**:
   - Resize to appropriate dimensions (1920x1080 for hero images, 800x600 for galleries)
   - Compress for web (use TinyPNG or similar)
   - Name descriptively (e.g., `kasidih-capsule-pod-interior.jpg`)

2. **Upload via Admin Dashboard**:
   - Go to `/admin` → CMS Tab
   - Click "Browse Images"
   - Select and upload your photos
   - Assign to appropriate property/room type

3. **Update Property Images**:
   - Go to `/admin` → Properties Tab
   - Edit each property
   - Upload property-specific images
   - Save changes

---

## 🎯 **Priority Levels**

### **CRITICAL (Must have before launch)**
1. ✅ Razorpay API Keys (live keys)
2. ✅ Real phone numbers and email addresses
3. ✅ Accurate property addresses
4. ✅ Correct pricing
5. ✅ Privacy Policy & Terms of Service
6. ✅ Delete test data
7. ✅ Test complete booking flow

### **HIGH (Should have before launch)**
1. ✅ Real property photos
2. ✅ Real pod/room photos
3. ✅ Updated contact information
4. ✅ Verified inventory counts
5. ✅ Mobile testing

### **MEDIUM (Good to have)**
1. ⚠️ OTA integration (can add later)
2. ⚠️ Professional logos
3. ⚠️ Social media links
4. ⚠️ Analytics setup

### **LOW (Nice to have)**
1. ○ Multiple language support
2. ○ Advanced features
3. ○ Marketing materials

---

## 📋 **Quick Pre-Demo Checklist**

For your demo TODAY, ensure these are ready:

- [ ] ✅ Website is live at capsulepodhotel.com
- [ ] ✅ Homepage looks good (9h-inspired design)
- [ ] ✅ All 4 brands display correctly
- [ ] ✅ 3 properties are listed
- [ ] ⚠️ Demo booking flow (acknowledge payment is in demo mode)
- [ ] ✅ Admin dashboard accessible and populated with data
- [ ] ✅ Mobile responsive design works
- [ ] ⚠️ Prepare to explain:
  - Multi-brand architecture
  - Loyalty program
  - Admin features
  - Future OTA integration
  - Payment integration (note: demo mode for now, will add keys before public launch)

---

## 📞 **Next Steps**

1. **Immediate (For Demo)**:
   - Review this checklist
   - Note what you can show vs. what's "coming soon"
   - Test the booking flow in demo mode
   - Prepare talking points

2. **Before Public Launch**:
   - Complete CRITICAL items
   - Add Razorpay live keys
   - Upload real photos
   - Create Privacy Policy & Terms
   - Delete test data
   - Full QA testing

3. **Post-Launch**:
   - Monitor for bugs
   - Gather user feedback
   - Add OTA integrations
   - Enhance features based on usage

---

## 💡 **Questions or Need Help?**

For each item marked ⚠️, you can:
1. Provide the information directly
2. Ask for templates (Privacy Policy, Terms)
3. Request developer assistance for technical items

**Recommendation**: Focus on CRITICAL items for public launch. Many MEDIUM/LOW items can be added iteratively post-launch.

---

**Document Version**: 1.0  
**Last Updated**: November 2, 2025  
**Next Review**: Before Public Launch

