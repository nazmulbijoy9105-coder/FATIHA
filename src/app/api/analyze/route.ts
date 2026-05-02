import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { runFullAnalysis } from '@/lib/engine/decision-engine';
import type { CaseFacts } from '@/lib/engine/types';

export async function POST(request: NextRequest) {
  try {
    const { caseId, caseFacts } = await request.json();

    if (!caseId || !caseFacts) {
      return NextResponse.json({ error: 'caseId and caseFacts are required' }, { status: 400 });
    }

    // Run the full 14-stage decision engine
    const fullResult = runFullAnalysis(caseId, caseFacts as CaseFacts);

    // Save to database — non-blocking: log failure but still return results
    try {
      await db.case.update({
        where: { id: caseId },
        data: {
          analysisJson: JSON.stringify(fullResult),
          scoreJson: JSON.stringify({
            overallScore: fullResult.overallScore,
            overallRisk: fullResult.overallRisk,
            winProbability: fullResult.decision.winProbability,
            outcomeType: fullResult.decision.outcomeType,
          }),
          status: 'analyzed',
        },
      });
    } catch (dbError) {
      // Don't fail the analysis just because DB save failed
      // This handles Vercel's ephemeral /tmp and migration scenarios
      console.warn('Analysis DB save failed (non-critical):', dbError instanceof Error ? dbError.message : dbError);
    }

    return NextResponse.json(fullResult);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
