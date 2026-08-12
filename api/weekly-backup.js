import admin from "firebase-admin";

let db;
function getDb() {
  if (!admin.apps.length) {
    const raw = process.env.SOCMED_FIREBASE_SERVICE_ACCOUNT;
    if (!raw) throw new Error("SOCMED_FIREBASE_SERVICE_ACCOUNT is not set");
    let creds;
    try {
      const decoded = Buffer.from(raw, "base64").toString("utf-8");
      creds = JSON.parse(decoded);
    } catch (e) {
      throw new Error("SOCMED_FIREBASE_SERVICE_ACCOUNT could not be decoded — make sure it's the base64-encoded version of the service account JSON");
    }
    admin.initializeApp({ credential: admin.credential.cert(creds) });
  }
  if (!db) db = admin.firestore();
  return db;
}

const DOC_NAMES = [
  "requests", "channelStats", "targets", "captions", "templates",
  "extraServices", "channelsList", "favicon", "theme", "notes", "events", "restrictedAccess",
];

export default async function handler(req, res) {
  // Vercel signs its own cron requests with this header — this just makes sure some
  // random request off the internet can't trigger (or spam) the backup endpoint.
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const db = getDb();
    const snaps = await Promise.all(DOC_NAMES.map((name) => db.collection("riseSocMedData").doc(name).get()));

    const snapshot = { savedAt: new Date().toISOString(), source: "weekly-auto-backup" };
    DOC_NAMES.forEach((name, i) => {
      snapshot[name] = snaps[i].exists ? snaps[i].data().value : null;
    });

    // One rolling backup document — each run overwrites the last, as requested.
    await db.collection("riseSocMedData").doc("autoBackup").set({ value: snapshot });

    return res.status(200).json({ success: true, savedAt: snapshot.savedAt });
  } catch (err) {
    return res.status(500).json({ error: "Backup failed", detail: String(err) });
  }
}
