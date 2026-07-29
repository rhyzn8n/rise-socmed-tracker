import admin from "firebase-admin";

let db;
function getDb() {
  if (!admin.apps.length) {
    const raw = process.env.V1_FIREBASE_SERVICE_ACCOUNT;
    if (!raw) throw new Error("V1_FIREBASE_SERVICE_ACCOUNT is not set");
    let creds;
    try {
      creds = JSON.parse(raw);
    } catch (e) {
      throw new Error("V1_FIREBASE_SERVICE_ACCOUNT is not valid JSON — check for extra quotes or line breaks introduced when pasting into Vercel");
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
    const db = getDb();

    // Try to match the requester's email to an existing V1 roster entry.
    // If roster_v2 doesn't actually store an "email" field, or there's no
    // match, this just falls back to leaving requestedBy blank and noting
    // the email in requesterNotes instead — nothing breaks either way.
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

    // Ticket numbers are sequential in V1 — find the current highest and add one.
    const lastTicketSnap = await db.collection("tickets_v2").orderBy("ticketNo", "desc").limit(1).get();
    const nextTicketNo = lastTicketSnap.empty ? 1 : (lastTicketSnap.docs[0].data().ticketNo || 0) + 1;

    const docRef = db.collection("tickets_v2").doc();
    const nowIso = new Date().toISOString();
    const today = nowIso.slice(0, 10);

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
      status: "Pending",
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
