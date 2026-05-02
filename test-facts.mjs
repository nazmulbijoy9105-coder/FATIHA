#!/usr/bin/env bun
/**
 * FATIHA Legal Engine — Comprehensive Fact Type Test Suite
 * Tests 12 different Bangladesh civil case scenarios through the full engine.
 *
 * Usage: bun run test-facts.mjs
 */

import { runRuleEngine, deriveFactsFromCaseFacts } from './src/lib/engine/rule-engine.ts';
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
} from './src/lib/engine/scoring-engine.js';

// ═══════════════════════════════════════════════════════════════
// COLOR OUTPUT HELPERS
// ═══════════════════════════════════════════════════════════════
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const WHITE = '\x1b[97m';
const DIM = '\x1b[90m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

function severityColor(s) {
  if (s === 'red') return RED;
  if (s === 'yellow') return YELLOW;
  return GREEN;
}

function scoreLabel(s) {
  if (s >= 70) return `${GREEN}STRONG${RESET}`;
  if (s >= 40) return `${YELLOW}MODERATE${RESET}`;
  return `${RED}WEAK${RESET}`;
}

function bar(val, max = 100) {
  const filled = Math.round((val / max) * 30);
  return '[' + '█'.repeat(filled) + '░'.repeat(30 - filled) + ']';
}

// ═══════════════════════════════════════════════════════════════
// 12 TEST CASES — Covering all Bangladesh Civil Case Types
// ═══════════════════════════════════════════════════════════════
const TEST_CASES = [
  // ─── CASE 1: Strong Title Suit with registered deed + possession ───
  {
    id: 'TC-001',
    title: 'Title Suit — Registered Sale Deed with Full Possession',
    desc: 'Plaintiff purchased land via registered sale deed, has been in continuous possession for 5 years paying LDT, cultivating crops. Defendant claims prior oral agreement. Clean case.',
    facts: {
      parties: { purchaser: 'Abdul Karim', vendor: 'Rahim Uddin', poaHolder: '', poaRevoked: false },
      property: { mouza: 'Durgapur', upazila: 'Narsingdi Sadar', dagCS: '45', khatianCS: '120', classification: 'agricultural' },
      transaction: { deedType: 'Sale Deed', registered: true, registrationDate: '2020-01-15', considerationNormal: true, stampDutyPaid: true, considerationAmount: '800000' },
      possession: { currentPossessor: 'Abdul Karim', startDate: '2020-02-01', nature: 'peaceful', physicalActs: ['LDT', 'crops', 'fencing'] },
      documentValidity: { s17Compliant: true, s49Inadmissible: false, benamiFlag: false, unstampedDocument: false },
      chronology: { causeOfActionDate: '2024-06-01' },
      disputeType: 'title_dispute',
      courtType: 'joint_district_judge',
    },
  },

  // ─── CASE 2: Double Sale Fraud ───
  {
    id: 'TC-002',
    title: 'Title Suit — Double Sale by Same Vendor',
    desc: 'Vendor sold land to Plaintiff (first sale, registered), then sold same land to Defendant (second sale, also registered). Plaintiff has first registration. Defendant took physical possession.',
    facts: {
      parties: { purchaser: 'Salma Begum', vendor: 'Kamal Hossain', poaHolder: '', poaRevoked: false },
      property: { mouza: 'Rampal', upazila: 'Munshiganj', dagCS: '112', khatianCS: '340', classification: 'agricultural' },
      transaction: { deedType: 'Sale Deed', registered: true, registrationDate: '2022-03-10', considerationNormal: true, stampDutyPaid: true, multipleSalesByVendor: true, firstRegistered: true },
      possession: { currentPossessor: 'Defendant', startDate: '2022-08-01', nature: 'hostile', physicalActs: ['construction'] },
      documentValidity: { s17Compliant: true, s49Inadmissible: false, benamiFlag: false, unstampedDocument: false },
      chronology: { causeOfActionDate: '2024-01-15' },
      disputeType: 'double_sale',
      courtType: 'joint_district_judge',
    },
  },

  // ─── CASE 3: Unregistered Oral Agreement (Weak) ───
  {
    id: 'TC-003',
    title: 'Specific Performance — Oral Sale Agreement (No Written Deed)',
    desc: 'Plaintiff claims oral agreement to purchase land, paid bayana, but no written deed executed. Vendor refusing. No registered instrument exists.',
    facts: {
      parties: { purchaser: 'Asif Rahman', vendor: 'Vashn Kumar', poaHolder: '', poaRevoked: false },
      property: { mouza: 'Baliapal', upazila: 'Dhaka', dagCS: '78', khatianCS: '215', classification: 'homestead' },
      transaction: { deedType: 'Oral Agreement', registered: false, considerationNormal: true, stampDutyPaid: false, bayanaAmount: '200000' },
      possession: { currentPossessor: 'Vashn Kumar', startDate: '2010-01-01', nature: 'peaceful' },
      documentValidity: { s17Compliant: false, s49Inadmissible: true, benamiFlag: false, unstampedDocument: true },
      chronology: { causeOfActionDate: '2024-09-01' },
      disputeType: 'specific_performance',
      courtType: 'joint_district_judge',
    },
  },

  // ─── CASE 4: Injunction Suit — Stop Construction ───
  {
    id: 'TC-004',
    title: 'Injunction Suit — Stop Illegal Construction on Plaintiffs Land',
    desc: 'Defendant started construction on plaintiffs registered land. Plaintiff has clear title deed, was in possession. Urgent injunction needed to prevent irreversible damage.',
    facts: {
      parties: { purchaser: 'Fatima Akter', vendor: '', poaHolder: '', poaRevoked: false },
      property: { mouza: 'Demra', upazila: 'Dhaka', dagCS: '230', khatianCS: '560', classification: 'commercial' },
      transaction: { deedType: 'Inherited', registered: true, registrationDate: '2015-05-20', stampDutyPaid: true },
      possession: { currentPossessor: 'Fatima Akter', startDate: '2015-06-01', nature: 'peaceful', physicalActs: ['fencing', 'construction'] },
      documentValidity: { s17Compliant: true, s49Inadmissible: false, benamiFlag: false, unstampedDocument: false },
      chronology: { causeOfActionDate: '2025-01-10' },
      disputeType: 'injunction',
      courtType: 'joint_district_judge',
      sra: { invasionOfRight: true, mandatoryInjNeeded: true },
    },
  },

  // ─── CASE 5: Adverse Possession Claim (12 years) ───
  {
    id: 'TC-005',
    title: 'Declaration Suit — Adverse Possession for 15 Years',
    desc: 'Plaintiff has been in open, continuous, hostile possession of disputed land for 15 years. Original owner abandoned the property. Plaintiff built house, pays LDT, cultivated crops.',
    facts: {
      parties: { purchaser: 'Mohammad Ali', vendor: '', poaHolder: '', poaRevoked: false },
      property: { mouza: 'Sonargaon', upazila: 'Narayanganj', dagCS: '89', khatianCS: '198', classification: 'homestead' },
      transaction: { deedType: 'None', registered: false, considerationNormal: false },
      possession: { currentPossessor: 'Mohammad Ali', startDate: '2009-01-01', nature: 'hostile', physicalActs: ['LDT', 'crops', 'construction', 'fencing'], openContinuousHostile: true },
      documentValidity: { s17Compliant: false, s49Inadmissible: false, benamiFlag: false, unstampedDocument: false },
      chronology: { causeOfActionDate: '2024-12-01' },
      disputeType: 'adverse_possession',
      courtType: 'senior_assistant_judge',
    },
  },

  // ─── CASE 6: Fraud + Forgery (Criminal Elements) ───
  {
    id: 'TC-006',
    title: 'Cancellation Suit — Forged Sale Deed + Benami Pattern',
    desc: 'Defendant forged plaintiffs signature on sale deed, registered it fraudulently. Mutation obtained before deed registration. Consideration is 1/10th of market value. PoA holder (non-relative) executed sale at undervalue.',
    facts: {
      parties: { purchaser: 'Fraudster', vendor: 'Innocent Owner', poaHolder: 'Unknown Agent', poaRevoked: true },
      property: { mouza: 'Kaliganj', upazila: 'Gazipur', dagCS: '156', khatianCS: '420', classification: 'agricultural' },
      transaction: { deedType: 'Sale Deed', registered: true, registrationDate: '2023-06-15', considerationNormal: false, stampDutyPaid: true, fraudulentIntent: true },
      possession: { currentPossessor: 'Fraudster', startDate: '2023-07-01', nature: 'hostile' },
      documentValidity: { s17Compliant: true, s49Inadmissible: false, benamiFlag: true, unstampedDocument: false },
      chronology: { causeOfActionDate: '2024-03-01', knowledgeOfFraudDate: '2024-02-15' },
      disputeType: 'fraud_cancellation',
      courtType: 'joint_district_judge',
    },
  },

  // ─── CASE 7: Time-Barred Suit (Limitation Expired) ───
  {
    id: 'TC-007',
    title: 'Recovery Suit — Filed After 13 Years (Barred)',
    desc: 'Plaintiff was dispossessed 13 years ago. File now for recovery. Standard 12-year limitation period under Art. 64/65 has expired. No fraud exception applicable.',
    facts: {
      parties: { purchaser: 'Late Filer', vendor: 'Occupier', poaHolder: '', poaRevoked: false },
      property: { mouza: 'Keraniganj', upazila: 'Dhaka', dagCS: '67', khatianCS: '189', classification: 'agricultural' },
      transaction: { deedType: 'Sale Deed', registered: true, registrationDate: '2005-01-10', stampDutyPaid: true },
      possession: { currentPossessor: 'Occupier', startDate: '2012-01-01', nature: 'hostile', dispossessionEvent: 'GD filed 2012-01-01' },
      documentValidity: { s17Compliant: true, s49Inadmissible: false, benamiFlag: false, unstampedDocument: false },
      chronology: { causeOfActionDate: '2012-01-01' },
      disputeType: 'possession_recovery',
      courtType: 'assistant_judge',
    },
  },

  // ─── CASE 8: Minor Transfer (Void ab initio) ───
  {
    id: 'TC-008',
    title: 'Declaration Suit — Property Transferred by Minor (Void)',
    desc: 'Property was transferred by a 15-year-old minor through registered sale deed. Under TPA S.7, minors cannot transfer immovable property. Plaintiff is the guardian challenging the transfer.',
    facts: {
      parties: { purchaser: 'Third Party Buyer', vendor: 'Minor (15 yrs)', poaHolder: '', poaRevoked: false, isMinor: true },
      property: { mouza: 'Dhamrai', upazila: 'Dhaka', dagCS: '34', khatianCS: '98', classification: 'agricultural' },
      transaction: { deedType: 'Sale Deed', registered: true, registrationDate: '2023-11-20', considerationNormal: true, stampDutyPaid: true },
      possession: { currentPossessor: 'Third Party Buyer', startDate: '2023-12-01', nature: 'open' },
      documentValidity: { s17Compliant: true, s49Inadmissible: false, benamiFlag: false, unstampedDocument: false },
      chronology: { causeOfActionDate: '2024-04-01' },
      disputeType: 'declaration',
      courtType: 'joint_district_judge',
    },
  },

  // ─── CASE 9: Partition Suit — Co-Owners Dispute ───
  {
    id: 'TC-009',
    title: 'Partition Suit — Division of Inherited Agricultural Land',
    desc: 'Three brothers inherited 5 bighas of agricultural land from father. Cannot agree on physical division. Each claims larger share. Need court-ordered metes and bounds partition.',
    facts: {
      parties: { purchaser: 'Brother 1', vendor: '', poaHolder: '', poaRevoked: false },
      property: { mouza: 'Savar', upazila: 'Dhaka', dagCS: '201', khatianCS: '510', classification: 'agricultural' },
      transaction: { deedType: 'Inherited', registered: true, stampDutyPaid: true },
      possession: { currentPossessor: 'Joint (all 3 brothers)', startDate: '2010-05-15', nature: 'peaceful', physicalActs: ['crops'] },
      documentValidity: { s17Compliant: true, s49Inadmissible: false, benamiFlag: false, unstampedDocument: false },
      inheritance: { religion: 'Islam', applicableLaw: 'MFLO', mutationStatus: 'completed' },
      chronology: { causeOfActionDate: '2024-07-01' },
      disputeType: 'title_dispute',
      courtType: 'senior_assistant_judge',
    },
  },

  // ─── CASE 10: PoA Abuse + Benami (Non-Relative) ───
  {
    id: 'TC-010',
    title: 'Cancellation Suit — Power of Attorney Abuse + Benami Transaction',
    desc: 'Vendor gave PoA to non-relative who sold property at 1/5th market value to his own family member. PoA was general (not specific). Benami pattern clear. Original vendor claims unaware.',
    facts: {
      parties: { purchaser: 'PoA Holders Relative', vendor: 'Original Owner', poaHolder: 'Md. Shawkat', poaRevoked: false },
      property: { mouza: 'Narayanganj', upazila: 'Narayanganj Sadar', dagCS: '445', khatianCS: '890', classification: 'commercial' },
      transaction: { deedType: 'Sale Deed via PoA', registered: true, registrationDate: '2023-09-01', considerationNormal: false, stampDutyPaid: true },
      possession: { currentPossessor: 'PoA Holders Relative', startDate: '2023-10-01', nature: 'open' },
      documentValidity: { s17Compliant: true, s49Inadmissible: false, benamiFlag: true, unstampedDocument: false },
      chronology: { causeOfActionDate: '2024-05-01', knowledgeOfFraudDate: '2024-04-15' },
      disputeType: 'fraud_cancellation',
      courtType: 'joint_district_judge',
    },
  },

  // ─── CASE 11: Artha Rin (Bank Mortgage) — Wrong Forum ───
  {
    id: 'TC-011',
    title: 'Money Suit vs Bank — Artha Rin Adalat Jurisdiction (Civil Barred)',
    desc: 'Borrower took mortgage loan from Sonali Bank (scheduled bank). Defaulted on payments. Filed civil suit for declaration. But Artha Rin Adalat has EXCLUSIVE jurisdiction over bank mortgage defaults.',
    facts: {
      parties: { purchaser: 'Borrower', vendor: 'Sonali Bank', poaHolder: '', poaRevoked: false, isScheduledBank: true },
      property: { mouza: 'Motijheel', upazila: 'Dhaka', dagCS: '67', khatianCS: '201', classification: 'commercial' },
      transaction: { deedType: 'Mortgage Deed', registered: true, registrationDate: '2020-06-15', stampDutyPaid: true },
      possession: { currentPossessor: 'Borrower', startDate: '2020-07-01', nature: 'peaceful' },
      documentValidity: { s17Compliant: true, s49Inadmissible: false, benamiFlag: false, unstampedDocument: false },
      chronology: { causeOfActionDate: '2024-08-01' },
      disputeType: 'mortgage',
      courtType: 'joint_district_judge',
    },
  },

  // ─── CASE 12: Res Judicata — Duplicate Suit Bar ───
  {
    id: 'TC-012',
    title: 'Title Suit — Res Judicata (Previous Suit Decided)',
    desc: 'Plaintiff filed Title Suit No. 123/2020 which was fully tried and dismissed on merits. Now filing fresh suit on SAME cause of action between SAME parties. Absolute bar under CPC S.11.',
    facts: {
      parties: { purchaser: 'Repeat Plaintiff', vendor: 'Same Defendant', poaHolder: '', poaRevoked: false },
      property: { mouza: 'Manikganj', upazila: 'Manikganj Sadar', dagCS: '56', khatianCS: '145', classification: 'agricultural' },
      transaction: { deedType: 'Sale Deed', registered: true, stampDutyPaid: true },
      possession: { currentPossessor: 'Defendant', startDate: '2018-01-01', nature: 'peaceful' },
      documentValidity: { s17Compliant: true, s49Inadmissible: false, benamiFlag: false, unstampedDocument: false },
      cpc: { resJudicataFound: true },
      chronology: { causeOfActionDate: '2024-11-01' },
      disputeType: 'title_dispute',
      courtType: 'assistant_judge',
    },
  },
];

// ═══════════════════════════════════════════════════════════════
// RUN FULL ANALYSIS PIPELINE
// ═══════════════════════════════════════════════════════════════
function analyzeCase(tc) {
  const derivedFacts = deriveFactsFromCaseFacts(tc.facts);
  
  const limitationResult = computeLimitation(
    tc.facts.chronology.causeOfActionDate,
    tc.facts.disputeType,
    tc.facts.chronology.knowledgeOfFraudDate,
  );
  derivedFacts['limitation_status'] = limitationResult.status;
  
  const ruleResult = runRuleEngine(derivedFacts);
  const evidenceResult = computeEvidenceScore(tc.facts, derivedFacts);
  const fraudResult = computeFraudScore(derivedFacts);
  const injunctionResult = computeInjunction(tc.facts, derivedFacts, ruleResult.flags);
  const reliefResult = optimizeReliefs(tc.facts, derivedFacts);
  const scoringResult = computeOverallScore(ruleResult);
  const consistencyResult = validateConsistency(tc.facts, derivedFacts, ruleResult.flags);
  const simulationResult = runSimulation(scoringResult.total, scoringResult.label, derivedFacts, limitationResult.status, fraudResult.overallRisk, ruleResult.flags);
  const clientSummary = generateClientAdvisory(simulationResult, ruleResult.flags);
  
  return { derivedFacts, limitationResult, ruleResult, evidenceResult, fraudResult, injunctionResult, reliefResult, scoringResult, consistencyResult, simulationResult, clientSummary };
}

// ═══════════════════════════════════════════════════════════════
// PRINT RESULTS
// ═══════════════════════════════════════════════════════════════
function printResult(tc, result) {
  const { scoringResult, ruleResult, limitationResult, evidenceResult, fraudResult, injunctionResult, reliefResult, simulationResult, consistencyResult, clientSummary } = result;
  
  const redFlags = ruleResult.flags.filter(f => f.severity === 'red');
  const yellowFlags = ruleResult.flags.filter(f => f.severity === 'yellow');
  const greenFlags = ruleResult.flags.filter(f => f.severity === 'green');

  console.log(`\n${'═'.repeat(80)}`);
  console.log(`${BOLD}${WHITE}  ${tc.id}  ${tc.title}${RESET}`);
  console.log(`${DIM}  ${tc.desc}${RESET}`);
  console.log(`${'─'.repeat(80)}`);

  // ── Overall Score ──
  console.log(`\n  ${CYAN}📊 OVERALL SCORE${RESET}`);
  console.log(`  ${bar(scoringResult.total)} ${BOLD}${scoringResult.total}/100${RESET}  ${scoreLabel(scoringResult.total)}`);
  console.log(`  Win Probability: ${BOLD}${simulationResult.winProbability}%${RESET}`);
  console.log(`  Est. Time: ${simulationResult.estimatedTimeYears} years | Cost Risk: ${simulationResult.costRisk}`);
  console.log(`  Court: ${simulationResult.courtRouting.primary}${simulationResult.courtRouting.alternative ? ` → ${simulationResult.courtRouting.alternative}` : ''}`);

  // ── Dimension Scores ──
  console.log(`\n  ${CYAN}📈 DIMENSION SCORES${RESET}`);
  const dims = [
    ['Limitation', scoringResult.dimensions.limitation, '30%'],
    ['Evidence', scoringResult.dimensions.evidence, '25%'],
    ['Fraud Safety', scoringResult.dimensions.fraud, '20%'],
    ['Procedure', scoringResult.dimensions.procedure, '15%'],
    ['Equity', scoringResult.dimensions.equity, '10%'],
  ];
  for (const [name, val, weight] of dims) {
    const c = val >= 70 ? GREEN : val >= 40 ? YELLOW : RED;
    console.log(`  ${name.padEnd(15)} ${bar(val)} ${c}${val}${RESET}/100  (${weight})`);
  }

  // ── Limitation ──
  const limC = limitationResult.status === 'green' ? GREEN : limitationResult.status === 'yellow' ? YELLOW : RED;
  console.log(`\n  ${CYAN}⏰ LIMITATION${RESET}`);
  console.log(`  Status: ${limC}${limitationResult.status.toUpperCase()}${RESET} | Article: ${limitationResult.article}`);
  console.log(`  Period: ${limitationResult.periodYears} years | Days Remaining: ${limitationResult.daysRemaining}`);
  if (limitationResult.override) console.log(`  ⚡ Override: ${limitationResult.override}`);

  // ── Evidence ──
  console.log(`\n  ${CYAN}📋 EVIDENCE${RESET}`);
  console.log(`  Total Score: ${evidenceResult.totalScore}/100 | Burden: ${evidenceResult.burdenOfProof}`);
  for (const item of evidenceResult.items) {
    const c = item.score >= 7 ? GREEN : item.score >= 4 ? YELLOW : RED;
    console.log(`  ${item.type.padEnd(22)} ${c}${item.score}/${item.maxScore}${RESET}  ${item.legalRef}`);
  }

  // ── Fraud ──
  const fraudC = fraudResult.overallRisk === 'clean' ? GREEN : fraudResult.overallRisk === 'suspicious' ? YELLOW : RED;
  console.log(`\n  ${CYAN}🔥 FRAUD DETECTION${RESET}`);
  console.log(`  Risk: ${fraudC}${fraudResult.overallRisk.toUpperCase()}${RESET} | Fraud Score: ${fraudResult.fraudScore}/100`);
  const detected = fraudResult.markers.filter(m => m.detected);
  if (detected.length > 0) {
    for (const m of detected) {
      const c = m.severity === 'red' ? RED : YELLOW;
      console.log(`  ${c}●${RESET} ${m.description} (${m.type})`);
    }
  } else {
    console.log(`  ${GREEN}No fraud markers detected${RESET}`);
  }

  // ── Injunction ──
  console.log(`\n  ${CYAN}🚫 INJUNCTION${RESET}`);
  console.log(`  Temporary: ${injunctionResult.temporaryAvailable ? GREEN + 'AVAILABLE' : RED + 'NOT AVAILABLE'}${RESET}`);
  console.log(`  Permanent: ${injunctionResult.permanentAvailable ? GREEN + 'AVAILABLE' : RED + 'NOT AVAILABLE'}${RESET}`);
  console.log(`  Forum Probability: ${injunctionResult.forumInjProbability}`);
  const activeBars = injunctionResult.bars.filter(b => b.applies);
  if (activeBars.length > 0) {
    console.log(`  Bars:`);
    for (const b of activeBars) {
      console.log(`    ${RED}✗${RESET} ${b.label}: ${b.description} (${b.legalRef})`);
    }
  }

  // ── Relief ──
  console.log(`\n  ${CYAN}⚖️ RECOMMENDED RELIEFS${RESET}`);
  console.log(`  S.42 Compliance: ${reliefResult.s42Compliance}`);
  console.log(`  Primary: ${reliefResult.primaryReliefs.join(', ') || 'None'}`);
  console.log(`  Alternative: ${reliefResult.alternativeReliefs.join(', ') || 'None'}`);
  if (reliefResult.droppedReliefs.length > 0) {
    console.log(`  Dropped: ${reliefResult.droppedReliefs.map(r => `${r.name} (${r.reason})`).join('; ')}`);
  }
  if (reliefResult.conflictWarnings.length > 0) {
    console.log(`  ${YELLOW}Conflicts: ${reliefResult.conflictWarnings.join('; ')}${RESET}`);
  }

  // ── Flags Summary ──
  console.log(`\n  ${CYAN}🚩 FLAGS${RESET}`);
  console.log(`  ${RED}RED: ${redFlags.length}${RESET}  ${YELLOW}YELLOW: ${yellowFlags.length}${RESET}  ${GREEN}GREEN: ${greenFlags.length}${RESET}`);
  if (redFlags.length > 0) {
    for (const f of redFlags.slice(0, 5)) {
      console.log(`  ${RED}●${RESET} [${f.stage}] ${f.message}`);
    }
  }
  if (yellowFlags.length > 0 && redFlags.length === 0) {
    for (const f of yellowFlags.slice(0, 5)) {
      console.log(`  ${YELLOW}●${RESET} [${f.stage}] ${f.message}`);
    }
  }

  // ── Consistency ──
  console.log(`\n  ${CYAN}✓ CONSISTENCY${RESET}`);
  console.log(`  ${consistencyResult.consistent ? GREEN + 'CONSISTENT' : RED + 'CONTRADICTIONS FOUND'}${RESET}`);
  if (consistencyResult.contradictions.length > 0) {
    for (const c of consistencyResult.contradictions) {
      const cc = c.severity === 'red' ? RED : YELLOW;
      console.log(`  ${cc}!${RESET} ${c.type}: ${c.description}`);
    }
  }
  if (consistencyResult.warnings.length > 0) {
    for (const w of consistencyResult.warnings.slice(0, 3)) {
      console.log(`  ${YELLOW}⚠${RESET} ${w}`);
    }
  }

  // ── Client Advisory ──
  console.log(`\n  ${CYAN}💼 CLIENT ADVISORY${RESET}`);
  console.log(`  Win Chance: ${BOLD}${clientSummary.winChance}${RESET} | Est. Time: ${clientSummary.estimatedTime} | Cost Risk: ${clientSummary.costRisk}`);
  console.log(`  ${DIM}${clientSummary.advice.substring(0, 200)}...${RESET}`);
}

// ═══════════════════════════════════════════════════════════════
// COMPARISON TABLE
// ═══════════════════════════════════════════════════════════════
function printComparisonTable(results) {
  console.log(`\n${'═'.repeat(100)}`);
  console.log(`${BOLD}${WHITE}  📊 COMPARISON TABLE — ALL CASES${RESET}`);
  console.log(`${'═'.repeat(100)}`);
  
  const header = `  ${'ID'.padEnd(8)} ${'TITLE'.padEnd(42)} ${'SCORE'.padEnd(8)} ${'LABEL'.padEnd(10)} ${'WIN%'.padEnd(6)} ${'RISK'.padEnd(8)} ${'FLAGS'.padEnd(6)} ${'LIMIT'.padEnd(6)} ${'FRAUD'.padEnd(10)}`;
  console.log(header);
  console.log(`  ${'─'.repeat(96)}`);

  for (const [tc, r] of results) {
    const red = r.ruleResult.flags.filter(f => f.severity === 'red').length;
    const lim = r.limitationResult.status.substring(0, 4).toUpperCase();
    const score = r.scoringResult.total;
    const label = r.scoringResult.label;
    const labelC = label === 'STRONG' ? GREEN : label === 'MODERATE' ? YELLOW : RED;
    
    console.log(
      `  ${tc.id.padEnd(8)} ${tc.title.substring(0, 40).padEnd(42)} ${String(score).padEnd(8)} ${labelC}${label.padEnd(8)}${RESET} ${String(r.simulationResult.winProbability + '%').padEnd(6)} ${r.simulationResult.costRisk.padEnd(8)} ${String(red + '/' + r.ruleResult.flags.length).padEnd(6)} ${lim.padEnd(6)} ${r.fraudResult.overallRisk.padEnd(10)}`
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════
console.log(`\n${BOLD}${WHITE}`);
console.log('  ╔══════════════════════════════════════════════════════════════════════════╗');
console.log('  ║                                                                      ║');
console.log('  ║   ⚖️  FATIHA LEGAL ENGINE — COMPREHENSIVE FACT TYPE TEST SUITE           ║');
console.log('  ║      Factual Analysis & Titular Interface for Heuristic Adjudication    ║');
console.log('  ║                                                                      ║');
console.log('  ║   Testing 12 Bangladesh civil case types across the full engine         ║');
console.log('  ║   Coverage: CPC, TPA, SRA, Limitation Act, Evidence Act, Registration    ║');
console.log('  ║                                                                      ║');
console.log('  ╚══════════════════════════════════════════════════════════════════════════╝');
console.log(`${RESET}`);

const results = [];
for (const tc of TEST_CASES) {
  const result = analyzeCase(tc);
  results.push([tc, result]);
  printResult(tc, result);
}

printComparisonTable(results);

console.log(`\n${BOLD}${WHITE}  ✅ TEST COMPLETE — ${results.length} cases analyzed${RESET}`);
console.log(`${DIM}  Developer: Adv Md Nazmul Islam (BIJOY) — Founder & Legal Engineer${RESET}\n`);
