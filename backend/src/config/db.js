import "./env.js";
import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL && process.env.NODE_ENV !== "test") {
  throw new Error("DATABASE_URL is required");
}

export const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL
    })
  : null;

let queryImplementation = null;

export function setQueryImplementation(handler) {
  queryImplementation = handler;
}

export function resetQueryImplementation() {
  queryImplementation = null;
}

export async function query(text, params) {
  if (queryImplementation) {
    return queryImplementation(text, params);
  }

  if (!pool) {
    throw new Error("DATABASE_URL is required");
  }

  return pool.query(text, params);
}
