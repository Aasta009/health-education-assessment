import { Pool } from "pg";
import { ROSTER } from "./roster-seed";
import { GROUP_ASSIGNMENTS_A, GROUP_ASSIGNMENTS_B } from "./group-assignments";

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
  is_leader BOOLEAN DEFAULT FALSE,
  is_hidden BOOLEAN DEFAULT FALSE
);
ALTER TABLE students ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;

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

CREATE TABLE IF NOT EXISTS group_docs (
  class TEXT NOT NULL,
  group_no INT NOT NULL,
  version TEXT NOT NULL,
  content TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (class, group_no, version)
);

-- Append-only history: every individual save is recorded here, never
-- overwritten, so the full editing process (including every duplicate or
-- revised submission) is always exportable, not just the latest state.
CREATE TABLE IF NOT EXISTS response_log (
  id SERIAL PRIMARY KEY,
  student_id TEXT NOT NULL,
  class TEXT NOT NULL,
  group_no INT,
  field_key TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Append-only history of every group finalize action, never overwritten.
CREATE TABLE IF NOT EXISTS finalize_log (
  id SERIAL PRIMARY KEY,
  class TEXT NOT NULL,
  group_no INT NOT NULL,
  field_key TEXT NOT NULL,
  content TEXT,
  finalized_by TEXT,
  finalized_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
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

  // Hidden test-student account: sits inside A班第1組 like a real member so
  // QA can exercise the full group flow, but is excluded from the member
  // list shown to the group's real students (see is_hidden filtering below).
  await p.query(
    `INSERT INTO students (student_id, name, class, group_no, is_leader, is_hidden)
     VALUES ('113120009', '測試學生', 'A', 1, false, true)
     ON CONFLICT (student_id)
     DO UPDATE SET name = EXCLUDED.name, class = EXCLUDED.class,
                   group_no = EXCLUDED.group_no, is_leader = EXCLUDED.is_leader,
                   is_hidden = EXCLUDED.is_hidden`
  );

  // Apply any provided group assignments — idempotent, safe to re-run as
  // more lists arrive (e.g. A班 later). Re-applying the same list just
  // re-confirms the same group_no/is_leader each time.
  for (const a of [...GROUP_ASSIGNMENTS_A, ...GROUP_ASSIGNMENTS_B]) {
    await p.query(
      `UPDATE students SET group_no = $2, is_leader = $3 WHERE student_id = $1`,
      [a.id, a.groupNo, a.isLeader]
    );
  }

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
