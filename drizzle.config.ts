import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || 'postgresql://neondb_owner:placeholder@ep-sample.us-east-2.aws.neon.tech/neondb?sslmode=require',
  },
});
