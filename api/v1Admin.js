import admin from "firebase-admin";

let db;
export function getV1Db() {
  if (!admin.apps.length) {
    const raw = process.env.V1_FIREBASE_SERVICE_ACCOUNT;
    if (!raw) throw new Error("V1_FIREBASE_SERVICE_ACCOUNT is not set");
    let creds;
    try {
      // Expects base64-encoded JSON — sidesteps issues from pasting raw
      // multi-line JSON (with quotes/newlines) into a web form field.
      const decoded = Buffer.from(raw, "base64").toString("utf-8");
      creds = JSON.parse(decoded);
    } catch (e) {
      throw new Error("V1_FIREBASE_SERVICE_ACCOUNT could not be decoded — make sure it's the base64-encoded version of the service account JSON, not the raw file contents");
    }
    admin.initializeApp({ credential: admin.credential.cert(creds) });
  }
  if (!db) db = admin.firestore();
  return db;
}
