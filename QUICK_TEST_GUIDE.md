# 🧪 Quick Testing Guide - What to Check

You should now have **8 browser tabs** open. Here's what to verify in each:

---

## Tab 1: Homepage (`/index-new`)

**Quick Checks:**
- ✅ Hero image loads (beach/hotel background)
- ✅ "POD N BEYOND | Smart Hotel" title visible
- ✅ Header transparent over hero
- ✅ Scroll down → See search widget
- ✅ Scroll more → See 4 brand cards:
  - Blue: POD N BEYOND | Capsule (1 Location)
  - Amber: POD N BEYOND | Smart (2 Locations)
  - Pink: POD N BEYOND | Sanctuary (Coming Soon)
  - Green: POD N BEYOND | Sauna+Sleep (Coming Soon)
- ✅ Footer at bottom

**Try clicking:**
- "Explore Brands" → Scrolls to brand grid
- Any brand card → Goes to brand detail page

---

## Tab 2: Brands (`/brands`)

**Quick Checks:**
- ✅ Dark hero section: "Our Brands"
- ✅ Filter buttons: All Brands | Active | Coming Soon
- ✅ Shows "4 Brands"
- ✅ 4 brand cards displayed

**Try clicking:**
- "Active" filter → Shows only 2 brands (Capsule, Smart)
- "Coming Soon" → Shows only 2 brands (Sanctuary, Sauna)
- "All Brands" → Shows all 4 again
- Click any brand card → Goes to detail page

---

## Tab 3: Capsule Brand (`/brands/capsule`)

**Quick Checks:**
- ✅ Blue capsule logo
- ✅ Title: "POD N BEYOND | Capsule"
- ✅ Tagline: "Budget-Friendly Capsule Experience"
- ✅ "View 1 Location" button
- ✅ Features list with blue checkmarks
- ✅ Amenities list
- ✅ 1 property card (Kasidih)

**Try clicking:**
- Property card → Goes to location detail
- "Back to All Brands" → Goes to /brands

---

## Tab 4: Smart Brand (`/brands/smart`)

**Quick Checks:**
- ✅ Amber/gold smart logo
- ✅ Title: "POD N BEYOND | Smart"
- ✅ "View 2 Locations" button
- ✅ 2 property cards (Bistupur, Sakchi)

---

## Tab 5: Kasidih Location (`/locations/...`)

**Quick Checks:**
- ✅ Breadcrumb: Home / Brands / Capsule / Property
- ✅ Property name: "Capsule Pod Hotel"
- ✅ Rating: 4.5 stars
- ✅ Main image displays
- ✅ Thumbnail gallery (if multiple images)
- ✅ "About This Property" section
- ✅ Features with checkmarks
- ✅ Amenities grid
- ✅ Contact sidebar (right side, sticky)
- ✅ Address, phone, email
- ✅ "Available Pods" section
- ✅ Room cards with prices

**Try clicking:**
- Thumbnail → Changes main image
- "Book This Location" → Goes to booking page
- "Book" on a pod → Goes to booking with room

---

## Tab 6: Search Results (`/search`)

**Quick Checks:**
- ✅ Title: "Search Results"
- ✅ "Found 3 properties"
- ✅ Brand filter dropdown
- ✅ Sort dropdown
- ✅ 3 property cards displayed

**Try:**
- Brand filter → Select "Capsule" → Shows 1 property
- Brand filter → Select "Smart" → Shows 2 properties
- Sort by → Name → Properties reorder alphabetically

---

## Tab 7: Concept Page (`/concept`)

**Quick Checks:**
- ✅ Hero: "Our Concept - Sleep. Simplified. Elevated."
- ✅ Vision section with paragraph
- ✅ 2-column layout (text + image)
- ✅ Core Values: 4 cards with icons
- ✅ Multi-brand strategy section (dark background)
- ✅ 4 colored boxes for each brand
- ✅ Future expansion section
- ✅ Stats: "10+ Cities", "50+ Properties", "4 Brands"

---

## Tab 8: Membership Page (`/membership`)

**Quick Checks:**
- ✅ Hero: "POD N BEYOND Circle"
- ✅ How It Works: 3 steps (1, 2, 3)
- ✅ 3 membership cards:
  - Silver: Free, gray star
  - Gold: ₹999/year, amber star, "Most Popular" badge
  - Platinum: ₹2,499/year, gray star
- ✅ Each card has benefits list
- ✅ Points system section (2 columns)
- ✅ FAQ section (collapsible questions)
- ✅ Dark CTA section at bottom

**Try:**
- Click FAQ → Should expand/collapse
- Click "Book Your First Stay" → Goes to booking

---

## Tab 9: Booking Page (`/book`)

**Quick Checks:**
- ✅ Progress steps: 1 → 2 → 3
- ✅ Step 1 active (filled circle)
- ✅ Property dropdown (3 properties)
- ✅ Check-in date picker
- ✅ Check-out date picker
- ✅ Guests dropdown
- ✅ Booking summary sidebar (right)

**Try the booking flow:**

**Step 1:**
1. Select a property (e.g., "Capsule Pod Hotel")
2. Select check-in date (today or future)
3. Select check-out date (after check-in)
4. Select 2 guests
5. Click "Continue to Guest Information"
6. ✅ Should go to Step 2

**Step 2:**
1. Fill name: "Test User"
2. Fill email: "test@example.com"
3. Fill phone: "+91 98765 43210"
4. (Optional) Add special request
5. Click "Continue to Payment"
6. ✅ Should go to Step 3

**Step 3:**
1. See "Demo Mode" notice (blue box)
2. See Razorpay logo
3. Click "Complete Booking (Demo)"
4. ✅ Should show alert: "Booking functionality... demo"

---

## 🔍 Console Check

**In any tab:**
1. Press `F12` (or `Cmd+Option+I` on Mac)
2. Click "Console" tab
3. Look for errors (red text)

**Expected:**
- ✅ No red errors
- ⚠️ Warnings are OK (yellow)
- ℹ️ Info messages are OK (blue)

**Common acceptable warnings:**
- Image optimization warnings
- Next.js dev mode warnings
- React strict mode warnings

---

## 📱 Mobile Test

**Quick mobile test:**
1. Keep DevTools open (F12)
2. Click "Toggle Device Toolbar" icon (or `Cmd+Shift+M`)
3. Select "iPhone 12 Pro" or "iPad"
4. Reload page
5. Check:
   - ✅ Layout adjusts to mobile
   - ✅ Hamburger menu appears in header
   - ✅ Click hamburger → Menu opens
   - ✅ Text is readable
   - ✅ Buttons are tappable

Test on: Homepage, Brands, Location detail

---

## ✅ Quick Checklist

**If all these work, you're good to go:**

- [ ] All 8 pages load without errors
- [ ] Brand cards show 4 brands
- [ ] Property listings display
- [ ] Images load (placeholder OK)
- [ ] Navigation works (header links)
- [ ] Filters work (brands page, search page)
- [ ] Booking form validates (try submitting empty)
- [ ] Mobile hamburger menu works
- [ ] No console errors (red text)
- [ ] Brand colors display correctly

**Expected placeholders/limitations:**
- ✅ Images are stock photos (Unsplash) - Will replace with real photos
- ✅ Payment is demo mode - Will integrate Razorpay in production
- ✅ Some links go nowhere (e.g., "Locations" in header) - Not built yet

---

## 🐛 Found an Issue?

**If something doesn't work:**

1. Check browser console for errors
2. Verify both servers are running:
   - Backend: `http://localhost:4000/api/health`
   - Frontend: `http://localhost:3000`
3. Try hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
4. Clear Next.js cache:
   ```bash
   cd /Users/shwet/github/podnbeyond.com/frontend
   rm -rf .next
   npm run dev
   ```

---

## 🎉 Test Complete!

**If everything looks good:**
- ✅ Website is working perfectly!
- ✅ Ready for production deployment
- ✅ All core features functional

**Next steps:**
1. Replace placeholder images with real photos
2. Update content (descriptions, contact info)
3. Configure Razorpay for real payments
4. Deploy to production!

---

*Quick Test Guide - November 2, 2025*

