import { prisma } from '../../lib/prisma.js';

export const getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firebaseUid: true,
        phoneNumber: true,
        email: true,
        name: true,
        hasBooklet: true,
        referralCode: true,
        referredBy: true,
        createdAt: true,
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
