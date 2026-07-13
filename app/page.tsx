"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity, AlertTriangle, ArrowRight, BarChart3, Bell, Check, CheckCircle2,
  ChevronDown, CircleHelp, Command, Download, FileSpreadsheet, HelpCircle,
  Import, LayoutDashboard, Menu, Moon, MoreHorizontal, Plus, Search, Settings,
  ShieldCheck, Sparkles, Sun, Trash2, UploadCloud, UserRound, Users, X
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";

type View = "Overview" | "Customers" | "Import center" | "Analytics" | "Reports" | "Data quality" | "Settings";
type Status = "Returning" | "One-time" | "Abandoned cart" | "Needs review";
type Customer = { id: string; initials: string; name: string; email: string; phone: string; location: string; orders: number; activity: string; status: Status };
type Modal = "add" | "import" | "notifications" | "profile" | "help" | "customer" | null;

const growth = [
  { month: "Jan", customers: 7020 }, { month: "Feb", customers: 7240 },
  { month: "Mar", customers: 7580 }, { month: "Apr", customers: 7810 },
  { month: "May", customers: 8190 }, { month: "Jun", customers: 8505 },
  { month: "Jul", customers: 8964 },
];

const seedCustomers: Customer[] = [
  { id: "1", initials: "AR", name: "Aisha Rahman", email: "aisha.rahman@example.com", phone: "+44 7700 900121", location: "London, UK", orders: 4, activity: "Today", status: "Returning" },
  { id: "2", initials: "JM", name: "James Miller", email: "j.miller@example.com", phone: "+44 7700 900122", location: "Manchester, UK", orders: 1, activity: "Yesterday", status: "One-time" },
  { id: "3", initials: "SO", name: "Sofia Oliveira", email: "sofia.o@example.com", phone: "+351 910 000 123", location: "Lisbon, PT", orders: 0, activity: "2 days ago", status: "Abandoned cart" },
  { id: "4", initials: "DK", name: "Daniel Kim", email: "daniel.kim@example.com", phone: "+44 7700 900124", location: "Birmingham, UK", orders: 3, activity: "3 days ago", status: "Returning" },
  { id: "5", initials: "LN", name: "Layla Noor", email: "layla.noor@example.com", phone: "+44 7700 900125", location: "Leeds, UK", orders: 0, activity: "5 days ago", status: "Needs review" },
  { id: "6", initials: "ET", name: "Elliot Turner", email: "elliot.t@example.com", phone: "+44 7700 900126", location: "Bristol, UK", orders: 2, activity: "6 days ago", status: "Returning" },
  { id: "7", initials: "MA", name: "Mina Ahmed", email: "mina.a@example.com", phone: "+44 7700 900127", location: "Cardiff, UK", orders: 1, activity: "6 days ago", status: "One-time" },
];

const activities = [
  { icon: Import, tone: "blue", title: "Website orders imported", detail: "286 rows · 272 matched · 14 new", time: "12 min ago" },
  { icon: Users, tone: "violet", title: "18 duplicate records resolved", detail: "Merged by email and phone number", time: "1 hr ago" },
  { icon: CheckCircle2, tone: "green", title: "Customer record updated", detail: "Aisha Rahman · Contact details", time: "2 hrs ago" },
  { icon: Download, tone: "amber", title: "Returning customers exported", detail: "1,284 customers · CSV", time: "Yesterday" },
];

const nav: Array<[View, LucideIcon]> = [
  ["Overview", LayoutDashboard], ["Customers", Users], ["Import center", Import],
  ["Analytics", BarChart3], ["Reports", FileSpreadsheet],
];

export default function Dashboard() {
  const [dark, setDark] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [view, setView] = useState<View>("Overview");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | Status>("All");
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState<Modal>(null);
  const [customers, setCustomers] = useState(seedCustomers);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [notifications, setNotifications] = useState(3);
  const [saved, setSaved] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("cop-theme");
    setDark(savedTheme ? savedTheme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("cop-theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault(); searchRef.current?.focus();
      }
      if (event.key === "Escape") { setModal(null); setMobileOpen(false); }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);

  const filtered = useMemo(() => customers.filter((customer) => {
    const matchesSearch = `${customer.name} ${customer.email} ${customer.phone} ${customer.location}`.toLowerCase().includes(query.toLowerCase());
    return matchesSearch && (statusFilter === "All" || customer.status === statusFilter);
  }), [customers, query, statusFilter]);

  const act = (message: string) => {
    setNotice(message); window.setTimeout(() => setNotice(""), 2600);
  };

  const navigate = (next: View) => {
    setView(next); setMobileOpen(false); setQuery(""); window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const exportCsv = (kind = "customer-report") => {
    const rows = [["Name", "Email", "Phone", "Location", "Orders", "Status"], ...filtered.map(c => [c.name, c.email, c.phone, c.location, String(c.orders), c.status])];
    const csv = rows.map(row => row.map(value => `"${value.replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `${kind}-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url);
    act("CSV report downloaded");
  };

  const addCustomer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const initials = name.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase();
    setCustomers(current => [{ id: crypto.randomUUID(), initials, name, email, phone: String(data.get("phone") || "—"), location: String(data.get("location") || "Not provided"), orders: 0, activity: "Just now", status: String(data.get("status")) as Status }, ...current]);
    setModal(null); act(`${name} was added successfully`);
  };

  const archiveCustomer = (customer: Customer) => {
    setCustomers(current => current.filter(item => item.id !== customer.id));
    setSelected(null); setModal(null); act(`${customer.name} was archived`);
  };

  return (
    <div className="app-shell">
      {mobileOpen && <button className="scrim" aria-label="Close menu" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="brand"><div className="brand-mark"><Sparkles size={17} /></div><div><b>Brands Republic</b><span>Customer operations</span></div><button className="close-mobile" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X size={19} /></button></div>
        <button className="workspace" onClick={() => act("Brands Republic workspace selected")}><div className="workspace-avatar">BR</div><div><b>Brands Republic</b><span>Operations workspace</span></div><ChevronDown size={15} /></button>
        <nav aria-label="Main navigation">
          <p>Workspace</p>
          {nav.map(([label, Icon]) => <button className={view === label ? "active" : ""} aria-current={view === label ? "page" : undefined} key={label} onClick={() => navigate(label)}><Icon size={17} /><span>{label}</span>{label === "Customers" && <em>{customers.length}</em>}</button>)}
          <p className="second">Manage</p>
          <button className={view === "Data quality" ? "active" : ""} onClick={() => navigate("Data quality")}><ShieldCheck size={17} /><span>Data quality</span><i>24</i></button>
          <button className={view === "Settings" ? "active" : ""} onClick={() => navigate("Settings")}><Settings size={17} /><span>Settings</span></button>
        </nav>
        <div className="sidebar-bottom">
          <button onClick={() => setModal("help")}><HelpCircle size={17} />Help & documentation</button>
          <button className="profile" onClick={() => setModal("profile")}><div className="avatar">AD</div><div><b>Adnan</b><span>Owner</span></div><MoreHorizontal size={17} /></button>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <button className="menu" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
          <div className="global-search"><Search size={17} /><input ref={searchRef} aria-label="Global search" placeholder="Search customers, emails, phone numbers…" value={query} onChange={(e) => setQuery(e.target.value)} /><kbd><Command size={12} /> K</kbd>{query && <button aria-label="Clear search" onClick={() => setQuery("")}><X size={15}/></button>}</div>
          <div className="top-actions"><button aria-label="Toggle theme" title="Toggle theme" onClick={() => setDark(!dark)}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button><button className="notification" aria-label={`Notifications, ${notifications} unread`} onClick={() => setModal("notifications")}><Bell size={18} />{notifications > 0 && <span />}</button><button className="primary" onClick={() => setModal("add")}><Plus size={17} />Add customer</button></div>
        </header>

        <div className="content">
          <PageHeading view={view} onExport={() => exportCsv()} onImport={() => setModal("import")} onAdd={() => setModal("add")} />
          {view === "Overview" && <Overview customers={customers} filtered={filtered.slice(0, 5)} onNavigate={navigate} onModal={setModal} onSelect={(customer) => { setSelected(customer); setModal("customer"); }} onExport={exportCsv} />}
          {view === "Customers" && <CustomersView customers={filtered} query={query} filter={statusFilter} setFilter={setStatusFilter} onAdd={() => setModal("add")} onSelect={(customer) => { setSelected(customer); setModal("customer"); }} />}
          {view === "Import center" && <ImportView onImport={() => setModal("import")} />}
          {view === "Analytics" && <AnalyticsView />}
          {view === "Reports" && <ReportsView onExport={exportCsv} />}
          {view === "Data quality" && <QualityView onResolve={(message) => act(message)} />}
          {view === "Settings" && <SettingsView saved={saved} onSave={() => { setSaved(true); act("Workspace settings saved"); window.setTimeout(() => setSaved(false), 2400); }} />}
          <footer><span>Customer Operations Platform</span><span>Data synced 12 minutes ago</span></footer>
        </div>
      </main>

      {modal === "add" && <Dialog title="Add customer" subtitle="Create a complete customer record." onClose={() => setModal(null)}><form className="form-grid" onSubmit={addCustomer}><Field label="Full name"><input name="name" required autoFocus placeholder="e.g. Maya Thompson" /></Field><Field label="Email address"><input name="email" required type="email" placeholder="maya@example.com" /></Field><Field label="Phone number"><input name="phone" type="tel" placeholder="+44 7700 900000" /></Field><Field label="Location"><input name="location" placeholder="London, UK" /></Field><Field label="Customer status" wide><select name="status" defaultValue="One-time"><option>One-time</option><option>Returning</option><option>Abandoned cart</option><option>Needs review</option></select></Field><div className="dialog-actions wide"><button type="button" onClick={() => setModal(null)}>Cancel</button><button className="primary" type="submit"><Plus size={16}/>Add customer</button></div></form></Dialog>}
      {modal === "import" && <Dialog title="Import customer data" subtitle="Upload a CSV or Excel file to update your database." onClose={() => setModal(null)}><div className="upload-zone"><UploadCloud size={28}/><b>Choose a file to import</b><span>CSV or XLSX, up to 10 MB</span><label className="primary">Browse files<input type="file" accept=".csv,.xlsx" onChange={(e) => { if (e.target.files?.[0]) { setModal(null); act(`${e.target.files[0].name} queued for import`); } }}/></label></div><div className="import-hint"><ShieldCheck size={17}/><span><b>Automatic duplicate protection</b>Your data is validated before any records are changed.</span></div></Dialog>}
      {modal === "notifications" && <Popover title="Notifications" onClose={() => setModal(null)}><div className="notification-list"><Notice title="Import completed" detail="Website orders · 286 rows" time="12m"/><Notice title="24 records need review" detail="Missing or conflicting customer data" time="1h"/><Notice title="Weekly report is ready" detail="Customer performance · 7–13 July" time="3h"/></div><button className="full-button" onClick={() => { setNotifications(0); setModal(null); act("All notifications marked as read"); }}><Check size={15}/>Mark all as read</button></Popover>}
      {modal === "profile" && <Popover title="Account" onClose={() => setModal(null)}><div className="account-card"><div className="avatar large">AD</div><div><b>Adnan</b><span>adnan@brandsrepublic.co.uk</span></div></div><button className="menu-row" onClick={() => { setModal(null); navigate("Settings"); }}><Settings size={16}/>Account settings</button><button className="menu-row" onClick={() => act("Sign out requires your production identity provider")}><UserRound size={16}/>Sign out</button></Popover>}
      {modal === "help" && <Dialog title="Help & documentation" subtitle="Answers for common customer operations tasks." onClose={() => setModal(null)}><div className="help-list"><HelpItem title="Importing customer data" text="Prepare CSV or Excel files and safely merge duplicate records."/><HelpItem title="Managing customer records" text="Create, search, filter, review, and archive customer profiles."/><HelpItem title="Reports and analytics" text="Understand customer growth and export shareable reports."/></div><button className="full-button" onClick={() => { setModal(null); act("Support request started"); }}><CircleHelp size={16}/>Contact support</button></Dialog>}
      {modal === "customer" && selected && <Dialog title={selected.name} subtitle="Customer profile and recent account details." onClose={() => setModal(null)}><div className="customer-detail"><div className="customer-avatar large">{selected.initials}</div><div><b>{selected.email}</b><span>{selected.phone}</span><span>{selected.location}</span></div><span className={`badge ${slug(selected.status)}`}>{selected.status}</span></div><div className="detail-stats"><div><span>Orders</span><b>{selected.orders}</b></div><div><span>Last activity</span><b>{selected.activity}</b></div><div><span>Customer ID</span><b>BR-{selected.id.slice(0, 6).toUpperCase()}</b></div></div><div className="dialog-actions"><button className="danger" onClick={() => archiveCustomer(selected)}><Trash2 size={15}/>Archive</button><button className="primary" onClick={() => { setModal(null); act(`${selected.name}'s profile is ready to edit`); }}>Edit profile</button></div></Dialog>}
      {notice && <div className="toast" role="status"><CheckCircle2 size={17}/>{notice}</div>}
    </div>
  );
}

function PageHeading({ view, onExport, onImport, onAdd }: { view: View; onExport: () => void; onImport: () => void; onAdd: () => void }) {
  const copy: Record<View, [string, string]> = {
    Overview: ["Good afternoon, Adnan", "Here’s what’s happening with your customer operations today."],
    Customers: ["Customers", "Search, filter, and manage every customer record."],
    "Import center": ["Import center", "Bring customer data into one clean, reliable database."],
    Analytics: ["Analytics", "Understand growth, retention, and customer behaviour."],
    Reports: ["Reports", "Create shareable exports for your team and stakeholders."],
    "Data quality": ["Data quality", "Resolve duplicates and incomplete records before they cause problems."],
    Settings: ["Workspace settings", "Manage preferences, notifications, and data controls."],
  };
  return <section className="page-heading"><div><p>{view.toUpperCase()}</p><h1>{copy[view][0]}</h1><span>{copy[view][1]}</span></div><div className="heading-actions">{view === "Overview" && <><button onClick={onExport}><Download size={16}/>Export report</button><button className="primary" onClick={onImport}><Import size={16}/>Import data</button></>}{view === "Customers" && <button className="primary" onClick={onAdd}><Plus size={16}/>Add customer</button>}</div></section>;
}

function Overview({ customers, filtered, onNavigate, onModal, onSelect, onExport }: { customers: Customer[]; filtered: Customer[]; onNavigate: (view: View) => void; onModal: (modal: Modal) => void; onSelect: (customer: Customer) => void; onExport: (kind?: string) => void }) {
  return <>
    <section className="metrics"><Metric label="Total customers" value="8,964" change="+5.4%" note="vs. last month" icon={Users} tone="blue"/><Metric label="Returning customers" value="1,284" change="+8.2%" note="14.3% of total" icon={Activity} tone="violet"/><Metric label="Abandoned carts" value="5,824" change="+2.1%" note="potential leads" icon={AlertTriangle} tone="amber"/><Metric label="Needs review" value="24" change="-12.5%" note="data issues" icon={ShieldCheck} tone="rose" negative/></section>
    <section className="dashboard-grid">
      <article className="card growth-card"><CardHeader title="Customer growth" subtitle="Unique customers over the last 7 months"><select className="select" aria-label="Chart date range" defaultValue="7"><option value="7">Last 7 months</option><option value="6">Last 6 months</option><option value="3">Last 3 months</option></select></CardHeader><div className="chart-summary"><strong>8,964</strong><span><b>+1,944</b> since January</span></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={growth} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}><defs><linearGradient id="blueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.22}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)"/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }}/><Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }}/><Area type="monotone" dataKey="customers" stroke="#3b82f6" strokeWidth={2.5} fill="url(#blueFill)"/></AreaChart></ResponsiveContainer></div></article>
      <article className="card status-card"><CardHeader title="Customer status" subtitle="Current database distribution"/><div className="donut-row"><div className="donut"><div><strong>8,964</strong><span>Total</span></div></div><div className="legend"><Legend color="#3b82f6" label="Purchased" value="4,110" percent="45.8%"/><Legend color="#8b5cf6" label="Abandoned cart" value="3,565" percent="39.8%"/><Legend color="#f59e0b" label="Both" value="1,265" percent="14.1%"/><Legend color="#ef4444" label="Needs review" value="24" percent="0.3%"/></div></div><button className="text-link" onClick={() => onNavigate("Analytics")}>View detailed analytics <ArrowRight size={15}/></button></article>
      <article className="card quick-card"><CardHeader title="Quick actions" subtitle="Common tasks, one click away"/><div className="quick-grid"><Quick icon={Plus} label="Add customer" detail="Create a new record" onClick={() => onModal("add")}/><Quick icon={Import} label="Import data" detail="CSV or Excel files" onClick={() => onModal("import")}/><Quick icon={Download} label="Export report" detail="Download customer CSV" onClick={() => onExport()}/><Quick icon={ShieldCheck} label="Review issues" detail="24 records need attention" onClick={() => onNavigate("Data quality")}/></div></article>
      <article className="card activity-card"><CardHeader title="Recent activity" subtitle="Latest workspace changes"><button className="text-button" onClick={() => onNavigate("Reports")}>View all</button></CardHeader><div className="activity-list">{activities.map(({ icon: Icon, tone, title, detail, time }) => <div className="activity-item" key={title}><div className={`activity-icon ${tone}`}><Icon size={16}/></div><div><b>{title}</b><span>{detail}</span></div><time>{time}</time></div>)}</div></article>
    </section>
    <section className="card customers-card"><CardHeader title="Recently active customers" subtitle={`${customers.length} customer records available`}><button className="text-button" onClick={() => onNavigate("Customers")}>View all customers <ArrowRight size={14}/></button></CardHeader><CustomerTable customers={filtered} onSelect={onSelect}/></section>
  </>;
}

function CustomersView({ customers, query, filter, setFilter, onAdd, onSelect }: { customers: Customer[]; query: string; filter: string; setFilter: (value: "All" | Status) => void; onAdd: () => void; onSelect: (customer: Customer) => void }) {
  return <section className="card customers-card full-page-card"><div className="toolbar"><div><b>{customers.length} records</b><span>{query ? ` matching “${query}”` : " in this view"}</span></div><select aria-label="Filter by status" value={filter} onChange={e => setFilter(e.target.value as "All" | Status)}><option>All</option><option>Returning</option><option>One-time</option><option>Abandoned cart</option><option>Needs review</option></select></div>{customers.length ? <CustomerTable customers={customers} onSelect={onSelect}/> : <EmptyState icon={Search} title="No customers found" text="Try a different search or status filter." action="Add customer" onAction={onAdd}/>}</section>;
}

function ImportView({ onImport }: { onImport: () => void }) { return <div className="two-column"><section className="card import-panel"><UploadCloud size={34}/><h2>Import customer data</h2><p>Upload a CSV or Excel file. We’ll check column mappings, duplicates, and invalid rows before making changes.</p><button className="primary" onClick={onImport}><Import size={16}/>Choose a file</button><span>Maximum file size: 10 MB</span></section><section className="card"><CardHeader title="Recent imports" subtitle="Files processed in the last 30 days"/><div className="simple-list"><ListRow title="website-orders-july.csv" detail="286 rows · 14 new customers" badge="Completed"/><ListRow title="newsletter-subscribers.xlsx" detail="1,042 rows · 36 duplicates" badge="Completed"/><ListRow title="retail-locations.csv" detail="418 rows · 8 require review" badge="Review"/></div></section></div>; }

function AnalyticsView() { return <><section className="metrics"><Metric label="Retention rate" value="68.4%" change="+4.2%" note="vs. last quarter" icon={Activity} tone="blue"/><Metric label="Avg. order value" value="£84.20" change="+6.1%" note="vs. last month" icon={BarChart3} tone="violet"/><Metric label="Repeat purchase" value="31.8%" change="+2.8%" note="customer rate" icon={Users} tone="amber"/><Metric label="Data confidence" value="99.2%" change="+0.6%" note="verified records" icon={ShieldCheck} tone="rose"/></section><section className="card analytics-card"><CardHeader title="Customer growth trend" subtitle="Monthly unique customer records"/><div className="chart-wrap tall"><ResponsiveContainer width="100%" height="100%"><AreaChart data={growth}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)"/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }}/><Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10 }}/><Area type="monotone" dataKey="customers" stroke="#3b82f6" strokeWidth={3} fill="#3b82f622"/></AreaChart></ResponsiveContainer></div></section></>; }

function ReportsView({ onExport }: { onExport: (kind?: string) => void }) { const reports = [["Customer database", "All active customer records and contact details."], ["Returning customers", "Customers with two or more completed orders."], ["Data quality review", "Incomplete, duplicate, and conflicting records."], ["Abandoned cart leads", "Potential customers who left checkout early."]]; return <div className="report-grid">{reports.map(([title, text]) => <article className="card report-card" key={title}><div className="report-icon"><FileSpreadsheet size={20}/></div><h2>{title}</h2><p>{text}</p><span>CSV · Updated 12 minutes ago</span><button onClick={() => onExport(slug(title))}><Download size={15}/>Download report</button></article>)}</div>; }

function QualityView({ onResolve }: { onResolve: (message: string) => void }) { return <section className="card"><CardHeader title="Issues requiring attention" subtitle="24 records across three issue types"/><div className="quality-list"><Quality count="12" title="Missing phone numbers" text="Customer records cannot be used for SMS campaigns." tone="amber" onClick={() => onResolve("Missing phone number review opened")}/><Quality count="8" title="Potential duplicates" text="Matching email addresses or phone numbers were detected." tone="violet" onClick={() => onResolve("Duplicate resolution queue opened")}/><Quality count="4" title="Invalid email addresses" text="Addresses failed format or delivery checks." tone="rose" onClick={() => onResolve("Invalid email review opened")}/></div></section>; }

function SettingsView({ saved, onSave }: { saved: boolean; onSave: () => void }) { return <form className="settings-grid" onSubmit={e => { e.preventDefault(); onSave(); }}><section className="card settings-card"><h2>Workspace details</h2><p>Used across reports and shared exports.</p><Field label="Workspace name"><input defaultValue="Brands Republic"/></Field><Field label="Business email"><input type="email" defaultValue="operations@brandsrepublic.co.uk"/></Field><Field label="Time zone"><select defaultValue="Europe/London"><option value="Europe/London">Europe/London (GMT)</option><option value="Europe/Paris">Europe/Paris (CET)</option><option value="America/New_York">America/New_York (ET)</option></select></Field></section><section className="card settings-card"><h2>Notifications</h2><p>Choose which updates appear in your workspace.</p><Toggle label="Import completed" text="When a data import finishes processing" defaultChecked/><Toggle label="Data quality alerts" text="When new record issues are detected" defaultChecked/><Toggle label="Weekly reports" text="Receive a summary every Monday" defaultChecked/><Toggle label="Product updates" text="Occasional feature announcements"/></section><div className="settings-save"><button className="primary" type="submit">{saved ? <Check size={16}/> : null}{saved ? "Saved" : "Save changes"}</button></div></form>; }

function CustomerTable({ customers, onSelect }: { customers: Customer[]; onSelect: (customer: Customer) => void }) { return <div className="table-wrap"><table><thead><tr><th>Customer</th><th>Location</th><th>Orders</th><th>Last activity</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{customers.map(c => <tr key={c.id}><td><button className="customer" onClick={() => onSelect(c)}><div className="customer-avatar">{c.initials}</div><div><b>{c.name}</b><span>{c.email}</span></div></button></td><td>{c.location}</td><td>{c.orders}</td><td>{c.activity}</td><td><span className={`badge ${slug(c.status)}`}>{c.status}</span></td><td><button className="icon-button" aria-label={`Open ${c.name} profile`} onClick={() => onSelect(c)}><MoreHorizontal size={17}/></button></td></tr>)}</tbody></table></div>; }

function Dialog({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: ReactNode }) { return <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><section className="dialog" role="dialog" aria-modal="true" aria-label={title}><div className="dialog-header"><div><h2>{title}</h2><p>{subtitle}</p></div><button aria-label="Close dialog" onClick={onClose}><X size={18}/></button></div>{children}</section></div>; }
function Popover({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) { return <div className="popover" role="dialog" aria-label={title}><div className="popover-head"><b>{title}</b><button aria-label={`Close ${title}`} onClick={onClose}><X size={16}/></button></div>{children}</div>; }
function Field({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) { return <label className={wide ? "wide" : ""}><span>{label}</span>{children}</label>; }
function Metric({ label, value, change, note, icon: Icon, tone, negative = false }: { label: string; value: string; change: string; note: string; icon: LucideIcon; tone: string; negative?: boolean }) { return <article className="metric card"><div className={`metric-icon ${tone}`}><Icon size={18}/></div><span>{label}</span><strong>{value}</strong><div className={negative ? "down" : "up"}>{change} <small>{note}</small></div></article>; }
function CardHeader({ title, subtitle, children }: { title: string; subtitle: string; children?: ReactNode }) { return <div className="card-header"><div><h2>{title}</h2><p>{subtitle}</p></div>{children}</div>; }
function Legend({ color, label, value, percent }: { color: string; label: string; value: string; percent: string }) { return <div className="legend-row"><span className="dot" style={{ background: color }}/><b>{label}</b><span>{value}</span><em>{percent}</em></div>; }
function Quick({ icon: Icon, label, detail, onClick }: { icon: LucideIcon; label: string; detail: string; onClick: () => void }) { return <button className="quick" onClick={onClick}><div><Icon size={17}/></div><span><b>{label}</b><small>{detail}</small></span><ArrowRight size={15}/></button>; }
function Notice({ title, detail, time }: { title: string; detail: string; time: string }) { return <div className="notice-row"><span className="unread"/><div><b>{title}</b><span>{detail}</span></div><time>{time}</time></div>; }
function HelpItem({ title, text }: { title: string; text: string }) { return <button><div><CircleHelp size={17}/></div><span><b>{title}</b><small>{text}</small></span><ArrowRight size={16}/></button>; }
function ListRow({ title, detail, badge }: { title: string; detail: string; badge: string }) { return <div><FileSpreadsheet size={18}/><span><b>{title}</b><small>{detail}</small></span><em className={badge === "Review" ? "review" : ""}>{badge}</em></div>; }
function Quality({ count, title, text, tone, onClick }: { count: string; title: string; text: string; tone: string; onClick: () => void }) { return <div className="quality-row"><div className={`quality-count ${tone}`}>{count}</div><span><b>{title}</b><small>{text}</small></span><button onClick={onClick}>Review records <ArrowRight size={15}/></button></div>; }
function Toggle({ label, text, defaultChecked }: { label: string; text: string; defaultChecked?: boolean }) { return <label className="toggle-row"><span><b>{label}</b><small>{text}</small></span><input type="checkbox" defaultChecked={defaultChecked}/><i/></label>; }
function EmptyState({ icon: Icon, title, text, action, onAction }: { icon: LucideIcon; title: string; text: string; action: string; onAction: () => void }) { return <div className="empty-state"><Icon size={24}/><h2>{title}</h2><p>{text}</p><button className="primary" onClick={onAction}>{action}</button></div>; }
function slug(value: string) { return value.toLowerCase().replaceAll(" ", "-"); }
