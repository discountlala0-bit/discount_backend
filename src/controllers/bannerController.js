import { prisma } from '../../lib/prisma.js';
import { verifyToken } from '../../lib/jwt.js';

/**
 * Returns active banners targeted to the current user's purchased booklets.
 * Only users who have purchased at least one booklet linked to the banner will see it.
 */
export const getUserBanners = async (req, res) => {
  try {
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        if (decoded && decoded.id) {
          userId = decoded.id;
        }
      } catch (_) {}
    }

    if (!userId) {
      // Unauthenticated users or users with no token do not receive booklet-targeted popup banners
      return res.json({ success: true, data: [] });
    }

    // Find all completed orders for this user with booklet items
    const orders = await prisma.order.findMany({
      where: {
        userId,
        status: 'completed',
        items: { some: { itemType: 'booklet' } },
      },
      include: {
        items: { where: { itemType: 'booklet' } },
      },
    });

    const userBookletIds = new Set();
    for (const order of orders) {
      for (const item of order.items) {
        if (item.itemId) userBookletIds.add(item.itemId);
      }
    }

    if (userBookletIds.size === 0) {
      // User has not purchased any booklet
      return res.json({ success: true, data: [] });
    }

    // Fetch active banners that target any of the user's purchased booklets
    const banners = await prisma.banner.findMany({
      where: {
        status: 'active',
        bannerBooklets: {
          some: {
            bookletId: { in: Array.from(userBookletIds) },
          },
        },
      },
      include: {
        bannerBooklets: {
          include: {
            booklet: {
              select: { id: true, title: true },
            },
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    res.json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Increments the dismiss/views count whenever a user views/closes a banner in the app.
 */
export const trackBannerDismiss = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await prisma.banner.update({
      where: { id },
      data: {
        viewsCount: { increment: 1 },
      },
      select: {
        id: true,
        viewsCount: true,
      },
    });

    res.json({ success: true, message: 'Banner view/cross recorded', data: banner });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBanners = async (req, res) => {
  try {
    // If auth header is provided, delegate to targeted user banners
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      return getUserBanners(req, res);
    }

    const banners = await prisma.banner.findMany({
      where: { status: 'active' },
      include: {
        bannerBooklets: {
          include: {
            booklet: {
              select: { id: true, title: true },
            },
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    res.json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBannerById = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await prisma.banner.findUnique({
      where: { id },
      include: {
        bannerBooklets: {
          include: {
            booklet: {
              select: { id: true, title: true },
            },
          },
        },
      },
    });

    if (!banner) {
      return res.status(404).json({ success: false, error: 'Banner not found' });
    }

    res.json({ success: true, data: banner });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
