import crypto from 'node:crypto';
import { prisma } from '../../lib/prisma.js';

const generateRedeemCode = () => {
  const uuid = crypto.randomUUID();
  const code = uuid.toUpperCase().replaceAll('-', '').substring(0, 12);
  return { id: uuid, code };
};

// Creates the user's redeemable coupons for a completed order. A booklet
// offer with quantity N produces N separate UserCoupon rows for the same
// offer, so the customer can redeem that coupon N separate times.
export const createCouponsForCompletedOrder = async (orderId, userId) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) return;

  for (const item of order.items) {
    if (item.itemType === 'booklet') {
      const booklet = await prisma.booklet.findUnique({
        where: { id: item.itemId },
      });

      if (!booklet) continue;

      const bookletOffers = await prisma.bookletOffer.findMany({
        where: { bookletId: item.itemId },
        select: { offerId: true, quantity: true },
      });

      for (const bo of bookletOffers) {
        for (let i = 0; i < (bo.quantity || 1); i++) {
          const { id, code } = generateRedeemCode();
          await prisma.userCoupon.create({
            data: {
              id,
              redeemCode: code,
              userId,
              offerId: bo.offerId,
              status: 'active',
              isBookletOrigin: true,
              expiresAt: new Date(Date.now() + booklet.validity * 24 * 60 * 60 * 1000),
            },
          });
        }
      }
    } else if (item.itemType === 'add_on' || item.itemType === 'coupon') {
      const offer = await prisma.offer.findUnique({
        where: { id: item.itemId },
      });

      if (!offer) continue;

      // Add-on offers can also carry a quantity multiplier — a single
      // purchase of the offer grants that many independent redemptions.
      let quantity = 1;
      if (item.itemType === 'add_on') {
        const addOnOffer = await prisma.addOnOffer.findFirst({
          where: { offerId: item.itemId },
          select: { quantity: true },
        });
        if (addOnOffer) quantity = addOnOffer.quantity || 1;
      }

      for (let i = 0; i < quantity; i++) {
        const { id, code } = generateRedeemCode();
        await prisma.userCoupon.create({
          data: {
            id,
            redeemCode: code,
            userId,
            offerId: item.itemId,
            status: 'active',
            isBookletOrigin: false,
            expiresAt: offer.validity ? new Date(Date.now() + offer.validity * 24 * 60 * 60 * 1000) : null,
          },
        });
      }
    }
  }
};

// Ensures that for any booklets purchased by the user, UserCoupon rows exist
// for every offer currently in those booklets (including offers added after purchase
// or quantity increases).
export const ensureUserBookletCoupons = async (userId) => {
  try {
    const completedOrders = await prisma.order.findMany({
      where: {
        userId,
        status: 'completed',
        items: { some: { itemType: 'booklet' } },
      },
      include: {
        items: { where: { itemType: 'booklet' } },
      },
    });

    if (completedOrders.length === 0) return;

    for (const order of completedOrders) {
      for (const item of order.items) {
        const booklet = await prisma.booklet.findUnique({
          where: { id: item.itemId },
          include: { bookletOffers: true },
        });
        if (!booklet) continue;

        const expiresAt = new Date(order.createdAt.getTime() + booklet.validity * 24 * 60 * 60 * 1000);

        for (const bo of booklet.bookletOffers) {
          const requiredQty = bo.quantity || 1;
          const existingCount = await prisma.userCoupon.count({
            where: {
              userId,
              offerId: bo.offerId,
              isBookletOrigin: true,
            },
          });

          const missingQty = Math.max(0, requiredQty - existingCount);
          for (let i = 0; i < missingQty; i++) {
            const { id, code } = generateRedeemCode();
            await prisma.userCoupon.create({
              data: {
                id,
                redeemCode: code,
                userId,
                offerId: bo.offerId,
                status: 'active',
                isBookletOrigin: true,
                expiresAt,
              },
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error ensuring booklet coupons:', error.message);
  }
};
