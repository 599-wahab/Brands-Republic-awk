import { neon } from "@neondatabase/serverless";

export function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  if (!url.startsWith("postgresql://")) throw new Error("DATABASE_URL must be a PostgreSQL connection string");
  return url;
}

export function getDb() {
  return neon(getDatabaseUrl());
}
