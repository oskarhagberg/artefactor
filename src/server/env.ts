import { z } from "zod";

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_PATH: z.string().min(1).default("./data/artefactor.db"),
  ARTEFACTOR_PAYLOAD_DIR: z.string().min(1).default("./data/payloads"),
  MIGRATIONS_DIR: z.string().min(1).default("./src/infra/db/migrations"),
  CLIENT_DIR: z.string().min(1).default("./dist/client"),
});

export type Env = z.infer<typeof schema>;

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // Fail fast on misconfiguration.
  console.error("Invalid environment configuration:");
  console.error(z.treeifyError(parsed.error));
  process.exit(1);
}

export const env: Env = parsed.data;
