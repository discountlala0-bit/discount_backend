import { prisma } from '../../lib/prisma.js';
import { buildOrderItemsAndTotals } from '../lib/orderPricing.js';
import { createCouponsForCompletedOrder } from '../lib/couponGeneration.js';

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

    let distributor = null;
    if (distributor_code) {
      distributor = await prisma.distributor.findUnique({
        where: { referralCode: distributor_code },
      });
      if (!distributor) {
        return res.status(400).json({ success: false, error: 'Invalid coupon code' });
      }
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

    const { itemsData, totalAmount, discountAmount } = await buildOrderItemsAndTotals(
      cart.items,
      distributor
    );

    const order = await prisma.order.create({
      data: {
        userId,
        totalAmount,
        discountAmount,
        status: 'pending',
        distributorId: distributor?.id ?? null,
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
    }

    res.json({ success: true, message: 'Order status updated', data: updatedOrder });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
