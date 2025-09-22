import admin from "firebase-admin";
import { readFileSync } from "fs";

// You need a service account key from your Firebase project
// Download from Firebase Console → Project settings → Service accounts → Generate new private key
const serviceAccount = JSON.parse(
  readFileSync(new URL("./serviceAccountKey.json", import.meta.url))
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "campus-conecto.appspot.com" // your bucket name
  });
}

const bucket = admin.storage().bucket();

export default bucket;