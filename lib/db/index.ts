import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Load connection string from env with graceful safety placeholder
const connectionString = process.env.DATABASE_URL || "postgresql://postgres.soqjlmnphdubaxvhfvpj:osPVzp0yNdm5yXFc@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require";

// Disable prefetch for Next.js Server Action connection pooling compatibility
export const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
