import { prisma } from '../../../lib/prisma.js';

function detectMediaType(url, explicitType) {
  if (explicitType && (explicitType === 'video' || explicitType === 'image')) {
    return explicitType;
  }
  if (!url || typeof url !== 'string') return 'image';
  const clean = url.toLowerCase().split('?')[0];
  if (
    clean.endsWith('.mp4') ||
    clean.endsWith('.mov') ||
    clean.endsWith('.avi') ||
    clean.endsWith('.webm') ||
    clean.endsWith('.mkv') ||
    clean.endsWith('.m4v') ||
    url.includes('/video/upload/')
  ) {
    return 'video';
  }
  return 'image';
}

export const createBanner = async (req, res) => {
  try {
    const { image, media_type, booklet_ids, redirect_type, redirect_id, priority, status } = req.body;

    if (!image) {
      return res.status(400).json({ success: false, error: 'Media URL/image is required' });
    }

    const mediaType = detectMediaType(image, media_type);

    const banner = await prisma.banner.create({
      data: {
        image,
        mediaType,
        redirectType: redirect_type || 'none',
        redirectId: redirect_id || null,
        priority: priority !== undefined ? (parseInt(priority, 10) || 0) : 0,
        status: status || 'active',
      },
    });

    if (Array.isArray(booklet_ids) && booklet_ids.length > 0) {
      await prisma.bannerBooklet.createMany({
        data: booklet_ids.map((bId) => ({
          bannerId: banner.id,
          bookletId: bId,
        })),
        skipDuplicates: true,
      });
    }

    const fullBanner = await prisma.banner.findUnique({
      where: { id: banner.id },
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

    res.status(201).json({ success: true, message: 'Banner created successfully', data: fullBanner });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBanners = async (req, res) => {
  try {
    const { status } = req.query;

    const where = {};
    if (status) where.status = status;

    const banners = await prisma.banner.findMany({
      where,
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

export const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { image, media_type, booklet_ids, redirect_type, redirect_id, priority, status } = req.body;

    const banner = await prisma.banner.findUnique({ where: { id } });
    if (!banner) {
      return res.status(404).json({ success: false, error: 'Banner not found' });
    }

    const mediaType = image ? detectMediaType(image, media_type) : (media_type || banner.mediaType);

    const updatedBanner = await prisma.banner.update({
      where: { id },
      data: {
        ...(image && { image }),
        ...(mediaType && { mediaType }),
        ...(redirect_type !== undefined && { redirectType: redirect_type }),
        ...(redirect_id !== undefined && { redirectId: redirect_id }),
        ...(priority !== undefined && { priority: parseInt(priority, 10) || 0 }),
        ...(status && { status }),
      },
    });

    if (booklet_ids !== undefined && Array.isArray(booklet_ids)) {
      await prisma.bannerBooklet.deleteMany({ where: { bannerId: id } });
      if (booklet_ids.length > 0) {
        await prisma.bannerBooklet.createMany({
          data: booklet_ids.map((bId) => ({
            bannerId: id,
            bookletId: bId,
          })),
          skipDuplicates: true,
        });
      }
    }

    const fullBanner = await prisma.banner.findUnique({
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

    res.json({ success: true, message: 'Banner updated successfully', data: fullBanner });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await prisma.banner.findUnique({ where: { id } });
    if (!banner) {
      return res.status(404).json({ success: false, error: 'Banner not found' });
    }

    await prisma.banner.delete({ where: { id } });

    res.json({ success: true, message: 'Banner deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
