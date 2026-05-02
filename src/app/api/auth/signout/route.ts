import { NextResponse } from 'next/server';

export async function POST() {
  // Client handles clearing localStorage state.
  // This endpoint exists so the client's fetch('/api/auth/signout', { method: 'POST' }) call succeeds.
  return NextResponse.json({ signedOut: true });
}
