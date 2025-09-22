import admin from "firebase-admin";

// Initialize with env vars (no JSON file)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),  // Replace \n with actual newlines
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL
    }),
    storageBucket: "campus-conecto.appspot.com"  // Your bucket
  });
}

const bucket = admin.storage().bucket();

export default bucket;