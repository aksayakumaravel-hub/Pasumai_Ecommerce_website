# Pasumai Integrated Farm - Deployment Guide

This guide provides complete instructions for deploying the Pasumai Integrated Farm application outside of Bolt.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [External Services](#external-services)
4. [Database Setup](#database-setup)
5. [Authentication](#authentication)
6. [Storage Buckets](#storage-buckets)
7. [Edge Functions](#edge-functions)
8. [Deployment Steps](#deployment-steps)
9. [Post-Deployment Verification](#post-deployment-verification)

---

## Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Razorpay business account (for payments)
- Domain name (optional, for production)

## Environment Variables

### Frontend (.env)

Create a `.env` file in the project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional: Google Maps API for enhanced location services
# VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

### Edge Function Secrets

Set these secrets in Supabase Dashboard > Edge Functions > Secrets:

```env
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
```

---

## External Services

### 1. Supabase (Required)

**Purpose:** Database, Authentication, Storage, Edge Functions, Real-time

**Setup Steps:**
1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. Note down:
   - Project URL (`VITE_SUPABASE_URL`)
   - Anon/Public Key (`VITE_SUPABASE_ANON_KEY`)
   - Service Role Key (for Edge Functions only - keep secret!)

### 2. Razorpay (Required for Payments)

**Purpose:** Payment processing (UPI, Cards, Net Banking, Wallets)

**Setup Steps:**
1. Create business account at [razorpay.com](https://razorpay.com)
2. Complete KYC verification
3. Generate API Keys from Dashboard > Settings > API Keys
4. For testing, use Test Mode keys
5. For production, use Live Mode keys

**Key Details:**
- Key ID: Starts with `rzp_test_` or `rzp_live_`
- Key Secret: Keep this secure!

**Note:** The Razorpay Key ID is also exposed to frontend (it's public), but the Secret is server-side only.

---

## Database Setup

### Step 1: Run Migrations

All migrations are in `/supabase/migrations/`. Run them in order:

```sql
-- 1. Initial schema
20260605133025_pasumai_farm_schema.sql

-- 2. Enhancements
20260605140410_pasumai_enhancements.sql

-- 3. User ID defaults fix
20260605143354_fix_user_id_defaults.sql

-- 4. Razorpay and storage
20260619051053_add_razorpay_and_storage.sql

-- 5. Admin and notifications
20260619053549_admin_and_notification_system.sql

-- 6. RLS recursion fixes (must be run)
20260619055632_fix_profiles_rls_recursion.sql
20260619055720_fix_rls_recursion_part1.sql
20260619055734_fix_rls_recursion_part2.sql
20260619055748_fix_rls_recursion_part3.sql
20260619055802_fix_rls_recursion_part4.sql
20260619055906_fix_storage_rls_recursion.sql

-- 7. Delivery zone management
20260620022858_delivery_zone_management.sql
```

**Using Supabase CLI:**
```bash
supabase db push
```

**Using Supabase Dashboard:**
Go to SQL Editor and run each migration file content.

### Step 2: Database Tables Created

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (name, phone, role) |
| `products` | Farm products for sale |
| `product_categories` | Product categories |
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
| `notification_templates` | Reusable notification templates |
| `delivery_hubs` | Delivery hub locations |
| `delivery_zones` | Delivery zone configurations |
| `supported_pincodes` | Serviceable pincodes |
| `service_areas` | Service areas by hub |
| `user_addresses` | Saved user addresses |

### Step 3: Set Admin User

After first signup, update the user's role to admin:

```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'admin@example.com';
-- Or by user ID:
-- WHERE id = 'user-uuid';
```

---

## Authentication

### Supabase Auth Configuration

1. Go to Supabase Dashboard > Authentication > Providers
2. Enable **Email** provider (already enabled by default)
3. Configure:
   - Enable email confirmations: OFF (for simpler UX)
   - Secure email change: ON
   - Secure password change: ON

### Auth Flow

- **Sign Up:** Creates user in `auth.users`, profile auto-created via trigger
- **Sign In:** Standard email/password login
- **Session:** JWT tokens, managed by Supabase client
- **Sign Out:** Clears local session

### RLS Policies

All tables use Row Level Security:
- Users can only read/write their own data
- Admins can read/write all data
- Public data (products, cottages, gallery) is readable by all

---

## Storage Buckets

### Required Buckets

Create these buckets in Supabase Dashboard > Storage:

| Bucket | Purpose | Public Access |
|--------|---------|---------------|
| `product-images` | Product photos | Read: Public, Write: Admin |
| `gallery` | Farm gallery images/videos | Read: Public, Write: Admin |
| `cottage-images` | Cottage photos | Read: Public, Write: Admin |
| `hall-images` | Event hall photos | Read: Public, Write: Admin |

### Creating Buckets

1. Go to Storage > New Bucket
2. Name: `product-images`
3. Enable "Public bucket"
4. Repeat for each bucket

### Storage RLS Policies

Run this SQL:

```sql
-- Allow public read access
CREATE POLICY "public_read_product_images" ON storage.objects
  FOR SELECT TO PUBLIC USING (bucket_id = 'product-images');
CREATE POLICY "public_read_gallery" ON storage.objects
  FOR SELECT TO PUBLIC USING (bucket_id = 'gallery');
CREATE POLICY "public_read_cottage_images" ON storage.objects
  FOR SELECT TO PUBLIC USING (bucket_id = 'cottage-images');
CREATE POLICY "public_read_hall_images" ON storage.objects
  FOR SELECT TO PUBLIC USING (bucket_id = 'hall-images');

-- Admin upload permissions (uses is_admin() function)
CREATE POLICY "admin_upload_product_images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images' AND is_admin());
CREATE POLICY "admin_update_product_images" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'product-images' AND is_admin());
CREATE POLICY "admin_delete_product_images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'product-images' AND is_admin());
-- Repeat similar policies for other buckets
```

---

## Edge Functions

### Razorpay Payment Function

**File:** `supabase/functions/razorpay-payment/index.ts`

**Purpose:**
- Create Razorpay orders
- Verify payment signatures
- Update payment status in database
- Create user notifications

**Deployment:**

Using Supabase CLI:
```bash
supabase functions deploy razorpay-payment
```

Using Supabase Dashboard:
1. Go to Edge Functions
2. Create new function named `razorpay-payment`
3. Paste the code from `index.ts`
4. Set secrets: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`

**Required Secrets:**
```env
RAZORPAY_KEY_ID=rzp_test_xxxxx (or rzp_live_xxxxx)
RAZORPAY_KEY_SECRET=your-secret-key
```

---

## Deployment Steps

### Option 1: Vercel (Recommended)

1. **Prepare Repository:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourname/pasumai-farm.git
   git push -u origin main
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Set environment variables:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
   - Deploy

3. **Configure Domain (Optional):**
   - Add custom domain in Vercel settings
   - Update Supabase Auth redirect URLs

### Option 2: Netlify

1. **Build Project:**
   ```bash
   npm run build
   ```

2. **Deploy:**
   - Go to [netlify.com](https://netlify.com)
   - Drag and drop `dist/` folder
   - Or connect to Git repository

3. **Set Environment Variables:**
   - Site Settings > Environment Variables
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### Option 3: Self-Hosted (VPS)

1. **Build Production Bundle:**
   ```bash
   npm run build
   ```

2. **Serve with Nginx:**
   ```nginx
   server {
     listen 80;
     server_name yourdomain.com;

     root /var/www/pasumai-farm/dist;
     index index.html;

     location / {
       try_files $uri $uri/ /index.html;
     }

     # Cache static assets
     location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
     }
   }
   ```

3. **Enable HTTPS:**
   ```bash
   certbot --nginx -d yourdomain.com
   ```

### Option 4: Docker

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:
```bash
docker build -t pasumai-farm .
docker run -p 80:80 pasumai-farm
```

---

## Post-Deployment Verification

### Checklist

- [ ] **Homepage loads** at your domain
- [ ] **Sign Up** creates account successfully
- [ ] **Sign In** works and persists session
- [ ] **Profile** shows correct user data
- [ ] **Products** display correctly
- [ ] **Add to Cart** works
- [ ] **Checkout** with address entry
- [ ] **Razorpay** payment modal opens
- [ ] **Payment completion** updates order status
- [ ] **Notifications** appear after order
- [ ] **Admin Panel** accessible by admin user
- [ ] **Admin can** add/edit products
- [ ] **Delivery check** shows correct zone
- [ ] **Images upload** to storage

### Testing Payments

1. **Test Mode:** Use Razorpay test cards
   - Card: 4111 1111 1111 1111
   - Any future expiry, any CVV
   - Any name

2. **Verify in Dashboard:**
   - Payment appears in Razorpay dashboard
   - Order status updates in Supabase
   - Notification created in Supabase

### Common Issues

| Issue | Solution |
|-------|----------|
| "infinite recursion" RLS error | Run all fix_rls_recursion migrations |
| Auth state reset on refresh | Check Supabase client persistence settings |
| Payments fail | Verify Razorpay secrets in Edge Function |
| Images not loading | Check storage bucket policies |
| Admin panel shows "Access Restricted" | Verify user has `role = 'admin'` in profiles |

---

## Environment Variables Summary

| Variable | Location | Required |
|----------|----------|----------|
| `VITE_SUPABASE_URL` | Frontend .env | Yes |
| `VITE_SUPABASE_ANON_KEY` | Frontend .env | Yes |
| `RAZORPAY_KEY_ID` | Edge Function Secrets | Yes (for payments) |
| `RAZORPAY_KEY_SECRET` | Edge Function Secrets | Yes (for payments) |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│                 (React + Vite + TypeScript)                  │
│                      Deployed to Vercel                      │
└─────────────────────────┬───────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Supabase  │  │   Razorpay  │  │   Storage   │
│   Database  │  │   Payments  │  │   Buckets   │
│     Auth    │  │ Edge Func   │  │   Images    │
└─────────────┘  └─────────────┘  └─────────────┘
```

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/yourname/pasumai-farm/issues
- Email: support@pasumaifarm.com
- Phone: +91 99528 14029

---

## License

Proprietary - All rights reserved.
