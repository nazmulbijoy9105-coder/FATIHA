import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const ADMIN_EMAILS = [
  { email: 'adv.nazmul.bijoy@gmail.com', name: 'Adv Md Nazmul Islam BIJOY' },
  { email: 'nazmulbijoy9105@gmail.com', name: 'Adv Md Nazmul Islam BIJOY' },
];

const DEFAULT_ADMIN_PASSWORD = 'admin123';

// POST /api/auth/seed — Ensure admin accounts exist
export async function POST() {
  try {
    const users = await db.user.findMany({});
    const created: string[] = [];

    for (const admin of ADMIN_EMAILS) {
      const existing = users.find(u => u.email.toLowerCase() === admin.email.toLowerCase());
      if (!existing) {
        await db.user.create({
          data: {
            email: admin.email,
            name: admin.name,
            phone: '',
            passwordHash: DEFAULT_ADMIN_PASSWORD,
            role: 'admin',
            plan: 'enterprise',
            provider: 'credentials',
            lastLogin: new Date().toISOString(),
          },
        });
        created.push(admin.email);
      }
    }

    // Also ensure test user exists
    const testUser = users.find(u => u.email === 'test@fatiha.com');
    if (!testUser) {
      await db.user.create({
        data: {
          email: 'test@fatiha.com',
          name: 'Test User',
          phone: '01712345678',
          passwordHash: 'test123',
          role: 'user',
          plan: 'free',
          provider: 'credentials',
          lastLogin: new Date().toISOString(),
        },
      });
      created.push('test@fatiha.com');
    }

    return NextResponse.json({
      seeded: true,
      created,
      message: created.length > 0
        ? `Admin accounts created. Login with email and password: ${DEFAULT_ADMIN_PASSWORD}`
        : 'Admin accounts already exist.',
      adminPassword: DEFAULT_ADMIN_PASSWORD,
    });
  } catch (err) {
    console.error('Seed error:', err);
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 });
  }
}

// GET /api/auth/seed — Check admin status
export async function GET() {
  try {
    const users = await db.user.findMany({});
    const admins = users.filter(u => u.role === 'admin');
    return NextResponse.json({
      totalUsers: users.length,
      admins: admins.map(u => ({ email: u.email, name: u.name, plan: u.plan })),
    });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
