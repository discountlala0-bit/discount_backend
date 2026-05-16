import crypto from 'node:crypto';
import { prisma } from '../../lib/prisma.js';

const generateRedeemCode = () => {
  const uuid = crypto.randomUUID();
  const code = uuid.toUpperCase().replaceAll('-', '').substring(0, 12);
  return { id: uuid, code };
};

// Helper function to create coupons for a completed order
const createCouponsForCompletedOrder = async (orderId, userId) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true }
  });

  if (!order) return;

  for (const item of order.items) {
    if (item.itemType === 'booklet') {
      const booklet = await prisma.booklet.findUnique({
        where: { id: item.itemId }
      });

      if (!booklet) continue;

      const bookletOffers = await prisma.bookletOffer.findMany({
        where: { bookletId: item.itemId },
        select: { offerId: true }
      });

      for (const bo of bookletOffers) {
        try {
          const { id, code } = generateRedeemCode();
          await prisma.userCoupon.create({
            data: {
              id,
              redeemCode: code,
              userId,
              offerId: bo.offerId,
              status: 'active',
              expiresAt: new Date(Date.now() + booklet.validity * 24 * 60 * 60 * 1000)
            }
          });
        } catch (err) {
          if (err.code !== 'P2002') throw err;
        }
      }
    } else if (item.itemType === 'add_on' || item.itemType === 'coupon') {
      const offer = await prisma.offer.findUnique({
        where: { id: item.itemId }
      });

      if (!offer) continue;

      try {
        const { id, code } = generateRedeemCode();
        await prisma.userCoupon.create({
          data: {
            id,
            redeemCode: code,
            userId,
            offerId: item.itemId,
            status: 'active',
            expiresAt: offer.validity ? new Date(Date.now() + offer.validity * 24 * 60 * 60 * 1000) : null
          }
        });
      } catch (err) {
        if (err.code !== 'P2002') throw err;
      }
    }
  }
};

export const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { distributor_code, referral_code } = req.body;

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, error: 'Cart is empty' });
    }

    let distributorId = null;
    if (distributor_code) {
      const distributor = await prisma.distributor.findUnique({
        where: { referralCode: distributor_code },
      });
      if (!distributor) {
        return res.status(400).json({ success: false, error: 'Invalid distributor code' });
      }
      distributorId = distributor.id;
    }

    let referralApplied = false;
    if (referral_code) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: referral_code },
      });
      if (referrer) {
        referralApplied = true;
      }
    }

    let totalAmount = 0;
    const itemsData = [];

    for (const item of cart.items) {
      let price = 0;

      if (item.itemType === 'booklet') {
        const booklet = await prisma.booklet.findUnique({ where: { id: item.itemId } });
        if (booklet) price = booklet.price;
      } else if (item.itemType === 'coupon') {
        const offer = await prisma.offer.findUnique({ where: { id: item.itemId } });
        if (offer) price = offer.price;
      }

      itemsData.push({
        itemType: item.itemType,
        itemId: item.itemId,
        price,
      });

      totalAmount += price;
    }

    const order = await prisma.order.create({
      data: {
        userId,
        totalAmount,
        status: 'pending',
        distributorId,
        referralApplied,
        items: { create: itemsData },
      },
      include: { items: true },
    });

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    res.status(201).json({ success: true, message: 'Order created successfully', data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await prisma.order.findMany({
      where: { userId },
      include: { items: true, payments: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true, payments: true, distributor: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (order.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const { status } = req.query;

    const where = {};
    if (status) where.status = status;

    const orders = await prisma.order.findMany({
      where,
      include: { items: true, payments: true, user: true, distributor: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
    });

    if (status === 'completed' && order.status !== 'completed') {
      await createCouponsForCompletedOrder(order.id, order.userId);

      if (order.distributorId) {
        const distributor = await prisma.distributor.findUnique({ where: { id: order.distributorId } });
        if (distributor) {
          const commissionAmount = (order.totalAmount * distributor.commissionPercentage) / 100;

          await prisma.distributorCommission.create({
            data: {
              distributorId: distributor.id,
              orderId: order.id,
              commissionAmount,
              status: 'pending',
            },
          });
        }
      }
    }

    res.json({ success: true, message: 'Order status updated', data: updatedOrder });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
