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

  const { ticketIds = [] } = req.body || {};
  if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
    return res.status(200).json({ statuses: {} });
  }

  try {
    const db = getV1Db();
    const chunks = [];
    for (let i = 0; i < ticketIds.length; i += 30) chunks.push(ticketIds.slice(i, i + 30));

    const statuses = {};
    for (const chunk of chunks) {
      const snap = await db.collection("tickets_v2").where("id", "in", chunk).get();
      snap.forEach((doc) => {
        const data = doc.data();
        statuses[doc.id] = { status: data.status || null, dateCompleted: data.dateCompleted || null };
      });
    }

    return res.status(200).json({ statuses });
  } catch (err) {
    return res.status(500).json({ error: "Status check failed", detail: String(err) });
  }
}
