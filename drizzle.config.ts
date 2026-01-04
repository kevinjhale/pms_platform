import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

const databaseUrl = process.env.DATABASE_URL || 'file:./data/pms.db';
const isPostgres = databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://');

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: isPostgres ? 'postgresql' : 'sqlite',
  dbCredentials: isPostgres
    ? { url: databaseUrl }
    : { url: databaseUrl.startsWith('file:') ? databaseUrl.slice(5) : databaseUrl },
});
