import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as fs from 'fs';

// Load service account JSON (downloaded from Firebase Console)
const serviceAccount = JSON.parse(
  fs.readFileSync(
    './made-in-china-c44be-firebase-adminsdk-fbsvc-deee454b1c.json',
    'utf8'
  )
);

initializeApp({
  credential: cert(serviceAccount),
});

async function createAdmin() {
  const auth = getAuth();
  const user = await auth.createUser({
    email: 'admin.admin@madeinchina.com',
    password: 'Admin123@',
    displayName: 'Super Admin',
    emailVerified: true,
  });

  await auth.setCustomUserClaims(user.uid, {
    role: 'SuperAdmin',
    permissions: [
      'catalog:list',
      'catalog:create',
      'catalog:update',
      'catalog:delete',
    ],
  });

  console.log('✅ Created admin:', {
    uid: user.uid,
    email: user.email,
    role: 'SuperAdmin',
  });
}

createAdmin().catch(console.error);
