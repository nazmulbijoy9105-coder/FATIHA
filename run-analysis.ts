// Direct FATIHA Analysis Runner — Asif v. Vashn Case
import { deriveFactsFromCaseFacts, runRuleEngine } from './src/lib/engine/rule-engine';
import {
  computeOverallScore,
  computeEvidenceScore,
  computeFraudScore,
  computeLimitation,
  computeInjunction,
  optimizeReliefs,
  validateConsistency,
  runSimulation,
  generateClientAdvisory,
} from './src/lib/engine/scoring-engine';
import type { CaseFacts } from './src/lib/engine/types';

// ═══════════════════════════════════════════════════════════════
// CASE: Asif v. Vashn — Oral Agreement for Sale of 10 Decimal
// ═══════════════════════════════════════════════════════════════

const caseFacts: CaseFacts = {
  parties: {
    vendor: 'Vashn',
    purchaser: 'Asif',
    poaRevoked: false,
    isMinor: false,
    isInsane: false,
    isUnauthorizedAgent: false,
    isScheduledBank: false,
  },
  property: {
    mouza: 'Sherpur',
    upazila: 'Sherpur Sadar',
    classification: 'agricultural',
    areaDeed: '10 Decimal',
  },
  transaction: {
    deedType: 'Oral Agreement (No Written Deed)',
    registered: false,
    considerationNormal: true,
    stampDutyPaid: false,
    multipleSalesByVendor: true,  // Vashn threatens to sell to another buyer
    transferDuringLis: false,
    fraudulentIntent: true,       // Demanding extra money = bad faith
    laterAcquiredTitle: false,
    firstRegistered: false,
  },
  possession: {
    currentPossessor: 'Vashn',
    nature: 'peaceful',
    physicalActs: [],
    openContinuousHostile: false,
  },
  documentValidity: {
    s17Compliant: false,
    s49Inadmissible: true,   // No document at all
    benamiFlag: false,
    unstampedDocument: false,
  },
  chronology: {
    causeOfActionDate: '2026-05-02',   // Date Vashn demanded extra money (breach)
    knowledgeOfFraudDate: '2026-05-02',
    executionDate: '2026-04-29',       // Date of oral agreement
  },
  disputeType: 'specific_performance',
  courtType: 'joint_district_judge',
  sra: {
    plaintiffReadyWilling: true,
    hardshipToDefendant: false,
    damagesAdequate: false,
    invasionOfRight: true,
    delayInFiling: false,
    suppressedFacts: false,
    acquiescence: false,
    adequateDamagesAvailable: false,
  },
};

// ═══════════════════════════════════════════════════════════════
// RUN ENGINE
// ═══════════════════════════════════════════════════════════════

console.log('═══════════════════════════════════════════════════════════════════');
console.log('  FATIHA LEGAL ENGINE — CASE ANALYSIS REPORT');
console.log('  Asif (Plaintiff) v. Vashn (Defendant)');
console.log('  Case: FATIHA-2026-SP-001');
console.log('═══════════════════════════════════════════════════════════════════\n');

// Stage 0-1: Derive Facts
const derivedFacts = deriveFactsFromCaseFacts(caseFacts);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  EXTRACTED FACTS (' + Object.keys(derivedFacts).length + ' derived)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
for (const [key, value] of Object.entries(derivedFacts)) {
  const icon = value === true ? '✅' : value === false ? '❌' : '📌';
  console.log(`  ${icon} ${key}: ${JSON.stringify(value)}`);
}

// Stage 4: Limitation
const limitationResult = computeLimitation(
  caseFacts.chronology.causeOfActionDate,
  caseFacts.disputeType,
  caseFacts.chronology.knowledgeOfFraudDate,
);
derivedFacts['limitation_status'] = limitationResult.status;

// Run all rules
const ruleResult = runRuleEngine(derivedFacts);

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  RULE ENGINE FLAGS (' + ruleResult.flags.length + ' triggered)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
for (const flag of ruleResult.flags) {
  const icon = flag.severity === 'red' ? '🔴' : flag.severity === 'yellow' ? '🟡' : '🟢';
  console.log(`  ${icon} [${flag.stage}] ${flag.message}`);
  console.log(`     → ${flag.legalRef} — ${flag.id}`);
}

// Stage 3.5: Evidence
const evidenceResult = computeEvidenceScore(caseFacts, derivedFacts);

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  EVIDENCE STRENGTH');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`  Total Score: ${evidenceResult.totalScore}/100`);
console.log(`  Burden: ${evidenceResult.burdenOfProof}`);
console.log(`  Documentary Supremacy: ${evidenceResult.documentarySupremacy}`);
for (const item of evidenceResult.items) {
  console.log(`  📄 ${item.type} — ${item.score}/${item.maxScore} — ${item.description}`);
}

// Stage 2.8: Fraud
const fraudResult = computeFraudScore(derivedFacts);

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  FRAUD DETECTION');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`  Overall Risk: ${fraudResult.overallRisk.toUpperCase()} (Score: ${fraudResult.fraudScore}/100)`);
for (const m of fraudResult.markers) {
  const icon = m.detected ? '⚠️' : '✅';
  console.log(`  ${icon} ${m.type}: ${m.description} [${m.severity}]`);
}

// Stage 4: Limitation
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  LIMITATION CALCULATOR');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`  Article: ${limitationResult.article}`);
console.log(`  Period: ${limitationResult.periodYears} years`);
console.log(`  Start: ${limitationResult.startDate}`);
console.log(`  Deadline: ${limitationResult.deadlineDate}`);
console.log(`  Days Remaining: ${limitationResult.daysRemaining}`);
console.log(`  Status: ${limitationResult.status.toUpperCase()}`);
if (limitationResult.override) console.log(`  OVERRIDE: ${limitationResult.override}`);

// Stage 5/6: Injunction
const injunctionResult = computeInjunction(caseFacts, derivedFacts, ruleResult.flags);

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  INJUNCTION ENGINE (O.39 / SRA S.54-56)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`  Temporary Injunction Available: ${injunctionResult.temporaryAvailable ? 'YES' : 'NO'}`);
console.log(`  Permanent Injunction Available: ${injunctionResult.permanentAvailable ? 'YES' : 'NO'}`);
console.log(`  Forum Injunction Probability: ${injunctionResult.forumInjProbability.toUpperCase()}`);
for (const c of injunctionResult.conditions) {
  console.log(`  ${c.met ? '✅' : '❌'} ${c.label}: ${c.description}`);
}
for (const b of injunctionResult.bars) {
  console.log(`  🚫 ${b.label}: ${b.description} (${b.legalRef})`);
}

// Stage 8.5: Relief Optimizer
const reliefResult = optimizeReliefs(caseFacts, derivedFacts);

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  RELIEF OPTIMIZER (S.42 Compliance)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`  S.42 Compliance: ${reliefResult.s42Compliance}`);
console.log(`  Primary Reliefs: ${reliefResult.primaryReliefs.join(', ') || 'None'}`);
console.log(`  Alternative Reliefs: ${reliefResult.alternativeReliefs.join(', ') || 'None'}`);
for (const r of reliefResult.reliefs) {
  console.log(`  ${r.type === 'primary' ? '🔵' : r.type === 'alternative' ? '🟡' : '🔴'} ${r.name} [${r.type}] — ${r.legalRef}${r.reason ? ' — ' + r.reason : ''}`);
}
for (const w of reliefResult.conflictWarnings) console.log(`  ⚠️ Conflict: ${w}`);

// Stage 10: Scoring
const scoringResult = computeOverallScore(ruleResult);

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  RISK SCORING');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`  DIMENSION SCORES:`);
console.log(`  ├── Limitation (30%): ${ruleResult.scores.limitation}`);
console.log(`  ├── Evidence (25%):   ${ruleResult.scores.evidence}`);
console.log(`  ├── Fraud (20%):      ${ruleResult.scores.fraud}`);
console.log(`  ├── Procedure (15%):  ${ruleResult.scores.procedure}`);
console.log(`  └── Equity (10%):     ${ruleResult.scores.equity}`);
console.log(`  OVERALL: ${scoringResult.total}/100 — ${scoringResult.label}`);

// Stage 10.5: Consistency
const consistencyResult = validateConsistency(caseFacts, derivedFacts, ruleResult.flags);

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  CONSISTENCY VALIDATOR');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`  Consistent: ${consistencyResult.consistent ? 'YES' : 'NO — CONTRADICTIONS FOUND'}`);
for (const c of consistencyResult.contradictions) {
  console.log(`  🔴 ${c.type}: ${c.description} [${c.severity}]`);
}
for (const w of consistencyResult.warnings) {
  console.log(`  🟡 Warning: ${w}`);
}

// Stage 12: Simulation
const simulationResult = runSimulation(
  scoringResult.total,
  scoringResult.label,
  derivedFacts,
  limitationResult.status,
  fraudResult.overallRisk,
  ruleResult.flags,
);

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  SIMULATION ENGINE');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`  Win Probability: ${simulationResult.winProbability}%`);
console.log(`  Estimated Time: ${simulationResult.estimatedTimeYears} years`);
console.log(`  Appeal Risk: ${simulationResult.appealRisk.toUpperCase()}`);
console.log(`  Cost Risk: ${simulationResult.costRisk}`);
console.log(`  Overall Risk: ${simulationResult.overallRisk}`);
console.log(`  Court Route: ${simulationResult.courtRouting.primary} (${simulationResult.courtRouting.reason})`);
console.log(`  Strategic Advice: ${simulationResult.strategicAdvice}`);

// Client Advisory
const clientSummary = generateClientAdvisory(simulationResult, ruleResult.flags);

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  CLIENT ADVISORY');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`  Win Chance: ${clientSummary.winChance}`);
console.log(`  Estimated Time: ${clientSummary.estimatedTime}`);
console.log(`  Cost Risk: ${clientSummary.costRisk}`);
console.log(`  Advice: ${clientSummary.advice}`);

// ═══════════════════════════════════════════════════════════════
// CRITICAL LEGAL ANALYSIS FOR THIS SPECIFIC CASE
// ═══════════════════════════════════════════════════════════════
console.log('\n\n═══════════════════════════════════════════════════════════════════');
console.log('  🔍 CASE-SPECIFIC LEGAL ANALYSIS: ASIF v. VASHN');
console.log('═══════════════════════════════════════════════════════════════════');

console.log('\n📋 CASE FACTS SUMMARY:');
console.log('  • Agreement Date: 29 April 2026 (ORAL only)');
console.log('  • Registration Date Fixed: 4 May 2026 (NOT executed)');
console.log('  • Breach Date: 2 May 2026 — Vashn demanded extra money');
console.log('  • Property: 10 Decimal land, Sherpur');
console.log('  • Consideration: Tk 4,00,000');
console.log('  • Written Document: NONE — No kobolnama, no bayana, no deed');
console.log('  • Witnesses: Unknown');

console.log('\n⚖️ KEY LEGAL ISSUES:');

console.log('\n  1. ORAL AGREEMENT vs REGISTERED DEED (FATAL WEAKNESS)');
console.log('     • SRA S.10 requires a VALID CONTRACT for Specific Performance.');
console.log('     • TPA S.5: Transfer of immovable property requires a registered');
console.log('       instrument. An oral agreement is NOT enforceable for SP.');
console.log('     • Evidence Act S.92: Oral evidence CANNOT contradict or add to');
console.log('       terms of a written contract (but here there is NO written contract).');
console.log('     • Evidence Act S.123: Oral agreement for immovable property is');
console.log('       admissible BUT carries minimal evidentiary weight.');

console.log('\n  2. NO WRITTEN EVIDENCE = NO SPECIFIC PERFORMANCE');
console.log('     • Bangladesh courts overwhelmingly hold that Specific Performance');
console.log('       requires clear, written evidence of the agreement terms.');
console.log('     • Without a kobolnama (agreement to sell), bayana receipt, or');
console.log('       any written document, Asif\'s SP claim is EXTREMELY WEAK.');
console.log('     • Oral testimony alone is insufficient to prove the essential');
console.log('       terms of the contract with the required standard of proof.');

console.log('\n  3. WHAT ASIF CAN ACTUALLY DO:');
console.log('     ┌─────────────────────────────────────────────────────────────┐');
console.log('     │  OPTION A: GATHER EVIDENCE FIRST (RECOMMENDED)              │');
console.log('     │  • Record phone calls/conversations with Vashn              │');
console.log('     │  • Get witnesses who heard the agreement to testify          │');
console.log('     │  • Collect any SMS/WhatsApp/messages about the agreement     │');
console.log('     │  • Collect any bank transfer/bayana proof of payment         │');
console.log('     │  • File GD with local police station about the threat       │');
console.log('     ├─────────────────────────────────────────────────────────────┤');
console.log('     │  OPTION B: SEND LEGAL NOTICE (STRONG FIRST STEP)            │');
console.log('     │  • Engage a lawyer to send formal legal notice to Vashn      │');
console.log('     │  • Notice should cite: oral agreement, consideration amount, │');
console.log('     │    fixed registration date, breach by demand for extra money  │');
console.log('     │  • This creates a paper trail and may pressure Vashn        │');
console.log('     ├─────────────────────────────────────────────────────────────┤');
console.log('     │  OPTION C: SUIT FOR SPECIFIC PERFORMANCE (WEAK)             │');
console.log('     │  • File SP suit in Joint District Judge Court, Sherpur       │');
console.log('     │  • But WITHOUT written proof, success probability is LOW     │');
console.log('     │  • Limitation: 3 years from breach (Art. 113 Limitation Act)│');
console.log('     │  • Court may convert to damages if SP not feasible (SRA S.16)│');
console.log('     ├─────────────────────────────────────────────────────────────┤');
console.log('     │  OPTION D: SUIT FOR DAMAGES (MORE REALISTIC)                │');
console.log('     │  • Claim breach of oral agreement under Contract Act         │');
console.log('     │  • Claim reliance damages (expenses incurred in preparation) │');
console.log('     │  • Claim any bayana/advance payment with interest           │');
console.log('     │  • Evidence Act S.123 allows oral contracts to be proved     │');
console.log('     │  • But evidentiary burden is HIGH on Asif                   │');
console.log('     └─────────────────────────────────────────────────────────────┘');

console.log('\n  4. IF VASHN SELLS TO ANOTHER BUYER:');
console.log('     • Vashn selling to another buyer with notice of Asif\'s');
console.log('       agreement = TPA S.3 notice overlay (affects priority)');
console.log('     • If the new buyer is a BFP in good faith, their rights');
console.log('       may prevail under TPA S.41');
console.log('     • CRITICAL: Asif should file a temporary injunction');
console.log('       (CPC O.39) IMMEDIATELY to prevent transfer to third party');
console.log('     • O.39 requires: (a) prima facie case, (b) irreparable injury,');
console.log('       (c) balance of convenience, (d) no delay');

console.log('\n  5. PREVENTIVE MEASURES Asif SHOULD TAKE NOW:');
console.log('     ✅ Send legal notice through advocate IMMEDIATELY');
console.log('     ✅ File GD at Sherpur PS about oral agreement and threat');
console.log('     ✅ Collect ALL evidence (messages, witnesses, bank records)');
console.log('     ✅ Consider filing injunction to prevent sale to third party');
console.log('     ✅ Negotiate — try to get Vashn to sign a written agreement');
console.log('     ✅ Do NOT pay any extra money without written agreement');
console.log('     ❌ Do NOT threaten Vashn (could backfire as criminal complaint)');

console.log('\n═══════════════════════════════════════════════════════════════════');
console.log('  END OF REPORT');
console.log('═══════════════════════════════════════════════════════════════════');
