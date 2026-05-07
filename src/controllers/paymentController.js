import { prisma } from '../../lib/prisma.js';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

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

// Create Razorpay order (creates order from cart if order_id not provided)
export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, order_id } = req.body;
    const userId = req.user.id; // From auth middleware

    let finalOrderId = order_id;

    // If no order_id provided, create order from cart
    if (!finalOrderId) {
      // Get user's cart
      const cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              booklet: true,
              addOn: {
                include: {
                  offers: {
                    include: {
                      offer: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ success: false, error: 'Cart is empty' });
      }

      // Calculate total amount
      let totalAmount = 0;
      for (const item of cart.items) {
        if (item.itemType === 'booklet' && item.booklet) {
          totalAmount += item.booklet.price;
        } else if (item.itemType === 'add_on' && item.addOn) {
          const offerPrices = item.addOn.offers.map(ao => ao.offer.price);
          totalAmount += offerPrices.length > 0 ? Math.min(...offerPrices) : 0;
        }
      }

      // Create order
      const order = await prisma.order.create({
        data: {
          userId,
          totalAmount,
          status: 'pending',
          items: {
            create: cart.items.map(item => ({
              itemType: item.itemType,
              itemId: item.itemId
            }))
          }
        },
        include: { items: true }
      });

      finalOrderId = order.id;

      // Clear cart
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
      });
    }

    if (!amount) {
      return res.status(400).json({ success: false, error: 'Amount is required' });
    }

    const options = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paise
      currency,
      receipt: receipt || `receipt_${finalOrderId}`,
      notes: {
        order_id: finalOrderId
      }
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.status(201).json({
      success: true,
      message: 'Razorpay order created',
      data: {
        razorpay_order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        order_id: finalOrderId
      }
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Verify Razorpay payment
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_id) {
      return res.status(400).json({ success: false, error: 'Missing required payment verification fields' });
    }

    // Verify signature
    const crypto = await import('crypto');
    const generatedSignature = crypto.default
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Invalid payment signature' });
    }

    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: order_id },
      include: { items: true }
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        orderId: order_id,
        paymentMethod: 'razorpay',
        transactionId: razorpay_payment_id,
        paymentStatus: 'success',
      },
    });

    // Update order status to completed
    if (order.status !== 'completed') {
      await prisma.order.update({
        where: { id: order_id },
        data: { status: 'completed' },
      });

      // Create coupons for the user
      await createCouponsForCompletedOrder(order_id, order.userId);

      // Check if order contains booklet and update user hasBooklet
      const hasBookletItem = order.items.some(item => item.itemType === 'booklet');
      if (hasBookletItem) {
        await prisma.user.update({
          where: { id: order.userId },
          data: { hasBooklet: true },
        });
      }
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        payment,
        order: {
          id: order.id,
          status: 'completed',
          totalAmount: order.totalAmount
        }
      }
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Handle failed payment
export const handleFailedPayment = async (req, res) => {
  try {
    const { order_id, razorpay_payment_id, failure_reason } = req.body;

    if (!order_id) {
      return res.status(400).json({ success: false, error: 'Order ID is required' });
    }

    // Create failed payment record
    const payment = await prisma.payment.create({
      data: {
        orderId: order_id,
        paymentMethod: 'razorpay',
        transactionId: razorpay_payment_id || null,
        paymentStatus: 'failed',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Failed payment recorded',
      data: payment
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Old createPayment function (keeping for compatibility)
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
