import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Subscription plans
const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'BDT',
    period: 'forever',
    features: [
      'Up to 2 cases',
      'Basic case overview',
      'Court jurisdiction reference',
      'Case type decision tree',
      'Limitation period lookup',
    ],
    limitations: [
      'No evidence analysis',
      'No fraud detection',
      'No injunction analysis',
      'No relief optimizer',
      'No client advisory',
      'No arguments builder',
      'No strategy engine',
    ],
    recommended: false,
  },
  {
    id: 'pro',
    name: 'PRO',
    price: 999,
    currency: 'BDT',
    period: 'monthly',
    features: [
      'Up to 20 cases',
      'Full case overview',
      'Evidence analysis & scoring',
      'Fraud detection engine',
      'Injunction analysis',
      'Relief optimizer',
      'Client advisory report',
      'Arguments builder',
      'Strategy engine',
      'Priority support',
    ],
    limitations: [],
    recommended: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 4999,
    currency: 'BDT',
    period: 'monthly',
    features: [
      'Unlimited cases',
      'All PRO features',
      'API access',
      'Bulk case import',
      'Priority analysis',
      'Custom legal templates',
      'Dedicated support',
      'Team collaboration',
    ],
    limitations: [],
    recommended: false,
  },
];

// Payment accounts for display
const PAYMENT_ACCOUNTS = {
  bkash: {
    number: '01712-345678',
    type: 'Send Money',
    instructions: [
      'Go to your bKash app',
      'Tap "Send Money"',
      'Enter: 01712-345678',
      'Enter the plan amount',
      'Enter reference: FATIHA-PRO',
      'Confirm and note the Transaction ID',
    ],
  },
  nagad: {
    number: '01712-345678',
    type: 'Send Money',
    instructions: [
      'Go to your Nagad app',
      'Tap "Send Money"',
      'Enter: 01712-345678',
      'Enter the plan amount',
      'Enter reference: FATIHA-PRO',
      'Confirm and note the Transaction ID',
    ],
  },
  bank: {
    bankName: 'Dutch-Bangla Bank Limited (DBBL)',
    accountName: 'FATIHA Legal Engineering',
    accountNumber: '1234567890',
    branch: 'Gulshan, Dhaka',
    routingNumber: '090260367',
    instructions: [
      'Transfer via your bank app or branch',
      'Account: Dutch-Bangla Bank Limited',
      'A/C Name: FATIHA Legal Engineering',
      'A/C No: 1234567890',
      'Branch: Gulshan, Dhaka',
      'Routing: 090260367',
      'Note the Transaction Reference',
    ],
  },
};

// GET /api/subscription — Get plans and payment info
export async function GET() {
  return NextResponse.json({ plans: PLANS, accounts: PAYMENT_ACCOUNTS });
}

// POST /api/subscription — Admin: manually update user plan
export async function POST(req: NextRequest) {
  try {
    const { adminKey, userId, plan } = await req.json();

    if (adminKey !== 'fatiha-admin-2024') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!userId || !plan) {
      return NextResponse.json({ error: 'userId and plan are required' }, { status: 400 });
    }

    if (!['free', 'pro', 'enterprise'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const user = await db.user.update({
      where: { id: userId },
      data: { plan: plan as 'free' | 'pro' | 'enterprise' },
    });

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, plan: user.plan },
      message: `User plan updated to ${plan.toUpperCase()}`,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
  }
}
