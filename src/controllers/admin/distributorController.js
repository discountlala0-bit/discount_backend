import { prisma } from '../../../lib/prisma.js';

export const createDistributor = async (req, res) => {
  try {
    const { name, phone, email, referral_code, commission_percentage } = req.body;

    if (!name || !phone || !referral_code) {
      return res.status(400).json({ success: false, error: 'Name, phone, and referral code are required' });
    }

    const existing = await prisma.distributor.findFirst({
      where: { OR: [{ phone }, { referralCode: referral_code }] },
    });

    if (existing) {
      return res.status(400).json({ success: false, error: 'Phone or referral code already exists' });
    }

    const distributor = await prisma.distributor.create({
      data: {
        name,
        phone,
        email,
        referralCode: referral_code,
        commissionPercentage: commission_percentage || 0,
      },
    });

    res.status(201).json({ success: true, message: 'Distributor created successfully', data: distributor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getDistributors = async (req, res) => {
  try {
    const distributors = await prisma.distributor.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: distributors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getDistributorById = async (req, res) => {
  try {
    const { id } = req.params;

    const distributor = await prisma.distributor.findUnique({
      where: { id },
      include: {
        commissions: { include: { order: true } },
      },
    });

    if (!distributor) {
      return res.status(404).json({ success: false, error: 'Distributor not found' });
    }

    res.json({ success: true, data: distributor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateDistributor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, referral_code, commission_percentage } = req.body;

    const distributor = await prisma.distributor.findUnique({ where: { id } });
    if (!distributor) {
      return res.status(404).json({ success: false, error: 'Distributor not found' });
    }

    const updatedDistributor = await prisma.distributor.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(email !== undefined && { email }),
        ...(referral_code && { referralCode: referral_code }),
        ...(commission_percentage !== undefined && { commissionPercentage: commission_percentage }),
      },
    });

    res.json({ success: true, message: 'Distributor updated successfully', data: updatedDistributor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCommissions = async (req, res) => {
  try {
    const { distributor_id, status } = req.query;

    const where = {};
    if (distributor_id) where.distributorId = distributor_id;
    if (status) where.status = status;

    const commissions = await prisma.distributorCommission.findMany({
      where,
      include: { distributor: true, order: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: commissions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateCommissionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }

    const commission = await prisma.distributorCommission.findUnique({ where: { id } });
    if (!commission) {
      return res.status(404).json({ success: false, error: 'Commission not found' });
    }

    const updated = await prisma.distributorCommission.update({
      where: { id },
      data: { status },
    });

    res.json({ success: true, message: 'Commission status updated', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
