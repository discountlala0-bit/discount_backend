import { prisma } from '../../../lib/prisma.js';

export const getAllUsers = async (req, res) => {
  try {
    const { status, search } = req.query;

    const where = {};
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'deactivated') {
      where.isActive = false;
    }

    if (search && search.trim()) {
      const query = search.trim();
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { phoneNumber: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        isActive: true,
        role: true,
        hasBooklet: true,
        deactivatedAt: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
            userCoupons: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getDeactivatedUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { isActive: false },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        deactivatedAt: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
            userCoupons: true,
          },
        },
      },
      orderBy: { deactivatedAt: 'desc' },
    });

    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        orders: {
          include: {
            items: true,
            payments: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        userCoupons: {
          include: {
            offer: {
              include: {
                place: {
                  select: { id: true, name: true, image: true, address: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const bookletIds = [
      ...new Set(
        user.orders
          .flatMap((o) => o.items)
          .filter((item) => item.itemType === 'booklet')
          .map((item) => item.itemId)
      ),
    ];

    const offerIds = [
      ...new Set(
        user.orders
          .flatMap((o) => o.items)
          .filter((item) => item.itemType === 'add_on')
          .map((item) => item.itemId)
      ),
    ];

    const bookletsMap = new Map();
    if (bookletIds.length > 0) {
      const booklets = await prisma.booklet.findMany({
        where: { id: { in: bookletIds } },
        select: { id: true, title: true, price: true, image: true },
      });
      booklets.forEach((b) => bookletsMap.set(b.id, b));
    }

    const offersMap = new Map();
    if (offerIds.length > 0) {
      const offers = await prisma.offer.findMany({
        where: { id: { in: offerIds } },
        select: {
          id: true,
          title: true,
          price: true,
          place: { select: { id: true, name: true, image: true } },
        },
      });
      offers.forEach((o) => offersMap.set(o.id, o));
    }

    const enrichedOrders = user.orders.map((order) => ({
      ...order,
      items: order.items.map((item) => ({
        ...item,
        itemDetails:
          item.itemType === 'booklet'
            ? bookletsMap.get(item.itemId) || null
            : offersMap.get(item.itemId) || null,
      })),
    }));

    const bookletCoupons = user.userCoupons.filter((c) => c.isBookletOrigin);
    const addOnCoupons = user.userCoupons.filter((c) => !c.isBookletOrigin);
    const redeemedCoupons = user.userCoupons.filter((c) => c.status === 'redeemed');

    const totalOrders = user.orders.length;
    const totalSpent = user.orders
      .filter(
        (o) =>
          o.status === 'completed' ||
          o.payments.some((p) => p.paymentStatus === 'success')
      )
      .reduce((sum, o) => sum + o.totalAmount, 0);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          phoneNumber: user.phoneNumber,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          hasBooklet: user.hasBooklet,
          referralCode: user.referralCode,
          createdAt: user.createdAt,
          deactivatedAt: user.deactivatedAt,
        },
        stats: {
          totalOrders,
          totalSpent,
          totalBookletCoupons: bookletCoupons.length,
          totalAddOnCoupons: addOnCoupons.length,
          totalRedeemedCoupons: redeemedCoupons.length,
        },
        orders: enrichedOrders,
        bookletCoupons,
        addOnCoupons,
        redeemedCoupons,
        allCoupons: user.userCoupons,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const nextState = !user.isActive;
    const updated = await prisma.user.update({
      where: { id },
      data: {
        isActive: nextState,
        deactivatedAt: nextState ? null : new Date(),
      },
    });

    res.json({
      success: true,
      message: `User ${updated.isActive ? 'activated' : 'deactivated'} successfully`,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const reactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, isActive: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.isActive) {
      return res.status(400).json({ success: false, error: 'User is already active' });
    }

    await prisma.user.update({
      where: { id },
      data: {
        isActive: true,
        deactivatedAt: null,
      },
    });

    res.json({ success: true, message: 'User reactivated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
