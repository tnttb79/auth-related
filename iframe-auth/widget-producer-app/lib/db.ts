// Singleton Prisma client for the widget producer app.
// Reusing the same instance across hot reloads in dev

import path from "node:path";
import { PrismaClient } from "@/app/generated/prisma/client";

// Prisma 6 on Windows cannot resolve relative SQLite paths at runtime.
// We resolve relative file: URLs against the schema directory (./prisma)
// so runtime matches CLI behavior.
function getAbsoluteDatabaseUrl(): string {
  const u = process.env.DATABASE_URL ?? "file:./dev.db";
  if (!u.startsWith("file:")) return u;

  const filePart = u.slice("file:".length);

  // Already an absolute path — use as-is
  if (path.isAbsolute(filePart)) return u;

  // Relative path: resolve against schema directory and return absolute
  const relative = filePart.replace(/^\.\//, "");
  const abs = path.join(process.cwd(), "prisma", relative);
  return "file:" + abs;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: getAbsoluteDatabaseUrl() } },
  });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
