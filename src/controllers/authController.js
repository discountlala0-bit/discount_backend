import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma.js';
import { verifyToken, buildUserPayload } from '../../lib/jwt.js';
import { admin } from '../../config/firebaseAdmin.js';

async function firebaseVerifyIdToken(idToken) {
  try {
    if (!admin.apps.length) {
      console.error('Firebase Admin not initialized');
      return null;
    }
    const decoded = await admin.auth().verifyIdToken(idToken);
    return decoded;
  } catch (err) {
    console.error('Firebase ID token verification failed:', {
      message: err.message,
      code: err.code,
      idTokenPreview: idToken ? idToken.substring(0, 20) + '...' : 'undefined'
    });
    return null;
  }
}

export const verifyIdToken = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: 'idToken is required' });
  }

  const decoded = await firebaseVerifyIdToken(idToken);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid Firebase ID token' });
  }

  const user = await prisma.user.findUnique({
    where: { firebaseUid: decoded.uid },
    select: {
      id: true,
      firebaseUid: true,
      phoneNumber: true,
      email: true,
      name: true,
      hasBooklet: true,
      referralCode: true,
      isActive: true,
    }
  });

  if (!user) {
    return res.status(200).json({
      isNewUser: true,
      firebaseUid: decoded.uid,
      phoneNumber: decoded.phone_number,
    });
  }

  if (!user.isActive) {
    return res.status(403).json({
      success: false,
      error: 'Account deactivated. Please contact admin to reactivate your account.',
    });
  }

  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
  const token = jwt.sign(
    {
      id: user.id,
      firebaseUid: user.firebaseUid,
      phoneNumber: user.phoneNumber,
    },
    jwtSecret,
    { expiresIn: '7d' }
  );

  res.json({
    isNewUser: false,
    token,
    user,
  });
};

export const register = async (req, res) => {
  const { firebaseIdToken, email, name } = req.body;

  const decoded = await firebaseVerifyIdToken(firebaseIdToken);

  const existingUser = await prisma.user.findUnique({
    where: { firebaseUid: decoded.uid },
  });

  if (existingUser) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const user = await prisma.user.create({
    data: {
      firebaseUid: decoded.uid,
      phoneNumber: decoded.phone_number,
      email,
      name,
    },
  });

  const token = jwt.sign(
    {
      id: user.id,
      firebaseUid: user.firebaseUid,
      phoneNumber: user.phoneNumber,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    token,
    user,
  });
};