import { prisma } from '../../lib/prisma.js';

export const getBanners = async (req, res) => {
  try {
    const banners = await prisma.banner.findMany({
      where: { status: 'active' },
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
    });

    if (!banner) {
      return res.status(404).json({ success: false, error: 'Banner not found' });
    }

    res.json({ success: true, data: banner });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
