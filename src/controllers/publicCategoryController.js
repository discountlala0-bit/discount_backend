import { prisma } from '../../lib/prisma.js';

export const getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany();

    const categoryOrder = [
      'Hotel',
      'Restaurant',
      'Bar',
      'SPA',
      'Salon',
      'Beauty',
      'Parlour',
      'Water Park',
      'Caffe',
      'Gym',
      'Games',
      'Vehicle',
      'Others',
    ];

    categories.sort((a, b) => {
      const indexA = categoryOrder.indexOf(a.name);
      const indexB = categoryOrder.indexOf(b.name);

      return indexA - indexB;
    });

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
