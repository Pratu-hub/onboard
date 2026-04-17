const admin = require('firebase-admin');
require('dotenv').config();

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

// Sanitize storage bucket name (strip gs:// if present)
const sanitizedBucket = storageBucket?.replace(/^gs:\/\//, '');

// Initialize Firebase Admin only once
if (!admin.apps.length) {
  if (projectId && clientEmail && privateKey && sanitizedBucket) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket: sanitizedBucket
    });
    console.log(`✅ Firebase Admin initialized. Storage Bucket: ${sanitizedBucket}`);
  } else {
    // If no credentials, we still initialize for the sake of starting the server, 
    // but the bucket calls will fail. This supports the "placeholder" .env state.
    console.warn('⚠️ Firebase credentials not fully configured in .env. Storage operations will fail.');
    admin.initializeApp({
      storageBucket: sanitizedBucket || 'placeholder.appspot.com'
    });
  }
}

/**
 * Initializes the container if it doesn't exist.
 * For Firebase, buckets are typically created in the console.
 * We'll just verify the app is initialized.
 */
async function initializeContainer() {
  if (!admin.apps.length) return;
  
  try {
    const bucket = admin.storage().bucket();
    const corsConfiguration = [
      {
        origin: ['*'], // In production, restrict this to the specific frontend domains
        method: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
        responseHeader: ['Content-Type', 'Authorization', 'x-goog-meta-*', 'x-goog-resumable'],
        maxAgeSeconds: 3600
      }
    ];
    await bucket.setCorsConfiguration(corsConfiguration);
    console.log(`✅ Firebase Storage CORS configured. (Bucket: ${admin.app().options.storageBucket})`);
  } catch (error) {
    console.error(`⚠️ Failed to set CORS on Firebase Storage:`, error.message);
  }
}

/**
 * Generates a signed URL for uploading a file directly to the bucket.
 * @param {string} blobName - The unique name for the file.
 * @param {string} contentType - The content type of the file.
 * @param {number} durationMinutes - How long the URL is valid.
 */
async function generateUploadSasUrl(blobName, contentType = 'application/octet-stream', durationMinutes = 30) {
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase credentials missing in .env');
  }

  const bucket = admin.storage().bucket();
  const file = bucket.file(blobName);

  const expires = Date.now() + durationMinutes * 60 * 1000;

  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires,
    contentType
  });

  return url;
}

/**
 * Generates a read-only signed URL for a file.
 */
async function generateReadSasUrl(blobName, durationMinutes = 60) {
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase credentials missing in .env');
  }

  const bucket = admin.storage().bucket();
  const file = bucket.file(blobName);

  const expires = Date.now() + durationMinutes * 60 * 1000;

  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires
  });

  return url;
}

module.exports = {
  initializeContainer,
  generateUploadSasUrl,
  generateReadSasUrl
};
