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
  Bold, Italic, CaseUpper, CaseLower, CaseSensitive, ShieldCheck, Maximize2
} from "lucide-react";

/* ---------------------------------- DATA ---------------------------------- */

const MAJOR_SERVICES = ["NCLEX Australia","NCLEX Canada","NCLEX USA","Middle East","Ireland","UKNMC/Midwife","Online Review"];
const MINOR_SERVICES = ["NAI","Tourist Visa","Visascreen","License Endorsement","OPRA/KAPS","Australia Midwifery","ASCPi","AUS License Renewal","Branch Info","CBC","Truemerit","CPD","CVS NZ/NCNZ","FAQ/Trivia","Featured Clients","General Post","Hope Talk","Hopkins","IELTS Sced","IPASS Cares","Live Video","Medtech Middle East","MET","Motivational","NCLEX Question","NCLEX Answer","New Mexico","NNAS","PNLE","PRC","Promo","NCLEX Q&AI","Score Transfer","Study Tips/Trivia","UWORLD","US License Renewal","WES","Blog","YT Post"];
const CREATIVE_TYPES = ["Infographics/Information","Blog Cover","Motivational Content","Promo","Reel/Video/Animation","Educational","Event","Passers","Testimonial"];
const ALL_SERVICES = [...MAJOR_SERVICES, ...MINOR_SERVICES];
const EXTRA_MAJOR_COLOR_POOL = ["#7A6FB0", "#4C8FBD", "#A8763E", "#5C8A3A", "#8A4B6B"];
const PIE_COLORS = ["#146356", "#E8A33D", "#4C8C6B", "#B0538A", "#3E7CB1", "#C4544A", "#2E7D6B", "#9AA39B", "#0E2B27"];
// Only these login emails are ever treated as Admin — a code-level lock, same pattern as Rise V1.
// Admin cannot be granted through the app UI; edit this list and redeploy to change it.
const ADMIN_EMAILS = ["YOUR_ADMIN_EMAIL@example.com"];
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

const STATUS = ["Pending", "In Progress", "Completed"];
const STATUS_ICON = { "Pending": Circle, "In Progress": Clock, "Completed": CheckCircle2 };
const STATUS_COLOR = { "Pending": "#9AA39B", "In Progress": "#E8A33D", "Completed": "#146356" };
const DEPTS = ["Social Media", "SEO", "Digital Marketing", "Operations", "Management", "Finance", "Other"];
const PRIORITIES = ["Low", "Normal", "High", "Urgent"];
const PRIORITY_COLOR = { Low: "#9AA39B", Normal: "#146356", High: "#E8A33D", Urgent: "#C4544A" };
const PURPOSES = ["Ads", "YouTube", "TikTok", "Facebook/IG", "Website", "Other"];
const POST_STATUSES = ["Pending", "Posted", "Cancelled", "Rescheduled", "Flagged"];
const POST_STATUS_COLOR = { "Pending": "#9AA39B", "Posted": "#146356", "Cancelled": "#C4544A", "Rescheduled": "#E8A33D", "Flagged": "#B0538A" };
const POST_STATUS_ICON = { "Pending": Circle, "Posted": CheckCircle2, "Cancelled": Ban, "Rescheduled": RotateCcw, "Flagged": AlertTriangle };

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
const uid = () => Math.random().toString(36).slice(2, 10);

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
  const [extraServices, setExtraServices] = useState({ major: [], minor: [] });
  const [loaded, setLoaded] = useState(false);

  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setAuthChecked(true); });
    return unsub;
  }, []);

  // Load from Firestore once signed in
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [rSnap, cSnap, tSnap, capSnap, tplSnap, svcSnap] = await Promise.all([
          getDoc(doc(db, "riseSocMedData", "requests")),
          getDoc(doc(db, "riseSocMedData", "channelStats")),
          getDoc(doc(db, "riseSocMedData", "targets")),
          getDoc(doc(db, "riseSocMedData", "captions")),
          getDoc(doc(db, "riseSocMedData", "templates")),
          getDoc(doc(db, "riseSocMedData", "extraServices")),
        ]);
        if (rSnap.exists()) setRequests(rSnap.data().value || []);
        if (cSnap.exists()) setChannelStats(cSnap.data().value || {});
        if (tSnap.exists()) setTargets(tSnap.data().value || []);
        if (capSnap.exists()) setCaptions(capSnap.data().value || []);
        if (tplSnap.exists()) setTemplates(tplSnap.data().value || []);
        if (svcSnap.exists()) setExtraServices(svcSnap.data().value || { major: [], minor: [] });
      } finally { setLoaded(true); }
    })();
  }, [user]);

  useEffect(() => { if (loaded && user) setDoc(doc(db, "riseSocMedData", "requests"), { value: requests }).catch(() => {}); }, [requests, loaded, user]);
  useEffect(() => { if (loaded && user) setDoc(doc(db, "riseSocMedData", "channelStats"), { value: channelStats }).catch(() => {}); }, [channelStats, loaded, user]);
  useEffect(() => { if (loaded && user) setDoc(doc(db, "riseSocMedData", "targets"), { value: targets }).catch(() => {}); }, [targets, loaded, user]);
  useEffect(() => { if (loaded && user) setDoc(doc(db, "riseSocMedData", "captions"), { value: captions }).catch(() => {}); }, [captions, loaded, user]);
  useEffect(() => { if (loaded && user) setDoc(doc(db, "riseSocMedData", "templates"), { value: templates }).catch(() => {}); }, [templates, loaded, user]);
  useEffect(() => { if (loaded && user) setDoc(doc(db, "riseSocMedData", "extraServices"), { value: extraServices }).catch(() => {}); }, [extraServices, loaded, user]);

  if (!authChecked) {
    return <div style={{ padding: 40, fontFamily: "'Inter',sans-serif", color: "#5B675F" }}>Loading…</div>;
  }
  if (!user) {
    return <Login />;
  }

  const NAV = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "requests",  label: "Requests",  icon: ClipboardList },
    { id: "channels",  label: "Channels",  icon: TrendingUp },
    { id: "targets",   label: "Targets",   icon: Target },
    { id: "captions",  label: "Captions",  icon: MessageSquareText },
    { id: "scheduler", label: "Scheduler", icon: CalendarDays },
  ];

  const todayStr = new Date().toISOString().slice(0, 10);
  const isAdmin = !!(user && ADMIN_EMAILS.includes(user.email));
  const allMajorServices = [...MAJOR_SERVICES, ...extraServices.major];
  const allMinorServices = [...MINOR_SERVICES, ...extraServices.minor];
  const allServicesList = [...allMajorServices, ...allMinorServices];
  const reminders = requests
    .filter(r => r.scheduledDate && r.scheduledDate <= todayStr && r.status !== "Completed")
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

  return (
    <div style={{ display: "flex", minHeight: 620, fontFamily: "'Inter',sans-serif", background: "#F5F6F1", color: "#0E2B27", borderRadius: 12, overflow: "hidden", border: "1px solid #D8DDD5" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');
        .mono { font-family:'IBM Plex Mono',monospace; }
        .disp { font-family:'Fraunces',serif; }
        button { cursor:pointer; font-family:inherit; }
        input,select,textarea { font-family:inherit; }
        ::-webkit-scrollbar{width:8px;height:8px} ::-webkit-scrollbar-thumb{background:#D8DDD5;border-radius:4px}
      `}</style>

      {/* SIDEBAR */}
      <div style={{ width: 208, background: "#0E2B27", color: "#F5F6F1", padding: "22px 14px", flexShrink: 0, position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 3, paddingLeft: 6 }}>
            {[6, 10, 14, 19].map((h, i) => (
              <div key={i} style={{ width: 4, height: h, background: "#E8A33D", borderRadius: 1, opacity: 0.5 + i * 0.15 }} />
            ))}
          </div>
          <button onClick={() => setBellOpen(v => !v)} style={{ position: "relative", border: "none", background: "transparent", color: "#B7C4BF", padding: 2 }}>
            <Bell size={16} />
            {reminders.length > 0 && (
              <span style={{ position: "absolute", top: -4, right: -4, background: "#C4544A", color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: 8, minWidth: 15, height: 15, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>
                {reminders.length}
              </span>
            )}
          </button>
        </div>
        {bellOpen && (
          <div style={{ position: "absolute", top: 46, right: 14, width: 260, background: "#fff", color: "#0E2B27", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.25)", padding: 12, zIndex: 60, maxHeight: 320, overflowY: "auto" }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Reminders</div>
            {reminders.length === 0 ? (
              <div style={{ fontSize: 11.5, color: "#9AA39B" }}>Nothing due or overdue.</div>
            ) : reminders.map(r => {
              const overdue = r.scheduledDate < todayStr;
              return (
                <div key={r.id} style={{ borderBottom: "1px solid #EEF0EC", padding: "7px 0" }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600 }}>{r.title}</div>
                  <div style={{ fontSize: 10.5, color: overdue ? "#C4544A" : "#E8A33D", fontWeight: 600 }}>
                    {overdue ? "Overdue" : "Due today"} · {r.scheduledDate}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="disp" style={{ fontSize: 22, fontWeight: 600, paddingLeft: 6, marginBottom: 2 }}>Rise</div>
        <div style={{ fontSize: 10.5, opacity: 0.55, paddingLeft: 6, marginBottom: 26, letterSpacing: 0.4 }}>SOCIAL MEDIA TRACKER</div>
        {NAV.map(n => {
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
        <div style={{ marginTop: "auto", paddingTop: 20, borderTop: "1px solid #1D4038", fontSize: 11 }}>
          <div style={{ color: "#B7C4BF", marginBottom: 6, wordBreak: "break-all" }}>{user.email}</div>
          <button onClick={() => signOut(auth)} style={{ border: "none", background: "transparent", color: "#E8A33D", fontWeight: 600, padding: 0 }}>Sign out</button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, padding: "26px 32px", overflowY: "auto", maxHeight: 620 }}>
        {tab === "dashboard" && <Dashboard requests={requests} channelStats={channelStats} targets={targets} allServicesList={allServicesList} />}
        {tab === "requests"  && <Requests requests={requests} setRequests={setRequests} captions={captions} user={user} majorServices={allMajorServices} minorServices={allMinorServices} />}
        {tab === "channels"  && <Channels channelStats={channelStats} setChannelStats={setChannelStats} />}
        {tab === "targets"   && <Targets targets={targets} setTargets={setTargets} requests={requests} majorServices={allMajorServices} />}
        {tab === "captions"  && <Captions captions={captions} setCaptions={setCaptions} templates={templates} setTemplates={setTemplates} majorServices={allMajorServices} minorServices={allMinorServices} />}
        {tab === "scheduler" && <Scheduler requests={requests} setRequests={setRequests} captions={captions} setCaptions={setCaptions} templates={templates} setTemplates={setTemplates}
          majorServices={allMajorServices} minorServices={allMinorServices} extraServices={extraServices} setExtraServices={setExtraServices} isAdmin={isAdmin} />}
      </div>
    </div>
  );
}

/* ---------------------------------- LOGIN ---------------------------------- */

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
    <div style={{ minHeight: 620, display: "flex", alignItems: "center", justifyContent: "center", background: "#0E2B27", borderRadius: 12, fontFamily: "'Inter',sans-serif" }}>
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

function Dashboard({ requests, channelStats, targets, allServicesList = ALL_SERVICES }) {
  const [showAllCoverage, setShowAllCoverage] = useState(false);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthRequests = useMemo(() => requests.filter(r => r.dateLogged.slice(0, 7) === currentMonth), [requests, currentMonth]);

  const byService = useMemo(() => {
    const counts = {};
    requests.forEach(r => r.services.forEach(s => { counts[s] = (counts[s] || 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count }));
  }, [requests]);

  const coverage = useMemo(() => {
    const counts = {};
    allServicesList.forEach(s => { counts[s] = 0; });
    monthRequests.forEach(r => r.services.forEach(s => { if (counts[s] !== undefined) counts[s] += 1; }));
    const list = Object.entries(counts).map(([name, count]) => ({ name, count }));
    const flagged = list.filter(s => s.count === 0).sort((a, b) => a.name.localeCompare(b.name));
    const covered = list.filter(s => s.count > 0).sort((a, b) => b.count - a.count);
    return { flagged, covered, total: list.length };
  }, [monthRequests]);

  const byCreative = useMemo(() => {
    const counts = {};
    requests.forEach(r => { counts[r.creativeType] = (counts[r.creativeType] || 0) + 1; });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [requests]);

  const completed = requests.filter(r => r.status === "Completed").length;
  const inProgress = requests.filter(r => r.status === "In Progress").length;
  const pending = requests.filter(r => r.status === "Pending").length;

  return (
    <div>
      <Header title="Dashboard" sub="Overview across all channels and services" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 22 }}>
        <StatCard label="Total Requests" value={requests.length} />
        <StatCard label="Pending" value={pending} accent="#9AA39B" />
        <StatCard label="In Progress" value={inProgress} accent="#E8A33D" />
        <StatCard label="Completed" value={completed} accent="#146356" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
        <FlexibleChart title="Requests per Service" data={byService} color="#146356" empty="Log a request to see the breakdown." />
        <FlexibleChart title="Requests by Creative Type" data={byCreative} color="#E8A33D" empty="No creative type data yet." defaultType="pie" />
      </div>

      <Card style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Service Coverage — {monthLabel(currentMonth)}</div>
          <div style={{ fontSize: 11.5, color: "#5B675F" }}>{coverage.covered.length} of {coverage.total} services covered this month</div>
        </div>

        {coverage.flagged.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "#146356" + "12", borderRadius: 8, fontSize: 12.5, color: "#146356", fontWeight: 600 }}>
            <CheckCircle2 size={15} /> Every service has at least one request logged this month.
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontSize: 12, color: "#C4544A", fontWeight: 700 }}>
              <AlertTriangle size={14} /> {coverage.flagged.length} service{coverage.flagged.length > 1 ? "s" : ""} still need{coverage.flagged.length === 1 ? "s" : ""} content this month
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 130, overflowY: "auto" }}>
              {coverage.flagged.map(s => (
                <span key={s.name} style={{ fontSize: 11, fontWeight: 600, color: "#C4544A", background: "#C4544A1A", padding: "4px 10px", borderRadius: 12, border: "1px solid #C4544A33" }}>
                  {s.name}
                </span>
              ))}
            </div>
          </>
        )}

        <button onClick={() => setShowAllCoverage(v => !v)} style={{ display: "flex", alignItems: "center", gap: 4, border: "none", background: "transparent", color: "#5B675F", fontSize: 11.5, fontWeight: 600, marginTop: 12, padding: 0 }}>
          {showAllCoverage ? <ChevronUp size={13} /> : <ChevronDown size={13} />} {showAllCoverage ? "Hide" : "Show"} full breakdown ({coverage.total} services)
        </button>

        {showAllCoverage && (
          <div style={{ marginTop: 10, maxHeight: 200, overflowY: "auto", borderTop: "1px solid #EEF0EC", paddingTop: 10 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <tbody>
                {[...coverage.covered, ...coverage.flagged].map(s => (
                  <tr key={s.name} style={{ borderBottom: "1px solid #F2F3F0" }}>
                    <td style={{ padding: "5px 8px" }}>{s.name}</td>
                    <td style={{ padding: "5px 8px", textAlign: "right" }} className="mono">
                      <span style={{ color: s.count === 0 ? "#C4544A" : "#146356", fontWeight: 600 }}>{s.count}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Channel Snapshot" style={{ marginTop: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {CHANNELS.map(ch => {
            const rows = (channelStats[ch.id] || []).sort((a, b) => a.month.localeCompare(b.month));
            const last = rows[rows.length - 1];
            return (
              <div key={ch.id} style={{ border: "1px solid #E3E6E0", borderRadius: 9, padding: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: ch.color }} />
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{ch.name}</div>
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
    (filterStatus === "All" || r.status === filterStatus) &&
    (r.title.toLowerCase().includes(search.toLowerCase()) || r.services.some(s => s.toLowerCase().includes(search.toLowerCase())))
  ).sort((a, b) => b.dateLogged.localeCompare(a.dateLogged));

  const cycleStatus = (id) => setRequests(rs => rs.map(r => r.id === id ? { ...r, status: STATUS[(STATUS.indexOf(r.status) + 1) % STATUS.length] } : r));
  const remove = (id) => setRequests(rs => rs.filter(r => r.id !== id));

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

      {open && <RequestModal user={user} majorServices={majorServices} minorServices={minorServices} onClose={() => setOpen(false)} onSave={(req) => { setRequests(rs => [...rs, req]); setOpen(false); }} />}
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
      dateLogged: new Date().toISOString().slice(0, 10),
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

function Channels({ channelStats, setChannelStats }) {
  const [selected, setSelected] = useState(CHANNELS[0].id);
  const [open, setOpen] = useState(false);
  const channel = CHANNELS.find(c => c.id === selected);
  const rows = (channelStats[selected] || []).sort((a, b) => a.month.localeCompare(b.month));

  const addEntry = (entry) => {
    setChannelStats(cs => {
      const existing = (cs[selected] || []).filter(r => r.month !== entry.month);
      const prior = [...(cs[selected] || [])].sort((a, b) => a.month.localeCompare(b.month)).filter(r => r.month < entry.month).pop();
      const growthPct = prior ? ((entry.followers - prior.followers) / prior.followers) * 100 : 0;
      return { ...cs, [selected]: [...existing, { ...entry, growthPct }] };
    });
    setOpen(false);
  };

  const last = rows[rows.length - 1];
  const growthRating = last ? rate(channel.platform, "growth", last.growthPct) : null;
  const engRating = last ? rate(channel.platform, "engagement", last.engagement30) : null;

  return (
    <div>
      <Header title="Channels" sub="Growth and engagement, logged manually per month" action={
        <button onClick={() => setOpen(true)} style={primaryBtn}><Plus size={15} /> Log Monthly Stats</button>
      } />

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {CHANNELS.map(c => (
          <button key={c.id} onClick={() => setSelected(c.id)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 20,
            border: `1px solid ${selected === c.id ? c.color : "#D8DDD5"}`, background: selected === c.id ? c.color : "#fff",
            color: selected === c.id ? "#fff" : "#0E2B27", fontSize: 12, fontWeight: 600,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: selected === c.id ? "#fff" : c.color }} /> {c.name}
          </button>
        ))}
      </div>

      {last ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 18 }}>
            <StatCard label="Current Followers" value={Number(last.followers).toLocaleString()} />
            <StatCard label="Growth Rate" value={`${last.growthPct.toFixed(2)}%`} badge={growthRating} badgeColor={RATING_COLOR[growthRating]} />
            <StatCard label="30-Day Engagement" value={`${last.engagement30}%`} badge={engRating} badgeColor={RATING_COLOR[engRating]} />
            <StatCard label="Next Month Target" value={Number(Math.round(last.followers * (1 + (last.targetGrowthPct ?? 1) / 100))).toLocaleString()} sub={`at ${(last.targetGrowthPct ?? 1)}% target`} />
          </div>

          <Card title={`${channel.name} — Follower Growth`}>
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={rows.map(r => ({ ...r, label: monthLabel(r.month) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3E6E0" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#5B675F" }} />
                <YAxis tick={{ fontSize: 11, fill: "#5B675F" }} domain={["auto", "auto"]} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #D8DDD5" }} />
                <Line type="monotone" dataKey="followers" stroke={channel.color} strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Monthly Log" style={{ marginTop: 16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead><tr style={{ textAlign: "left", color: "#5B675F", borderBottom: "1px solid #E3E6E0" }}>
                <th style={th}>Month</th><th style={th}>Followers</th><th style={th}>Growth %</th><th style={th}>Rating</th><th style={th}>30d Engagement</th><th style={th}>Rating</th>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      ) : <Card><Empty text={`No stats logged for ${channel.name} yet.`} /></Card>}

      {open && <ChannelEntryModal channel={channel} onClose={() => setOpen(false)} onSave={addEntry} lastTarget={last?.targetGrowthPct ?? 1} />}
    </div>
  );
}

function ChannelEntryModal({ channel, onClose, onSave, lastTarget }) {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [followers, setFollowers] = useState("");
  const [eng15, setEng15] = useState("");
  const [eng30, setEng30] = useState("");
  const [targetGrowthPct, setTargetGrowthPct] = useState(lastTarget);

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div className="disp" style={{ fontSize: 18, fontWeight: 600 }}>Log Stats — {channel.name}</div>
          <button onClick={onClose} style={{ border: "none", background: "transparent" }}><X size={18} /></button>
        </div>
        <label style={label}>Month</label>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)} style={{ ...inputStyle, width: "100%", marginBottom: 12 }} />
        <label style={label}>Follower count</label>
        <input type="number" value={followers} onChange={e => setFollowers(e.target.value)} placeholder="e.g. 308284" style={{ ...inputStyle, width: "100%", marginBottom: 12 }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div><label style={label}>15-day engagement %</label><input type="number" step="0.1" value={eng15} onChange={e => setEng15(e.target.value)} style={{ ...inputStyle, width: "100%" }} /></div>
          <div><label style={label}>30-day engagement %</label><input type="number" step="0.1" value={eng30} onChange={e => setEng30(e.target.value)} style={{ ...inputStyle, width: "100%" }} /></div>
        </div>
        <label style={label}>Target growth % (admin-editable, applies to next month)</label>
        <input type="number" step="0.1" value={targetGrowthPct} onChange={e => setTargetGrowthPct(e.target.value)} style={{ ...inputStyle, width: "100%", marginBottom: 20 }} />
        <button
          disabled={!followers}
          onClick={() => onSave({ month, followers: Number(followers), engagement15: Number(eng15 || 0), engagement30: Number(eng30 || 0), targetGrowthPct: Number(targetGrowthPct) })}
          style={{ ...primaryBtn, width: "100%", justifyContent: "center", opacity: !followers ? 0.5 : 1 }}
        >Save Entry</button>
      </div>
    </div>
  );
}

/* ---------------------------------- TARGETS ---------------------------------- */

function Targets({ targets, setTargets, requests, majorServices = MAJOR_SERVICES }) {
  const [open, setOpen] = useState(false);

  const progressFor = (t) => {
    const now = new Date();
    const inPeriod = requests.filter(r => {
      if (r.status !== "Completed") return false;
      const d = new Date(r.dateLogged);
      if (t.period === "week") {
        const diffDays = (now - d) / 86400000;
        return diffDays >= 0 && diffDays <= 7;
      }
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
    const count = t.scope === "channel"
      ? inPeriod.filter(r => r.channel === t.target).length
      : inPeriod.filter(r => r.services.includes(t.target)).length;
    return count;
  };

  const statusFor = (count, goal) => {
    const pct = (count / goal) * 100;
    if (pct >= 100) return { label: "Met", color: "#146356" };
    if (pct >= 60) return { label: "On Track", color: "#E8A33D" };
    return { label: "Behind", color: "#C4544A" };
  };

  return (
    <div>
      <Header title="Targets" sub="Admin-set post targets, tracked per channel and per service" action={
        <button onClick={() => setOpen(true)} style={primaryBtn}><Plus size={15} /> New Target</button>
      } />

      {targets.length === 0 ? <Card><Empty text="No targets set yet. Add one to start tracking progress." /></Card> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
          {targets.map(t => {
            const count = progressFor(t);
            const st = statusFor(count, t.goal);
            const pct = Math.min(100, (count / t.goal) * 100);
            const name = t.scope === "channel" ? CHANNELS.find(c => c.id === t.target)?.name : t.target;
            return (
              <Card key={t.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{name}</div>
                    <div style={{ fontSize: 11, color: "#5B675F", textTransform: "capitalize" }}>{t.scope} · per {t.period}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: st.color, background: st.color + "1A", padding: "3px 9px", borderRadius: 12 }}>{st.label}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                  <span className="mono">{count} / {t.goal} posts</span>
                  <span style={{ color: "#5B675F" }}>{pct.toFixed(0)}%</span>
                </div>
                <div style={{ height: 7, background: "#EEF0EC", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: st.color, borderRadius: 4 }} />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {open && <TargetModal majorServices={majorServices} onClose={() => setOpen(false)} onSave={(t) => { setTargets(ts => [...ts, t]); setOpen(false); }} />}
    </div>
  );
}

function TargetModal({ onClose, onSave, majorServices = MAJOR_SERVICES }) {
  const [scope, setScope] = useState("channel");
  const [target, setTarget] = useState(CHANNELS[0].id);
  const [period, setPeriod] = useState("week");
  const [goal, setGoal] = useState(5);

  useEffect(() => { setTarget(scope === "channel" ? CHANNELS[0].id : majorServices[0]); }, [scope]);

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div className="disp" style={{ fontSize: 18, fontWeight: 600 }}>New Target</div>
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
        <button onClick={() => onSave({ id: uid(), scope, target, period, goal })} style={{ ...primaryBtn, width: "100%", justifyContent: "center" }}>Create Target</button>
      </div>
    </div>
  );
}

/* ---------------------------------- CAPTIONS ---------------------------------- */

function Captions({ captions, setCaptions, templates, setTemplates, majorServices = MAJOR_SERVICES, minorServices = MINOR_SERVICES }) {
  const [view, setView] = useState("library"); // library | templates
  const [open, setOpen] = useState(false);
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
              {filtered.map(c => <CaptionCard key={c.id} c={c} onStatus={setStatus} onRemove={remove} />)}
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

function CaptionCard({ c, onStatus, onRemove }) {
  const [copied, setCopied] = useState(false);
  const platform = CHANNELS.find(ch => ch.id === c.channel)?.platform;
  const limit = PLATFORM_CAPTION_LIMIT[platform] || 300;
  const len = c.textEn.length;
  const over = len > limit;

  const copy = () => {
    navigator.clipboard?.writeText(c.textEn).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
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

function CaptionModal({ onClose, onSave, templates, majorServices = MAJOR_SERVICES, minorServices = MINOR_SERVICES }) {
  const [brief, setBrief] = useState("");
  const [serviceType, setServiceType] = useState("major");
  const [services, setServices] = useState([]);
  const [creativeType, setCreativeType] = useState(CREATIVE_TYPES[0]);
  const [channel, setChannel] = useState(CHANNELS[0].id);
  const [campaign, setCampaign] = useState("");
  const [textEn, setTextEn] = useState("");
  const [textFil, setTextFil] = useState("");
  const [hashtagsInput, setHashtagsInput] = useState("");
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
          <div className="disp" style={{ fontSize: 18, fontWeight: 600 }}>New Caption</div>
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
            id: uid(), brief, services, creativeType, channel, campaign, textEn, textFil,
            hashtags: hashtagsInput.split(",").map(h => h.trim()).filter(Boolean),
            status: "Draft", dateCreated: new Date().toISOString().slice(0, 10),
          })}
          style={{ ...primaryBtn, width: "100%", justifyContent: "center", opacity: (!brief || services.length === 0 || !textEn) ? 0.5 : 1 }}
        >Save Caption</button>
      </div>
    </div>
  );
}


/* ---------------------------------- SCHEDULER ---------------------------------- */

function Scheduler({ requests, setRequests, captions, setCaptions, templates, setTemplates, majorServices = MAJOR_SERVICES, minorServices = MINOR_SERVICES, extraServices = { major: [], minor: [] }, setExtraServices, isAdmin }) {
  const [view, setView] = useState("month");
  const [cursor, setCursor] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [newModalDate, setNewModalDate] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [rescheduling, setRescheduling] = useState(null);
  const [addServiceOpen, setAddServiceOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");

  const todayStr = new Date().toISOString().slice(0, 10);
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

  const fmt = (d) => d.toISOString().slice(0, 10);
  const updatePost = (id, patch) => setRequests(rs => rs.map(r => r.id === id ? { ...r, ...patch } : r));
  const removePost = (id) => { setRequests(rs => rs.filter(r => r.id !== id)); setEditingPost(null); };

  const addService = (type, name) => {
    setExtraServices(prev => {
      const key = type === "major" ? "major" : "minor";
      if (prev[key].includes(name)) return prev;
      return { ...prev, [key]: [...prev[key], name] };
    });
  };

  return (
    <div>
      <Header title="Scheduler" sub="Color-coded planning calendar across channels" action={
        <div style={{ display: "flex", gap: 8 }}>
          {isAdmin && (
            <button onClick={() => setAddServiceOpen(true)} style={{ ...primaryBtn, background: "#fff", color: "#146356", border: "1px solid #146356" }}>
              <ShieldCheck size={14} /> Add Service
            </button>
          )}
          <button onClick={() => setNewModalDate(todayStr)} style={primaryBtn}><Plus size={15} /> New Scheduled Post</button>
        </div>
      } />

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Status Dashboard</div>
          <div style={{ fontSize: 11, color: "#5B675F" }}>
            {readiness.total === 0 ? "No pending posts yet." : (
              <>Ready to post: <b style={{ color: readiness.ready === readiness.total ? "#146356" : "#E8A33D" }}>{readiness.ready}/{readiness.total}</b> pending have both caption + creative attached</>
            )}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }}>
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
              if (!d) return <div key={i} style={{ background: "#fff", minHeight: 84 }} />;
              const key = fmt(d);
              const items = byDate[key] || [];
              const isToday = key === todayStr;
              const past = isPast(key);
              const clickable = items.length > 0 || !past;
              return (
                <button key={i} disabled={!clickable} onClick={() => { if (items.length) setSelectedDay(key); else if (!past) setNewModalDate(key); }} style={{
                  background: past ? "#FAFAF8" : "#fff", minHeight: 84, padding: 6, textAlign: "left", border: "none", cursor: clickable ? "pointer" : "default",
                  display: "flex", flexDirection: "column", gap: 3, opacity: past && items.length === 0 ? 0.5 : 1,
                }}>
                  <span style={{
                    fontSize: 11, fontWeight: isToday ? 700 : 500, color: isToday ? "#fff" : (past ? "#9AA39B" : "#0E2B27"),
                    background: isToday ? "#146356" : "transparent", width: 18, height: 18, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{d.getDate()}</span>
                  {items.slice(0, 3).map(r => {
                    const svc = primaryService(r.services, extraServices.major);
                    return (
                      <div key={r.id} style={{ fontSize: 9.5, background: svc.color + "22", color: svc.color, borderRadius: 4, padding: "1px 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={svc.name}>
                        {r.title} · {svc.name}
                      </div>
                    );
                  })}
                  {items.length > 3 && <div style={{ fontSize: 9.5, color: "#9AA39B" }}>+{items.length - 3} more</div>}
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
                <div key={key} style={{ border: `1px solid ${isToday ? "#146356" : "#E3E6E0"}`, borderRadius: 8, padding: 8, minHeight: 220, background: past ? "#FAFAF8" : "#fff" }}>
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

      {addServiceOpen && <AddServiceModal onClose={() => setAddServiceOpen(false)} onAdd={addService} />}
    </div>
  );
}

function PostDetailModal({ post, captions, extraServices, onClose, onStatusChange, onProductionStatusChange, onReschedule, onRemove }) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const ch = CHANNELS.find(c => c.id === post.channel);
  const svc = primaryService(post.services, extraServices.major);
  const linkedCaption = captions.find(c => c.id === post.linkedCaptionId);
  const hasCaption = !!linkedCaption;
  const hasCreative = !!post.creativeRef;
  const readyLabel = hasCaption && hasCreative ? "Ready to post" : !hasCaption && !hasCreative ? "Needs caption & creative" : !hasCaption ? "Needs caption" : "Needs creative reference";
  const readyColor = hasCaption && hasCreative ? "#146356" : "#C4544A";

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

        <div style={{ fontSize: 11, fontWeight: 700, color: "#5B675F", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.3 }}>Caption</div>
        {linkedCaption ? (
          <div style={{ fontSize: 12.5, whiteSpace: "pre-wrap", background: "#F5F6F1", borderRadius: 8, padding: 12, marginBottom: 16 }}>{linkedCaption.textEn}</div>
        ) : (
          <div style={{ fontSize: 12, color: "#9AA39B", marginBottom: 16 }}>No caption linked yet — reschedule/edit this post to attach one.</div>
        )}

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

function AddServiceModal({ onClose, onAdd }) {
  const [type, setType] = useState("major");
  const [name, setName] = useState("");
  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div className="disp" style={{ fontSize: 18, fontWeight: 600 }}>Add Service <span style={{ fontSize: 11, fontWeight: 600, color: "#E8A33D", background: "#E8A33D1A", padding: "2px 8px", borderRadius: 10, marginLeft: 6 }}>Admin</span></div>
          <button onClick={onClose} style={{ border: "none", background: "transparent" }}><X size={18} /></button>
        </div>
        <label style={label}>Type</label>
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          <button onClick={() => setType("major")} style={pillBtn(type === "major")}>Major</button>
          <button onClick={() => setType("minor")} style={pillBtn(type === "minor")}>Minor</button>
        </div>
        <label style={label}>Service name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. NCLEX New Zealand" style={{ ...inputStyle, width: "100%", marginBottom: 20 }} />
        <button
          disabled={!name.trim()}
          onClick={() => { onAdd(type, name.trim()); onClose(); }}
          style={{ ...primaryBtn, width: "100%", justifyContent: "center", opacity: !name.trim() ? 0.5 : 1 }}
        >Add Service</button>
      </div>
    </div>
  );
}

/* ---------------------------------- SCHEDULER POST MODAL (with caption container) ---------------------------------- */

function SchedulerPostModal({ onClose, onSave, onRemove, initialDate, editingPost, captions, setCaptions, templates, setTemplates, majorServices = MAJOR_SERVICES, minorServices = MINOR_SERVICES }) {
  const todayStr = new Date().toISOString().slice(0, 10);
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
      dateLogged: editingPost?.dateLogged || new Date().toISOString().slice(0, 10),
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
        textEn: draftEn, textFil: draftFil, hashtags, status: "Draft", dateCreated: new Date().toISOString().slice(0, 10),
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


/* ---------------------------------- SHARED UI ---------------------------------- */

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
const primaryBtn = { display: "flex", alignItems: "center", gap: 6, background: "#146356", color: "#fff", border: "none", padding: "9px 15px", borderRadius: 8, fontSize: 13, fontWeight: 600 };
const navBtn = { display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, border: "1px solid #D8DDD5", background: "#fff", borderRadius: 7, color: "#0E2B27" };
const overlay = { position: "fixed", inset: 0, background: "rgba(14,43,39,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 };
const modal = { background: "#fff", borderRadius: 12, padding: 24, width: 480, maxHeight: "85vh", overflowY: "auto" };
const pillBtn = (active) => ({
  fontSize: 11, padding: "5px 10px", borderRadius: 14, border: `1px solid ${active ? "#146356" : "#D8DDD5"}`,
  background: active ? "#146356" : "#fff", color: active ? "#fff" : "#0E2B27", fontWeight: 600,
});
