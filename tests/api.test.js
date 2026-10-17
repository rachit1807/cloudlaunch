import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createStore } from "../src/server/store.js";
import { createApp } from "../src/server/app.js";
test("project lifecycle, release validation, persistence, and password protection", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "cloudlaunch-test-"));
  process.env.DATA_DIR = dir;
  delete process.env.DATABASE_URL;
  delete process.env.WORKSPACE_PASSWORD;
  const store = await createStore(),
    server = createApp(store).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = "http://127.0.0.1:" + server.address().port;
  let password = "";
  const req = async (url, method = "GET", body) =>
    fetch(base + "/api" + url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Workspace-Password": password,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  try {
    assert.equal((await req("/health")).status, 200);
    assert.equal((await req("/projects", "POST", { name: "" })).status, 400);
    const fields = {
      name: "Test project",
      description: "A real API lifecycle test",
      stack: "React",
      environment: "Production",
      url: "https://example.com",
    };
    const result = await req("/projects", "POST", fields);
    assert.equal(result.status, 201);
    const p = await result.json();
    assert.equal(
      (
        await req("/projects/" + p.id + "/releases", "POST", {
          version: "v1.0.0",
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await req("/projects/" + p.id, "PATCH", {
          ...fields,
          checklist: [true, true, true, true],
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await req("/projects/" + p.id + "/releases", "POST", {
          version: "v1.0.0",
        })
      ).status,
      201,
    );
    assert.equal(
      (
        await req("/projects/" + p.id + "/releases", "POST", {
          version: "v1.0.0",
        })
      ).status,
      409,
    );
    const reopened = await createStore();
    assert.equal((await reopened.read()).projects[0].status, "Released");
    assert.equal(
      (
        await req("/projects/" + p.id, "PATCH", {
          ...fields,
          url: "javascript:alert(1)",
        })
      ).status,
      400,
    );
    process.env.WORKSPACE_PASSWORD = "test-password";
    assert.equal((await req("/workspace")).status, 401);
    password = "test-password";
    assert.equal((await req("/workspace")).status, 200);
    assert.equal((await req("/projects/" + p.id, "DELETE")).status, 204);
    const state = await (await req("/workspace")).json();
    assert.equal(state.projects.length, 0);
    assert.equal(state.deployments.length, 0);
    assert.equal((await req("/projects/missing", "DELETE")).status, 404);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    await rm(dir, { recursive: true, force: true });
    delete process.env.WORKSPACE_PASSWORD;
    delete process.env.DATA_DIR;
  }
});

test("public demo is isolated and rejects writes even with owner credentials", async () => {
  const previous = process.env.WORKSPACE_PASSWORD;
  process.env.WORKSPACE_PASSWORD = "private-test-password";
  let reads = 0, writes = 0;
  const server = createApp({ read: async () => { reads++; return { private: true }; }, update: async () => { writes++; } }).listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  try {
    const response = await fetch(base + "/demo");
    assert.equal(response.status, 200);
    const demo = await response.json();
    assert.equal(demo.projects.length, 2);
    assert.equal(demo.settings.name, "Demo workspace");
    assert.equal(reads, 0);
    assert.equal((await fetch(base + "/workspace")).status, 401);
    for (const [route, method] of [["/projects", "POST"], ["/projects/demo-cloudlaunch", "PATCH"], ["/projects/demo-cloudlaunch", "DELETE"], ["/projects/demo-cloudlaunch/releases", "POST"], ["/settings", "PATCH"]]) {
      assert.equal((await fetch(base + route, { method, headers: { "X-Demo-Mode": "true", "X-Workspace-Password": "private-test-password" } })).status, 403);
    }
    assert.equal(writes, 0);
  } finally {
    await new Promise(resolve => server.close(resolve));
    if (previous === undefined) delete process.env.WORKSPACE_PASSWORD;
    else process.env.WORKSPACE_PASSWORD = previous;
  }
});
