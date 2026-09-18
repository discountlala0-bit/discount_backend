import { prisma } from '../../../lib/prisma.js';

const validateSections = (content) => {
  if (!Array.isArray(content) || content.length === 0) {
    return 'Content must contain at least one section';
  }

  for (const section of content) {
    if (!section || typeof section.title !== 'string' || !section.title.trim()) {
      return 'Each section must have a title';
    }
    if (section.type === 'paragraph') {
      if (typeof section.text !== 'string' || !section.text.trim()) {
        return `Section "${section.title}" must have text`;
      }
    } else if (section.type === 'bullets') {
      if (!Array.isArray(section.items) || section.items.length === 0 ||
        !section.items.every((item) => typeof item === 'string' && item.trim())) {
        return `Section "${section.title}" must have at least one point`;
      }
    } else {
      return `Section "${section.title}" has an invalid type`;
    }
  }

  return null;
};

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

export const updateTermsAndConditions = async (req, res) => {
  try {
    const { content } = req.body;

    const validationError = validateSections(content);
    if (validationError) {
      return res.status(400).json({ success: false, error: validationError });
    }

    const existing = await prisma.termsAndConditions.findFirst();

    const terms = existing
      ? await prisma.termsAndConditions.update({ where: { id: existing.id }, data: { content } })
      : await prisma.termsAndConditions.create({ data: { content } });

    res.json({ success: true, message: 'Terms & Conditions updated successfully', data: terms });
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

export const updatePrivacyPolicy = async (req, res) => {
  try {
    const { content } = req.body;

    const validationError = validateSections(content);
    if (validationError) {
      return res.status(400).json({ success: false, error: validationError });
    }

    const existing = await prisma.privacyPolicy.findFirst();

    const policy = existing
      ? await prisma.privacyPolicy.update({ where: { id: existing.id }, data: { content } })
      : await prisma.privacyPolicy.create({ data: { content } });

    res.json({ success: true, message: 'Privacy Policy updated successfully', data: policy });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
