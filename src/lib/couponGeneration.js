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

  const couponsToCreate = [];

  // Fetch every booklet/offer lookup needed for this order in parallel
  // instead of one DB round-trip per item, then build all coupon rows
  // in memory so they can be inserted with a single createMany call.
  await Promise.all(order.items.map(async (item) => {
    if (item.itemType === 'booklet') {
      const [booklet, bookletOffers] = await Promise.all([
        prisma.booklet.findUnique({ where: { id: item.itemId } }),
        prisma.bookletOffer.findMany({
          where: { bookletId: item.itemId },
          select: { offerId: true, quantity: true },
        }),
      ]);

      if (!booklet) return;

      const expiresAt = new Date(Date.now() + booklet.validity * 24 * 60 * 60 * 1000);

      for (const bo of bookletOffers) {
        for (let i = 0; i < (bo.quantity || 1); i++) {
          const { id, code } = generateRedeemCode();
          couponsToCreate.push({
            id,
            redeemCode: code,
            userId,
            offerId: bo.offerId,
            status: 'active',
            isBookletOrigin: true,
            expiresAt,
          });
        }
      }
    } else if (item.itemType === 'add_on' || item.itemType === 'coupon') {
      const [offer, addOnOffer] = await Promise.all([
        prisma.offer.findUnique({ where: { id: item.itemId } }),
        item.itemType === 'add_on'
          ? prisma.addOnOffer.findFirst({
              where: { offerId: item.itemId },
              select: { quantity: true },
            })
          : null,
      ]);

      if (!offer) return;

      // Add-on offers can also carry a quantity multiplier — a single
      // purchase of the offer grants that many independent redemptions.
      const quantity = addOnOffer?.quantity || 1;
      const expiresAt = offer.validity ? new Date(Date.now() + offer.validity * 24 * 60 * 60 * 1000) : null;

      for (let i = 0; i < quantity; i++) {
        const { id, code } = generateRedeemCode();
        couponsToCreate.push({
          id,
          redeemCode: code,
          userId,
          offerId: item.itemId,
          status: 'active',
          isBookletOrigin: false,
          expiresAt,
        });
      }
    }
  }));

  if (couponsToCreate.length > 0) {
    await prisma.userCoupon.createMany({ data: couponsToCreate });
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

    const bookletIds = [...new Set(completedOrders.flatMap(o => o.items.map(i => i.itemId)))];
    if (bookletIds.length === 0) return;

    const [booklets, existingCoupons] = await Promise.all([
      prisma.booklet.findMany({
        where: { id: { in: bookletIds } },
        include: { bookletOffers: true },
      }),
      prisma.userCoupon.findMany({
        where: { userId },
        select: { offerId: true },
      }),
    ]);

    const bookletMap = new Map(booklets.map(b => [b.id, b]));
    const offerCounts = new Map();
    for (const c of existingCoupons) {
      offerCounts.set(c.offerId, (offerCounts.get(c.offerId) || 0) + 1);
    }

    const couponsToCreate = [];

    for (const order of completedOrders) {
      for (const item of order.items) {
        const booklet = bookletMap.get(item.itemId);
        if (!booklet) continue;

        const expiresAt = new Date(order.createdAt.getTime() + booklet.validity * 24 * 60 * 60 * 1000);

        for (const bo of booklet.bookletOffers) {
          const requiredQty = bo.quantity || 1;
          const currentCount = offerCounts.get(bo.offerId) || 0;
          const missingQty = Math.max(0, requiredQty - currentCount);

          for (let i = 0; i < missingQty; i++) {
            const { id, code } = generateRedeemCode();
            couponsToCreate.push({
              id,
              redeemCode: code,
              userId,
              offerId: bo.offerId,
              status: 'active',
              isBookletOrigin: true,
              expiresAt,
            });
            offerCounts.set(bo.offerId, (offerCounts.get(bo.offerId) || 0) + 1);
          }
        }
      }
    }

    if (couponsToCreate.length > 0) {
      await prisma.userCoupon.createMany({
        data: couponsToCreate,
      });
    }
  } catch (error) {
    console.error('Error ensuring booklet coupons:', error.message);
  }
};
