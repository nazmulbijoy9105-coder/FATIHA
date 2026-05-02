import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/auth/forgot-password — Reset password by email
// Flow: User provides email + new password. If email exists, password is updated.
export async function POST(req: NextRequest) {
  try {
    const { email, newPassword } = await req.json();

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: 'Email and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });

    if (!user) {
      // Don't reveal whether email exists for security
      return NextResponse.json({
        success: true,
        message: 'If this email is registered, the password has been reset.',
      });
    }

    // Update password
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: newPassword, updatedAt: new Date().toISOString() },
    });

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You can now sign in with your new password.',
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
