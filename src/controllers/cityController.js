import { prisma } from '../../lib/prisma.js';

export const getCities = async (req, res) => {
  try {
    const { status } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    }

    const cities = await prisma.city.findMany({
      where,
      include: {
        booklets: {
          select: {
            id: true,
            title: true,
            price: true,
            image: true,
            status: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: cities });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCityById = async (req, res) => {
  try {
    const { id } = req.params;

    const city = await prisma.city.findUnique({
      where: { id },
      include: {
        booklets: true,
        addOns: true,
      },
    });

    if (!city) {
      return res.status(404).json({ success: false, error: 'City not found' });
    }

    res.json({ success: true, data: city });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
