// ═══════════════════════════════════════════════════════════════
// FATIHA v3.1 — Production Data Layer (Prisma + PostgreSQL only)
//
// Requires DATABASE_URL environment variable (Neon / Vercel Postgres)
// No local fallback — this is a Vercel-first production system.
// ═══════════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client';

// ─── VERCEL SERVERLESS SINGLETON ─────────────────────────────────
// Prevents "too many connections" crashes on Vercel by reusing 
// the PrismaClient instance across isolated Serverless function calls.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
// ─────────────────────────────────────────────────────────────────


// ─── DATE NORMALIZATION ───────────────────────────────────────────────────
function iso(val: Date | string | null | undefined): string | null {
  if (!val) return null;
  return typeof val === 'string' ? val : (val as Date).toISOString();
}

// ─── HELPERS ─────────────────────────────────────────────────────────────
function stripNulls(obj: any): any {
  const clean: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) clean[k] = v;
  }
  return clean;
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC DB API — Prisma-only
// ═══════════════════════════════════════════════════════════════

export const db = {
  // ─── CASES ───────────────────────────────────────────────────────
  case: {
    findMany: async (opts?: { orderBy?: { createdAt?: string }; take?: number; where?: { userId?: string } }) => {
      const where: any = opts?.where?.userId ? { userId: opts.where.userId } : undefined;
      const orderBy: any = opts?.orderBy?.createdAt === 'desc' ? { createdAt: 'desc' } : undefined;
      const rows = await prisma.case.findMany({ where, orderBy, take: opts?.take });
      return rows.map((r: any) => ({ ...r, createdAt: iso(r.createdAt), updatedAt: iso(r.updatedAt) }));
    },

    findUnique: async (opts: { where: { id: string } }) => {
      const r = await prisma.case.findUnique({ where: { id: opts.where.id } });
      return r ? { ...r, createdAt: iso(r.createdAt), updatedAt: iso(r.updatedAt) } : null;
    },

    count: async () => {
      return prisma.case.count();
    },

    create: async (opts: { data: any }) => {
      const r = await prisma.case.create({ data: stripNulls(opts.data) });
      return { ...r, createdAt: iso(r.createdAt), updatedAt: iso(r.updatedAt) };
    },

    update: async (opts: { where: { id: string }; data: any }) => {
      const data: any = { ...opts.data };
      delete data.id; delete data.createdAt;
      const r = await prisma.case.update({ where: { id: opts.where.id }, data });
      return { ...r, createdAt: iso(r.createdAt), updatedAt: iso(r.updatedAt) };
    },

    delete: async (opts: { where: { id: string } }) => {
      await prisma.case.delete({ where: { id: opts.where.id } });
      return;
    },
  },

  // ─── USERS ──────────────────────────────────────────────────────
  user: {
    findMany: async (opts?: { where?: { email?: string; phone?: string } }) => {
      const where: any = {};
      if (opts?.where?.email) where.email = opts.where.email;
      if (opts?.where?.phone) where.phone = opts.where.phone;
      const rows = await prisma.user.findMany({ where: Object.keys(where).length ? where : undefined });
      return rows.map((r: any) => ({ ...r, createdAt: iso(r.createdAt), updatedAt: iso(r.updatedAt), lastLogin: iso(r.lastLogin) }));
    },

    findUnique: async (opts: { where: { id: string } | { email: string } }) => {
      const key = 'email' in opts.where ? 'email' : 'id';
      const r = await prisma.user.findUnique({ where: { [key]: opts.where[key] } });
      return r ? { ...r, createdAt: iso(r.createdAt), updatedAt: iso(r.updatedAt), lastLogin: iso(r.lastLogin) } : null;
    },

    create: async (opts: { data: any }) => {
      const r = await prisma.user.create({ data: stripNulls(opts.data) });
      return { ...r, createdAt: iso(r.createdAt), updatedAt: iso(r.updatedAt), lastLogin: iso(r.lastLogin) };
    },

    update: async (opts: { where: { id: string }; data: any }) => {
      const data: any = { ...opts.data };
      delete data.id; delete data.createdAt;
      if (data.lastLogin) data.lastLogin = new Date(data.lastLogin);
      const r = await prisma.user.update({ where: { id: opts.where.id }, data });
      return { ...r, createdAt: iso(r.createdAt), updatedAt: iso(r.updatedAt), lastLogin: iso(r.lastLogin) };
    },

    delete: async (opts: { where: { id: string } }) => {
      await prisma.user.delete({ where: { id: opts.where.id } });
      return;
    },

    count: async () => {
      return prisma.user.count();
    },
  },

  // ─── PAYMENTS ───────────────────────────────────────────────────
  payment: {
    findMany: async (opts?: { where?: { userId?: string; status?: string } }) => {
      const where: any = {};
      if (opts?.where?.userId) where.userId = opts.where.userId;
      if (opts?.where?.status) where.status = opts.where.status;
      const rows = await prisma.payment.findMany({
        where: Object.keys(where).length ? where : undefined,
        orderBy: { createdAt: 'desc' },
      });
      return rows.map((r: any) => ({ ...r, createdAt: iso(r.createdAt), updatedAt: iso(r.updatedAt), verifiedAt: iso(r.verifiedAt) }));
    },

    findUnique: async (opts: { where: { id: string } }) => {
      const r = await prisma.payment.findUnique({ where: { id: opts.where.id } });
      return r ? { ...r, createdAt: iso(r.createdAt), updatedAt: iso(r.updatedAt), verifiedAt: iso(r.verifiedAt) } : null;
    },

    create: async (opts: { data: any }) => {
      const d = { ...opts.data };
      if (d.verifiedAt) d.verifiedAt = new Date(d.verifiedAt);
      const r = await prisma.payment.create({ data: stripNulls(d) });
      return { ...r, createdAt: iso(r.createdAt), updatedAt: iso(r.updatedAt), verifiedAt: iso(r.verifiedAt) };
    },

    update: async (opts: { where: { id: string }; data: any }) => {
      const data: any = { ...opts.data };
      delete data.id; delete data.createdAt;
      if (data.verifiedAt) data.verifiedAt = new Date(data.verifiedAt);
      const r = await prisma.payment.update({ where: { id: opts.where.id }, data });
      return { ...r, createdAt: iso(r.createdAt), updatedAt: iso(r.updatedAt), verifiedAt: iso(r.verifiedAt) };
    },

    count: async () => {
      return prisma.payment.count();
    },
  },
};