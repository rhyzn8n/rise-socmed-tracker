import admin from "firebase-admin";

let db;
function getV1Db() {
  if (!admin.apps.length) {
    const raw = process.env.V1_FIREBASE_SERVICE_ACCOUNT;
    if (!raw) throw new Error("V1_FIREBASE_SERVICE_ACCOUNT is not set");
    let creds;
    try {
      const decoded = Buffer.from(raw, "base64").toString("utf-8");
      creds = JSON.parse(decoded);
    } catch (e) {
      throw new Error("V1_FIREBASE_SERVICE_ACCOUNT could not be decoded — make sure it's the base64-encoded version of the service account JSON");
    }
    admin.initializeApp({ credential: admin.credential.cert(creds) });
  }
  if (!db) db = admin.firestore();
  return db;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { ticketId } = req.body || {};
  if (!ticketId) {
    return res.status(400).json({ error: "Missing ticketId" });
  }

  try {
    const db = getV1Db();
    await db.collection("tickets_v2").doc(ticketId).delete();
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Delete failed", detail: String(err) });
  }
}
