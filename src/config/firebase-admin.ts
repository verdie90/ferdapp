import * as admin from 'firebase-admin';

let adminApp: admin.app.App;

export function getAdminApp(): admin.app.App {
  if (!adminApp) {
    if (!process.env.FIREBASE_ADMIN_SDK_KEY) {
      throw new Error('FIREBASE_ADMIN_SDK_KEY environment variable is not set');
    }

    // Parse the JSON key
    let serviceAccount: admin.ServiceAccount;
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_KEY);
    } catch {
      throw new Error(
        'Failed to parse FIREBASE_ADMIN_SDK_KEY. Make sure it is valid JSON'
      );
    }

    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }

  return adminApp;
}

export function getAdminAuth(): admin.auth.Auth {
  return getAdminApp().auth();
}

export function getAdminDb(): admin.firestore.Firestore {
  return getAdminApp().firestore();
}

export function getAdminStorage(): admin.storage.Storage {
  return getAdminApp().storage();
}
