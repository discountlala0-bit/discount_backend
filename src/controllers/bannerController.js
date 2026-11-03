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
      return res.json({ success: true, data: [] });
    }

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
      return res.json({ success: true, data: [] });
    }

    let banners = [];
    try {
      banners = await prisma.banner.findMany({
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
    } catch (_) {
      const bookletIdList = Array.from(userBookletIds).map((id) => `'${id}'`).join(',');
      banners = await prisma.$queryRawUnsafe(`
        SELECT DISTINCT b.*
        FROM "banners" b
        JOIN "banner_booklets" bb ON bb.banner_id = b.id
        WHERE b.status = 'active' AND bb.booklet_id IN (${bookletIdList})
        ORDER BY b.priority DESC, b.created_at DESC
      `).catch(() => []);
    }

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

    let banner = null;
    try {
      banner = await prisma.banner.update({
        where: { id },
        data: {
          viewsCount: { increment: 1 },
        },
        select: {
          id: true,
          viewsCount: true,
        },
      });
    } catch (_) {
      await prisma.$executeRawUnsafe(`
        UPDATE "banners" SET "views_count" = COALESCE("views_count", 0) + 1 WHERE "id" = '${id}'
      `).catch(() => {});
      banner = { id };
    }

    res.json({ success: true, message: 'Banner view/cross recorded', data: banner });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBanners = async (req, res) => {
  try {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      return getUserBanners(req, res);
    }

    let banners;
    try {
      banners = await prisma.banner.findMany({
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
    } catch (_) {
      banners = await prisma.banner.findMany({
        where: { status: 'active' },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      });
    }

    res.json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBannerById = async (req, res) => {
  try {
    const { id } = req.params;

    let banner;
    try {
      banner = await prisma.banner.findUnique({
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
    } catch (_) {
      banner = await prisma.banner.findUnique({ where: { id } });
    }

    if (!banner) {
      return res.status(404).json({ success: false, error: 'Banner not found' });
    }

    res.json({ success: true, data: banner });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
