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

-- Controls how many stage-1 "chapters" (1-4) each class may currently see
-- and edit. Only the TA may change this; students never advance themselves.
CREATE TABLE IF NOT EXISTS stage_gate (
  class TEXT PRIMARY KEY,
  unlocked_level INT NOT NULL DEFAULT 1
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

  // TA also has a plain student-side test account (isolated test group) so
  // it can still exercise the full student flow when needed, separate from
  // its "A113120009" staff-login code.
  await p.query(
    `INSERT INTO students (student_id, name, class, group_no, is_leader)
     VALUES ('113120009', 'TA測試帳號', 'T', 1, false)
     ON CONFLICT (student_id)
     DO UPDATE SET name = EXCLUDED.name, class = EXCLUDED.class,
                   group_no = EXCLUDED.group_no, is_leader = EXCLUDED.is_leader`
  );

  // Every class starts with only chapter 1 unlocked; the TA opens the rest.
  for (const cls of ["A", "B", "T"]) {
    await p.query(
      `INSERT INTO stage_gate (class, unlocked_level) VALUES ($1, 1)
       ON CONFLICT (class) DO NOTHING`,
      [cls]
    );
  }
}

export async function getUnlockedLevel(cls: string): Promise<number> {
  const pool = getPool();
  const { rows } = await pool.query(`SELECT unlocked_level FROM stage_gate WHERE class = $1`, [cls]);
  return rows[0]?.unlocked_level ?? 1;
}

export async function setUnlockedLevel(cls: string, level: number): Promise<void> {
  const pool = getPool();
  await pool.query(
    `INSERT INTO stage_gate (class, unlocked_level) VALUES ($1, $2)
     ON CONFLICT (class) DO UPDATE SET unlocked_level = EXCLUDED.unlocked_level`,
    [cls, level]
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
