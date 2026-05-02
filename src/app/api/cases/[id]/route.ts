import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const legalCase = await db.case.findUnique({
      where: { id },
    });

    if (!legalCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    return NextResponse.json(legalCase);
  } catch (error) {
    console.error('Error fetching case:', error);
    return NextResponse.json({ error: 'Failed to fetch case' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await db.case.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.plaintiff !== undefined && { plaintiff: body.plaintiff }),
        ...(body.defendant !== undefined && { defendant: body.defendant }),
        ...(body.court !== undefined && { court: body.court }),
        ...(body.mouza !== undefined && { mouza: body.mouza }),
        ...(body.dag !== undefined && { dag: body.dag }),
        ...(body.khatian !== undefined && { khatian: body.khatian }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.factsJson !== undefined && { factsJson: body.factsJson }),
        ...(body.analysisJson !== undefined && { analysisJson: body.analysisJson }),
        ...(body.scoreJson !== undefined && { scoreJson: body.scoreJson }),
        ...(body.status !== undefined && { status: body.status }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating case:', error);
    return NextResponse.json({ error: 'Failed to update case' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.case.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting case:', error);
    return NextResponse.json({ error: 'Failed to delete case' }, { status: 500 });
  }
}
