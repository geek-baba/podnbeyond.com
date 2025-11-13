# ⚡ Quick Info Needed for Production

> **Fast reference - What you need to gather for public launch**

---

## 🔴 **CRITICAL (Must Have Before Public Launch)**

### **1. Razorpay API Keys**
**Current**: Test keys (`rzp_test_*`)  
**Need**: Live production keys

```bash
# Get from: https://dashboard.razorpay.com/app/keys
RAZORPAY_KEY_ID="rzp_live_XXXXXXXXXXXXX"
RAZORPAY_KEY_SECRET="your_secret_key_here"
```

**Update in**:
- `backend/.env`
- `frontend/.env.local`

---

### **2. Property Photos**

**Need to photograph each property**:

#### **Kasidih Property**
- [ ] Building exterior (1 photo)
- [ ] Reception area (1 photo)
- [ ] Each pod type (1-2 photos each)
- [ ] Common areas (2-3 photos)
- [ ] Facilities (bathroom, etc.)

#### **Bistupur Property**
- [ ] Same as above

#### **Sakchi Property**
- [ ] Same as above

**Specs**: 
- High resolution (1920x1080 or higher)
- Good lighting
- Professional composition
- Format: JPG or PNG

**Upload via**: Admin Dashboard → CMS Tab → Upload Images

---

### **3. Accurate Addresses**

#### **Kasidih**
- Current: Generic
- **Need**: Full address with:
  - Street/Plot number
  - Landmarks
  - Pincode
  - Directions/Google Maps link

#### **Bistupur**
- **Need**: Same as above

#### **Sakchi**
- Current: "Near Howrah Bridge, Sakchi"
- **Need**: Complete address

---

### **4. Contact Numbers**

- [ ] **Main Booking Number**: +91-90310 00931 (verify this is correct)
- [ ] **Kasidih Property**: Direct number?
- [ ] **Bistupur Property**: Direct number?
- [ ] **Sakchi Property**: (91) 82350 74555 (verify)

---

### **5. Legal Pages**

- [ ] **Privacy Policy** - Required by law
- [ ] **Terms of Service** - Required for bookings
- [ ] **Cancellation Policy** - Define your rules
- [ ] **Refund Policy** - Define process

**I can provide templates if needed!**

---

## 🟡 **HIGH PRIORITY (Recommended Before Launch)**

### **6. Property Details**

For each property, confirm:
- [ ] Check-in time: _____ (e.g., 2:00 PM)
- [ ] Check-out time: _____ (e.g., 11:00 AM)
- [ ] Exact amenities list
- [ ] Nearby attractions/landmarks
- [ ] Directions from airport/railway station

---

### **7. Room Pricing Verification**

Confirm these are correct:

| Room Type | Current Price | Correct? | Update To |
|-----------|--------------|----------|-----------|
| Capsule Pod | ₹999/night | □ Yes □ No | ₹____ |
| Single Pod | ₹1,499-₹1,999 | □ Yes □ No | ₹____ |
| Double Pod | ₹1,999-₹2,499 | □ Yes □ No | ₹____ |
| Bunk Pod | ₹1,299-₹2,299 | □ Yes □ No | ₹____ |
| Tri Pod | ₹2,699 | □ Yes □ No | ₹____ |
| Quadra Pod | ₹2,899-₹2,999 | □ Yes □ No | ₹____ |
| Queen Pod | ₹2,999 | □ Yes □ No | ₹____ |
| King Pod | ₹3,699 | □ Yes □ No | ₹____ |

---

### **8. Delete Test Data**

Before accepting real bookings:
- [ ] Delete 5 test bookings (via Admin → Bookings)
- [ ] Delete 4 test loyalty accounts (via Admin → Loyalty)

---

## 🟢 **NICE TO HAVE (Can Add Later)**

### **9. Enhanced Content**

- [ ] Professional brand logos (currently using SVG placeholders)
- [ ] Video tour of properties
- [ ] Customer testimonials (real)
- [ ] Staff photos
- [ ] Virtual 360° tours

---

### **10. OTA Integration**

Can be added after launch:
- [ ] Booking.com - API keys
- [ ] MakeMyTrip - API keys
- [ ] Airbnb - Property connection
- [ ] Goibibo - API keys

---

## 📝 **For Your Demo TODAY**

### **What to Emphasize**

✅ **Working Features**:
- Multi-brand architecture (unique in India)
- 9h-inspired minimalist design
- Full booking system (demo mode)
- Admin dashboard (8 tabs)
- Loyalty program
- Mobile responsive

⚠️ **Demo Mode Items** (explain these):
- "Payment in test mode - will enable live keys before launch"
- "Using professional stock photos - real photos coming soon"
- "Test bookings for demonstration - will be removed"
- "OTA channels ready to connect post-launch"

---

## 🚀 **Post-Demo Next Steps**

1. **Get Razorpay Live Keys** (30 minutes)
   - Login to Razorpay
   - Generate production keys
   - Update environment files

2. **Schedule Photoshoot** (1 day)
   - Hire photographer or DIY
   - Capture all properties
   - Upload via CMS

3. **Create Legal Pages** (2-3 hours)
   - Privacy Policy (template available)
   - Terms of Service (template available)
   - Cancellation/Refund policies

4. **Clean Test Data** (5 minutes)
   - Delete test bookings
   - Delete test loyalty accounts

5. **Final QA Testing** (1-2 hours)
   - Test booking with live keys
   - Mobile testing
   - Browser testing

6. **Public Launch** 🎉

---

## 📞 **Quick Reference**

**Live URLs**:
- Homepage: https://capsulepodhotel.com
- Admin: https://capsulepodhotel.com/admin
- Brands: https://capsulepodhotel.com/brands
- Booking: https://capsulepodhotel.com/book

**Current Status**:
- ✅ Website: Live and functional
- ✅ Design: Complete (9h-inspired)
- ✅ Features: All implemented
- ⚠️ Payments: Test mode
- ⚠️ Photos: Stock placeholders
- ⚠️ Test Data: Needs cleanup

**Timeline to Public Launch**:
- With Razorpay keys + photos: 1-2 days
- Without photos (acceptable): Same day (just add keys)

---

**You're ready for an impressive demo!** 🎉

