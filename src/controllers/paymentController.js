import { prisma } from '../../lib/prisma.js';

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
          await prisma.userCoupon.create({
            data: {
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
    } else if (item.itemType === 'add_on') {
      const addOn = await prisma.addOn.findUnique({
        where: { id: item.itemId }
      });

      if (!addOn) continue;

      const addOnOffers = await prisma.addOnOffer.findMany({
        where: { addOnId: item.itemId },
        select: { offerId: true }
      });

      for (const ao of addOnOffers) {
        const offer = await prisma.offer.findUnique({
          where: { id: ao.offerId }
        });

        if (!offer) continue;

        try {
          await prisma.userCoupon.create({
            data: {
              userId,
              offerId: ao.offerId,
              status: 'active',
              expiresAt: offer.validity ? new Date(Date.now() + offer.validity * 24 * 60 * 60 * 1000) : null
            }
          });
        } catch (err) {
          if (err.code !== 'P2002') throw err;
        }
      }
    } else if (item.itemType === 'coupon') {
      const offer = await prisma.offer.findUnique({
        where: { id: item.itemId }
      });

      if (!offer) continue;

      try {
        await prisma.userCoupon.create({
          data: {
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

export const createPayment = async (req, res) => {
  try {
    const { order_id, payment_method, transaction_id, payment_status } = req.body;

    if (!order_id) {
      return res.status(400).json({ success: false, error: 'Order ID is required' });
    }

    const order = await prisma.order.findUnique({ where: { id: order_id } });
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const payment = await prisma.payment.create({
      data: {
        orderId: order_id,
        paymentMethod: payment_method || 'upi',
        transactionId: transaction_id,
        paymentStatus: payment_status || 'pending',
      },
    });

    if (payment_status === 'success' && order.status !== 'completed') {
      await prisma.order.update({
        where: { id: order_id },
        data: { status: 'completed' },
      });

      await createCouponsForCompletedOrder(order_id, order.userId);
    }

    res.status(201).json({ success: true, message: 'Payment recorded', data: payment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status } = req.body;

    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: { paymentStatus: payment_status },
    });

    if (payment_status === 'success' && payment.paymentStatus !== 'success') {
      const order = await prisma.order.findUnique({
        where: { id: payment.orderId }
      });

      if (order && order.status !== 'completed') {
        await prisma.order.update({
          where: { id: payment.orderId },
          data: { status: 'completed' },
        });

        await createCouponsForCompletedOrder(payment.orderId, order.userId);
      }
    }

    res.json({ success: true, message: 'Payment status updated', data: updatedPayment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPaymentsByOrder = async (req, res) => {
  try {
    const { order_id } = req.params;

    const payments = await prisma.payment.findMany({
      where: { orderId: order_id },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
