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
        image: true,
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

export const updateMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, image, phoneNumber } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(image !== undefined && { image }),
        ...(phoneNumber !== undefined && { phoneNumber }),
      },
      select: {
        id: true,
        firebaseUid: true,
        phoneNumber: true,
        email: true,
        name: true,
        hasBooklet: true,
        image: true,
        referralCode: true,
        referredBy: true,
        createdAt: true,
      }
    });

    res.json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { image: imageUrl },
      select: {
        id: true,
        firebaseUid: true,
        phoneNumber: true,
        email: true,
        name: true,
        hasBooklet: true,
        image: true,
        referralCode: true,
        referredBy: true,
        createdAt: true,
      }
    });

    res.json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
