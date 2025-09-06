import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './config/schema.tsx',
  dialect: 'postgresql',
  dbCredentials: {
    url:  'postgresql://neondb_owner:npg_miuJUG9o2BZV@ep-damp-river-a8lvf24c-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require',
  },
});
