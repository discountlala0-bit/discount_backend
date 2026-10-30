import { prisma } from '../../../lib/prisma.js';

export const createPlace = async (req, res) => {
  try {
    const { name, category_id, city_id, city_ids, address, phone, description, image, status } = req.body;

    if (!name || !category_id) {
      return res.status(400).json({ success: false, error: 'Name and category ID are required' });
    }

    const category = await prisma.category.findUnique({ where: { id: category_id } });
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    // Support both city_ids (array) and city_id (single string)
    let resolvedCityIds = [];
    if (Array.isArray(city_ids)) {
      resolvedCityIds = city_ids.filter(Boolean);
    } else if (city_id) {
      resolvedCityIds = [city_id];
    }

    if (resolvedCityIds.length > 0) {
      const validCities = await prisma.city.findMany({
        where: { id: { in: resolvedCityIds } },
        select: { id: true },
      });
      if (validCities.length !== resolvedCityIds.length) {
        return res.status(404).json({ success: false, error: 'One or more cities not found' });
      }
    }

    const primaryCityId = resolvedCityIds[0] || null;

    const place = await prisma.place.create({
      data: {
        name,
        categoryId: category_id,
        cityId: primaryCityId,
        address,
        phone,
        description,
        image,
        status: status || 'active',
        ...(resolvedCityIds.length > 0 && {
          placeCities: {
            create: resolvedCityIds.map((cId) => ({ cityId: cId })),
          },
        }),
      },
      include: {
        category: true,
        city: true,
        placeCities: { include: { city: true } },
        offers: true,
      },
    });

    const cityMap = new Map();
    if (place.city) cityMap.set(place.city.id, place.city);
    if (place.placeCities) {
      place.placeCities.forEach((pc) => {
        if (pc.city) cityMap.set(pc.city.id, pc.city);
      });
    }

    const formattedPlace = {
      ...place,
      cities: Array.from(cityMap.values()),
    };

    res.status(201).json({ success: true, message: 'Place created successfully', data: formattedPlace });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPlaces = async (req, res) => {
  try {
    const { category_id, city_id, status } = req.query;

    const where = {};
    if (category_id) where.categoryId = category_id;
    if (status) where.status = status;
    if (city_id) {
      where.OR = [
        { cityId: city_id },
        { placeCities: { some: { cityId: city_id } } },
      ];
    }

    const places = await prisma.place.findMany({
      where,
      include: {
        category: true,
        city: true,
        placeCities: { include: { city: true } },
        offers: true,
      },
      orderBy: { name: 'asc' },
    });

    const formatted = places.map((p) => {
      const cityMap = new Map();
      if (p.city) cityMap.set(p.city.id, p.city);
      if (p.placeCities) {
        p.placeCities.forEach((pc) => {
          if (pc.city) cityMap.set(pc.city.id, pc.city);
        });
      }
      return {
        ...p,
        cities: Array.from(cityMap.values()),
      };
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPlaceById = async (req, res) => {
  try {
    const { id } = req.params;

    const place = await prisma.place.findUnique({
      where: { id },
      include: {
        category: true,
        city: true,
        placeCities: { include: { city: true } },
        offers: true,
      },
    });

    if (!place) {
      return res.status(404).json({ success: false, error: 'Place not found' });
    }

    const cityMap = new Map();
    if (place.city) cityMap.set(place.city.id, place.city);
    if (place.placeCities) {
      place.placeCities.forEach((pc) => {
        if (pc.city) cityMap.set(pc.city.id, pc.city);
      });
    }

    const formattedPlace = {
      ...place,
      cities: Array.from(cityMap.values()),
    };

    res.json({ success: true, data: formattedPlace });
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
      include: {
        category: true,
        city: true,
        placeCities: { include: { city: true } },
        offers: true,
      },
      orderBy: { name: 'asc' },
    });

    const formatted = places.map((p) => {
      const cityMap = new Map();
      if (p.city) cityMap.set(p.city.id, p.city);
      if (p.placeCities) {
        p.placeCities.forEach((pc) => {
          if (pc.city) cityMap.set(pc.city.id, pc.city);
        });
      }
      return {
        ...p,
        cities: Array.from(cityMap.values()),
      };
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updatePlace = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category_id, city_id, city_ids, address, phone, description, image, status } = req.body;

    const place = await prisma.place.findUnique({
      where: { id },
      include: { placeCities: true },
    });
    if (!place) {
      return res.status(404).json({ success: false, error: 'Place not found' });
    }

    if (category_id && category_id !== place.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: category_id } });
      if (!category) {
        return res.status(404).json({ success: false, error: 'Category not found' });
      }
    }

    let resolvedCityIds = undefined;
    if (Array.isArray(city_ids)) {
      resolvedCityIds = city_ids.filter(Boolean);
    } else if (city_id !== undefined) {
      resolvedCityIds = city_id ? [city_id] : [];
    }

    if (resolvedCityIds !== undefined && resolvedCityIds.length > 0) {
      const validCities = await prisma.city.findMany({
        where: { id: { in: resolvedCityIds } },
        select: { id: true },
      });
      if (validCities.length !== resolvedCityIds.length) {
        return res.status(404).json({ success: false, error: 'One or more cities not found' });
      }
    }

    if (resolvedCityIds !== undefined) {
      // Sync placeCities
      await prisma.placeCity.deleteMany({ where: { placeId: id } });
      if (resolvedCityIds.length > 0) {
        await prisma.placeCity.createMany({
          data: resolvedCityIds.map((cId) => ({
            placeId: id,
            cityId: cId,
          })),
          skipDuplicates: true,
        });
      }
    }

    const primaryCityId = resolvedCityIds !== undefined
      ? (resolvedCityIds[0] || null)
      : undefined;

    const updatedPlace = await prisma.place.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(category_id && { categoryId: category_id }),
        ...(primaryCityId !== undefined && { cityId: primaryCityId }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(description !== undefined && { description }),
        ...(image !== undefined && { image }),
        ...(status && { status }),
      },
      include: {
        category: true,
        city: true,
        placeCities: { include: { city: true } },
        offers: true,
      },
    });

    const cityMap = new Map();
    if (updatedPlace.city) cityMap.set(updatedPlace.city.id, updatedPlace.city);
    if (updatedPlace.placeCities) {
      updatedPlace.placeCities.forEach((pc) => {
        if (pc.city) cityMap.set(pc.city.id, pc.city);
      });
    }

    const formattedPlace = {
      ...updatedPlace,
      cities: Array.from(cityMap.values()),
    };

    res.json({ success: true, message: 'Place updated successfully', data: formattedPlace });
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
