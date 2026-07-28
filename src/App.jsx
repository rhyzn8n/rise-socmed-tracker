import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line, Legend
} from "recharts";
import {
  LayoutDashboard, ClipboardList, TrendingUp, Target, Plus, X,
  ChevronDown, Filter, ArrowUp, ArrowDown, CheckCircle2, Clock,
  Circle, Search, AlertTriangle, ChevronUp
} from "lucide-react";

/* ---------------------------------- DATA ---------------------------------- */

const MAJOR_SERVICES = ["NCLEX Australia","NCLEX Canada","NCLEX USA","Middle East","Ireland","UKNMC/Midwife","Online Review"];
const MINOR_SERVICES = ["NAI","Tourist Visa","Visascreen","License Endorsement","OPRA/KAPS","Australia Midwifery","ASCPi","AUS License Renewal","Branch Info","CBC","Truemerit","CPD","CVS NZ/NCNZ","FAQ/Trivia","Featured Clients","General Post","Hope Talk","Hopkins","IELTS Sced","IPASS Cares","Live Video","Medtech Middle East","MET","Motivational","NCLEX Question","NCLEX Answer","New Mexico","NNAS","PNLE","PRC","Promo","NCLEX Q&AI","Score Transfer","Study Tips/Trivia","UWORLD","US License Renewal","WES","Blog","YT Post"];
const CREATIVE_TYPES = ["Infographics/Information","Blog Cover","Motivational Content","Promo","Reel/Video/Animation","Educational","Event","Passers","Testimonial"];
const ALL_SERVICES = [...MAJOR_SERVICES, ...MINOR_SERVICES];

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

const BENCHMARKS = {
  Facebook:  { growth: [[0.5,"Low"],[1,"Healthy"],[2,"Good"],[3,"Very Good"],[Infinity,"Excellent"]], engagement: [[0.5,"Low"],[1,"Average"],[2,"Strong"],[3,"Excellent"],[Infinity,"Top-Performing"]] },
  Instagram: { growth: [[0.5,"Low"],[1.5,"Healthy"],[3,"Good"],[5,"Very Good"],[Infinity,"Excellent"]], engagement: [[0.3,"Low"],[0.6,"Healthy"],[1.5,"Good"],[3,"Very Good"],[Infinity,"Excellent"]] },
  TikTok:    { growth: [[1,"Low"],[2.5,"Healthy"],[5,"Good"],[8,"Very Good"],[Infinity,"Excellent"]], engagement: [[1,"Low"],[2.5,"Healthy"],[4,"Good"],[6,"Very Good"],[Infinity,"Excellent"]] },
  YouTube:   { growth: [[0.3,"Low"],[0.8,"Healthy"],[1.5,"Good"],[3,"Very Good"],[Infinity,"Excellent"]], engagement: [[0.5,"Low"],[1,"Healthy"],[2,"Good"],[4,"Very Good"],[Infinity,"Excellent"]] },
};
const RATING_COLOR = { "Low": "#C4544A", "Healthy": "#E8A33D", "Average": "#E8A33D", "Good": "#4C8C6B", "Strong": "#4C8C6B", "Very Good": "#2E7D6B", "Excellent": "#146356", "Top-Performing": "#0E2B27" };

function rate(platform, kind, value) {
  const tiers = BENCHMARKS[platform]?.[kind];
  if (!tiers) return "—";
  for (const [max, label] of tiers) if (value < max) return label;
  return tiers[tiers.length - 1][1];
}

const monthLabel = (ym) => new Date(ym + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" });
const uid = () => Math.random().toString(36).slice(2, 10);

/* ---------------------------------- APP ---------------------------------- */

export default function RiseSocMedTracker() {
  const [tab, setTab] = useState("dashboard");
  const [requests, setRequests] = useState([]);
  const [channelStats, setChannelStats] = useState({});
  const [targets, setTargets] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // NOTE: storage is temporary and in-memory only until Firebase is wired in (Step 3).
  // window.storage only exists inside Claude's artifact preview, so every call is guarded here.
  useEffect(() => {
    (async () => {
      try {
        if (!window.storage) return;
        const [r, c, t] = await Promise.all([
          window.storage.get("requests").catch(() => null),
          window.storage.get("channelStats").catch(() => null),
          window.storage.get("targets").catch(() => null),
        ]);
        if (r) setRequests(JSON.parse(r.value));
        if (c) setChannelStats(JSON.parse(c.value));
        if (t) setTargets(JSON.parse(t.value));
      } finally { setLoaded(true); }
    })();
  }, []);

  useEffect(() => { if (loaded && window.storage) window.storage.set("requests", JSON.stringify(requests)).catch(() => {}); }, [requests, loaded]);
  useEffect(() => { if (loaded && window.storage) window.storage.set("channelStats", JSON.stringify(channelStats)).catch(() => {}); }, [channelStats, loaded]);
  useEffect(() => { if (loaded && window.storage) window.storage.set("targets", JSON.stringify(targets)).catch(() => {}); }, [targets, loaded]);

  const NAV = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "requests",  label: "Requests",  icon: ClipboardList },
    { id: "channels",  label: "Channels",  icon: TrendingUp },
    { id: "targets",   label: "Targets",   icon: Target },
  ];

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
      <div style={{ width: 208, background: "#0E2B27", color: "#F5F6F1", padding: "22px 14px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, marginBottom: 4, paddingLeft: 6 }}>
          {[6, 10, 14, 19].map((h, i) => (
            <div key={i} style={{ width: 4, height: h, background: "#E8A33D", borderRadius: 1, opacity: 0.5 + i * 0.15 }} />
          ))}
        </div>
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
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, padding: "26px 32px", overflowY: "auto", maxHeight: 620 }}>
        {tab === "dashboard" && <Dashboard requests={requests} channelStats={channelStats} targets={targets} />}
        {tab === "requests"  && <Requests requests={requests} setRequests={setRequests} />}
        {tab === "channels"  && <Channels channelStats={channelStats} setChannelStats={setChannelStats} />}
        {tab === "targets"   && <Targets targets={targets} setTargets={setTargets} requests={requests} />}
      </div>
    </div>
  );
}

/* ---------------------------------- DASHBOARD ---------------------------------- */

function Dashboard({ requests, channelStats, targets }) {
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
    ALL_SERVICES.forEach(s => { counts[s] = 0; });
    monthRequests.forEach(r => r.services.forEach(s => { if (counts[s] !== undefined) counts[s] += 1; }));
    const list = Object.entries(counts).map(([name, count]) => ({ name, count }));
    const flagged = list.filter(s => s.count === 0).sort((a, b) => a.name.localeCompare(b.name));
    const covered = list.filter(s => s.count > 0).sort((a, b) => b.count - a.count);
    return { flagged, covered, total: list.length };
  }, [monthRequests]);

  const byCreative = useMemo(() => {
    const counts = {};
    requests.forEach(r => { counts[r.creativeType] = (counts[r.creativeType] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [requests]);

  const PIE_COLORS = ["#146356", "#E8A33D", "#4C8C6B", "#B0538A", "#3E7CB1", "#C4544A", "#2E7D6B", "#9AA39B", "#0E2B27"];
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
        <Card title="Requests per Service">
          {byService.length === 0 ? <Empty text="Log a request to see the breakdown." /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byService} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3E6E0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#5B675F" }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11, fill: "#0E2B27" }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #D8DDD5" }} />
                <Bar dataKey="count" fill="#146356" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card title="Requests by Creative Type">
          {byCreative.length === 0 ? <Empty text="No creative type data yet." /> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={byCreative} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={{ fontSize: 10 }}>
                  {byCreative.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #D8DDD5" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
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

function Requests({ requests, setRequests }) {
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

      {open && <RequestModal onClose={() => setOpen(false)} onSave={(req) => { setRequests(rs => [...rs, req]); setOpen(false); }} />}
    </div>
  );
}

function RequestModal({ onClose, onSave }) {
  const [title, setTitle] = useState("");
  const [serviceType, setServiceType] = useState("major");
  const [services, setServices] = useState([]);
  const [creativeType, setCreativeType] = useState(CREATIVE_TYPES[0]);
  const [channel, setChannel] = useState(CHANNELS[0].id);
  const list = serviceType === "major" ? MAJOR_SERVICES : MINOR_SERVICES;

  const toggleService = (s) => setServices(cur => cur.includes(s) ? cur.filter(x => x !== s) : [...cur, s]);

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div className="disp" style={{ fontSize: 18, fontWeight: 600 }}>New Request</div>
          <button onClick={onClose} style={{ border: "none", background: "transparent" }}><X size={18} /></button>
        </div>

        <label style={label}>Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. May PNLE promo carousel" style={{ ...inputStyle, width: "100%", marginBottom: 14 }} />

        <label style={label}>Service tags</label>
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          <button onClick={() => setServiceType("major")} style={pillBtn(serviceType === "major")}>Major</button>
          <button onClick={() => setServiceType("minor")} style={pillBtn(serviceType === "minor")}>Minor</button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 120, overflowY: "auto", border: "1px solid #E3E6E0", borderRadius: 8, padding: 8, marginBottom: 6 }}>
          {list.map(s => (
            <button key={s} onClick={() => toggleService(s)} style={pillBtn(services.includes(s))}>{s}</button>
          ))}
        </div>
        {services.length > 0 && <div style={{ fontSize: 11, color: "#5B675F", marginBottom: 14 }}>{services.length} tagged: {services.join(", ")}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <div>
            <label style={label}>Creative type</label>
            <select value={creativeType} onChange={e => setCreativeType(e.target.value)} style={{ ...inputStyle, width: "100%" }}>
              {CREATIVE_TYPES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Channel</label>
            <select value={channel} onChange={e => setChannel(e.target.value)} style={{ ...inputStyle, width: "100%" }}>
              {CHANNELS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <button
          disabled={!title || services.length === 0}
          onClick={() => onSave({ id: uid(), title, services, creativeType, channel, status: "Pending", dateLogged: new Date().toISOString().slice(0, 10) })}
          style={{ ...primaryBtn, width: "100%", justifyContent: "center", opacity: (!title || services.length === 0) ? 0.5 : 1 }}
        >
          Log Request
        </button>
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

function Targets({ targets, setTargets, requests }) {
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

      {open && <TargetModal onClose={() => setOpen(false)} onSave={(t) => { setTargets(ts => [...ts, t]); setOpen(false); }} />}
    </div>
  );
}

function TargetModal({ onClose, onSave }) {
  const [scope, setScope] = useState("channel");
  const [target, setTarget] = useState(CHANNELS[0].id);
  const [period, setPeriod] = useState("week");
  const [goal, setGoal] = useState(5);

  useEffect(() => { setTarget(scope === "channel" ? CHANNELS[0].id : MAJOR_SERVICES[0]); }, [scope]);

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
          {(scope === "channel" ? CHANNELS : MAJOR_SERVICES.map(s => ({ id: s, name: s }))).map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
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
const overlay = { position: "fixed", inset: 0, background: "rgba(14,43,39,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 };
const modal = { background: "#fff", borderRadius: 12, padding: 24, width: 480, maxHeight: "85vh", overflowY: "auto" };
const pillBtn = (active) => ({
  fontSize: 11, padding: "5px 10px", borderRadius: 14, border: `1px solid ${active ? "#146356" : "#D8DDD5"}`,
  background: active ? "#146356" : "#fff", color: active ? "#fff" : "#0E2B27", fontWeight: 600,
});
