import { prisma } from '../../../lib/prisma.js';

export const getDeactivatedUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { isActive: false },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        deactivatedAt: true,
        createdAt: true,
      },
      orderBy: { deactivatedAt: 'desc' },
    });

    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const reactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, isActive: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.isActive) {
      return res.status(400).json({ success: false, error: 'User is already active' });
    }

    await prisma.user.update({
      where: { id },
      data: {
        isActive: true,
        deactivatedAt: null,
      },
    });

    res.json({ success: true, message: 'User reactivated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
