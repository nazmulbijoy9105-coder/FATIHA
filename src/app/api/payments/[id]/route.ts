import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PATCH /api/payments/[id] — Verify or reject payment (admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { adminKey, action, rejectionReason } = await req.json();

    if (adminKey !== 'fatiha-admin-2024') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payment = await db.payment.findUnique({ where: { id } });
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (payment.status !== 'pending') {
      return NextResponse.json({ error: `Payment already ${payment.status}` }, { status: 400 });
    }

    if (action === 'verify') {
      // Verify payment and upgrade user plan
      const updatedPayment = await db.payment.update({
        where: { id },
        data: {
          status: 'verified',
          verifiedAt: new Date().toISOString(),
          verifiedBy: 'admin',
        },
      });

      // Upgrade user plan
      await db.user.update({
        where: { id: payment.userId },
        data: { plan: payment.plan },
      });

      return NextResponse.json({
        payment: updatedPayment,
        message: `Payment verified. User upgraded to ${payment.plan.toUpperCase()}.`,
      });
    }

    if (action === 'reject') {
      const updatedPayment = await db.payment.update({
        where: { id },
        data: {
          status: 'rejected',
          verifiedBy: 'admin',
          rejectionReason: rejectionReason || 'Payment could not be verified',
        },
      });

      return NextResponse.json({
        payment: updatedPayment,
        message: 'Payment rejected.',
      });
    }

    return NextResponse.json({ error: 'Invalid action. Use "verify" or "reject".' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
  }
}
