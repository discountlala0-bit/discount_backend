import jwt from 'jsonwebtoken';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '120d';

export function generateToken(payload) {
  const secret = process.env.JWT_SECRET || 'fallback-secret';
  return jwt.sign(payload, secret, { expiresIn: JWT_EXPIRES_IN });
}

export function buildUserPayload(user) {
  return {
    id: user.id,
    firebaseUid: user.firebaseUid,
    phoneNumber: user.phoneNumber,
  };
}

export function getExpirySeconds() {
  return 120 * 24 * 60 * 60; // 120 days (~4 months) in seconds
}

export function verifyToken(token) {
  const secret = process.env.JWT_SECRET || 'fallback-secret';
  try {
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}
