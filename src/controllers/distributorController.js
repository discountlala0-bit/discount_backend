import { prisma } from '../../lib/prisma.js';

export const validateDistributorCode = async (req, res) => {
  try {
    const { code } = req.params;

    const distributor = await prisma.distributor.findUnique({
      where: { referralCode: code },
    });

    if (!distributor) {
      return res.status(404).json({ success: false, error: 'Invalid distributor code' });
    }

    res.json({
      success: true,
      data: {
        distributorId: distributor.id,
        name: distributor.name,
        discountPercentage: distributor.discountPercentage,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
