import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import pg from "pg";
const initial = () => ({
  projects: [],
  deployments: [],
  settings: { name: "My workspace", owner: "Rachit Tripathi" },
  activity: [],
});
export async function createStore() {
  let pool;
  const schema = process.env.DATABASE_SCHEMA || "cloudlaunch";
  if (!/^[a-z_][a-z0-9_]{0,62}$/.test(schema))
    throw new Error("Invalid DATABASE_SCHEMA");
  const table = `"${schema}".workspace`;
  if (process.env.DATABASE_URL) {
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      max: 3,
      connectionTimeoutMillis: 5000,
    });
    await pool.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
    await pool.query(
      `CREATE TABLE IF NOT EXISTS ${table} (id INTEGER PRIMARY KEY, data JSONB NOT NULL)`,
    );
    await pool.query(
      `INSERT INTO ${table}(id,data) VALUES(1,$1) ON CONFLICT DO NOTHING`,
      [initial()],
    );
  }
  const dir = path.resolve(process.env.DATA_DIR || ".data"),
    file = path.join(dir, "workspace.json");
  if (!pool) {
    await mkdir(dir, { recursive: true });
    try {
      await readFile(file);
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
      await writeFile(file, JSON.stringify(initial()));
    }
  }
  let queue = Promise.resolve();
  async function read() {
    if (pool)
      return (await pool.query(`SELECT data FROM ${table} WHERE id=1`)).rows[0]
        .data;
    return JSON.parse(await readFile(file, "utf8"));
  }
  function update(fn) {
    const operation = queue.then(async () => {
      if (pool) {
        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          const data = (
            await client.query(
              `SELECT data FROM ${table} WHERE id=1 FOR UPDATE`,
            )
          ).rows[0].data;
          const result = fn(data);
          await client.query(`UPDATE ${table} SET data=$1 WHERE id=1`, [data]);
          await client.query("COMMIT");
          return result;
        } catch (e) {
          await client.query("ROLLBACK");
          throw e;
        } finally {
          client.release();
        }
      }
      const data = await read();
      const result = fn(data);
      await writeFile(file + ".tmp", JSON.stringify(data));
      await rename(file + ".tmp", file);
      return result;
    });
    queue = operation.catch(() => {});
    return operation;
  }
  return {
    read,
    update,
    close: () => pool?.end(),
    mode: pool ? "PostgreSQL" : "Local file",
  };
}
