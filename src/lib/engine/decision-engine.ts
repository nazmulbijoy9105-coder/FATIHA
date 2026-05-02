// ═══════════════════════════════════════════════════════════════════════════
// FATIHA v3.0 — Decision Engine (Main Orchestrator)
// Runs all 14 stages sequentially → Final Decision → Advisory → Strategy → Arguments
// ═══════════════════════════════════════════════════════════════════════════

import type {
  CaseFacts, FullAnalysisResult, StagePipelineResult, DecisionOutput,
  ClientAdvisory, StrategyResult, StrategyPhase, ArgumentNode, ArgumentTree,
  Stage0Result, Stage1Result, Stage2Result, Stage25Result, PreconditionResult,
  Stage4Result, ArthaRinResult, Order37Result, Stage7Result, Stage8Result,
  Stage9Result, PartitionResult, AdversePossessionResult, PreEmptionResult,
  AppealResult, ExecutionResult, Severity, ReliefType, OutcomeType,
} from './types';

import { runStage0, runStage1, runStage2, runStage25, runStage3, runStage4 } from './stages-0-to-4';
import { runStage5, runStage6, runStage7, runStage8, runStage9 } from './stages-5-to-9';
import { runStage10, runStage11, runStage12, runStage13, runStage14 } from './stages-10-to-14';

// ═══════════════════════════════════════════════════════════════════════════
// MAIN ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════════════

export function runFullAnalysis(caseId: string, facts: CaseFacts): FullAnalysisResult {
  const pipeline: StagePipelineResult[] = [];
  const allFlags: Array<{ id: string; severity: Severity; message: string; legalRef: string }> = [];

  // ─── helper: add pipeline entry ──────────────────────────────────────
  const addPipeline = (
    stageNumber: number,
    stageName: string,
    status: StagePipelineResult['status'],
    severity: Severity,
    summary: string,
    legalRef: string,
    flags: StagePipelineResult['flags'],
  ): void => {
    const now = new Date().toISOString();
    pipeline.push({ stageNumber, stageName, status, severity, summary, legalRef, flags, startedAt: now, completedAt: now });
    for (const f of flags) allFlags.push(f);
  };

  // ═══════════════════════════════════════════════════════════════════════
  // STAGE 0 — ENTRY GATE
  // ═══════════════════════════════════════════════════════════════════════
  let stage0!: Stage0Result;
  try {
    stage0 = runStage0(facts);
    const objFlags = stage0.objections.map(o => ({
      id: `0-${o.type}`,
      severity: 'yellow' as Severity,
      message: o.description,
      legalRef: o.section,
    }));
    addPipeline(0, 'Entry Gate', 'completed', 'info',
      `Track: ${stage0.track} | Suit: ${stage0.suitTrack} | Court: ${stage0.assignedCourt}`,
      stage0.primaryLaw, objFlags);
  } catch (e) {
    stage0 = { track: 'unknown', suitTrack: 'regular', primaryLaw: 'Unknown', territorialJurisdiction: { basis: 'unknown', court: 'unknown', section: '' }, pecuniaryJurisdiction: { courtLevel: 'unknown', amountClaimed: 0, limit: 'unknown', section: '' }, assignedCourt: 'unknown', objections: [] };
    addPipeline(0, 'Entry Gate', 'error', 'red', 'Stage 0 failed: ' + (e instanceof Error ? e.message : String(e)), '', []);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STAGE 1 — FACT EXTRACTION
  // ═══════════════════════════════════════════════════════════════════════
  let stage1!: Stage1Result;
  try {
    stage1 = runStage1(facts);
    const s1Flags: StagePipelineResult['flags'] = [];
    if (stage1.missingParties.length > 0) {
      s1Flags.push({ id: '1-MISSING', severity: 'yellow', message: 'Missing parties: ' + stage1.missingParties.join(', '), legalRef: 'CPC O.1 R.9' });
    }
    if (stage1.isBankCreditor) s1Flags.push({ id: '1-BANK', severity: 'info', message: 'Bank/financial institution creditor — Artha Rin track', legalRef: 'Artha Rin Ain 2003' });
    if (stage1.isNegotiableInstrument) s1Flags.push({ id: '1-NEGOTIABLE', severity: 'info', message: 'Negotiable instrument detected — Order 37 summary suit', legalRef: 'CPC O.37' });
    addPipeline(1, 'Fact Extraction', 'completed', 'info',
      `${stage1.parties.length} parties | ${stage1.transactionChain.length} transaction(s) | Possessor: ${stage1.possession.currentPossessor}`,
      'CPC O.7 + Evidence Act', s1Flags);
  } catch (e) {
    stage1 = { parties: [], transactionChain: [], possession: { currentPossessor: 'unknown', nature: 'owner' }, documentStack: [], missingParties: [], guardianRequired: false, isBankCreditor: false, isNegotiableInstrument: false, isArthaRinEligible: false };
    addPipeline(1, 'Fact Extraction', 'error', 'red', 'Stage 1 failed: ' + (e instanceof Error ? e.message : String(e)), '', []);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STAGE 2 — LEGAL CLASSIFICATION
  // ═══════════════════════════════════════════════════════════════════════
  let stage2!: Stage2Result;
  try {
    stage2 = runStage2(facts, stage0);
    addPipeline(2, 'Legal Classification', 'completed', 'info',
      `Class: ${stage2.classification.name} (${stage2.classification.code}) → Stage ${stage2.routedStage}`,
      'CPC + SRA', []);
  } catch (e) {
    stage2 = { classification: { code: 'unknown', name: 'Unknown', description: 'Classification failed', targetStage: 7 }, routedStage: 7 };
    addPipeline(2, 'Legal Classification', 'error', 'red', 'Stage 2 failed: ' + (e instanceof Error ? e.message : String(e)), '', []);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STAGE 2.5 — TPA + SAT ACT
  // ═══════════════════════════════════════════════════════════════════════
  let stage25!: Stage25Result;
  try {
    stage25 = runStage25(facts, stage1, stage2);
    const s25Severity: Severity = stage25.flags.some(f => f.severity === 'critical') ? 'red' : stage25.flags.length > 0 ? 'yellow' : 'green';
    addPipeline(2.5, 'TPA + SAT Act', 'completed', s25Severity,
      `${stage25.flags.length} flag(s) | Khas: ${stage25.satAct?.khasLand || 'N/A'} | Ceiling: ${facts.ceilingExceeded || false}`,
      'TPA + SAT Act', stage25.flags);
  } catch (e) {
    stage25 = { saleValidity: { registered: false, considerationOver100: false, validUnderS54: false, validUnderS17: false, issues: [] }, flags: [] };
    addPipeline(2.5, 'TPA + SAT Act', 'error', 'red', 'Stage 2.5 failed: ' + (e instanceof Error ? e.message : String(e)), '', []);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STAGE 3 — PRECONDITION FILTERS
  // ═══════════════════════════════════════════════════════════════════════
  let stage3!: PreconditionResult;
  try {
    stage3 = runStage3(facts, stage1);
    const s3Severity: Severity = !stage3.passed ? 'red' : stage3.bars.some(b => b.severity === 'yellow') ? 'yellow' : 'green';
    addPipeline(3, 'Precondition Filters', 'completed', s3Severity,
      stage3.passed
        ? `PASS | Registration: ${stage3.registration.admissibleForTitle ? 'OK' : 'S.49 BAR'} | Stamp: ${stage3.stamp.status}`
        : `BLOCKED | Critical: ${stage3.criticalBlockers.join('; ')}`,
      'Registration Act + Stamp Act', stage3.bars);
  } catch (e) {
    stage3 = { registration: { isCompulsorilyRegistrable: false, isRegistered: false, admissibleForTitle: false, admissibleForCollateral: false, section17: false, section49: false }, stamp: { sufficientlyStamped: false, impounded: false, penaltyRequired: false, status: 'pass' }, possession: stage1.possession, mutation: { status: 'unknown', weight: 'unknown', nonConclusive: true }, bars: [], passed: false, criticalBlockers: ['Stage 3 error'] };
    addPipeline(3, 'Precondition Filters', 'error', 'red', 'Stage 3 failed: ' + (e instanceof Error ? e.message : String(e)), '', []);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STAGE 4 — LIMITATION ENGINE
  // ═══════════════════════════════════════════════════════════════════════
  let stage4!: Stage4Result;
  try {
    stage4 = runStage4(facts, stage0, stage2);
    const s4Severity: Severity = stage4.suitTimeBarred ? 'critical' : stage4.primaryLimitation.status === 'at_risk' ? 'yellow' : 'green';
    const s4Flags: StagePipelineResult['flags'] = [];
    if (stage4.suitTimeBarred) {
      s4Flags.push({ id: '4-BARRED', severity: 'critical', message: `Suit time-barred — ${stage4.primaryLimitation.article} (${stage4.primaryLimitation.period})`, legalRef: 'Limitation Act ' + stage4.primaryLimitation.article });
    }
    if (stage4.acknowledgementResets) {
      s4Flags.push({ id: '4-ACK', severity: 'info', message: 'Acknowledgement may reset limitation period', legalRef: 'Limitation Act S.19' });
    }
    addPipeline(4, 'Limitation Engine', 'completed', s4Severity,
      `${stage4.primaryLimitation.article} (${stage4.primaryLimitation.period}) — ${stage4.primaryLimitation.status} | Gate: ${stage4.gateResult.toUpperCase()}`,
      'Limitation Act', s4Flags);
  } catch (e) {
    stage4 = { primaryLimitation: { suitType: 'unknown', article: 'unknown', period: 'unknown', status: 'within_time', startDate: facts.causeOfActionDate || '' }, allApplicable: [], condonationAvailable: false, acknowledgementResets: false, partPaymentResets: false, fraudConcealment: false, suitTimeBarred: false, gateResult: 'pass' };
    addPipeline(4, 'Limitation Engine', 'error', 'red', 'Stage 4 failed: ' + (e instanceof Error ? e.message : String(e)), '', []);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STAGE 5 — ARTHA RIN (only if artha_rin track)
  // ═══════════════════════════════════════════════════════════════════════
  let stage5: ArthaRinResult | undefined;
  if (stage2.requiresArthaRin || stage0.suitTrack === 'artha_rin') {
    try {
      stage5 = runStage5(facts, stage0);
      addPipeline(5, 'Artha Rin Adalat', 'completed', stage5.eligible ? 'green' : 'yellow',
        stage5.eligible ? 'ELIGIBLE — Pre-litigation mediation required | Appeal: direct to HCD' : 'NOT ELIGIBLE',
        'Artha Rin Ain 2003', []);
    } catch (e) {
      addPipeline(5, 'Artha Rin Adalat', 'error', 'red', 'Stage 5 failed', '', []);
    }
  } else {
    addPipeline(5, 'Artha Rin Adalat', 'skipped', 'info', 'Not applicable — not a bank/financial institution claim', '', []);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STAGE 6 — ORDER 37 (only if negotiable instrument / order37 track)
  // ═══════════════════════════════════════════════════════════════════════
  let stage6: Order37Result | undefined;
  if (stage2.requiresOrder37 || stage0.suitTrack === 'order37_summary') {
    try {
      stage6 = runStage6(facts, stage0);
      addPipeline(6, 'Order 37 Summary Suit', 'completed', stage6.eligible ? 'green' : 'yellow',
        stage6.eligible ? `ELIGIBLE — ${stage6.basis} | Leave to defend: ${stage6.leaveToDefend}` : 'NOT ELIGIBLE',
        'CPC Order 37', []);
    } catch (e) {
      addPipeline(6, 'Order 37 Summary Suit', 'error', 'red', 'Stage 6 failed', '', []);
    }
  } else {
    addPipeline(6, 'Order 37 Summary Suit', 'skipped', 'info', 'Not applicable — not a negotiable instrument claim', '', []);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STAGE 7 — SRA ENGINE (regular track)
  // ═══════════════════════════════════════════════════════════════════════
  let stage7: Stage7Result | undefined;
  if (stage0.suitTrack === 'regular') {
    try {
      stage7 = runStage7(facts, stage0, stage2, stage4);
      const reliefNames = stage7.applicableReliefs.map(r => r.replace(/_/g, ' ')).join(', ');
      addPipeline(7, 'SRA Relief Engine', 'completed', 'info',
        `Applicable reliefs: ${reliefNames}`,
        'SRA 1877', []);
    } catch (e) {
      addPipeline(7, 'SRA Relief Engine', 'error', 'red', 'Stage 7 failed', '', []);
    }
  } else {
    addPipeline(7, 'SRA Relief Engine', 'skipped', 'info', `Skipped — ${stage0.suitTrack} track`, '', []);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STAGE 8 — EVIDENCE ENGINE
  // ═══════════════════════════════════════════════════════════════════════
  let stage8!: Stage8Result;
  try {
    stage8 = runStage8(facts, stage1, stage25);
    const s8Severity: Severity = stage8.evidenceStrength >= 70 ? 'green' : stage8.evidenceStrength >= 40 ? 'yellow' : 'red';
    addPipeline(8, 'Evidence Engine', 'completed', s8Severity,
      `Strength: ${stage8.evidenceStrength}/100 | ${stage8.documentHierarchy.length} document(s) | Burden: ${stage8.burdenOfProof.split('—')[0].trim()}`,
      'Evidence Act 1872', []);
  } catch (e) {
    stage8 = { documentHierarchy: [], evidenceActRules: [], burdenOfProof: 'plaintiff', adversarialThreshold: 'balance of probabilities', digitalEvidenceAdmissible: false, s65bCertificate: false, evidenceStrength: 30, keyWeaknesses: ['Stage 8 failed — review evidence manually'], keyStrengths: [] };
    addPipeline(8, 'Evidence Engine', 'error', 'red', 'Stage 8 failed: ' + (e instanceof Error ? e.message : String(e)), '', []);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STAGE 9 — PROCEDURAL DEFECT ENGINE
  // ═══════════════════════════════════════════════════════════════════════
  let stage9!: Stage9Result;
  try {
    stage9 = runStage9(facts, stage1, stage4);
    const s9Severity: Severity = !stage9.suitProceedable ? 'critical' : stage9.fatalDefects.length > 0 ? 'red' : stage9.waivableDefects.length > 0 ? 'yellow' : 'green';
    const s9Flags: StagePipelineResult['flags'] = stage9.fatalDefects.map(d => ({
      id: `9-${d.code}`, severity: 'critical' as Severity, message: `FATAL: ${d.description}`, legalRef: d.section,
    }));
    addPipeline(9, 'Procedural Defects', 'completed', s9Severity,
      stage9.suitProceedable
        ? `PROCEEDABLE — ${stage9.defects.filter(d => d.outcome === 'proceed').length}/${stage9.defects.length} checks passed`
        : `BLOCKED — ${stage9.blockingDefect}`,
      'CPC O.7 R.11 + O.1 R.9', s9Flags);
  } catch (e) {
    stage9 = { defects: [], fatalDefects: [], waivableDefects: [], suitProceedable: true, blockingDefect: null };
    addPipeline(9, 'Procedural Defects', 'error', 'red', 'Stage 9 failed: ' + (e instanceof Error ? e.message : String(e)), '', []);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STAGE 10 — PARTITION (only if partition claim)
  // ═══════════════════════════════════════════════════════════════════════
  let stage10: PartitionResult | undefined;
  if (stage2.requiresPartitionEngine || facts.partitionClaim) {
    try {
      stage10 = runStage10(facts, stage1);
      const s10Severity: Severity = stage10.coOwnershipEstablished ? 'green' : 'yellow';
      addPipeline(10, 'Partition Engine', 'completed', s10Severity,
        stage10.coOwnershipEstablished
          ? `Co-ownership established | ${stage10.coSharers.length} co-sharer(s) | Divisible: ${stage10.physicallyDivisible ? 'Yes' : 'No (sale+distribution)'} | ${stage10.limitationRisk.split('—')[0].trim()}`
          : 'Co-ownership not established — partition claim requires proof of co-ownership',
        'CPC S.54 + O.20 R.18', []);
    } catch (e) {
      addPipeline(10, 'Partition Engine', 'error', 'red', 'Stage 10 failed', '', []);
    }
  } else {
    addPipeline(10, 'Partition Engine', 'skipped', 'info', 'Not applicable — no partition claim', '', []);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STAGE 11 — ADVERSE POSSESSION (only if claim/defence)
  // ═══════════════════════════════════════════════════════════════════════
  let stage11: AdversePossessionResult | undefined;
  if (stage2.requiresAdversePossessionEngine || facts.adversePossessionClaim) {
    try {
      stage11 = runStage11(facts, stage1, stage4);
      const metCount = stage11.elements.filter(e => e.proven).length;
      const s11Severity: Severity = stage11.allElementsMet ? 'green' : metCount >= 4 ? 'yellow' : 'red';
      addPipeline(11, 'Adverse Possession', 'completed', s11Severity,
        `Position: ${stage11.position} | Elements: ${metCount}/6 met | Years: ${stage11.continuousYears || 0} | Tacking: ${stage11.tackingAvailable ? 'Available' : 'N/A'} | Outcome: ${stage11.outcome}`,
        'Limitation Act Art.142/144', []);
    } catch (e) {
      addPipeline(11, 'Adverse Possession', 'error', 'red', 'Stage 11 failed', '', []);
    }
  } else {
    addPipeline(11, 'Adverse Possession', 'skipped', 'info', 'Not applicable — no adverse possession claim', '', []);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STAGE 12 — PRE-EMPTION (only if claim)
  // ═══════════════════════════════════════════════════════════════════════
  let stage12: PreEmptionResult | undefined;
  if (stage2.requiresPreEmptionEngine || facts.preEmptionClaim) {
    try {
      stage12 = runStage12(facts, stage4);
      const s12Severity: Severity = stage12.outcome === 'substitution_granted' ? 'green' : stage12.outcome === 'pending_deposit' ? 'yellow' : 'red';
      addPipeline(12, 'Pre-emption Engine', 'completed', s12Severity,
        stage12.applicable
          ? `Applicable | Claimant: ${stage12.claimantType} (Priority ${stage12.priority}) | 4 months: ${stage12.limitation4Months ? 'WITHIN TIME' : 'BARRED'} | Deposit: ${stage12.preDepositMade ? 'Made' : 'NOT MADE'} | Outcome: ${stage12.outcome}`
          : `NOT APPLICABLE — requires agricultural land + sale deed`,
        'SAT Act S.96', []);
    } catch (e) {
      addPipeline(12, 'Pre-emption Engine', 'error', 'red', 'Stage 12 failed', '', []);
    }
  } else {
    addPipeline(12, 'Pre-emption Engine', 'skipped', 'info', 'Not applicable — no pre-emption claim', '', []);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ████████  FINAL DECISION ENGINE  ████████████████████████████████████
  // ═══════════════════════════════════════════════════════════════════════
  const decision = buildFinalDecision(facts, stage0, stage1, stage2, stage3, stage4,
    stage5, stage6, stage7, stage8, stage9, stage10, stage11, stage12);

  const decSeverity: Severity = decision.overallStrength === 'STRONG' ? 'green' : decision.overallStrength === 'MODERATE' ? 'yellow' : 'red';
  addPipeline(15, 'Final Decision', 'completed', decSeverity,
    `${decision.outcomeType.replace(/_/g, ' ').toUpperCase()} — ${decision.grantedReliefs.length} granted, ${decision.refusedReliefs.length} refused | Strength: ${decision.overallStrength} (${decision.winProbability}%) | Post-decree: ${decision.postDecreePath}`,
    'CPC + SRA + TPA + Limitation Act',
    decision.riskFactors.map(r => ({ id: 'DEC-' + Math.random().toString(36).slice(2, 6), severity: 'yellow' as Severity, message: r, legalRef: 'Decision Engine' })));

  // ═══════════════════════════════════════════════════════════════════════
  // STAGE 14 — EXECUTION (based on decision)
  // ═══════════════════════════════════════════════════════════════════════
  let stage14!: ExecutionResult;
  try {
    stage14 = runStage14(facts, decision, stage4);
    addPipeline(14, 'Execution Engine', 'completed', stage14.trigger ? 'info' : 'yellow',
      stage14.trigger
        ? `${stage14.decreeType} | Modes: ${stage14.modes.filter(m => m.applicable).length} applicable | Limit: ${stage14.limitationPeriod} | Objections: ${stage14.objections.length}`
        : 'No execution — no executable decree',
      'CPC Order 21', []);
  } catch (e) {
    stage14 = runStage14(facts, decision, stage4);
    addPipeline(14, 'Execution Engine', 'error', 'red', 'Stage 14 failed', '', []);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STAGE 13 — APPEAL + REVISION (informed by decision + execution)
  // ═══════════════════════════════════════════════════════════════════════
  let stage13!: AppealResult;
  try {
    stage13 = runStage13(facts, stage0, stage14);
    addPipeline(13, 'Appeal + Revision', 'completed', 'info',
      `First appeal: ${stage13.appealForum} | Second appeal: ${stage13.secondAppealAvailable ? 'Available (S.100)' : 'N/A'} | Stay: ${stage13.stayOfExecution ? 'Available' : 'N/A'}`,
      'CPC S.96/100/115 + O.47', []);
  } catch (e) {
    stage13 = runStage13(facts, stage0, stage14);
    addPipeline(13, 'Appeal + Revision', 'error', 'red', 'Stage 13 failed', '', []);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // GENERATE CLIENT ADVISORY
  // ═══════════════════════════════════════════════════════════════════════
  const clientSummary = generateAdvisory(decision, allFlags, stage4, stage13);

  // ═══════════════════════════════════════════════════════════════════════
  // GENERATE STRATEGY (4 phases)
  // ═══════════════════════════════════════════════════════════════════════
  const strategy = generateStrategy(decision, stage0, stage1, stage4, stage7, stage8, stage9, stage10, stage11, stage12, stage14, stage13);

  // ═══════════════════════════════════════════════════════════════════════
  // BUILD ARGUMENT TREE
  // ═══════════════════════════════════════════════════════════════════════
  const argumentTree = buildArgumentTree(stage0, stage1, stage3, stage4, stage7, stage8, stage9, stage10, stage11, stage12, decision);

  // ═══════════════════════════════════════════════════════════════════════
  // RETURN FULL ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════
  return {
    caseId,
    engineVersion: '3.0.0',
    pipeline,
    stage0, stage1, stage2, stage25, stage3, stage4,
    stage5, stage6, stage7, stage8, stage9,
    stage10, stage11, stage12, stage13, stage14,
    decision,
    clientSummary,
    strategy,
    argumentTree,
    overallScore: decision.winProbability,
    overallRisk: decision.overallStrength,
    executedAt: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// FINAL DECISION ENGINE
// ═══════════════════════════════════════════════════════════════════════════

function buildFinalDecision(
  facts: CaseFacts,
  stage0: Stage0Result,
  stage1: Stage1Result,
  stage2: Stage2Result,
  stage3: PreconditionResult,
  stage4: Stage4Result,
  stage5: ArthaRinResult | undefined,
  stage6: Order37Result | undefined,
  stage7: Stage7Result | undefined,
  stage8: Stage8Result,
  stage9: Stage9Result,
  stage10: PartitionResult | undefined,
  stage11: AdversePossessionResult | undefined,
  stage12: PreEmptionResult | undefined,
): DecisionOutput {
  const grantedReliefs: DecisionOutput['grantedReliefs'] = [];
  const refusedReliefs: DecisionOutput['refusedReliefs'] = [];
  const riskFactors: string[] = [];
  const strategicRecommendations: string[] = [];

  // ─── 1. CHECK PROCEDURAL BARS (Stage 9) ──────────────────────────────
  if (!stage9.suitProceedable && stage9.blockingDefect) {
    const fatal = stage9.fatalDefects[0];
    refusedReliefs.push({
      relief: 'none',
      reason: `Fatal procedural defect: ${fatal?.description || stage9.blockingDefect} — suit cannot proceed`,
      legalRef: fatal?.section || 'CPC O.7 R.11',
    });
    return {
      outcomeType: fatal?.outcome === 'return' ? 'return_of_plaint' : 'rejection_of_plaint',
      grantedReliefs: [],
      refusedReliefs,
      postDecreePath: 'complied',
      overallStrength: 'WEAK',
      winProbability: 5,
      estimatedTimeRange: 'N/A — suit rejected at threshold',
      riskFactors: ['Fatal procedural defect blocks suit', stage9.blockingDefect],
      strategicRecommendations: ['File fresh plaint after curing defects', 'Consult on procedural requirements', 'Verify jurisdiction, court fee, necessary parties'],
    };
  }

  // ─── 2. CHECK TIME BAR (Stage 4) ─────────────────────────────────────
  if (stage4.suitTimeBarred && !stage4.condonationAvailable) {
    refusedReliefs.push({
      relief: 'none',
      reason: `Suit time-barred under ${stage4.primaryLimitation.article} (${stage4.primaryLimitation.period}). No condonation available.`,
      legalRef: 'Limitation Act ' + stage4.primaryLimitation.article,
    });
    riskFactors.push('Suit time-barred — limitation defense will succeed');
    return {
      outcomeType: 'rejection_of_plaint',
      grantedReliefs: [],
      refusedReliefs,
      postDecreePath: 'complied',
      overallStrength: 'WEAK',
      winProbability: 5,
      estimatedTimeRange: 'N/A — suit rejected as time-barred',
      riskFactors,
      strategicRecommendations: [
        'Explore if any acknowledgment of debt/Right resets limitation (S.25 Limitation Act)',
        'Check if fraud concealment extends limitation (S.17 Limitation Act)',
        'If condonation possible, file application under S.5 Limitation Act',
      ],
    };
  }

  // ─── 3. CHECK PRECONDITION BLOCKERS (Stage 3) ────────────────────────
  if (!stage3.passed) {
    riskFactors.push('Precondition critical blocker — document may be inadmissible');
    for (const blocker of stage3.criticalBlockers) {
      refusedReliefs.push({ relief: 'none', reason: blocker, legalRef: 'Registration Act' });
    }
    strategicRecommendations.push('Obtain certified copies and correct registration before filing');
  }

  // ─── 4. TRACK-SPECIFIC RELIEF EVALUATION ──────────────────────────────

  // 4a. Artha Rin track
  if (stage0.suitTrack === 'artha_rin' && stage5) {
    if (stage5.eligible) {
      grantedReliefs.push({
        relief: 'money_decree',
        description: 'Artha Rin suit maintainable — decree for outstanding amount',
        legalRef: 'Artha Rin Ain 2003 S.5',
      });
      grantedReliefs.push({
        relief: 'execution_money',
        description: 'Execution through attachment, garnishee, or receiver',
        legalRef: 'Artha Rin Ain S.40-48',
      });
    } else {
      refusedReliefs.push({
        relief: 'money_decree',
        reason: 'Not eligible for Artha Rin Adalat — regular civil court route',
        legalRef: 'Artha Rin Ain S.2',
      });
    }
  }

  // 4b. Order 37 track
  if (stage0.suitTrack === 'order37_summary' && stage6) {
    if (stage6.eligible && stage6.leaveToDefend === 'refused') {
      grantedReliefs.push({
        relief: 'money_decree',
        description: 'Summary decree under Order 37 — leave to defend refused',
        legalRef: 'CPC Order 37 R.2',
      });
    } else if (stage6.eligible && stage6.leaveToDefend === 'granted') {
      refusedReliefs.push({
        relief: 'money_decree',
        reason: 'Leave to defend granted — transferred to ordinary suit',
        legalRef: 'CPC Order 37 R.3',
      });
      // But still have a shot in ordinary suit
      grantedReliefs.push({
        relief: 'money_decree',
        description: 'Transferred to ordinary suit — full trial on merits',
        legalRef: 'CPC Order 37 R.3 read with O.37 R.7',
      });
    } else {
      refusedReliefs.push({
        relief: 'money_decree',
        reason: 'Not eligible for Order 37 summary procedure',
        legalRef: 'CPC Order 37 R.1',
      });
    }
  }

  // 4c. Regular track (SRA reliefs)
  if (stage7) {
    // Declaration
    if (stage7.declaration?.outcome === 'granted') {
      grantedReliefs.push({ relief: 'declaration_of_title', description: 'Declaration of title granted — plaintiff is owner', legalRef: 'SRA S.42' });
    } else if (stage7.declaration?.outcome === 'refused') {
      refusedReliefs.push({ relief: 'declaration_of_title', reason: stage7.declaration.standingIssue || stage7.declaration.maintainabilityIssue || 'Standing or maintainability issue', legalRef: 'SRA S.42' });
    }

    // Possession
    if (stage7.possession?.allMet) {
      grantedReliefs.push({ relief: 'recovery_of_possession_title', description: `Recovery of possession — ${stage7.possession.outcome}`, legalRef: 'SRA S.8/S.9' });
    } else if (stage7.possession && !stage7.possession.allMet) {
      refusedReliefs.push({ relief: 'recovery_of_possession_title', reason: 'Possession elements not fully met', legalRef: 'SRA S.8/S.9' });
    }

    // Specific performance
    if (stage7.specificPerformance?.finalOutcome === 'granted') {
      grantedReliefs.push({ relief: 'specific_performance', description: 'Specific performance granted — contract to be executed', legalRef: 'SRA S.10-12' });
    } else if (stage7.specificPerformance?.finalOutcome === 'refused') {
      refusedReliefs.push({ relief: 'specific_performance', reason: 'S.14/S.16 bars apply or contract invalid', legalRef: 'SRA S.14/16' });
    }

    // Cancellation
    if (stage7.cancellation?.outcome === 'granted') {
      grantedReliefs.push({ relief: 'cancellation_of_deed', description: `Deed cancelled — ${stage7.cancellation.voidableOrVoid}`, legalRef: 'SRA S.39' });
    } else if (stage7.cancellation?.outcome === 'refused') {
      refusedReliefs.push({ relief: 'cancellation_of_deed', reason: 'Cancellation grounds not proven or limitation expired', legalRef: 'SRA S.39' });
    }

    // Temporary injunction
    if (stage7.temporaryInjunction?.outcome === 'interim' || stage7.temporaryInjunction?.outcome === 'ad_interim') {
      grantedReliefs.push({ relief: 'temporary_injunction', description: `${stage7.temporaryInjunction.outcome.replace('_', ' ')} injunction granted — O.39 three-prong test met`, legalRef: 'CPC Order 39 R.1/R.2' });
    } else if (stage7.temporaryInjunction?.outcome === 'refused') {
      refusedReliefs.push({ relief: 'temporary_injunction', reason: 'O.39 conditions not met — no prima facie case or balance against', legalRef: 'CPC Order 39 R.1' });
    }

    // Permanent injunction
    if (stage7.permanentInjunction?.outcome === 'permanent' || stage7.permanentInjunction?.outcome === 'mandatory') {
      grantedReliefs.push({ relief: 'permanent_injunction', description: `${stage7.permanentInjunction.outcome} injunction — breach of obligation established`, legalRef: 'SRA S.52-57' });
    } else if (stage7.permanentInjunction?.outcome === 'refused') {
      refusedReliefs.push({ relief: 'permanent_injunction', reason: 'Conditions not met — compensation adequate or no breach', legalRef: 'SRA S.52' });
    }

    // Money decree
    if (stage7.applicableReliefs.includes('money_decree') && facts.amountClaimed) {
      grantedReliefs.push({ relief: 'money_decree', description: `Money decree for Tk ${facts.amountClaimed.toLocaleString()}`, legalRef: 'CPC' });
    }
  }

  // ─── 5. SPECIAL RELIEF ENGINES ────────────────────────────────────────

  // 5a. Partition
  if (stage10?.coOwnershipEstablished) {
    grantedReliefs.push({
      relief: 'partition',
      description: `Partition decree — ${stage10.coSharers.length} co-sharer(s), mode: ${stage10.finalDecree.mode.replace(/_/g, ' ')}`,
      legalRef: 'CPC S.54 + O.20 R.18',
    });
  } else if (facts.partitionClaim && stage10 && !stage10.coOwnershipEstablished) {
    refusedReliefs.push({
      relief: 'partition',
      reason: 'Co-ownership not established — partition requires proof of joint ownership',
      legalRef: 'CPC S.54',
    });
  }

  // 5b. Adverse possession
  if (stage11?.allElementsMet) {
    if (stage11.position === 'claim') {
      grantedReliefs.push({
        relief: 'adverse_possession_declaration',
        description: `Title by adverse possession — ${stage11.continuousYears} years, all 6 elements proven`,
        legalRef: 'Limitation Act Art.142',
      });
    } else {
      riskFactors.push('Adverse possession defence likely to succeed — plaintiff must counter');
      strategicRecommendations.push('Prepare to rebut adverse possession elements — challenge continuity, openness, or animus');
    }
  } else if (stage11 && !stage11.allElementsMet) {
    if (stage11.position === 'claim') {
      refusedReliefs.push({
        relief: 'adverse_possession_declaration',
        reason: `Elements not met: ${stage11.gaps?.join(', ') || 'insufficient proof'}`,
        legalRef: 'Limitation Act Art.142',
      });
    }
  }

  // 5c. Pre-emption
  if (stage12?.applicable) {
    if (stage12.outcome === 'substitution_granted') {
      grantedReliefs.push({
        relief: 'pre_emption_substitution',
        description: `Pre-emption substitution — ${stage12.claimantType}, consideration: Tk ${stage12.saleConsideration?.toLocaleString() || 'N/A'}`,
        legalRef: 'SAT Act S.96',
      });
    } else if (stage12.outcome === 'pending_deposit') {
      refusedReliefs.push({
        relief: 'pre_emption_substitution',
        reason: 'Pre-deposit not made — full sale consideration must be deposited',
        legalRef: 'SAT Act S.96',
      });
      strategicRecommendations.push('Deposit full sale consideration in court immediately to proceed with pre-emption');
    } else {
      refusedReliefs.push({
        relief: 'pre_emption_substitution',
        reason: 'Scope or limitation not met — requires agricultural land, sale deed, within 4 months',
        legalRef: 'SAT Act S.96',
      });
    }
  }

  // ─── 6. ADDITIONAL RISK FACTORS ───────────────────────────────────────
  if (stage4.gateResult === 'condonable') {
    riskFactors.push('Suit time-barred but condonation may be available — file S.5 application');
  }
  if (stage3.bars.length > 0 && stage3.passed) {
    riskFactors.push(`${stage3.bars.length} precondition warning(s) — may weaken case`);
  }
  if (stage8.evidenceStrength < 40) {
    riskFactors.push('Evidence strength below 40% — case vulnerable on merits');
  }
  if (stage8.evidenceStrength < 60) {
    riskFactors.push('Evidence strength moderate — stronger documentary evidence needed');
  }
  if (stage9.waivableDefects.length > 0) {
    riskFactors.push(`${stage9.waivableDefects.length} waivable defect(s) — return risk if not cured`);
  }

  // ─── 7. DETERMINE OUTCOME TYPE ────────────────────────────────────────
  let outcomeType: OutcomeType;
  if (grantedReliefs.length === 0 && refusedReliefs.length > 0) {
    outcomeType = 'dismissal';
  } else if (grantedReliefs.length > 0 && refusedReliefs.length === 0) {
    outcomeType = 'full_decree';
  } else if (grantedReliefs.length > 0 && refusedReliefs.length > 0) {
    outcomeType = 'partial_decree';
  } else {
    outcomeType = 'dismissal';
  }

  // Preliminary decree for partition
  if (grantedReliefs.some(r => r.relief === 'partition') && stage10?.coOwnershipEstablished) {
    outcomeType = 'preliminary_decree';
  }

  // ─── 8. CALCULATE WIN PROBABILITY ─────────────────────────────────────
  let winProbability = 50; // base

  // Evidence strength (0-100, weight: 30%)
  winProbability += (stage8.evidenceStrength - 50) * 0.3;

  // Limitation (weight: 20%)
  if (stage4.suitTimeBarred && stage4.condonationAvailable) winProbability -= 15;
  if (stage4.primaryLimitation.status === 'at_risk') winProbability -= 8;
  if (stage4.gateResult === 'pass') winProbability += 5;

  // Procedural (weight: 15%)
  if (!stage9.suitProceedable) winProbability -= 30;
  if (stage9.waivableDefects.length > 0) winProbability -= stage9.waivableDefects.length * 5;

  // Precondition (weight: 10%)
  if (!stage3.passed) winProbability -= 20;
  if (stage3.bars.some(b => b.severity === 'critical')) winProbability -= 10;

  // Relief success rate (weight: 15%)
  const totalReliefAttempts = grantedReliefs.length + refusedReliefs.length;
  if (totalReliefAttempts > 0) {
    const successRate = grantedReliefs.length / totalReliefAttempts;
    winProbability += (successRate - 0.5) * 20;
  }

  // Special engine boosts
  if (stage11?.allElementsMet) winProbability += 10;
  if (stage12?.outcome === 'substitution_granted') winProbability += 10;
  if (stage10?.coOwnershipEstablished) winProbability += 5;

  winProbability = Math.max(5, Math.min(95, Math.round(winProbability)));

  // ─── 9. OVERALL STRENGTH ──────────────────────────────────────────────
  let overallStrength: DecisionOutput['overallStrength'];
  if (winProbability >= 70) overallStrength = 'STRONG';
  else if (winProbability >= 40) overallStrength = 'MODERATE';
  else overallStrength = 'WEAK';

  // ─── 10. POST-DECREE PATH ─────────────────────────────────────────────
  let postDecreePath: DecisionOutput['postDecreePath'];
  if (overallStrength === 'STRONG') {
    postDecreePath = grantedReliefs.length > 0 ? 'execution' : 'complied';
  } else if (overallStrength === 'MODERATE') {
    postDecreePath = 'execution';
  } else {
    postDecreePath = 'appealed';
  }

  // ─── 11. ESTIMATED TIME ───────────────────────────────────────────────
  let estimatedTimeRange: string;
  if (outcomeType === 'rejection_of_plaint' || outcomeType === 'return_of_plaint') {
    estimatedTimeRange = '1–3 months (rejection/return at threshold)';
  } else if (stage0.suitTrack === 'artha_rin') {
    estimatedTimeRange = '2–5 years (Artha Rin with appeal)';
  } else if (stage0.suitTrack === 'order37_summary') {
    estimatedTimeRange = '6 months – 2 years (summary or ordinary)';
  } else {
    estimatedTimeRange = '3–8 years (regular civil suit with appeal)';
  }

  // ─── 12. STRATEGIC RECOMMENDATIONS ────────────────────────────────────
  if (stage3.bars.some(b => b.severity === 'yellow') && strategicRecommendations.length === 0) {
    strategicRecommendations.push('Address precondition warnings before trial — obtain proper documentation');
  }
  if (stage8.keyWeaknesses.length > 2) {
    strategicRecommendations.push('Strengthen evidence — ' + stage8.keyWeaknesses[0]);
  }
  if (facts.mutationStatus !== 'completed' && facts.mouza) {
    strategicRecommendations.push('Initiate mutation proceedings — support title claim with revenue record');
  }

  // ─── 13. CONDITIONS ───────────────────────────────────────────────────
  const conditions: string[] = [];
  if (stage3.stamp.penaltyRequired) conditions.push('Pay stamp duty penalty before document admission');
  if (stage12?.outcome === 'pending_deposit') conditions.push('Deposit full sale consideration for pre-emption');
  if (stage5?.preLitigationMediation.mandatory && stage5?.preLitigationMediation.mediationStatus === 'pending') {
    conditions.push('Complete pre-litigation mediation (90 days)');
  }
  if (facts.isGovernmentDefendant && !facts.s80NoticeGiven) {
    conditions.push('Give 2-month S.80 notice to government before filing');
  }

  return {
    outcomeType,
    grantedReliefs,
    refusedReliefs,
    conditions: conditions.length > 0 ? conditions : undefined,
    postDecreePath,
    overallStrength,
    winProbability,
    estimatedTimeRange,
    riskFactors: riskFactors.length > 0 ? riskFactors : ['No critical risk factors identified'],
    strategicRecommendations: strategicRecommendations.length > 0 ? strategicRecommendations : ['Proceed with suit filing', 'Prepare comprehensive evidence bundle'],
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CLIENT ADVISORY GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

function generateAdvisory(
  decision: DecisionOutput,
  allFlags: StagePipelineResult['flags'],
  stage4: Stage4Result,
  stage13: AppealResult,
): ClientAdvisory {
  const prob = decision.winProbability;

  // Win chance
  let winChance: string;
  if (prob >= 75) winChance = 'High — Strong legal position with substantial evidence support';
  else if (prob >= 60) winChance = 'Good — Favourable position with manageable risks';
  else if (prob >= 40) winChance = 'Moderate — Case has merits but significant challenges';
  else winChance = 'Low — Substantial legal or evidentiary weaknesses';

  // Cost risk
  let costRisk: string;
  if (decision.overallStrength === 'STRONG') costRisk = 'Low — Likely to recover costs if successful';
  else if (decision.overallStrength === 'MODERATE') costRisk = 'Moderate — Legal costs may be partially recoverable';
  else costRisk = 'High — Risk of bearing both legal costs and adverse costs';

  // Advice
  const grantedCount = decision.grantedReliefs.length;
  const refusedCount = decision.refusedReliefs.length;
  let advice: string;
  if (grantedCount > 0 && refusedCount === 0) {
    advice = `Your case has a ${winChance.split('—')[0].trim()} chance of success (${prob}%). ` +
      `${grantedCount} relief(s) likely to be granted. ` +
      `Key focus: ${decision.strategicRecommendations[0] || 'proceed with filing'}. ` +
      `Estimated timeline: ${decision.estimatedTimeRange}.`;
  } else if (grantedCount > 0 && refusedCount > 0) {
    advice = `Your case has a ${winChance.split('—')[0].trim()} chance of success (${prob}%). ` +
      `Partial relief likely — ${grantedCount} relief(s) may be granted, ${refusedCount} may face challenges. ` +
      `Strategy should focus on strengthening ${decision.grantedReliefs[0]?.relief.replace(/_/g, ' ') || 'primary relief'}.`;
  } else {
    advice = `Your case faces significant challenges (${prob}% win probability). ` +
      `Key barriers: ${decision.riskFactors[0] || 'weak evidentiary basis'}. ` +
      `Consider: ${decision.strategicRecommendations[0] || 'settlement negotiation'}.`;
  }

  // Critical actions
  const criticalActions: string[] = [];
  if (stage4.gateResult === 'barred') criticalActions.push('URGENT: Suit time-barred — seek condonation or explore alternative remedies');
  else if (stage4.primaryLimitation.status === 'at_risk') criticalActions.push('URGENT: Limitation approaching — file suit immediately');
  if (decision.conditions) decision.conditions.forEach(c => criticalActions.push(c));
  if (criticalActions.length === 0) criticalActions.push('File plaint with all required documents and court fee');

  // Warnings
  const warnings: string[] = [];
  const criticalFlags = allFlags.filter(f => f.severity === 'critical');
  criticalFlags.forEach(f => warnings.push(f.message));
  decision.riskFactors.forEach(r => { if (!warnings.includes(r)) warnings.push(r); });

  // Next steps
  const nextSteps: string[] = [
    'Consult with an advocate to review this analysis',
    `File suit at ${stage13.appealForum.includes('High Court') ? 'appropriate court' : stage13.appealForum} based on jurisdiction`,
    'Prepare certified copies of all title documents',
    'Arrange for court fee payment',
  ];
  if (decision.strategicRecommendations.length > 0) {
    nextSteps.push(decision.strategicRecommendations[0]);
  }

  return {
    winChance,
    estimatedTime: decision.estimatedTimeRange,
    costRisk,
    advice,
    criticalActions,
    warnings: warnings.length > 0 ? warnings : ['No critical warnings'],
    nextSteps,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// STRATEGY GENERATOR (4 phases)
// ═══════════════════════════════════════════════════════════════════════════

function generateStrategy(
  decision: DecisionOutput,
  stage0: Stage0Result,
  stage1: Stage1Result,
  stage4: Stage4Result,
  stage7: Stage7Result | undefined,
  stage8: Stage8Result,
  stage9: Stage9Result,
  stage10: PartitionResult | undefined,
  stage11: AdversePossessionResult | undefined,
  stage12: PreEmptionResult | undefined,
  stage14: ExecutionResult,
  stage13: AppealResult,
): StrategyResult {
  const strength = decision.overallStrength;
  const track = stage0.track;

  // Optimal relief path
  const optimalReliefPath: string[] = [];
  for (const r of decision.grantedReliefs) {
    optimalReliefPath.push(r.relief.replace(/_/g, ' ') + ' → ' + r.legalRef);
  }

  // Phase 1: Pre-Filing
  const phase1Actions: string[] = [
    'Gather all title documents (registered sale deed, khatian, dag, mutation)',
    'Verify limitation period — ensure filing within prescribed time',
    'Prepare certified copies of revenue records',
    'Compile transaction chain with all prior deeds',
  ];
  if (stage4.gateResult === 'at_risk') phase1Actions.push('URGENT: File suit immediately — limitation approaching');
  if (stage4.condonationAvailable) phase1Actions.push('File S.5 condonation application with affidavit');
  if (stage0.suitTrack === 'artha_rin') phase1Actions.push('Issue S.6(1) demand notice (mandatory pre-litigation step)');
  if (stage12?.outcome === 'pending_deposit') phase1Actions.push('Deposit full sale consideration in court');
  if (stage1.documentStack.some(d => !d.registered)) phase1Actions.push('Obtain certified copies of all registered documents');
  const phase1Risk: StrategyPhase['riskLevel'] = stage4.gateResult !== 'pass' ? 'high' : 'low';

  // Phase 2: Filing + Interim
  const phase2Actions: string[] = [
    'Draft plaint with all material facts and reliefs (CPC O.7 R.1)',
    'File plaint with court fee, affidavit, vakalatnama',
    'Apply for summons to defendants (CPC O.5)',
    'Seek temporary injunction if property at risk (CPC O.39 R.1/R.2)',
  ];
  if (stage7?.temporaryInjunction?.allThreeMet) {
    phase2Actions.push('Apply for ad-interim injunction — prima facie case strong');
  }
  if (facts_isGovernmentDefendant(stage1)) {
    phase2Actions.push('Verify S.80 notice compliance (2-month notice to government)');
  }
  const phase2Risk: StrategyPhase['riskLevel'] = stage9.waivableDefects.length > 0 ? 'high' : 'medium';

  // Phase 3: Trial + Evidence
  const phase3Actions: string[] = [
    'Lead evidence — documentary and oral (Evidence Act S.59-65B)',
    'Examine witnesses-in-chief, cross-examine defense witnesses',
    'File written arguments citing relevant provisions and case law',
    'Address adverse possession/pre-emption/partition defences if raised',
  ];
  if (stage11?.allElementsMet) phase3Actions.push('Prepare to rebut adverse possession — challenge continuity/openness/animus');
  if (stage8.keyWeaknesses.length > 0) phase3Actions.push('Address evidence weakness: ' + stage8.keyWeaknesses[0]);
  const phase3Risk: StrategyPhase['riskLevel'] = strength === 'WEAK' ? 'high' : strength === 'MODERATE' ? 'medium' : 'low';

  // Phase 4: Post-Decree + Execution
  const phase4Actions: string[] = [];
  if (decision.outcomeType === 'dismissal' || decision.outcomeType === 'rejection_of_plaint') {
    phase4Actions.push('File appeal within prescribed period');
    phase4Actions.push('Explore revision if jurisdictional error (CPC S.115)');
  } else {
    phase4Actions.push('Obtain certified copy of decree');
    phase4Actions.push('File execution application within 12 years (Art.182)');
    if (stage14.contemptAvailable) phase4Actions.push('Monitor compliance — file contempt if injunction breached');
    if (stage14.arrestAllowed) phase4Actions.push('Apply for arrest if debtor has means but refuses to pay');
    if (stage10?.coOwnershipEstablished) phase4Actions.push('Follow up on partition — commissioner appointment → final decree → mutation');
    if (stage12?.outcome === 'substitution_granted') phase4Actions.push('Complete substitution formalities — register in favour of pre-emptor');
  }
  if (stage13.stayOfExecution) phase4Actions.push('If defendant appeals, seek stay of execution (CPC O.41 R.5)');
  const phase4Risk: StrategyPhase['riskLevel'] = decision.postDecreePath === 'appealed' ? 'high' : 'medium';

  // Key milestones
  const keyMilestones: string[] = [
    'Pre-litigation notice / mediation completed',
    'Plaint filed and numbered',
    'Summons served on defendants',
    'Interim relief order obtained',
    'Evidence completed — arguments heard',
    'Judgment / decree passed',
    'Appeal period monitored',
    'Execution initiated',
  ];

  // Risk mitigation
  const riskMitigation: string[] = [];
  if (strength === 'WEAK') riskMitigation.push('Consider settlement negotiation — 70% of civil suits settle before judgment');
  riskMitigation.push('Maintain complete documentation trail for all proceedings');
  if (stage8.evidenceStrength < 60) riskMitigation.push('Strengthen evidence before trial — obtain additional documentary proof');
  riskMitigation.push('Monitor limitation at every stage — file condonation if needed');
  riskMitigation.push('Prepare appeal strategy from day one — preserve grounds of appeal');

  // Cost range
  const estimatedCostRange = strength === 'STRONG'
    ? 'Tk 50,000 – 3,00,000 (court fee + advocate)'
    : strength === 'MODERATE'
      ? 'Tk 1,00,000 – 5,00,000 (prolonged trial + appeal)'
      : 'Tk 1,50,000 – 8,00,000 (multi-stage litigation)';

  // Confidence
  const confidenceLevel = Math.min(95, Math.max(15, decision.winProbability));

  const phases: StrategyPhase[] = [
    {
      phase: 1, name: 'Pre-Filing Preparation', timeline: '0–30 days',
      actions: phase1Actions,
      legalRefs: ['CPC O.7 R.1', 'Limitation Act (relevant Article)', 'Registration Act S.17'],
      riskLevel: phase1Risk,
    },
    {
      phase: 2, name: 'Filing & Interim Relief', timeline: '1–3 months',
      actions: phase2Actions,
      legalRefs: ['CPC O.5 (summons)', 'CPC O.39 R.1/R.2 (injunction)', 'CPC S.80 (govt notice)'],
      riskLevel: phase2Risk,
    },
    {
      phase: 3, name: 'Trial & Evidence', timeline: '6–24 months',
      actions: phase3Actions,
      legalRefs: ['Evidence Act S.59–65B', 'CPC O.16 (evidence)', 'CPC O.18 (arguments)'],
      riskLevel: phase3Risk,
    },
    {
      phase: 4, name: 'Post-Decree & Execution', timeline: '1–3 years',
      actions: phase4Actions,
      legalRefs: ['CPC O.21 (execution)', 'Art.182 Limitation', 'CPC S.96/100 (appeal)'],
      riskLevel: phase4Risk,
    },
  ];

  return {
    optimalReliefPath: optimalReliefPath.length > 0 ? optimalReliefPath : ['No reliefs identified — review case facts'],
    phases,
    keyMilestones,
    riskMitigation,
    estimatedCostRange,
    confidenceLevel,
    disclaimer: 'This analysis is generated by an AI legal engine (FATIHA v3.0) and does NOT constitute legal advice. ' +
      'Consult a qualified advocate licensed to practice in Bangladesh before making any legal decisions. ' +
      'Statutory interpretations may vary based on specific facts and judicial precedent.',
  };
}

// ─── helper ─────────────────────────────────────────────────────────────
function facts_isGovernmentDefendant(stage1: Stage1Result): boolean {
  return stage1.parties.some(p => p.type === 'government');
}

// ═══════════════════════════════════════════════════════════════════════════
// ARGUMENT TREE BUILDER
// ═══════════════════════════════════════════════════════════════════════════

function buildArgumentTree(
  stage0: Stage0Result,
  stage1: Stage1Result,
  stage3: PreconditionResult,
  stage4: Stage4Result,
  stage7: Stage7Result | undefined,
  stage8: Stage8Result,
  stage9: Stage9Result,
  stage10: PartitionResult | undefined,
  stage11: AdversePossessionResult | undefined,
  stage12: PreEmptionResult | undefined,
  decision: DecisionOutput,
): ArgumentTree {
  // ─── Plaintiff Arguments ──────────────────────────────────────────────
  const plaintiffChildren: ArgumentNode[] = [];

  // Title / ownership
  if (stage1.transactionChain.length > 0) {
    const deed = stage1.transactionChain[0];
    plaintiffChildren.push({
      id: 'P-TITLE',
      label: 'Title Established via ' + (deed.type || 'Registered Instrument'),
      type: 'supporting',
      strength: deed.registered ? 8 : 4,
      legalRef: 'Registration Act S.17',
      factBasis: deed.registered ? 'Document is registered and admissible under S.17' : 'Unregistered document — limited evidentiary value',
    });
  }

  // Possession
  if (stage1.possession.currentPossessor === stage1.parties[0]?.name) {
    plaintiffChildren.push({
      id: 'P-POSS',
      label: 'Plaintiff in Lawful Possession',
      type: 'supporting',
      strength: 7,
      legalRef: 'SRA S.8/S.9',
      factBasis: 'Plaintiff is current possessor — entitled to protection against dispossession',
    });
  }

  // Registration compliance
  if (stage3.registration.admissibleForTitle) {
    plaintiffChildren.push({
      id: 'P-REG',
      label: 'Document Registered — Admissible for Title',
      type: 'supporting',
      strength: 9,
      legalRef: 'Registration Act S.17, Evidence Act S.91',
    });
  }

  // Within limitation
  if (stage4.gateResult === 'pass') {
    plaintiffChildren.push({
      id: 'P-LIM',
      label: 'Suit Within Limitation Period',
      type: 'supporting',
      strength: 7,
      legalRef: 'Limitation Act ' + stage4.primaryLimitation.article,
      factBasis: stage4.primaryLimitation.daysRemaining
        ? stage4.primaryLimitation.daysRemaining + ' days remaining'
        : 'Within prescribed period',
    });
  }

  // Evidence strength
  if (stage8.evidenceStrength >= 60) {
    plaintiffChildren.push({
      id: 'P-EVID',
      label: 'Strong Documentary Evidence',
      type: 'supporting',
      strength: Math.round(stage8.evidenceStrength / 10),
      legalRef: 'Evidence Act S.91',
      factBasis: 'Evidence strength: ' + stage8.evidenceStrength + '/100',
    });
  }

  // Partition claim
  if (stage10?.coOwnershipEstablished) {
    plaintiffChildren.push({
      id: 'P-PART',
      label: 'Co-ownership Established — Right to Partition',
      type: 'supporting',
      strength: 7,
      legalRef: 'CPC S.54',
      factBasis: stage10.coSharers.length + ' co-sharer(s) identified',
    });
  }

  // Pre-emption
  if (stage12?.outcome === 'substitution_granted') {
    plaintiffChildren.push({
      id: 'P-PREM',
      label: 'Pre-emption Right Exercised Within 4 Months',
      type: 'supporting',
      strength: 8,
      legalRef: 'SAT Act S.96',
    });
  }

  // Negative: limitation risk
  if (stage4.gateResult === 'barred') {
    plaintiffChildren.push({
      id: 'P-LIM-NEG',
      label: 'Suit Time-Barred',
      type: 'weakening',
      strength: -9,
      legalRef: 'Limitation Act ' + stage4.primaryLimitation.article,
    });
  }
  if (!stage3.passed) {
    plaintiffChildren.push({
      id: 'P-PREC-NEG',
      label: 'Precondition Not Met',
      type: 'weakening',
      strength: -8,
      legalRef: 'Registration Act',
    });
  }
  if (stage8.evidenceStrength < 40) {
    plaintiffChildren.push({
      id: 'P-EVID-NEG',
      label: 'Weak Evidence Base',
      type: 'weakening',
      strength: -6,
      legalRef: 'Evidence Act',
    });
  }

  // ─── Defendant Arguments ──────────────────────────────────────────────
  const defendantChildren: ArgumentNode[] = [];

  // Adverse possession defence
  if (stage11?.allElementsMet && stage11.position === 'defence') {
    defendantChildren.push({
      id: 'D-ADVERSE',
      label: 'Title by Adverse Possession — ' + stage11.continuousYears + ' Years',
      type: 'supporting',
      strength: 9,
      legalRef: 'Limitation Act Art.142',
      factBasis: 'All 6 elements of adverse possession proven',
    });
  }

  // Limitation defence
  if (stage4.suitTimeBarred) {
    defendantChildren.push({
      id: 'D-LIM',
      label: 'Suit Time-Barred — Dismissal Under O.7 R.11(d)',
      type: 'supporting',
      strength: 9,
      legalRef: 'Limitation Act ' + stage4.primaryLimitation.article,
    });
  }

  // S.49 inadmissibility
  if (stage3.registration.section49) {
    defendantChildren.push({
      id: 'D-S49',
      label: 'Document Inadmissible Under S.49',
      type: 'supporting',
      strength: 8,
      legalRef: 'Registration Act S.49',
    });
  }

  // Procedural defects
  if (stage9.waivableDefects.length > 0) {
    defendantChildren.push({
      id: 'D-PROC',
      label: stage9.waivableDefects.length + ' Procedural Defect(s) in Plaint',
      type: 'supporting',
      strength: 5,
      legalRef: 'CPC O.7 R.11',
    });
  }

  // Evidence weakness of plaintiff
  if (stage8.keyWeaknesses.length > 0) {
    defendantChildren.push({
      id: 'D-EVID-WEAK',
      label: 'Plaintiff Evidence Weak: ' + stage8.keyWeaknesses[0],
      type: 'supporting',
      strength: 5,
      legalRef: 'Evidence Act S.101',
    });
  }

  // Negative for defendant: plaintiff's strong evidence
  if (stage8.evidenceStrength >= 70) {
    defendantChildren.push({
      id: 'D-EVID-NEG',
      label: 'Plaintiff Evidence Strong — Defence Challenged',
      type: 'weakening',
      strength: -7,
      legalRef: 'Evidence Act S.101',
    });
  }
  if (stage4.gateResult === 'pass') {
    defendantChildren.push({
      id: 'D-LIM-NEG',
      label: 'Suit Within Limitation — Defence Cannot Raise Bar',
      type: 'weakening',
      strength: -8,
      legalRef: 'Limitation Act ' + stage4.primaryLimitation.article,
    });
  }

  // ─── Root nodes ───────────────────────────────────────────────────────
  const plaintiffScore = plaintiffChildren.reduce((sum, c) => sum + Math.abs(c.strength), 0);
  const defendantScore = defendantChildren.reduce((sum, c) => sum + Math.abs(c.strength), 0);

  const plaintiff: ArgumentNode = {
    id: 'PLAINTIFF',
    label: `Plaintiff's Case (Score: ${plaintiffScore})`,
    type: decision.winProbability >= 50 ? 'supporting' : 'weakening',
    strength: Math.round(decision.winProbability / 10),
    children: plaintiffChildren,
    legalRef: stage0.primaryLaw,
    evidenceStrength: stage8.evidenceStrength,
  };

  const defendant: ArgumentNode = {
    id: 'DEFENDANT',
    label: `Defendant's Case (Score: ${defendantScore})`,
    type: decision.winProbability < 50 ? 'supporting' : 'weakening',
    strength: Math.round((100 - decision.winProbability) / 10),
    children: defendantChildren,
    legalRef: stage0.primaryLaw,
    evidenceStrength: 100 - stage8.evidenceStrength,
  };

  return { plaintiff, defendant };
}
