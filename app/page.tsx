"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity, ArrowRight, BarChart3, Bell, CheckCircle2, ChevronDown,
  Command, Download, FileSpreadsheet, HelpCircle, Home,
  Import, LayoutDashboard, Menu, Moon, MoreHorizontal, Plus, Search,
  Settings, ShieldCheck, Sparkles, Sun, Users, X
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";

const growth = [
  { month: "Jan", customers: 7020 }, { month: "Feb", customers: 7240 },
  { month: "Mar", customers: 7580 }, { month: "Apr", customers: 7810 },
  { month: "May", customers: 8190 }, { month: "Jun", customers: 8505 },
  { month: "Jul", customers: 8964 },
];

const activities = [
  { icon: Import, tone: "blue", title: "Website orders imported", detail: "286 rows · 272 matched · 14 new", time: "12 min ago" },
  { icon: Users, tone: "violet", title: "18 duplicate records resolved", detail: "Merged by email and phone number", time: "1 hr ago" },
  { icon: CheckCircle2, tone: "green", title: "Customer record updated", detail: "Aisha Rahman · Contact details", time: "2 hrs ago" },
  { icon: Download, tone: "amber", title: "Returning customers exported", detail: "1,284 customers · CSV", time: "Yesterday" },
];

const customers = [
  { initials: "AR", name: "Aisha Rahman", email: "aisha.rahman@example.com", location: "London, UK", orders: 4, activity: "Today", status: "Returning" },
  { initials: "JM", name: "James Miller", email: "j.miller@example.com", location: "Manchester, UK", orders: 1, activity: "Yesterday", status: "One-time" },
  { initials: "SO", name: "Sofia Oliveira", email: "sofia.o@example.com", location: "Lisbon, PT", orders: 0, activity: "2 days ago", status: "Abandoned cart" },
  { initials: "DK", name: "Daniel Kim", email: "daniel.kim@example.com", location: "Birmingham, UK", orders: 3, activity: "3 days ago", status: "Returning" },
  { initials: "LN", name: "Layla Noor", email: "layla.noor@example.com", location: "Leeds, UK", orders: 0, activity: "5 days ago", status: "Needs review" },
];

const nav: Array<[string, LucideIcon]> = [
  ["Overview", LayoutDashboard], ["Customers", Users], ["Import center", Import],
  ["Analytics", BarChart3], ["Reports", FileSpreadsheet],
];

export default function Dashboard() {
  const [dark, setDark] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("cop-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(saved ? saved === "dark" : prefersDark);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("cop-theme", dark ? "dark" : "light");
  }, [dark]);

  const filtered = customers.filter((c) => `${c.name} ${c.email} ${c.location}`.toLowerCase().includes(query.toLowerCase()));
  const act = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(""), 2400); };

  return (
    <div className="app-shell">
      {mobileOpen && <button className="scrim" aria-label="Close menu" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="brand"><div className="brand-mark"><Sparkles size={17} /></div><div><b>Brands Republic</b><span>Customer operations</span></div><button className="close-mobile" onClick={() => setMobileOpen(false)}><X size={19} /></button></div>
        <div className="workspace"><div className="workspace-avatar">BR</div><div><b>Brands Republic</b><span>Operations workspace</span></div><ChevronDown size={15} /></div>
        <nav>
          <p>Workspace</p>
          {nav.map(([label, Icon], i) => <button className={i === 0 ? "active" : ""} key={label} onClick={() => act(`${label} module is ready for the next phase`)}><Icon size={17} /><span>{label}</span>{label === "Customers" && <em>8,964</em>}</button>)}
          <p className="second">Manage</p>
          <button onClick={() => act("Data quality view opened")}><ShieldCheck size={17} /><span>Data quality</span><i>24</i></button>
          <button onClick={() => act("Settings opened")}><Settings size={17} /><span>Settings</span></button>
        </nav>
        <div className="sidebar-bottom">
          <button><HelpCircle size={17} />Help & documentation</button>
          <div className="profile"><div className="avatar">AD</div><div><b>Adnan</b><span>Owner</span></div><MoreHorizontal size={17} /></div>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <button className="menu" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
          <div className="global-search"><Search size={17} /><input aria-label="Global search" placeholder="Search customers, emails, phone numbers…" value={query} onChange={(e) => setQuery(e.target.value)} /><kbd><Command size={12} /> K</kbd></div>
          <div className="top-actions"><button aria-label="Toggle theme" onClick={() => setDark(!dark)}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button><button className="notification" aria-label="Notifications"><Bell size={18} /><span /></button><button className="primary" onClick={() => act("New customer form opened")}><Plus size={17} />Add customer</button></div>
        </header>

        <div className="content">
          <section className="page-heading"><div><p>OVERVIEW</p><h1>Good afternoon, Adnan</h1><span>Here’s what’s happening with your customer operations today.</span></div><div className="heading-actions"><button onClick={() => act("Report exported successfully")}><Download size={16} />Export report</button><button className="primary" onClick={() => act("Import center opened")}><Import size={16} />Import data</button></div></section>

          <section className="metrics">
            <Metric label="Total customers" value="8,964" change="+5.4%" note="vs. last month" icon={Users} tone="blue" />
            <Metric label="Returning customers" value="1,284" change="+8.2%" note="14.3% of total" icon={Activity} tone="violet" />
            <Metric label="Abandoned carts" value="5,824" change="+2.1%" note="potential leads" icon={Home} tone="amber" />
            <Metric label="Needs review" value="24" change="-12.5%" note="data issues" icon={ShieldCheck} tone="rose" negative />
          </section>

          <section className="dashboard-grid">
            <article className="card growth-card">
              <CardHeader title="Customer growth" subtitle="Unique customers over the last 7 months"><button className="select">Last 7 months <ChevronDown size={14} /></button></CardHeader>
              <div className="chart-summary"><strong>8,964</strong><span><b>+1,944</b> since January</span></div>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%"><AreaChart data={growth} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}><defs><linearGradient id="blueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.22}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)"/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }}/><Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} /><Area type="monotone" dataKey="customers" stroke="#3b82f6" strokeWidth={2.5} fill="url(#blueFill)" /></AreaChart></ResponsiveContainer>
              </div>
            </article>

            <article className="card status-card">
              <CardHeader title="Customer status" subtitle="Current database distribution"><button className="icon-button"><MoreHorizontal size={18} /></button></CardHeader>
              <div className="donut-row"><div className="donut"><div><strong>8,964</strong><span>Total</span></div></div><div className="legend"><Legend color="#3b82f6" label="Purchased" value="4,110" percent="45.8%"/><Legend color="#8b5cf6" label="Abandoned cart" value="3,565" percent="39.8%"/><Legend color="#f59e0b" label="Both" value="1,265" percent="14.1%"/><Legend color="#ef4444" label="Needs review" value="24" percent="0.3%"/></div></div>
              <button className="text-link" onClick={() => act("Analytics view opened")}>View detailed analytics <ArrowRight size={15} /></button>
            </article>

            <article className="card quick-card">
              <CardHeader title="Quick actions" subtitle="Common tasks, one click away" />
              <div className="quick-grid"><Quick icon={Plus} label="Add customer" detail="Create a new record" onClick={() => act("New customer form opened")}/><Quick icon={Import} label="Import data" detail="CSV or Excel files" onClick={() => act("Import center opened")}/><Quick icon={Download} label="Export report" detail="Build a custom export" onClick={() => act("Report builder opened")}/><Quick icon={ShieldCheck} label="Review issues" detail="24 records need attention" onClick={() => act("Data quality view opened")}/></div>
            </article>

            <article className="card activity-card">
              <CardHeader title="Recent activity" subtitle="Latest workspace changes"><button className="text-button">View all</button></CardHeader>
              <div className="activity-list">{activities.map(({ icon: Icon, tone, title, detail, time }) => <div className="activity-item" key={title}><div className={`activity-icon ${tone}`}><Icon size={16}/></div><div><b>{title}</b><span>{detail}</span></div><time>{time}</time></div>)}</div>
            </article>
          </section>

          <section className="card customers-card">
            <CardHeader title="Recently active customers" subtitle="Customers with activity in the last 7 days"><button className="text-button">View all customers <ArrowRight size={14}/></button></CardHeader>
            <div className="table-wrap"><table><thead><tr><th>Customer</th><th>Location</th><th>Orders</th><th>Last activity</th><th>Status</th><th></th></tr></thead><tbody>{filtered.map(c => <tr key={c.email}><td><div className="customer"><div className="customer-avatar">{c.initials}</div><div><b>{c.name}</b><span>{c.email}</span></div></div></td><td>{c.location}</td><td>{c.orders}</td><td>{c.activity}</td><td><span className={`badge ${c.status.toLowerCase().replace(" ", "-")}`}>{c.status}</span></td><td><button className="icon-button"><MoreHorizontal size={17}/></button></td></tr>)}</tbody></table>{filtered.length === 0 && <div className="empty">No customers match “{query}”</div>}</div>
          </section>
          <footer><span>Customer Operations Platform</span><span>Data synced 12 minutes ago</span></footer>
        </div>
      </main>
      {notice && <div className="toast"><CheckCircle2 size={17}/>{notice}</div>}
    </div>
  );
}

type MetricProps = { label: string; value: string; change: string; note: string; icon: LucideIcon; tone: string; negative?: boolean };
type CardHeaderProps = { title: string; subtitle: string; children?: ReactNode };
type LegendProps = { color: string; label: string; value: string; percent: string };
type QuickProps = { icon: LucideIcon; label: string; detail: string; onClick: () => void };

function Metric({ label, value, change, note, icon: Icon, tone, negative = false }: MetricProps) { return <article className="metric card"><div className={`metric-icon ${tone}`}><Icon size={18}/></div><span>{label}</span><strong>{value}</strong><div className={negative ? "down" : "up"}>{change} <small>{note}</small></div></article>; }
function CardHeader({ title, subtitle, children }: CardHeaderProps) { return <div className="card-header"><div><h2>{title}</h2><p>{subtitle}</p></div>{children}</div>; }
function Legend({ color, label, value, percent }: LegendProps) { return <div className="legend-row"><span className="dot" style={{ background: color }}/><b>{label}</b><span>{value}</span><em>{percent}</em></div>; }
function Quick({ icon: Icon, label, detail, onClick }: QuickProps) { return <button className="quick" onClick={onClick}><div><Icon size={17}/></div><span><b>{label}</b><small>{detail}</small></span><ArrowRight size={15}/></button>; }
