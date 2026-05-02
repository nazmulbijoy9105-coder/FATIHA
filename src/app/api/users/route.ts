import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const ADMIN_EMAIL = 'adv.nazmul.bijoy@gmail.com';

// POST /api/users/signup — Register new user
export async function POST(req: NextRequest) {
  try {
    const { email, name, phone, password } = await req.json();

    if (!email || !name || !password) {
      return NextResponse.json({ error: 'Email, name, and password are required' }, { status: 400 });
    }

    // Check if email already exists
    const existing = await db.user.findMany({ where: { email } });
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Check if phone already exists
    if (phone) {
      const existingPhone = await db.user.findMany({ where: { phone } });
      if (existingPhone.length > 0) {
        return NextResponse.json({ error: 'Phone number already registered' }, { status: 409 });
      }
    }

    const ADMIN_EMAILS = ['adv.nazmul.bijoy@gmail.com', 'nazmulbijoy9105@gmail.com'];
    const role: 'admin' | 'user' = ADMIN_EMAILS.includes(email.toLowerCase()) ? 'admin' : 'user';
    const plan = role === 'admin' ? 'enterprise' : 'free';

    const user = await db.user.create({
      data: {
        email,
        name,
        phone: phone || '',
        passwordHash: password, // In production, use bcrypt
        role,
        plan,
        provider: 'credentials',
        lastLogin: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      plan: user.plan,
    });
  } catch (err) {
    console.error('Signup error:', err);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

// GET /api/users — List all users (admin only)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const adminKey = searchParams.get('adminKey');

    // Simple admin key check for now
    if (adminKey !== 'fatiha-admin-2024') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await db.user.findMany();
    return NextResponse.json(users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      phone: u.phone,
      role: u.role,
      plan: u.plan,
      provider: u.provider,
      lastLogin: u.lastLogin,
      createdAt: u.createdAt,
    })));
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
