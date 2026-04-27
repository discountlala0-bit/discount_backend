import admin from 'firebase-admin';

const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
};

let firebaseApp;

try {
  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(firebaseAdminConfig),
  });
  console.log('Firebase Admin initialized successfully');
} catch (error) {
  if (error.message.includes('already exists')) {
    console.log('Firebase Admin app already initialized');
  } else {
    console.error('Firebase Admin initialization error:', error.message);
  }
}

export default firebaseApp;
export { admin };