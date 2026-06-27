import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Point every test run at a throwaway SQLite db + payload dir so the server
// composition root (which opens the DB at import time) never touches the dev
// database. Set before any module reads `env`. Runs once per test file.
const dir = mkdtempSync(join(tmpdir(), "artefactor-test-"));
process.env.NODE_ENV = "test";
process.env.DATABASE_PATH = join(dir, "test.db");
process.env.ARTEFACTOR_PAYLOAD_DIR = join(dir, "payloads");
process.env.BETTER_AUTH_SECRET = "test-secret-at-least-32-characters-long";
process.env.BETTER_AUTH_URL = "http://localhost:3000";
// Tests sign up with @example.com identities; include it alongside the real
// production domains so the email-domain allowlist (IA4) admits them.
process.env.AUTH_ALLOWED_EMAIL_DOMAINS = "example.com,humly.io,humly.co.uk";
