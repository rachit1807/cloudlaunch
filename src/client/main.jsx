import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Rocket,
  LayoutDashboard,
  FolderKanban,
  Layers,
  Settings,
  Sun,
  Moon,
  Plus,
  Search,
  ArrowUpRight,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  X,
  Trash2,
  ExternalLink,
  Download,
  Menu,
  Code2,
  Globe,
  Activity,
  ChevronDown,
  LogOut,
  ShieldCheck,
  GitBranch,
  Box,
  Terminal,
  Cloud,
  AlertCircle,
} from "lucide-react";
import "./styles.css";
const icons = {
  Overview: LayoutDashboard,
  Projects: FolderKanban,
  Releases: Layers,
  Settings,
};
const checks = [
  "Application tested end to end",
  "Environment variables configured",
  "Database persistence verified",
  "HTTPS and live URL verified",
];
const blank = {
  name: "",
  description: "",
  stack: "React",
  environment: "Production",
  url: "",
};
const date = (v) =>
  new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" });
function App() {
  const [page, setPage] = useState("Overview"),
    [data, setData] = useState(null),
    [error, setError] = useState(""),
    [toast, setToast] = useState(""),
    [modal, setModal] = useState(null),
    [form, setForm] = useState(blank),
    [busy, setBusy] = useState(false),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("All environments"),
    [mobile, setMobile] = useState(false),
    [theme, setTheme] = useState(
      document.documentElement.dataset.theme || "dark",
    ),
    [password, setPassword] = useState(
      sessionStorage.getItem("cloudlaunch-password") || "",
    ),
    [demo, setDemo] = useState(sessionStorage.getItem("cloudlaunch-demo") === "true"),
    [locked, setLocked] = useState(false),
    [health, setHealth] = useState(null);
  async function api(url, options = {}) {
    if (demo && options.method && options.method !== "GET")
      throw Error("Demo is read-only. Sign in as the owner to make changes.");
    const response = await fetch("/api" + url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-Workspace-Password": demo ? "" : password,
        "X-Demo-Mode": String(demo),
        ...options.headers,
      },
    });
    if (response.status === 401) {
      setLocked(true);
      throw Error("Enter your workspace password to continue.");
    }
    if (!response.ok)
      throw Error((await response.json()).error || "Request failed.");
    return response.status === 204 ? null : response.json();
  }
  async function load() {
    try {
      const d = await api(demo ? "/demo" : "/workspace");
      setData(d);
      setLocked(false);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => {});
  }, [password, demo]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("cloudlaunch-theme", theme);
  }, [theme]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        setModal(null);
        setMobile(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  function signOut() {
    sessionStorage.removeItem("cloudlaunch-password");
    sessionStorage.removeItem("cloudlaunch-demo");
    // A fresh page also discards pending requests and private workspace state.
    window.location.reload();
  }
  function navigate(p) {
    setPage(p);
    setSearch("");
    setMobile(false);
  }
  function open(project) {
    if (demo) { setToast("Demo is read-only. Owner login is required to edit projects."); return; }
    setError("");
    setForm(project ? { ...project } : { ...blank });
    setModal(project ? "edit" : "create");
  }
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(modal === "edit" ? "/projects/" + form.id : "/projects", {
        method: modal === "edit" ? "PATCH" : "POST",
        body: JSON.stringify(form),
      });
      await load();
      setModal(null);
      setToast(
        modal === "edit" ? "Project updated" : "Your project is ready to track",
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    try {
      await api("/projects/" + form.id, { method: "DELETE" });
      await load();
      setModal(null);
      setToast("Project deleted");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function release(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/projects/" + form.id + "/releases", {
        method: "POST",
        body: JSON.stringify(form),
      });
      await load();
      setModal(null);
      setToast("Release recorded");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "cloudlaunch-workspace.json";
    a.click();
    URL.revokeObjectURL(url);
    setToast("Workspace exported");
  }
  if (locked)
    return (
      <div className="auth">
        <Logo />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const p = new FormData(e.currentTarget).get("password");
            sessionStorage.setItem("cloudlaunch-password", p);
            setPassword(p);
          }}
        >
          <span className="eyebrow">YOUR WORKSPACE, SECURED</span>
          <h1>Welcome back.</h1>
          <p>Explore the public demo without a password, or sign in to manage your private workspace.</p>
          <button type="button" className="demo-entry" onClick={() => {
            sessionStorage.setItem("cloudlaunch-demo", "true");
            setDemo(true);
          }}>Explore demo <ArrowUpRight size={16} /></button>
          <p className="muted">Read-only sample projects. No signup needed.</p>
          <label>
            Owner workspace password
            <input autoFocus type="password" name="password" required />
          </label>
          <button className="primary">
            Owner login <ArrowRight size={16} />
          </button>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
        </form>
      </div>
    );
  if (!data)
    return (
      <div className="auth">
        <Logo />
        <p role="status">{error || "Opening your workspace…"}</p>
        {error && <button onClick={load}>Try again</button>}
      </div>
    );
  const projects = data.projects.filter(
    (p) =>
      (p.name + " " + p.description + " " + p.stack)
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (filter === "All environments" || p.environment === filter),
  );
  const released = data.projects.filter((p) => p.status === "Released").length;
  return (
    <>
      <aside className={mobile ? "sidebar open" : "sidebar"}>
        <Logo />
        <button className="workspace" onClick={() => navigate("Settings")}>
          <span className="workspace-avatar">{data.settings.name[0]}</span>
          <span>
            {data.settings.name}
            <small>Personal workspace</small>
          </span>
          <ChevronDown size={14} />
        </button>
        <span className="nav-label">WORKSPACE</span>
        <nav>
          {Object.entries(icons).map(([name, Icon]) => (
            <button
              className={page === name ? "nav-item active" : "nav-item"}
              key={name}
              onClick={() => navigate(name)}
            >
              <Icon size={18} />
              {name}
              {name === "Projects" && (
                <span className="nav-count">{data.projects.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="tip">
            <span className="tiny-icon">
              <Rocket size={17} />
            </span>
            <b>Small steps. Big launches.</b>
            <p>Keep your next big idea moving forward.</p>
            <button onClick={() => open()}>
              Start a project <ArrowUpRight size={14} />
            </button>
          </div>
          <button className="profile" onClick={() => navigate("Settings")}>
            <span className="avatar">
              {data.settings.owner
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </span>
            <span>
              {data.settings.owner}
              <small>Personal account</small>
            </span>
            <Settings size={16} />
          </button>
        </div>
      </aside>
      {mobile && (
        <button
          className="scrim"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <main>
        <header className="topbar">
          <div>
            <button
              className="mobile-menu icon-button"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu size={20} />
            </button>
            <span className="breadcrumb">
              Workspace <span>/</span> <b>{page}</b>
            </span>
          </div>
          <div className="top-actions">
            <span className="connection">
              <i />
              {demo ? "Demo mode" : health ? "Connected" : "Connecting"}
            </span>
            <button
              className="icon-button"
              aria-label={
                theme === "dark"
                  ? "Switch to light theme"
                  : "Switch to dark theme"
              }
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <button className="sign-out" onClick={signOut}>
              <LogOut size={16} /> {demo ? "Exit demo" : "Sign out"}
            </button>
            <span className="avatar small">{data.settings.owner[0]}</span>
          </div>
        </header>
        <div className="content">
          {demo && <div className="demo-banner" role="status"><span><b>Explore demo</b> · Read-only sample data. Your private workspace is protected.</span><button onClick={() => {
            sessionStorage.removeItem("cloudlaunch-demo"); setDemo(false); setData(null); setLocked(true); setError(""); setPage("Overview");
          }}>Owner login <ArrowRight size={16} /></button></div>}
          <div className="page-heading">
            <div>
              <div className="eyebrow">YOUR LAUNCHPAD</div>
              <h1>
                {page === "Overview"
                  ? "A little progress. A big possibility."
                  : page === "Projects"
                    ? "Ideas, with a place to grow."
                    : page === "Releases"
                      ? "Every launch has a story."
                      : "Make yourself at home."}
              </h1>
              <p>
                {page === "Overview"
                  ? "Welcome back, " +
                    data.settings.owner.split(" ")[0] +
                    ". Here’s what’s happening in your workspace."
                  : page === "Projects"
                    ? "Organize your projects and get them ready for the world."
                    : page === "Releases"
                      ? "A record of the versions you’ve shipped and verified."
                      : "Your workspace, your preferences."}
              </p>
            </div>
            {page !== "Settings" && (
              <button className="primary" onClick={() => open()}>
                <Plus size={17} />
                New project
              </button>
            )}
          </div>
          {page === "Overview" && (
            <>
              <div className="hero">
                <div className="hero-copy">
                  <span className="hero-badge">
                    <span />
                    FROM IDEA TO LIVE
                  </span>
                  <h2>
                    Your next launch
                    <br />
                    starts right here<span>.</span>
                  </h2>
                  <p>
                    One workspace for your projects, release checklists,
                    <br className="desktop-break" /> and everything that comes
                    next.
                  </p>
                  <button onClick={() => open()}>
                    Build something great <ArrowUpRight size={16} />
                  </button>
                </div>
                <div className="hero-art" aria-hidden="true">
                  <div className="orbit orbit-one" />
                  <div className="orbit orbit-two" />
                  <div className="orbit orbit-three" />
                  <div className="floating floating-code">
                    <Code2 size={25} />
                  </div>
                  <div className="floating floating-cloud">
                    <Cloud size={27} />
                  </div>
                  <div className="rocket-tile">
                    <Rocket size={66} strokeWidth={1.3} />
                  </div>
                  <span className="art-star star-one">+</span>
                  <span className="art-star star-two">+</span>
                  <span className="art-dot" />
                </div>
                <span className="hero-corner">
                  LESS FRICTION. MORE FORWARD.
                </span>
              </div>
              <div className="stats">
                {[
                  [
                    FolderKanban,
                    "Total projects",
                    data.projects.length,
                    "Ideas in motion",
                  ],
                  [Globe, "Released projects", released, "Ready for the world"],
                  [
                    Layers,
                    "Recorded releases",
                    data.deployments.length,
                    "Milestones worth keeping",
                  ],
                  [
                    ShieldCheck,
                    "Ready to launch",
                    data.projects.filter(
                      (p) => p.checklist.every(Boolean) && p.url,
                    ).length,
                    "Checklists completed",
                  ],
                ].map(([Icon, label, value, hint]) => (
                  <div className="stat" key={label}>
                    <div className="stat-top">
                      <span>{label}</span>
                      <Icon size={17} />
                    </div>
                    <strong>{value.toString().padStart(2, "0")}</strong>
                    <small>{hint}</small>
                  </div>
                ))}
              </div>
            </>
          )}
          {(page === "Overview" || page === "Projects") && (
            <section>
              <div className="section-heading">
                <div>
                  <h2>
                    {page === "Overview" ? "Your projects" : "All projects"}
                    <span className="count">{data.projects.length}</span>
                  </h2>
                  <p>A home for everything you’re building.</p>
                </div>
                {page === "Overview" && (
                  <button
                    className="text-button"
                    onClick={() => navigate("Projects")}
                  >
                    View all projects <ArrowRight size={15} />
                  </button>
                )}
              </div>
              <div className="toolbar">
                <label className="search">
                  <Search size={17} />
                  <input
                    aria-label="Search projects"
                    placeholder="Search projects…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <button
                      className="icon-button"
                      aria-label="Clear search"
                      onClick={() => setSearch("")}
                    >
                      <X size={14} />
                    </button>
                  )}
                </label>
                <select
                  aria-label="Filter by environment"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  {[
                    "All environments",
                    "Production",
                    "Preview",
                    "Development",
                  ].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </div>
              {projects.length ? (
                <div className="project-grid">
                  {projects
                    .slice(0, page === "Overview" ? 6 : undefined)
                    .map((p, index) => (
                      <article className="project-card" key={p.id}>
                        <div className="card-top">
                          <span className={"project-icon color-" + (index % 4)}>
                            <Code2 size={23} />
                          </span>
                          <button
                            className="icon-button"
                            aria-label={"Edit " + p.name}
                            onClick={() => open(p)}
                          >
                            <MoreHorizontal size={20} />
                          </button>
                        </div>
                        <h3>
                          <button onClick={() => open(p)}>
                            {p.name}
                            <ArrowUpRight size={16} />
                          </button>
                        </h3>
                        <p>
                          {p.description ||
                            "A new idea, ready for its next chapter."}
                        </p>
                        <div className="project-tags">
                          <span>
                            <span
                              className={
                                p.status === "Released"
                                  ? "dot green"
                                  : "dot amber"
                              }
                            />
                            {p.status}
                          </span>
                          <span>{p.environment}</span>
                        </div>
                        <div className="readiness">
                          <span>Launch readiness</span>
                          <b>{p.checklist.filter(Boolean).length}/4</b>
                        </div>
                        <div className="progress-track">
                          <span
                            style={{
                              width:
                                p.checklist.filter(Boolean).length * 25 + "%",
                            }}
                          />
                        </div>
                        <div className="card-footer">
                          <span>
                            <GitBranch size={14} />
                            {p.stack}
                          </span>
                          <small>Added {date(p.createdAt)}</small>
                        </div>
                      </article>
                    ))}
                  <button className="new-card" onClick={() => open()}>
                    <span>
                      <Plus size={24} />
                    </span>
                    <b>Your next big idea</b>
                    <small>Create a new project</small>
                  </button>
                </div>
              ) : (
                <div className="empty">
                  <span className="empty-icon">
                    <FolderKanban size={30} />
                  </span>
                  <h3>
                    {search || filter !== "All environments"
                      ? "No matching projects"
                      : "Big things start with one project."}
                  </h3>
                  <p>
                    {search || filter !== "All environments"
                      ? "Try a different search or environment."
                      : "Add your first project and give your next idea a launchpad."}
                  </p>
                  <button
                    className="primary"
                    onClick={() =>
                      search || filter !== "All environments"
                        ? (setSearch(""), setFilter("All environments"))
                        : open()
                    }
                  >
                    {search || filter !== "All environments" ? (
                      "Clear filters"
                    ) : (
                      <>
                        <Plus size={16} />
                        Create your first project
                      </>
                    )}
                  </button>
                </div>
              )}
            </section>
          )}
          {page === "Overview" && (
            <div className="bottom-grid">
              <section className="panel">
                <div className="section-heading">
                  <h2>
                    <Activity size={17} />
                    Recent activity
                  </h2>
                  <span className="muted">Latest updates</span>
                </div>
                {data.activity.length ? (
                  data.activity.slice(0, 4).map((a) => (
                    <div className="activity-item" key={a.id}>
                      <span className="activity-dot" />
                      <div>
                        {a.text}
                        <small>{new Date(a.at).toLocaleString()}</small>
                      </div>
                      <CheckCircle2 size={15} />
                    </div>
                  ))
                ) : (
                  <div className="quiet">
                    <Clock size={23} />
                    <p>A fresh start, a clean slate.</p>
                    <small>Your project updates will appear here.</small>
                  </div>
                )}
              </section>
              <section className="panel launch-guide">
                <div className="section-heading">
                  <h2>
                    <Box size={17} />
                    The launch essentials
                  </h2>
                  <span className="pill">QUICK GUIDE</span>
                </div>
                <p>Good launches start with a few good habits.</p>
                {[
                  "Create a project and choose your stack",
                  "Complete your production checklist",
                  "Record a verified release",
                ].map((t, i) => (
                  <div className="guide-step" key={t}>
                    <span>{i + 1}</span>
                    {t}
                  </div>
                ))}
                <button className="text-button" onClick={() => open()}>
                  Let’s make it happen <ArrowRight size={15} />
                </button>
              </section>
            </div>
          )}
          {page === "Releases" && (
            <section className="panel">
              <div className="section-heading">
                <h2>
                  Release history{" "}
                  <span className="count">{data.deployments.length}</span>
                </h2>
              </div>
              <div className="notice">
                <AlertCircle size={17} />
                These are manually recorded releases. CloudLaunch does not
                execute cloud deployments.
              </div>
              {data.deployments.length ? (
                data.deployments.map((d) => (
                  <article className="release" key={d.id}>
                    <span className="release-icon">
                      <CheckCircle2 size={23} />
                    </span>
                    <div>
                      <h3>
                        {d.projectName}{" "}
                        <span className="pill">{d.version}</span>
                      </h3>
                      <p>{d.notes || "Release verified and recorded."}</p>
                      <small>
                        {d.environment} · {new Date(d.at).toLocaleString()}
                      </small>
                    </div>
                    <a
                      className="icon-button"
                      href={d.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={"Visit " + d.projectName}
                    >
                      <ExternalLink size={18} />
                    </a>
                  </article>
                ))
              ) : (
                <div className="quiet">
                  <Layers size={30} />
                  <h3>Your first release is ahead.</h3>
                  <p>
                    Open a project, complete its checklist, and record a
                    release.
                  </p>
                  <button
                    className="primary"
                    onClick={() => navigate("Projects")}
                  >
                    Go to projects <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </section>
          )}
          {page === "Settings" && (
            <div className="settings-grid">
              <section className="panel">
                <h2>Workspace details</h2>
                <p className="muted">Give your workspace a personal touch.</p>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setBusy(true);
                    try {
                      await api("/settings", {
                        method: "PATCH",
                        body: JSON.stringify(
                          Object.fromEntries(new FormData(e.currentTarget)),
                        ),
                      });
                      await load();
                      setToast("Settings saved");
                    } catch (e) {
                      setError(e.message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <label>
                    Workspace name
                    <input
                      name="name"
                      disabled={demo}
                      defaultValue={data.settings.name}
                      required
                      maxLength={60}
                    />
                  </label>
                  <label>
                    Your name
                    <input
                      name="owner"
                      disabled={demo}
                      defaultValue={data.settings.owner}
                      required
                      maxLength={60}
                    />
                  </label>
                  <button className="primary" disabled={busy || demo}>
                    Save changes <Check size={16} />
                  </button>
                </form>
              </section>
              <section className="panel">
                <h2>Make it yours</h2>
                <p className="muted">
                  A comfortable space to do your best work.
                </p>
                <div className="setting-row">
                  <div>
                    <b>Appearance</b>
                    <small>Saved on this device</small>
                  </div>
                  <button
                    onClick={() =>
                      setTheme(theme === "dark" ? "light" : "dark")
                    }
                  >
                    {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}{" "}
                    {theme === "dark" ? "Dark" : "Light"}
                  </button>
                </div>
                <div className="setting-row">
                  <div>
                    <b>Export workspace</b>
                    <small>Download your projects and releases</small>
                  </div>
                  <button onClick={exportData}>
                    <Download size={16} />
                    Export
                  </button>
                </div>
                <div className="setting-row">
                  <div>
                    <b>Database</b>
                    <small>Storage connected to this workspace</small>
                  </div>
                  <span className="pill">{demo ? "Sample data" : health?.database || "Checking"}</span>
                </div>
                {password && (
                  <button
                    className="text-button"
                    onClick={signOut}
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                )}
              </section>
            </div>
          )}
          {error && !modal && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <footer>
            <span>
              <Rocket size={14} />
              CloudLaunch <span className="footer-divider">/</span> Built for
              what’s next.
            </span>
            <span className="footer-right">
              ONE IDEA AT A TIME <span className="dot green" />
            </span>
          </footer>
        </div>
      </main>
      {modal && (
        <Modal close={() => !busy && setModal(null)}>
          <div className="modal-heading">
            <span className="empty-icon">
              <Rocket size={25} />
            </span>
            <button
              className="icon-button"
              aria-label="Close dialog"
              onClick={() => setModal(null)}
            >
              <X size={20} />
            </button>
          </div>
          <h2>
            {modal === "create"
              ? "A new idea starts here."
              : modal === "edit"
                ? "Keep your project moving."
                : modal === "delete"
                  ? "Delete this project?"
                  : "Mark a milestone."}
          </h2>
          <p className="muted">
            {modal === "create"
              ? "Add the details. Make it happen."
              : modal === "edit"
                ? "Manage the details and prepare for your next launch."
                : modal === "delete"
                  ? "The project and its release history will be permanently removed."
                  : "Record a release you have already deployed and verified."}
          </p>
          {modal === "delete" ? (
            <div className="dialog-actions">
              <button onClick={() => setModal("edit")}>Cancel</button>
              <button className="danger" disabled={busy || demo} onClick={remove}>
                Delete project
              </button>
            </div>
          ) : modal === "release" ? (
            <form onSubmit={release}>
              <label>
                Version
                <input
                  autoFocus
                  required
                  value={form.version || ""}
                  placeholder="v1.0.0"
                  onChange={(e) =>
                    setForm({ ...form, version: e.target.value })
                  }
                />
              </label>
              <label>
                Release notes
                <textarea
                  value={form.notes || ""}
                  maxLength={500}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="What changed in this release?"
                />
              </label>
              <button className="primary" disabled={busy || demo}>
                Record release <Check size={16} />
              </button>
            </form>
          ) : (
            <form onSubmit={save}>
              <label>
                Project name
                <input
                  autoFocus
                  required
                  maxLength={60}
                  placeholder="e.g. Portfolio website"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
              <label>
                Description <small>Optional</small>
                <textarea
                  maxLength={300}
                  placeholder="What are you building?"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </label>
              <div className="form-columns">
                <label>
                  Technology
                  <select
                    value={form.stack}
                    onChange={(e) =>
                      setForm({ ...form, stack: e.target.value })
                    }
                  >
                    {["React", "Next.js", "Node.js", "Python", "Other"].map(
                      (x) => (
                        <option key={x}>{x}</option>
                      ),
                    )}
                  </select>
                </label>
                <label>
                  Environment
                  <select
                    value={form.environment}
                    onChange={(e) =>
                      setForm({ ...form, environment: e.target.value })
                    }
                  >
                    {["Production", "Preview", "Development"].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Live URL <small>Optional until release</small>
                <input
                  type="url"
                  placeholder="https://your-project.com"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                />
              </label>
              {modal === "edit" && (
                <div className="checklist">
                  <h3>Launch readiness checklist</h3>
                  {checks.map((c, i) => (
                    <label className="checkbox-label" key={c}>
                      <input
                        type="checkbox"
                        checked={form.checklist[i]}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            checklist: form.checklist.map((v, j) =>
                              i === j ? e.target.checked : v,
                            ),
                          })
                        }
                      />
                      {c}
                    </label>
                  ))}
                  <small>
                    Save checklist changes before recording a release.
                  </small>
                </div>
              )}
              <div className="dialog-actions">
                {modal === "edit" && (
                  <button
                    type="button"
                    className="icon-button delete-button"
                    aria-label="Delete project"
                    onClick={() => setModal("delete")}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                <button type="button" onClick={() => setModal(null)}>
                  Cancel
                </button>
                <button className="primary" disabled={busy || demo}>
                  {busy
                    ? "Saving…"
                    : modal === "create"
                      ? "Create project"
                      : "Save changes"}
                  <ArrowRight size={16} />
                </button>
              </div>
              {modal === "edit" && (
                <button
                  type="button"
                  className="release-button"
                  onClick={() => {
                    setError("");
                    setModal("release");
                  }}
                >
                  <Layers size={16} />
                  Record a verified release <ArrowUpRight size={15} />
                </button>
              )}
            </form>
          )}
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
        </Modal>
      )}
      {toast && (
        <div role="status" className="toast">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}
    </>
  );
}
function Logo() {
  return (
    <div className="logo">
      <span>
        <Rocket size={23} />
      </span>
      cloudlaunch<span className="logo-period">.</span>
    </div>
  );
}
function Modal({ children, close }) {
  useEffect(() => {
    const before = document.activeElement;
    document.body.style.overflow = "hidden";
    const dialog = document.querySelector("[role=dialog]");
    const focusables = () =>
      Array.from(
        dialog.querySelectorAll("button,input,textarea,select,a"),
      ).filter((e) => !e.disabled);
    focusables()[0]?.focus();
    const trap = (e) => {
      if (e.key !== "Tab") return;
      const items = focusables(),
        first = items[0],
        last = items.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    dialog.addEventListener("keydown", trap);
    return () => {
      document.body.style.overflow = "";
      before?.focus();
      dialog.removeEventListener("keydown", trap);
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Project details"
        className="modal"
      >
        {children}
      </section>
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
