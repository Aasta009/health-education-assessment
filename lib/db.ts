import { Pool } from "pg";
import { ROSTER } from "./roster-seed";

let pool: Pool | null = null;
let readyPromise: Promise<void> | null = null;

function resolveConnectionString(): string {
  const entries = Object.entries(process.env) as [string, string | undefined][];
  const isBad = (k: string) => /UNPOOLED|NO_SSL|PRISMA/i.test(k);
  const pgUrl = entries.find(([k, v]) => v && /POSTGRES_URL$/i.test(k) && !isBad(k));
  if (pgUrl) return pgUrl[1] as string;
  const dbUrl = entries.find(([k, v]) => v && /DATABASE_URL$/i.test(k) && !isBad(k));
  if (dbUrl) return dbUrl[1] as string;
  const anyPg = entries.find(([k, v]) => v && /postgres/i.test(k) && /url/i.test(k) && !isBad(k));
  if (anyPg) return anyPg[1] as string;
  throw new Error("找不到 Postgres 連線字串環境變數，請確認資料庫已連結到此專案。");
}

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: resolveConnectionString(),
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }
  return pool;
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS students (
  student_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  class TEXT NOT NULL,
  group_no INT,
  is_leader BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS responses (
  student_id TEXT NOT NULL REFERENCES students(student_id),
  class TEXT NOT NULL,
  group_no INT,
  field_key TEXT NOT NULL,
  content TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (student_id, field_key)
);

CREATE TABLE IF NOT EXISTS group_finals (
  class TEXT NOT NULL,
  group_no INT NOT NULL,
  field_key TEXT NOT NULL,
  content TEXT,
  finalized_by TEXT,
  finalized_by_name TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (class, group_no, field_key)
);

CREATE TABLE IF NOT EXISTS reflections (
  student_id TEXT PRIMARY KEY REFERENCES students(student_id),
  name TEXT,
  class TEXT NOT NULL,
  group_no INT,
  content TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS group_docs (
  class TEXT NOT NULL,
  group_no INT NOT NULL,
  version TEXT NOT NULL,
  content TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (class, group_no, version)
);
`;

async function ensureSchemaAndSeed() {
  const p = getPool();
  await p.query(SCHEMA_SQL);
  // Idempotent roster seed — insert only if not already present.
  for (const s of ROSTER) {
    await p.query(
      `INSERT INTO students (student_id, name, class) VALUES ($1, $2, $3)
       ON CONFLICT (student_id) DO NOTHING`,
      [s.id, s.name, s.cls]
    );
  }

  // TA test/maintenance account: can log in on the student side to test the
  // full flow (assigned to its own isolated test group so it never mixes
  // with real students' data), and separately has teacher-passcode access
  // to view every group read-only. Kept idempotent so re-running is safe.
  await p.query(
    `INSERT INTO students (student_id, name, class, group_no, is_leader)
     VALUES ('113120009', 'TA測試帳號', 'T', 1, false)
     ON CONFLICT (student_id)
     DO UPDATE SET name = EXCLUDED.name, class = EXCLUDED.class,
                   group_no = EXCLUDED.group_no, is_leader = EXCLUDED.is_leader`
  );
}

// Call this at the top of every API route before touching the DB.
export async function ensureReady(): Promise<void> {
  if (!readyPromise) {
    readyPromise = ensureSchemaAndSeed().catch((err) => {
      readyPromise = null; // allow retry on next call if it failed
      throw err;
    });
  }
  return readyPromise;
}
