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

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
  res.json({ message: 'Discount_lala API is running', status: 'healthy' });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin/cities', adminCityRoutes);
app.use('/api/admin/booklets', adminBookletRoutes);
app.use('/api/admin/add-ons', adminAddOnRoutes);
app.use('/api/admin/offers', adminOfferRoutes);
app.use('/api/admin/banners', adminBannerRoutes);
app.use('/api/admin/distributors', adminDistributorRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/categories', adminCategoryRoutes);
app.use('/api/admin/places', adminPlaceRoutes);
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

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server closed');
  });
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});