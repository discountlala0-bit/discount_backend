import { prisma } from '../../../lib/prisma.js';

export const createBanner = async (req, res) => {
  try {
    const { image, redirect_type, redirect_id, priority, status } = req.body;

    if (!image || !redirect_type) {
      return res.status(400).json({ success: false, error: 'Image and redirect type are required' });
    }

    const banner = await prisma.banner.create({
      data: {
        image,
        redirectType: redirect_type,
        redirectId: redirect_id,
        priority: priority || 0,
        status: status || 'active',
      },
    });

    res.status(201).json({ success: true, message: 'Banner created successfully', data: banner });
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

    const banner = await prisma.banner.findUnique({ where: { id } });

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
    const { image, redirect_type, redirect_id, priority, status } = req.body;

    const banner = await prisma.banner.findUnique({ where: { id } });
    if (!banner) {
      return res.status(404).json({ success: false, error: 'Banner not found' });
    }

    const updatedBanner = await prisma.banner.update({
      where: { id },
      data: {
        ...(image && { image }),
        ...(redirect_type && { redirectType: redirect_type }),
        ...(redirect_id !== undefined && { redirectId: redirect_id }),
        ...(priority !== undefined && { priority }),
        ...(status && { status }),
      },
    });

    res.json({ success: true, message: 'Banner updated successfully', data: updatedBanner });
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
