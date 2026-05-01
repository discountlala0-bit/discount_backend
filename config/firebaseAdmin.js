import admin from 'firebase-admin';

const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
};

console.log('Firebase Admin Config Check:', {
  projectId: firebaseAdminConfig.projectId ? 'Set' : 'Missing',
  privateKey: firebaseAdminConfig.privateKey ? 'Set (length: ' + firebaseAdminConfig.privateKey.length + ')' : 'Missing',
  clientEmail: firebaseAdminConfig.clientEmail ? 'Set' : 'Missing',
});

let firebaseApp;

try {
  if (!admin.apps.length) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(firebaseAdminConfig),
    });
    console.log('Firebase Admin initialized successfully');
  } else {
    firebaseApp = admin.apps[0];
    console.log('Firebase Admin app already initialized');
  }
} catch (error) {
  console.error('Firebase Admin initialization error:', error.message);
}

export default firebaseApp;
export { admin };