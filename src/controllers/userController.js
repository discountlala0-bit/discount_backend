import { prisma } from '../../lib/prisma.js';
import { uploadToCloudinary } from '../lib/cloudinary.js';
import { admin } from '../../config/firebaseAdmin.js';

export const getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firebaseUid: true,
        phoneNumber: true,
        email: true,
        name: true,
        hasBooklet: true,
        image: true,
        referralCode: true,
        referredBy: true,
        createdAt: true,
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, image, phoneNumber } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(image !== undefined && { image }),
        ...(phoneNumber !== undefined && { phoneNumber }),
      },
      select: {
        id: true,
        firebaseUid: true,
        phoneNumber: true,
        email: true,
        name: true,
        hasBooklet: true,
        image: true,
        referralCode: true,
        referredBy: true,
        createdAt: true,
      }
    });

    res.json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firebaseUid: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await prisma.$transaction(async (tx) => {
      // Delete user coupons
      await tx.userCoupon.deleteMany({ where: { userId } });

      // Delete cart items and carts
      await tx.cartItem.deleteMany({ where: { cart: { userId } } });
      await tx.cart.deleteMany({ where: { userId } });

      // Delete order items, payments, and orders
      await tx.orderItem.deleteMany({ where: { order: { userId } } });
      await tx.payment.deleteMany({ where: { order: { userId } } });
      await tx.order.deleteMany({ where: { userId } });

      // Delete referral logs (both where user is referrer or referred user)
      await tx.referralLog.deleteMany({
        where: {
          OR: [
            { referrerId: userId },
            { referredUserId: userId },
          ],
        },
      });

      // Delete user record permanently
      await tx.user.delete({ where: { id: userId } });
    });

    // Delete user from Firebase Auth if present
    if (user.firebaseUid) {
      try {
        if (admin.apps.length) {
          await admin.auth().deleteUser(user.firebaseUid);
        }
      } catch (fbError) {
        console.error('Failed to delete user from Firebase Auth:', fbError.message);
      }
    }

    res.json({ success: true, message: 'Account deleted permanently' });
  } catch (error) {
    console.error('Error deleting user account:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const cloudResult = await uploadToCloudinary(req.file.buffer, 'discountLala');
    const imageUrl = cloudResult.secure_url;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { image: imageUrl },
      select: {
        id: true,
        firebaseUid: true,
        phoneNumber: true,
        email: true,
        name: true,
        hasBooklet: true,
        image: true,
        referralCode: true,
        referredBy: true,
        createdAt: true,
      }
    });

    res.json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
