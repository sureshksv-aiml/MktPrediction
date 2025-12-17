import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!);

async function checkTables() {
  const result = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('app_states', 'sessions', 'events')
  `;
  console.log("ADK Session Tables found:", result.map(r => r.table_name));
  await sql.end();
}

checkTables();
