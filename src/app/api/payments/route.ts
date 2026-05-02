import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Payment configuration
const PLAN_PRICES: Record<string, number> = {
  pro: 999,
  enterprise: 4999,
};

const PAYMENT_ACCOUNTS = {
  bkash: { number: '01712-345678', label: 'bKash Merchant Account', type: 'Send Money' },
  nagad: { number: '01712-345678', label: 'Nagad Merchant Account', type: 'Send Money' },
  bank: {
    bankName: 'Dutch-Bangla Bank Limited (DBBL)',
    accountName: 'FATIHA Legal Engineering',
    accountNumber: '1234567890',
    branch: 'Gulshan, Dhaka',
    routingNumber: '090260367',
    type: 'Bank Transfer',
  },
};

// GET /api/payments — List payments (user's own or admin all)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const adminKey = searchParams.get('adminKey');

    if (adminKey === 'fatiha-admin-2024') {
      // Admin: return all payments
      const payments = await db.payment.findMany();
      return NextResponse.json({ payments, accounts: PAYMENT_ACCOUNTS });
    }

    if (userId) {
      // User: return own payments
      const payments = await db.payment.findMany({ where: { userId } });
      return NextResponse.json({ payments, accounts: PAYMENT_ACCOUNTS });
    }

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

// POST /api/payments — Create new payment
export async function POST(req: NextRequest) {
  try {
    const { userId, plan, method, transactionId, note } = await req.json();

    if (!userId || !plan || !method || !transactionId) {
      return NextResponse.json({ error: 'userId, plan, method, and transactionId are required' }, { status: 400 });
    }

    if (!['pro', 'enterprise'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    if (!['bkash', 'nagad', 'bank'].includes(method)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }

    // Get user info
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const amount = PLAN_PRICES[plan];

    const payment = await db.payment.create({
      data: {
        userId,
        userName: user.name,
        userEmail: user.email,
        userPhone: user.phone,
        plan: plan as 'pro' | 'enterprise',
        amount,
        currency: 'BDT',
        method: method as 'bkash' | 'nagad' | 'bank',
        transactionId,
        status: 'pending',
        note: note || undefined,
      },
    });

    return NextResponse.json({
      payment,
      message: 'Payment submitted for verification. Admin will review shortly.',
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}
