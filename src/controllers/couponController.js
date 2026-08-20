import crypto from 'node:crypto';
import { prisma } from '../../lib/prisma.js';
import { ensureUserBookletCoupons } from '../lib/couponGeneration.js';

export const getUserCoupons = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = '1', limit = '20' } = req.query;

    await ensureUserBookletCoupons(userId);

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const where = { userId };
    if (status) where.status = status;

    const [coupons, total] = await Promise.all([
      prisma.userCoupon.findMany({
        where,
        include: { offer: { include: { place: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.userCoupon.count({ where }),
    ]);

    const bookletOfferIds = new Set(
      (await prisma.bookletOffer.findMany({ select: { offerId: true } }))
        .map(bo => bo.offerId)
    );

    const data = coupons.map(c => ({
      ...c,
      isBookletOrigin: bookletOfferIds.has(c.offerId),
    }));

    res.json({
      success: true,
      data,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const redeemCoupon = async (req, res) => {
  try {
    const { coupon_id } = req.params;
    const userId = req.user.id;

    const coupon = await prisma.userCoupon.findUnique({
      where: { id: coupon_id },
      include: { offer: true },
    });

    if (!coupon) {
      return res.status(404).json({ success: false, error: 'Coupon not found' });
    }

    if (coupon.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    if (coupon.status !== 'active') {
      return res.status(400).json({ success: false, error: 'Coupon is not active' });
    }

    const updatedCoupon = await prisma.userCoupon.update({
      where: { id: coupon_id },
      data: { status: 'redeemed', redeemedAt: new Date() },
    });

    res.json({ success: true, message: 'Coupon redeemed', data: updatedCoupon });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllCoupons = async (req, res) => {
  try {
    const { status } = req.query;

    const where = {};
    if (status) where.status = status;

    const coupons = await prisma.userCoupon.findMany({
      where,
      include: { user: true, offer: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: coupons });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createCoupon = async (req, res) => {
  try {
    const { user_id, offer_id } = req.body;

    if (!user_id || !offer_id) {
      return res.status(400).json({ success: false, error: 'User ID and offer ID are required' });
    }

    const user = await prisma.user.findUnique({ where: { id: user_id } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const offer = await prisma.offer.findUnique({ where: { id: offer_id } });
    if (!offer) {
      return res.status(404).json({ success: false, error: 'Offer not found' });
    }

    const uuid = crypto.randomUUID();
    const redeemCode = uuid.toUpperCase().replaceAll('-', '').substring(0, 12);

    const coupon = await prisma.userCoupon.create({
      data: { id: uuid, redeemCode, userId: user_id, offerId: offer_id },
    });

    res.status(201).json({ success: true, message: 'Coupon created', data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const coupon = await prisma.userCoupon.findUnique({ where: { id } });
    if (!coupon) {
      return res.status(404).json({ success: false, error: 'Coupon not found' });
    }

    const updatedCoupon = await prisma.userCoupon.update({
      where: { id },
      data: { status },
    });

    res.json({ success: true, message: 'Coupon updated', data: updatedCoupon });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
