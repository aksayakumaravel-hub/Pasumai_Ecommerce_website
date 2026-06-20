# Pasumai Integrated Farm - Complete Handover Document

**Version:** 1.0.0
**Last Updated:** June 20, 2026
**Purpose:** Full technical documentation for independent deployment outside Bolt

---

## Executive Summary

Pasumai Integrated Farm is a full-stack e-commerce and booking platform for an organic farm business. It includes:

- **E-Commerce:** Product catalog with cart, checkout, and payment processing
- **Cottage Stays:** Booking system with availability management
- **Farm Visits:** Tour booking with time slots
- **Event Halls:** Party and conference hall reservations
- **Admin Dashboard:** Complete management interface
- **Delivery Zone System:** GPS-based 20 KM delivery validation
- **Notification System:** Real-time notifications with preferences

---

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Environment Variables](#environment-variables)
3. [External Services](#external-services)
4. [Database Schema](#database-schema)
5. [Authentication](#authentication)
6. [Storage Buckets](#storage-buckets)
7. [Edge Functions](#edge-functions)
8. [Notification Services](#notification-services)
9. [Delivery Zone System](#delivery-zone-system)
10. [Payment Integration](#payment-integration)
11. [Deployment Instructions](#deployment-instructions)
12. [Testing Checklist](#testing-checklist)
13. [Troubleshooting](#troubleshooting)

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI framework |
| TypeScript | 5.5.3 | Type safety |
| Vite | 5.4.2 | Build tool |
| Tailwind CSS | 3.4.1 | Styling |
| Lucide React | 0.344.0 | Icons |

### Backend

| Technology | Purpose |
|------------|---------|
| Supabase | Database, Auth, Storage, Edge Functions, Real-time |
| Razorpay | Payment gateway (UPI, Cards, Net Banking) |
| Deno | Edge Functions runtime |

---

## Environment Variables

### Required Frontend Variables

Create `.env` in project root:

```env
# Supabase (REQUIRED)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to find:**
- `VITE_SUPABASE_URL`: Supabase Dashboard → Settings → API → Project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase Dashboard → Settings → API → Project API keys → anon public

### Required Edge Function Secrets

Set in Supabase Dashboard → Edge Functions → Manage → Secrets:

```env
# Razorpay (REQUIRED for payments)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
```

**Where to find:**
- Razorpay Dashboard → Settings → API Keys → Generate Key

---

## External Services

### 1. Supabase (Required)

| Feature | Purpose | Status |
|---------|---------|--------|
| PostgreSQL | Primary database | Required |
| GoTrue | Authentication | Required |
| Storage | Image/file uploads | Required |
| Realtime | Live notifications | Required |
| Edge Functions | Server-side logic | Required |
| RLS | Row-level security | Required |

**Plan:** Free tier sufficient for development; Pro tier for production.

### 2. Razorpay (Required for Payments)

| Feature | Purpose |
|---------|---------|
| Orders API | Create payment orders |
| Payments API | Verify payments |
| Checkout | Payment UI |

**Required Setup:**
1. Create Razorpay account
2. Complete business KYC
3. Generate API keys (Test mode for dev, Live mode for production)
4. Webhook URL (optional): `https://your-domain.com/api/razorpay-webhook`

---

## Database Schema

### Tables Overview

| Table | Description |
|-------|-------------|
| `profiles` | User profiles with role (customer/admin) |
| `products` | Farm products for sale |
| `product_categories` | Product categorization |
| `orders` | Customer orders |
| `order_items` | Items in each order |
| `cottages` | Cottage listings |
| `cottage_bookings` | Cottage reservations |
| `farm_visits` | Farm tour bookings |
| `hall_bookings` | Event hall bookings |
| `contact_messages` | Contact form submissions |
| `gallery_items` | Photo/video gallery |
| `notifications` | User notifications |
| `notification_preferences` | User notification settings |
| `notification_campaigns` | Bulk notification campaigns |
| `notification_templates` | Reusable templates |
| `push_subscriptions` | Web push subscriptions |
| `delivery_hubs` | Delivery hub locations |
| `delivery_zones` | Zone configurations |
| `supported_pincodes` | Serviceable pincodes |
| `service_areas` | Service area mapping |
| `user_addresses` | Saved user addresses |

### Key Relationships

```
profiles (id) ←── user_id ── orders
                                └── order_items ← product_id ── products

profiles (id) ←── user_id ── user_addresses
                                └── nearest_hub_id ── delivery_hubs

delivery_hubs (id) ←── hub_id ── delivery_zones
                               └── supported_pincodes
                               └── service_areas

orders (id) ←── order_id ── order_items
         └── delivery_hub_id ── delivery_hubs
         └── delivery_address_id ── user_addresses
```

### Migration Files (Run in Order)

| # | File | Purpose |
|---|------|---------|
| 1 | `20260605133025_pasumai_farm_schema.sql` | Initial schema (profiles, products, orders, cottages, visits, halls, gallery) |
| 2 | `20260605140410_pasumai_enhancements.sql` | Enhancements and additional fields |
| 3 | `20260605143354_fix_user_id_defaults.sql` | User ID default fixes |
| 4 | `20260619051053_add_razorpay_and_storage.sql` | Razorpay fields and storage setup |
| 5 | `20260619053549_admin_and_notification_system.sql` | Admin auto-assign, notifications, preferences |
| 6 | `20260619055632_fix_profiles_rls_recursion.sql` | Fix RLS recursion (CRITICAL) |
| 7 | `20260619055720_fix_rls_recursion_part1.sql` | RLS fix part 1 |
| 8 | `20260619055734_fix_rls_recursion_part2.sql` | RLS fix part 2 |
| 9 | `20260619055748_fix_rls_recursion_part3.sql` | RLS fix part 3 |
| 10 | `20260619055802_fix_rls_recursion_part4.sql` | RLS fix part 4 |
| 11 | `20260619055906_fix_storage_rls_recursion.sql` | Storage RLS fix |
| 12 | `20260620022858_delivery_zone_management.sql` | Delivery hubs, zones, pincodes, addresses |

**Critical Note:** Do NOT skip any RLS recursion fix migrations or the app will fail with "infinite recursion" errors.

---

## Authentication

### Provider Configuration

| Setting | Value |
|---------|-------|
| Provider | Supabase Auth (email/password) |
| Email Confirmation | OFF (simpler UX) |
| Password Reset | Enabled |
| Session Duration | Default (7 days) |

### Admin Users

Two emails are auto-assigned admin role on signup:

```
aksayakumaravel@gmail.com
mkumaran3577@gmail.com
```

**To add more admins:**
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'new-admin@email.com';
```

### RLS Helper Function

The `is_admin()` function is used throughout RLS policies:

```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER;
```

### Session Management

- Sessions stored in localStorage via Supabase client
- Auto-refresh on page load
- Session persisted across refreshes

---

## Storage Buckets

### Required Buckets

Create in Supabase Dashboard → Storage:

| Bucket | Purpose | Public Read | Authenticated Write |
|--------|---------|-------------|---------------------|
| `product-images` | Product photos | Yes | Admin only |
| `gallery` | Farm gallery | Yes | Admin only |
| `cottage-images` | Cottage photos | Yes | Admin only |
| `hall-images` | Hall photos | Yes | Admin only |

### Storage Policies

Each bucket requires:
1. **Public read policy:** Allow anyone to view images
2. **Admin write policy:** Only admins can upload/edit/delete

### File Validation

| Setting | Value |
|---------|-------|
| Max file size | 10 MB |
| Allowed types | JPG, PNG, WebP, GIF |
| Auto-compression | Yes (max 1920px, 80% quality) |

---

## Edge Functions

### Function: `razorpay-payment`

**File:** `supabase/functions/razorpay-payment/index.ts`

**Endpoints:**

| Action | Description |
|--------|-------------|
| `create_order` | Create Razorpay order |
| `verify_payment` | Verify payment signature |
| `update_payment_status` | Update order payment status |

**Required Secrets:**
```env
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=secret
```

**Flow:**
1. Frontend calls `create_order` with amount and record ID
2. Edge function creates Razorpay order via API
3. Razorpay order ID stored in database
4. User completes payment in Razorpay checkout
5. Frontend calls `update_payment_status` with signature
6. Edge function verifies signature, updates payment status
7. Notification created for user

**Deploy:**
```bash
# Using Supabase CLI
supabase functions deploy razorpay-payment

# Or copy-paste in Supabase Dashboard → Edge Functions
```

---

## Notification Services

### Notification Types

| Type | Color | Use Case |
|------|-------|----------|
| `success` | Green | Successful payment, booking confirmed |
| `info` | Blue | Order updates, delivery status |
| `warning` | Amber | Low stock, action required |
| `error` | Red | Payment failed, system error |

### Notification Categories

| Category | Description |
|----------|-------------|
| `order` | Order-related notifications |
| `delivery` | Delivery status updates |
| `payment` | Payment confirmations |
| `booking` | Cottage/visit/hall bookings |
| `promotion` | Promotional offers |
| `farm` | Farm updates |

### User Preferences Table

Every user gets default notification preferences:
```sql
-- Auto-created via trigger
INSERT INTO notification_preferences (user_id) VALUES (auth.uid());
```

| Preference | Default |
|------------|---------|
| `order_updates` | true |
| `delivery_updates` | true |
| `payment_updates` | true |
| `booking_updates` | true |
| `promotions` | true |
| `farm_updates` | true |
| `push_enabled` | true |
| `email_enabled` | true |

### Real-time Subscriptions

Notifications use Supabase Realtime for instant delivery:

```typescript
supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
  }, (payload) => {
    // Handle new notification
  })
  .subscribe();
```

### Browser Push Notifications

Optional browser push notifications:
1. Permission requested via `Notification.requestPermission()`
2. Subscription stored in `push_subscriptions` table
3. Admin can send bulk notifications via campaigns

---

## Delivery Zone System

### Configuration

| Setting | Paravai Hub | Kalladipatti Hub |
|---------|-------------|------------------|
| Name | Paravai Distribution Hub | Kalladipatti Farm Hub |
| Location | Madurai District | Dindigul District |
| Service Radius | 20 KM | 20 KM |
| Min Delivery Charge | ₹30 | ₹30 |
| Per KM Charge | ₹2 | ₹2 |
| Free Delivery Min | ₹500 | ₹500 |
| Est. Delivery Time | 45-60 minutes | 45-60 minutes |

### GPS Coordinates (in database)

| Hub | Latitude | Longitude |
|-----|----------|-----------|
| Paravai | 9.8833 | 78.0833 |
| Kalladipatti | 10.3500 | 77.8500 |

### Supported Pincodes

Madurai District (Paravai Hub): 625001-625020, 625401-625409
Dindigul District (Kalladipatti Hub): 624001-624010, 624211-624220, 624301-624308

### Distance Calculation

Uses Haversine formula for GPS distance:

```typescript
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  // ... trigonometric calculation
  return distanceInKm;
}
```

### Delivery Eligibility Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    User Location Input                           │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│  │ GPS Location    │ OR │ Pincode Entry  │ OR │ Saved Address│ │
│  └────────┬────────┘    └────────┬────────┘    └──────┬───────┘ │
│           │                      │                     │         │
│           └──────────────────────┴─────────────────────┘         │
│                                  │                               │
│                    ┌─────────────▼─────────────┐                 │
│                    │  Calculate Distance to    │                 │
│                    │  Both Hubs                │                 │
│                    └─────────────┬─────────────┘                 │
│                                  │                               │
│                    ┌─────────────▼─────────────┐                 │
│                    │  Select Nearest Hub       │                 │
│                    └─────────────┬─────────────┘                 │
│                                  │                               │
│                    ┌─────────────▼─────────────┐                 │
│                    │  Distance <= 20 KM?        │                │
│                    └─────────────┬─────────────┘                 │
│                          ┌───────┴───────┐                       │
│                          │               │                       │
│                     YES  │               │ NO                    │
│                    ┌─────▼─────┐   ┌─────▼─────┐                 │
│                    │ Available │   │ Not Avail │                 │
│                    │ Show:     │   │ Show:     │                 │
│                    │ - Hub     │   │ - Error   │                 │
│                    │ - Dist    │   │ - Contact │                 │
│                    │ - Charge  │   │   Options │                 │
│                    │ - ETA     │   │           │                 │
│                    └───────────┘   └───────────┘                 │
└──────────────────────────────────────────────────────────────────┘
```

### Non-Serviceable Location Handling

When outside 20 KM zone:
1. Display: "Sorry, we currently do not deliver to your location"
2. Show: "Outside 20 KM service zone"
3. Disable: Add to Cart, Buy Now, Place Order
4. Provide contact options:
   - Contact Us button → Contact page
   - Call Now button → `tel:+919952814029`
   - WhatsApp button → `https://wa.me/919952814029`

---

## Payment Integration

### Razorpay Configuration

```typescript
const options = {
  key: 'rzp_test_xxxxx', // Exposed to frontend (safe)
  amount: 50000, // In paise
  currency: 'INR',
  name: 'Pasumai Integrated Farm',
  description: 'Order #XXXX',
  order_id: 'order_xxxxx', // Created server-side
  handler: async (response) => {
    // Verify payment
  },
  prefill: {
    name: 'Customer Name',
    email: 'customer@email.com',
    contact: '9999999999'
  },
  theme: {
    color: '#15803d' // Green
  },
  method: {
    upi: true,
    card: true,
    netbanking: true,
    wallet: true,
    emi: true
  }
};
```

### Payment Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Frontend   │    │ Edge Func   │    │  Razorpay   │    │  Database   │
│             │    │             │    │     API     │    │             │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │                  │
       │ 1. Place Order   │                  │                  │
       │──────────────────▶                  │                  │
       │                  │ 2. Create Order │                  │
       │                  │─────────────────▶│                  │
       │                  │◀───── Order ID ─│                  │
       │◀───── Order ─────│                  │                  │
       │                  │                  │                  │
       │ 3. Open Checkout │                  │                  │
       │─────────────────────────────────────▶│                  │
       │                  │                  │ 4. User Pays      │
       │◀──── Payment ────────────────────────│                  │
       │    Details       │                  │                  │
       │                  │                  │                  │
       │ 5. Verify Payment                  │                  │
       │─────────────────▶│                  │                  │
       │                  │ 6. Verify Sig   │                  │
       │                  │─────────────────────────────────────▶
       │                  │                  │                  │
       │                  │ 7. Update Status │                  │
       │                  │─────────────────────────────────────▶
       │                  │                  │                  │
       │◀──── Success ────│                  │                  │
       │                  │                  │                  │
```

### UPI QR Code

Alternative payment via UPI QR:
- Generated dynamically for each order
- Shows order amount and reference
- Manual confirmation available

---

## Deployment Instructions

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Enter project name: `pasumai-farm`
4. Set secure database password
5. Select region closest to users
6. Wait for project to provision

### Step 2: Configure Environment

1. Get credentials from Settings → API:
   - Project URL → `VITE_SUPABASE_URL`
   - anon public key → `VITE_SUPABASE_ANON_KEY`

2. Create `.env` file:
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGci...
   ```

### Step 3: Run Migrations

**Option A: Using Supabase Dashboard**
1. Go to SQL Editor
2. Create new query
3. Copy and paste each migration file (in order)
4. Run each migration

**Option B: Using Supabase CLI**
```bash
supabase link --project-ref your-project-id
supabase db push
```

### Step 4: Create Storage Buckets

1. Go to Storage → New Bucket
2. Create: `product-images`, `gallery`, `cottage-images`, `hall-images`
3. Enable "Public bucket" for each

### Step 5: Deploy Edge Function

1. Go to Edge Functions → Create Function
2. Name: `razorpay-payment`
3. Copy code from `supabase/functions/razorpay-payment/index.ts`
4. Set secrets:
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`

### Step 6: Configure Authentication

1. Go to Authentication → Providers
2. Verify Email provider is enabled
3. Disable email confirmation (optional)
4. Add redirect URLs for your domain

### Step 7: Build and Deploy

```bash
# Install dependencies
npm install

# Build production bundle
npm run build

# Deploy to Vercel (recommended)
npx vercel

# Or deploy to Netlify
# - Connect Git repo
# - Set build command: npm run build
# - Set output directory: dist
```

### Step 8: Configure Domain

1. Add custom domain in hosting platform
2. Update Supabase redirect URLs
3. Update any hardcoded URLs if needed

---

## Testing Checklist

### Pre-Launch Tests

- [ ] **Sign Up Flow**
  - Create new account
  - Verify profile created
  - Verify notification preferences created

- [ ] **Sign In Flow**
  - Login with credentials
  - Verify session persists on refresh
  - Verify logout clears session

- [ ] **Admin Access**
  - Login with admin email
  - Verify Admin panel visible
  - Test all admin tabs

- [ ] **Product Flow**
  - Browse products
  - Add to cart
  - Update quantities
  - Remove items

- [ ] **Delivery Check**
  - Test GPS location detection
  - Test pincode validation
  - Test with serviceable pincode (625001)
  - Test with non-serviceable pincode (600001)
  - Verify contact options shown

- [ ] **Checkout Flow**
  - Complete delivery details
  - Verify delivery charges calculated
  - Test payment modal opens

- [ ] **Payment Flow (Test Mode)**
  - Use test card: 4111 1111 1111 1111
  - Complete payment
  - Verify order status updates
  - Verify notification received

- [ ] **Booking Flows**
  - Test cottage booking
  - Test farm visit booking
  - Test hall booking

- [ ] **Image Uploads**
  - Test product image upload (admin)
  - Test gallery image upload (admin)

- [ ] **Notifications**
  - Check notification bell
  - Test mark as read
  - Test notification preferences

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "infinite recursion detected" RLS error | Missing RLS recursion fix | Run all `fix_rls_recursion` migrations |
| Auth state lost on refresh | Supabase client misconfigured | Check `supabaseUrl` and `supabaseKey` |
| Payments fail silently | Missing Razorpay secrets | Set secrets in Edge Function |
| Admin panel shows "Access Restricted" | User not admin | Update `profiles.role = 'admin'` |
| Images not uploading | Storage bucket missing | Create required buckets |
| Delivery check returns false negative | Pincode not in database | Add pincode to `supported_pincodes` |
| Notifications not real-time | Realtime not enabled | Enable Realtime for notifications table |

### Error Logs

Check logs in:
- **Frontend:** Browser console
- **Edge Functions:** Supabase Dashboard → Edge Functions → Logs
- **Database:** Supabase Dashboard → Logs → Postgres

### Support Contacts

- Technical: aksayakumaravel@gmail.com
- Business: mkumaran3577@gmail.com
- Phone: +91 99528 14029
- WhatsApp: https://wa.me/919952814029

---

## Configuration Summary

### Essential Configuration

| Item | Location | Status |
|------|----------|--------|
| Supabase Project | supabase.com | Required |
| Database Tables | 12 migrations | Auto-created |
| Storage Buckets | 4 buckets | Manual creation |
| Edge Function | 1 function | Deploy required |
| Environment Variables | 2 frontend | .env file |
| Function Secrets | 2 secrets | Dashboard config |
| Admin Emails | 2 emails | Auto-assigned |

### Optional Configuration

| Item | Purpose |
|------|---------|
| Custom domain | Branding |
| Web push VAPID keys | Browser notifications |
| Google Maps API | Enhanced location |
| Email templates | Custom emails |

---

## File Structure Reference

```
project/
├── .env                              # Environment variables
├── .env.example                      # Template
├── DEPLOYMENT.md                     # Deployment guide
├── HANDOVER.md                       # This document
├── package.json                      # Dependencies
├── vite.config.ts                    # Build config
├── index.html                        # Entry HTML
├── src/
│   ├── App.tsx                       # Main app component
│   ├── main.tsx                      # Entry point
│   ├── index.css                     # Global styles
│   ├── components/
│   │   ├── DeliveryZoneChecker.tsx   # Delivery validation UI
│   │   ├── DeliveryStatusBanner.tsx  # Location banner
│   │   ├── FarmBanner.tsx            # Hero banner
│   │   ├── FarmLogo.tsx              # Logo component
│   │   ├── Footer.tsx                 # Site footer
│   │   ├── Navbar.tsx                 # Navigation
│   │   ├── NotificationCenter.tsx    # Notifications panel
│   │   └── UpiQrCode.tsx              # UPI QR generator
│   ├── context/
│   │   ├── AuthContext.tsx           # Authentication state
│   │   ├── CartContext.tsx           # Shopping cart state
│   │   └── DeliveryContext.tsx       # Delivery zone state
│   ├── lib/
│   │   ├── supabase.ts               # Supabase client & types
│   │   ├── razorpay.ts               # Payment integration
│   │   ├── storage.ts                # File upload utils
│   │   └── assets.ts                 # Asset helpers
│   └── pages/
│       ├── AdminPage.tsx             # Admin dashboard
│       ├── AuthPage.tsx              # Login/signup
│       ├── CartPage.tsx              # Shopping cart
│       ├── ContactPage.tsx           # Contact form
│       ├── CottagesPage.tsx          # Cottage bookings
│       ├── DashboardPage.tsx         # User dashboard
│       ├── FarmVisitsPage.tsx        # Farm visit booking
│       ├── GalleryPage.tsx           # Photo gallery
│       ├── HallBookingPage.tsx       # Hall booking
│       ├── HomePage.tsx              # Homepage
│       └── ShopPage.tsx              # Product shop
└── supabase/
    ├── migrations/                   # 12 SQL migration files
    └── functions/
        └── razorpay-payment/
            └── index.ts              # Payment edge function
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-06-20 | Initial production release |

---

**Document prepared by:** Bolt AI
**Last verified:** 2026-06-20
