import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma.js';
import { verifyToken, buildUserPayload } from '../../lib/jwt.js';
import { admin } from '../../config/firebaseAdmin.js';

function isValidE164(phone) {
  if (typeof phone !== 'string') return false;
  const cleaned = phone.trim();
  return /^\+[1-9]\d{7,14}$/.test(cleaned);
}

async function firebaseSendOtp(phone, captchaToken) {
  const apiKey = process.env.FIREBASE_CLIENT_API_KEY;
  if (!apiKey) {
    throw new Error('FIREBASE_CLIENT_API_KEY not configured');
  }

  const url = `https://www.googleapis.com/identitytoolkit/v3/relyingparty/sendVerificationCode?key=${apiKey}`;
  const body = {
    phoneNumber: phone,
    recaptchaToken: captchaToken || 'skip-recaptcha-in-dev',
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    const msg = data?.error?.message || 'Failed to send OTP';
    throw new Error(msg);
  }

  return {
    sessionInfo: data.sessionInfo,
    expiresIn: data.expiresIn || 300,
  };
}

async function firebaseVerifyOtp(sessionInfo, otp) {
  const apiKey = process.env.FIREBASE_CLIENT_API_KEY;
  if (!apiKey) {
    throw new Error('FIREBASE_CLIENT_API_KEY not configured');
  }

  const url = `https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPhoneNumber?key=${apiKey}`;
  const body = {
    sessionInfo,
    code: otp,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    const msg = data?.error?.message || 'Invalid OTP';
    throw new Error(msg);
  }

  return {
    idToken: data.idToken,
    refreshToken: data.refreshToken,
    localId: data.localId,
    phoneNumber: data.phoneNumber,
  };
}

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

export const sendOtp = async (req, res) => {
  const { phone, captchaToken } = req.body;

  if (!isValidE164(phone)) {
    return res.status(400).json({ error: 'Invalid phone number. Must be E.164 format (e.g. +1234567890)' });
  }

  try {
    const { sessionInfo, expiresIn } = await firebaseSendOtp(phone, captchaToken);
    res.json({ sessionInfo, expiresIn });
  } catch (err) {
    console.error('Send OTP failed:', err.message);
    res.status(500).json({ error: err.message });
  }
};

export const verifyOTP = async (req, res) => {
  const { sessionInfo, otp } = req.body;

  const { idToken } = await firebaseVerifyOtp(sessionInfo, otp);

  res.status(200).json({
    success: true,
    message: 'OTP verified successfully',
    firebaseIdToken: idToken,
  });
};

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
  });

  if (!user) {
    return res.status(200).json({
      isNewUser: true,
      firebaseUid: decoded.uid,
      phoneNumber: decoded.phone_number,
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