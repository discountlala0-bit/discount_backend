# Discount Lala - Project Wireframes & Flow Diagrams

## 1. SYSTEM ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT APP (Frontend)                          │
│                    (Mobile App / Web - React Native)                    │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ HTTP Requests
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Express.js Backend (server.js)                   │
│                                                                         │
│  ┌─────────────┐  ┌──────────────────┐  ┌────────────────────────────┐ │
│  │   Routes    │  │   Middleware     │  │   Controllers              │ │
│  │ /api/auth   │─▶│ authMiddleware   │─▶│ authController             │ │
│  │ /api/cart   │  │ (JWT Verify)     │  │ bookletController          │ │
│  │ /api/orders │  │                  │  │ addOnController            │ │
│  │ /api/...    │  │                  │  │ cartController             │ │
│  │             │  │                  │  │ orderController            │ │
│  │ /api/admin  │  │                  │  │ paymentController          │ │
│  │ /...        │  │                  │  │ couponController           │ │
│  └─────────────┘  └──────────────────┘  │ referralController         │ │
│                                         │ admin/*Controller            │ │
│                                         └────────────────────────────┘ │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ Prisma ORM
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      PostgreSQL (Supabase Hosted)                       │
│                           17 Models / Tables                            │
└─────────────────────────────────────────────────────────────────────────┘

        ┌─────────────────┐          ┌─────────────────────────┐
        │  Firebase Auth  │          │      Supabase           │
        │  (Phone OTP)    │          │    (Storage/Client)     │
        └─────────────────┘          └─────────────────────────┘
```

---

## 2. USER AUTHENTICATION FLOW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         USER AUTHENTICATION FLOW                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   User Enters│
│  Phone Number│
└──────┬───────┘
       │ POST /api/auth/send-otp
       │ Body: { phone: "+91xxxxxxxxxx" }
       ▼
┌──────────────────────────────────┐
│  Firebase sends OTP via SMS      │
│  Server returns sessionInfo      │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────┐
│  User Enters │
│     OTP      │
└──────┬───────┘
       │ POST /api/auth/verify-otp
       │ Body: { sessionInfo, otp: "123456" }
       ▼
┌──────────────────────────────────┐
│  Firebase verifies OTP           │
│  Returns: firebaseIdToken        │
└──────┬───────────────────────────┘
       │
       ▼
┌───────────────────────────────────────────────────────────┐
│                   POST /api/auth/verify-id-token          │
│                   Body: { idToken: "firebase-id-token" }  │
└───────────────────────────┬───────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
        ┌───────────────┐       ┌───────────────┐
        │ User EXISTS   │       │ User NEW      │
        │ in DB         │       │ (isNewUser)   │
        └───────┬───────┘       └───────┬───────┘
                │                       │
                ▼                       ▼
        ┌───────────────┐       ┌───────────────────────┐
        │ Returns JWT   │       │ POST /api/auth/register│
        │ token directly│       │ Body: { firebaseIdToken│
        │               │       │        email?, name? } │
        └───────┬───────┘       └───────────┬───────────┘
                │                           │
                │                           ▼
                │                   ┌───────────────────┐
                │                   │ Creates User in DB│
                │                   │ Returns JWT token │
                │                   └─────────┬─────────┘
                │                             │
                └─────────────┬───────────────┘
                              ▼
                    ┌───────────────────┐
                    │  AUTHENTICATED    │
                    │  JWT in Headers   │
                    │  for all requests │
                    └───────────────────┘
```

---

## 3. USER JOURNEY - BROWSE & PURCHASE FLOW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    USER: BROWSE → CART → ORDER → COUPONS                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 1: BROWSE CONTENT (Public - No Auth Required)                      │
│                                                                         │
│  ┌─────────────────────┐         ┌─────────────────────┐                │
│  │  GET /api/booklets  │         │ GET /api/add-ons     │                │
│  │  /city/:city_id     │         │ /city/:city_id       │                │
│  │                     │         │                     │                │
│  │  Returns:           │         │  Returns:           │                │
│  │  - Booklet details  │         │  - Add-on details   │                │
│  │  - Categories       │         │  - Categories       │                │
│  │  - Linked Offers    │         │  - Linked Offers    │                │
│  └─────────────────────┘         └─────────────────────┘                │
│                                                                         │
│  ┌─────────────────────┐         ┌─────────────────────┐                │
│  │  GET /api/booklets  │         │ GET /api/add-ons     │                │
│  │  /filter            │         │ /filter              │                │
│  │                     │         │                     │                │
│  │  Query: city,       │         │  Query: city,       │                │
│  │  price range,       │         │  price range,       │                │
│  │  status, validity   │         │  status, category   │                │
│  └─────────────────────┘         └─────────────────────┘                │
│                                                                         │
│  ┌─────────────────────┐                                                │
│  │ GET /api/banners    │  (if route exists - banners displayed on home) │
│  │ (public homepage)   │                                                │
│  └─────────────────────┘                                                │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ User selects items
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 2: ADD TO CART (Auth Required - JWT Bearer Token)                  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │  POST /api/cart/add                                         │        │
│  │  Headers: Authorization: Bearer <JWT>                       │        │
│  │  Body: { itemType: "booklet"|"add_on"|"coupon", itemId: uuid }│       │
│  │                                                             │        │
│  │  Auto-creates cart if user doesn't have one                 │        │
│  └─────────────────────────────────────────────────────────────┘        │
│                                                                         │
│  ┌─────────────────────┐         ┌─────────────────────┐                │
│  │  GET /api/cart      │         │ DELETE /api/cart/    │                │
│  │  (view cart)        │         │ remove/:item_id      │                │
│  └─────────────────────┘         └─────────────────────┘                │
│                                                                         │
│  ┌─────────────────────┐                                                │
│  │ DELETE /api/cart/   │                                                │
│  │ clear               │                                                │
│  └─────────────────────┘                                                │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ User proceeds to checkout
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 3: CREATE ORDER (Auth Required)                                    │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  POST /api/orders                                                 │  │
│  │  Headers: Authorization: Bearer <JWT>                             │  │
│  │  Body: {                                                          │  │
│  │    distributorCode?: string,   // Optional                        │  │
│  │    referralCode?: string       // Optional                        │  │
│  │  }                                                                │  │
│  │                                                                   │  │
│  │  Creates order from cart items + clears cart                      │  │
│  │  Links distributor if code provided                               │  │
│  │  Records referral if code provided                                │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  Order Status: "pending"                                                │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ User makes payment
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 4: PAYMENT (Public - Payment Gateway Callback or Manual)           │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  POST /api/payments                                               │  │
│  │  Body: {                                                          │  │
│  │    orderId: uuid,                                                 │  │
│  │    amount: decimal,                                               │  │
│  │    paymentMethod: string,                                         │  │
│  │    paymentStatus: "success"|"failed"|"pending"                    │  │
│  │  }                                                                │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  IF paymentStatus == "success":                                         │  │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  AUTO-TRIGGERS:                                                   │  │
│  │  1. Order status → "completed"                                    │  │
│  │  2. Coupon generation for each order item                         │  │
│  │  3. Distributor commission calculation (if applicable)            │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────┐         ┌─────────────────────┐                │
│  │ PUT /api/payments/  │         │ GET /api/payments/  │                │
│  │ :id/status          │         │ order/:order_id     │                │
│  │ (update status)     │         │ (view payments)     │                │
│  └─────────────────────┘         └─────────────────────┘                │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ Payment success
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 5: COUPON GENERATION (Automatic)                                   │
│                                                                         │
│  For each OrderItem:                                                    │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  IF itemType == "booklet":                                        │  │
│  │    → Fetch all BookletOffer links                                 │  │
│  │    → Create UserCoupon for each offer                             │  │
│  │    → Expiry = booklet.validTo                                     │  │
│  │                                                                   │  │
│  │  IF itemType == "add_on":                                         │  │
│  │    → Fetch all AddOnOffer links                                   │  │
│  │    → Create UserCoupon for each offer                             │  │
│  │    → Expiry = offer.validTo                                       │  │
│  │                                                                   │  │
│  │  IF itemType == "coupon":                                         │  │
│  │    → Create UserCoupon for the offer itself                       │  │
│  │    → Expiry = offer.validTo                                       │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  IF order has distributorId:                                            │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  Create DistributorCommission:                                    │  │
│  │  amount = totalAmount * (distributor.commissionPercentage / 100) │  │
│  │  status = "pending"                                               │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 6: USER USES COUPONS (Auth Required)                               │
│                                                                         │
│  ┌─────────────────────┐         ┌─────────────────────┐                │
│  │  GET /api/coupons   │         │ POST /api/coupons/  │                │
│  │  Query: status?     │         │ :coupon_id/redeem   │                │
│  │  (view my coupons)  │         │ (mark as redeemed)  │                │
│  └─────────────────────┘         └─────────────────────┘                │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. USER ORDER HISTORY & REFERRAL FLOW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    USER: ORDERS & REFERRALS                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ VIEW MY ORDERS                                                          │
│                                                                         │
│  ┌─────────────────────┐         ┌─────────────────────┐                │
│  │  GET /api/orders    │         │ GET /api/orders/:id │                │
│  │  (all my orders)    │         │ (single order)      │                │
│  │                     │         │                     │                │
│  │  Returns:           │         │ Returns:            │                │
│  │  - Order details    │         │ - Order + items     │                │
│  │  - Items            │         │ - Payments          │                │
│  │  - Payments         │         │ - User info         │                │
│  │  - Status           │         │                     │                │
│  └─────────────────────┘         └─────────────────────┘                │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ REFERRAL SYSTEM                                                         │
│                                                                         │
│  ┌─────────────────────┐         ┌─────────────────────┐                │
│  │  GET /api/          │         │ POST /api/          │                │
│  │  referrals/my       │         │ referrals/record    │                │
│  │  (my referrals)     │         │ (record new referral)│               │
│  └─────────────────────┘         └─────────────────────┘                │
│                                                                         │
│  ┌─────────────────────┐                                                │
│  │ PUT /api/referrals/ │                                                │
│  │ reward              │                                                │
│  │ (process reward)    │                                                │
│  └─────────────────────┘                                                │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. ADMIN CONTENT MANAGEMENT FLOW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              ADMIN: CONTENT SETUP (Hierarchical Creation Order)             │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐
  │  Categories  │  POST /api/admin/categories
  │  (ROOT)      │  ──────────────────────────────┐
  └──────────────┘                                │
                                                  │ 1. Create categories first
                                                  ▼
  ┌──────────────┐                        ┌──────────────┐
  │    Places    │  POST /api/admin/places│  GET all     │
  │  (under Cat) │  ◄─── categoryId      │  categories  │
  └──────────────┘                        └──────────────┘
                                                  │
                                                  ▼
  ┌──────────────┐                        ┌──────────────┐
  │    Offers    │  POST /api/admin/      │  GET all     │
  │  (at Place)  │  offers ◄─── placeId  │  places      │
  └──────────────┘                        └──────────────┘
        │
        │ 2. Create offers, then link to booklets or add-ons
        ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │  Link Offers to Booklets:                                        │
  │  POST /api/admin/offers/booklet/add                              │
  │  Body: { bookletId, offerId }  (only offerType='booklet')       │
  │                                                                  │
  │  Link Offers to Add-Ons:                                         │
  │  POST /api/admin/add-ons/add-offer                               │
  │  Body: { addOnId, offerId }  (only offerType='add-on')          │
  └──────────────────────────────────────────────────────────────────┘
                                                  │
                                                  ▼
  ┌──────────────┐                        ┌──────────────┐
  │   Booklets   │  POST /api/admin/      │  (One per    │
  │  (1 per City)│  booklets ◄─── cityId │   city max)  │
  └──────────────┘                        └──────────────┘
                                                  │
                                                  ▼
  ┌──────────────┐                        ┌──────────────┐
  │    Add-Ons   │  POST /api/admin/      │  GET all     │
  │  (per City)  │  add-ons ◄─── cityId  │  cities      │
  └──────────────┘                        └──────────────┘


  ┌─────────────────────────────────────────────────────────────────────────┐
  │ ADMIN: CITIES (Top-Level Entity)                                        │
  │                                                                         │
  │  POST   /api/admin/cities          Create city                          │
  │  GET    /api/admin/cities          List all cities                      │
  │  GET    /api/admin/cities/:id      Get city + its booklet               │
  │  PUT    /api/admin/cities/:id      Update city                          │
  │  DELETE /api/admin/cities/:id      Delete city (cascades to booklet)    │
  └─────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────┐
  │ ADMIN: BANNERS (Independent - for homepage display)                     │
  │                                                                         │
  │  POST   /api/admin/banners         Create banner (image, redirect)      │
  │  GET    /api/admin/banners         List (ordered by priority DESC)      │
  │  GET    /api/admin/banners/:id     Get single banner                    │
  │  PUT    /api/admin/banners/:id     Update banner                        │
  │  DELETE /api/admin/banners/:id     Delete banner                        │
  └─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. ADMIN ORDER & DISTRIBUTOR MANAGEMENT

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              ADMIN: ORDER MANAGEMENT                                        │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────────────────────┐
  │  GET /api/admin/orders                                               │
  │  ─────────────────────────────────────────────────────────────────── │
  │  Returns ALL orders with:                                            │
  │    - Order items                                                     │
  │    - Payments                                                        │
  │    - User info                                                       │
  │    - Distributor (if linked)                                         │
  └──────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Admin updates order status
                                  ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  PUT /api/admin/orders/:id/status                                    │
  │  ─────────────────────────────────────────────────────────────────── │
  │  Body: { status: "pending"|"processing"|"completed"|"cancelled" }   │
  │                                                                      │
  │  IF status == "completed":                                           │
  │    ├─ Generate UserCoupons for each order item                       │
  │    └─ Create DistributorCommission (if distributor linked)           │
  └──────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│              ADMIN: DISTRIBUTOR MANAGEMENT                                  │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────┐         ┌─────────────────────┐
  │ POST /api/admin/    │         │ GET /api/admin/     │
  │ distributors        │         │ distributors        │
  │                     │         │                     │
  │ Body: {             │         │ Returns all         │
  │   name, phone,      │         │ distributors        │
  │   referralCode,     │         │                     │
  │   commissionPercent │         │                     │
  │ }                   │         │                     │
  └─────────────────────┘         └─────────────────────┘

  ┌─────────────────────┐         ┌─────────────────────┐
  │ GET /api/admin/     │         │ PUT /api/admin/     │
  │ distributors/:id    │         │ distributors/:id    │
  │                     │         │                     │
  │ Returns distributor │         │ Update details      │
  │ + orders + commissions      │                     │
  └─────────────────────┘         └─────────────────────┘

  ┌─────────────────────┐
  │ GET /api/admin/     │
  │ distributors/       │
  │ commissions         │
  │                     │
  │ Query: distributorId?,│
  │ status?             │
  └─────────────────────┘
```

---

## 7. ADMIN COUPON & REFERRAL MANAGEMENT

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              ADMIN: COUPON MANAGEMENT                                       │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────┐         ┌─────────────────────┐
  │ GET /api/coupons/   │         │ POST /api/coupons/  │
  │ admin/all           │         │ admin/create        │
  │                     │         │                     │
  │ View ALL user       │         │ Manually assign     │
  │ coupons across      │         │ coupon (offer) to   │
  │ all users           │         │ a user              │
  └─────────────────────┘         └─────────────────────┘

  ┌─────────────────────┐
  │ POST /api/coupons/  │
  │ admin/:id           │
  │                     │
  │ Update coupon       │
  │ status (active/     │
  │ redeemed/expired)   │
  └─────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│              ADMIN: REFERRAL MANAGEMENT                                     │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────┐
  │ GET /api/referrals/ │
  │ admin/all           │
  │                     │
  │ View ALL referrals  │
  │ across all users    │
  └─────────────────────┘
```

---

## 8. COMPLETE API ROUTE MAP

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ALL API ENDPOINTS                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ PUBLIC ENDPOINTS (No Auth Required)                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  AUTHENTICATION                                                             │
│  POST   /api/auth/send-otp              Send Firebase OTP to phone          │
│  POST   /api/auth/verify-otp             Verify OTP, get Firebase token     │
│  POST   /api/auth/verify-id-token        Verify Firebase token → JWT or new │
│  POST   /api/auth/register               Register new user → JWT            │
│                                                                             │
│  BROWSE (User-facing)                                                        │
│  GET    /api/booklets/city/:city_id      Get booklets for a city            │
│  GET    /api/booklets/filter              Filter booklets                   │
│  GET    /api/add-ons/city/:city_id       Get add-ons for a city             │
│  GET    /api/add-ons/filter               Filter add-ons                    │
│                                                                             │
│  PAYMENTS                                                                   │
│  POST   /api/payments                    Record payment for order           │
│  PUT    /api/payments/:id/status         Update payment status              │
│  GET    /api/payments/order/:order_id    Get payments for order             │
│                                                                             │
│  REFERRALS                                                                  │
│  POST   /api/referrals/record             Record a referral                 │
│  PUT    /api/referrals/reward             Process referral reward           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ AUTHENTICATED ENDPOINTS (JWT Bearer Token Required)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CART                                                                       │
│  GET    /api/cart                        Get user's cart                    │
│  POST   /api/cart/add                    Add item to cart                   │
│  DELETE /api/cart/remove/:item_id        Remove item from cart              │
│  DELETE /api/cart/clear                  Clear entire cart                  │
│                                                                             │
│  ORDERS (User)                                                              │
│  POST   /api/orders                      Create order from cart             │
│  GET    /api/orders                      Get user's orders                  │
│  GET    /api/orders/:id                  Get single order (owner/admin)     │
│                                                                             │
│  COUPONS (User)                                                             │
│  GET    /api/coupons                     Get user's coupons                 │
│  POST   /api/coupons/:id/redeem          Redeem a coupon                    │
│                                                                             │
│  REFERRALS (User)                                                           │
│  GET    /api/referrals/my                Get user's referrals               │
│                                                                             │
│  ADMIN COUPONS                                                              │
│  GET    /api/coupons/admin/all           All user coupons                   │
│  POST   /api/coupons/admin/create        Assign coupon to user              │
│  POST   /api/coupons/admin/:id           Update coupon status               │
│                                                                             │
│  ADMIN REFERRALS                                                            │
│  GET    /api/referrals/admin/all         All referrals                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ ADMIN ENDPOINTS (Currently Unprotected - No middleware)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CITIES                                                                     │
│  POST   /api/admin/cities               Create city                        │
│  GET    /api/admin/cities               List cities                        │
│  GET    /api/admin/cities/:id           Get city + booklet                 │
│  PUT    /api/admin/cities/:id           Update city                        │
│  DELETE /api/admin/cities/:id           Delete city                        │
│                                                                             │
│  CATEGORIES                                                                 │
│  POST   /api/admin/categories            Create category                   │
│  GET    /api/admin/categories            List categories                   │
│  GET    /api/admin/categories/:id        Get category + offers             │
│  PUT    /api/admin/categories/:id        Update category                   │
│  DELETE /api/admin/categories/:id        Delete category                   │
│                                                                             │
│  PLACES                                                                     │
│  POST   /api/admin/places               Create place                       │
│  GET    /api/admin/places               List places                        │
│  GET    /api/admin/places/category/:id   Places by category                │
│  GET    /api/admin/places/:id           Get place + offers                 │
│  PUT    /api/admin/places/:id           Update place                       │
│  DELETE /api/admin/places/:id           Delete place                       │
│                                                                             │
│  OFFERS                                                                     │
│  POST   /api/admin/offers               Create offer                       │
│  GET    /api/admin/offers               List offers                        │
│  GET    /api/admin/offers/:id           Get offer + links                  │
│  PUT    /api/admin/offers/:id           Update offer                       │
│  DELETE /api/admin/offers/:id           Delete offer                       │
│  POST   /api/admin/offers/booklet/add   Link offer to booklet              │
│  DELETE /api/admin/offers/booklet/:bid  Unlink offer from booklet          │
│         /offer/:oid                                                     │
│                                                                             │
│  BOOKLETS                                                                   │
│  POST   /api/admin/booklets             Create booklet                     │
│  GET    /api/admin/booklets             List booklets                      │
│  GET    /api/admin/booklets/:id         Get booklet                        │
│  GET    /api/admin/booklets/:city_id    Get by city                        │
│  PUT    /api/admin/booklets/:id         Update booklet                     │
│  DELETE /api/admin/booklets/:id         Delete booklet                     │
│                                                                             │
│  ADD-ONS                                                                    │
│  POST   /api/admin/add-ons              Create add-on                      │
│  GET    /api/admin/add-ons              List add-ons                       │
│  GET    /api/admin/add-ons/:id          Get add-on + links                 │
│  PUT    /api/admin/add-ons/:id          Update add-on                      │
│  DELETE /api/admin/add-ons/:id          Delete add-on                      │
│  POST   /api/admin/add-ons/add-offer    Link offer to add-on               │
│  DELETE /api/admin/add-ons/:aid/        Unlink offer from add-on           │
│         offer/:oid                                                     │
│                                                                             │
│  BANNERS                                                                    │
│  POST   /api/admin/banners              Create banner                      │
│  GET    /api/admin/banners              List banners (by priority)         │
│  GET    /api/admin/banners/:id          Get banner                         │
│  PUT    /api/admin/banners/:id          Update banner                      │
│  DELETE /api/admin/banners/:id          Delete banner                      │
│                                                                             │
│  ORDERS (Admin)                                                             │
│  GET    /api/admin/orders               All orders                         │
│  PUT    /api/admin/orders/:id/status    Update order status                │
│                                                                             │
│  DISTRIBUTORS                                                               │
│  POST   /api/admin/distributors         Create distributor                 │
│  GET    /api/admin/distributors         List distributors                  │
│  GET    /api/admin/distributors/:id     Get distributor + orders           │
│  PUT    /api/admin/distributors/:id     Update distributor                 │
│  GET    /api/admin/distributors/        List commissions                   │
│         commissions                                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. DATABASE ENTITY RELATIONSHIP DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DATABASE RELATIONSHIPS                               │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌───────────┐                    ┌───────────┐
  │   User    │                    │   City    │
  ├───────────┤                    ├───────────┤
  │ id (PK)   │                    │ id (PK)   │
  │ firebaseUid│                   │ name      │
  │ phoneNumber│                   │ state     │
  │ email     │                    │ country   │
  │ name      │                    │ status    │
  │ referralCode│                   └─────┬─────┘
  │ role      │                          │ 1:1
  │ createdAt │                    ┌─────▼─────┐
  │ updatedAt │                    │  Booklet  │
  └─────┬─────┘                    ├───────────┤
        │ 1:N                      │ id (PK)   │
        │                          │ cityId(FK)│
        ▼                          │ name      │
  ┌───────────┐                    │ price     │
  │   Cart    │                    │ validFrom │
  ├───────────┤                    │ validTo   │
  │ id (PK)   │                    │ status    │
  │ userId(FK)│◄──unique           └─────┬─────┘
  │ createdAt │                          │ 1:N
  │ updatedAt │                    ┌─────▼──────────┐
  └─────┬─────┘                    │ BookletOffer   │
        │ 1:N                      ├────────────────┤
        ▼                          │ bookletId (FK) │
  ┌───────────┐                    │ offerId (FK)   │
  │ CartItem  │                    └────────────────┘
  ├───────────┤
  │ id (PK)   │                    ┌──────────────────┐
  │ cartId(FK)│                    │ BookletCategory  │
  │ itemType  │◄──booklet/coupon/  ├──────────────────┤
  │ itemId    │     add_on         │ bookletId (FK)   │
  │ createdAt │                    │ categoryId (FK)  │
  └───────────┘                    └──────────────────┘


  ┌───────────┐
  │   Order   │
  ├───────────┤
  │ id (PK)   │
  │ userId(FK)│──────┐
  │ totalAmount│     │
  │ status    │     │
  │distributorId│──┐ │ (FK, nullable)
  │ createdAt │    │ │
  │ updatedAt │    │ │
  └─────┬─────┘    │ │
        │ 1:N      │ │
        ▼          │ │
  ┌───────────┐    │ │
  │ OrderItem │    │ │          ┌──────────────┐
  ├───────────┤    │ │          │ Distributor  │
  │ id (PK)   │    │ │          ├──────────────┤
  │ orderId   │    │ │          │ id (PK)      │
  │ itemType  │◄───┘ │          │ name         │
  │ itemId    │      │          │ phone        │
  │ price     │      │          │ referralCode │
  └───────────┘      │          │commissionPct │
                     │          │ createdAt    │
        ┌────────────┘          │ updatedAt    │
        │                       └──────┬───────┘
        ▼                              │ 1:N
  ┌───────────┐                        ▼
  │  Payment  │                 ┌────────────────────┐
  ├───────────┤                 │DistributorCommission│
  │ id (PK)   │                 ├────────────────────┤
  │ orderId   │                 │ id (PK)            │
  │ amount    │                 │ distributorId (FK) │
  │ method    │                 │ orderId (FK)       │
  │ status    │                 │ amount             │
  │ createdAt │                 │ status             │
  └───────────┘                 │ createdAt          │
                                └────────────────────┘


  ┌──────────────┐              ┌───────────┐
  │  Category    │              │  Place    │
  ├──────────────┤              ├───────────┤
  │ id (PK)      │◄────── N:1──│ id (PK)   │
  │ name (unique)│              │ name      │
  │ createdAt    │              │ categoryId│
  │ updatedAt    │              │ address   │
  └──────┬───────┘              │ phone     │
         │ 1:N                  │ status    │
         ▼                      └─────┬─────┘
  ┌──────────────┐                    │ 1:N
  │  AddOnCategory│                    ▼
  ├──────────────┤              ┌───────────┐
  │ addOnId (FK) │              │  Offer    │
  │ categoryId   │              ├───────────┤
  └──────────────┘              │ id (PK)   │
                                │ placeId   │
  ┌──────────────┐              │ title     │
  │  AddOn       │              │ description│
  ├──────────────┤              │ offerType │◄──booklet/add-on
  │ id (PK)      │              │ discount  │
  │ cityId (FK)  │              │ validFrom │
  │ name         │              │ validTo   │
  │ price        │              │ status    │
  │ status       │              └─────┬─────┘
  └──────┬───────┘                    │ 1:N
         │ 1:N                        ▼
         ▼                      ┌──────────────┐
  ┌──────────────┐              │  AddOnOffer  │
  │ AddOnOffer   │              ├──────────────┤
  ├──────────────┤              │ addOnId (FK) │
  │ addOnId (FK) │              │ offerId (FK) │
  │ offerId (FK) │              └──────────────┘
  └──────────────┘


  ┌──────────────┐
  │  UserCoupon  │
  ├──────────────┤
  │ id (PK)      │
  │ userId (FK)  │───────► User
  │ offerId (FK) │───────► Offer
  │ status       │       active/redeemed/expired
  │ validFrom    │
  │ validTo      │
  │ redeemedAt   │
  └──────────────┘

  ┌──────────────┐
  │   Banner     │
  ├──────────────┤
  │ id (PK)      │
  │ imageUrl     │
  │ redirectType │
  │ redirectId   │
  │ priority     │
  │ isActive     │
  └──────────────┘

  ┌──────────────┐
  │ ReferralLog  │
  ├──────────────┤
  │ id (PK)      │
  │ referrerId   │───────► User
  │ referredId   │───────► User
  │ status       │
  │ rewardedAt   │
  │ createdAt    │
  └──────────────┘
```

---

## 10. SCREEN-BY-SCREEN WIREFRAME (USER APP)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         USER APP SCREEN FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   LOGIN     │────▶│    HOME     │────▶│   BROWSE    │────▶│   DETAIL    │
│   SCREEN    │     │   SCREEN    │     │   SCREEN    │     │   SCREEN    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                           │                                     │
                           │                                     ▼
                     ┌─────────────┐                       ┌─────────────┐
                     │   BANNERS   │                       │  ADD TO     │
                     │  (carousel) │                       │   CART      │
                     └─────────────┘                       └─────────────┘
                           │                                     │
                           ▼                                     ▼
                     ┌─────────────┐                       ┌─────────────┐
                     │   CITIES    │                       │   CART      │
                     │  SELECTOR   │                       │   SCREEN    │
                     └─────────────┘                       └─────────────┘
                           │                                     │
                           ▼                                     ▼
                     ┌─────────────┐                       ┌─────────────┐
                     │  CATEGORIES │                       │  CHECKOUT   │
                     │   (grid)    │                       │   SCREEN    │
                     └─────────────┘                       └─────────────┘
                           │                                     │
                           ▼                                     ▼
                     ┌─────────────┐                       ┌─────────────┐
                     │   PLACES/   │                       │  PAYMENT    │
                     │   OFFERS    │                       │   SCREEN    │
                     │   (list)    │                       └─────────────┘
                     └─────────────┘                             │
                                                                 ▼
                                                           ┌─────────────┐
                                                           │  SUCCESS /  │
                                                           │  MY COUPONS │
                                                           └─────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│ SCREEN: LOGIN SCREEN                                                        │
│ API: POST /api/auth/send-otp, /verify-otp, /verify-id-token, /register      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                       Discount Lala                                 │    │
│  │                       [Logo]                                        │    │
│  │                                                                     │    │
│  │   Phone Number: [+91 ______________]                               │    │
│  │                                                                     │    │
│  │   [  SEND OTP  ]                                                   │    │
│  │                                                                     │    │
│  │   ───── or ─────                                                   │    │
│  │                                                                     │    │
│  │   Enter OTP: [__ __ __ __ __ __]                                   │    │
│  │                                                                     │    │
│  │   [  VERIFY  ]                                                     │    │
│  │                                                                     │    │
│  │   (If new user)                                                     │    │
│  │   Name: [______________]                                           │    │
│  │   Email: [______________]  (optional)                               │    │
│  │   Referral Code: [______________]  (optional)                       │    │
│  │                                                                     │    │
│  │   [  COMPLETE REGISTRATION  ]                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ SCREEN: HOME SCREEN                                                         │
│ API: GET /api/banners, City selector                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  [≡]  Discount Lala                    [🔍]    [🛒 Cart]  [👤 Profile] │
│  │                                                                     │    │
│  │  ┌─ City Selector ────────────────────────────────────────────┐     │    │
│  │  │  📍 Current City: [ Mumbai ▼ ]                             │     │    │
│  │  └────────────────────────────────────────────────────────────┘     │    │
│  │                                                                     │    │
│  │  ┌─────────────────────────────────────────┐                        │    │
│  │  │         BANNER CAROUSEL                  │                        │    │
│  │  │    [Banner 1] [Banner 2] [Banner 3]      │                        │    │
│  │  │         ◄  ● ● ●  ►                     │                        │    │
│  │  └─────────────────────────────────────────┘                        │    │
│  │                                                                     │    │
│  │  Browse by Category                                                 │    │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                              │    │
│  │  │🍔Food│ │🛍Shop│ │💄Beau│ │🎬Ent │  (Category icons grid)       │    │
│  │  └──────┘ └──────┘ └──────┘ └──────┘                              │    │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                              │    │
│  │  │🏥Health││✈Travel││📚Edu ││🏋Gym │                              │    │
│  │  └──────┘ └──────┘ └──────┘ └──────┘                              │    │
│  │                                                                     │    │
│  │  Featured Booklets                                                  │    │
│  │  ┌─────────────────────┐  ┌─────────────────────┐                  │    │
│  │  │  Booklet Card       │  │  Booklet Card       │                  │    │
│  │  │  [Image]            │  │  [Image]            │                  │    │
│  │  │  Name, Price,       │  │  Name, Price,       │                  │    │
│  │  │  Offers count       │  │  Offers count       │                  │    │
│  │  │  [View Details]     │  │  [View Details]     │                  │    │
│  │  └─────────────────────┘  └─────────────────────┘                  │    │
│  │                                                                     │    │
│  │  Add-On Packages                                                    │    │
│  │  ┌─────────────────────┐  ┌─────────────────────┐                  │    │
│  │  │  Add-On Card        │  │  Add-On Card        │                  │    │
│  │  │  Name, Price        │  │  Name, Price        │                  │    │
│  │  │  [View Details]     │  │  [View Details]     │                  │    │
│  │  └─────────────────────┘  └─────────────────────┘                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ SCREEN: BOOKLET / ADD-ON DETAIL SCREEN                                      │
│ API: GET /api/booklets/city/:id or GET /api/add-ons/city/:id                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  [← Back]  Booklet Name                               [🛒 Add to Cart]│
│  │                                                                     │    │
│  │  ┌─────────────────────────────────────────┐                        │    │
│  │  │         Booklet Image                   │                        │    │
│  │  └─────────────────────────────────────────┘                        │    │
│  │                                                                     │    │
│  │  Price: ₹XXX         Validity: DD/MM - DD/MM                        │    │
│  │                                                                     │    │
│  │  Description                                                        │    │
│  │  Lorem ipsum dolor sit amet...                                      │    │
│  │                                                                     │    │
│  │  Categories Included                                                │    │
│  │  ┌──────┐ ┌──────┐ ┌──────┐                                        │    │
│  │  │ Food │ │ Shop │ │ Beauty│                                        │    │
│  │  └──────┘ └──────┘ └──────┘                                        │    │
│  │                                                                     │    │
│  │  Offers Inside (12)                                                 │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │  🏪 Restaurant Name                                         │    │    │
│  │  │     📍 Address, Phone                                       │    │    │
│  │  │     💰 20% OFF on all items                                 │    │    │
│  │  │     📅 Valid till DD/MM/YYYY                               │    │    │
│  │  ├─────────────────────────────────────────────────────────────┤    │    │
│  │  │  🏪 Shop Name                                               │    │    │
│  │  │     ...                                                     │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  │                                                                     │    │
│  │  ┌─────────────────────────────────────────┐                        │    │
│  │  │          [ ADD TO CART - ₹XXX ]          │                        │    │
│  │  └─────────────────────────────────────────┘                        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ SCREEN: CART SCREEN                                                         │
│ API: GET /api/cart, DELETE /api/cart/remove/:id, DELETE /api/cart/clear     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  [← Back]  My Cart                                        [🗑 Clear] │
│  │                                                                     │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │  📦 Mumbai Mega Booklet                          [✕ Remove] │    │    │
│  │  │     ₹299                                                    │    │    │
│  │  ├─────────────────────────────────────────────────────────────┤    │    │
│  │  │  📦 Premium Add-On Package                       [✕ Remove] │    │    │
│  │  │     ₹149                                                    │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  │                                                                     │    │
│  │  Referral Code (optional)                                           │    │
│  │  [ Enter code _________________ ]  [ Apply ]                        │    │
│  │                                                                     │    │
│  │  ─────────────────────────────────────                              │    │
│  │  Subtotal:                        ₹448                              │    │
│  │  Total:                           ₹448                              │    │
│  │                                                                     │    │
│  │  ┌─────────────────────────────────────────┐                        │    │
│  │  │       PROCEED TO CHECKOUT               │                        │    │
│  │  └─────────────────────────────────────────┘                        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ SCREEN: CHECKOUT / PAYMENT SCREEN                                           │
│ API: POST /api/orders, POST /api/payments                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  [← Back]  Checkout                                                 │    │
│  │                                                                     │    │
│  │  Order Summary                                                      │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │  2 items                                         ₹448.00    │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  │                                                                     │    │
│  │  Distributor Code (optional)                                        │    │
│  │  [ Enter distributor code _________________ ]                       │    │
│  │                                                                     │    │
│  │  Payment Method                                                     │    │
│  │  ○ UPI                                                              │    │
│  │  ○ Credit/Debit Card                                                │    │
│  │  ○ Net Banking                                                      │    │
│  │  ○ Wallet                                                           │    │
│  │                                                                     │    │
│  │  ┌─────────────────────────────────────────┐                        │    │
│  │  │      PAY ₹448.00 & PLACE ORDER          │                        │    │
│  │  └─────────────────────────────────────────┘                        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  After Payment Success:                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                       ✓ Payment Successful!                         │    │
│  │                                                                     │    │
│  │  Your coupons are now available!                                    │    │
│  │                                                                     │    │
│  │  ┌─────────────────────────────────────────┐                        │    │
│  │  │       VIEW MY COUPONS                   │                        │    │
│  │  └─────────────────────────────────────────┘                        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ SCREEN: MY COUPONS SCREEN                                                   │
│ API: GET /api/coupons, POST /api/coupons/:id/redeem                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  [≡]  My Coupons                         [Filter ▼]   [Profile]     │    │
│  │                                                                     │    │
│  │  Active (5)   |   Redeemed (2)   |   Expired (1)                    │    │
│  │  ──────┬──────                                                        │    │
│  │                                                                     │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │  ┃ 20% OFF                                                  │    │    │
│  │  │  ┃ Restaurant Name                                          │    │    │
│  │  │  ┃ 📍 Address                                               │    │    │
│  │  │  ┃ Valid till: DD/MM/YYYY                                   │    │    │
│  │  │  ┃ Coupon Code: DISC-XXXXX                                  │    │    │
│  │  │  ┃                                                         │    │    │
│  │  │  ┃ [ REDEEM NOW ]                                          │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  │                                                                     │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │  ┃ Flat ₹100 OFF                                            │    │    │
│  │  │  ┃ Shop Name                                                │    │    │
│  │  │  ┃ ...                                                     │    │    │
│  │  │  ┃ [ REDEEM NOW ]                                          │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ SCREEN: MY ORDERS SCREEN                                                    │
│ API: GET /api/orders                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  [≡]  My Orders                                      [Profile]      │    │
│  │                                                                     │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │  Order #ORD-XXXXX                    Status: Completed ✓     │    │    │
│  │  │  Date: DD/MM/YYYY                                          │    │    │
│  │  │  2 items                                         ₹448.00    │    │    │
│  │  │  Payment: Success                                          │    │    │
│  │  │  [ View Details ]                                          │    │    │
│  │  ├─────────────────────────────────────────────────────────────┤    │    │
│  │  │  Order #ORD-XXXXX                    Status: Pending ⏳      │    │    │
│  │  │  ...                                                       │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ SCREEN: PROFILE SCREEN                                                      │
│ API: User info, referrals                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  [← Back]  My Profile                                               │    │
│  │                                                                     │    │
│  │     [👤]                                                            │    │
│  │     User Name                                                       │    │
│  │     +91-XXXXXXXXXX                                                  │    │
│  │                                                                     │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │  📦 My Orders                           ›                   │    │    │
│  │  ├─────────────────────────────────────────────────────────────┤    │    │
│  │  │  🎟 My Coupons                          ›                   │    │    │
│  │  ├─────────────────────────────────────────────────────────────┤    │    │
│  │  │  👥 My Referrals                        ›                   │    │    │
│  │  ├─────────────────────────────────────────────────────────────┤    │    │
│  │  │  📋 My Referral Code: ABC123XYZ         [Copy]              │    │    │
│  │  ├─────────────────────────────────────────────────────────────┤    │    │
│  │  │  📞 Contact Support                     ›                   │    │    │
│  │  ├─────────────────────────────────────────────────────────────┤    │    │
│  │  │  🚪 Logout                                                 │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 11. SCREEN-BY-SCREEN WIREFRAME (ADMIN PANEL)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ADMIN PANEL SCREEN FLOW                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   ADMIN     │────▶│  DASHBOARD  │────▶│  MANAGE     │
│   LOGIN     │     │   (Stats)   │     │  CONTENT    │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                        ┌──────────┬──────────┼──────────┬──────────┐
                        ▼          ▼          ▼          ▼          ▼
                  ┌─────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
                  │CITIES   │ │CATEGOR │ │PLACES  │ │OFFERS  │ │BANNERS │
                  │&BOOKLETS│ │IES     │ │        │ │        │ │        │
                  └─────────┘ └────────┘ └────────┘ └────────┘ └────────┘
                        │          │          │          │
                        ▼          ▼          ▼          ▼
                  ┌─────────┐ ┌────────┐ ┌────────┐ ┌────────┐
                  │ADD-ONS  │ │DISTRIBUT│ │ORDERS  │ │COUPONS │
                  │         │ │ORS     │ │        │ │        │
                  └─────────┘ └────────┘ └────────┘ └────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│ SCREEN: ADMIN DASHBOARD                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Admin Panel                              [👤 Admin] [Logout]       │    │
│  │                                                                     │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │    │
│  │  │ Total    │  │ Total    │  │ Revenue  │  │ Active   │            │    │
│  │  │ Users    │  │ Orders   │  │ This Mo. │  │ Coupons  │            │    │
│  │  │  1,234   │  │   567    │  │ ₹45,678  │  │   890    │            │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │    │
│  │                                                                     │    │
│  │  ┌─────────────────────────────────────────┐                        │    │
│  │  │  Recent Orders                          │                        │    │
│  │  │  ┌─────────────────────────────────────┐│                        │    │
│  │  │  │ ORD-001 | User X | ₹299 | Completed ││                        │    │
│  │  │  │ ORD-002 | User Y | ₹448 | Pending   ││                        │    │
│  │  │  │ ORD-003 | User Z | ₹149 | Completed ││                        │    │
│  │  │  └─────────────────────────────────────┘│                        │    │
│  │  └─────────────────────────────────────────┘                        │    │
│  │                                                                     │    │
│  │  ┌─────────────────────────────────────────┐                        │    │
│  │  │  Recent Referrals                       │                        │    │
│  │  │  ┌─────────────────────────────────────┐│                        │    │
│  │  │  │ User A → User B | Rewarded         ││                        │    │
│  │  │  │ User C → User D | Pending          ││                        │    │
│  │  │  └─────────────────────────────────────┘│                        │    │
│  │  └─────────────────────────────────────────┘                        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ SCREEN: ADMIN - CITY & BOOKLET MANAGEMENT                                   │
│ API: /api/admin/cities/*, /api/admin/booklets/*                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Cities & Booklets Management          [+ Add City]                 │    │
│  │                                                                     │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │ City Name   │ State  │ Status  │ Booklet    │ Actions       │    │    │
│  │  ├─────────────────────────────────────────────────────────────┤    │    │
│  │  │ Mumbai      │ MH     │ Active  │ Mega Pack  │ [Edit][Delete]│    │    │
│  │  │ Delhi       │ DL     │ Active  │ Delhi Deal │ [Edit][Delete]│    │    │
│  │  │ Bangalore   │ KA     │ Inactive│ -          │ [Edit][Delete]│    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  │                                                                     │    │
│  │  ┌─ Add/Edit City ──────────────────────────────────────────────┐    │    │
│  │  │  City Name: [________________]                               │    │    │
│  │  │  State:     [________________]                               │    │    │
│  │  │  Country:   [________________]                               │    │    │
│  │  │  Status:    [Active ▼]                                      │    │    │
│  │  │                                                            │    │    │
│  │  │  ┌─ Booklet (1 per city) ──────────────────────────────────┐│    │    │
│  │  │  │  Booklet Name: [________________]                       ││    │    │
│  │  │  │  Price:        [________________]                       ││    │    │
│  │  │  │  Valid From:   [DD/MM/YYYY]                             ││    │    │
│  │  │  │  Valid To:     [DD/MM/YYYY]                             ││    │    │
│  │  │  │  Categories:   [☑ Food] [☑ Shop] [☐ Beauty]            ││    │    │
│  │  │  └─────────────────────────────────────────────────────────┘│    │    │
│  │  │                                                            │    │    │
│  │  │  [ Save ]  [ Cancel ]                                      │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ SCREEN: ADMIN - CATEGORY & PLACE MANAGEMENT                                 │
│ API: /api/admin/categories/*, /api/admin/places/*                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Categories Management                 [+ Add Category]             │    │
│  │                                                                     │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │ Category    │ Places Count │ Offers Count │ Actions         │    │    │
│  │  ├─────────────────────────────────────────────────────────────┤    │    │
│  │  │ Food        │     45       │     120        │ [Edit][Delete]│    │    │
│  │  │ Shopping    │     32       │      89        │ [Edit][Delete]│    │    │
│  │  │ Beauty      │     18       │      45        │ [Edit][Delete]│    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Places Management (Category: Food)    [+ Add Place]                │    │
│  │                                                                     │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │ Place Name  │ Address    │ Phone    │ Status │ Actions      │    │    │
│  │  ├─────────────────────────────────────────────────────────────┤    │    │
│  │  │ KFC         │ Andheri W  │ 98xxx  │ Active │ [Edit][Delete] │    │    │
│  │  │ McDonald's  │ Bandra     │ 97xxx  │ Active │ [Edit][Delete] │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  │                                                                     │    │
│  │  ┌─ Add/Edit Place ─────────────────────────────────────────────┐    │    │
│  │  │  Name:      [________________]                               │    │    │
│  │  │  Category:  [Food ▼]                                        │    │    │
│  │  │  Address:   [________________]                               │    │    │
│  │  │  Phone:     [________________]                               │    │    │
│  │  │  Status:    [Active ▼]                                      │    │    │
│  │  │  [ Save ]  [ Cancel ]                                       │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ SCREEN: ADMIN - OFFER MANAGEMENT                                            │
│ API: /api/admin/offers/*                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Offers Management                     [+ Add Offer]                │    │
│  │                                                                     │    │
│  │  Filter: [All Places ▼] [All Status ▼]                              │    │
│  │                                                                     │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │ Title       │ Place     │ Type     │ Valid Till │ Actions   │    │    │
│  │  ├─────────────────────────────────────────────────────────────┤    │    │
│  │  │ 20% OFF    │ KFC       │ booklet  │ 31/12/2025 │ [Edit][Del]│    │    │
│  │  │ Flat ₹100  │ Zara      │ add-on   │ 30/06/2025 │ [Edit][Del]│    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  │                                                                     │    │
│  │  ┌─ Add/Edit Offer ─────────────────────────────────────────────┐    │    │
│  │  │  Title:       [________________]                             │    │    │
│  │  │  Description: [________________]                             │    │    │
│  │  │  Place:       [KFC ▼]                                       │    │    │
│  │  │  Offer Type:  [booklet ▼]  (booklet / add-on)               │    │    │
│  │  │  Discount:    [________________]                             │    │    │
│  │  │  Valid From:  [DD/MM/YYYY]                                   │    │    │
│  │  │  Valid To:    [DD/MM/YYYY]                                   │    │    │
│  │  │  Status:      [Active ▼]                                    │    │    │
│  │  │  [ Save ]  [ Cancel ]                                       │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  │                                                                     │    │
│  │  Link Offers to Booklets/Add-Ons                                    │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │ [Link to Booklet]  Booklet: [Mega Pack ▼]  Offer: [20% OFF ▼]│   │    │
│  │  │ [Add]                                                        │    │    │
│  │  │                                                              │    │    │
│  │  │ [Link to Add-On]   Add-On: [Premium ▼]      Offer: [Flat ₹100▼]│  │    │
│  │  │ [Add]                                                        │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ SCREEN: ADMIN - ADD-ON MANAGEMENT                                           │
│ API: /api/admin/add-ons/*                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Add-On Packages Management            [+ Add Add-On]               │    │
│  │                                                                     │    │
│  │  Filter: [All Cities ▼] [All Status ▼]                              │    │
│  │                                                                     │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │ Name        │ City     │ Price  │ Offers │ Status │ Actions │    │    │
│  │  ├─────────────────────────────────────────────────────────────┤    │    │
│  │  │ Premium Pkg │ Mumbai   │ ₹149   │   8    │ Active │ [E][D]  │    │    │
│  │  │ Basic Pkg   │ Delhi    │ ₹99    │   5    │ Active │ [E][D]  │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  │                                                                     │    │
│  │  ┌─ Add/Edit Add-On ────────────────────────────────────────────┐    │    │
│  │  │  Name:       [________________]                              │    │    │
│  │  │  City:       [Mumbai ▼]                                     │    │    │
│  │  │  Price:      [________________]                              │    │    │
│  │  │  Status:     [Active ▼]                                     │    │    │
│  │  │  Categories: [☑ Food] [☑ Shopping] [☐ Beauty]               │    │    │
│  │  │  [ Save ]  [ Cancel ]                                       │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ SCREEN: ADMIN - ORDER MANAGEMENT                                            │
│ API: /api/admin/orders/*                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Order Management                                                   │    │
│  │                                                                     │    │
│  │  Filter: [All Status ▼] [Search Orders...]                          │    │
│  │                                                                     │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │ Order ID  │ User       │ Amount   │ Status    │ Actions     │    │    │
│  │  ├─────────────────────────────────────────────────────────────┤    │    │
│  │  │ ORD-001   │ +91xxxxx   │ ₹299.00  │ Pending   │ [View]      │    │    │
│  │  │ ORD-002   │ +91yyyyy   │ ₹448.00  │ Completed │ [View]      │    │    │
│  │  │ ORD-003   │ +91zzzzz   │ ₹149.00  │ Cancelled │ [View]      │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  │                                                                     │    │
│  │  ┌─ Order Detail View ──────────────────────────────────────────┐    │    │
│  │  │  Order: ORD-001                                              │    │    │
│  │  │  User: +91-XXXXXX XXXXXX                                     │    │    │
│  │  │  Date: DD/MM/YYYY HH:MM                                     │    │    │
│  │  │                                                             │    │    │
│  │  │  Items:                                                     │    │    │
│  │  │  ┌───────────────────────────────────────────────────────┐  │    │    │
│  │  │  │ Mumbai Mega Booklet                    ₹299.00       │  │    │    │
│  │  │  │ Premium Add-On                         ₹149.00       │  │    │    │
│  │  │  └───────────────────────────────────────────────────────┘  │    │    │
│  │  │                                                             │    │    │
│  │  │  Total: ₹448.00                                             │    │    │
│  │  │                                                             │    │    │
│  │  │  Payments:                                                  │    │    │
│  │  │  ┌───────────────────────────────────────────────────────┐  │    │    │
│  │  │  │ UPI | ₹448.00 | Success | DD/MM/YYYY                 │  │    │    │
│  │  │  └───────────────────────────────────────────────────────┘  │    │    │
│  │  │                                                             │    │    │
│  │  │  Distributor: DIST-001 (if applicable)                     │    │    │
│  │  │                                                             │    │    │
│  │  │  Update Status: [Completed ▼] [Update]                     │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ SCREEN: ADMIN - DISTRIBUTOR MANAGEMENT                                      │
│ API: /api/admin/distributors/*                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Distributor Management                [+ Add Distributor]          │    │
│  │                                                                     │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │ Name    │ Phone      │ Code     │ Comm% │ Orders │ Actions  │    │    │
│  │  ├─────────────────────────────────────────────────────────────┤    │    │
│  │  │ John D  │ +91xxxxx   │ JD001    │  10%  │   25   │ [E][D]   │    │    │
│  │  │ Jane S  │ +91yyyyy   │ JS002    │  15%  │   12   │ [E][D]   │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  │                                                                     │    │
│  │  ┌─ Add/Edit Distributor ───────────────────────────────────────┐    │    │
│  │  │  Name:              [________________]                       │    │    │
│  │  │  Phone:             [________________]                       │    │    │
│  │  │  Referral Code:     [________________]                       │    │    │
│  │  │  Commission %:      [____]                                   │    │    │
│  │  │  [ Save ]  [ Cancel ]                                       │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  │                                                                     │    │
│  │  ┌─ Commission Reports ─────────────────────────────────────────┐    │    │
│  │  │  Filter: [All Distributors ▼] [All Status ▼]                 │    │    │
│  │  │                                                             │    │    │
│  │  │  ┌───────────────────────────────────────────────────────┐  │    │    │
│  │  │  │ Distributor │ Order    │ Amount  │ Status    │ Date   │  │    │    │
│  │  │  ├───────────────────────────────────────────────────────┤  │    │    │
│  │  │  │ John D      │ ORD-001  │ ₹29.90  │ Pending   │ ...    │  │    │    │
│  │  │  │ John D      │ ORD-005  │ ₹44.80  │ Paid      │ ...    │  │    │    │
│  │  │  │ Jane S      │ ORD-003  │ ₹22.35  │ Pending   │ ...    │  │    │    │
│  │  │  └───────────────────────────────────────────────────────┘  │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ SCREEN: ADMIN - BANNER MANAGEMENT                                           │
│ API: /api/admin/banners/*                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Banner Management                     [+ Add Banner]               │    │
│  │                                                                     │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │ Priority │ Image    │ Redirect Type │ Redirect ID │ Active  │    │    │
│  │  ├─────────────────────────────────────────────────────────────┤    │    │
│  │  │    3     │ [img]    │ booklet       │ uuid-xxx    │ ✓       │    │    │
│  │  │    2     │ [img]    │ add-on        │ uuid-yyy    │ ✓       │    │    │
│  │  │    1     │ [img]    │ external      │ url         │ ✗       │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  │                                                                     │    │
│  │  ┌─ Add/Edit Banner ────────────────────────────────────────────┐    │    │
│  │  │  Image:         [Upload Image] [Current: img.jpg]            │    │    │
│  │  │  Redirect Type: [booklet ▼] (booklet / add-on / external)    │    │    │
│  │  │  Redirect ID:   [________________]                           │    │    │
│  │  │  Priority:      [____] (higher = shown first)                │    │    │
│  │  │  Active:        [☑]                                          │    │    │
│  │  │  [ Save ]  [ Cancel ]                                       │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 12. CONTENT CREATION WORKFLOW (Admin Setup Sequence)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              ADMIN CONTENT SETUP - STEP BY STEP SEQUENCE                    │
└─────────────────────────────────────────────────────────────────────────────┘

  STEP 1: CREATE CATEGORIES
  ┌─────────────────────────────────────────────────────────────────────┐
  │ POST /api/admin/categories                                        │
  │ → Food, Shopping, Beauty, Entertainment, Health, Travel, etc.     │
  └─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
  STEP 2: CREATE PLACES (under categories)
  ┌─────────────────────────────────────────────────────────────────────┐
  │ POST /api/admin/places (with categoryId)                           │
  │ → KFC, McDonald's, Zara, etc.                                      │
  └─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
  STEP 3: CREATE OFFERS (at places)
  ┌─────────────────────────────────────────────────────────────────────┐
  │ POST /api/admin/offers (with placeId, offerType)                   │
  │ → "20% OFF", "Flat ₹100", etc.                                     │
  │ → offerType: "booklet" or "add-on"                                 │
  └─────────────────────────────────────────────────────────────────────┘
                                  │
                  ┌───────────────┴───────────────┐
                  │                               │
                  ▼                               ▼
  STEP 4A: CREATE CITIES                  STEP 4B: CREATE DISTRIBUTORS
  ┌─────────────────────────────────┐    ┌─────────────────────────────────┐
  │ POST /api/admin/cities          │    │ POST /api/admin/distributors    │
  │ → Mumbai, Delhi, Bangalore      │    │ → Name, phone, code, comm%     │
  └────────────────┬────────────────┘    └─────────────────────────────────┘
                   │
                   ▼
  STEP 5: CREATE BOOKLETS (1 per city)
  ┌─────────────────────────────────────────────────────────────────────┐
  │ POST /api/admin/booklets (with cityId)                             │
  │ → Name, price, validity, categories                                │
  └─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
  STEP 6: LINK OFFERS TO BOOKLETS
  ┌─────────────────────────────────────────────────────────────────────┐
  │ POST /api/admin/offers/booklet/add                                 │
  │ → Link offers (offerType="booklet") to booklets                    │
  └─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
  STEP 7: CREATE ADD-ONS (per city)
  ┌─────────────────────────────────────────────────────────────────────┐
  │ POST /api/admin/add-ons (with cityId)                              │
  │ → Name, price, categories                                          │
  └─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
  STEP 8: LINK OFFERS TO ADD-ONS
  ┌─────────────────────────────────────────────────────────────────────┐
  │ POST /api/admin/add-ons/add-offer                                  │
  │ → Link offers (offerType="add-on") to add-ons                      │
  └─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
  STEP 9: CREATE BANNERS (optional)
  ┌─────────────────────────────────────────────────────────────────────┐
  │ POST /api/admin/banners                                            │
  │ → Image, redirect, priority                                        │
  └─────────────────────────────────────────────────────────────────────┘


  ═══════════════════════════════════════════════════════════════════════════
  RESULT: Users can now browse booklets/add-ons, add to cart, purchase,
          and receive coupons (offers) that they can redeem at places
  ═══════════════════════════════════════════════════════════════════════════
```

---

## 13. KEY OBSERVATIONS & RECOMMENDATIONS

### Security Issues Found:
1. **Admin routes are unprotected** - No authMiddleware on `/api/admin/*` routes
2. **Role checks are manual** - Some controllers check `req.user.role` but admin routes bypass auth middleware entirely
3. **OTP sessions are in-memory** - Will be lost on server restart

### Flow Gaps:
1. No public endpoint to fetch banners (only admin CRUD exists)
2. No user-facing endpoint to view places directly
3. Referral reward processing is manual (no automatic trigger on order completion)

### Recommendations:
1. Add `authMiddleware` + role check to all admin routes
2. Add public GET endpoint for banners
3. Consider auto-processing referral rewards when referred user completes first order
4. Add pagination to list endpoints (currently returns all records)
5. Add rate limiting on OTP endpoints