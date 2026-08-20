import { prisma } from '../../../lib/prisma.js';

export const createPlace = async (req, res) => {
  try {
    const { name, category_id, city_id, address, phone, description, image, status } = req.body;

    if (!name || !category_id) {
      return res.status(400).json({ success: false, error: 'Name and category ID are required' });
    }

    const category = await prisma.category.findUnique({ where: { id: category_id } });
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    if (city_id) {
      const city = await prisma.city.findUnique({ where: { id: city_id } });
      if (!city) {
        return res.status(404).json({ success: false, error: 'City not found' });
      }
    }

    const place = await prisma.place.create({
      data: {
        name,
        categoryId: category_id,
        ...(city_id && { cityId: city_id }),
        address,
        phone,
        description,
        image,
        status: status || 'active',
      },
      include: { category: true, city: true, offers: true },
    });

    res.status(201).json({ success: true, message: 'Place created successfully', data: place });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPlaces = async (req, res) => {
  try {
    const { category_id, city_id, status } = req.query;

    const where = {};
    if (category_id) where.categoryId = category_id;
    if (city_id) where.cityId = city_id;
    if (status) where.status = status;

    const places = await prisma.place.findMany({
      where,
      include: { category: true, city: true, offers: true },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: places });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPlaceById = async (req, res) => {
  try {
    const { id } = req.params;

    const place = await prisma.place.findUnique({
      where: { id },
      include: { category: true, city: true, offers: true },
    });

    if (!place) {
      return res.status(404).json({ success: false, error: 'Place not found' });
    }

    res.json({ success: true, data: place });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPlacesByCategory = async (req, res) => {
  try {
    const { category_id } = req.params;

    const category = await prisma.category.findUnique({ where: { id: category_id } });
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    const places = await prisma.place.findMany({
      where: { categoryId: category_id },
      include: { offers: true },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: places });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updatePlace = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category_id, city_id, address, phone, description, image, status } = req.body;

    const place = await prisma.place.findUnique({ where: { id } });
    if (!place) {
      return res.status(404).json({ success: false, error: 'Place not found' });
    }

    if (category_id && category_id !== place.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: category_id } });
      if (!category) {
        return res.status(404).json({ success: false, error: 'Category not found' });
      }
    }

    if (city_id && city_id !== place.cityId) {
      const city = await prisma.city.findUnique({ where: { id: city_id } });
      if (!city) {
        return res.status(404).json({ success: false, error: 'City not found' });
      }
    }

    const updatedPlace = await prisma.place.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(category_id && { categoryId: category_id }),
        ...(city_id !== undefined && { cityId: city_id || null }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(description !== undefined && { description }),
        ...(image !== undefined && { image }),
        ...(status && { status }),
      },
      include: { category: true, city: true, offers: true },
    });

    res.json({ success: true, message: 'Place updated successfully', data: updatedPlace });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deletePlace = async (req, res) => {
  try {
    const { id } = req.params;

    const place = await prisma.place.findUnique({ where: { id } });
    if (!place) {
      return res.status(404).json({ success: false, error: 'Place not found' });
    }

    await prisma.place.delete({ where: { id } });

    res.json({ success: true, message: 'Place deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
