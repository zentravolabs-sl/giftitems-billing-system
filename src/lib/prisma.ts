import { neonConfig, Pool } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import ws from "ws";

// Enable WebSocket support for Neon serverless driver (avoids cold-start TCP timeouts)
neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  neonPool: Pool | undefined;
};

const connectionString = process.env.DATABASE_URL!;

const pool =
  globalForPrisma.neonPool ??
  new Pool({
    connectionString,
    // Keep a small pool – Neon free tier limits concurrent connections
    max: 5,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.neonPool = pool;
}

const adapter = new PrismaNeon(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
