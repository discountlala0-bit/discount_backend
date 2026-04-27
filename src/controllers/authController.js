import { admin } from '../../config/firebaseAdmin.js';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../../config/supabaseClient.js';

export const verifyOTP = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'ID token is required' });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);

    if (supabaseAdmin) {
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('uid', decodedToken.uid)
        .single();

      if (!existingUser) {
        await supabaseAdmin
          .from('users')
          .insert([{
            uid: decodedToken.uid,
            phone: decodedToken.phone_number,
            created_at: new Date().toISOString(),
          }]);
      }
    }

    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    const token = jwt.sign(
      {
        uid: decodedToken.uid,
        phone: decodedToken.phone_number,
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'User verified successfully',
      token,
      user: {
        uid: decodedToken.uid,
        phone: decodedToken.phone_number,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: error.message });
  }
};