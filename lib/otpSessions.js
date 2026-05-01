const otpSessions = new Map();

export function storeOtpSession(phone, sessionInfo, expiresIn) {
  const expiresAt = Date.now() + expiresIn * 1000;
  otpSessions.set(phone, { sessionInfo, expiresAt });
}

export function getOtpSession(phone) {
  const session = otpSessions.get(phone);
  if (!session) return null;
  
  if (Date.now() > session.expiresAt) {
    otpSessions.delete(phone);
    return null;
  }
  
  return session;
}

export function removeOtpSession(phone) {
  otpSessions.delete(phone);
}

export default otpSessions;
