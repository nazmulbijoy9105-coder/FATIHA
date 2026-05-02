import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    const cases = await db.case.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      ...(userId ? { where: { userId } } : {}),
    });
    return NextResponse.json(cases);
  } catch (error) {
    console.error('Error fetching cases:', error);
    return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title, plaintiff, defendant, court, mouza, dag, khatian,
      description, factsJson, userId,
    } = body;

    if (!title || !plaintiff || !defendant) {
      return NextResponse.json(
        { error: 'Title, plaintiff, and defendant are required' },
        { status: 400 }
      );
    }

    const caseCount = await db.case.count();
    const caseNumber = `FATIHA-${String(caseCount + 1).padStart(4, '0')}`;

    const newCase = await db.case.create({
      data: {
        caseNumber,
        title,
        plaintiff,
        defendant,
        court: court || null,
        mouza: mouza || null,
        dag: dag || null,
        khatian: khatian || null,
        description: description || null,
        factsJson: factsJson ? JSON.stringify(factsJson) : null,
        userId: userId || null,
        status: 'draft',
      },
    });

    return NextResponse.json(newCase, { status: 201 });
  } catch (error) {
    console.error('Error creating case:', error);
    return NextResponse.json({ error: 'Failed to create case' }, { status: 500 });
  }
}
