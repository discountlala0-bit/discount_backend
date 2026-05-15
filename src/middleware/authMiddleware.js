import { prisma } from '../../lib/prisma.js';
import { verifyToken } from '../../lib/jwt.js';

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Invalid token format' });
  }

  const decoded = verifyToken(token);
  if (!decoded || !decoded.id) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: { id: true, isActive: true },
  });

  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  if (!user.isActive) {
    return res.status(403).json({
      success: false,
      error: 'Account deactivated. Please contact admin to reactivate your account.',
    });
  }

  req.user = decoded;
  next();
};
