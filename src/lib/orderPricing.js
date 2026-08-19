import { prisma } from '../../lib/prisma.js';

// Resolves cart items to priced order items, applying the distributor's
// discount percentage to booklet items only.
export const buildOrderItemsAndTotals = async (cartItems, distributor) => {
  const itemsData = [];
  let subtotal = 0;
  let bookletSubtotal = 0;

  for (const item of cartItems) {
    let price = 0;

    if (item.itemType === 'booklet') {
      const booklet = await prisma.booklet.findUnique({ where: { id: item.itemId } });
      if (booklet) price = booklet.price;
      bookletSubtotal += price;
    } else if (item.itemType === 'add_on' || item.itemType === 'coupon') {
      const offer = await prisma.offer.findUnique({ where: { id: item.itemId } });
      if (offer) price = offer.price;
    }

    itemsData.push({ itemType: item.itemType, itemId: item.itemId, price });
    subtotal += price;
  }

  const discountAmount = distributor
    ? (bookletSubtotal * distributor.discountPercentage) / 100
    : 0;

  return {
    itemsData,
    discountAmount,
    totalAmount: subtotal - discountAmount,
  };
};
