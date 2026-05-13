import { prisma } from '../../lib/prisma.js';
import { verifyToken } from '../../lib/jwt.js';

export const createBooklet = async (req, res) => {
  try {
    const { city_id, title, description, price, validity, image, status, categories } = req.body;

    if (!city_id || !title || price === undefined) {
      return res.status(400).json({ success: false, error: 'City ID, title, and price are required' });
    }

    const city = await prisma.city.findUnique({ where: { id: city_id } });
    if (!city) {
      return res.status(404).json({ success: false, error: 'City not found' });
    }

    const existingBooklet = await prisma.booklet.findUnique({ where: { cityId: city_id } });
    if (existingBooklet) {
      return res.status(400).json({ success: false, error: 'City already has a booklet. One city can only have one booklet.' });
    }

    const booklet = await prisma.booklet.create({
      data: {
        cityId: city_id,
        title,
        description,
        price,
        validity: validity || 365,
        image,
        status: status || 'active',
      },
    });

    if (categories && Array.isArray(categories) && categories.length > 0) {
      const categoryRecords = await prisma.category.findMany({
        where: { name: { in: categories } },
      });

      if (categoryRecords.length > 0) {
        await prisma.bookletCategory.createMany({
          data: categoryRecords.map((cat) => ({
            bookletId: booklet.id,
            categoryId: cat.id,
          })),
        });
      }
    }

    const bookletWithCategories = await prisma.booklet.findUnique({
      where: { id: booklet.id },
      include: { city: true, bookletCategories: { include: { category: true } } },
    });

    res.status(201).json({ success: true, message: 'Booklet created successfully', data: bookletWithCategories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBooklets = async (req, res) => {
  try {
    const { status } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    }

    const booklets = await prisma.booklet.findMany({
      where,
      include: {
        city: true,
        bookletCategories: { include: { category: true } },
        bookletOffers: { include: { offer: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: booklets });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBookletById = async (req, res) => {
  try {
    const { id } = req.params;

    const booklet = await prisma.booklet.findUnique({
      where: { id },
      include: {
        city: true,
        bookletCategories: { include: { category: true } },
        bookletOffers: { include: { offer: true } },
      },
    });

    if (!booklet) {
      return res.status(404).json({ success: false, error: 'Booklet not found' });
    }

    res.json({ success: true, data: booklet });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateBooklet = async (req, res) => {
  try {
    const { id } = req.params;
    const { city_id, title, description, price, validity, image, status, categories } = req.body;

    const booklet = await prisma.booklet.findUnique({ where: { id } });
    if (!booklet) {
      return res.status(404).json({ success: false, error: 'Booklet not found' });
    }

    if (city_id && city_id !== booklet.cityId) {
      const city = await prisma.city.findUnique({ where: { id: city_id } });
      if (!city) {
        return res.status(404).json({ success: false, error: 'City not found' });
      }

      const existingBooklet = await prisma.booklet.findUnique({ where: { cityId: city_id } });
      if (existingBooklet && existingBooklet.id !== id) {
        return res.status(400).json({ success: false, error: 'City already has a booklet. One city can only have one booklet.' });
      }
    }

    const updatedBooklet = await prisma.booklet.update({
      where: { id },
      data: {
        ...(city_id && { cityId: city_id }),
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(validity !== undefined && { validity }),
        ...(image !== undefined && { image }),
        ...(status && { status }),
      },
    });

    if (categories && Array.isArray(categories)) {
      await prisma.bookletCategory.deleteMany({
        where: { bookletId: id },
      });

      const categoryRecords = await prisma.category.findMany({
        where: { name: { in: categories } },
      });

      if (categoryRecords.length > 0) {
        await prisma.bookletCategory.createMany({
          data: categoryRecords.map((cat) => ({
            bookletId: id,
            categoryId: cat.id,
          })),
        });
      }
    }

    const bookletWithCategories = await prisma.booklet.findUnique({
      where: { id },
      include: { city: true, bookletCategories: { include: { category: true } } },
    });

    res.json({ success: true, message: 'Booklet updated successfully', data: bookletWithCategories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteBooklet = async (req, res) => {
  try {
    const { id } = req.params;

    const booklet = await prisma.booklet.findUnique({ where: { id } });
    if (!booklet) {
      return res.status(404).json({ success: false, error: 'Booklet not found' });
    }

    await prisma.booklet.delete({ where: { id } });

    res.json({ success: true, message: 'Booklet deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBookletsByCity = async (req, res) => {
  try {
    const { city_id } = req.params;
    const { status } = req.query;

    const city = await prisma.city.findUnique({ where: { id: city_id } });
    if (!city) {
      return res.status(404).json({ success: false, error: 'City not found' });
    }

    const where = { cityId: city_id };
    if (status) {
      where.status = status;
    }

    const booklets = await prisma.booklet.findMany({
      where,
      include: {
        city: true,
        bookletCategories: { include: { category: true } },
        bookletOffers: {
          include: {
            offer: {
              include: { place: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Optional auth — extract user if token present
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        if (decoded && decoded.id) userId = decoded.id;
      } catch (_) {}
    }

    const bookletsWithUserInfo = await Promise.all(booklets.map(async (booklet) => {
      let purchasedAt = null;
      let expiresAt = null;

      if (userId) {
        const order = await prisma.order.findFirst({
          where: {
            userId,
            status: 'completed',
            items: { some: { itemType: 'booklet', itemId: booklet.id } },
          },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        });

        if (order) {
          purchasedAt = order.createdAt;
          if (booklet.validity) {
            expiresAt = new Date(order.createdAt.getTime() + booklet.validity * 24 * 60 * 60 * 1000);
          }
        }
      }

      return {
        ...booklet,
        offersCount: booklet.bookletOffers.length,
        purchasedAt,
        expiresAt,
      };
    }));

    res.json({ success: true, data: bookletsWithUserInfo });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const filterBooklets = async (req, res) => {
  try {
    const { city_id, min_price, max_price, status, validity } = req.query;

    const where = {};

    if (city_id) {
      where.cityId = city_id;
    }

    if (status) {
      where.status = status;
    }

    if (validity) {
      where.validity = parseInt(validity);
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

    const booklets = await prisma.booklet.findMany({
      where,
      include: { city: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: booklets });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
