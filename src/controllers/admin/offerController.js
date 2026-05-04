import { prisma } from '../../../lib/prisma.js';

export const createOffer = async (req, res) => {
  try {
    const { title, description, price, timing, max_people, place_id, offer_type, status } = req.body;

    if (!place_id) {
      return res.status(400).json({ success: false, error: 'Place ID is required' });
    }

    const place = await prisma.place.findUnique({
      where: { id: place_id },
      include: { category: true },
    });

    if (!place) {
      return res.status(404).json({ success: false, error: 'Place not found' });
    }

    let validity;
    if (offer_type === 'booklet') {
      validity = 365;
    } else {
      validity = null;
    }

    const offerData = {
      title,
      description,
      price,
      timing,
      validity,
      maxPeople: max_people,
      placeId: place_id,
      offerType: offer_type || 'add_on',
      status: status || 'active',
    };

    const offer = await prisma.offer.create({
      data: offerData,
      include: { place: { include: { category: true } } },
    });

    res.status(201).json({ success: true, message: 'Offer created successfully', data: offer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getOffers = async (req, res) => {
  try {
    const { status, place_id } = req.query;

    const where = {};
    if (status) where.status = status;
    if (place_id) where.placeId = place_id;

    const offers = await prisma.offer.findMany({
      where,
      include: { place: { include: { category: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: offers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getOfferById = async (req, res) => {
  try {
    const { id } = req.params;

    const offer = await prisma.offer.findUnique({
      where: { id },
      include: {
        place: { include: { category: true } },
        bookletOffers: { include: { booklet: true } },
        addOnOffers: { include: { addOn: true } },
      },
    });

    if (!offer) {
      return res.status(404).json({ success: false, error: 'Offer not found' });
    }

    res.json({ success: true, data: offer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      price,
      validity,
      timing,
      place_id,
      maxPeople,
      status
    } = req.body;

    const offer = await prisma.offer.findUnique({ where: { id } });
    if (!offer) {
      return res.status(404).json({ success: false, error: 'Offer not found' });
    }

    if (place_id && place_id !== offer.placeId) {
      const place = await prisma.place.findUnique({ where: { id: place_id } });
      if (!place) {
        return res.status(404).json({ success: false, error: 'Place not found' });
      }
    }

    const updatedOffer = await prisma.offer.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(validity !== undefined && { validity }),
        ...(timing !== undefined && { timing }),
        ...(place_id && { placeId: place_id }),
        ...(maxPeople !== undefined && { maxPeople }),
        ...(status && { status }),
      },
      include: { place: { include: { category: true } } },
    });

    res.json({ success: true, message: 'Offer updated successfully', data: updatedOffer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteOffer = async (req, res) => {
  try {
    const { id } = req.params;

    const offer = await prisma.offer.findUnique({ where: { id } });
    if (!offer) {
      return res.status(404).json({ success: false, error: 'Offer not found' });
    }

    await prisma.offer.delete({ where: { id } });

    res.json({ success: true, message: 'Offer deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const addOfferToBooklet = async (req, res) => {
  try {
    const { booklet_id, offer_id } = req.body;

    // Check if already exists
    const existing = await prisma.bookletOffer.findUnique({
      where: { bookletId_offerId: { bookletId: booklet_id, offerId: offer_id } },
    });

    if (existing) {
      return res.status(400).json({ success: false, error: 'Offer already added to booklet' });
    }

    const booklet = await prisma.booklet.findUnique({
      where: { id: booklet_id },
    });

    if (!booklet) {
      return res.status(404).json({ success: false, error: 'Booklet not found' });
    }

    const offer = await prisma.offer.findUnique({
      where: { id: offer_id },
    });

    if (!offer) {
      return res.status(404).json({ success: false, error: 'Offer not found' });
    }

    // Enforce business rule: only booklet-type offers can be added to a booklet
    if (offer.offerType !== 'booklet') {
      return res.status(400).json({
        success: false,
        error: 'Only booklet-type offers can be added to a booklet. Add-on offers are separate.',
      });
    }

    // Sync offer validity to booklet validity
    await prisma.offer.update({
      where: { id: offer_id },
      data: { validity: booklet.validity },
    });

    // Create the relationship
    const bookletOffer = await prisma.bookletOffer.create({
      data: { bookletId: booklet_id, offerId: offer_id },
    });

    res.status(201).json({ success: true, message: 'Offer added to booklet', data: bookletOffer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const removeOfferFromBooklet = async (req, res) => {
  try {
    const { booklet_id, offer_id } = req.params;

    await prisma.bookletOffer.delete({
      where: { bookletId_offerId: { bookletId: booklet_id, offerId: offer_id } },
    });

    res.json({ success: true, message: 'Offer removed from booklet' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
