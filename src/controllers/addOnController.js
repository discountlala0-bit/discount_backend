import { prisma } from '../../lib/prisma.js';

export const getAddOnsByCity = async (req, res) => {
  try {
    const { city_id } = req.params;
    const { status, category_id } = req.query;

    const city = await prisma.city.findUnique({ where: { id: city_id } });
    if (!city) {
      return res.status(404).json({ success: false, error: 'City not found' });
    }

    const where = { cityId: city_id };
    if (status) {
      where.status = status;
    }

    if (category_id) {
      where.addOnCategories = {
        some: { categoryId: category_id },
      };
    }

    const addOns = await prisma.addOn.findMany({
      where,
      include: {
        city: true,
        addOnCategories: { include: { category: true } },
        addOnOffers: { include: { offer: { include: { place: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const addOnsWithOffersCount = addOns.map((addOn) => ({
      ...addOn,
      offersCount: addOn.addOnOffers.length,
    }));

    res.json({ success: true, data: addOnsWithOffersCount });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPurchasedAddOns = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await prisma.order.findMany({
      where: {
        userId,
        status: 'completed',
        items: { some: { itemType: 'add_on' } },
      },
      include: {
        items: { where: { itemType: 'add_on' } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const purchaseMap = new Map();
    for (const order of orders) {
      for (const item of order.items) {
        if (!purchaseMap.has(item.itemId)) {
          purchaseMap.set(item.itemId, order.createdAt);
        }
      }
    }

    if (purchaseMap.size === 0) {
      return res.json({ success: true, data: [] });
    }

    const addOns = await prisma.addOn.findMany({
      where: { id: { in: Array.from(purchaseMap.keys()) } },
      include: {
        city: true,
        addOnCategories: { include: { category: true } },
        addOnOffers: {
          include: {
            offer: { include: { place: true } },
          },
        },
      },
    });

    const result = addOns.map((addOn) => ({
      ...addOn,
      offersCount: addOn.addOnOffers.length,
      purchasedAt: purchaseMap.get(addOn.id),
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const filterAddOns = async (req, res) => {
  try {
    const { city_id, min_price, max_price, status, category_id } = req.query;

    const where = {};

    if (city_id) {
      where.cityId = city_id;
    }

    if (status) {
      where.status = status;
    }

    if (category_id) {
      where.addOnCategories = {
        some: { categoryId: category_id },
      };
    }

    if (min_price !== undefined || max_price !== undefined) {
      where.price = {};
      if (min_price !== undefined) {
        where.price.gte = parseFloat(min_price);
      }
      if (max_price !== undefined) {
        where.price.lte = parseFloat(max_price);
      }
    }

    const addOns = await prisma.addOn.findMany({
      where,
      include: {
        city: true,
        addOnCategories: { include: { category: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: addOns });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
