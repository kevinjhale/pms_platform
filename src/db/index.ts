import { drizzle as drizzleSqlite, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzlePostgres, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import Database from 'better-sqlite3';
import postgres from 'postgres';
import * as schema from './schema';

export type DatabaseType = 'sqlite' | 'postgres';

// Determine database type from URL
function getDatabaseType(): DatabaseType {
  const url = process.env.DATABASE_URL || '';
  if (url.startsWith('postgres://') || url.startsWith('postgresql://')) {
    return 'postgres';
  }
  return 'sqlite';
}

// Create appropriate database connection
function createSqliteDb(): BetterSQLite3Database<typeof schema> {
  const url = process.env.DATABASE_URL || 'file:./data/pms.db';
  const sqlitePath = url.startsWith('file:') ? url.slice(5) : './data/pms.db';
  const sqlite = new Database(sqlitePath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  return drizzleSqlite(sqlite, { schema });
}

function createPostgresDb(): PostgresJsDatabase<typeof schema> {
  const url = process.env.DATABASE_URL!;
  const client = postgres(url);
  return drizzlePostgres(client, { schema });
}

// Singleton pattern
let sqliteDb: BetterSQLite3Database<typeof schema> | null = null;
let postgresDb: PostgresJsDatabase<typeof schema> | null = null;

export const dbType = getDatabaseType();

// Type-safe getters for each database type
export function getSqliteDb(): BetterSQLite3Database<typeof schema> {
  if (!sqliteDb) {
    sqliteDb = createSqliteDb();
  }
  return sqliteDb;
}

export function getPostgresDb(): PostgresJsDatabase<typeof schema> {
  if (!postgresDb) {
    postgresDb = createPostgresDb();
  }
  return postgresDb;
}

// Convenience function that returns the correct type based on config
// Using SQLite as default for development
export function getDb(): BetterSQLite3Database<typeof schema> {
  if (dbType === 'postgres') {
    // In production with Postgres, you'd use getPostgresDb()
    // For now, the schema is SQLite-based, so we return SQLite
    // TODO: Create unified query interface or use postgres schema
    throw new Error('Postgres support requires schema migration. Use SQLite for now.');
  }
  return getSqliteDb();
}

// Re-export schema for convenience
export * from './schema';
