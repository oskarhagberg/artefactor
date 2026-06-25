import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db, sqlite } from "./client";
import { env } from "../../server/env";

migrate(db, { migrationsFolder: env.MIGRATIONS_DIR });
sqlite.close();
console.log(`Migrations applied from ${env.MIGRATIONS_DIR}`);
