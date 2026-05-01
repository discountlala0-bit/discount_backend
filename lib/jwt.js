import jwt from 'jsonwebtoken';

export function generateToken(payload) {
  const secret = process.env.JWT_SECRET || 'fallback-secret';
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

export function buildUserPayload(user) {
  return {
    id: user.id,
    firebaseUid: user.firebaseUid,
    phoneNumber: user.phoneNumber,
  };
}

export function getExpirySeconds() {
  return 7 * 24 * 60 * 60; // 7 days in seconds
}

export function verifyToken(token) {
  const secret = process.env.JWT_SECRET || 'fallback-secret';
  try {
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}
