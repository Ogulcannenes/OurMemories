// Supabase CLI wrapper. The DB URL comes from .env.local and is never printed:
// the CLI runs without a shell (no quoting / injection issues with special characters
// in the password) and all of its output, including error messages, is masked.
import { spawnSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const url = process.env.SUPABASE_DB_URL;
const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const secrets = [url];

function mask(s) {
  return secrets.filter(Boolean).reduce((out, x) => out.split(x).join("****"), String(s ?? ""));
}
function fail(msg) {
  console.error(mask(msg));
  process.exit(1);
}

if (!url) fail("SUPABASE_DB_URL is not set in .env.local (see .env.example).");
let parsed;
try {
  parsed = new URL(url);
} catch {
  fail("SUPABASE_DB_URL is not a valid postgresql:// URL.");
}
if (parsed.password) secrets.push(parsed.password, decodeURIComponent(parsed.password));

const exe = ["@supabase/cli-windows-x64/bin/supabase.exe", "supabase/bin/supabase"]
  .map((p) => join("node_modules", p))
  .find(existsSync);
if (!exe) fail("Supabase CLI binary not found in node_modules (run npm install).");

function cli(args, { capture = false } = {}) {
  // DO_NOT_TRACK: with telemetry on, CLI 3.2 keeps running after the command finishes.
  const r = spawnSync(exe, args, {
    encoding: "utf8",
    shell: false,
    env: { ...process.env, DO_NOT_TRACK: "1" },
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 64 * 1024 * 1024,
    timeout: 5 * 60 * 1000,
  });
  if (r.error) fail(`Could not start Supabase CLI: ${r.error.message}`);
  if (!capture) process.stdout.write(mask(r.stdout));
  process.stderr.write(mask(r.stderr));
  if (r.status !== 0) fail(`Supabase CLI exited with code ${r.status}.`);
  return r.stdout;
}

/** Confirms the DB URL points at the same project as NEXT_PUBLIC_SUPABASE_URL (prints no secrets). */
function check() {
  const publicRef = /^https:\/\/([a-z0-9]+)\.supabase\.co\/?$/.exec(publicUrl)?.[1];
  // Pooler: user is "postgres.<ref>"; direct: host is "db.<ref>.supabase.co".
  const dbRef = parsed.username.split(".")[1] ?? /^db\.([a-z0-9]+)\.supabase\.co$/.exec(parsed.hostname)?.[1];
  const kind = parsed.hostname.endsWith(".pooler.supabase.com")
    ? parsed.port === "6543"
      ? "transaction pooler"
      : "session pooler"
    : parsed.hostname.startsWith("db.")
      ? "direct connection"
      : "unknown host";
  console.log(`connection type  : ${kind} (port ${parsed.port || "default"})`);
  console.log(`project ref match: ${Boolean(publicRef && dbRef && publicRef === dbRef)}`);
  console.log(`password present : ${Boolean(parsed.password)}`);
  if (!publicRef || publicRef !== dbRef) fail("SUPABASE_DB_URL does not belong to the project in NEXT_PUBLIC_SUPABASE_URL.");
}

const [cmd, arg] = process.argv.slice(2);
switch (cmd) {
  case "check":
    check();
    break;
  case "dry-run":
    check();
    cli(["db", "push", `--remote=${url}`, "--dry-run"]);
    break;
  case "push":
    check();
    cli(["db", "push", `--remote=${url}`, "--yes"]);
    break;
  case "types": {
    const out = cli(["gen", "types", "typescript", `--remote=${url}`, "--schema=public"], { capture: true });
    writeFileSync("src/lib/supabase/database.types.ts", out);
    console.log("Wrote src/lib/supabase/database.types.ts");
    break;
  }
  case "query": // read-only SQL from a file, for inspection
    if (!arg) fail("Usage: node scripts/db.mjs query <file.sql>");
    cli(["db", "query", `--remote=${url}`, "--read-only", "--file", arg]);
    break;
  case "exec": // WRITE: runs a SQL file against the remote DB. Only for explicitly approved one-off changes.
    if (!arg) fail("Usage: node scripts/db.mjs exec <file.sql>");
    check();
    cli(["db", "query", `--remote=${url}`, "--file", arg, "--yes"]);
    break;
  default:
    fail("Usage: node scripts/db.mjs <check|dry-run|push|types|query <file>>");
}
