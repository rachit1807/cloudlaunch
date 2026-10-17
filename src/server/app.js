import express from "express";
import helmet from "helmet";
import { randomUUID, timingSafeEqual } from "node:crypto";
import path from "node:path";
const stacks = ["React", "Next.js", "Node.js", "Python", "Other"];
const environments = ["Production", "Preview", "Development"];
function cleanProject(body) {
  const name = String(body.name || "").trim(),
    description = String(body.description || "").trim(),
    url = String(body.url || "").trim();
  if (!name || name.length > 60)
    throw Error("Project name must contain 1–60 characters.");
  if (description.length > 300)
    throw Error("Description must be under 300 characters.");
  if (url) {
    let u;
    try {
      u = new URL(url);
    } catch {
      throw Error("Enter a valid HTTPS project URL.");
    }
    if (u.protocol !== "https:") throw Error("Project URL must use HTTPS.");
  }
  if (!stacks.includes(body.stack) || !environments.includes(body.environment))
    throw Error("Choose a valid stack and environment.");
  return {
    name,
    description,
    url,
    stack: body.stack,
    environment: body.environment,
  };
}
export function createApp(store) {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.json({ limit: "32kb" }));
  app.get("/api/health", async (req, res) => {
    await store.read();
    res.json({ status: "ok", database: store.mode });
  });
  const attempts = new Map();
  app.use("/api", (req, res, next) => {
    const password = process.env.WORKSPACE_PASSWORD;
    if (!password) return next();
    const key = req.ip,
      now = Date.now(),
      attempt = attempts.get(key);
    if (attempt && now - attempt.time < 60000 && attempt.count >= 20)
      return res
        .status(429)
        .json({ error: "Too many attempts. Try again in a minute." });
    const a = Buffer.from(req.headers["x-workspace-password"] || ""),
      b = Buffer.from(password);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      attempts.set(key, {
        time: attempt && now - attempt.time < 60000 ? attempt.time : now,
        count: attempt && now - attempt.time < 60000 ? attempt.count + 1 : 1,
      });
      if (attempts.size > 1000)
        for (const [k, v] of attempts)
          if (now - v.time >= 60000) attempts.delete(k);
      return res.status(401).json({ error: "Workspace password required." });
    }
    attempts.delete(key);
    next();
  });
  const log = (data, text) => {
    data.activity.unshift({
      id: randomUUID(),
      text,
      at: new Date().toISOString(),
    });
    data.activity = data.activity.slice(0, 30);
  };
  app.get("/api/workspace", async (req, res) => res.json(await store.read()));
  app.post("/api/projects", async (req, res) => {
    let fields;
    try {
      fields = cleanProject(req.body);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
    const project = {
      ...fields,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      status: "In progress",
      checklist: [false, false, false, false],
    };
    await store.update((data) => {
      data.projects.push(project);
      log(data, `Created ${project.name}`);
    });
    res.status(201).json(project);
  });
  app.patch("/api/projects/:id", async (req, res) => {
    let fields;
    try {
      fields = cleanProject(req.body);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
    const result = await store.update((data) => {
      const p = data.projects.find((p) => p.id === req.params.id);
      if (!p) return null;
      Object.assign(p, fields);
      if (
        Array.isArray(req.body.checklist) &&
        req.body.checklist.length === 4 &&
        req.body.checklist.every((x) => typeof x === "boolean")
      )
        p.checklist = req.body.checklist;
      log(data, `Updated ${p.name}`);
      return p;
    });
    if (!result) return res.status(404).json({ error: "Project not found." });
    res.json(result);
  });
  app.delete("/api/projects/:id", async (req, res) => {
    const found = await store.update((data) => {
      const p = data.projects.find((p) => p.id === req.params.id);
      if (!p) return false;
      data.projects = data.projects.filter((p) => p.id !== req.params.id);
      data.deployments = data.deployments.filter(
        (d) => d.projectId !== req.params.id,
      );
      log(data, `Deleted ${p.name}`);
      return true;
    });
    res.status(found ? 204 : 404).end();
  });
  app.post("/api/projects/:id/releases", async (req, res) => {
    const version = String(req.body.version || "").trim(),
      notes = String(req.body.notes || "").trim();
    if (
      !/^v?\d+\.\d+\.\d+([-.][a-zA-Z0-9.]+)?$/.test(version) ||
      notes.length > 500
    )
      return res
        .status(400)
        .json({
          error: "Use a version such as v1.0.0 and notes under 500 characters.",
        });
    const result = await store.update((data) => {
      const p = data.projects.find((p) => p.id === req.params.id);
      if (!p) return { error: "Project not found.", code: 404 };
      if (!p.url || !p.checklist.every(Boolean))
        return {
          error: "Add a live URL and complete the readiness checklist first.",
          code: 400,
        };
      if (
        data.deployments.some(
          (d) => d.projectId === p.id && d.version === version,
        )
      )
        return { error: "This version is already recorded.", code: 409 };
      const d = {
        id: randomUUID(),
        projectId: p.id,
        projectName: p.name,
        environment: p.environment,
        url: p.url,
        version,
        notes,
        at: new Date().toISOString(),
      };
      data.deployments.unshift(d);
      p.status = "Released";
      log(data, `Recorded ${p.name} ${version}`);
      return d;
    });
    if (result.error)
      return res.status(result.code).json({ error: result.error });
    res.status(201).json(result);
  });
  app.patch("/api/settings", async (req, res) => {
    const name = String(req.body.name || "").trim(),
      owner = String(req.body.owner || "").trim();
    if (!name || name.length > 60 || !owner || owner.length > 60)
      return res
        .status(400)
        .json({
          error: "Workspace and owner names must contain 1–60 characters.",
        });
    await store.update((data) => {
      data.settings = { name, owner };
    });
    res.json({ name, owner });
  });
  app.use(express.static(path.resolve("dist")));
  app.get("/{*path}", (req, res) =>
    res.sendFile(path.resolve("dist/index.html")),
  );
  app.use((err, req, res, next) => {
    console.error(err.message);
    res
      .status(err.status === 400 ? 400 : 500)
      .json({
        error:
          err.status === 400
            ? "Invalid request."
            : "Something went wrong. Please try again.",
      });
  });
  return app;
}
