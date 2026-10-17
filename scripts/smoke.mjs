const base = process.argv[2];
if (!base)
  throw Error("Usage: node scripts/smoke.mjs https://your-service.run.app");
const response = await fetch(new URL("/api/health", base));
if (!response.ok) throw Error("Health check failed: " + response.status);
const data = await response.json();
if (data.status !== "ok") throw Error("Database health check failed");
const html = await fetch(base);
if (!html.ok || !(await html.text()).includes("CloudLaunch"))
  throw Error("Frontend check failed");
console.log("Frontend and database health checks passed.");
