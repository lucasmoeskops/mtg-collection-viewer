import postgres from "postgres";

let sql: ReturnType<typeof postgres> | undefined;

const url = process.env.DATABASE_URL;

if (url) {
  sql = postgres(url, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
}

export function getClient() {
  return sql;
}
