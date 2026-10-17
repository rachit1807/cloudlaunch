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
  const [page, setPage] = useState("Projects"),
    [selected, setSelected] = useState(null),
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
  const themeButton = <button className="icon-button" aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>{theme === "dark" ? <Sun size={18}/> : <Moon size={18}/>}</button>;
  if (locked) return <div className="entry">
    <header><Logo/>{themeButton}</header>
    <div className="entry-layout"><section className="entry-story"><span className="eyebrow">THE WORK BETWEEN IDEA & RELEASE</span><h1>Make room<br/>for your<br/><em>next launch.</em></h1><p>A considered space for the things you build. Organize projects, work through the details, and keep a record of every release.</p><div className="entry-coordinate"><span>01 / PLAN</span><span>02 / PREPARE</span><span>03 / RELEASE</span></div></section>
    <section className="entry-access"><span className="issue">CLOUDLAUNCH / WORKSPACE ACCESS</span><h2>Come on in.</h2><p>Take a look around, or pick up where you left off.</p><button className="demo-entry" onClick={() => {sessionStorage.setItem("cloudlaunch-demo", "true");setDemo(true);}}>Explore the demo <ArrowUpRight size={22}/></button><small>Open to everyone. Read-only sample workspace.</small><div className="entry-divider">PRIVATE WORKSPACE</div><form onSubmit={e => {e.preventDefault();const value = new FormData(e.currentTarget).get("password");sessionStorage.setItem("cloudlaunch-password",value);setPassword(value);}}><label>Owner password<input type="password" name="password" required autoComplete="current-password" placeholder="Your private access key"/></label><button className="primary">Owner login <ArrowRight size={16}/></button></form>{error && error !== "Enter your workspace password to continue." && <p role="alert" className="error">{error}</p>}<p className="access-note"><ShieldCheck size={16}/> Owner credentials stay private. Visitors need no password.</p></section></div><footer>Built with intention. Released with confidence.<span>CloudLaunch / 2026</span></footer></div>;
  if (!data) return <div className="loading"><Logo/><p role="status">{error || "Opening the workspace…"}</p>{error && <button onClick={load}>Try again</button>}</div>;
  const projects = data.projects.filter(p => (p.name + " " + p.description + " " + p.stack).toLowerCase().includes(search.toLowerCase()) && (filter === "All environments" || p.environment === filter));
  const current = data.projects.find(p => p.id === selected);
  const journal = current ? data.deployments.filter(d => d.projectId === current.id) : data.deployments;
  function releaseList(items) {return items.length ? <div className="journal">{items.map(d => <article className="journal-entry" key={d.id}><time>{date(d.at)}<small>{new Date(d.at).getFullYear()}</small></time><span className="journal-point"/><div><span className="eyebrow">{d.environment} / VERIFIED RECORD</span><h3>{d.projectName} <em>{d.version}</em></h3><p>{d.notes || "Release verified and recorded."}</p><a href={d.url} target="_blank" rel="noreferrer">Visit release <ArrowUpRight size={14}/></a></div></article>)}</div> : <div className="empty"><Layers size={28}/><h3>A story waiting to be written.</h3><p>Verified release records will appear here.</p></div>}
  return (<>
    <header className="masthead"><Logo/><nav aria-label="Main navigation">{["Projects", "Releases", "Settings"].map((name,i) => <button key={name} aria-current={page === name ? "page" : undefined} className={page === name ? "active" : ""} onClick={() => {navigate(name);setSelected(null);}}><small>0{i+1}</small>{name === "Releases" ? "Release journal" : name === "Settings" ? "Workspace" : "Project index"}</button>)}</nav><div className="header-actions">{themeButton}<button className="sign-out" onClick={signOut}><LogOut size={16}/><span>{demo ? "Exit demo" : "Sign out"}</span></button></div></header>
    <div className="workspace-strip"><span>{data.settings.name} <b>/</b> {data.settings.owner}</span><span><i className="dot"/>{demo ? "PUBLIC DEMO" : health ? "WORKSPACE CONNECTED" : "CONNECTING"}</span></div>
    {demo && <div className="demo-banner"><span>You're exploring a read-only sample workspace.</span><button onClick={() => {sessionStorage.removeItem("cloudlaunch-demo");sessionStorage.removeItem("cloudlaunch-password");window.location.reload();}}>Owner login <ArrowUpRight size={14}/></button></div>}
    <main className="folio">
    {page === "Projects" && !current && <>
      <section className="index-intro"><div><span className="eyebrow">A SPACE FOR WORK IN MOTION</span><h1>Good things<br/>take <em>launch.</em></h1></div><div className="index-aside"><p>From a first idea to the version you're proud to ship. Keep every project moving, one considered step at a time.</p><button className="primary" disabled={demo} onClick={() => open()}><Plus size={17}/> New project</button><small>{demo ? "Sample projects · editing reserved for owner" : "Your next release starts with a project."}</small></div></section>
      <section className="index-section"><div className="index-label"><h2>The project index <sup>{String(data.projects.length).padStart(2,"0")}</sup></h2><span>SELECT A PROJECT TO OPEN ITS WORKBOOK <ArrowRight size={15}/></span></div><div className="toolbar"><label className="search"><Search size={16}/><input aria-label="Search projects" placeholder="Find a project…" value={search} onChange={e=>setSearch(e.target.value)}/>{search && <button aria-label="Clear search" onClick={()=>setSearch("")}><X size={14}/></button>}</label><select aria-label="Filter by environment" value={filter} onChange={e=>setFilter(e.target.value)}>{["All environments","Production","Preview","Development"].map(v=><option key={v}>{v}</option>)}</select></div><div className="index-columns" aria-hidden="true"><span>PROJECT / TECHNOLOGY</span><span>ENVIRONMENT</span><span>READINESS</span><span>OPEN</span></div><div className="project-index">{projects.map((p,i)=><button className="project-row" key={p.id} onClick={()=>setSelected(p.id)}><span className="project-identity"><span className="row-number">{String(i+1).padStart(2,"0")}</span><span><strong>{p.name}</strong><small>{p.stack} <b>·</b> {p.status}</small></span></span><span className="environment"><i className={p.environment === "Production" ? "dot" : "dot amber"}/>{p.environment}</span><span className="readiness"><span className="segments">{p.checklist.map((v,j)=><i key={j} className={v?"filled":""}/>)}</span><small>{p.checklist.filter(Boolean).length} of 4 ready</small></span><ArrowUpRight className="row-arrow" size={25}/></button>)}</div>{!projects.length && <div className="empty"><h3>{data.projects.length ? "No projects match your search." : "Every launch begins somewhere."}</h3><p>{data.projects.length ? "Try another name or environment." : "Create your first project to begin."}</p><button onClick={()=>{setSearch("");setFilter("All environments");}}>Reset filters</button></div>}</section>
      <section className="index-notes"><div><span className="eyebrow">THE LATEST CHAPTER</span><h2>{data.deployments.length ? data.deployments[0].projectName + " / " + data.deployments[0].version : "Your first release is ahead."}</h2><p>{data.deployments[0]?.notes || "Complete a project's readiness checklist, then record a release you've verified."}</p><button className="text-button" onClick={()=>navigate("Releases")}>Read the release journal <ArrowRight size={17}/></button></div><div className="activity-ledger"><span className="eyebrow">WORKSPACE NOTES</span>{data.activity.slice(0,3).map(a=><div key={a.id}><time>{date(a.at)}</time><span>{a.text}</span></div>)}{!data.activity.length && <p>Project updates will appear here.</p>}</div></section>
    </>}
    {page === "Projects" && current && <>
      <button className="back-link" onClick={()=>setSelected(null)}>← Back to project index</button><section className="project-title"><div><span className="eyebrow">PROJECT WORKBOOK / {current.stack}</span><h1>{current.name}<em>.</em></h1><p>{current.description || "A new project, ready for its next chapter."}</p></div><div className="project-actions">{current.url && <a className="primary" href={current.url} target="_blank" rel="noreferrer">Open live site <ArrowUpRight size={17}/></a>}<button disabled={demo} onClick={()=>open(current)}>Edit project <MoreHorizontal size={17}/></button></div></section>
      <div className="project-facts"><span><small>ENVIRONMENT</small>{current.environment}</span><span><small>STATUS</small>{current.status}</span><span><small>CREATED</small>{date(current.createdAt)}</span><span><small>RELEASE RECORDS</small>{journal.length}</span></div>
      <div className="workbook"><section><div className="section-heading"><span className="eyebrow">01 / BEFORE YOU SHIP</span><h2>Ready, when you are.</h2><p>Four small checks for a confident release.</p></div><ol className="workbook-checks">{checks.map((c,i)=><li key={c}><span className={current.checklist[i] ? "check done" : "check"}>{current.checklist[i] ? <Check size={17}/> : String(i+1).padStart(2,"0")}</span><span>{c}</span><small>{current.checklist[i]?"Verified":"To do"}</small></li>)}</ol><button className="text-button" disabled={demo} onClick={()=>open(current)}>Update readiness <ArrowRight size={16}/></button></section><section className="release-desk"><span className="eyebrow">02 / LEAVE A RECORD</span><h2>Shipped something<br/><em>worth noting?</em></h2><p>Document a version you've already deployed and tested. Every release deserves a place in the journal.</p><button className="primary" disabled={demo || !current.url || !current.checklist.every(Boolean)} onClick={()=>{setForm({...current,version:"",notes:""});setModal("release");}}>Record a release <Plus size={17}/></button><small>{demo ? "Demo is read-only." : "Requires a live URL and all four readiness checks."}</small></section></div><section className="project-journal"><span className="eyebrow">03 / THE RELEASE JOURNAL</span>{releaseList(journal)}</section>
    </>}
    {page === "Releases" && <><section className="journal-intro"><span className="eyebrow">THE WORK, IN VERSIONS</span><h1>Every release.<br/><em>A new chapter.</em></h1><p>A chronological record of the things you've shipped.</p></section><div className="notice"><AlertCircle size={16}/> Manually recorded, personally verified. CloudLaunch does not execute deployments.</div>{releaseList(data.deployments)}</>}
    {page === "Settings" && <section className="journal-intro"><span className="eyebrow">A PLACE OF YOUR OWN</span><h1>Workspace<br/><em>preferences.</em></h1></section>}
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
    {error && !modal && <p role="alert" className="error">{error}</p>}
    <footer><Logo/><span>A little structure. A lot of possibility.</span><span>{demo ? "DEMO EDITION" : "PERSONAL WORKSPACE"} / 2026</span></footer></main>
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
