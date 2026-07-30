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

// V1's content-type field only has two values — map the socmed tracker's
// richer creative-type taxonomy down to whichever one fits closest.
function mapContentType(creativeType) {
  return creativeType === "Reel/Video/Animation" ? "Video" : "Static";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    title, description = "", requesterNotes = "", dept = "Other", priority = "Normal",
    dueDate = null, purposes = [], creativeType, requesterEmail = "", creativeRef = "",
  } = req.body || {};

  if (!title) {
    return res.status(400).json({ error: "Missing title" });
  }

  try {
    const db = getV1Db();

    let requestedById = "";
    let finalNotes = requesterNotes;
    if (requesterEmail) {
      try {
        const rosterSnap = await db.collection("roster_v2").where("email", "==", requesterEmail).limit(1).get();
        if (!rosterSnap.empty) {
          requestedById = rosterSnap.docs[0].id;
        } else {
          finalNotes = finalNotes ? `${finalNotes} (Requested by: ${requesterEmail})` : `Requested by: ${requesterEmail}`;
        }
      } catch (e) {
        finalNotes = finalNotes ? `${finalNotes} (Requested by: ${requesterEmail})` : `Requested by: ${requesterEmail}`;
      }
    }

    const docRef = db.collection("tickets_v2").doc();
    const nowIso = new Date().toISOString();
    const today = nowIso.slice(0, 10);

    const seqRef = db.collection("shared").doc("ticket_seq");
    const nextTicketNo = await db.runTransaction(async (tx) => {
      const seqSnap = await tx.get(seqRef);
      const current = seqSnap.exists ? (seqSnap.data().value || 0) : 0;
      const next = current + 1;
      tx.set(seqRef, { value: next });
      return next;
    });

    const ticket = {
      id: docRef.id,
      ticketNo: nextTicketNo,
      title,
      description,
      requesterNotes: finalNotes,
      requestedBy: requestedById,
      assignedTo: null,
      dept,
      contentType: mapContentType(creativeType),
      priority,
      dueDate: dueDate || null,
      purposes,
      referenceLink: creativeRef || "",
      hasImage: !!creativeRef,
      status: "New",
      units: null,
      briefCompliance: null,
      satisfactionScore: null,
      dateRequested: today,
      dateCompleted: null,
      revisionRequests: [],
      revisions: [],
      history: [
        { action: "Request logged (synced from Rise Social Media Tracker)", by: requesterEmail || "SocMed Sync", date: nowIso },
      ],
    };

    await docRef.set(ticket);

    return res.status(200).json({ success: true, ticketId: docRef.id, ticketNo: nextTicketNo });
  } catch (err) {
    return res.status(500).json({ error: "Sync failed", detail: String(err) });
  }
}
