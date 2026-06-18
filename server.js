import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './src/routes/authRoutes.js';
import adminCityRoutes from './src/routes/admin/cityRoutes.js';
import adminBookletRoutes from './src/routes/admin/bookletRoutes.js';
import adminAddOnRoutes from './src/routes/admin/addOnRoutes.js';
import adminOfferRoutes from './src/routes/admin/offerRoutes.js';
import adminBannerRoutes from './src/routes/admin/bannerRoutes.js';
import adminDistributorRoutes from './src/routes/admin/distributorRoutes.js';
import adminOrderRoutes from './src/routes/admin/orderRoutes.js';
import adminCategoryRoutes from './src/routes/admin/categoryRoutes.js';
import adminPlaceRoutes from './src/routes/admin/placeRoutes.js';
import adminUserRoutes from './src/routes/admin/userRoutes.js';
import adminUploadRoutes from './src/routes/admin/uploadRoutes.js';
import adminAuthRoutes from './src/routes/adminAuthRoutes.js';

import bookletRoutes from './src/routes/bookletRoutes.js';
import addOnRoutes from './src/routes/addOnRoutes.js';
import cartRoutes from './src/routes/cartRoutes.js';
import orderRoutes from './src/routes/orderRoutes.js';
import paymentRoutes from './src/routes/paymentRoutes.js';
import couponRoutes from './src/routes/couponRoutes.js';
import referralRoutes from './src/routes/referralRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import cityRoutes from './src/routes/cityRoutes.js';
import bannerRoutes from './src/routes/bannerRoutes.js';
import categoryRoutes from './src/routes/categoryRoutes.js';

import { prisma } from './lib/prisma.js';

const app = express();

const PORT = process.env.PORT || 3000;

// -------------------- Error Handlers --------------------

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

// -------------------- Middlewares --------------------

app.use(cors());

app.use(express.json({
  limit: '10mb',
}));

app.use(express.urlencoded({
  extended: true,
  limit: '10mb',
}));

app.use('/uploads', express.static('uploads'));

// -------------------- Health Check --------------------

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Discount Lala API is running successfully',
  });
});

// -------------------- Routes --------------------

app.use('/api/auth', authRoutes);
app.use('/api/admin/auth', adminAuthRoutes);

app.use('/api/admin/cities', adminCityRoutes);
app.use('/api/admin/booklets', adminBookletRoutes);
app.use('/api/admin/add-ons', adminAddOnRoutes);
app.use('/api/admin/offers', adminOfferRoutes);
app.use('/api/admin/banners', adminBannerRoutes);
app.use('/api/admin/distributors', adminDistributorRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/categories', adminCategoryRoutes);
app.use('/api/admin/places', adminPlaceRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/upload', adminUploadRoutes);

app.use('/api/booklets', bookletRoutes);
app.use('/api/add-ons', addOnRoutes);
app.use('/api/cities', cityRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/referrals', referralRoutes);

// -------------------- 404 Handler --------------------

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// -------------------- Global Error Handler --------------------

app.use((err, req, res, next) => {
  console.error('Global Error:', err);

  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: err.message,
  });
});

// -------------------- Start Server --------------------

const startServer = async () => {
  try {
    await prisma.$connect();

    console.log('✅ Database connected successfully');

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received');

      await prisma.$disconnect();

      server.close(() => {
        console.log('Server closed');
      });
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT received');

      await prisma.$disconnect();

      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to connect database:', error);
    process.exit(1);
  }
};

startServer();