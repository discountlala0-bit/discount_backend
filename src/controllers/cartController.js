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
