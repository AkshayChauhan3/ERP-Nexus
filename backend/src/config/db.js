/**
 * config/db.js — Prisma Client Singleton
 *
 * What this file does:
 *   Creates ONE instance of PrismaClient and reuses it across the entire app.
 *
 *   WHY A SINGLETON?
 *   PrismaClient manages a connection pool internally. If you create a new
 *   PrismaClient() in every file that needs DB access, you'll open hundreds of
 *   connections and exhaust the PostgreSQL connection limit very quickly.
 *   By exporting a single instance from this file, every module that does
 *   `const prisma = require('../config/db')` shares the SAME connection pool.
 *
 *   HOW PRISMA CONNECTS:
 *   It reads DATABASE_URL from .env automatically.
 *   Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
 *
 *   LOGGING:
 *   In development, we log SQL queries to help debug business logic.
 *   In production, we only log errors (performance + security).
 *
 * Usage in any module:
 *   const prisma = require('../../config/db');
 *   const users = await prisma.user.findMany();
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']   // Show SQL in dev console
    : ['error'],                            // Only errors in production
});

// Graceful shutdown — disconnect Prisma when the process exits
// This prevents "connection leak" warnings during testing
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
