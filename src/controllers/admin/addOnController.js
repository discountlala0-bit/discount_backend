import { prisma } from '../../../lib/prisma.js';

export const createAddOn = async (req, res) => {
  try {
    const { city_id, title, description, price, status, categories } = req.body;

    const addOn = await prisma.addOn.create({
      data: {
        cityId: city_id,
        title,
        description,
        price,
        status: status || 'active',
        addOnCategories: categories ? {
          create: categories.map(categoryId => ({ categoryId }))
        } : undefined,
      },
      include: {
        city: true,
        addOnCategories: { include: { category: true } },
        addOnOffers: { include: { offer: true } },
      },
    });

    res.status(201).json({ success: true, message: 'Add-on created successfully', data: addOn });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAddOns = async (req, res) => {
  try {
    const { status, city_id } = req.query;

    const where = {};
    if (status) where.status = status;
    if (city_id) where.cityId = city_id;

    const addOns = await prisma.addOn.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        city: true,
        addOnCategories: { include: { category: true } },
        addOnOffers: { include: { offer: true } },
      },
    });

    res.json({ success: true, data: addOns });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAddOnById = async (req, res) => {
  try {
    const { id } = req.params;

    const addOn = await prisma.addOn.findUnique({
      where: { id },
      include: {
        city: true,
        addOnCategories: { include: { category: true } },
        addOnOffers: { include: { offer: true } },
      },
    });

    if (!addOn) {
      return res.status(404).json({ success: false, error: 'Add-on not found' });
    }

    res.json({ success: true, data: addOn });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateAddOn = async (req, res) => {
  try {
    const { id } = req.params;
    const { city_id, title, description, price, status, categories } = req.body;

    const addOn = await prisma.addOn.findUnique({ where: { id } });
    if (!addOn) {
      return res.status(404).json({ success: false, error: 'Add-on not found' });
    }

    const updatedAddOn = await prisma.addOn.update({
      where: { id },
      data: {
        ...(city_id !== undefined && { cityId: city_id }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(status && { status }),
        ...(categories && {
          addOnCategories: {
            deleteMany: {},
            create: categories.map(categoryId => ({ categoryId })),
          },
        }),
      },
      include: {
        city: true,
        addOnCategories: { include: { category: true } },
        addOnOffers: { include: { offer: true } },
      },
    });

    res.json({ success: true, message: 'Add-on updated successfully', data: updatedAddOn });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteAddOn = async (req, res) => {
  try {
    const { id } = req.params;

    const addOn = await prisma.addOn.findUnique({ where: { id } });
    if (!addOn) {
      return res.status(404).json({ success: false, error: 'Add-on not found' });
    }

    await prisma.addOn.delete({ where: { id } });

    res.json({ success: true, message: 'Add-on deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const addOfferToAddOn = async (req, res) => {
  try {
    const { add_on_id, offer_id } = req.body;

    const existing = await prisma.addOnOffer.findUnique({
      where: { addOnId_offerId: { addOnId: add_on_id, offerId: offer_id } },
    });

    if (existing) {
      return res.status(400).json({ success: false, error: 'Offer already added to add-on' });
    }

    const addOn = await prisma.addOn.findUnique({ where: { id: add_on_id } });
    if (!addOn) {
      return res.status(404).json({ success: false, error: 'Add-on not found' });
    }

    const offer = await prisma.offer.findUnique({ where: { id: offer_id } });
    if (!offer) {
      return res.status(404).json({ success: false, error: 'Offer not found' });
    }

    if (offer.offerType !== 'add-on') {
      return res.status(400).json({
        success: false,
        error: 'Only add-on type offers can be added to an add-on package',
      });
    }

    const addOnOffer = await prisma.addOnOffer.create({
      data: { addOnId: add_on_id, offerId: offer_id },
      include: { offer: true },
    });

    res.status(201).json({ success: true, message: 'Offer added to add-on', data: addOnOffer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const removeOfferFromAddOn = async (req, res) => {
  try {
    const { add_on_id, offer_id } = req.params;

    await prisma.addOnOffer.delete({
      where: { addOnId_offerId: { addOnId: add_on_id, offerId: offer_id } },
    });

    res.json({ success: true, message: 'Offer removed from add-on' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
