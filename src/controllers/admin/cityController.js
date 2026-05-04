import { prisma } from '../../../lib/prisma.js';

export const createCity = async (req, res) => {
  try {
    const { name, state, country, status } = req.body;

    if (!name || !state) {
      return res.status(400).json({ success: false, error: 'Name and state are required' });
    }

    const city = await prisma.city.create({
      data: {
        name,
        state,
        country: country || 'India',
        status: status || 'active',
      },
    });

    res.status(201).json({ success: true, message: 'City created successfully', data: city });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCities = async (req, res) => {
  try {
    const { status } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    }

    const cities = await prisma.city.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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
      include: { booklet: true },
    });

    if (!city) {
      return res.status(404).json({ success: false, error: 'City not found' });
    }

    res.json({ success: true, data: city });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateCity = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, state, country, status } = req.body;

    const city = await prisma.city.findUnique({ where: { id } });
    if (!city) {
      return res.status(404).json({ success: false, error: 'City not found' });
    }

    const updatedCity = await prisma.city.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(state && { state }),
        ...(country && { country }),
        ...(status && { status }),
      },
    });

    res.json({ success: true, message: 'City updated successfully', data: updatedCity });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteCity = async (req, res) => {
  try {
    const { id } = req.params;

    const city = await prisma.city.findUnique({ where: { id } });
    if (!city) {
      return res.status(404).json({ success: false, error: 'City not found' });
    }

    await prisma.city.delete({ where: { id } });

    res.json({ success: true, message: 'City deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
