import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    // Accept userId from query param (set by client via localStorage)
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      // Return 200 so browser console doesn't show red 401 errors
      // Client handles authenticated: false gracefully via localStorage cache
      return NextResponse.json({ authenticated: false, reason: 'no_user_id' });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      // User not found in DB — likely ephemeral storage on serverless (Vercel)
      // Return 200 so browser doesn't log 401; client keeps localStorage cache
      return NextResponse.json({ authenticated: false, reason: 'user_not_found' });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        plan: user.plan,
        avatar: user.avatar,
      },
    });
  } catch {
    // DB error (e.g., file system unavailable on serverless)
    // Return 200 to avoid console errors; client keeps localStorage cache
    return NextResponse.json({ authenticated: false, reason: 'db_error' });
  }
}
