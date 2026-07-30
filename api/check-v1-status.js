import { getV1Db } from "./_lib/v1Admin.js";

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
    // Firestore's "in" queries cap at 30 ids per call — chunk to be safe for larger lists.
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
