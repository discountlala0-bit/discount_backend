import { prisma } from '../../lib/prisma.js';

export const getTermsAndConditions = async (req, res) => {
  try {
    const terms = await prisma.termsAndConditions.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ success: true, data: { content: terms?.content ?? [] } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPrivacyPolicy = async (req, res) => {
  try {
    const policy = await prisma.privacyPolicy.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ success: true, data: { content: policy?.content ?? [] } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
