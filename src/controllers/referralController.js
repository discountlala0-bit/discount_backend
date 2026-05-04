import { prisma } from '../../lib/prisma.js';

export const getMyReferrals = async (req, res) => {
  try {
    const userId = req.user.id;

    const referrals = await prisma.referralLog.findMany({
      where: { referrerId: userId },
      include: { referredUser: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: referrals });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const recordReferral = async (req, res) => {
  try {
    const { referrer_id, referred_user_id } = req.body;

    if (!referrer_id || !referred_user_id) {
      return res.status(400).json({ success: false, error: 'Referrer ID and referred user ID are required' });
    }

    const existing = await prisma.referralLog.findUnique({
      where: { referrerId_referredUserId: { referrerId: referrer_id, referredUserId: referred_user_id } },
    });

    if (existing) {
      return res.status(400).json({ success: false, error: 'Referral already recorded' });
    }

    const referral = await prisma.referralLog.create({
      data: {
        referrerId: referrer_id,
        referredUserId: referred_user_id,
        rewardStatus: 'pending',
      },
    });

    await prisma.user.update({
      where: { id: referred_user_id },
      data: { referredBy: referrer_id },
    });

    res.status(201).json({ success: true, message: 'Referral recorded', data: referral });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const processReferralReward = async (req, res) => {
  try {
    const { referral_id, reward_status } = req.body;

    if (!referral_id || !reward_status) {
      return res.status(400).json({ success: false, error: 'Referral ID and reward status are required' });
    }

    const referral = await prisma.referralLog.findUnique({ where: { id: referral_id } });
    if (!referral) {
      return res.status(404).json({ success: false, error: 'Referral not found' });
    }

    const updatedReferral = await prisma.referralLog.update({
      where: { id: referral_id },
      data: { rewardStatus: reward_status },
    });

    res.json({ success: true, message: 'Referral reward updated', data: updatedReferral });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllReferrals = async (req, res) => {
  try {
    const { reward_status } = req.query;

    const where = {};
    if (reward_status) where.rewardStatus = reward_status;

    const referrals = await prisma.referralLog.findMany({
      where,
      include: { referrer: true, referredUser: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: referrals });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
