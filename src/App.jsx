import React, { useState, useEffect, useMemo, useRef } from "react";
import { db, auth } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line, Legend, LabelList
} from "recharts";
import {
  LayoutDashboard, ClipboardList, TrendingUp, Target, Plus, X,
  ChevronDown, Filter, ArrowUp, ArrowDown, CheckCircle2, Clock,
  Circle, Search, AlertTriangle, ChevronUp, MessageSquareText, Copy, Sparkles, Wand2, Hash, FileText,
  CalendarDays, ChevronLeft, ChevronRight, Bell, Ban, RotateCcw, Pencil, Trash2, Smile,
  Bold, Italic, CaseUpper, CaseLower, CaseSensitive, ShieldCheck, Maximize2, BarChart3, Printer, Grid2X2, PauseCircle, ExternalLink, Image as ImageIcon, Palette, StickyNote,
  PartyPopper, ListChecks, Users, Award, CheckSquare, Square, Download, Upload, DatabaseBackup
} from "lucide-react";

/* ---------------------------------- DATA ---------------------------------- */

const MAJOR_SERVICES = ["NCLEX Australia","NCLEX Canada","NCLEX USA","Middle East Exam","Ireland (NMBI)","UKNMC Nursing","UKNMC Midwifery","IPASS Online Review","IPASS PNLE","Visascreen","VisaKey"];
const MINOR_SERVICES = ["New Mexico","NAI PH","Australia Tourist Visa","License Endorsement","OPRA","Australia Midwifery","ASCPi","US License Renewal","Australia License Renewal","Truemerit","CPD","CVS NZ/NCNZ","Hopkins","MedTec Middle East","RadTech Middle East","MET","NNAS","PRC","Score Transfer","UWORLD","WES"];
const CREATIVE_TYPES = ["Infographics/Information","Blog Cover","Motivational Content","Promo","Reel/Video/Animation","Educational","Event","Passers","Testimonial"];
const ALL_SERVICES = [...MAJOR_SERVICES, ...MINOR_SERVICES];
const EXTRA_MAJOR_COLOR_POOL = ["#7A6FB0", "#4C8FBD", "#A8763E", "#5C8A3A", "#8A4B6B"];
const PIE_COLORS = ["#146356", "#E8A33D", "#4C8C6B", "#B0538A", "#3E7CB1", "#C4544A", "#2E7D6B", "#9AA39B", "#0E2B27"];
// Only these login emails are ever treated as Admin — a code-level lock, same pattern as Rise V1.
// Admin cannot be granted through the app UI; edit this list and redeploy to change it.
const ADMIN_EMAILS = ["ryemarketing20@gmail.com"];
const MAJOR_SERVICE_COLOR = {
  "NCLEX Australia": "#146356",
  "NCLEX Canada": "#3E7CB1",
  "NCLEX USA": "#C4544A",
  "Middle East": "#E8A33D",
  "Ireland": "#4C8C6B",
  "UKNMC/Midwife": "#B0538A",
  "Online Review": "#0E2B27",
};
const MINOR_SERVICE_COLOR = "#9AA39B";

const CHANNELS = [
  { id: "main",    name: "IPASS Main",                     platform: "Facebook", color: "#146356" },
  { id: "ig",      name: "IPASS Instagram",                platform: "Instagram", color: "#B0538A" },
  { id: "ora",     name: "IPASS Online Review & Academy",  platform: "Facebook", color: "#3E7CB1" },
  { id: "pnle",    name: "IPASS PNLE Review Academy",      platform: "Facebook", color: "#4C8C6B" },
  { id: "pnletok", name: "IPASS PNLE TikTok",              platform: "TikTok", color: "#1F1F1F" },
  { id: "yt",      name: "IPASS YouTube",                  platform: "YouTube", color: "#C4544A" },
  { id: "tiktok",  name: "IPASS TikTok",                   platform: "TikTok", color: "#2B2B2B" },
];
const EXTRA_CHANNEL_COLOR_POOL = ["#7A6FB0", "#4C8FBD", "#A8763E", "#5C8A3A", "#8A4B6B", "#C4544A", "#E8A33D"];

const STATUS = ["Pending", "In Progress", "Completed"];
const STATUS_ICON = { "Pending": Circle, "In Progress": Clock, "Completed": CheckCircle2 };
const STATUS_COLOR = { "Pending": "#9AA39B", "In Progress": "#E8A33D", "Completed": "#146356" };
const DEPTS = ["Social Media", "SEO", "Digital Marketing", "Operations", "Management", "Finance", "Other"];
const PRIORITIES = ["Low", "Normal", "High", "Urgent"];
const PRIORITY_COLOR = { Low: "#9AA39B", Normal: "#146356", High: "#E8A33D", Urgent: "#C4544A" };
const PURPOSES = ["Ads", "YouTube", "TikTok", "Facebook/IG", "Website", "Other"];
const POST_STATUSES = ["Pending", "Posted", "Cancelled", "Rescheduled", "Flagged", "Hold"];
const POST_STATUS_COLOR = { "Pending": "#9AA39B", "Posted": "#146356", "Cancelled": "#C4544A", "Rescheduled": "#E8A33D", "Flagged": "#B0538A", "Hold": "#3E7CB1" };
const POST_STATUS_ICON = { "Pending": Circle, "Posted": CheckCircle2, "Cancelled": Ban, "Rescheduled": RotateCcw, "Flagged": AlertTriangle, "Hold": PauseCircle };

const EVENT_TYPES = ["Zoom Webinar", "Facebook", "TikTok Webinar", "Partner Event", "Face to Face", "Other"];
const EVENT_STATUSES = ["Upcoming", "Rescheduled", "Cancelled", "Completed"];
const EVENT_STATUS_COLOR = { "Upcoming": "#3E7CB1", "Rescheduled": "#E8A33D", "Cancelled": "#C4544A", "Completed": "#146356" };
const EVENT_STATUS_ICON = { "Upcoming": Circle, "Rescheduled": RotateCcw, "Cancelled": Ban, "Completed": CheckCircle2 };

const BENCHMARKS = {
  Facebook:  { growth: [[0.5,"Low"],[1,"Healthy"],[2,"Good"],[3,"Very Good"],[Infinity,"Excellent"]], engagement: [[0.5,"Low"],[1,"Average"],[2,"Strong"],[3,"Excellent"],[Infinity,"Top-Performing"]] },
  Instagram: { growth: [[0.5,"Low"],[1.5,"Healthy"],[3,"Good"],[5,"Very Good"],[Infinity,"Excellent"]], engagement: [[0.3,"Low"],[0.6,"Healthy"],[1.5,"Good"],[3,"Very Good"],[Infinity,"Excellent"]] },
  TikTok:    { growth: [[1,"Low"],[2.5,"Healthy"],[5,"Good"],[8,"Very Good"],[Infinity,"Excellent"]], engagement: [[1,"Low"],[2.5,"Healthy"],[4,"Good"],[6,"Very Good"],[Infinity,"Excellent"]] },
  YouTube:   { growth: [[0.3,"Low"],[0.8,"Healthy"],[1.5,"Good"],[3,"Very Good"],[Infinity,"Excellent"]], engagement: [[0.5,"Low"],[1,"Healthy"],[2,"Good"],[4,"Very Good"],[Infinity,"Excellent"]] },
};
const RATING_COLOR = { "Low": "#C4544A", "Healthy": "#E8A33D", "Average": "#E8A33D", "Good": "#4C8C6B", "Strong": "#4C8C6B", "Very Good": "#2E7D6B", "Excellent": "#146356", "Top-Performing": "#0E2B27" };

const CAPTION_STATUS = ["Draft", "Approved", "Used"];
const CAPTION_STATUS_COLOR = { "Draft": "#9AA39B", "Approved": "#E8A33D", "Used": "#146356" };
// Practical recommended caption lengths per platform (not the hard technical max — the point where engagement typically drops)
const PLATFORM_CAPTION_LIMIT = { Facebook: 250, Instagram: 2200, TikTok: 300, YouTube: 1000 };

function rate(platform, kind, value) {
  const tiers = BENCHMARKS[platform]?.[kind];
  if (!tiers) return "—";
  for (const [max, label] of tiers) if (value < max) return label;
  return tiers[tiers.length - 1][1];
}

const monthLabel = (ym) => new Date(ym + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" });
function getReportRange(periodType, cursor, customStart, customEnd) {
  const fmt = (x) => localDateStr(x);
  if (periodType === "custom") {
    return { start: customStart || fmt(cursor), end: customEnd || fmt(cursor), label: customStart && customEnd ? `${customStart} to ${customEnd}` : "Pick a custom range" };
  }
  if (periodType === "week") {
    const d = new Date(cursor); d.setDate(d.getDate() - d.getDay());
    const start = new Date(d); const end = new Date(d); end.setDate(start.getDate() + 6);
    return { start: fmt(start), end: fmt(end), label: `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` };
  }
  if (periodType === "quarter") {
    const q = Math.floor(cursor.getMonth() / 3);
    const start = new Date(cursor.getFullYear(), q * 3, 1);
    const end = new Date(cursor.getFullYear(), q * 3 + 3, 0);
    return { start: fmt(start), end: fmt(end), label: `Q${q + 1} ${cursor.getFullYear()}` };
  }
  const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  return { start: fmt(start), end: fmt(end), label: cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" }) };
}
const uid = () => Math.random().toString(36).slice(2, 10);
function syncRequestToV1(req, requesterEmail, setRequests) {
  fetch("/api/sync-to-v1", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: req.title, description: req.description || "", requesterNotes: req.requesterNotes || "",
      dept: req.dept || "Other", priority: req.priority || "Normal", dueDate: req.dueDate || null,
      purposes: req.purposes || [], creativeType: req.creativeType, requesterEmail: requesterEmail || req.requestedBy || "",
      creativeRef: req.creativeRef || req.imageUrl || "",
    }),
  }).then(r => r.json()).then(data => {
    if (data?.success && data.ticketId && setRequests) {
      setRequests(rs => rs.map(r => r.id === req.id ? { ...r, v1TicketId: data.ticketId, v1TicketNo: data.ticketNo } : r));
    }
  }).catch(() => { /* sync is best-effort — a failed push doesn't block logging the request locally */ });
}
// IMPORTANT: never use Date.toISOString() for calendar/"today" logic — it converts to UTC,
// which silently shifts the date backward for anyone in a timezone ahead of UTC (e.g. PH, UTC+8),
// making "today" look like yesterday. These two helpers stay in local time instead.
function localDateStr(d) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function localMonthStr(d) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
// Splits a month into simple 7-day blocks (day 1–7, 8–14, 15–21, 22–28, and a final
// partial block for whatever's left, e.g. 29–30/31) — used so a "weekly" target can
// show every week of the current month as its own progress bar, all against the same
// goal, instead of just one rolling "current week" number.
function getMonthWeeks(date) {
  const year = date.getFullYear(), month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks = [];
  let dayStart = 1, weekNum = 1;
  while (dayStart <= daysInMonth) {
    const dayEnd = Math.min(dayStart + 6, daysInMonth);
    const pad = (n) => String(n).padStart(2, "0");
    weeks.push({
      label: `Week ${weekNum}`,
      start: `${year}-${pad(month + 1)}-${pad(dayStart)}`,
      end: `${year}-${pad(month + 1)}-${pad(dayEnd)}`,
    });
    dayStart += 7; weekNum += 1;
  }
  return weeks;
}
function aggregateChannelStats(rows, granularity) {
  if (granularity === "month") {
    return rows.map(r => ({ label: monthLabel(r.month), month: r.month, growthPct: r.growthPct, engagement30: r.engagement30, engagement15: r.engagement15, followers: r.followers }));
  }
  const groups = {};
  rows.forEach(r => {
    const [y, m] = r.month.split("-").map(Number);
    const key = granularity === "quarter" ? `${y} Q${Math.floor((m - 1) / 3) + 1}` : `${y}`;
    (groups[key] = groups[key] || []).push(r);
  });
  return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0])).map(([key, items]) => ({
    label: key,
    growthPct: items.reduce((s, i) => s + i.growthPct, 0) / items.length,
    engagement30: items.reduce((s, i) => s + i.engagement30, 0) / items.length,
    engagement15: items.reduce((s, i) => s + i.engagement15, 0) / items.length,
    followers: items[items.length - 1].followers,
  }));
}

// Social platforms render plain text only — no real bold/italic HTML. The common
// workaround people actually use is swapping characters for Unicode "Mathematical
// Alphanumeric" lookalikes, which display as bold/italic anywhere plain text renders.
function toUnicodeBold(str) {
  return str.replace(/[a-zA-Z0-9]/g, (ch) => {
    const code = ch.charCodeAt(0);
    if (ch >= "A" && ch <= "Z") return String.fromCodePoint(0x1D400 + (code - 65));
    if (ch >= "a" && ch <= "z") return String.fromCodePoint(0x1D41A + (code - 97));
    if (ch >= "0" && ch <= "9") return String.fromCodePoint(0x1D7CE + (code - 48));
    return ch;
  });
}
function toUnicodeItalic(str) {
  return str.replace(/[a-zA-Z]/g, (ch) => {
    if (ch === "h") return "\u210E"; // italic 'h' has its own historical code point
    const code = ch.charCodeAt(0);
    if (ch >= "A" && ch <= "Z") return String.fromCodePoint(0x1D434 + (code - 65));
    if (ch >= "a" && ch <= "z") return String.fromCodePoint(0x1D44E + (code - 97));
    return ch;
  });
}
const CAPTION_EMOJIS = ["😊","🎉","✅","📢","💡","🩺","🎓","📚","🇵🇭","❤️","🔥","👏","📝","⭐","➡️","📌","🙌","💯","📅","🚨"];
function primaryService(services, extraMajor = []) {
  const allMajorNames = [...MAJOR_SERVICES, ...extraMajor];
  const major = (services || []).find(s => allMajorNames.includes(s));
  if (major) {
    const color = MAJOR_SERVICE_COLOR[major] || EXTRA_MAJOR_COLOR_POOL[extraMajor.indexOf(major) % EXTRA_MAJOR_COLOR_POOL.length];
    return { name: major, color, isMajor: true };
  }
  const minor = (services || [])[0];
  return minor ? { name: minor, color: MINOR_SERVICE_COLOR, isMajor: false } : { name: "Unassigned", color: "#C9CFC7", isMajor: false };
}

/* ---------------------------------- APP ---------------------------------- */

export default function RiseSocMedTracker() {
  const [tab, setTab] = useState("dashboard");
  const [requests, setRequests] = useState([]);
  const [channelStats, setChannelStats] = useState({});
  const [targets, setTargets] = useState([]);
  const [captions, setCaptions] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [extraServices, setExtraServices] = useState({ major: [...MAJOR_SERVICES], minor: [...MINOR_SERVICES] });
  const [channelsVersion, setChannelsVersion] = useState(0);
  const [faviconUrl, setFaviconUrl] = useState("");
  const [faviconModalOpen, setFaviconModalOpen] = useState(false);
  const [theme, setTheme] = useState({ bg: "#F5F6F1", accent: "#146356", sidebar: "#0E2B27" });
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [notes, setNotes] = useState([]);
  const [events, setEvents] = useState([]);
  const [restrictedAccess, setRestrictedAccess] = useState({ eventsOnly: [] });
  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [pendingSaves, setPendingSaves] = useState(0);

  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setAuthChecked(true); });
    return unsub;
  }, []);

  // Load from Firestore once signed in.
  // IMPORTANT: depend on user?.uid (a stable string), not the whole `user` object —
  // Firebase silently refreshes the auth token periodically and gives onAuthStateChanged
  // a NEW user object each time (same account, different reference). Depending on the
  // object itself would re-trigger this reload mid-session and overwrite anything not
  // yet finished saving with the last Firestore snapshot — exactly the kind of "my
  // just-added entry vanished" bug this is guarding against.
  //
  // CRITICAL: `loaded` gates every save effect (`if (loaded && user) saveDoc(...)`).
  // This used to be set in a `finally` block, meaning it went true even when the
  // Promise.all below had FAILED and none of the setX() calls below ever ran — so a
  // single transient read failure (network blip, momentary quota hiccup, anything)
  // silently left every piece of state at its empty default, `loaded` became true
  // anyway, and the save effects then happily wrote that empty state back over the
  // real data in Firestore. This is the most likely explanation for a "everything got
  // wiped, no clear trigger" incident. Fix: `loaded` (and therefore saving) is now
  // ONLY ever set true inside the success path, never in a blanket `finally`.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const [rSnap, cSnap, tSnap, capSnap, tplSnap, svcSnap, chSnap, favSnap, themeSnap, notesSnap, eventsSnap, accessSnap] = await Promise.all([
          getDoc(doc(db, "riseSocMedData", "requests")),
          getDoc(doc(db, "riseSocMedData", "channelStats")),
          getDoc(doc(db, "riseSocMedData", "targets")),
          getDoc(doc(db, "riseSocMedData", "captions")),
          getDoc(doc(db, "riseSocMedData", "templates")),
          getDoc(doc(db, "riseSocMedData", "extraServices")),
          getDoc(doc(db, "riseSocMedData", "channelsList")),
          getDoc(doc(db, "riseSocMedData", "favicon")),
          getDoc(doc(db, "riseSocMedData", "theme")),
          getDoc(doc(db, "riseSocMedData", "notes")),
          getDoc(doc(db, "riseSocMedData", "events")),
          getDoc(doc(db, "riseSocMedData", "restrictedAccess")),
        ]);
        if (cancelled) return;
        if (rSnap.exists()) setRequests(rSnap.data().value || []);
        if (cSnap.exists()) setChannelStats(cSnap.data().value || {});
        if (tSnap.exists()) setTargets(tSnap.data().value || []);
        if (capSnap.exists()) setCaptions(capSnap.data().value || []);
        if (tplSnap.exists()) setTemplates(tplSnap.data().value || []);
        if (svcSnap.exists()) setExtraServices(svcSnap.data().value || { major: [], minor: [] });
        if (chSnap.exists() && chSnap.data().value?.length) {
          CHANNELS.length = 0;
          CHANNELS.push(...chSnap.data().value);
          setChannelsVersion(v => v + 1);
        }
        if (favSnap.exists()) setFaviconUrl(favSnap.data().value || "");
        if (themeSnap.exists()) setTheme(themeSnap.data().value || { bg: "#F5F6F1", accent: "#146356", sidebar: "#0E2B27" });
        if (notesSnap.exists()) setNotes(notesSnap.data().value || []);
        if (eventsSnap.exists()) setEvents(eventsSnap.data().value || []);
        if (accessSnap.exists()) setRestrictedAccess(accessSnap.data().value || { eventsOnly: [] });
        setLoadFailed(false);
        setLoaded(true); // only reached on genuine success
      } catch (err) {
        console.error("Failed to load data from Firestore — refusing to enable saving:", err);
        if (!cancelled) setLoadFailed(true); // loaded stays false: no saves can fire
      }
    })();
    return () => { cancelled = true; };
  }, [user?.uid, loadAttempt]);

  // Every persisted collection goes through this so we always know whether a save
  // is still in flight — used to warn before an accidental refresh/close mid-save.
  // Debounced per collection: rapid successive edits (e.g. several quick changes
  // in a row) collapse into a single Firestore write ~800ms after the last one,
  // instead of one write per change — this is what actually keeps daily write
  // quota usage down on Firestore's free tier.
  const saveTimers = useRef({});
  const saveDoc = (name, value) => {
    if (saveTimers.current[name]) {
      clearTimeout(saveTimers.current[name]);
      setPendingSaves(n => Math.max(0, n - 1));
    }
    setPendingSaves(n => n + 1);
    saveTimers.current[name] = setTimeout(() => {
      setDoc(doc(db, "riseSocMedData", name), { value })
        .catch(err => console.error(`Failed to save ${name}:`, err))
        .finally(() => setPendingSaves(n => Math.max(0, n - 1)));
    }, 800);
  };

  useEffect(() => { if (loaded && user) saveDoc("requests", requests); }, [requests, loaded, user]);
  useEffect(() => { if (loaded && user) saveDoc("channelStats", channelStats); }, [channelStats, loaded, user]);
  useEffect(() => { if (loaded && user) saveDoc("targets", targets); }, [targets, loaded, user]);
  useEffect(() => { if (loaded && user) saveDoc("captions", captions); }, [captions, loaded, user]);
  useEffect(() => { if (loaded && user) saveDoc("templates", templates); }, [templates, loaded, user]);
  useEffect(() => { if (loaded && user) saveDoc("extraServices", extraServices); }, [extraServices, loaded, user]);
  useEffect(() => { if (loaded && user) saveDoc("channelsList", CHANNELS); }, [channelsVersion, loaded, user]);
  useEffect(() => { if (loaded && user) saveDoc("favicon", faviconUrl); }, [faviconUrl, loaded, user]);
  useEffect(() => { if (loaded && user) saveDoc("theme", theme); }, [theme, loaded, user]);
  useEffect(() => { if (loaded && user) saveDoc("notes", notes); }, [notes, loaded, user]);
  useEffect(() => { if (loaded && user) saveDoc("events", events); }, [events, loaded, user]);
  useEffect(() => { if (loaded && user) saveDoc("restrictedAccess", restrictedAccess); }, [restrictedAccess, loaded, user]);

  // Warn before leaving/refreshing if a save is still in flight — this is the actual
  // fix for "my entry vanished after I refreshed": the save was still traveling over
  // the network and got cancelled by the page unload before it reached Firestore.
  useEffect(() => {
    const handler = (e) => {
      if (pendingSaves > 0) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [pendingSaves]);
  useEffect(() => {
    if (!faviconUrl) return;
    let link = document.querySelector("link[rel~='icon']");
    if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
    link.href = faviconUrl;
  }, [faviconUrl]);

  // Reverse sync: periodically check V1 for any synced ticket that's been marked
  // Completed there, and mirror that status back onto the matching local request.
  //
  // Two things matter here to avoid burning through Firestore's daily write quota:
  // 1. `requestsRef` (kept fresh by the effect below) lets this read the latest
  //    requests WITHOUT having `requests` in this effect's own dependency array —
  //    otherwise every requests change would tear down and restart this interval.
  // 2. The update below only creates a new array (and therefore only triggers a
  //    save) when something ACTUALLY changed. `.map()` always returns a new array
  //    reference even if every item is identical — treating that as "changed" was
  //    the actual bug: it re-triggered this effect, which polled again, which
  //    produced another new array, in a fast feedback loop that had nothing to do
  //    with the intended 2-minute interval.
  const requestsRef = useRef(requests);
  useEffect(() => { requestsRef.current = requests; }, [requests]);

  useEffect(() => {
    if (!loaded || !user) return;
    const checkV1Statuses = () => {
      const pending = requestsRef.current.filter(r => r.v1TicketId && r.status !== "Completed");
      if (pending.length === 0) return;
      fetch("/api/check-v1-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketIds: pending.map(r => r.v1TicketId) }),
      }).then(res => res.json()).then(data => {
        const statuses = data?.statuses || {};
        setRequests(rs => {
          let changed = false;
          const next = rs.map(r => {
            const v1 = r.v1TicketId && statuses[r.v1TicketId];
            if (v1 && v1.status === "Completed" && r.status !== "Completed") {
              changed = true;
              return { ...r, status: "Completed" };
            }
            return r;
          });
          return changed ? next : rs; // same reference if nothing changed — no state update, no write triggered
        });
      }).catch(() => { /* best-effort — try again on the next interval */ });
    };
    checkV1Statuses();
    const interval = setInterval(checkV1Statuses, 300000); // every 5 minutes
    return () => clearInterval(interval);
  }, [loaded, user]);

  const addChannel = (ch) => {
    CHANNELS.push(ch);
    setChannelsVersion(v => v + 1);
  };
  const deleteChannel = (id) => {
    const idx = CHANNELS.findIndex(c => c.id === id);
    if (idx >= 0) CHANNELS.splice(idx, 1);
    setChannelsVersion(v => v + 1);
  };
  const editChannel = (id, patch) => {
    const ch = CHANNELS.find(c => c.id === id);
    if (ch) Object.assign(ch, patch);
    setChannelsVersion(v => v + 1);
  };

  // Full data backup — an actual safety net independent of trusting the app's own
  // save logic never breaks again. Firestore's free tier has no built-in backups.
  const exportAllData = () => {
    const snapshot = {
      exportedAt: new Date().toISOString(),
      exportedBy: user?.email || "",
      requests, channelStats, targets, captions, templates,
      extraServices, channelsList: CHANNELS, favicon: faviconUrl, theme, notes, events, restrictedAccess,
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rise-socmed-backup-${localDateStr(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importAllData = (snapshot) => {
    if (snapshot.requests) setRequests(snapshot.requests);
    if (snapshot.channelStats) setChannelStats(snapshot.channelStats);
    if (snapshot.targets) setTargets(snapshot.targets);
    if (snapshot.captions) setCaptions(snapshot.captions);
    if (snapshot.templates) setTemplates(snapshot.templates);
    if (snapshot.extraServices) setExtraServices(snapshot.extraServices);
    if (snapshot.channelsList?.length) {
      CHANNELS.length = 0;
      CHANNELS.push(...snapshot.channelsList);
      setChannelsVersion(v => v + 1);
    }
    if (snapshot.favicon !== undefined) setFaviconUrl(snapshot.favicon);
    if (snapshot.theme) setTheme(snapshot.theme);
    if (snapshot.notes) setNotes(snapshot.notes);
    if (snapshot.events) setEvents(snapshot.events);
    if (snapshot.restrictedAccess) setRestrictedAccess(snapshot.restrictedAccess);
  };

  const [autoBackupMsg, setAutoBackupMsg] = useState("");
  const downloadAutoBackup = async () => {
    setAutoBackupMsg("Checking…");
    try {
      const snap = await getDoc(doc(db, "riseSocMedData", "autoBackup"));
      if (!snap.exists()) { setAutoBackupMsg("No weekly auto-backup has run yet."); return; }
      const snapshot = snap.data().value;
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rise-socmed-autobackup-${snapshot.savedAt?.slice(0, 10) || "unknown"}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setAutoBackupMsg(`Downloaded — last saved ${snapshot.savedAt ? new Date(snapshot.savedAt).toLocaleString() : "unknown time"}`);
    } catch (err) {
      setAutoBackupMsg("Couldn't retrieve the auto-backup.");
    }
    setTimeout(() => setAutoBackupMsg(""), 4000);
  };

  // Restricted-access users only ever see the Events tab — this must live before the
  // early returns below since it's a hook, and hooks can't be called conditionally.
  const isAdminEarly = !!(user && ADMIN_EMAILS.includes(user.email));
  const isEventsOnlyEarly = !!(user && !isAdminEarly && restrictedAccess.eventsOnly?.includes(user.email));
  useEffect(() => { if (isEventsOnlyEarly) setTab("events"); }, [isEventsOnlyEarly]);

  if (!authChecked) {
    return <div style={{ padding: 40, fontFamily: "'Inter',sans-serif", color: "#5B675F" }}>Loading…</div>;
  }
  if (!user) {
    return <Login />;
  }
  if (loadFailed && !loaded) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',sans-serif", background: "#F5F6F1" }}>
        <div style={{ background: "#fff", border: "1px solid #E3E6E0", borderRadius: 12, padding: 32, maxWidth: 420, textAlign: "center" }}>
          <AlertTriangle size={28} color="#C4544A" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Couldn't load your data</div>
          <div style={{ fontSize: 13, color: "#5B675F", marginBottom: 20 }}>
            This can happen from a brief connection hiccup. Nothing has been changed or saved — it's safe to try again.
          </div>
          <button onClick={() => { setLoadFailed(false); setLoadAttempt(a => a + 1); }} style={{ ...primaryBtn, width: "100%", justifyContent: "center" }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }
  if (!loaded) {
    return <div style={{ padding: 40, fontFamily: "'Inter',sans-serif", color: "#5B675F" }}>Loading your data…</div>;
  }

  const NAV = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "requests",  label: "Requests",  icon: ClipboardList },
    { id: "channels",  label: "Channels",  icon: TrendingUp },
    { id: "targets",   label: "Targets",   icon: Target },
    { id: "captions",  label: "Captions",  icon: MessageSquareText },
    { id: "scheduler", label: "Scheduler", icon: CalendarDays },
    { id: "events",    label: "Events",    icon: PartyPopper },
    { id: "reports",   label: "Reports",   icon: BarChart3 },
  ];

  const todayStr = localDateStr(new Date());
  const isAdmin = !!(user && ADMIN_EMAILS.includes(user.email));
  const isEventsOnly = !!(user && !isAdmin && restrictedAccess.eventsOnly?.includes(user.email));
  const allMajorServices = extraServices.major;
  const allMinorServices = extraServices.minor;
  const allServicesList = [...allMajorServices, ...allMinorServices];
  const reminders = [
    ...requests
      .filter(r => r.scheduledDate && r.scheduledDate <= todayStr && r.status !== "Completed")
      .map(r => ({ id: r.id, title: r.title, date: r.scheduledDate, kind: "post" })),
    ...notes
      .filter(n => n.reminderDate && n.reminderDate <= todayStr)
      .map(n => ({ id: n.id, title: n.text.slice(0, 60), date: n.reminderDate, kind: "note" })),
    ...events
      .filter(e => e.eventDate && e.eventDate <= todayStr && e.status !== "Completed" && e.status !== "Cancelled")
      .map(e => ({ id: e.id, title: e.title, date: e.eventDate, kind: "event" })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="app-shell" style={{ display: "flex", minHeight: "100vh", fontFamily: "'Inter',sans-serif", background: "var(--app-bg)", color: "#0E2B27" }}>
      <style>{`
        :root { --app-bg: ${theme.bg}; --app-accent: ${theme.accent}; --app-sidebar: ${theme.sidebar || "#0E2B27"}; }
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');
        .mono { font-family:'IBM Plex Mono',monospace; }
        .disp { font-family:'Fraunces',serif; }
        button { cursor:pointer; font-family:inherit; }
        input,select,textarea { font-family:inherit; }
        ::-webkit-scrollbar{width:8px;height:8px} ::-webkit-scrollbar-thumb{background:#D8DDD5;border-radius:4px}
        @media print {
          .no-print { display: none !important; }
          .app-main { max-height: none !important; overflow: visible !important; padding: 0 !important; }
          body, .report-page { background: #fff !important; }
        }
        @media (max-width: 768px) {
          .app-shell { flex-direction: column !important; }
          .app-sidebar { width: 100% !important; }
          .app-nav { display: flex !important; flex-direction: row !important; overflow-x: auto !important; gap: 4px !important; }
          .app-nav button { flex-shrink: 0; }
          .app-main { padding: 16px !important; }
          /* Blunt but effective: collapses any multi-column grid in the main content to one
             column on phones, rather than hand-converting every inline grid individually. */
          .app-main [style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* SIDEBAR */}
      <div className="no-print app-sidebar" style={{ width: 208, background: "var(--app-sidebar)", color: "#F5F6F1", padding: "22px 14px", flexShrink: 0, position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 3, paddingLeft: 6 }}>
            {[6, 10, 14, 19].map((h, i) => (
              <div key={i} style={{ width: 4, height: h, background: "#E8A33D", borderRadius: 1, opacity: 0.5 + i * 0.15 }} />
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {isAdmin && (
              <button onClick={exportAllData} title="Export all data as a backup file (Admin)" style={{ border: "none", background: "transparent", color: "#B7C4BF", padding: 2 }}>
                <Download size={15} />
              </button>
            )}
            {isAdmin && (
              <button onClick={downloadAutoBackup} title="Download the latest weekly auto-backup (Admin)" style={{ border: "none", background: "transparent", color: "#B7C4BF", padding: 2 }}>
                <DatabaseBackup size={15} />
              </button>
            )}
            {isAdmin && (
              <button onClick={() => setImportModalOpen(true)} title="Import data from a backup file (Admin)" style={{ border: "none", background: "transparent", color: "#B7C4BF", padding: 2 }}>
                <Upload size={15} />
              </button>
            )}
            {isAdmin && (
              <button onClick={() => setAccessModalOpen(true)} title="Manage restricted access (Admin)" style={{ border: "none", background: "transparent", color: "#B7C4BF", padding: 2 }}>
                <Users size={15} />
              </button>
            )}
            {isAdmin && (
              <button onClick={() => setThemeModalOpen(true)} title="Customize background/accent theme (Admin)" style={{ border: "none", background: "transparent", color: "#B7C4BF", padding: 2 }}>
                <Palette size={15} />
              </button>
            )}
            {isAdmin && (
              <button onClick={() => setFaviconModalOpen(true)} title="Customize favicon (Admin)" style={{ border: "none", background: "transparent", color: "#B7C4BF", padding: 2 }}>
                <ImageIcon size={15} />
              </button>
            )}
            <button onClick={() => setBellOpen(v => !v)} style={{ position: "relative", border: "none", background: "transparent", color: "#B7C4BF", padding: 2 }}>
              <Bell size={16} />
              {reminders.length > 0 && (
                <span style={{ position: "absolute", top: -4, right: -4, background: "#C4544A", color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: 8, minWidth: 15, height: 15, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>
                  {reminders.length}
                </span>
              )}
            </button>
          </div>
        </div>
        {autoBackupMsg && <div style={{ fontSize: 10, color: "#B7C4BF", marginTop: 4 }}>{autoBackupMsg}</div>}
        {bellOpen && (
          <>
            <div onClick={() => setBellOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 90 }} />
            <div style={{ position: "fixed", top: 60, left: 190, width: 280, background: "#fff", color: "#0E2B27", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.25)", padding: 12, zIndex: 100, maxHeight: 320, overflowY: "auto" }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Reminders</div>
              {reminders.length === 0 ? (
                <div style={{ fontSize: 11.5, color: "#9AA39B" }}>Nothing due or overdue.</div>
              ) : reminders.map(r => {
                const overdue = r.date < todayStr;
                const kindLabel = r.kind === "post" ? "Scheduled post" : r.kind === "event" ? "Event" : "Note";
                return (
                  <div key={`${r.kind}-${r.id}`} style={{ borderBottom: "1px solid #EEF0EC", padding: "7px 0" }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600 }}>{r.title}</div>
                    <div style={{ fontSize: 10.5, color: overdue ? "#C4544A" : "#E8A33D", fontWeight: 600 }}>
                      {kindLabel} · {overdue ? "Overdue" : "Due today"} · {r.date}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
        <div className="disp" style={{ fontSize: 22, fontWeight: 600, paddingLeft: 6, marginBottom: 2 }}>Rise</div>
        <div style={{ fontSize: 10.5, opacity: 0.55, paddingLeft: 6, marginBottom: 26, letterSpacing: 0.4 }}>SOCIAL MEDIA TRACKER</div>
        <div className="app-nav">
          {(isEventsOnly ? NAV.filter(n => n.id === "events") : NAV).map(n => {
            const Icon = n.icon; const active = tab === n.id;
            return (
              <button key={n.id} onClick={() => setTab(n.id)} style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 10px", marginBottom: 3,
                background: active ? "#173C36" : "transparent", border: "none", borderRadius: 7,
                color: active ? "#fff" : "#B7C4BF", fontSize: 13.5, fontWeight: active ? 600 : 500, textAlign: "left",
              }}>
                <Icon size={16} strokeWidth={2} /> {n.label}
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: "auto", paddingTop: 20, borderTop: "1px solid #1D4038", fontSize: 11 }}>
          {pendingSaves > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#E8A33D", fontWeight: 600, marginBottom: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#E8A33D" }} /> Saving…
            </div>
          )}
          <div style={{ color: "#B7C4BF", marginBottom: 6, wordBreak: "break-all" }}>{user.email}</div>
          <button onClick={() => signOut(auth)} style={{ border: "none", background: "transparent", color: "#E8A33D", fontWeight: 600, padding: 0 }}>Sign out</button>
        </div>
      </div>

      {faviconModalOpen && <FaviconModal currentUrl={faviconUrl} onSave={(url) => { setFaviconUrl(url); setFaviconModalOpen(false); }} onClose={() => setFaviconModalOpen(false)} />}
      {themeModalOpen && <ThemeModal current={theme} onSave={(t) => { setTheme(t); setThemeModalOpen(false); }} onClose={() => setThemeModalOpen(false)} />}
      {accessModalOpen && <AccessManagerModal current={restrictedAccess} onSave={(a) => { setRestrictedAccess(a); setAccessModalOpen(false); }} onClose={() => setAccessModalOpen(false)} />}
      {importModalOpen && <ImportModal onClose={() => setImportModalOpen(false)} onImport={importAllData} />}

      {/* MAIN */}
      <div className="app-main" style={{ flex: 1, padding: "26px 32px", overflowY: "auto", minHeight: "100vh" }}>
        {tab === "dashboard" && <Dashboard requests={requests} channelStats={channelStats} targets={targets} allServicesList={allServicesList} extraServices={extraServices} setExtraServices={setExtraServices} isAdmin={isAdmin} setTab={setTab} />}
        {tab === "requests"  && <Requests requests={requests} setRequests={setRequests} captions={captions} user={user} majorServices={allMajorServices} minorServices={allMinorServices} />}
        {tab === "channels"  && <Channels channelStats={channelStats} setChannelStats={setChannelStats} addChannel={addChannel} deleteChannel={deleteChannel} editChannel={editChannel} channelsVersion={channelsVersion} isAdmin={isAdmin} />}
        {tab === "targets"   && <Targets targets={targets} setTargets={setTargets} requests={requests} majorServices={allMajorServices} />}
        {tab === "captions"  && <Captions captions={captions} setCaptions={setCaptions} templates={templates} setTemplates={setTemplates} majorServices={allMajorServices} minorServices={allMinorServices} />}
        {tab === "scheduler" && <Scheduler requests={requests} setRequests={setRequests} captions={captions} setCaptions={setCaptions} templates={templates} setTemplates={setTemplates}
          targets={targets} setTargets={setTargets} user={user} notes={notes} setNotes={setNotes}
          majorServices={allMajorServices} minorServices={allMinorServices} extraServices={extraServices} setExtraServices={setExtraServices} isAdmin={isAdmin} />}
        {tab === "reports" && <Reports requests={requests} channelStats={channelStats} targets={targets} captions={captions} events={events}
          majorServices={allMajorServices} minorServices={allMinorServices} allServicesList={allServicesList} extraServices={extraServices} setExtraServices={setExtraServices} isAdmin={isAdmin} setTab={setTab} />}
        {tab === "events" && <Events events={events} setEvents={setEvents} majorServices={allMajorServices} minorServices={allMinorServices} />}
      </div>
    </div>
  );
}

/* ---------------------------------- LOGIN ---------------------------------- */

/* ---------------------------------- FAVICON (admin) ---------------------------------- */

/* ---------------------------------- THEME (admin) ---------------------------------- */

/* ---------------------------------- ACCESS MANAGEMENT (admin) ---------------------------------- */

/* ---------------------------------- DATA BACKUP — IMPORT (admin) ---------------------------------- */

function ImportModal({ onClose, onImport }) {
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError(""); setParsed(null); setConfirming(false);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        setParsed(data);
      } catch (err) {
        setError("That file isn't valid JSON — make sure it's an unmodified export from this app.");
      }
    };
    reader.readAsText(file);
  };

  const counts = parsed ? {
    Requests: parsed.requests?.length ?? "—",
    Captions: parsed.captions?.length ?? "—",
    Targets: parsed.targets?.length ?? "—",
    Events: parsed.events?.length ?? "—",
    Notes: parsed.notes?.length ?? "—",
    Channels: parsed.channelsList?.length ?? "—",
  } : null;

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div className="disp" style={{ fontSize: 18, fontWeight: 600 }}>Import Data <span style={{ fontSize: 11, fontWeight: 600, color: "#E8A33D", background: "#E8A33D1A", padding: "2px 8px", borderRadius: 10, marginLeft: 6 }}>Admin</span></div>
          <button onClick={onClose} style={{ border: "none", background: "transparent" }}><X size={18} /></button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: "#C4544A", background: "#C4544A14", borderRadius: 8, padding: "10px 12px", marginBottom: 16 }}>
          <AlertTriangle size={16} /> This replaces ALL current data with what's in the file. This cannot be undone.
        </div>

        <label style={label}>Backup file</label>
        <input type="file" accept="application/json" onChange={handleFile} style={{ fontSize: 12.5, marginBottom: 14 }} />
        {error && <div style={{ fontSize: 12, color: "#C4544A", marginBottom: 14 }}>{error}</div>}

        {parsed && (
          <div style={{ background: "#F5F6F1", borderRadius: 8, padding: 12, marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#5B675F", marginBottom: 8 }}>
              {parsed.exportedAt ? `Exported ${new Date(parsed.exportedAt).toLocaleString()}${parsed.exportedBy ? ` by ${parsed.exportedBy}` : ""}` : "This file's contents:"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              {Object.entries(counts).map(([k, v]) => (
                <div key={k} style={{ fontSize: 11.5 }}><span className="mono" style={{ fontWeight: 700 }}>{v}</span> {k}</div>
              ))}
            </div>
          </div>
        )}

        {!confirming ? (
          <button disabled={!parsed} onClick={() => setConfirming(true)} style={{ ...primaryBtn, width: "100%", justifyContent: "center", opacity: !parsed ? 0.5 : 1, background: "#C4544A" }}>
            Review & Restore
          </button>
        ) : (
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 10, textAlign: "center" }}>Replace all current data with this file?</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setConfirming(false)} style={{ ...pillBtn(false), flex: 1, padding: "10px 0", textAlign: "center" }}>Cancel</button>
              <button onClick={() => { onImport(parsed); onClose(); }} style={{ ...primaryBtn, flex: 1, justifyContent: "center", background: "#C4544A" }}>Yes, Restore Now</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AccessManagerModal({ current, onSave, onClose }) {
  const [eventsOnly, setEventsOnly] = useState(current.eventsOnly || []);
  const [newEmail, setNewEmail] = useState("");

  const addEmail = () => {
    const e = newEmail.trim().toLowerCase();
    if (!e || eventsOnly.includes(e)) return;
    setEventsOnly(list => [...list, e]);
    setNewEmail("");
  };
  const removeEmail = (e) => setEventsOnly(list => list.filter(x => x !== e));

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div className="disp" style={{ fontSize: 18, fontWeight: 600 }}>Manage Access <span style={{ fontSize: 11, fontWeight: 600, color: "#E8A33D", background: "#E8A33D1A", padding: "2px 8px", borderRadius: 10, marginLeft: 6 }}>Admin</span></div>
          <button onClick={onClose} style={{ border: "none", background: "transparent" }}><X size={18} /></button>
        </div>

        <label style={label}>Events-only access</label>
        <div style={{ fontSize: 11, color: "#9AA39B", marginBottom: 10 }}>
          Accounts listed here only ever see the Events tab — every other tab is hidden for them. The account still needs to exist in Firebase Authentication first (same as any other login); this list just restricts what they see once signed in.
        </div>

        <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid #E3E6E0", borderRadius: 8, marginBottom: 14 }}>
          {eventsOnly.length === 0 ? (
            <div style={{ padding: 14, fontSize: 12, color: "#9AA39B", textAlign: "center" }}>No restricted accounts yet.</div>
          ) : eventsOnly.map(e => (
            <div key={e} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderBottom: "1px solid #EEF0EC" }}>
              <PartyPopper size={13} color="#146356" />
              <div style={{ flex: 1, fontSize: 12.5, wordBreak: "break-all" }}>{e}</div>
              <button onClick={() => removeEmail(e)} style={{ border: "none", background: "transparent", color: "#C4544A" }}><Trash2 size={13} /></button>
            </div>
          ))}
        </div>

        <label style={label}>Add restricted account</label>
        <div style={{ display: "flex", gap: 6 }}>
          <input value={newEmail} onChange={e => setNewEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && addEmail()} placeholder="email@example.com" style={{ ...inputStyle, flex: 1 }} />
          <button onClick={addEmail} disabled={!newEmail.trim()} style={{ ...primaryBtn, opacity: !newEmail.trim() ? 0.5 : 1 }}><Plus size={14} /></button>
        </div>
        <div style={{ fontSize: 10, color: "#9AA39B", marginTop: 6, marginBottom: 20 }}>Admin accounts are never restricted, even if listed here.</div>

        <button onClick={() => onSave({ eventsOnly })} style={{ ...primaryBtn, width: "100%", justifyContent: "center" }}>Save Access List</button>
      </div>
    </div>
  );
}

/* ---------------------------------- COVERAGE SETTINGS (admin) ---------------------------------- */

function CoverageSettingsModal({ allServicesList, current, onSave, onClose }) {
  const [selected, setSelected] = useState(current);
  const toggle = (s) => setSelected(list => list.includes(s) ? list.filter(x => x !== s) : [...list, s]);
  const selectAll = () => setSelected(allServicesList);
  const selectNone = () => setSelected([]);

  return (
    <div style={overlay}>
      <div style={{ ...modal, width: 560 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div className="disp" style={{ fontSize: 18, fontWeight: 600 }}>Coverage Settings <span style={{ fontSize: 11, fontWeight: 600, color: "#E8A33D", background: "#E8A33D1A", padding: "2px 8px", borderRadius: 10, marginLeft: 6 }}>Admin</span></div>
          <button onClick={onClose} style={{ border: "none", background: "transparent" }}><X size={18} /></button>
        </div>
        <div style={{ fontSize: 11.5, color: "#5B675F", marginBottom: 14 }}>
          Choose which services actually count toward Service Coverage. This doesn't affect the full list used for tagging requests/posts in Requests or Scheduler — those stay exactly as-is, in sync with the job docket. This only narrows what Coverage measures.
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: "#9AA39B" }}>{selected.length} of {allServicesList.length} selected</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={selectAll} style={{ border: "none", background: "transparent", color: "#146356", fontSize: 11, fontWeight: 600 }}>Select All</button>
            <button onClick={selectNone} style={{ border: "none", background: "transparent", color: "#C4544A", fontSize: 11, fontWeight: 600 }}>Select None</button>
          </div>
        </div>

        <div style={{ maxHeight: 320, overflowY: "auto", border: "1px solid #E3E6E0", borderRadius: 8, padding: 10, marginBottom: 20 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {allServicesList.map(s => (
              <button key={s} onClick={() => toggle(s)} style={{
                display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 14, fontSize: 11.5, fontWeight: 600,
                border: `1px solid ${selected.includes(s) ? "#146356" : "#D8DDD5"}`, background: selected.includes(s) ? "#146356" : "#fff",
                color: selected.includes(s) ? "#fff" : "#5B675F",
              }}>
                {selected.includes(s) ? <CheckSquare size={12} /> : <Square size={12} />} {s}
              </button>
            ))}
          </div>
        </div>

        <button onClick={() => onSave(selected)} style={{ ...primaryBtn, width: "100%", justifyContent: "center" }}>Save Coverage Settings</button>
      </div>
    </div>
  );
}

function ThemeModal({ current, onSave, onClose }) {
  const [bg, setBg] = useState(current.bg || "#F5F6F1");
  const [accent, setAccent] = useState(current.accent || "#146356");
  const [sidebar, setSidebar] = useState(current.sidebar || "#0E2B27");

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div className="disp" style={{ fontSize: 18, fontWeight: 600 }}>Customize Theme <span style={{ fontSize: 11, fontWeight: 600, color: "#E8A33D", background: "#E8A33D1A", padding: "2px 8px", borderRadius: 10, marginLeft: 6 }}>Admin</span></div>
          <button onClick={onClose} style={{ border: "none", background: "transparent" }}><X size={18} /></button>
        </div>
        <label style={label}>Background color</label>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <input type="color" value={bg} onChange={e => setBg(e.target.value)} style={{ width: 44, height: 32, border: "1px solid #D8DDD5", borderRadius: 6, padding: 0 }} />
          <input value={bg} onChange={e => setBg(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
        </div>
        <label style={label}>Accent color (buttons, highlights)</label>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <input type="color" value={accent} onChange={e => setAccent(e.target.value)} style={{ width: 44, height: 32, border: "1px solid #D8DDD5", borderRadius: 6, padding: 0 }} />
          <input value={accent} onChange={e => setAccent(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
        </div>
        <label style={label}>Sidebar color</label>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <input type="color" value={sidebar} onChange={e => setSidebar(e.target.value)} style={{ width: 44, height: 32, border: "1px solid #D8DDD5", borderRadius: 6, padding: 0 }} />
          <input value={sidebar} onChange={e => setSidebar(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
        </div>
        <div style={{ fontSize: 10.5, color: "#9AA39B", marginBottom: 14 }}>Applies app-wide (main background, primary buttons/highlights, and sidebar) for everyone. Full re-skin of every element isn't covered by this yet.</div>
        <button onClick={() => onSave({ bg, accent, sidebar })} style={{ ...primaryBtn, width: "100%", justifyContent: "center" }}>Save Theme</button>
      </div>
    </div>
  );
}

function FaviconModal({ currentUrl, onSave, onClose }) {
  const [url, setUrl] = useState(currentUrl || "");

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div className="disp" style={{ fontSize: 18, fontWeight: 600 }}>Customize Favicon <span style={{ fontSize: 11, fontWeight: 600, color: "#E8A33D", background: "#E8A33D1A", padding: "2px 8px", borderRadius: 10, marginLeft: 6 }}>Admin</span></div>
          <button onClick={onClose} style={{ border: "none", background: "transparent" }}><X size={18} /></button>
        </div>
        <label style={label}>Favicon image URL</label>
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://... (.png or .ico, square works best)" style={{ ...inputStyle, width: "100%", marginBottom: 14 }} />
        {url && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, padding: 10, background: "#F5F6F1", borderRadius: 8 }}>
            <img src={url} alt="favicon preview" style={{ width: 32, height: 32, borderRadius: 4, border: "1px solid #D8DDD5" }} onError={e => e.target.style.visibility = "hidden"} />
            <div style={{ fontSize: 11, color: "#5B675F" }}>Preview — applies to everyone's browser tab once saved.</div>
          </div>
        )}
        <button onClick={() => onSave(url.trim())} style={{ ...primaryBtn, width: "100%", justifyContent: "center" }}>Save Favicon</button>
      </div>
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError("Incorrect email or password.");
    } finally { setBusy(false); }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0E2B27", fontFamily: "'Inter',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Inter:wght@400;500;600;700&display=swap');`}</style>
      <form onSubmit={submit} style={{ background: "#fff", borderRadius: 12, padding: 32, width: 320 }}>
        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 600, color: "#0E2B27", marginBottom: 4 }}>Rise</div>
        <div style={{ fontSize: 12, color: "#5B675F", marginBottom: 20 }}>Sign in to the social media tracker</div>
        <input type="email" required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
          style={{ width: "100%", border: "1px solid #D8DDD5", borderRadius: 7, padding: "9px 10px", fontSize: 13, marginBottom: 10, outline: "none" }} />
        <input type="password" required placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
          style={{ width: "100%", border: "1px solid #D8DDD5", borderRadius: 7, padding: "9px 10px", fontSize: 13, marginBottom: 14, outline: "none" }} />
        {error && <div style={{ color: "#C4544A", fontSize: 12, marginBottom: 12 }}>{error}</div>}
        <button disabled={busy} type="submit" style={{ width: "100%", background: "#146356", color: "#fff", border: "none", borderRadius: 8, padding: "10px 0", fontSize: 13, fontWeight: 600 }}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

/* ---------------------------------- DASHBOARD ---------------------------------- */

function Dashboard({ requests, channelStats, targets, allServicesList = ALL_SERVICES, extraServices, setExtraServices, isAdmin, setTab }) {
  const [periodType, setPeriodType] = useState("month");
  const [cursor, setCursor] = useState(new Date());
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [coverageModalOpen, setCoverageModalOpen] = useState(false);

  // Which services actually count toward Coverage — a curated subset (admin-editable
  // via "Coverage Settings"), separate from the full tagging list used in Requests/
  // Scheduler. Defaults to every service until an admin explicitly narrows it down.
  const trackedServices = (extraServices?.coverageTracked?.length ? extraServices.coverageTracked : allServicesList)
    .filter(s => allServicesList.includes(s));

  const { start, end, label: periodLabel } = useMemo(() => getReportRange(periodType, cursor, customStart, customEnd), [periodType, cursor, customStart, customEnd]);
  const shift = (amt) => setCursor(c => {
    const d = new Date(c);
    if (periodType === "week") d.setDate(d.getDate() + amt * 7);
    else if (periodType === "quarter") d.setMonth(d.getMonth() + amt * 3);
    else d.setMonth(d.getMonth() + amt);
    return d;
  });

  const requestsInPeriod = useMemo(() => requests.filter(r => r.dateLogged >= start && r.dateLogged <= end), [requests, start, end]);

  // Coverage counts a service as covered only once something for it has actually been
  // POSTED (via the Scheduler, status = "Posted") within the period — not just requested
  // or scheduled. Uses scheduledDate, not dateLogged, since "covered" means "went out."
  const postedInPeriod = useMemo(() =>
    requests.filter(r => r.scheduledDate && r.scheduledDate >= start && r.scheduledDate <= end && r.postStatus === "Posted")
  , [requests, start, end]);

  const byService = useMemo(() => {
    const counts = {};
    requestsInPeriod.forEach(r => r.services.forEach(s => { counts[s] = (counts[s] || 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count }));
  }, [requestsInPeriod]);

  const coverage = useMemo(() => {
    const counts = {};
    trackedServices.forEach(s => { counts[s] = 0; });
    postedInPeriod.forEach(r => r.services.forEach(s => { if (counts[s] !== undefined) counts[s] += 1; }));
    const list = Object.entries(counts).map(([name, count]) => ({ name, count }));
    const flagged = list.filter(s => s.count === 0).sort((a, b) => a.name.localeCompare(b.name));
    const covered = list.filter(s => s.count > 0).sort((a, b) => b.count - a.count);
    return { flagged, covered, total: list.length };
  }, [postedInPeriod, trackedServices]);

  const byCreative = useMemo(() => {
    const counts = {};
    requestsInPeriod.forEach(r => { counts[r.creativeType] = (counts[r.creativeType] || 0) + 1; });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [requestsInPeriod]);

  const completed = requestsInPeriod.filter(r => r.status === "Completed").length;
  const inProgress = requestsInPeriod.filter(r => r.status === "In Progress").length;
  const pending = requestsInPeriod.filter(r => r.status === "Pending").length;

  return (
    <div>
      <Header title="Dashboard" sub="Overview across all channels and services" action={
        <div style={{ display: "flex", gap: 6 }}>
          {["week", "month", "quarter", "custom"].map(p => (
            <button key={p} onClick={() => setPeriodType(p)} style={pillBtn(periodType === p)}>{p[0].toUpperCase() + p.slice(1)}</button>
          ))}
        </div>
      } />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        {periodType === "custom" ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} style={inputStyle} />
            <span style={{ fontSize: 12, color: "#5B675F" }}>to</span>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} style={inputStyle} />
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => shift(-1)} style={navBtn}><ChevronLeft size={16} /></button>
            <div style={{ fontSize: 13, fontWeight: 700, minWidth: 140, textAlign: "center" }}>{periodLabel}</div>
            <button onClick={() => shift(1)} style={navBtn}><ChevronRight size={16} /></button>
          </div>
        )}
        <div style={{ fontSize: 11, color: "#9AA39B" }}>Showing: {start} to {end}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 22 }}>
        <StatCard label="Total Requests" value={requestsInPeriod.length} />
        <StatCard label="Pending" value={pending} accent="#9AA39B" />
        <StatCard label="In Progress" value={inProgress} accent="#E8A33D" />
        <StatCard label="Completed" value={completed} accent="#146356" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
        <FlexibleChart title="Requests per Service" data={byService} color="#146356" empty="No requests logged in this period." />
        <FlexibleChart title="Requests by Creative Type" data={byCreative} color="#E8A33D" empty="No creative type data yet." defaultType="pie" />
      </div>

      <Card style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <CoverageLegend />
          <div style={{ display: "flex", gap: 14 }}>
            {isAdmin && (
              <button onClick={() => setCoverageModalOpen(true)} style={{ border: "none", background: "transparent", color: "#146356", fontSize: 11.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                <ListChecks size={13} /> Coverage Settings
              </button>
            )}
            {setTab && (
              <button onClick={() => setTab("scheduler")} style={{ border: "none", background: "transparent", color: "#146356", fontSize: 11.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                <ShieldCheck size={13} /> Manage Services
              </button>
            )}
          </div>
        </div>
        <CoverageGrid covered={coverage.covered} flagged={coverage.flagged} total={coverage.total} periodLabel={periodLabel} />
      </Card>

      {coverageModalOpen && (
        <CoverageSettingsModal
          allServicesList={allServicesList}
          current={trackedServices}
          onSave={(list) => { setExtraServices(es => ({ ...es, coverageTracked: list })); setCoverageModalOpen(false); }}
          onClose={() => setCoverageModalOpen(false)}
        />
      )}

      <Card title="Channel Snapshot" style={{ marginTop: 16 }}>
        <div style={{ fontSize: 10.5, color: "#9AA39B", marginBottom: 10 }}>Always shows each channel's latest logged stats, regardless of the period selected above.</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {CHANNELS.map(ch => {
            const rows = (channelStats[ch.id] || []).sort((a, b) => a.month.localeCompare(b.month));
            const last = rows[rows.length - 1];
            return (
              <div key={ch.id} style={{ border: "1px solid #E3E6E0", borderRadius: 9, padding: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: ch.color }} />
                  <div style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>{ch.name}</div>
                  {ch.link && <a href={ch.link} target="_blank" rel="noreferrer" style={{ color: "#5B675F", display: "flex" }}><ExternalLink size={11} /></a>}
                </div>
                {last ? (
                  <>
                    <div className="mono" style={{ fontSize: 18, fontWeight: 600 }}>{Number(last.followers).toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: last.growthPct >= 0 ? "#146356" : "#C4544A", display: "flex", alignItems: "center", gap: 2 }}>
                      {last.growthPct >= 0 ? <ArrowUp size={11} /> : <ArrowDown size={11} />} {Math.abs(last.growthPct).toFixed(2)}% this month
                    </div>
                  </>
                ) : <div style={{ fontSize: 11.5, color: "#9AA39B" }}>No data logged yet</div>}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

/* ---------------------------------- REQUESTS ---------------------------------- */

function Requests({ requests, setRequests, captions, user, majorServices = MAJOR_SERVICES, minorServices = MINOR_SERVICES }) {
  const [open, setOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = requests.filter(r =>
    r.origin !== "scheduler" &&
    (filterStatus === "All" || r.status === filterStatus) &&
    (r.title.toLowerCase().includes(search.toLowerCase()) || r.services.some(s => s.toLowerCase().includes(search.toLowerCase())))
  ).sort((a, b) => b.dateLogged.localeCompare(a.dateLogged));

  const cycleStatus = (id) => setRequests(rs => rs.map(r => r.id === id ? { ...r, status: STATUS[(STATUS.indexOf(r.status) + 1) % STATUS.length] } : r));
  const remove = (id) => {
    const target = requests.find(r => r.id === id);
    setRequests(rs => rs.filter(r => r.id !== id));
    if (target?.v1TicketId) {
      fetch("/api/delete-v1-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: target.v1TicketId }),
      }).catch(() => { /* best-effort — local delete already succeeded either way */ });
    }
  };

  return (
    <div>
      <Header title="Requests" sub="Log and track content requests by service and creative type" action={
        <button onClick={() => setOpen(true)} style={primaryBtn}><Plus size={15} /> New Request</button>
      } />

      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: 10, color: "#9AA39B" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title or service..."
            style={{ ...inputStyle, paddingLeft: 30, width: "100%" }} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: 160 }}>
          <option>All</option>{STATUS.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <Card>
        {filtered.length === 0 ? <Empty text="No requests match. Log your first one above." /> : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#5B675F", borderBottom: "1px solid #E3E6E0" }}>
                <th style={th}>Title</th><th style={th}>Services</th><th style={th}>Creative Type</th><th style={th}>Channel</th><th style={th}>Status</th><th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const Icon = STATUS_ICON[r.status];
                return (
                  <tr key={r.id} style={{ borderBottom: "1px solid #EEF0EC" }}>
                    <td style={td}>{r.title}</td>
                    <td style={td}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {r.services.map(s => <span key={s} style={tagStyle}>{s}</span>)}
                      </div>
                    </td>
                    <td style={td}>{r.creativeType}</td>
                    <td style={td}>{CHANNELS.find(c => c.id === r.channel)?.name || "—"}</td>
                    <td style={td}>
                      <button onClick={() => cycleStatus(r.id)} style={{ display: "flex", alignItems: "center", gap: 5, border: "none", background: "transparent", color: STATUS_COLOR[r.status], fontSize: 12, fontWeight: 600 }}>
                        <Icon size={13} /> {r.status}
                      </button>
                    </td>
                    <td style={td}><button onClick={() => remove(r.id)} style={{ border: "none", background: "transparent", color: "#C4544A" }}><X size={14} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {open && <RequestModal user={user} majorServices={majorServices} minorServices={minorServices} onClose={() => setOpen(false)} onSave={(req) => { setRequests(rs => [...rs, req]); syncRequestToV1(req, user?.email, setRequests); setOpen(false); }} />}
    </div>
  );
}

function RequestModal({ onClose, onSave, user, majorServices = MAJOR_SERVICES, minorServices = MINOR_SERVICES }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requesterNotes, setRequesterNotes] = useState("");
  const [dept, setDept] = useState("Social Media");
  const [creativeType, setCreativeType] = useState(CREATIVE_TYPES[0]);
  const [priority, setPriority] = useState("Normal");
  const [dueDate, setDueDate] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [purposes, setPurposes] = useState([]);
  const [channel, setChannel] = useState(CHANNELS[0].id);
  const [serviceType, setServiceType] = useState("major");
  const [services, setServices] = useState([]);
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const list = serviceType === "major" ? majorServices : minorServices;

  const toggleService = (s) => setServices(cur => cur.includes(s) ? cur.filter(x => x !== s) : [...cur, s]);
  const togglePurpose = (p) => setPurposes(cur => cur.includes(p) ? cur.filter(x => x !== p) : [...cur, p]);

  const submit = () => {
    if (!title.trim() || services.length === 0) return;
    setSubmitting(true);
    onSave({
      id: uid(), title, description, requesterNotes, dept, creativeType, priority, dueDate, scheduledDate,
      purposes, channel, services, imageUrl, requestedBy: user?.email || "", status: "Pending",
      dateLogged: localDateStr(new Date()), origin: "requests",
    });
    setSubmitting(false);
  };

  return (
    <div style={overlay}>
      <div style={{ ...modal, width: 520 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div className="disp" style={{ fontSize: 18, fontWeight: 600 }}>Log a new creative request</div>
          <button onClick={onClose} style={{ border: "none", background: "transparent" }}><X size={18} /></button>
        </div>

        <label style={label}>Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Instagram carousel — NCLEX AUS promo" style={{ ...inputStyle, width: "100%", marginBottom: 14 }} />

        <label style={label}>Description / brief</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Specs, references, deadline context, brand notes…" style={{ ...inputStyle, width: "100%", marginBottom: 14, resize: "vertical" }} />

        <label style={label}>Additional notes (optional)</label>
        <textarea value={requesterNotes} onChange={e => setRequesterNotes(e.target.value)} rows={2} placeholder="Anything specific worth flagging separately from the brief…" style={{ ...inputStyle, width: "100%", marginBottom: 14, resize: "vertical" }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={label}>Requested by</label>
            <div style={{ ...inputStyle, width: "100%", color: "#5B675F", background: "#F5F6F1" }}>{user?.email || "—"}</div>
          </div>
          <div>
            <label style={label}>Department</label>
            <select value={dept} onChange={e => setDept(e.target.value)} style={{ ...inputStyle, width: "100%" }}>{DEPTS.map(d => <option key={d}>{d}</option>)}</select>
          </div>
          <div>
            <label style={label}>Content type</label>
            <select value={creativeType} onChange={e => setCreativeType(e.target.value)} style={{ ...inputStyle, width: "100%" }}>{CREATIVE_TYPES.map(c => <option key={c}>{c}</option>)}</select>
          </div>
          <div>
            <label style={label}>Priority</label>
            <select value={priority} onChange={e => setPriority(e.target.value)} style={{ ...inputStyle, width: "100%" }}>{PRIORITIES.map(p => <option key={p}>{p}</option>)}</select>
          </div>
          <div>
            <label style={label}>Due date (optional)</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
          </div>
          <div>
            <label style={label}>Scheduled post date (optional)</label>
            <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
          </div>
        </div>

        <label style={label}>Purpose (select all that apply)</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
          {PURPOSES.map(p => (
            <label key={p} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5 }}>
              <input type="checkbox" checked={purposes.includes(p)} onChange={() => togglePurpose(p)} /> {p}
            </label>
          ))}
        </div>

        <label style={label}>Channel</label>
        <select value={channel} onChange={e => setChannel(e.target.value)} style={{ ...inputStyle, width: "100%", marginBottom: 14 }}>
          {CHANNELS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <label style={label}>Service tags</label>
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          <button onClick={() => setServiceType("major")} style={pillBtn(serviceType === "major")}>Major</button>
          <button onClick={() => setServiceType("minor")} style={pillBtn(serviceType === "minor")}>Minor</button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 110, overflowY: "auto", border: "1px solid #E3E6E0", borderRadius: 8, padding: 8, marginBottom: 6 }}>
          {list.map(s => <button key={s} onClick={() => toggleService(s)} style={pillBtn(services.includes(s))}>{s}</button>)}
          <OtherTagPicker services={services} setServices={setServices} />
        </div>
        {services.length > 0 && <div style={{ fontSize: 11, color: "#5B675F", marginBottom: 14 }}>{services.length} tagged: {services.join(", ")}</div>}

        <label style={label}>Inspiration image (optional)</label>
        <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Paste a link to the reference image (e.g. Google Drive)" style={{ ...inputStyle, width: "100%", marginBottom: imageUrl ? 8 : 20 }} />
        {imageUrl && <img src={imageUrl} alt="preview" style={{ maxHeight: 110, borderRadius: 6, border: "1px solid #E3E6E0", marginBottom: 20, display: "block" }} onError={e => e.target.style.display = "none"} />}

        <button
          disabled={!title || services.length === 0 || submitting}
          onClick={submit}
          style={{ ...primaryBtn, width: "100%", justifyContent: "center", opacity: (!title || services.length === 0 || submitting) ? 0.5 : 1 }}
        >{submitting ? "Logging…" : "Log request"}</button>
      </div>
    </div>
  );
}

/* ---------------------------------- CHANNELS ---------------------------------- */

function Channels({ channelStats, setChannelStats, addChannel, deleteChannel, editChannel, channelsVersion, isAdmin }) {
  const [selected, setSelected] = useState(CHANNELS[0]?.id);
  const [open, setOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [growthView, setGrowthView] = useState("month");
  const [chartStyle, setChartStyle] = useState("line");
  const [confirmDeleteMonth, setConfirmDeleteMonth] = useState(null);
  const channel = CHANNELS.find(c => c.id === selected) || CHANNELS[0];
  const rows = channel ? (channelStats[channel.id] || []).sort((a, b) => a.month.localeCompare(b.month)) : [];

  const deleteEntry = (month) => {
    setChannelStats(cs => ({ ...cs, [channel.id]: (cs[channel.id] || []).filter(r => r.month !== month) }));
    setConfirmDeleteMonth(null);
  };

  const saveEntry = (chId, entry) => {
    setChannelStats(cs => {
      const existing = (cs[chId] || []).filter(r => r.month !== entry.month);
      const prior = [...(cs[chId] || [])].sort((a, b) => a.month.localeCompare(b.month)).filter(r => r.month < entry.month).pop();
      const growthPct = prior ? ((entry.followers - prior.followers) / prior.followers) * 100 : 0;
      return { ...cs, [chId]: [...existing, { ...entry, growthPct }] };
    });
  };

  const addEntry = (entry) => { saveEntry(channel.id, entry); setOpen(false); setEditingRow(null); };

  const handleDeleteChannel = (id) => {
    deleteChannel(id);
    setChannelStats(cs => { const next = { ...cs }; delete next[id]; return next; });
    if (selected === id) setSelected(CHANNELS.find(c => c.id !== id)?.id);
  };

  if (!channel) {
    return (
      <div>
        <Header title="Channels" sub="Growth and engagement, logged manually per month" action={
          isAdmin && <button onClick={() => setManageOpen(true)} style={primaryBtn}><Plus size={15} /> Add Channel</button>
        } />
        <Card><Empty text="No channels yet. An admin needs to add one to get started." /></Card>
        {manageOpen && <ChannelManagerModal onClose={() => setManageOpen(false)} onAdd={addChannel} onDelete={handleDeleteChannel} onEdit={editChannel} />}
      </div>
    );
  }

  const last = rows[rows.length - 1];
  const growthRating = last ? rate(channel.platform, "growth", last.growthPct) : null;
  const engRating = last ? rate(channel.platform, "engagement", last.engagement30) : null;
  const chartData = aggregateChannelStats(rows, growthView);

  const targetEngagement = last?.targetEngagementPct;
  const engPace = (last && targetEngagement != null && targetEngagement !== "")
    ? (last.engagement15 >= targetEngagement ? "On Track" : last.engagement15 >= targetEngagement * 0.7 ? "Near Target" : "Below Target")
    : null;
  const engPaceColor = engPace === "On Track" ? "#146356" : engPace === "Near Target" ? "#E8A33D" : "#C4544A";

  return (
    <div>
      <Header title="Channels" sub="Growth and engagement, logged manually per month" action={
        <div style={{ display: "flex", gap: 8 }}>
          {isAdmin && <button onClick={() => setManageOpen(true)} style={{ ...primaryBtn, background: "#fff", color: "#146356", border: "1px solid #146356" }}><ShieldCheck size={15} /> Manage Channels</button>}
          <button onClick={() => setBulkOpen(true)} style={{ ...primaryBtn, background: "#fff", color: "#146356", border: "1px solid #146356" }}><Grid2X2 size={15} /> Bulk Monthly Entry</button>
          <button onClick={() => { setEditingRow(null); setOpen(true); }} style={primaryBtn}><Plus size={15} /> Log Monthly Stats</button>
        </div>
      } />

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {CHANNELS.map(c => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <button onClick={() => setSelected(c.id)} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 20,
              border: `1px solid ${selected === c.id ? c.color : "#D8DDD5"}`, background: selected === c.id ? c.color : "#fff",
              color: selected === c.id ? "#fff" : "#0E2B27", fontSize: 12, fontWeight: 600,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: selected === c.id ? "#fff" : c.color }} /> {c.name}
            </button>
            {c.link && <a href={c.link} target="_blank" rel="noreferrer" title={`Open ${c.name}`} style={{ color: "#5B675F", display: "flex" }}><ExternalLink size={13} /></a>}
          </div>
        ))}
      </div>

      {last ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 12 }}>
            <StatCard label="Current Followers" value={Number(last.followers).toLocaleString()} />
            <StatCard label="Growth Rate" value={`${last.growthPct.toFixed(2)}%`} badge={growthRating} badgeColor={RATING_COLOR[growthRating]} />
            <StatCard label="30-Day Engagement" value={`${last.engagement30}%`} badge={engRating} badgeColor={RATING_COLOR[engRating]} />
            <StatCard label="Next Month Follower Target" value={Number(Math.round(last.followers * (1 + (last.targetGrowthPct ?? 1) / 100))).toLocaleString()} sub={`at ${(last.targetGrowthPct ?? 1)}% growth target`} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
            <StatCard label="Monthly Engagement Target" value={targetEngagement != null && targetEngagement !== "" ? `${targetEngagement}%` : "Not set"} sub="Set per month when logging stats" />
            {engPace ? (
              <div style={{ background: "#fff", border: `1px solid ${engPaceColor}55`, borderRadius: 10, padding: "12px 14px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ fontSize: 11, color: "#5B675F", marginBottom: 4, fontWeight: 600 }}>15-Day Pace vs. Monthly Target</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span className="mono" style={{ fontSize: 16, fontWeight: 700 }}>{last.engagement15}%</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: engPaceColor, background: engPaceColor + "1A", padding: "2px 8px", borderRadius: 10 }}>{engPace}</span>
                </div>
              </div>
            ) : (
              <div style={{ background: "#F5F6F1", borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", fontSize: 11.5, color: "#9AA39B" }}>
                Set a monthly engagement target to see 15-day pace tracking.
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 6 }}>
              {["line", "bar"].map(s => (
                <button key={s} onClick={() => setChartStyle(s)} style={pillBtn(chartStyle === s)}>{s[0].toUpperCase() + s.slice(1)}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {["month", "quarter", "year"].map(g => (
                <button key={g} onClick={() => setGrowthView(g)} style={pillBtn(growthView === g)}>{g[0].toUpperCase() + g.slice(1)}ly</button>
              ))}
            </div>
          </div>

          <Card title={`${channel.name} — Follower Count`} style={{ marginBottom: 16 }}>
            <ResponsiveContainer width="100%" height={220}>
              {chartStyle === "bar" ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E3E6E0" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#5B675F" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#5B675F" }} domain={["auto", "auto"]} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #D8DDD5" }} formatter={v => Number(v).toLocaleString()} />
                  <Bar dataKey="followers" name="Followers" fill={channel.color} radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E3E6E0" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#5B675F" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#5B675F" }} domain={["auto", "auto"]} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #D8DDD5" }} formatter={v => Number(v).toLocaleString()} />
                  <Line type="monotone" dataKey="followers" name="Followers" stroke={channel.color} strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <Card title={`${channel.name} — Average Growth Rate`}>
              <ResponsiveContainer width="100%" height={220}>
                {chartStyle === "bar" ? (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E3E6E0" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#5B675F" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#5B675F" }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #D8DDD5" }} formatter={v => `${Number(v).toFixed(2)}%`} />
                    <Bar dataKey="growthPct" name="Growth %" fill={channel.color} radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E3E6E0" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#5B675F" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#5B675F" }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #D8DDD5" }} formatter={v => `${Number(v).toFixed(2)}%`} />
                    <Line type="monotone" dataKey="growthPct" name="Growth %" stroke={channel.color} strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </Card>
            <Card title={`${channel.name} — Engagement Rate`}>
              <ResponsiveContainer width="100%" height={220}>
                {chartStyle === "bar" ? (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E3E6E0" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#5B675F" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#5B675F" }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #D8DDD5" }} formatter={v => `${Number(v).toFixed(2)}%`} />
                    <Bar dataKey="engagement30" name="Engagement %" fill="#E8A33D" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E3E6E0" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#5B675F" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#5B675F" }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #D8DDD5" }} formatter={v => `${Number(v).toFixed(2)}%`} />
                    <Line type="monotone" dataKey="engagement30" name="Engagement %" stroke="#E8A33D" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </Card>
          </div>

          <Card title="Monthly Log">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead><tr style={{ textAlign: "left", color: "#5B675F", borderBottom: "1px solid #E3E6E0" }}>
                <th style={th}>Month</th><th style={th}>Followers</th><th style={th}>Growth %</th><th style={th}>Rating</th><th style={th}>30d Engagement</th><th style={th}>Rating</th><th style={th}>Eng. Target</th><th style={th}></th>
              </tr></thead>
              <tbody>
                {[...rows].reverse().map(r => (
                  <tr key={r.month} style={{ borderBottom: "1px solid #EEF0EC" }}>
                    <td style={td}>{monthLabel(r.month)}</td>
                    <td style={{ ...td }} className="mono">{Number(r.followers).toLocaleString()}</td>
                    <td style={td} className="mono">{r.growthPct.toFixed(2)}%</td>
                    <td style={td}><RatingBadge label={rate(channel.platform, "growth", r.growthPct)} /></td>
                    <td style={td} className="mono">{r.engagement30}%</td>
                    <td style={td}><RatingBadge label={rate(channel.platform, "engagement", r.engagement30)} /></td>
                    <td style={td} className="mono">{r.targetEngagementPct != null && r.targetEngagementPct !== "" ? `${r.targetEngagementPct}%` : "—"}</td>
                    <td style={td}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => { setEditingRow(r); setOpen(true); }} style={{ border: "none", background: "transparent", color: "#146356" }}><Pencil size={13} /></button>
                        {confirmDeleteMonth === r.month ? (
                          <button onClick={() => deleteEntry(r.month)} style={{ border: "none", background: "transparent", color: "#C4544A", fontSize: 10.5, fontWeight: 700 }}>Confirm?</button>
                        ) : (
                          <button onClick={() => setConfirmDeleteMonth(r.month)} style={{ border: "none", background: "transparent", color: "#C4544A" }}><Trash2 size={13} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      ) : <Card><Empty text={`No stats logged for ${channel.name} yet.`} /></Card>}

      {open && <ChannelEntryModal channel={channel} editing={editingRow} onClose={() => { setOpen(false); setEditingRow(null); }} onSave={addEntry} lastTarget={last?.targetGrowthPct ?? 1} lastEngTarget={last?.targetEngagementPct ?? ""} />}
      {bulkOpen && <BulkChannelEntryModal channelStats={channelStats} onSave={saveEntry} onClose={() => setBulkOpen(false)} />}
      {manageOpen && <ChannelManagerModal onClose={() => setManageOpen(false)} onAdd={addChannel} onDelete={handleDeleteChannel} onEdit={editChannel} />}
    </div>
  );
}

function ChannelEntryModal({ channel, onClose, onSave, lastTarget, lastEngTarget, editing }) {
  const [month, setMonth] = useState(editing?.month || localMonthStr(new Date()));
  const [followers, setFollowers] = useState(editing?.followers ?? "");
  const [eng15, setEng15] = useState(editing?.engagement15 ?? "");
  const [eng30, setEng30] = useState(editing?.engagement30 ?? "");
  const [targetGrowthPct, setTargetGrowthPct] = useState(editing?.targetGrowthPct ?? lastTarget);
  const [targetEngagementPct, setTargetEngagementPct] = useState(editing?.targetEngagementPct ?? lastEngTarget);

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div className="disp" style={{ fontSize: 18, fontWeight: 600 }}>{editing ? "Edit" : "Log"} Stats — {channel.name}</div>
          <button onClick={onClose} style={{ border: "none", background: "transparent" }}><X size={18} /></button>
        </div>
        <label style={label}>Month</label>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)} disabled={!!editing} style={{ ...inputStyle, width: "100%", marginBottom: 12, opacity: editing ? 0.6 : 1 }} />
        <label style={label}>Follower count</label>
        <input type="number" value={followers} onChange={e => setFollowers(e.target.value)} placeholder="e.g. 308284" style={{ ...inputStyle, width: "100%", marginBottom: 12 }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div><label style={label}>15-day engagement %</label><input type="number" step="0.1" value={eng15} onChange={e => setEng15(e.target.value)} style={{ ...inputStyle, width: "100%" }} /></div>
          <div><label style={label}>30-day engagement %</label><input type="number" step="0.1" value={eng30} onChange={e => setEng30(e.target.value)} style={{ ...inputStyle, width: "100%" }} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <div><label style={label}>Growth target % (next month)</label><input type="number" step="0.1" value={targetGrowthPct} onChange={e => setTargetGrowthPct(e.target.value)} style={{ ...inputStyle, width: "100%" }} /></div>
          <div><label style={label}>Engagement target % (this month)</label><input type="number" step="0.1" value={targetEngagementPct} onChange={e => setTargetEngagementPct(e.target.value)} style={{ ...inputStyle, width: "100%" }} /></div>
        </div>
        <button
          disabled={!followers}
          onClick={() => onSave({ month, followers: Number(followers), engagement15: Number(eng15 || 0), engagement30: Number(eng30 || 0), targetGrowthPct: Number(targetGrowthPct), targetEngagementPct: targetEngagementPct === "" ? "" : Number(targetEngagementPct) })}
          style={{ ...primaryBtn, width: "100%", justifyContent: "center", opacity: !followers ? 0.5 : 1 }}
        >{editing ? "Save Changes" : "Save Entry"}</button>
      </div>
    </div>
  );
}

function BulkChannelEntryModal({ channelStats, onSave, onClose }) {
  const [month, setMonth] = useState(localMonthStr(new Date()));
  const [rows, setRows] = useState(() => {
    const init = {};
    CHANNELS.forEach(c => {
      const existing = (channelStats[c.id] || []).find(r => r.month === month);
      init[c.id] = { followers: existing?.followers ?? "", engagement15: existing?.engagement15 ?? "", engagement30: existing?.engagement30 ?? "", targetGrowthPct: existing?.targetGrowthPct ?? 1, targetEngagementPct: existing?.targetEngagementPct ?? "" };
    });
    return init;
  });

  const loadMonth = (m) => {
    setMonth(m);
    const init = {};
    CHANNELS.forEach(c => {
      const existing = (channelStats[c.id] || []).find(r => r.month === m);
      init[c.id] = { followers: existing?.followers ?? "", engagement15: existing?.engagement15 ?? "", engagement30: existing?.engagement30 ?? "", targetGrowthPct: existing?.targetGrowthPct ?? 1, targetEngagementPct: existing?.targetEngagementPct ?? "" };
    });
    setRows(init);
  };

  const update = (chId, field, value) => setRows(r => ({ ...r, [chId]: { ...r[chId], [field]: value } }));

  const saveAll = () => {
    CHANNELS.forEach(c => {
      const r = rows[c.id];
      if (r.followers !== "" && r.followers !== null) {
        onSave(c.id, { month, followers: Number(r.followers), engagement15: Number(r.engagement15 || 0), engagement30: Number(r.engagement30 || 0), targetGrowthPct: Number(r.targetGrowthPct || 1), targetEngagementPct: r.targetEngagementPct === "" ? "" : Number(r.targetEngagementPct) });
      }
    });
    onClose();
  };

  return (
    <div style={overlay}>
      <div style={{ ...modal, width: 700 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div className="disp" style={{ fontSize: 18, fontWeight: 600 }}>Bulk Monthly Entry</div>
          <button onClick={onClose} style={{ border: "none", background: "transparent" }}><X size={18} /></button>
        </div>
        <label style={label}>Month</label>
        <input type="month" value={month} onChange={e => loadMonth(e.target.value)} style={{ ...inputStyle, width: 200, marginBottom: 14 }} />
        <div style={{ maxHeight: 360, overflowY: "auto", overflowX: "auto", border: "1px solid #E3E6E0", borderRadius: 8 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead><tr style={{ textAlign: "left", color: "#5B675F", background: "#F5F6F1", position: "sticky", top: 0 }}>
              <th style={{ padding: "7px 8px" }}>Channel</th><th style={{ padding: "7px 8px" }}>Followers</th><th style={{ padding: "7px 8px" }}>15d Eng %</th><th style={{ padding: "7px 8px" }}>30d Eng %</th><th style={{ padding: "7px 8px" }}>Growth Target %</th><th style={{ padding: "7px 8px" }}>Eng. Target %</th>
            </tr></thead>
            <tbody>
              {CHANNELS.map(c => (
                <tr key={c.id} style={{ borderTop: "1px solid #EEF0EC" }}>
                  <td style={{ padding: "6px 8px", fontWeight: 600 }}><div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 7, height: 7, borderRadius: "50%", background: c.color }} />{c.name}</div></td>
                  <td style={{ padding: "6px 8px" }}><input type="number" value={rows[c.id]?.followers ?? ""} onChange={e => update(c.id, "followers", e.target.value)} style={{ ...inputStyle, width: 100, fontSize: 12, padding: "5px 7px" }} /></td>
                  <td style={{ padding: "6px 8px" }}><input type="number" step="0.1" value={rows[c.id]?.engagement15 ?? ""} onChange={e => update(c.id, "engagement15", e.target.value)} style={{ ...inputStyle, width: 70, fontSize: 12, padding: "5px 7px" }} /></td>
                  <td style={{ padding: "6px 8px" }}><input type="number" step="0.1" value={rows[c.id]?.engagement30 ?? ""} onChange={e => update(c.id, "engagement30", e.target.value)} style={{ ...inputStyle, width: 70, fontSize: 12, padding: "5px 7px" }} /></td>
                  <td style={{ padding: "6px 8px" }}><input type="number" step="0.1" value={rows[c.id]?.targetGrowthPct ?? ""} onChange={e => update(c.id, "targetGrowthPct", e.target.value)} style={{ ...inputStyle, width: 60, fontSize: 12, padding: "5px 7px" }} /></td>
                  <td style={{ padding: "6px 8px" }}><input type="number" step="0.1" value={rows[c.id]?.targetEngagementPct ?? ""} onChange={e => update(c.id, "targetEngagementPct", e.target.value)} style={{ ...inputStyle, width: 60, fontSize: 12, padding: "5px 7px" }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 10.5, color: "#9AA39B", margin: "10px 0 16px" }}>Only channels with a follower count filled in will be saved — leave the rest blank to skip them for this month.</div>
        <button onClick={saveAll} style={{ ...primaryBtn, width: "100%", justifyContent: "center" }}>Save All Channels</button>
      </div>
    </div>
  );
}

function ChannelManagerModal({ onClose, onAdd, onDelete, onEdit }) {
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("Facebook");
  const [link, setLink] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [editingLinkId, setEditingLinkId] = useState(null);
  const [editingLinkValue, setEditingLinkValue] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    const usedColors = CHANNELS.map(c => c.color);
    const color = EXTRA_CHANNEL_COLOR_POOL.find(c => !usedColors.includes(c)) || EXTRA_CHANNEL_COLOR_POOL[CHANNELS.length % EXTRA_CHANNEL_COLOR_POOL.length];
    onAdd({ id: uid(), name: name.trim(), platform, color, link: link.trim() });
    setName(""); setLink("");
  };

  const startEditLink = (c) => { setEditingLinkId(c.id); setEditingLinkValue(c.link || ""); };
  const saveEditLink = () => { onEdit(editingLinkId, { link: editingLinkValue.trim() }); setEditingLinkId(null); };

  return (
    <div style={overlay}>
      <div style={{ ...modal, width: 480 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div className="disp" style={{ fontSize: 18, fontWeight: 600 }}>Manage Channels <span style={{ fontSize: 11, fontWeight: 600, color: "#E8A33D", background: "#E8A33D1A", padding: "2px 8px", borderRadius: 10, marginLeft: 6 }}>Admin</span></div>
          <button onClick={onClose} style={{ border: "none", background: "transparent" }}><X size={18} /></button>
        </div>

        <div style={{ maxHeight: 280, overflowY: "auto", border: "1px solid #E3E6E0", borderRadius: 8, marginBottom: 14 }}>
          {CHANNELS.map(c => (
            <div key={c.id} style={{ padding: "7px 10px", borderBottom: "1px solid #EEF0EC" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: 12.5 }}>{c.name} <span style={{ color: "#9AA39B", fontSize: 11 }}>· {c.platform}</span></div>
                {c.link && <a href={c.link} target="_blank" rel="noreferrer" style={{ color: "#146356" }}><ExternalLink size={12} /></a>}
                <button onClick={() => startEditLink(c)} style={{ border: "none", background: "transparent", color: "#146356" }}><Pencil size={12} /></button>
                {confirmDeleteId === c.id ? (
                  <button onClick={() => { onDelete(c.id); setConfirmDeleteId(null); }} style={{ border: "none", background: "transparent", color: "#C4544A", fontSize: 10.5, fontWeight: 700 }}>Confirm?</button>
                ) : (
                  <button onClick={() => setConfirmDeleteId(c.id)} style={{ border: "none", background: "transparent", color: "#C4544A" }}><Trash2 size={13} /></button>
                )}
              </div>
              {editingLinkId === c.id && (
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <input value={editingLinkValue} onChange={e => setEditingLinkValue(e.target.value)} placeholder="https://..." style={{ ...inputStyle, flex: 1, fontSize: 12, padding: "5px 8px" }} autoFocus />
                  <button onClick={saveEditLink} style={{ border: "none", background: "transparent", color: "#146356", fontSize: 11, fontWeight: 700 }}>Save</button>
                  <button onClick={() => setEditingLinkId(null)} style={{ border: "none", background: "transparent", color: "#9AA39B", fontSize: 11, fontWeight: 700 }}>Cancel</button>
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10.5, color: "#9AA39B", marginBottom: 14 }}>Deleting a channel also removes its logged monthly stats. Requests/captions that reference it keep the tag as history.</div>

        <label style={label}>Add new channel</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. IPASS LinkedIn" style={{ ...inputStyle, width: "100%", marginBottom: 10 }} />
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          <select value={platform} onChange={e => setPlatform(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
            {["Facebook", "Instagram", "TikTok", "YouTube", "LinkedIn", "Other"].map(p => <option key={p}>{p}</option>)}
          </select>
          <button disabled={!name.trim()} onClick={submit} style={{ ...primaryBtn, opacity: !name.trim() ? 0.5 : 1 }}><Plus size={14} /></button>
        </div>
        <input value={link} onChange={e => setLink(e.target.value)} placeholder="Channel URL (optional) — https://..." style={{ ...inputStyle, width: "100%" }} />
        <div style={{ fontSize: 10, color: "#9AA39B", marginTop: 6 }}>Benchmark ratings currently only exist for Facebook/Instagram/TikTok/YouTube — LinkedIn and Other will show raw numbers without a Low/Good/Excellent rating until those benchmarks are added.</div>
      </div>
    </div>
  );
}

/* ---------------------------------- TARGETS ---------------------------------- */


function Targets({ targets, setTargets, requests, majorServices = MAJOR_SERVICES }) {
  const [open, setOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const countForRange = (t, startStr, endStr) => {
    const inRange = requests.filter(r => {
      if (r.status !== "Completed") return false;
      return r.dateLogged >= startStr && r.dateLogged <= endStr;
    });
    return t.scope === "channel"
      ? inRange.filter(r => r.channel === t.target).length
      : inRange.filter(r => r.services.includes(t.target)).length;
  };

  // Monthly targets: one straightforward progress bar for the current calendar month.
  const monthProgressFor = (t) => {
    const now = new Date();
    const monthStart = `${localMonthStr(now)}-01`;
    const monthEnd = localDateStr(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    return countForRange(t, monthStart, monthEnd);
  };

  // Weekly targets: broken into every week of the current month, each measured
  // against the same goal — not just one rolling "current week" number.
  const weeklyBreakdownFor = (t) => {
    const weeks = getMonthWeeks(new Date());
    return weeks.map(w => ({ ...w, count: countForRange(t, w.start, w.end) }));
  };

  const statusFor = (count, goal) => {
    const pct = (count / goal) * 100;
    if (pct >= 100) return { label: "Met", color: "#146356" };
    if (pct >= 60) return { label: "On Track", color: "#E8A33D" };
    return { label: "Behind", color: "#C4544A" };
  };

  const removeTarget = (id) => { setTargets(ts => ts.filter(t => t.id !== id)); setConfirmDeleteId(null); };

  return (
    <div>
      <Header title="Targets" sub="Admin-set post targets, tracked per channel and per service" action={
        <button onClick={() => setOpen(true)} style={primaryBtn}><Plus size={15} /> New Target</button>
      } />

      {targets.length === 0 ? <Card><Empty text="No targets set yet. Add one to start tracking progress." /></Card> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
          {targets.map(t => {
            const name = t.scope === "channel" ? CHANNELS.find(c => c.id === t.target)?.name : t.target;
            const isWeekly = t.period === "week";
            const weeklyBreakdown = isWeekly ? weeklyBreakdownFor(t) : null;
            const monthCount = !isWeekly ? monthProgressFor(t) : null;
            const monthSt = !isWeekly ? statusFor(monthCount, t.goal) : null;
            const monthPct = !isWeekly ? Math.min(100, (monthCount / t.goal) * 100) : null;
            // Card-level badge: for weekly targets, reflect the CURRENT week's status specifically.
            const now = new Date();
            const currentWeek = isWeekly ? weeklyBreakdown.find(w => localDateStr(now) >= w.start && localDateStr(now) <= w.end) : null;
            const cardSt = isWeekly ? (currentWeek ? statusFor(currentWeek.count, t.goal) : { label: "—", color: "#9AA39B" }) : monthSt;

            return (
              <Card key={t.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{name}</div>
                    <div style={{ fontSize: 11, color: "#5B675F", textTransform: "capitalize" }}>{t.scope} · per {t.period} · goal {t.goal}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: cardSt.color, background: cardSt.color + "1A", padding: "3px 9px", borderRadius: 12 }}>{isWeekly ? `This week: ${cardSt.label}` : cardSt.label}</span>
                    <button onClick={() => setEditingTarget(t)} style={{ border: "none", background: "transparent", color: "#146356" }}><Pencil size={13} /></button>
                    {confirmDeleteId === t.id ? (
                      <button onClick={() => removeTarget(t.id)} style={{ border: "none", background: "transparent", color: "#C4544A", fontSize: 10.5, fontWeight: 700 }}>Confirm?</button>
                    ) : (
                      <button onClick={() => setConfirmDeleteId(t.id)} style={{ border: "none", background: "transparent", color: "#C4544A" }}><Trash2 size={13} /></button>
                    )}
                  </div>
                </div>

                {isWeekly ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {weeklyBreakdown.map(w => {
                      const wSt = statusFor(w.count, t.goal);
                      const wPct = Math.min(100, (w.count / t.goal) * 100);
                      const isCurrent = currentWeek && w.label === currentWeek.label;
                      return (
                        <div key={w.label}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 3 }}>
                            <span style={{ fontWeight: isCurrent ? 700 : 500 }}>{w.label}{isCurrent && <span style={{ color: "#9AA39B", fontWeight: 500 }}> (current)</span>}</span>
                            <span className="mono" style={{ color: "#5B675F" }}>{w.count} / {t.goal}</span>
                          </div>
                          <div style={{ height: 6, background: "#EEF0EC", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ width: `${wPct}%`, height: "100%", background: wSt.color, borderRadius: 3 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                      <span className="mono">{monthCount} / {t.goal} posts</span>
                      <span style={{ color: "#5B675F" }}>{monthPct.toFixed(0)}%</span>
                    </div>
                    <div style={{ height: 7, background: "#EEF0EC", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${monthPct}%`, height: "100%", background: monthSt.color, borderRadius: 4 }} />
                    </div>
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {open && <TargetModal majorServices={majorServices} onClose={() => setOpen(false)} onSave={(t) => { setTargets(ts => [...ts, t]); setOpen(false); }} />}
      {editingTarget && (
        <TargetModal
          majorServices={majorServices}
          editing={editingTarget}
          onClose={() => setEditingTarget(null)}
          onSave={(t) => { setTargets(ts => ts.map(x => x.id === t.id ? t : x)); setEditingTarget(null); }}
        />
      )}
    </div>
  );
}

function TargetModal({ onClose, onSave, majorServices = MAJOR_SERVICES, editing }) {
  const [scope, setScope] = useState(editing?.scope || "channel");
  const [target, setTarget] = useState(editing?.target || CHANNELS[0].id);
  const [period, setPeriod] = useState(editing?.period || "week");
  const [goal, setGoal] = useState(editing?.goal || 5);

  useEffect(() => { if (!editing) setTarget(scope === "channel" ? CHANNELS[0].id : majorServices[0]); }, [scope]);

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div className="disp" style={{ fontSize: 18, fontWeight: 600 }}>{editing ? "Edit Target" : "New Target"}</div>
          <button onClick={onClose} style={{ border: "none", background: "transparent" }}><X size={18} /></button>
        </div>
        <label style={label}>Scope</label>
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          <button onClick={() => setScope("channel")} style={pillBtn(scope === "channel")}>Per Channel</button>
          <button onClick={() => setScope("service")} style={pillBtn(scope === "service")}>Per Service</button>
        </div>
        <label style={label}>{scope === "channel" ? "Channel" : "Service"}</label>
        <select value={target} onChange={e => setTarget(e.target.value)} style={{ ...inputStyle, width: "100%", marginBottom: 14 }}>
          {(scope === "channel" ? CHANNELS : majorServices.map(s => ({ id: s, name: s }))).map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <div>
            <label style={label}>Period</label>
            <select value={period} onChange={e => setPeriod(e.target.value)} style={{ ...inputStyle, width: "100%" }}>
              <option value="week">Weekly</option><option value="month">Monthly</option>
            </select>
          </div>
          <div>
            <label style={label}>Post goal</label>
            <input type="number" value={goal} onChange={e => setGoal(Number(e.target.value))} style={{ ...inputStyle, width: "100%" }} />
          </div>
        </div>
        <button onClick={() => onSave({ id: editing?.id || uid(), scope, target, period, goal })} style={{ ...primaryBtn, width: "100%", justifyContent: "center" }}>{editing ? "Save Changes" : "Create Target"}</button>
      </div>
    </div>
  );
}

/* ---------------------------------- CAPTIONS ---------------------------------- */

function Captions({ captions, setCaptions, templates, setTemplates, majorServices = MAJOR_SERVICES, minorServices = MINOR_SERVICES }) {
  const [view, setView] = useState("library"); // library | templates
  const [open, setOpen] = useState(false);
  const [editingCaption, setEditingCaption] = useState(null);
  const [templateEditTarget, setTemplateEditTarget] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterService, setFilterService] = useState("All");

  const filtered = captions.filter(c =>
    (filterStatus === "All" || c.status === filterStatus) &&
    (filterService === "All" || c.services.includes(filterService)) &&
    (c.brief.toLowerCase().includes(search.toLowerCase()) || c.textEn.toLowerCase().includes(search.toLowerCase()))
  ).sort((a, b) => b.dateCreated.localeCompare(a.dateCreated));

  const setStatus = (id, status) => setCaptions(cs => cs.map(c => c.id === id ? { ...c, status } : c));
  const remove = (id) => setCaptions(cs => cs.filter(c => c.id !== id));
  const removeTemplate = (id) => setTemplates(ts => ts.filter(t => t.id !== id));

  return (
    <div>
      <Header title="Captions" sub="Build, store, and reuse captions across channels" action={
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setTemplateEditTarget({ id: uid(), name: "", textEn: "", textFil: "", hashtags: [] })} style={{ ...primaryBtn, background: "#fff", color: "#146356", border: "1px solid #146356" }}><FileText size={15} /> New Template</button>
          <button onClick={() => setOpen(true)} style={primaryBtn}><Plus size={15} /> New Caption</button>
        </div>
      } />

      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        <button onClick={() => setView("library")} style={pillBtn(view === "library")}>Library ({captions.length})</button>
        <button onClick={() => setView("templates")} style={pillBtn(view === "templates")}>Templates ({templates.length})</button>
      </div>

      {view === "library" ? (
        <>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: 10, color: "#9AA39B" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search briefs or caption text..." style={{ ...inputStyle, paddingLeft: 30, width: "100%" }} />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: 140 }}>
              <option>All</option>{CAPTION_STATUS.map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={filterService} onChange={e => setFilterService(e.target.value)} style={{ ...inputStyle, width: 180 }}>
              <option>All Services</option>{[...majorServices, ...minorServices].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {filtered.length === 0 ? <Card><Empty text="No captions match. Create your first one above." /></Card> : (
            <div style={{ display: "grid", gap: 10 }}>
              {filtered.map(c => <CaptionCard key={c.id} c={c} onStatus={setStatus} onRemove={remove} onEdit={setEditingCaption} />)}
            </div>
          )}
        </>
      ) : (
        templates.length === 0 ? <Card><Empty text="No templates yet. Save a reusable format above." /></Card> : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
            {templates.map(t => (
              <Card key={t.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{t.name}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setTemplateEditTarget(t)} style={{ border: "none", background: "transparent", color: "#146356" }}><Pencil size={13} /></button>
                    <button onClick={() => removeTemplate(t.id)} style={{ border: "none", background: "transparent", color: "#C4544A" }}><X size={14} /></button>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "#0E2B27", whiteSpace: "pre-wrap", marginBottom: 8 }}>{t.textEn}</div>
                {t.hashtags?.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {t.hashtags.map(h => <span key={h} style={{ ...tagStyle, color: "#146356" }}>#{h.replace(/^#/, "")}</span>)}
                </div>}
              </Card>
            ))}
          </div>
        )
      )}

      {open && <CaptionModal onClose={() => setOpen(false)} templates={templates} majorServices={majorServices} minorServices={minorServices}
        onSave={(cap) => { setCaptions(cs => [...cs, cap]); setOpen(false); }} />}
      {editingCaption && (
        <CaptionModal
          editing={editingCaption}
          onClose={() => setEditingCaption(null)}
          templates={templates} majorServices={majorServices} minorServices={minorServices}
          onSave={(cap) => { setCaptions(cs => cs.map(c => c.id === cap.id ? cap : c)); setEditingCaption(null); }}
        />
      )}
      {templateEditTarget && (
        <TemplateEditModal
          template={templateEditTarget}
          onClose={() => setTemplateEditTarget(null)}
          onSave={(t) => {
            setTemplates(ts => ts.some(x => x.id === t.id) ? ts.map(x => x.id === t.id ? t : x) : [...ts, t]);
            setTemplateEditTarget(null);
          }}
        />
      )}
    </div>
  );
}

function CaptionCard({ c, onStatus, onRemove, onEdit }) {
  const [copied, setCopied] = useState(false);
  const platform = CHANNELS.find(ch => ch.id === c.channel)?.platform;
  const limit = PLATFORM_CAPTION_LIMIT[platform] || 300;
  const len = c.textEn.length;
  const over = len > limit;

  const copy = () => {
    const hashtagLine = c.hashtags?.length ? `\n\n${c.hashtags.map(h => `#${h.replace(/^#/, "")}`).join(" ")}` : "";
    navigator.clipboard?.writeText(c.textEn + hashtagLine).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  };

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{c.brief}</div>
          <div style={{ fontSize: 11, color: "#5B675F", marginTop: 2 }}>
            {CHANNELS.find(ch => ch.id === c.channel)?.name} · {c.creativeType} {c.campaign && `· ${c.campaign}`}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <select value={c.status} onChange={e => onStatus(c.id, e.target.value)} style={{
            fontSize: 11, fontWeight: 700, color: CAPTION_STATUS_COLOR[c.status], background: CAPTION_STATUS_COLOR[c.status] + "1A",
            border: "none", borderRadius: 12, padding: "3px 8px",
          }}>
            {CAPTION_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={() => onEdit(c)} style={{ border: "none", background: "transparent", color: "#146356" }}><Pencil size={13} /></button>
          <button onClick={() => onRemove(c.id)} style={{ border: "none", background: "transparent", color: "#C4544A" }}><X size={14} /></button>
        </div>
      </div>

      <div style={{ fontSize: 12.5, whiteSpace: "pre-wrap", background: "#F5F6F1", borderRadius: 8, padding: 10, marginBottom: c.textFil ? 6 : 8 }}>{c.textEn}</div>
      {c.textFil && <div style={{ fontSize: 12.5, whiteSpace: "pre-wrap", background: "#F5F6F1", borderRadius: 8, padding: 10, marginBottom: 8, fontStyle: "italic", color: "#5B675F" }}>{c.textFil}</div>}

      {c.hashtags?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
          {c.hashtags.map(h => <span key={h} style={{ ...tagStyle, color: "#146356" }}>#{h.replace(/^#/, "")}</span>)}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {c.services.map(s => <span key={s} style={tagStyle}>{s}</span>)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="mono" style={{ fontSize: 10.5, color: over ? "#C4544A" : "#9AA39B" }}>{len}/{limit}</span>
          <button onClick={copy} style={{ display: "flex", alignItems: "center", gap: 5, border: "1px solid #D8DDD5", background: copied ? "#146356" : "#fff", color: copied ? "#fff" : "#0E2B27", borderRadius: 7, padding: "5px 10px", fontSize: 11.5, fontWeight: 600 }}>
            <Copy size={12} /> {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    </Card>
  );
}

function CaptionModal({ onClose, onSave, templates, majorServices = MAJOR_SERVICES, minorServices = MINOR_SERVICES, editing }) {
  const [brief, setBrief] = useState(editing?.brief || "");
  const [serviceType, setServiceType] = useState("major");
  const [services, setServices] = useState(editing?.services || []);
  const [creativeType, setCreativeType] = useState(editing?.creativeType || CREATIVE_TYPES[0]);
  const [channel, setChannel] = useState(editing?.channel || CHANNELS[0].id);
  const [campaign, setCampaign] = useState(editing?.campaign || "");
  const [textEn, setTextEn] = useState(editing?.textEn || "");
  const [textFil, setTextFil] = useState(editing?.textFil || "");
  const [hashtagsInput, setHashtagsInput] = useState((editing?.hashtags || []).join(", "));
  const list = serviceType === "major" ? majorServices : minorServices;

  const toggleService = (s) => setServices(cur => cur.includes(s) ? cur.filter(x => x !== s) : [...cur, s]);

  const applyTemplate = (id) => {
    const t = templates.find(x => x.id === id);
    if (!t) return;
    setTextEn(t.textEn); setTextFil(t.textFil || ""); setHashtagsInput((t.hashtags || []).join(", "));
  };

  return (
    <div style={overlay}>
      <div style={{ ...modal, width: 560 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div className="disp" style={{ fontSize: 18, fontWeight: 600 }}>{editing ? "Edit Caption" : "New Caption"}</div>
          <button onClick={onClose} style={{ border: "none", background: "transparent" }}><X size={18} /></button>
        </div>

        <label style={label}>Brief / title</label>
        <input value={brief} onChange={e => setBrief(e.target.value)} placeholder="e.g. May PNLE trivia post" style={{ ...inputStyle, width: "100%", marginBottom: 12 }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div>
            <label style={label}>Creative type</label>
            <select value={creativeType} onChange={e => setCreativeType(e.target.value)} style={{ ...inputStyle, width: "100%" }}>{CREATIVE_TYPES.map(c => <option key={c}>{c}</option>)}</select>
          </div>
          <div>
            <label style={label}>Channel</label>
            <select value={channel} onChange={e => setChannel(e.target.value)} style={{ ...inputStyle, width: "100%" }}>{CHANNELS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          </div>
          <div>
            <label style={label}>Campaign (optional)</label>
            <input value={campaign} onChange={e => setCampaign(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
          </div>
        </div>

        <label style={label}>Service tags</label>
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          <button onClick={() => setServiceType("major")} style={pillBtn(serviceType === "major")}>Major</button>
          <button onClick={() => setServiceType("minor")} style={pillBtn(serviceType === "minor")}>Minor</button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 90, overflowY: "auto", border: "1px solid #E3E6E0", borderRadius: 8, padding: 8, marginBottom: 14 }}>
          {list.map(s => <button key={s} onClick={() => toggleService(s)} style={pillBtn(services.includes(s))}>{s}</button>)}
          <OtherTagPicker services={services} setServices={setServices} />
        </div>

        {templates.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <label style={label}>Start from a template (optional)</label>
            <select onChange={e => e.target.value && applyTemplate(e.target.value)} defaultValue="" style={{ ...inputStyle, width: "100%" }}>
              <option value="">— none —</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        )}

        <div style={{ background: "#F5F6F1", border: "1px solid #E3E6E0", borderRadius: 9, padding: 10, marginBottom: 14, fontSize: 11, color: "#5B675F" }}>
          Tip: draft in ChatGPT first (a Project seeded with your approved captions keeps the brand voice consistent), then paste the result below.
        </div>

        <label style={label}>Caption (English)</label>
        <RichCaptionField value={textEn} onChange={setTextEn} rows={4} />
        <label style={label}>Caption (Filipino) — optional</label>
        <textarea value={textFil} onChange={e => setTextFil(e.target.value)} rows={3} style={{ ...inputStyle, width: "100%", marginBottom: 12, resize: "vertical" }} />

        <label style={label}><Hash size={11} style={{ verticalAlign: -1 }} /> Hashtags (comma-separated)</label>
        <input value={hashtagsInput} onChange={e => setHashtagsInput(e.target.value)} placeholder="IPASSNCLEX, NCLEXReview" style={{ ...inputStyle, width: "100%", marginBottom: 20 }} />

        <button
          disabled={!brief || services.length === 0 || !textEn}
          onClick={() => onSave({
            id: editing?.id || uid(), brief, services, creativeType, channel, campaign, textEn, textFil,
            hashtags: hashtagsInput.split(",").map(h => h.trim()).filter(Boolean),
            status: editing?.status || "Draft", dateCreated: editing?.dateCreated || localDateStr(new Date()),
          })}
          style={{ ...primaryBtn, width: "100%", justifyContent: "center", opacity: (!brief || services.length === 0 || !textEn) ? 0.5 : 1 }}
        >{editing ? "Save Changes" : "Save Caption"}</button>
      </div>
    </div>
  );
}


/* ---------------------------------- SCHEDULER ---------------------------------- */

function Scheduler({ requests, setRequests, captions, setCaptions, templates, setTemplates, targets, setTargets, user, notes, setNotes, majorServices = MAJOR_SERVICES, minorServices = MINOR_SERVICES, extraServices = { major: [], minor: [] }, setExtraServices, isAdmin }) {
  const [section, setSection] = useState("calendar"); // calendar | notes
  const [view, setView] = useState("month");
  const [cursor, setCursor] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [newModalDate, setNewModalDate] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [rescheduling, setRescheduling] = useState(null);
  const [addServiceOpen, setAddServiceOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");

  const todayStr = localDateStr(new Date());
  const isPast = (dateStr) => dateStr < todayStr;

  const scheduled = useMemo(() => requests.filter(r => r.scheduledDate), [requests]);
  const filteredScheduled = useMemo(() =>
    statusFilter === "All" ? scheduled : scheduled.filter(r => (r.postStatus || "Pending") === statusFilter)
  , [scheduled, statusFilter]);
  const byDate = useMemo(() => {
    const map = {};
    filteredScheduled.forEach(r => { (map[r.scheduledDate] = map[r.scheduledDate] || []).push(r); });
    return map;
  }, [filteredScheduled]);

  const statusCounts = useMemo(() => {
    const counts = {};
    POST_STATUSES.forEach(s => { counts[s] = 0; });
    scheduled.forEach(r => { const s = r.postStatus || "Pending"; if (counts[s] !== undefined) counts[s] += 1; });
    return counts;
  }, [scheduled]);

  const readiness = useMemo(() => {
    const pending = scheduled.filter(r => (r.postStatus || "Pending") === "Pending");
    const ready = pending.filter(r => r.linkedCaptionId && r.creativeRef).length;
    return { ready, total: pending.length };
  }, [scheduled]);

  const shift = (amount) => setCursor(c => {
    const d = new Date(c);
    if (view === "month") d.setMonth(d.getMonth() + amount);
    else d.setDate(d.getDate() + amount * 7);
    return d;
  });

  const monthLabelFull = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const monthGrid = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startPad; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    return cells;
  }, [cursor]);

  const weekDays = useMemo(() => {
    const d = new Date(cursor);
    d.setDate(d.getDate() - d.getDay());
    return Array.from({ length: 7 }, (_, i) => { const dd = new Date(d); dd.setDate(d.getDate() + i); return dd; });
  }, [cursor]);

  const fmt = (d) => localDateStr(d);
  const updatePost = (id, patch) => setRequests(rs => rs.map(r => r.id === id ? { ...r, ...patch } : r));
  const removePost = (id) => { setRequests(rs => rs.filter(r => r.id !== id)); setEditingPost(null); };

  const addService = (type, name) => {
    setExtraServices(prev => {
      const key = type === "major" ? "major" : "minor";
      if (prev[key].includes(name)) return prev;
      return { ...prev, [key]: [...prev[key], name] };
    });
  };

  const renameService = (type, oldName, newName) => {
    if (!newName.trim() || newName === oldName) return;
    const key = type === "major" ? "major" : "minor";
    setExtraServices(prev => ({ ...prev, [key]: prev[key].map(s => s === oldName ? newName : s) }));
    setRequests(rs => rs.map(r => r.services?.includes(oldName) ? { ...r, services: r.services.map(s => s === oldName ? newName : s) } : r));
    setCaptions(cs => cs.map(c => c.services?.includes(oldName) ? { ...c, services: c.services.map(s => s === oldName ? newName : s) } : c));
    if (setTargets) setTargets(ts => ts.map(t => t.scope === "service" && t.target === oldName ? { ...t, target: newName } : t));
  };

  const deleteService = (type, name) => {
    const key = type === "major" ? "major" : "minor";
    setExtraServices(prev => ({ ...prev, [key]: prev[key].filter(s => s !== name) }));
  };

  const resetServices = () => {
    setExtraServices(prev => ({ ...prev, major: [...MAJOR_SERVICES], minor: [...MINOR_SERVICES] }));
  };

  return (
    <div>
      <Header title="Scheduler" sub="Color-coded planning calendar across channels" action={
        <div style={{ display: "flex", gap: 8 }}>
          {isAdmin && (
            <button onClick={() => setAddServiceOpen(true)} style={{ ...primaryBtn, background: "#fff", color: "#146356", border: "1px solid #146356" }}>
              <ShieldCheck size={14} /> Manage Services
            </button>
          )}
          <button onClick={() => setNewModalDate(todayStr)} style={primaryBtn}><Plus size={15} /> New Scheduled Post</button>
        </div>
      } />

      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        <button onClick={() => setSection("calendar")} style={pillBtn(section === "calendar")}><CalendarDays size={12} style={{ verticalAlign: -1, marginRight: 4 }} />Calendar</button>
        <button onClick={() => setSection("notes")} style={pillBtn(section === "notes")}><StickyNote size={12} style={{ verticalAlign: -1, marginRight: 4 }} />Notes</button>
      </div>

      {section === "notes" && <NotesBoard notes={notes} setNotes={setNotes} user={user} />}
      {section === "calendar" && (
      <>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Status Dashboard</div>
          <div style={{ fontSize: 11, color: "#5B675F" }}>
            {readiness.total === 0 ? "No pending posts yet." : (
              <>Ready to post: <b style={{ color: readiness.ready === readiness.total ? "#146356" : "#E8A33D" }}>{readiness.ready}/{readiness.total}</b> pending have both caption + creative attached</>
            )}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10 }}>
          {POST_STATUSES.map(s => {
            const Icon = POST_STATUS_ICON[s];
            const active = statusFilter === s;
            return (
              <button key={s} onClick={() => setStatusFilter(active ? "All" : s)} style={{
                textAlign: "left", border: `1px solid ${active ? POST_STATUS_COLOR[s] : "#E3E6E0"}`, borderRadius: 8, padding: "8px 10px",
                background: active ? POST_STATUS_COLOR[s] + "14" : "#fff",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, color: POST_STATUS_COLOR[s], fontSize: 10.5, fontWeight: 700, marginBottom: 3 }}>
                  <Icon size={12} /> {s}
                </div>
                <div className="mono" style={{ fontSize: 18, fontWeight: 600 }}>{statusCounts[s]}</div>
              </button>
            );
          })}
        </div>
        {statusFilter !== "All" && (
          <div style={{ fontSize: 10.5, color: "#5B675F", marginTop: 8 }}>
            Showing "{statusFilter}" only on the calendar below. <button onClick={() => setStatusFilter("All")} style={{ border: "none", background: "transparent", color: "#146356", fontWeight: 700, textDecoration: "underline", padding: 0 }}>Clear filter</button>
          </div>
        )}
      </Card>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => shift(-1)} style={navBtn}><ChevronLeft size={16} /></button>
          <div style={{ fontSize: 14, fontWeight: 700, minWidth: 170, textAlign: "center" }}>
            {view === "month" ? monthLabelFull : `${weekDays[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekDays[6].toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
          </div>
          <button onClick={() => shift(1)} style={navBtn}><ChevronRight size={16} /></button>
          <button onClick={() => setCursor(new Date())} style={{ ...navBtn, width: "auto", padding: "0 10px", fontSize: 11.5, fontWeight: 600 }}>Today</button>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setView("month")} style={pillBtn(view === "month")}>Month</button>
          <button onClick={() => setView("week")} style={pillBtn(view === "week")}>Week</button>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 6 }}>
        {majorServices.map(s => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#5B675F" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: MAJOR_SERVICE_COLOR[s] || EXTRA_MAJOR_COLOR_POOL[extraServices.major.indexOf(s) % EXTRA_MAJOR_COLOR_POOL.length] }} /> {s}
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#5B675F" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: MINOR_SERVICE_COLOR }} /> Minor service (see label)
        </div>
      </div>
      <div style={{ fontSize: 10.5, color: "#9AA39B", marginBottom: 14 }}>Color marks the Major Service; exact service always shown as text on each post. Past days are locked to prevent backdated logging.</div>

      {view === "month" ? (
        <Card>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 1, background: "#E3E6E0", border: "1px solid #E3E6E0", borderRadius: 8, overflow: "hidden" }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} style={{ background: "#F5F6F1", padding: "6px 8px", fontSize: 10.5, fontWeight: 700, color: "#5B675F" }}>{d}</div>
            ))}
            {monthGrid.map((d, i) => {
              if (!d) return <div key={i} style={{ background: "#fff", minHeight: 118 }} />;
              const key = fmt(d);
              const items = byDate[key] || [];
              const isToday = key === todayStr;
              const past = isPast(key);
              const clickable = items.length > 0 || !past;
              return (
                <button key={i} disabled={!clickable} onClick={() => { if (items.length) setSelectedDay(key); else if (!past) setNewModalDate(key); }} style={{
                  background: past ? "#FAFAF8" : "#fff", minHeight: 118, padding: 6, textAlign: "left", border: "none", cursor: clickable ? "pointer" : "default",
                  display: "flex", flexDirection: "column", gap: 3, opacity: past && items.length === 0 ? 0.5 : 1,
                }}>
                  <span style={{
                    fontSize: 11, fontWeight: isToday ? 700 : 500, color: isToday ? "#fff" : (past ? "#9AA39B" : "#0E2B27"),
                    background: isToday ? "#146356" : "transparent", width: 18, height: 18, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{d.getDate()}</span>
                  {items.slice(0, 5).map(r => {
                    const svc = primaryService(r.services, extraServices.major);
                    return (
                      <div key={r.id} style={{ fontSize: 9.5, background: svc.color + "22", color: svc.color, borderRadius: 4, padding: "1px 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={svc.name}>
                        {r.title} · {svc.name}
                      </div>
                    );
                  })}
                  {items.length > 5 && <div style={{ fontSize: 9.5, color: "#9AA39B" }}>+{items.length - 5} more</div>}
                </button>
              );
            })}
          </div>
        </Card>
      ) : (
        <Card>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8 }}>
            {weekDays.map(d => {
              const key = fmt(d);
              const items = byDate[key] || [];
              const isToday = key === todayStr;
              const past = isPast(key);
              return (
                <div key={key} style={{ border: `1px solid ${isToday ? "#146356" : "#E3E6E0"}`, borderRadius: 8, padding: 8, minHeight: 300, maxHeight: 340, overflowY: "auto", background: past ? "#FAFAF8" : "#fff" }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: isToday ? "#146356" : (past ? "#9AA39B" : "#5B675F"), marginBottom: 6 }}>
                    {d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" })}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 6 }}>
                    {items.length === 0 && <div style={{ fontSize: 10, color: "#C9CFC7" }}>—</div>}
                    {items.map(r => {
                      const svc = primaryService(r.services, extraServices.major);
                      const ch = CHANNELS.find(c => c.id === r.channel);
                      return (
                        <button key={r.id} onClick={() => setEditingPost(r)} style={{ textAlign: "left", fontSize: 10.5, background: svc.color + "22", color: svc.color, borderRadius: 5, padding: "4px 6px", border: "none" }}>
                          <div style={{ fontWeight: 700 }}>{r.title}</div>
                          <div style={{ fontSize: 9.5, opacity: 0.85 }}>{svc.name} · {ch?.name} · {r.creativeType}</div>
                        </button>
                      );
                    })}
                  </div>
                  {!past && <button onClick={() => setNewModalDate(key)} style={{ fontSize: 10, border: "1px dashed #D8DDD5", background: "transparent", color: "#5B675F", borderRadius: 5, padding: "3px 0", width: "100%" }}>+ Add</button>}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {selectedDay && (
        <div style={overlay} onClick={() => setSelectedDay(null)}>
          <div style={{ ...modal, width: 420 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div className="disp" style={{ fontSize: 16, fontWeight: 600 }}>{new Date(selectedDay + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
              <button onClick={() => setSelectedDay(null)} style={{ border: "none", background: "transparent" }}><X size={18} /></button>
            </div>
            {!isPast(selectedDay) && (
              <button onClick={() => { setNewModalDate(selectedDay); setSelectedDay(null); }} style={{ ...primaryBtn, width: "100%", justifyContent: "center", marginBottom: 12 }}>
                <Plus size={14} /> Add another for this day
              </button>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(byDate[selectedDay] || []).map(r => {
                const ch = CHANNELS.find(c => c.id === r.channel);
                const svc = primaryService(r.services, extraServices.major);
                const pStatus = r.postStatus || "Pending";
                const PIcon = POST_STATUS_ICON[pStatus];
                return (
                  <button key={r.id} onClick={() => { setEditingPost(r); setSelectedDay(null); }} style={{ textAlign: "left", border: "1px solid #E3E6E0", borderRadius: 8, padding: 10, background: "#fff" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: svc.color, flexShrink: 0 }} />
                      <div style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>{r.title}</div>
                      <Maximize2 size={12} color="#9AA39B" />
                    </div>
                    <div style={{ fontSize: 11, color: "#5B675F", marginBottom: 6 }}>{svc.name} · {ch?.name} · {r.creativeType}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: POST_STATUS_COLOR[pStatus] }}>
                      <PIcon size={12} /> {pStatus}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      </>
      )}

      {newModalDate && (
        <SchedulerPostModal
          initialDate={newModalDate}
          captions={captions} setCaptions={setCaptions}
          templates={templates} setTemplates={setTemplates}
          majorServices={majorServices} minorServices={minorServices}
          onClose={() => setNewModalDate(null)}
          onSave={(req) => { setRequests(rs => [...rs, req]); setNewModalDate(null); }}
        />
      )}

      {editingPost && !rescheduling && (
        <PostDetailModal
          post={editingPost}
          captions={captions}
          extraServices={extraServices}
          onClose={() => setEditingPost(null)}
          onStatusChange={(postStatus) => { updatePost(editingPost.id, { postStatus }); setEditingPost(p => ({ ...p, postStatus })); }}
          onProductionStatusChange={(status) => { updatePost(editingPost.id, { status }); setEditingPost(p => ({ ...p, status })); }}
          onReschedule={() => setRescheduling(editingPost)}
          onRemove={() => removePost(editingPost.id)}
        />
      )}

      {rescheduling && (
        <SchedulerPostModal
          editingPost={rescheduling}
          captions={captions} setCaptions={setCaptions}
          templates={templates} setTemplates={setTemplates}
          majorServices={majorServices} minorServices={minorServices}
          onClose={() => { setRescheduling(null); setEditingPost(null); }}
          onSave={(req) => { updatePost(req.id, req); setRescheduling(null); setEditingPost(null); }}
          onRemove={() => { removePost(rescheduling.id); setRescheduling(null); }}
        />
      )}

      {addServiceOpen && (
        <ServiceManagerModal
          majorServices={majorServices} minorServices={minorServices}
          onClose={() => setAddServiceOpen(false)}
          onAdd={addService} onRename={renameService} onDelete={deleteService} onReset={resetServices}
        />
      )}
    </div>
  );
}

function PostDetailModal({ post, captions, extraServices, onClose, onStatusChange, onProductionStatusChange, onReschedule, onRemove }) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [captionCopied, setCaptionCopied] = useState(false);
  const ch = CHANNELS.find(c => c.id === post.channel);
  const svc = primaryService(post.services, extraServices.major);
  const linkedCaption = captions.find(c => c.id === post.linkedCaptionId);
  const hasCaption = !!linkedCaption;
  const hasCreative = !!post.creativeRef;
  const readyLabel = hasCaption && hasCreative ? "Ready to post" : !hasCaption && !hasCreative ? "Needs caption & creative" : !hasCaption ? "Needs caption" : "Needs creative reference";
  const readyColor = hasCaption && hasCreative ? "#146356" : "#C4544A";

  const copyCaption = () => {
    if (!linkedCaption) return;
    const hashtagLine = linkedCaption.hashtags?.length ? `\n\n${linkedCaption.hashtags.map(h => `#${h.replace(/^#/, "")}`).join(" ")}` : "";
    navigator.clipboard?.writeText(linkedCaption.textEn + hashtagLine).then(() => { setCaptionCopied(true); setTimeout(() => setCaptionCopied(false), 1500); });
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={{ ...modal, width: 560 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: svc.color, flexShrink: 0 }} />
            <div className="disp" style={{ fontSize: 19, fontWeight: 600 }}>{post.title}</div>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "transparent" }}><X size={18} /></button>
        </div>
        <div style={{ fontSize: 12, color: "#5B675F", marginBottom: 14 }}>{svc.name} · {ch?.name} · {post.creativeType} · Scheduled for {post.scheduledDate}</div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, background: readyColor + "14", color: readyColor, borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 700, marginBottom: 14 }}>
          <ShieldCheck size={14} /> {readyLabel}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div>
            <label style={label}>Post status</label>
            <select value={post.postStatus || "Pending"} onChange={e => onStatusChange(e.target.value)} style={{ ...inputStyle, width: "100%", color: POST_STATUS_COLOR[post.postStatus || "Pending"], fontWeight: 700 }}>
              {POST_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Production status</label>
            <select value={post.status} onChange={e => onProductionStatusChange(e.target.value)} style={{ ...inputStyle, width: "100%", color: STATUS_COLOR[post.status], fontWeight: 700 }}>
              {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#5B675F", textTransform: "uppercase", letterSpacing: 0.3 }}>Caption</div>
          {linkedCaption && (
            <button onClick={copyCaption} style={{ display: "flex", alignItems: "center", gap: 5, border: "1px solid #D8DDD5", background: captionCopied ? "#146356" : "#fff", color: captionCopied ? "#fff" : "#0E2B27", borderRadius: 7, padding: "4px 10px", fontSize: 11, fontWeight: 600 }}>
              <Copy size={12} /> {captionCopied ? "Copied" : "Copy caption + hashtags"}
            </button>
          )}
        </div>
        {linkedCaption ? (
          <div style={{ fontSize: 12.5, whiteSpace: "pre-wrap", background: "#F5F6F1", borderRadius: 8, padding: 12, marginBottom: 6 }}>{linkedCaption.textEn}</div>
        ) : (
          <div style={{ fontSize: 12, color: "#9AA39B", marginBottom: 16 }}>No caption linked yet — reschedule/edit this post to attach one.</div>
        )}
        {linkedCaption?.hashtags?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 16 }}>
            {linkedCaption.hashtags.map(h => <span key={h} style={{ ...tagStyle, color: "#146356" }}>#{h.replace(/^#/, "")}</span>)}
          </div>
        )}
        {linkedCaption && !linkedCaption.hashtags?.length && <div style={{ marginBottom: 16 }} />}

        <div style={{ fontSize: 11, fontWeight: 700, color: "#5B675F", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.3 }}>Creative reference</div>
        {post.creativeRef ? (
          <a href={post.creativeRef} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#146356", fontWeight: 600, wordBreak: "break-all", display: "block", marginBottom: 20 }}>{post.creativeRef} →</a>
        ) : (
          <div style={{ fontSize: 12, color: "#9AA39B", marginBottom: 20 }}>No reference link attached yet.</div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onReschedule} style={{ ...primaryBtn, flex: 1, justifyContent: "center" }}><Pencil size={13} /> Reschedule / Edit</button>
          {!confirmRemove ? (
            <button onClick={() => setConfirmRemove(true)} style={{ ...primaryBtn, flex: 1, justifyContent: "center", background: "#fff", color: "#C4544A", border: "1px solid #C4544A" }}><Trash2 size={13} /> Remove</button>
          ) : (
            <button onClick={onRemove} style={{ ...primaryBtn, flex: 1, justifyContent: "center", background: "#C4544A" }}>Confirm remove?</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- INTERACTIVE NOTES ---------------------------------- */

const NOTE_COLORS = ["#FFF3B0", "#FFD6D6", "#D6F5E3", "#D6E8FF", "#EAD6FF", "#FFE3D6"];

function NotesBoard({ notes, setNotes, user }) {
  const [adding, setAdding] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [draftColor, setDraftColor] = useState(NOTE_COLORS[0]);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [draftReminder, setDraftReminder] = useState("");

  const addNote = () => {
    if (!draftText.trim()) return;
    setNotes(ns => [...ns, { id: uid(), text: draftText.trim(), color: draftColor, by: user?.email || "", date: localDateStr(new Date()), reminderDate: draftReminder || "" }]);
    setDraftText(""); setDraftColor(NOTE_COLORS[0]); setDraftReminder(""); setAdding(false);
  };
  const saveEdit = (id) => {
    setNotes(ns => ns.map(n => n.id === id ? { ...n, text: editText.trim() } : n));
    setEditingId(null);
  };
  const removeNote = (id) => { setNotes(ns => ns.filter(n => n.id !== id)); setConfirmDeleteId(null); };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <button onClick={() => setAdding(v => !v)} style={primaryBtn}><Plus size={15} /> New Note</button>
      </div>

      {adding && (
        <Card style={{ marginBottom: 16 }}>
          <RichCaptionField value={draftText} onChange={setDraftText} placeholder="Write a note for the team..." rows={3} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "#5B675F", fontWeight: 600 }}>Color:</span>
            {NOTE_COLORS.map(c => (
              <button key={c} onClick={() => setDraftColor(c)} style={{
                width: 20, height: 20, borderRadius: "50%", background: c, border: draftColor === c ? "2px solid #0E2B27" : "1px solid #D8DDD5", padding: 0,
              }} />
            ))}
            <span style={{ fontSize: 11, color: "#5B675F", fontWeight: 600, marginLeft: 8 }}>Remind on:</span>
            <input type="date" value={draftReminder} onChange={e => setDraftReminder(e.target.value)} style={{ ...inputStyle, fontSize: 11, padding: "4px 8px" }} />
            <div style={{ flex: 1 }} />
            <button onClick={addNote} disabled={!draftText.trim()} style={{ ...primaryBtn, opacity: !draftText.trim() ? 0.5 : 1 }}>Save Note</button>
            <button onClick={() => setAdding(false)} style={{ ...pillBtn(false), padding: "8px 14px" }}>Cancel</button>
          </div>
        </Card>
      )}

      {notes.length === 0 ? (
        <Card><Empty text="No notes yet. Add one above — great for quick reminders, ideas, or things to flag for the team." /></Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          {[...notes].reverse().map(n => (
            <div key={n.id} style={{ background: n.color, borderRadius: 10, padding: 14, minHeight: 130, display: "flex", flexDirection: "column", boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}>
              {editingId === n.id ? (
                <>
                  <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={4} style={{ ...inputStyle, background: "rgba(255,255,255,0.6)", border: "1px solid rgba(0,0,0,0.15)", width: "100%", resize: "vertical", fontSize: 12.5, marginBottom: 8, flex: 1 }} />
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => saveEdit(n.id)} style={{ border: "none", background: "#0E2B27", color: "#fff", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 600 }}>Save</button>
                    <button onClick={() => setEditingId(null)} style={{ border: "none", background: "transparent", color: "#0E2B27", fontSize: 11, fontWeight: 600 }}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 12.5, color: "#2A2A2A", whiteSpace: "pre-wrap", flex: 1, marginBottom: 10 }}>{n.text}</div>
                  {n.reminderDate && (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 9.5, fontWeight: 700, color: "#0E2B27", background: "rgba(255,255,255,0.5)", borderRadius: 8, padding: "2px 7px", marginBottom: 8, width: "fit-content" }}>
                      <Bell size={9} /> {n.reminderDate}
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 9.5, color: "rgba(0,0,0,0.5)" }}>{n.by && `${n.by.split("@")[0]} · `}{n.date}</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => { setEditingId(n.id); setEditText(n.text); }} style={{ border: "none", background: "transparent", color: "rgba(0,0,0,0.55)" }}><Pencil size={12} /></button>
                      {confirmDeleteId === n.id ? (
                        <button onClick={() => removeNote(n.id)} style={{ border: "none", background: "transparent", color: "#C4544A", fontSize: 10, fontWeight: 700 }}>Confirm?</button>
                      ) : (
                        <button onClick={() => setConfirmDeleteId(n.id)} style={{ border: "none", background: "transparent", color: "rgba(0,0,0,0.55)" }}><Trash2 size={12} /></button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ServiceManagerModal({ majorServices, minorServices, onClose, onAdd, onRename, onDelete, onReset }) {
  const [type, setType] = useState("major");
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState(null); // service name currently being renamed
  const [editValue, setEditValue] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const list = type === "major" ? majorServices : minorServices;

  const startEdit = (s) => { setEditing(s); setEditValue(s); };
  const saveEdit = () => { onRename(type, editing, editValue.trim()); setEditing(null); };

  return (
    <div style={overlay}>
      <div style={{ ...modal, width: 460 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div className="disp" style={{ fontSize: 18, fontWeight: 600 }}>Manage Services <span style={{ fontSize: 11, fontWeight: 600, color: "#E8A33D", background: "#E8A33D1A", padding: "2px 8px", borderRadius: 10, marginLeft: 6 }}>Admin</span></div>
          <button onClick={onClose} style={{ border: "none", background: "transparent" }}><X size={18} /></button>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          <button onClick={() => { setType("major"); setEditing(null); }} style={pillBtn(type === "major")}>Major ({majorServices.length})</button>
          <button onClick={() => { setType("minor"); setEditing(null); }} style={pillBtn(type === "minor")}>Minor ({minorServices.length})</button>
        </div>

        <div style={{ maxHeight: 260, overflowY: "auto", border: "1px solid #E3E6E0", borderRadius: 8, marginBottom: 12 }}>
          {list.map(s => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", borderBottom: "1px solid #EEF0EC" }}>
              {editing === s ? (
                <>
                  <input value={editValue} onChange={e => setEditValue(e.target.value)} style={{ ...inputStyle, flex: 1, fontSize: 12.5, padding: "5px 8px" }} autoFocus />
                  <button onClick={saveEdit} style={{ border: "none", background: "transparent", color: "#146356", fontSize: 11, fontWeight: 700 }}>Save</button>
                  <button onClick={() => setEditing(null)} style={{ border: "none", background: "transparent", color: "#9AA39B", fontSize: 11, fontWeight: 700 }}>Cancel</button>
                </>
              ) : (
                <>
                  <div style={{ flex: 1, fontSize: 12.5 }}>{s}</div>
                  <button onClick={() => startEdit(s)} style={{ border: "none", background: "transparent", color: "#146356" }}><Pencil size={12} /></button>
                  {confirmDelete === s ? (
                    <button onClick={() => { onDelete(type, s); setConfirmDelete(null); }} style={{ border: "none", background: "transparent", color: "#C4544A", fontSize: 10.5, fontWeight: 700 }}>Confirm?</button>
                  ) : (
                    <button onClick={() => setConfirmDelete(s)} style={{ border: "none", background: "transparent", color: "#C4544A" }}><Trash2 size={12} /></button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10.5, color: "#9AA39B", marginBottom: 14 }}>Renaming updates every existing request, caption, and target that uses this service. Deleting only removes it from future pickers — existing history keeps the old tag as text.</div>

        <label style={label}>Add new {type} service</label>
        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. NCLEX New Zealand" style={{ ...inputStyle, flex: 1 }} />
          <button
            disabled={!newName.trim()}
            onClick={() => { onAdd(type, newName.trim()); setNewName(""); }}
            style={{ ...primaryBtn, opacity: !newName.trim() ? 0.5 : 1 }}
          ><Plus size={14} /></button>
        </div>

        <div style={{ borderTop: "1px solid #E3E6E0", paddingTop: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#5B675F", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.3 }}>Reset</div>
          <div style={{ fontSize: 10.5, color: "#9AA39B", marginBottom: 10 }}>
            Replaces the entire Major and Minor lists with the official current set (11 Major, 21 Minor) — used everywhere: Requests, Scheduler, and Service Coverage. Any custom services you've added that aren't on the official list will be removed from future pickers; existing history keeps its tags as text either way.
          </div>
          {!confirmReset ? (
            <button onClick={() => setConfirmReset(true)} style={{ ...primaryBtn, width: "100%", justifyContent: "center", background: "#fff", color: "#C4544A", border: "1px solid #C4544A" }}>
              Reset Services to Official List
            </button>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setConfirmReset(false)} style={{ ...pillBtn(false), flex: 1, padding: "10px 0", textAlign: "center" }}>Cancel</button>
              <button onClick={() => { onReset(); setConfirmReset(false); }} style={{ ...primaryBtn, flex: 1, justifyContent: "center", background: "#C4544A" }}>Yes, Reset Now</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- SCHEDULER POST MODAL (with caption container) ---------------------------------- */

function SchedulerPostModal({ onClose, onSave, onRemove, initialDate, editingPost, captions, setCaptions, templates, setTemplates, majorServices = MAJOR_SERVICES, minorServices = MINOR_SERVICES }) {
  const todayStr = localDateStr(new Date());
  const [title, setTitle] = useState(editingPost?.title || "");
  const [serviceType, setServiceType] = useState("major");
  const [services, setServices] = useState(editingPost?.services || []);
  const [creativeType, setCreativeType] = useState(editingPost?.creativeType || CREATIVE_TYPES[0]);
  const [channel, setChannel] = useState(editingPost?.channel || CHANNELS[0].id);
  const [scheduledDate, setScheduledDate] = useState(editingPost?.scheduledDate || initialDate || todayStr);
  const [creativeRef, setCreativeRef] = useState(editingPost?.creativeRef || "");
  const [postStatus, setPostStatus] = useState(editingPost?.postStatus || "Pending");
  const [confirmRemove, setConfirmRemove] = useState(false);
  const list = serviceType === "major" ? majorServices : minorServices;

  const [linkedCaptionId, setLinkedCaptionId] = useState(editingPost?.linkedCaptionId || "");

  const toggleService = (s) => setServices(cur => cur.includes(s) ? cur.filter(x => x !== s) : [...cur, s]);

  const handleDateChange = (val) => {
    if (editingPost && val !== editingPost.scheduledDate && postStatus === "Pending") setPostStatus("Rescheduled");
    setScheduledDate(val);
  };

  const save = () => {
    onSave({
      id: editingPost?.id || uid(), title, services, creativeType, channel, scheduledDate, linkedCaptionId, creativeRef, postStatus,
      status: editingPost?.status || "Pending",
      dateLogged: editingPost?.dateLogged || localDateStr(new Date()),
      origin: editingPost?.origin || "scheduler",
    });
  };

  return (
    <div style={overlay}>
      <div style={{ ...modal, width: 560 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div className="disp" style={{ fontSize: 18, fontWeight: 600 }}>{editingPost ? "Edit Scheduled Post" : "New Scheduled Post"}</div>
          <button onClick={onClose} style={{ border: "none", background: "transparent" }}><X size={18} /></button>
        </div>

        <label style={label}>Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. May PNLE promo carousel" style={{ ...inputStyle, width: "100%", marginBottom: 12 }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div>
            <label style={label}>Scheduled date</label>
            <input type="date" min={todayStr} value={scheduledDate} onChange={e => handleDateChange(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
          </div>
          <div>
            <label style={label}>Channel</label>
            <select value={channel} onChange={e => setChannel(e.target.value)} style={{ ...inputStyle, width: "100%" }}>{CHANNELS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div>
            <label style={label}>Creative type</label>
            <select value={creativeType} onChange={e => setCreativeType(e.target.value)} style={{ ...inputStyle, width: "100%" }}>
              {CREATIVE_TYPES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          {editingPost && (
            <div>
              <label style={label}>Post status</label>
              <select value={postStatus} onChange={e => setPostStatus(e.target.value)} style={{ ...inputStyle, width: "100%", color: POST_STATUS_COLOR[postStatus], fontWeight: 700 }}>
                {POST_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
        </div>

        <label style={label}>Service tags</label>
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          <button onClick={() => setServiceType("major")} style={pillBtn(serviceType === "major")}>Major</button>
          <button onClick={() => setServiceType("minor")} style={pillBtn(serviceType === "minor")}>Minor</button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 90, overflowY: "auto", border: "1px solid #E3E6E0", borderRadius: 8, padding: 8, marginBottom: 14 }}>
          {list.map(s => <button key={s} onClick={() => toggleService(s)} style={pillBtn(services.includes(s))}>{s}</button>)}
          <OtherTagPicker services={services} setServices={setServices} />
        </div>

        <CaptionContainer
          captions={captions} setCaptions={setCaptions} templates={templates} setTemplates={setTemplates}
          linkedCaptionId={linkedCaptionId} setLinkedCaptionId={setLinkedCaptionId}
          defaults={{ services, creativeType, channel }}
        />

        <label style={{ ...label, marginTop: 14 }}>Creative/image reference link (optional)</label>
        <input value={creativeRef} onChange={e => setCreativeRef(e.target.value)} placeholder="Paste a link to the creative file for now" style={{ ...inputStyle, width: "100%", marginBottom: 20 }} />

        <div style={{ display: "flex", gap: 8 }}>
          <button
            disabled={!title || services.length === 0}
            onClick={save}
            style={{ ...primaryBtn, flex: 1, justifyContent: "center", opacity: (!title || services.length === 0) ? 0.5 : 1 }}
          >{editingPost ? "Save Changes" : "Save Scheduled Post"}</button>
          {editingPost && onRemove && (
            !confirmRemove ? (
              <button onClick={() => setConfirmRemove(true)} style={{ ...primaryBtn, background: "#fff", color: "#C4544A", border: "1px solid #C4544A" }}><Trash2 size={14} /></button>
            ) : (
              <button onClick={onRemove} style={{ ...primaryBtn, background: "#C4544A" }}>Confirm?</button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function CaptionContainer({ captions, setCaptions, templates, setTemplates, linkedCaptionId, setLinkedCaptionId, defaults }) {
  const [mode, setMode] = useState("library");
  const [search, setSearch] = useState("");
  const [draftEn, setDraftEn] = useState("");
  const [draftFil, setDraftFil] = useState("");
  const [draftHashtags, setDraftHashtags] = useState("");
  const [editingCaptionId, setEditingCaptionId] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  const [editingLinked, setEditingLinked] = useState(false);
  const [templateEditTarget, setTemplateEditTarget] = useState(null);
  const linked = captions.find(c => c.id === linkedCaptionId);

  const filteredLib = captions.filter(c => c.brief.toLowerCase().includes(search.toLowerCase()) || c.textEn.toLowerCase().includes(search.toLowerCase()));

  const applyTemplate = (id) => {
    const t = templates.find(x => x.id === id);
    if (!t) return;
    setDraftEn(t.textEn); setDraftFil(t.textFil || ""); setDraftHashtags((t.hashtags || []).join(", "));
    setEditingCaptionId(null);
    setReviewing(true);
  };

  const openLibraryForEdit = (c) => {
    setDraftEn(c.textEn); setDraftFil(c.textFil || ""); setDraftHashtags((c.hashtags || []).join(", "));
    setEditingCaptionId(c.id);
    setReviewing(true);
  };

  const attach = (updateOriginal) => {
    const hashtags = draftHashtags.split(",").map(h => h.trim()).filter(Boolean);
    if (updateOriginal && editingCaptionId) {
      setCaptions(cs => cs.map(c => c.id === editingCaptionId ? { ...c, textEn: draftEn, textFil: draftFil, hashtags } : c));
      setLinkedCaptionId(editingCaptionId);
    } else {
      const newCap = {
        id: uid(), brief: defaults.services[0] ? `${defaults.services[0]} — ${defaults.creativeType}` : defaults.creativeType,
        services: defaults.services, creativeType: defaults.creativeType, channel: defaults.channel, campaign: "",
        textEn: draftEn, textFil: draftFil, hashtags, status: "Draft", dateCreated: localDateStr(new Date()),
      };
      setCaptions(cs => [...cs, newCap]);
      setLinkedCaptionId(newCap.id);
    }
    setDraftEn(""); setDraftFil(""); setDraftHashtags(""); setReviewing(false); setEditingCaptionId(null);
  };

  const saveLinkedEdit = () => {
    setCaptions(cs => cs.map(c => c.id === linked.id ? { ...c, textEn: draftEn, textFil: draftFil, hashtags: draftHashtags.split(",").map(h => h.trim()).filter(Boolean) } : c));
    setEditingLinked(false);
  };

  return (
    <div style={{ background: "#F5F6F1", border: "1px solid #E3E6E0", borderRadius: 9, padding: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Caption</div>

      {linked && !editingLinked ? (
        <div style={{ background: "#fff", border: "1px solid #D8DDD5", borderRadius: 7, padding: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700 }}>{linked.brief}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setDraftEn(linked.textEn); setDraftFil(linked.textFil || ""); setDraftHashtags((linked.hashtags || []).join(", ")); setEditingLinked(true); }} style={{ border: "none", background: "transparent", color: "#146356" }}><Pencil size={12} /></button>
              <button onClick={() => setLinkedCaptionId("")} style={{ border: "none", background: "transparent", color: "#C4544A" }}><X size={13} /></button>
            </div>
          </div>
          <div style={{ fontSize: 11.5, whiteSpace: "pre-wrap", color: "#0E2B27" }}>{linked.textEn}</div>
        </div>
      ) : linked && editingLinked ? (
        <div style={{ background: "#fff", border: "1px solid #D8DDD5", borderRadius: 7, padding: 10 }}>
          <RichCaptionField value={draftEn} onChange={setDraftEn} placeholder="Caption (English)" rows={3} />
          <textarea value={draftFil} onChange={e => setDraftFil(e.target.value)} placeholder="Caption (Filipino) — optional" rows={2} style={{ ...inputStyle, width: "100%", marginBottom: 6, resize: "vertical", fontSize: 12 }} />
          <input value={draftHashtags} onChange={e => setDraftHashtags(e.target.value)} placeholder="Hashtags, comma-separated" style={{ ...inputStyle, width: "100%", marginBottom: 8, fontSize: 12 }} />
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={saveLinkedEdit} style={{ ...primaryBtn, fontSize: 12 }}>Save changes</button>
            <button onClick={() => setEditingLinked(false)} style={{ ...pillBtn(false), padding: "6px 12px" }}>Cancel</button>
          </div>
        </div>
      ) : reviewing ? (
        <div style={{ background: "#fff", border: "1px solid #D8DDD5", borderRadius: 7, padding: 10 }}>
          <RichCaptionField value={draftEn} onChange={setDraftEn} placeholder="Caption (English)" rows={3} />
          <textarea value={draftFil} onChange={e => setDraftFil(e.target.value)} placeholder="Caption (Filipino) — optional" rows={2} style={{ ...inputStyle, width: "100%", marginBottom: 6, resize: "vertical", fontSize: 12 }} />
          <input value={draftHashtags} onChange={e => setDraftHashtags(e.target.value)} placeholder="Hashtags, comma-separated" style={{ ...inputStyle, width: "100%", marginBottom: 8, fontSize: 12 }} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {editingCaptionId && <button onClick={() => attach(true)} disabled={!draftEn} style={{ ...primaryBtn, fontSize: 12, opacity: !draftEn ? 0.5 : 1 }}>Attach & update original</button>}
            <button onClick={() => attach(false)} disabled={!draftEn} style={{ ...primaryBtn, fontSize: 12, opacity: !draftEn ? 0.5 : 1, background: editingCaptionId ? "#fff" : "#146356", color: editingCaptionId ? "#146356" : "#fff", border: editingCaptionId ? "1px solid #146356" : "none" }}>
              {editingCaptionId ? "Attach as new copy" : "Attach this caption"}
            </button>
            <button onClick={() => { setReviewing(false); setEditingCaptionId(null); }} style={{ ...pillBtn(false), padding: "6px 12px" }}>Cancel</button>
          </div>
          <div style={{ fontSize: 10, color: "#9AA39B", marginTop: 5 }}>{editingCaptionId ? "Editing a library caption — choose whether to overwrite it or save a separate copy." : "Saves to the Caption Library too, as a Draft."}</div>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <button onClick={() => setMode("library")} style={pillBtn(mode === "library")}><FileText size={11} style={{ verticalAlign: -1, marginRight: 3 }} />Library</button>
            <button onClick={() => setMode("template")} style={pillBtn(mode === "template")}><FileText size={11} style={{ verticalAlign: -1, marginRight: 3 }} />Template</button>
            <button onClick={() => setMode("write")} style={pillBtn(mode === "write")}>Write new</button>
          </div>

          {mode === "library" && (
            <>
              <div style={{ position: "relative", marginBottom: 6 }}>
                <Search size={12} style={{ position: "absolute", left: 8, top: 8, color: "#9AA39B" }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search captions..." style={{ ...inputStyle, paddingLeft: 24, width: "100%", fontSize: 12 }} />
              </div>
              <div style={{ maxHeight: 130, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                {filteredLib.length === 0 && <div style={{ fontSize: 11, color: "#9AA39B", padding: "6px 0" }}>No captions found — try Template or Write new.</div>}
                {filteredLib.map(c => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <button onClick={() => { setLinkedCaptionId(c.id); }} style={{ flex: 1, textAlign: "left", background: "#fff", border: "1px solid #D8DDD5", borderRadius: 6, padding: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 700 }}>{c.brief}</div>
                      <div style={{ fontSize: 10.5, color: "#5B675F", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.textEn}</div>
                    </button>
                    <button onClick={() => openLibraryForEdit(c)} title="Edit before using" style={{ border: "1px solid #D8DDD5", background: "#fff", borderRadius: 6, padding: 8, color: "#146356" }}><Pencil size={12} /></button>
                  </div>
                ))}
              </div>
            </>
          )}

          {(mode === "template" || mode === "write") && (
            <>
              {mode === "template" && (
                <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                  <select onChange={e => e.target.value && applyTemplate(e.target.value)} defaultValue="" style={{ ...inputStyle, flex: 1, fontSize: 12 }}>
                    <option value="">Choose a template…</option>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <button type="button" onClick={() => setTemplateEditTarget({ id: uid(), name: "", textEn: "", textFil: "", hashtags: [] })} title="New template" style={{ border: "1px solid #D8DDD5", background: "#fff", borderRadius: 6, padding: "0 8px", color: "#146356" }}><Plus size={13} /></button>
                </div>
              )}
              <RichCaptionField value={draftEn} onChange={setDraftEn} placeholder="Caption (English)" rows={3} />
              <textarea value={draftFil} onChange={e => setDraftFil(e.target.value)} placeholder="Caption (Filipino) — optional" rows={2} style={{ ...inputStyle, width: "100%", marginBottom: 6, resize: "vertical", fontSize: 12 }} />
              <input value={draftHashtags} onChange={e => setDraftHashtags(e.target.value)} placeholder="Hashtags, comma-separated" style={{ ...inputStyle, width: "100%", marginBottom: 8, fontSize: 12 }} />
              <button onClick={() => attach(false)} disabled={!draftEn} style={{ ...primaryBtn, opacity: !draftEn ? 0.5 : 1, fontSize: 12 }}>
                <Plus size={12} /> Attach this caption
              </button>
              <div style={{ fontSize: 10, color: "#9AA39B", marginTop: 5 }}>Saves to the Caption Library too, as a Draft.</div>
            </>
          )}
        </>
      )}

      {templateEditTarget && (
        <TemplateEditModal
          template={templateEditTarget}
          onClose={() => setTemplateEditTarget(null)}
          onSave={(t) => {
            setTemplates(ts => ts.some(x => x.id === t.id) ? ts.map(x => x.id === t.id ? t : x) : [...ts, t]);
            setTemplateEditTarget(null);
          }}
        />
      )}
    </div>
  );
}

function TemplateEditModal({ template, onClose, onSave }) {
  const [name, setName] = useState(template.name);
  const [textEn, setTextEn] = useState(template.textEn);
  const [textFil, setTextFil] = useState(template.textFil || "");
  const [hashtagsInput, setHashtagsInput] = useState((template.hashtags || []).join(", "));
  const isNew = !template.name && !template.textEn;

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div className="disp" style={{ fontSize: 18, fontWeight: 600 }}>{isNew ? "New Template" : "Edit Template"}</div>
          <button onClick={onClose} style={{ border: "none", background: "transparent" }}><X size={18} /></button>
        </div>
        <label style={label}>Template name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Weekly Trivia Format" style={{ ...inputStyle, width: "100%", marginBottom: 12 }} />
        <label style={label}>Caption text — use {"{Placeholders}"} for parts that change</label>
        <RichCaptionField value={textEn} onChange={setTextEn} placeholder={"e.g. It's {ServiceName} trivia day! {CTA}"} rows={4} />
        <label style={label}>Filipino version (optional)</label>
        <textarea value={textFil} onChange={e => setTextFil(e.target.value)} rows={3} style={{ ...inputStyle, width: "100%", marginBottom: 12, resize: "vertical" }} />
        <label style={label}><Hash size={11} style={{ verticalAlign: -1 }} /> Default hashtags (comma-separated)</label>
        <input value={hashtagsInput} onChange={e => setHashtagsInput(e.target.value)} style={{ ...inputStyle, width: "100%", marginBottom: 20 }} />
        <button
          disabled={!name || !textEn}
          onClick={() => onSave({ id: template.id, name, textEn, textFil, hashtags: hashtagsInput.split(",").map(h => h.trim()).filter(Boolean) })}
          style={{ ...primaryBtn, width: "100%", justifyContent: "center", opacity: (!name || !textEn) ? 0.5 : 1 }}
        >{isNew ? "Save Template" : "Save Changes"}</button>
      </div>
    </div>
  );
}


/* ---------------------------------- REPORTS ---------------------------------- */

function Reports({ requests, channelStats, targets, captions, events = [], majorServices, minorServices, allServicesList, extraServices, setExtraServices, isAdmin, setTab }) {
  const [coverageModalOpen, setCoverageModalOpen] = useState(false);
  const [periodType, setPeriodType] = useState("month");
  const [cursor, setCursor] = useState(new Date());
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [focusChannel, setFocusChannel] = useState("all");

  const { start, end, label } = useMemo(() => getReportRange(periodType, cursor, customStart, customEnd), [periodType, cursor, customStart, customEnd]);

  const shift = (amt) => setCursor(c => {
    const d = new Date(c);
    if (periodType === "week") d.setDate(d.getDate() + amt * 7);
    else if (periodType === "quarter") d.setMonth(d.getMonth() + amt * 3);
    else d.setMonth(d.getMonth() + amt);
    return d;
  });

  const requestsInRange = useMemo(() => requests.filter(r => r.dateLogged >= start && r.dateLogged <= end), [requests, start, end]);
  // Coverage counts a service as covered only once something for it has actually been
  // POSTED (via the Scheduler, status = "Posted") within the report range — not just
  // requested. Uses scheduledDate, not dateLogged, since "covered" means "went out."
  const postedInRange = useMemo(() => requests.filter(r => r.scheduledDate && r.scheduledDate >= start && r.scheduledDate <= end && r.postStatus === "Posted"), [requests, start, end]);
  const eventsInRange = useMemo(() => events.filter(e => e.eventDate >= start && e.eventDate <= end), [events, start, end]);
  const eventsByService = useMemo(() => {
    const counts = {};
    eventsInRange.forEach(e => e.services.forEach(s => { counts[s] = (counts[s] || 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count }));
  }, [eventsInRange]);
  const eventsByType = useMemo(() => {
    const counts = {}; const ratings = {};
    eventsInRange.forEach(e => {
      const t = e.eventType === "Other" ? (e.customEventType || "Other") : e.eventType;
      counts[t] = (counts[t] || 0) + 1;
      const r = eventRating(e);
      if (r !== null) { ratings[t] = ratings[t] || []; ratings[t].push(r); }
    });
    return Object.entries(counts).map(([name, count]) => ({
      name, count,
      avgRating: ratings[name]?.length ? ratings[name].reduce((s, r) => s + r, 0) / ratings[name].length : null,
    })).sort((a, b) => b.count - a.count);
  }, [eventsInRange]);
  const cumulativeEventRating = useMemo(() => {
    const rated = eventsInRange.map(eventRating).filter(r => r !== null);
    return rated.length ? rated.reduce((s, r) => s + r, 0) / rated.length : null;
  }, [eventsInRange]);
  const topEvents = useMemo(() =>
    [...eventsInRange].map(e => ({ ...e, rating: eventRating(e) })).filter(e => e.rating !== null).sort((a, b) => b.rating - a.rating).slice(0, 5)
  , [eventsInRange]);

  const scheduledInRange = useMemo(() => requests.filter(r => r.scheduledDate && r.scheduledDate >= start && r.scheduledDate <= end), [requests, start, end]);

  const totalRequests = requestsInRange.length;
  const completedCount = requestsInRange.filter(r => r.status === "Completed").length;
  const completionRate = totalRequests ? Math.round((completedCount / totalRequests) * 100) : 0;

  const postStatusCounts = useMemo(() => {
    const counts = {}; POST_STATUSES.forEach(s => { counts[s] = 0; });
    scheduledInRange.forEach(r => { const s = r.postStatus || "Pending"; if (counts[s] !== undefined) counts[s] += 1; });
    return counts;
  }, [scheduledInRange]);

  const byService = useMemo(() => {
    const counts = {};
    requestsInRange.forEach(r => r.services.forEach(s => { counts[s] = (counts[s] || 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count }));
  }, [requestsInRange]);

  const byCreative = useMemo(() => {
    const counts = {};
    requestsInRange.forEach(r => { counts[r.creativeType] = (counts[r.creativeType] || 0) + 1; });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [requestsInRange]);

  const byChannel = useMemo(() => {
    const counts = {};
    requestsInRange.forEach(r => { const name = CHANNELS.find(c => c.id === r.channel)?.name; if (name) counts[name] = (counts[name] || 0) + 1; });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [requestsInRange]);

  const byDept = useMemo(() => {
    const counts = {};
    requestsInRange.forEach(r => { if (r.dept) counts[r.dept] = (counts[r.dept] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [requestsInRange]);

  const byPriority = useMemo(() => {
    const counts = {};
    requestsInRange.forEach(r => { if (r.priority) counts[r.priority] = (counts[r.priority] || 0) + 1; });
    return PRIORITIES.map(p => ({ name: p, count: counts[p] || 0 })).filter(p => p.count > 0);
  }, [requestsInRange]);

  const trackedServices = (extraServices?.coverageTracked?.length ? extraServices.coverageTracked : allServicesList)
    .filter(s => allServicesList.includes(s));

  const coverage = useMemo(() => {
    const counts = {}; trackedServices.forEach(s => { counts[s] = 0; });
    postedInRange.forEach(r => r.services.forEach(s => { if (counts[s] !== undefined) counts[s] += 1; }));
    const list = Object.entries(counts).map(([name, count]) => ({ name, count }));
    return { flagged: list.filter(s => s.count === 0).sort((a, b) => a.name.localeCompare(b.name)), covered: list.filter(s => s.count > 0).sort((a, b) => b.count - a.count), total: list.length };
  }, [postedInRange, trackedServices]);

  const channelPerf = useMemo(() => CHANNELS.map(ch => {
    const rows = (channelStats[ch.id] || []).filter(r => r.month >= start.slice(0, 7) && r.month <= end.slice(0, 7)).sort((a, b) => a.month.localeCompare(b.month));
    const latest = rows[rows.length - 1];
    const earliest = rows[0];
    return { channel: ch, latest, earliest, growthRating: latest ? rate(ch.platform, "growth", latest.growthPct) : null, engRating: latest ? rate(ch.platform, "engagement", latest.engagement30) : null };
  }), [channelStats, start, end]);

  const withData = channelPerf.filter(c => c.latest);
  // Cumulative growth = combined follower change across ALL channels ÷ combined starting followers —
  // a follower-weighted total, not a plain average of each channel's % (which would let a small
  // channel's swing count as much as a large one's).
  const totalStartFollowers = withData.reduce((s, c) => s + (c.earliest?.followers ?? c.latest.followers), 0);
  const totalEndFollowers = withData.reduce((s, c) => s + c.latest.followers, 0);
  const cumulativeGrowth = totalStartFollowers > 0 ? ((totalEndFollowers - totalStartFollowers) / totalStartFollowers) * 100 : null;
  // Engagement stays a simple average for now — a true weighted figure needs raw engaged-count
  // data per channel, which isn't currently logged (only the rate is).
  const avgEngagement = withData.length ? (withData.reduce((s, c) => s + c.latest.engagement30, 0) / withData.length) : null;

  const targetAchievement = useMemo(() => targets.map(t => {
    const actual = requestsInRange.filter(r => r.status === "Completed" && (t.scope === "channel" ? r.channel === t.target : r.services.includes(t.target))).length;
    return { ...t, actual };
  }), [targets, requestsInRange]);

  return (
    <div className="report-page">
      <Header title="Reports" sub="Consolidated stats across the app, by date range" action={
        <button className="no-print" onClick={() => window.print()} style={primaryBtn}><Printer size={15} /> Print / Export PDF</button>
      } />

      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {["week", "month", "quarter", "custom"].map(p => (
            <button key={p} onClick={() => setPeriodType(p)} style={pillBtn(periodType === p)}>{p[0].toUpperCase() + p.slice(1)}</button>
          ))}
        </div>
        {periodType === "custom" ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} style={inputStyle} />
            <span style={{ fontSize: 12, color: "#5B675F" }}>to</span>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} style={inputStyle} />
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => shift(-1)} style={navBtn}><ChevronLeft size={16} /></button>
            <div style={{ fontSize: 13, fontWeight: 700, minWidth: 140, textAlign: "center" }}>{label}</div>
            <button onClick={() => shift(1)} style={navBtn}><ChevronRight size={16} /></button>
          </div>
        )}
      </div>

      <div style={{ fontSize: 11, color: "#9AA39B", marginBottom: 14 }} className="no-print">Reporting period: {start} to {end}</div>

      {/* Executive summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 18 }}>
        <StatCard label="Total Requests" value={totalRequests} />
        <StatCard label="Completion Rate" value={`${completionRate}%`} accent={completionRate >= 70 ? "#146356" : "#E8A33D"} />
        <StatCard label="Cumulative Growth (All Channels)" value={cumulativeGrowth === null ? "—" : `${cumulativeGrowth.toFixed(2)}%`} sub="Follower-weighted, not a simple average" />
        <StatCard label="Avg. Engagement (Simple Avg.)" value={avgEngagement === null ? "—" : `${avgEngagement.toFixed(2)}%`} />
      </div>

      <Card title="Channel Performance" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <select value={focusChannel} onChange={e => setFocusChannel(e.target.value)} style={{ ...inputStyle, width: 220 }}>
            <option value="all">All Channels (cumulative)</option>
            {CHANNELS.map(c => <option key={c.id} value={c.id}>{c.name} (individual)</option>)}
          </select>
        </div>

        {focusChannel === "all" ? (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead><tr style={{ textAlign: "left", color: "#5B675F", borderBottom: "1px solid #E3E6E0" }}>
              <th style={th}>Channel</th><th style={th}>Followers</th><th style={th}>Growth</th><th style={th}>Rating</th><th style={th}>Engagement</th><th style={th}>Rating</th>
            </tr></thead>
            <tbody>
              {channelPerf.map(({ channel, latest, growthRating, engRating }) => (
                <tr key={channel.id} style={{ borderBottom: "1px solid #EEF0EC" }}>
                  <td style={td}><div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 7, height: 7, borderRadius: "50%", background: channel.color }} />{channel.name}</div></td>
                  {latest ? (
                    <>
                      <td style={td} className="mono">{Number(latest.followers).toLocaleString()}</td>
                      <td style={td} className="mono">{latest.growthPct.toFixed(2)}%</td>
                      <td style={td}><RatingBadge label={growthRating} /></td>
                      <td style={td} className="mono">{latest.engagement30}%</td>
                      <td style={td}><RatingBadge label={engRating} /></td>
                    </>
                  ) : <td colSpan={5} style={{ ...td, color: "#9AA39B" }}>No stats logged for this period</td>}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          (() => {
            const ch = CHANNELS.find(c => c.id === focusChannel);
            const rows = (channelStats[focusChannel] || []).filter(r => r.month >= start.slice(0, 7) && r.month <= end.slice(0, 7)).sort((a, b) => a.month.localeCompare(b.month)).map(r => ({ ...r, label: monthLabel(r.month) }));
            if (rows.length === 0) return <Empty text={`No stats logged for ${ch?.name} in this period.`} />;
            const latest = rows[rows.length - 1];
            return (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 16 }}>
                  <StatCard label="Followers" value={Number(latest.followers).toLocaleString()} />
                  <StatCard label="Growth Rate" value={`${latest.growthPct.toFixed(2)}%`} badge={rate(ch.platform, "growth", latest.growthPct)} badgeColor={RATING_COLOR[rate(ch.platform, "growth", latest.growthPct)]} />
                  <StatCard label="Engagement Rate" value={`${latest.engagement30}%`} badge={rate(ch.platform, "engagement", latest.engagement30)} badgeColor={RATING_COLOR[rate(ch.platform, "engagement", latest.engagement30)]} />
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={rows}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E3E6E0" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#5B675F" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#5B675F" }} domain={["auto", "auto"]} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #D8DDD5" }} formatter={v => Number(v).toLocaleString()} />
                    <Line type="monotone" dataKey="followers" name="Followers" stroke={ch.color} strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </>
            );
          })()
        )}
      </Card>

      <Card title="Post Status Summary" style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10 }}>
          {POST_STATUSES.map(s => {
            const Icon = POST_STATUS_ICON[s];
            return (
              <div key={s} style={{ border: "1px solid #E3E6E0", borderRadius: 8, padding: "8px 10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, color: POST_STATUS_COLOR[s], fontSize: 10.5, fontWeight: 700, marginBottom: 3 }}><Icon size={12} /> {s}</div>
                <div className="mono" style={{ fontSize: 18, fontWeight: 600 }}>{postStatusCounts[s]}</div>
              </div>
            );
          })}
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <FlexibleChart title="Requests per Service" data={byService} color="#146356" empty="No requests logged in this period." />
        <FlexibleChart title="Requests by Creative Type" data={byCreative} color="#E8A33D" empty="No requests logged in this period." defaultType="pie" />
      </div>

      <div style={{ marginBottom: 16 }}>
        <FlexibleChart title="Requests per Channel" data={byChannel} color="#3E7CB1" empty="No requests logged in this period." />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card title="By Department">
          {byDept.length === 0 ? <Empty text="No department data in this period." /> : byDept.map(([name, count]) => (
            <div key={name} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "6px 0", borderBottom: "1px solid #F2F3F0" }}>
              <span>{name}</span><span className="mono" style={{ fontWeight: 600 }}>{count}</span>
            </div>
          ))}
        </Card>
        <Card title="By Priority">
          {byPriority.length === 0 ? <Empty text="No priority data in this period." /> : byPriority.map(p => (
            <div key={p.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, padding: "6px 0", borderBottom: "1px solid #F2F3F0" }}>
              <span style={{ color: PRIORITY_COLOR[p.name], fontWeight: 600 }}>{p.name}</span><span className="mono" style={{ fontWeight: 600 }}>{p.count}</span>
            </div>
          ))}
        </Card>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <CoverageLegend />
          <div style={{ display: "flex", gap: 14 }}>
            {isAdmin && (
              <button onClick={() => setCoverageModalOpen(true)} style={{ border: "none", background: "transparent", color: "#146356", fontSize: 11.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                <ListChecks size={13} /> Coverage Settings
              </button>
            )}
            {setTab && (
              <button onClick={() => setTab("scheduler")} style={{ border: "none", background: "transparent", color: "#146356", fontSize: 11.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                <ShieldCheck size={13} /> Manage Services
              </button>
            )}
          </div>
        </div>
        <CoverageGrid covered={coverage.covered} flagged={coverage.flagged} total={coverage.total} />
      </Card>

      {coverageModalOpen && (
        <CoverageSettingsModal
          allServicesList={allServicesList}
          current={trackedServices}
          onSave={(list) => { setExtraServices(es => ({ ...es, coverageTracked: list })); setCoverageModalOpen(false); }}
          onClose={() => setCoverageModalOpen(false)}
        />
      )}


      <Card title="Target Achievement">
        {targetAchievement.length === 0 ? <Empty text="No targets set yet." /> : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead><tr style={{ textAlign: "left", color: "#5B675F", borderBottom: "1px solid #E3E6E0" }}>
              <th style={th}>Target</th><th style={th}>Scope</th><th style={th}>Goal (per {"{period}"})</th><th style={th}>Actual (Completed, this report range)</th>
            </tr></thead>
            <tbody>
              {targetAchievement.map(t => {
                const name = t.scope === "channel" ? CHANNELS.find(c => c.id === t.target)?.name : t.target;
                return (
                  <tr key={t.id} style={{ borderBottom: "1px solid #EEF0EC" }}>
                    <td style={td}>{name}</td>
                    <td style={{ ...td, textTransform: "capitalize" }}>{t.scope} · per {t.period}</td>
                    <td style={td} className="mono">{t.goal}</td>
                    <td className="mono" style={{ ...td, fontWeight: 700, color: t.actual >= t.goal ? "#146356" : "#0E2B27" }}>{t.actual}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <div style={{ fontSize: 10.5, color: "#9AA39B", marginTop: 10 }}>Goals are set per week/month individually — compare against the actual count for context, since the report range may span more or less than one goal period.</div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, margin: "16px 0" }}>
        <StatCard label="Events This Period" value={eventsInRange.length} />
        <StatCard label="Avg. Attendance Rating (Cumulative)" value={cumulativeEventRating === null ? "—" : `${cumulativeEventRating.toFixed(1)}%`} />
        <StatCard label="Event Types Represented" value={eventsByType.length} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <FlexibleChart title="Events per Service" data={eventsByService} color="#B0538A" empty="No events logged in this period." />
        <FlexibleChart title="Events per Type" data={eventsByType.map(t => ({ name: t.name, count: t.count }))} color="#3E7CB1" empty="No events logged in this period." defaultType="pie" />
      </div>

      <Card title="Attendance Rating by Event Type" style={{ marginBottom: 16 }}>
        {eventsByType.length === 0 ? <Empty text="No events with results logged in this period." /> : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead><tr style={{ textAlign: "left", color: "#5B675F", borderBottom: "1px solid #E3E6E0" }}>
              <th style={th}>Event Type</th><th style={th}>Events</th><th style={th}>Avg. Attendance Rating</th>
            </tr></thead>
            <tbody>
              {eventsByType.map(t => (
                <tr key={t.name} style={{ borderBottom: "1px solid #EEF0EC" }}>
                  <td style={td}>{t.name}</td>
                  <td style={td} className="mono">{t.count}</td>
                  <td style={td} className="mono">{t.avgRating === null ? "—" : `${t.avgRating.toFixed(1)}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card title="Most Successful Events" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10.5, color: "#9AA39B", marginBottom: 10 }}>Ranked by attendance rating (registrations vs. actual attendance) — the ranking metric can change later if a different measure of success is preferred.</div>
        {topEvents.length === 0 ? <Empty text="No events with results logged in this period." /> : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead><tr style={{ textAlign: "left", color: "#5B675F", borderBottom: "1px solid #E3E6E0" }}>
              <th style={th}>#</th><th style={th}>Event</th><th style={th}>Type</th><th style={th}>Date</th><th style={th}>Reg. / Attend.</th><th style={th}>Rating</th>
            </tr></thead>
            <tbody>
              {topEvents.map((e, i) => (
                <tr key={e.id} style={{ borderBottom: "1px solid #EEF0EC" }}>
                  <td style={td}>{i === 0 ? <Award size={14} color="#E8A33D" /> : i + 1}</td>
                  <td style={td}>{e.title}</td>
                  <td style={td}>{e.eventType === "Other" ? e.customEventType : e.eventType}</td>
                  <td style={td} className="mono">{e.eventDate}</td>
                  <td style={td} className="mono">{e.attendance}/{e.registrations}</td>
                  <td style={{ ...td, fontWeight: 700, color: "#146356" }} className="mono">{e.rating.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}



function Header({ title, sub, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22 }}>
      <div>
        <div className="disp" style={{ fontSize: 24, fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 12.5, color: "#5B675F", marginTop: 2 }}>{sub}</div>
      </div>
      {action}
    </div>
  );
}
const toolbarBtn = { border: "1px solid #D8DDD5", background: "#fff", borderRadius: 5, padding: "3px 6px", color: "#0E2B27", display: "flex" };

function OtherTagPicker({ services, setServices }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const addOther = () => {
    const v = value.trim();
    if (v && !services.includes(v)) setServices(cur => [...cur, v]);
    setValue(""); setOpen(false);
  };
  if (!open) {
    return <button onClick={() => setOpen(true)} style={pillBtn(false)}>+ Other</button>;
  }
  return (
    <span style={{ display: "inline-flex", gap: 4 }}>
      <input value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => e.key === "Enter" && addOther()}
        placeholder="Type a service..." autoFocus style={{ ...inputStyle, fontSize: 11, padding: "4px 8px", width: 140 }} />
      <button onClick={addOther} style={{ ...pillBtn(true), padding: "4px 10px" }}>Add</button>
    </span>
  );
}

function RichCaptionField({ value, onChange, placeholder, rows = 3 }) {
  const taRef = useRef(null);
  const [emojiOpen, setEmojiOpen] = useState(false);

  const applyTransform = (fn) => {
    const ta = taRef.current;
    if (!ta) { onChange(fn(value)); return; }
    const start = ta.selectionStart, end = ta.selectionEnd;
    if (start === end) { onChange(fn(value)); return; }
    const transformed = fn(value.slice(start, end));
    const next = value.slice(0, start) + transformed + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(start, start + transformed.length); });
  };

  const insertEmoji = (emoji) => {
    const ta = taRef.current;
    if (!ta) { onChange(value + emoji); setEmojiOpen(false); return; }
    const start = ta.selectionStart, end = ta.selectionEnd;
    const next = value.slice(0, start) + emoji + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(start + emoji.length, start + emoji.length); });
    setEmojiOpen(false);
  };

  const titleCase = (s) => s.replace(/\w\S*/g, (t) => t[0].toUpperCase() + t.slice(1).toLowerCase());

  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 4, position: "relative" }}>
        <button type="button" onClick={() => applyTransform(toUnicodeBold)} title="Bold (select text first)" style={toolbarBtn}><Bold size={12} /></button>
        <button type="button" onClick={() => applyTransform(toUnicodeItalic)} title="Italic (select text first)" style={toolbarBtn}><Italic size={12} /></button>
        <button type="button" onClick={() => applyTransform((s) => s.toUpperCase())} title="UPPERCASE" style={toolbarBtn}><CaseUpper size={12} /></button>
        <button type="button" onClick={() => applyTransform((s) => s.toLowerCase())} title="lowercase" style={toolbarBtn}><CaseLower size={12} /></button>
        <button type="button" onClick={() => applyTransform(titleCase)} title="Title Case" style={toolbarBtn}><CaseSensitive size={12} /></button>
        <button type="button" onClick={() => setEmojiOpen(v => !v)} title="Insert emoji" style={toolbarBtn}><Smile size={12} /></button>
        {emojiOpen && (
          <div style={{ position: "absolute", top: 24, left: 0, background: "#fff", border: "1px solid #D8DDD5", borderRadius: 8, padding: 6, display: "flex", flexWrap: "wrap", gap: 4, width: 180, zIndex: 30, boxShadow: "0 6px 18px rgba(0,0,0,0.15)" }}>
            {CAPTION_EMOJIS.map(e => <button type="button" key={e} onClick={() => insertEmoji(e)} style={{ border: "none", background: "transparent", fontSize: 16, padding: 2, cursor: "pointer" }}>{e}</button>)}
          </div>
        )}
      </div>
      <textarea ref={taRef} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{ ...inputStyle, width: "100%", resize: "vertical", fontSize: 12 }} />
    </div>
  );
}


function FlexibleChart({ title, data, color = "#146356", empty, defaultType = "bar" }) {
  const [chartType, setChartType] = useState(defaultType);
  const top = data[0];
  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{title}</div>
          {top && <div style={{ fontSize: 11, color: "#5B675F", marginTop: 2 }}>Top: <b style={{ color: "#0E2B27" }}>{top.name}</b> ({top.count})</div>}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {["bar", "pie", "line"].map(t => (
            <button key={t} onClick={() => setChartType(t)} style={{
              fontSize: 10, padding: "3px 8px", borderRadius: 10, border: `1px solid ${chartType === t ? color : "#D8DDD5"}`,
              background: chartType === t ? color : "#fff", color: chartType === t ? "#fff" : "#5B675F", fontWeight: 600, textTransform: "capitalize",
            }}>{t}</button>
          ))}
        </div>
      </div>

      {data.length === 0 ? <Empty text={empty} /> : (
        <ResponsiveContainer width="100%" height={260}>
          {chartType === "bar" ? (
            <BarChart data={data.slice(0, 8)} layout="vertical" margin={{ left: 8, right: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E3E6E0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#5B675F" }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11, fill: "#0E2B27" }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #D8DDD5" }} />
              <Bar dataKey="count" fill={color} radius={[0, 4, 4, 0]} barSize={14}>
                <LabelList dataKey="count" position="right" style={{ fontSize: 10.5, fill: "#0E2B27", fontWeight: 600 }} />
              </Bar>
            </BarChart>
          ) : chartType === "line" ? (
            <LineChart data={data.slice(0, 10)} margin={{ left: 0, right: 16, top: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E3E6E0" />
              <XAxis dataKey="name" tick={{ fontSize: 9.5, fill: "#5B675F" }} interval={0} angle={-25} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11, fill: "#5B675F" }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #D8DDD5" }} />
              <Line type="monotone" dataKey="count" stroke={color} strokeWidth={2.5} dot={{ r: 3 }}>
                <LabelList dataKey="count" position="top" style={{ fontSize: 10, fill: "#0E2B27", fontWeight: 600 }} />
              </Line>
            </LineChart>
          ) : (
            <PieChart>
              <Pie data={data} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={85}
                label={({ name, count }) => `${name} (${count})`} labelLine={{ stroke: "#D8DDD5" }} style={{ fontSize: 10 }}>
                {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #D8DDD5" }} />
            </PieChart>
          )}
        </ResponsiveContainer>
      )}
    </Card>
  );
}

/* ---------------------------------- EVENTS ---------------------------------- */

function eventRating(ev) {
  if (!ev.registrations || !ev.attendance) return null;
  return (ev.attendance / ev.registrations) * 100;
}

function eventCountdown(ev) {
  if (!ev.eventDate) return null;
  const target = new Date(`${ev.eventDate}T${ev.eventTime || "00:00"}:00`);
  const now = new Date();
  const diffMs = target - now;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMs < 0) {
    const pastDays = Math.floor(-diffMs / 86400000);
    return { label: pastDays === 0 ? "Happening today" : `${pastDays}d ago`, past: diffMs < -3600000 && pastDays >= 1, today: pastDays === 0 };
  }
  if (diffDays === 0) {
    const diffHrs = Math.floor(diffMs / 3600000);
    return { label: diffHrs <= 0 ? "Starting soon" : `In ${diffHrs}h`, today: true, past: false };
  }
  return { label: `In ${diffDays}d`, today: false, past: false };
}

function formatEventDateTime(ev) {
  if (!ev.eventDate) return "";
  const d = new Date(`${ev.eventDate}T${ev.eventTime || "00:00"}:00`);
  const datePart = d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  if (!ev.eventTime) return datePart;
  const timePart = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${datePart} · ${timePart}`;
}

function Events({ events, setEvents, majorServices, minorServices }) {
  const [open, setOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [detailEvent, setDetailEvent] = useState(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [monthMode, setMonthMode] = useState("all"); // all | month
  const [monthCursor, setMonthCursor] = useState(new Date());

  const monthKey = localMonthStr(monthCursor);
  const shiftMonth = (n) => setMonthCursor(c => { const d = new Date(c); d.setMonth(d.getMonth() + n); return d; });

  const filtered = events.filter(e =>
    (filterType === "All" || e.eventType === filterType) &&
    (filterStatus === "All" || e.status === filterStatus) &&
    (monthMode === "all" || (e.eventDate && e.eventDate.slice(0, 7) === monthKey)) &&
    (e.title.toLowerCase().includes(search.toLowerCase()) || (e.approvedBy || "").toLowerCase().includes(search.toLowerCase()))
  ).sort((a, b) => b.eventDate.localeCompare(a.eventDate));

  const totalEvents = events.length;
  const upcoming = events.filter(e => e.status === "Upcoming").length;
  const completed = events.filter(e => e.status === "Completed").length;
  const rated = events.map(eventRating).filter(r => r !== null);
  const avgRating = rated.length ? rated.reduce((s, r) => s + r, 0) / rated.length : null;

  const saveEvent = (ev) => {
    setEvents(es => es.some(x => x.id === ev.id) ? es.map(x => x.id === ev.id ? ev : x) : [...es, ev]);
    setOpen(false); setEditingEvent(null);
    if (detailEvent?.id === ev.id) setDetailEvent(ev);
  };
  const removeEvent = (id) => { setEvents(es => es.filter(e => e.id !== id)); setDetailEvent(null); };

  return (
    <div>
      <Header title="Events" sub="Log, schedule, and track the results of webinars and events" action={
        <button onClick={() => { setEditingEvent(null); setOpen(true); }} style={primaryBtn}><Plus size={15} /> New Event</button>
      } />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 18 }}>
        <StatCard label="Total Events" value={totalEvents} />
        <StatCard label="Upcoming" value={upcoming} accent="#3E7CB1" />
        <StatCard label="Completed" value={completed} accent="#146356" />
        <StatCard label="Avg. Attendance Rating" value={avgRating === null ? "—" : `${avgRating.toFixed(1)}%`} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setMonthMode("all")} style={pillBtn(monthMode === "all")}>All Events</button>
          <button onClick={() => setMonthMode("month")} style={pillBtn(monthMode === "month")}>By Month</button>
        </div>
        {monthMode === "month" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => shiftMonth(-1)} style={navBtn}><ChevronLeft size={16} /></button>
            <div style={{ fontSize: 13, fontWeight: 700, minWidth: 130, textAlign: "center" }}>{monthCursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</div>
            <button onClick={() => shiftMonth(1)} style={navBtn}><ChevronRight size={16} /></button>
            <button onClick={() => setMonthCursor(new Date())} style={{ ...navBtn, width: "auto", padding: "0 10px", fontSize: 11.5, fontWeight: 600 }}>This Month</button>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: 10, color: "#9AA39B" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title or coordinator..." style={{ ...inputStyle, paddingLeft: 30, width: "100%" }} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: 160 }}>
          <option>All</option>{EVENT_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ ...inputStyle, width: 180 }}>
          <option>All</option>{EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? <Card><Empty text="No events match." /></Card> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          {filtered.map(ev => {
            const rating = eventRating(ev);
            const StatusIcon = EVENT_STATUS_ICON[ev.status];
            const countdown = ev.status === "Upcoming" || ev.status === "Rescheduled" ? eventCountdown(ev) : null;
            return (
              <button key={ev.id} onClick={() => setDetailEvent(ev)} style={{ textAlign: "left", background: "#fff", border: "1px solid #E3E6E0", borderRadius: 10, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{ev.title}</div>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: EVENT_STATUS_COLOR[ev.status], background: EVENT_STATUS_COLOR[ev.status] + "1A", padding: "2px 8px", borderRadius: 10, display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
                    <StatusIcon size={10} /> {ev.status}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "#5B675F", marginBottom: 6 }}>{ev.eventType === "Other" ? ev.customEventType : ev.eventType} · {formatEventDateTime(ev)}</div>
                {countdown && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 700, color: countdown.today ? "#C4544A" : "#3E7CB1", background: (countdown.today ? "#C4544A" : "#3E7CB1") + "14", padding: "2px 8px", borderRadius: 10, marginBottom: 8 }}>
                    <Clock size={10} /> {countdown.label}
                  </div>
                )}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10, marginTop: countdown ? 0 : 4 }}>
                  {ev.services.slice(0, 3).map(s => <span key={s} style={tagStyle}>{s}</span>)}
                  {ev.services.length > 3 && <span style={tagStyle}>+{ev.services.length - 3}</span>}
                </div>
                {rating !== null ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5 }}>
                    <Users size={12} color="#5B675F" /> <span className="mono">{ev.attendance}/{ev.registrations}</span>
                    <span style={{ fontWeight: 700, color: rating >= 70 ? "#146356" : rating >= 40 ? "#E8A33D" : "#C4544A" }}>{rating.toFixed(0)}%</span>
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: "#9AA39B" }}>No results logged yet</div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {open && (
        <EventModal
          editing={editingEvent}
          majorServices={majorServices} minorServices={minorServices}
          onClose={() => { setOpen(false); setEditingEvent(null); }}
          onSave={saveEvent}
        />
      )}

      {detailEvent && !open && (
        <EventDetailModal
          event={detailEvent}
          onClose={() => setDetailEvent(null)}
          onEdit={() => { setEditingEvent(detailEvent); setOpen(true); }}
          onSave={saveEvent}
          onRemove={() => removeEvent(detailEvent.id)}
        />
      )}
    </div>
  );
}

function RequirementsChecklist({ requirements, setRequirements }) {
  const [newItem, setNewItem] = useState("");
  const addItem = () => {
    if (!newItem.trim()) return;
    setRequirements(r => [...r, { id: uid(), text: newItem.trim(), done: false }]);
    setNewItem("");
  };
  const toggle = (id) => setRequirements(r => r.map(x => x.id === id ? { ...x, done: !x.done } : x));
  const remove = (id) => setRequirements(r => r.filter(x => x.id !== id));

  return (
    <div>
      {requirements.map(item => (
        <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
          <button onClick={() => toggle(item.id)} style={{ border: "none", background: "transparent", color: item.done ? "#146356" : "#9AA39B", display: "flex" }}>
            {item.done ? <CheckSquare size={15} /> : <Square size={15} />}
          </button>
          <span style={{ fontSize: 12.5, flex: 1, textDecoration: item.done ? "line-through" : "none", color: item.done ? "#9AA39B" : "#0E2B27" }}>{item.text}</span>
          <button onClick={() => remove(item.id)} style={{ border: "none", background: "transparent", color: "#C4544A" }}><X size={13} /></button>
        </div>
      ))}
      <div style={{ display: "flex", gap: 6, marginTop: requirements.length ? 8 : 0 }}>
        <input value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => e.key === "Enter" && addItem()} placeholder="Add a requirement..." style={{ ...inputStyle, flex: 1, fontSize: 12.5 }} />
        <button onClick={addItem} style={{ ...pillBtn(false), padding: "6px 12px" }}><Plus size={13} /></button>
      </div>
    </div>
  );
}

function EventModal({ editing, onClose, onSave, majorServices, minorServices }) {
  const [title, setTitle] = useState(editing?.title || "");
  const [eventType, setEventType] = useState(editing?.eventType || EVENT_TYPES[0]);
  const [customEventType, setCustomEventType] = useState(editing?.customEventType || "");
  const [channel, setChannel] = useState(editing?.channel || "");
  const [serviceType, setServiceType] = useState("major");
  const [services, setServices] = useState(editing?.services || []);
  const [approvedBy, setApprovedBy] = useState(editing?.approvedBy || "");
  const [eventDate, setEventDate] = useState(editing?.eventDate || "");
  const [eventTime, setEventTime] = useState(editing?.eventTime || "");
  const [requirements, setRequirements] = useState(editing?.requirements || []);
  const [registrationLink, setRegistrationLink] = useState(editing?.registrationLink || "");
  const [materialLink, setMaterialLink] = useState(editing?.materialLink || "");
  const [notes, setNotes] = useState(editing?.notes || "");
  const list = serviceType === "major" ? majorServices : minorServices;

  const toggleService = (s) => setServices(cur => cur.includes(s) ? cur.filter(x => x !== s) : [...cur, s]);

  const submit = () => {
    let status = editing?.status || "Upcoming";
    if (editing && editing.eventDate && eventDate !== editing.eventDate && status === "Upcoming") status = "Rescheduled";
    onSave({
      id: editing?.id || uid(), title, eventType, customEventType: eventType === "Other" ? customEventType : "",
      channel, services, approvedBy, eventDate, eventTime, requirements, registrationLink, materialLink, notes, status,
      registrations: editing?.registrations ?? null, attendance: editing?.attendance ?? null,
      postEventNotes: editing?.postEventNotes || "",
      dateLogged: editing?.dateLogged || localDateStr(new Date()),
    });
  };

  return (
    <div style={overlay}>
      <div style={{ ...modal, width: 560 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div className="disp" style={{ fontSize: 18, fontWeight: 600 }}>{editing ? "Edit Event" : "New Event"}</div>
          <button onClick={onClose} style={{ border: "none", background: "transparent" }}><X size={18} /></button>
        </div>

        <label style={label}>Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. NCLEX USA Info Session" style={{ ...inputStyle, width: "100%", marginBottom: 12 }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={label}>Event type</label>
            <select value={eventType} onChange={e => setEventType(e.target.value)} style={{ ...inputStyle, width: "100%" }}>
              {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Event date</label>
            <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
          </div>
          <div>
            <label style={label}>Event time</label>
            <input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
          </div>
        </div>
        {eventType === "Other" && (
          <input value={customEventType} onChange={e => setCustomEventType(e.target.value)} placeholder="Specify event type..." style={{ ...inputStyle, width: "100%", marginBottom: 12 }} />
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={label}>Channel (optional)</label>
            <select value={channel} onChange={e => setChannel(e.target.value)} style={{ ...inputStyle, width: "100%" }}>
              <option value="">— none —</option>
              {CHANNELS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Approved / coordinated by</label>
            <input value={approvedBy} onChange={e => setApprovedBy(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
          </div>
        </div>

        <label style={label}>Service tags</label>
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          <button onClick={() => setServiceType("major")} style={pillBtn(serviceType === "major")}>Major</button>
          <button onClick={() => setServiceType("minor")} style={pillBtn(serviceType === "minor")}>Minor</button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 90, overflowY: "auto", border: "1px solid #E3E6E0", borderRadius: 8, padding: 8, marginBottom: 8 }}>
          {list.map(s => <button key={s} onClick={() => toggleService(s)} style={pillBtn(services.includes(s))}>{s}</button>)}
        </div>
        <OtherTagPicker services={services} setServices={setServices} />

        <label style={{ ...label, marginTop: 14 }}>Needed requirements</label>
        <div style={{ background: "#F5F6F1", borderRadius: 8, padding: 10, marginBottom: 14 }}>
          <RequirementsChecklist requirements={requirements} setRequirements={setRequirements} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={label}>Webinar / registration link</label>
            <input value={registrationLink} onChange={e => setRegistrationLink(e.target.value)} placeholder="https://zoom.us/..." style={{ ...inputStyle, width: "100%" }} />
          </div>
          <div>
            <label style={label}>Material link (deck, resources)</label>
            <input value={materialLink} onChange={e => setMaterialLink(e.target.value)} placeholder="https://drive.google.com/..." style={{ ...inputStyle, width: "100%" }} />
          </div>
        </div>

        <label style={label}>Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ ...inputStyle, width: "100%", marginBottom: 20, resize: "vertical" }} />

        <button
          disabled={!title || !eventDate}
          onClick={submit}
          style={{ ...primaryBtn, width: "100%", justifyContent: "center", opacity: (!title || !eventDate) ? 0.5 : 1 }}
        >{editing ? "Save Changes" : "Save Event"}</button>
      </div>
    </div>
  );
}

function EventDetailModal({ event, onClose, onEdit, onSave, onRemove }) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [registrations, setRegistrations] = useState(event.registrations ?? "");
  const [attendance, setAttendance] = useState(event.attendance ?? "");
  const [postEventNotes, setPostEventNotes] = useState(event.postEventNotes || "");
  const ch = CHANNELS.find(c => c.id === event.channel);
  const rating = eventRating({ ...event, registrations: Number(registrations) || null, attendance: Number(attendance) || null });
  const StatusIcon = EVENT_STATUS_ICON[event.status];
  const countdown = (event.status === "Upcoming" || event.status === "Rescheduled") ? eventCountdown(event) : null;

  const saveResults = () => {
    onSave({ ...event, registrations: registrations === "" ? null : Number(registrations), attendance: attendance === "" ? null : Number(attendance), postEventNotes });
  };
  const changeStatus = (status) => onSave({ ...event, status });

  return (
    <div style={overlay} onClick={onClose}>
      <div style={{ ...modal, width: 560 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <div className="disp" style={{ fontSize: 19, fontWeight: 600 }}>{event.title}</div>
          <button onClick={onClose} style={{ border: "none", background: "transparent" }}><X size={18} /></button>
        </div>
        <div style={{ fontSize: 12, color: "#5B675F", marginBottom: 6 }}>
          {event.eventType === "Other" ? event.customEventType : event.eventType} {ch && `· ${ch.name}`} · {formatEventDateTime(event)} {event.approvedBy && `· Approved by ${event.approvedBy}`}
        </div>
        {countdown && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 700, color: countdown.today ? "#C4544A" : "#3E7CB1", background: (countdown.today ? "#C4544A" : "#3E7CB1") + "14", padding: "4px 10px", borderRadius: 12, marginBottom: 14 }}>
            <Clock size={12} /> {countdown.label}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16, marginTop: countdown ? 0 : 8 }}>
          <div>
            <label style={label}>Status</label>
            <select value={event.status} onChange={e => changeStatus(e.target.value)} style={{ ...inputStyle, width: "100%", color: EVENT_STATUS_COLOR[event.status], fontWeight: 700 }}>
              {EVENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Services</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, paddingTop: 6 }}>
              {event.services.map(s => <span key={s} style={tagStyle}>{s}</span>)}
            </div>
          </div>
        </div>

        {event.requirements?.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#5B675F", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.3 }}>Requirements</div>
            <div style={{ background: "#F5F6F1", borderRadius: 8, padding: "6px 10px", marginBottom: 14 }}>
              {event.requirements.map(r => (
                <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 12.5 }}>
                  {r.done ? <CheckSquare size={13} color="#146356" /> : <Square size={13} color="#9AA39B" />}
                  <span style={{ textDecoration: r.done ? "line-through" : "none", color: r.done ? "#9AA39B" : "#0E2B27" }}>{r.text}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {(event.registrationLink || event.materialLink) && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 14 }}>
            {event.registrationLink && (
              <a href={event.registrationLink} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#146356", fontWeight: 600, wordBreak: "break-all" }}>Webinar/Registration link →</a>
            )}
            {event.materialLink && (
              <a href={event.materialLink} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#146356", fontWeight: 600, wordBreak: "break-all" }}>Material link →</a>
            )}
          </div>
        )}
        {event.notes && <div style={{ fontSize: 12.5, color: "#5B675F", marginBottom: 16, whiteSpace: "pre-wrap" }}>{event.notes}</div>}

        <div style={{ fontSize: 11, fontWeight: 700, color: "#5B675F", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.3 }}>Results</div>
        <div style={{ background: "#F5F6F1", borderRadius: 8, padding: 12, marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={label}>Registrations</label>
              <input type="number" value={registrations} onChange={e => setRegistrations(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
            </div>
            <div>
              <label style={label}>Actual attendance</label>
              <input type="number" value={attendance} onChange={e => setAttendance(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
            </div>
            <div>
              <label style={label}>Attendance rating</label>
              <div style={{ ...inputStyle, background: "#fff", fontWeight: 700, color: rating === null ? "#9AA39B" : rating >= 70 ? "#146356" : rating >= 40 ? "#E8A33D" : "#C4544A" }}>
                {rating === null ? "—" : `${rating.toFixed(1)}%`}
              </div>
            </div>
          </div>
          <label style={label}>Post-event notes</label>
          <textarea value={postEventNotes} onChange={e => setPostEventNotes(e.target.value)} rows={2} placeholder="What happened, lessons learned, follow-ups..." style={{ ...inputStyle, width: "100%", marginBottom: 10, resize: "vertical" }} />
          <button onClick={saveResults} style={{ ...primaryBtn, fontSize: 12 }}><Users size={13} /> Save Results</button>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onEdit} style={{ ...primaryBtn, flex: 1, justifyContent: "center" }}><Pencil size={13} /> Edit / Reschedule</button>
          {!confirmRemove ? (
            <button onClick={() => setConfirmRemove(true)} style={{ ...primaryBtn, flex: 1, justifyContent: "center", background: "#fff", color: "#C4544A", border: "1px solid #C4544A" }}><Trash2 size={13} /> Remove</button>
          ) : (
            <button onClick={onRemove} style={{ ...primaryBtn, flex: 1, justifyContent: "center", background: "#C4544A" }}>Confirm remove?</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- SHARED UI ---------------------------------- */

function CoverageGrid({ covered, flagged, total, periodLabel }) {
  const pct = total > 0 ? Math.round((covered.length / total) * 100) : 0;
  const barColor = pct >= 80 ? "#146356" : pct >= 50 ? "#E8A33D" : "#C4544A";
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>Service Coverage{periodLabel ? ` — ${periodLabel}` : ""}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: barColor }}>{pct}%</div>
      </div>
      <div style={{ height: 8, background: "#EEF0EC", borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: 4 }} />
      </div>
      <div style={{ fontSize: 11, color: "#5B675F", marginBottom: 12 }}>{covered.length} of {total} services covered</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 260, overflowY: "auto" }}>
        {flagged.map(s => (
          <span key={s.name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "#C4544A", background: "#C4544A1A", padding: "4px 10px", borderRadius: 12, border: "1px solid #C4544A33" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#C4544A" }} /> {s.name}
          </span>
        ))}
        {covered.map(s => (
          <span key={s.name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "#146356", background: "#14635614", padding: "4px 10px", borderRadius: 12, border: "1px solid #14635633" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#146356" }} /> {s.name} <span className="mono" style={{ opacity: 0.7 }}>{s.count}</span>
          </span>
        ))}
      </div>
    </>
  );
}

function CoverageLegend() {
  return (
    <div style={{ display: "flex", gap: 14, fontSize: 10.5, color: "#5B675F", marginBottom: 10 }}>
      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: "#C4544A" }} /> Not covered</span>
      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: "#146356" }} /> Covered</span>
    </div>
  );
}


function Card({ title, children, style }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E3E6E0", borderRadius: 10, padding: 18, ...style }}>
      {title && <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>{title}</div>}
      {children}
    </div>
  );
}
function StatCard({ label, value, accent, badge, badgeColor, sub }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E3E6E0", borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ fontSize: 11, color: "#5B675F", marginBottom: 6, fontWeight: 600 }}>{label}</div>
      <div className="mono" style={{ fontSize: 22, fontWeight: 600, color: accent || "#0E2B27" }}>{value}</div>
      {badge && <span style={{ fontSize: 10.5, fontWeight: 700, color: badgeColor, background: badgeColor + "1A", padding: "2px 8px", borderRadius: 10, marginTop: 4, display: "inline-block" }}>{badge}</span>}
      {sub && <div style={{ fontSize: 10.5, color: "#9AA39B", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}
function RatingBadge({ label }) {
  const color = RATING_COLOR[label] || "#9AA39B";
  return <span style={{ fontSize: 10.5, fontWeight: 700, color, background: color + "1A", padding: "2px 8px", borderRadius: 10 }}>{label}</span>;
}
function Empty({ text }) {
  return <div style={{ padding: "30px 0", textAlign: "center", color: "#9AA39B", fontSize: 12.5 }}>{text}</div>;
}

const th = { padding: "8px 10px", fontWeight: 600 };
const td = { padding: "9px 10px", verticalAlign: "top" };
const label = { fontSize: 11, fontWeight: 600, color: "#5B675F", display: "block", marginBottom: 5 };
const inputStyle = { border: "1px solid #D8DDD5", borderRadius: 7, padding: "8px 10px", fontSize: 13, outline: "none", color: "#0E2B27" };
const tagStyle = { fontSize: 10.5, background: "#EEF0EC", padding: "2px 7px", borderRadius: 8, color: "#0E2B27" };
const primaryBtn = { display: "flex", alignItems: "center", gap: 6, background: "var(--app-accent)", color: "#fff", border: "none", padding: "9px 15px", borderRadius: 8, fontSize: 13, fontWeight: 600 };
const navBtn = { display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, border: "1px solid #D8DDD5", background: "#fff", borderRadius: 7, color: "#0E2B27" };
const overlay = { position: "fixed", inset: 0, background: "rgba(14,43,39,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 };
const modal = { background: "#fff", borderRadius: 12, padding: 24, width: 480, maxHeight: "85vh", overflowY: "auto" };
const pillBtn = (active) => ({
  fontSize: 11, padding: "5px 10px", borderRadius: 14, border: `1px solid ${active ? "#146356" : "#D8DDD5"}`,
  background: active ? "#146356" : "#fff", color: active ? "#fff" : "#0E2B27", fontWeight: 600,
});
