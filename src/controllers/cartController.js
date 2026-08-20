import { prisma } from '../../lib/prisma.js';

export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: { items: true },
      });
    }

    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { item_type, item_id } = req.body;

    if (!item_type || !item_id) {
      return res.status(400).json({ success: false, error: 'Item type and item ID are required' });
    }

    if (!['booklet', 'coupon', 'add_on'].includes(item_type)) {
      return res.status(400).json({ success: false, error: 'Item type must be booklet, coupon, or add_on' });
    }

    // Check if user has purchased the booklet for the same city as this add_on
    if (item_type === 'add_on') {
      const addOnOffer = await prisma.addOnOffer.findFirst({
        where: { offerId: item_id },
        include: { addOn: { select: { cityId: true } } }
      });

      if (!addOnOffer) {
        return res.status(404).json({ success: false, error: 'Add-on offer not found' });
      }

      const cityId = addOnOffer.addOn.cityId;

      const cityBooklets = await prisma.booklet.findMany({
        where: { cityId },
        select: { id: true }
      });

      const cityBookletIds = cityBooklets.map(b => b.id);

      const hasCityBooklet = cityBookletIds.length > 0 && await prisma.orderItem.findFirst({
        where: {
          itemType: 'booklet',
          itemId: { in: cityBookletIds },
          order: { userId, status: 'completed' }
        }
      });

      if (!hasCityBooklet) {
        return res.status(403).json({ success: false, error: 'Booklet purchase required to add add-on offers' });
      }
    }

    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!cart) {
      cart = await prisma.cart.create({ data: { userId }, include: { items: true } });
    }

    const existingItem = cart.items.find(
      (item) => item.itemType === item_type && item.itemId === item_id
    );

    if (existingItem) {
      return res.status(400).json({ success: false, error: 'Item already in cart' });
    }

    const cartItem = await prisma.cartItem.create({
      data: { cartId: cart.id, itemType: item_type, itemId: item_id },
    });

    res.json({ success: true, message: 'Item added to cart', data: cartItem });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { item_id } = req.params;

    const cart = await prisma.cart.findUnique({ where: { userId }, include: { items: true } });

    if (!cart) {
      return res.status(404).json({ success: false, error: 'Cart not found' });
    }

    const cartItem = cart.items.find((item) => item.itemId === item_id);

    if (!cartItem) {
      return res.status(404).json({ success: false, error: 'Item not found in cart' });
    }

    await prisma.cartItem.delete({ where: { id: cartItem.id } });

    res.json({ success: true, message: 'Item removed from cart' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await prisma.cart.findUnique({ where: { userId } });

    if (!cart) {
      return res.status(404).json({ success: false, error: 'Cart not found' });
    }

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get cart items with full offer/booklet details populated
export const getCartDetails = async (req, res) => {
  try {
    const userId = req.user.id;

    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: { items: true },
      });
    }

    const itemsWithDetails = await Promise.all(
      cart.items.map(async (item) => {
        let details = null;

        if (item.itemType === 'add_on' || item.itemType === 'coupon') {
          const offer = await prisma.offer.findUnique({
            where: { id: item.itemId },
            include: { place: true },
          });
          if (offer) {
            details = {
              id: offer.id,
              title: offer.title,
              description: offer.description,
              price: offer.price,
              validity: offer.validity,
              timing: offer.timing,
              placeId: offer.placeId,
              offerType: offer.offerType,
              status: offer.status,
              place: offer.place
                ? {
                    id: offer.place.id,
                    name: offer.place.name,
                    categoryId: offer.place.categoryId,
                    address: offer.place.address,
                    phone: offer.place.phone,
                    description: offer.place.description,
                    image: offer.place.image,
                    status: offer.place.status,
                  }
                : null,
            };
          }
        } else if (item.itemType === 'booklet') {
          const booklet = await prisma.booklet.findUnique({
            where: { id: item.itemId },
          });
          if (booklet) {
            details = {
              id: booklet.id,
              title: booklet.title,
              description: booklet.description,
              price: booklet.price,
              validity: booklet.validity,
              image: booklet.image,
            };
          }
        }

        return {
          id: item.id,
          itemType: item.itemType,
          itemId: item.itemId,
          details,
        };
      })
    );

    res.json({ success: true, data: itemsWithDetails });
  } catch (error) {
    console.error('Get cart details error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
