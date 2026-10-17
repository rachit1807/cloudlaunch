// Manual deployment for code that has already been committed and pushed.
// Keep API credentials in the process environment, never in source or arguments.
const { RENDER_SERVICE_ID: service, RENDER_API_KEY: token } = process.env;
if (!service || !token)
  throw new Error("RENDER_SERVICE_ID and RENDER_API_KEY are required.");
if (!/^srv-[a-z0-9]+$/.test(service))
  throw new Error("Invalid Render service ID.");
const base = `https://api.render.com/v1/services/${service}`;
async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok)
    throw new Error(
      `Render API returned ${response.status}. Check access and service configuration.`,
    );
  return response.json();
}
const deployment = await api(`${base}/deploys`, {
  method: "POST",
  body: JSON.stringify({ clearCache: "do_not_clear" }),
});
console.log(`Deployment queued: ${deployment.id}`);
const deadline = Date.now() + 20 * 60 * 1000;
while (Date.now() < deadline) {
  const deploy = await api(`${base}/deploys/${deployment.id}`);
  console.log(`Deployment status: ${deploy.status}`);
  if (deploy.status === "live") {
    const info = await api(base);
    const url = info.serviceDetails?.url;
    if (!url)
      throw new Error("Deploy is live but no service URL was returned.");
    const health = await fetch(`${url}/api/health`);
    if (!health.ok || (await health.json()).status !== "ok")
      throw new Error("Live database health check failed.");
    console.log(`CloudLaunch is live: ${url}`);
    process.exit(0);
  }
  if (
    [
      "build_failed",
      "update_failed",
      "pre_deploy_failed",
      "canceled",
      "deactivated",
    ].includes(deploy.status)
  )
    throw new Error(`Deploy ended with ${deploy.status}. Check Render logs.`);
  await new Promise((resolve) => setTimeout(resolve, 10000));
}
throw new Error(
  "Deployment is still pending. Check the existing deploy before triggering another.",
);
