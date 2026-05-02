// ═══════════════════════════════════════════════════════════════════════════
// FATIHA v3.0 — Stages 10–14 (Production)
// Partition → Adverse Possession → Pre-emption → Appeal + Revision → Execution
// CPC S.54 + O.20 R.18 | Limitation Art.142/144 | SAT Act S.96
// CPC S.96/100/115 + O.47 | CPC O.21
// ═══════════════════════════════════════════════════════════════════════════

import type {
  CaseFacts, Severity,
  Stage0Result, Stage1Result, Stage4Result,
  PartitionResult, AdversePossessionResult, AdversePossessionElement,
  PreEmptionResult, AppealResult, ExecutionResult,
  DecisionOutput, OutcomeType,
} from './types';
import { hasKeyword } from './stages-0-to-4';

// ═══════════════════════════════════════════════════════════════════════════
// STAGE 10 — PARTITION ENGINE
// CPC S.54 + Order 20 Rule 18
// Co-ownership → Preliminary Decree (shares) → Commissioner → Objections
// → Final Decree (physical division or sale) → Mutation
// ═══════════════════════════════════════════════════════════════════════════

export function runStage10(facts: CaseFacts, stage1: Stage1Result): PartitionResult {
  // ── 10.1 Co-ownership establishment ──
  const isPartitionClaim = facts.partitionClaim === true;
  const coSharersList = facts.coSharers
    ? facts.coSharers.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  // Co-ownership arises from: inheritance, joint purchase, common ancestor
  const coOwnershipEstablished = isPartitionClaim && coSharersList.length > 0;

  // ── 10.2 Share determination ──
  // Default: equal shares unless evidence of unequal contribution
  const totalSharers = coSharersList.length + 1; // +1 for plaintiff
  const shareFraction = `1/${totalSharers}`;
  const coSharers = coSharersList.map(name => ({ name, share: shareFraction }));

  // ── 10.3 Physical divisibility check ──
  const classification = facts.classification || '';
  const landArea = facts.landArea ? parseFloat(facts.landArea) : 0;

  // Agricultural land usually divisible; commercial/industrial may not be
  // Minimum practical division: ~0.05 acres per sharer
  const minDivisibleArea = 0.05 * totalSharers;
  const physicallyDivisible =
    ['agricultural', 'homestead', 'water_body'].includes(classification) &&
    landArea >= minDivisibleArea;

  // ── 10.4 Commissioner appointment ──
  // Order 26 — Commissioner appointed for local inspection, measurement, partition map
  const commissionerRequired = coOwnershipEstablished && physicallyDivisible;

  // ── 10.5 Preliminary Decree (Order 20 R.18) ──
  // Declares shares of each co-sharer — appealable as a decree
  const preliminaryDecree = {
    sharesDetermined: coOwnershipEstablished,
    appealable: true, // preliminary decree is appealable under CPC S.96
  };

  // ── 10.6 Final Decree ──
  // Physical division by commissioner or sale + distribution if not divisible
  const finalDecree = {
    issued: false, // prediction — not yet issued
    mode: physicallyDivisible ? 'physical_division' : 'sale_distribution',
  };

  // ── 10.7 Mutation after partition ──
  // Partition creates new holdings — each sharer must mutate their share
  const mutationRequired = coOwnershipEstablished;

  // ── 10.8 Limitation risk ──
  // Partition has NO fixed limitation period (not in Limitation Act Schedule)
  // However, laches (unreasonable delay) may bar relief in equity
  const filingDate = facts.filingDate ? new Date(facts.filingDate) : new Date();
  const causeDate = facts.causeOfActionDate ? new Date(facts.causeOfActionDate) : new Date();
  const daysSinceCause = Math.floor((filingDate.getTime() - causeDate.getTime()) / (1000 * 60 * 60 * 24));
  const yearsSinceCause = (daysSinceCause / 365).toFixed(1);

  let limitationRisk: string;
  if (daysSinceCause > 365 * 12) {
    limitationRisk = `HIGH — ${yearsSinceCause} years of delay invites laches/equitable bar; adverse possession defence possible`;
  } else if (daysSinceCause > 365 * 6) {
    limitationRisk = `MODERATE — ${yearsSinceCause} year delay; defendant may raise laches defence`;
  } else if (daysSinceCause > 365 * 3) {
    limitationRisk = `LOW-MODERATE — ${yearsSinceCause} year delay; explain delay in plaint`;
  } else {
    limitationRisk = 'LOW — Within reasonable time for partition suit';
  }

  return {
    coOwnershipEstablished,
    coSharers,
    physicallyDivisible,
    preliminaryDecree,
    commissionerRequired,
    finalDecree,
    mutationRequired,
    limitationRisk,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// STAGE 11 — ADVERSE POSSESSION ENGINE
// Limitation Act Article 142 (title) / Article 144 (possession)
// 6 mandatory elements + tacking analysis
// ═══════════════════════════════════════════════════════════════════════════

export function runStage11(
  facts: CaseFacts,
  stage1: Stage1Result,
  stage4: Stage4Result,
): AdversePossessionResult {
  const isClaim = facts.adversePossessionClaim === true;
  const position: AdversePossessionResult['position'] = isClaim ? 'claim' : 'defence';

  const years = facts.adversePossessionYears || 0;
  const nature = (facts.possessionNature || '').toLowerCase();
  const physicalActs = facts.physicalActs || [];

  // Identify who the adverse possessor is
  const possessorIsPlaintiff = facts.currentPossessor === facts.plaintiff;
  const possessorIsDefendant = facts.currentPossessor === facts.defendant;

  // ── 11.1 Six mandatory elements of adverse possession ──
  // Inferred from BOTH explicit flags AND description/physical acts.
  // Bangladesh courts rely on CIRCUMSTANTIAL EVIDENCE — physical acts of
  // ownership (construction, cultivation, fencing, tax payment) PROVE
  // openness, hostility, animus, and peacefulness.

  const desc = (facts.description || '').toLowerCase();
  const hasConstructionActs = physicalActs.some(a =>
    /construction|wall|structure|building|tin.?shed|house|boundary|fence|pond|tube.?well/i.test(a));
  const hasCultivationActs = physicalActs.some(a =>
    /cultivat|crop|farm|harvest|paddy|agriculture|plant/i.test(a));
  const hasTaxPayment = physicalActs.some(a =>
    /tax|holding|union parishad|government revenue/i.test(a));
  const hasImprovementActs = physicalActs.some(a =>
    /improve|develop|renovat|repair|maintain/i.test(a));
  const hasContinuousLongEnough = years >= 12;
  const hasOwnerNeverObjected = desc.includes('never objected') || desc.includes('never filed') || desc.includes('no objection') || desc.includes('never demanded');
  const hasNoRentPaid = !desc.includes('rent') && !desc.includes('tenant');

  const elements: AdversePossessionElement[] = [
    {
      name: 'Actual Possession',
      description:
        'The adverse possessor must be in actual, exclusive physical possession of the property — not merely constructive or paper ownership',
      proven: possessorIsPlaintiff || possessorIsDefendant,
      evidence: facts.currentPossessor
        ? `Current possessor: "${facts.currentPossessor}" — ${possessorIsPlaintiff || possessorIsDefendant ? 'actual possession established' : 'possession status unclear'}`
        : 'No current possessor identified — element NOT met',
    },
    {
      name: 'Open & Notorious',
      description:
        'Possession must be open, visible, and known to the true owner — not clandestine or secret. The owner must have means of knowledge (Art.142, Art.144 Limitation Act)',
      proven: nature.includes('open') || hasConstructionActs || hasCultivationActs ||
        desc.includes('openly') || desc.includes('visible') ||
        (hasContinuousLongEnough && hasOwnerNeverObjected),
      evidence: (hasConstructionActs || hasCultivationActs)
        ? `Physical acts (${[...physicalActs].filter(a => /construction|wall|cultivat|crop|fence|tin/i.test(a)).join(', ')}) demonstrate open and notorious possession`
        : nature.includes('open')
        ? 'Possession asserted as open and notorious'
        : 'Open possession NOT sufficiently established — need visible physical acts',
    },
    {
      name: 'Peaceful',
      description:
        'Possession must be without force or violence. If originally taken by force, it must become peaceful through lapse of time. Not acquired by trespass under threat (Art.142)',
      proven: nature.includes('peaceful') ||
        (!desc.includes('force') && !desc.includes('violence') && !desc.includes('threat') && !desc.includes('trespass under threat') && hasContinuousLongEnough),
      evidence: !desc.includes('force')
        ? `No allegation of force/violence in facts; ${hasContinuousLongEnough ? years + ' years of undisturbed possession implies peaceful character' : 'duration may support peaceful character'} (Art.142)`
        : 'Force or violence alleged — may need to show it became peaceful over time',
    },
    {
      name: 'Hostile/Adverse to True Owner',
      description:
        'Possession must be hostile (adverse) to the true owner\'s title — i.e., the possessor treats the property as their own, not acknowledging the true owner. Animus possidendi required',
      proven: nature.includes('hostile') || nature.includes('adverse') ||
        (hasConstructionActs && hasTaxPayment) ||
        (hasConstructionActs && hasNoRentPaid && hasContinuousLongEnough) ||
        desc.includes('as their own') || desc.includes('treated as his own'),
      evidence: (hasConstructionActs && hasTaxPayment)
        ? `Construction + tax payment in possessor\'s name = treating land as own property — hostile to true owner`
        : hasConstructionActs
        ? `Physical acts of ownership (${physicalActs.filter(a => /construction|wall|tin/i.test(a)).join(', ')}) without acknowledging true owner — hostile/adverse character established`
        : nature.includes('hostile')
        ? 'Possession asserted as hostile/adverse to true owner'
        : 'Hostile/adverse nature NOT established',
    },
    {
      name: 'Continuous for 12 Years',
      description:
        'Uninterrupted possession for 12 years is required (Art.142 for title; Art.144 for possession). Any break resets the clock. Period runs from when possession becomes adverse',
      proven: hasContinuousLongEnough,
      evidence: years > 0
        ? `${years} years of adverse possession ${years >= 12 ? '— MEETS 12-year threshold' : '— falls short of 12-year requirement by ' + (12 - years) + ' year(s)'}`
        : 'No duration specified — element NOT met',
    },
    {
      name: 'Animus Possidendi',
      description:
        'Intent to possess as owner — not as tenant, licensee, or agent. Physical acts of ownership (construction, cultivation, fencing, rent collection) demonstrate animus possidendi',
      proven: physicalActs.length > 0 &&
        (hasConstructionActs || hasCultivationActs || hasTaxPayment || hasImprovementActs),
      evidence: physicalActs.length > 0
        ? `Physical acts: ${physicalActs.join(', ')} — ${hasConstructionActs ? 'construction' : ''}${hasCultivationActs ? 'cultivation' : ''}${hasTaxPayment ? 'tax payment' : ''}${hasImprovementActs ? 'improvement' : ''} demonstrate ownership intent (animus possidendi)`
        : 'No physical acts of ownership documented — insufficient to show animus possidendi',
    },
  ];

  const allElementsMet = elements.every(e => e.proven);
  const gaps = elements.filter(e => !e.proven).map(e => e.name);

  // ── 11.2 Tacking analysis ──
  // Tacking: Successive periods of adverse possession by predecessor and
  // successor can be combined IF there is privity of estate
  // (inheritance, gift, sale, will — Art.142 proviso)
  const hasInheritance = facts.inheritance === 'inherited';
  const hasTransfer = facts.deedType === 'gift' || facts.deedType === 'sale' || facts.deedType === 'heba';
  const tackingAvailable = hasInheritance || hasTransfer;

  // ── 11.3 Outcome determination ──
  let outcome: AdversePossessionResult['outcome'];

  if (position === 'claim') {
    // Affirmative suit for declaration of title by adverse possession
    if (allElementsMet) {
      outcome = 'title_by_limitation';
    } else {
      outcome = 'claim_dismissed';
    }
  } else {
    // Defence against ejectment suit
    if (allElementsMet) {
      outcome = 'defence_succeeds';
    } else {
      outcome = 'defence_fails';
    }
  }

  // If some elements met but not all, note tacking as potential
  if (!allElementsMet && tackingAvailable && years >= 6 && years < 12) {
    gaps.push(`Tacking possible (privity via ${hasInheritance ? 'inheritance' : facts.deedType}) — predecessor's period may complete 12 years`);
  }

  return {
    position,
    elements,
    allElementsMet,
    continuousYears: years > 0 ? years : undefined,
    gaps: gaps.length > 0 ? gaps : undefined,
    tackingAvailable,
    outcome,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// STAGE 12 — PRE-EMPTION ENGINE
// SAT Act S.96 — Right of Pre-emption
// Priority: Co-sharer > Adjacent raiyat (same mouza) > Adjacent raiyat (same village)
// 4 MONTHS hard limitation from sale registration
// Pre-deposit of full sale consideration mandatory
// ═══════════════════════════════════════════════════════════════════════════

export function runStage12(facts: CaseFacts, stage4: Stage4Result): PreEmptionResult {
  // ── 12.0 Early return if no pre-emption claim ──
  if (!facts.preEmptionClaim) {
    return {
      applicable: false,
      claimantType: 'N/A',
      priority: 0,
      limitation4Months: false,
      preDepositMade: false,
      noticeToPurchaser: false,
      multipleClaimants: false,
      proRataDivision: false,
      outcome: 'suit_dismissed',
    };
  }

  // ── 12.1 Scope check: Agricultural land + Sale only ──
  // SAT Act S.96 applies to agricultural land transferred by sale.
  // "Sale" includes: sale deed, kabla, kablanama, baynama.
  const isAgricultural = facts.classification === 'agricultural';
  const deedLower = (facts.deedType || '').toLowerCase();
  const isSale = ['sale', 'sale deed', 'kabla', 'kablanama', 'bayna', 'baynamah', 'বিক্রয়', 'কবলনামা'].some(k => deedLower.includes(k));
  const scopeOk = isAgricultural && isSale;

  // ── 12.2 Claimant type and priority ──
  // SAT Act S.96 establishes priority:
  // 1. Co-sharer of the same property (highest priority)
  // 2. Adjacent raiyat in the same mouza
  // 3. Adjacent raiyat in the same village
  let claimantType: string;
  let priority: number;

  // Check if plaintiff is a co-sharer by examining: (a) coSharers field lists plaintiff as co-owner,
  // (b) facts describe co-ownership, (c) parties suggest shared inheritance
  const isCoSharer = facts.partitionClaim ||
    (facts.coSharers || '').toLowerCase().includes((facts.plaintiff || '').toLowerCase()) ||
    hasKeyword(facts.description || '', ['co-sharer', 'co sharer', 'cotenant', 'co-owner', 'joint owner', 'inherited']);

  if (isCoSharer || facts.coSharers) {
    claimantType = 'Co-sharer of same property';
    priority = 1;
  } else if (facts.mouza) {
    claimantType = 'Adjacent raiyat (same mouza)';
    priority = 2;
  } else {
    claimantType = 'Adjacent raiyat (same village)';
    priority = 3;
  }

  // ── 12.3 4-MONTHS hard limitation ──
  // SAT Act S.96 — suit must be filed within 4 months from date of
  // knowledge of the sale (NOT from registration date, but from when
  // the pre-emptor came to know of the sale)
  let limitation4Months = false;
  let daysRemaining: number | undefined;
  let deadlineDate: string | undefined;

  if (facts.registrationDate) {
    const regDate = new Date(facts.registrationDate);
    const filingDate = facts.filingDate ? new Date(facts.filingDate) : new Date();
    const diffMs = filingDate.getTime() - regDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const fourMonths = 120; // 4 months ≈ 120 days

    limitation4Months = diffDays <= fourMonths;
    daysRemaining = Math.max(0, fourMonths - diffDays);
    deadlineDate = new Date(
      regDate.getTime() + fourMonths * 24 * 60 * 60 * 1000,
    ).toISOString().split('T')[0];
  } else {
    // No registration date — assume within time conservatively
    limitation4Months = true;
  }

  // ── 12.4 Pre-deposit ──
  // Full sale consideration must be deposited in court as condition
  // precedent for pre-emption suit (SAT Act S.96)
  const preDepositMade = facts.preDepositMade === true;
  const saleConsideration = facts.saleConsideration
    ? facts.saleConsideration
    : facts.consideration
      ? parseFloat(facts.consideration)
      : undefined;
  const preDepositAmount = preDepositMade ? saleConsideration : undefined;

  // ── 12.5 Notice to purchaser ──
  // Pre-emptor must give notice to the purchaser and seller
  // of the pre-emption claim
  const noticeToPurchaser = true; // assumed given for analysis

  // ── 12.6 Multiple claimants ──
  // If multiple pre-emptors from same priority class, pro-rata division
  const multipleClaimants = (facts.coSharers || '').split(',').filter(Boolean).length > 2;
  const proRataDivision = multipleClaimants && priority === 1;

  // ── 12.7 Outcome determination ──
  let outcome: PreEmptionResult['outcome'];

  if (!scopeOk) {
    // Pre-emption only for agricultural land + sale
    outcome = 'suit_dismissed';
  } else if (!limitation4Months) {
    outcome = 'suit_dismissed';
  } else if (!preDepositMade) {
    outcome = 'pending_deposit';
  } else {
    // All conditions met — substitution of purchaser
    outcome = 'substitution_granted';
  }

  return {
    applicable: scopeOk,
    claimantType,
    priority,
    limitation4Months,
    deadlineDate,
    daysRemaining,
    preDepositMade,
    preDepositAmount,
    saleConsideration,
    noticeToPurchaser,
    multipleClaimants,
    proRataDivision,
    outcome,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// STAGE 13 — APPEAL + REVISION ENGINE
// CPC S.96 (first appeal) | CPC S.100 (second appeal — substantial Q of law)
// CPC S.115 (revision — jurisdictional error) | Order 47 (review — 30 days)
// CPC S.24 (transfer) | Order 41 (stay of execution)
// ═══════════════════════════════════════════════════════════════════════════

export function runStage13(
  facts: CaseFacts,
  stage0: Stage0Result,
  stage14?: ExecutionResult,
): AppealResult {
  const assignedCourt = stage0.assignedCourt;
  const suitTrack = stage0.suitTrack;
  const isArthaRin = suitTrack === 'artha_rin';

  // ── 13.1 Standard appeal ladder ──
  // Based on Bangladesh court hierarchy:
  // Asst Judge / Sr Asst Judge → District Judge
  // Joint District Judge → High Court Division
  // District Judge → High Court Division
  // High Court → Appellate Division of Supreme Court
  const standardLadder: AppealResult['standardLadder'] = [
    { from: 'Assistant Judge / Senior Assistant Judge', to: 'District Judge', section: 'CPC S.96' },
    { from: 'Joint District Judge', to: 'High Court Division', section: 'CPC S.96 read with S.100' },
    { from: 'District Judge (original side)', to: 'High Court Division', section: 'CPC S.96 read with S.100' },
    { from: 'High Court Division', to: 'Appellate Division', section: 'Constitution Art.103' },
    { from: 'Artha Rin Adalat', to: 'High Court Division', section: 'Artha Rin Ain S.57' },
  ];

  // ── 13.2 First appeal forum ──
  let appealForum: string;
  let appealAvailable = true;

  if (isArthaRin) {
    appealForum = 'High Court Division (Artha Rin direct appeal — S.57 Artha Rin Ain)';
  } else if (assignedCourt.includes('Assistant Judge')) {
    appealForum = 'District Judge, ' + (stage0.territorialJurisdiction.district || 'Dhaka');
  } else if (assignedCourt.includes('Joint District Judge')) {
    appealForum = 'High Court Division';
  } else if (assignedCourt.includes('District Judge')) {
    appealForum = 'High Court Division';
  } else {
    appealForum = 'High Court Division';
  }

  // ── 13.3 Second appeal — CPC S.100 ──
  // Only on substantial question of law — no re-appreciation of facts
  // Available from District Judge decree → HCD
  // NOT available for Artha Rin (direct to HC already)
  const secondAppealAvailable = !isArthaRin &&
    (assignedCourt.includes('District Judge') || assignedCourt.includes('Assistant Judge'));
  const secondAppealGround =
    'CPC S.100 — Second appeal lies ONLY on a substantial question of law. ' +
    'No re-appreciation of facts or re-hearing of evidence. ' +
    'Courts have held: question must be of general public importance or settle law for future cases.';

  // ── 13.4 Revision — CPC S.115 ──
  // Extraordinary remedy for jurisdictional errors ONLY
  // Not a substitute for appeal
  const revisionAvailable = true;
  const revisionGrounds = [
    'CPC S.115(a) — Court exceeded its jurisdiction',
    'CPC S.115(b) — Court failed to exercise jurisdiction which it ought to have exercised',
    'CPC S.115(c) — Court acted in exercise of jurisdiction illegally or with material irregularity',
  ];

  // ── 13.5 Review — Order 47 Rule 1 CPC ──
  // Same court reviews its own decree
  const reviewAvailable = true;
  const reviewGrounds = [
    'Order 47 R.1(a) — Discovery of new and important matter or evidence which, after exercise of due diligence, was not within knowledge at time of decree',
    'Order 47 R.1(b) — Some mistake or error apparent on the face of the record',
    'Order 47 R.1(c) — Any other sufficient reason (limited scope)',
  ];
  const reviewDeadline = '30 days from date of decree or order (Order 47 R.1 read with Art.116 Limitation Act)';

  // ── 13.6 Transfer — CPC S.24 ──
  const transferAvailable = true;

  // ── 13.7 Stay of execution pending appeal ──
  let stayOfExecution = false;
  const stayConditions: string[] = [];

  if (stage14?.trigger) {
    stayOfExecution = true;
    stayConditions.push(
      'CPC Order 41 Rule 5 — Appellant must apply for stay within reasonable time after decree',
    );
    stayConditions.push(
      'Security for decree amount — appellant must deposit or furnish security for decretal amount and costs',
    );
    stayConditions.push(
      'Satisfaction that the decree would be rendered infructuous if execution is not stayed',
    );
    stayConditions.push(
      'No undue delay in filing appeal — delay defeats the very purpose of stay',
    );
    stayConditions.push(
      'Balance of convenience — court weighs hardship to appellant vs. prejudice to respondent',
    );

    // Additional conditions for Artha Rin
    if (isArthaRin) {
      stayConditions.push(
        'Artha Rin Ain — stay conditions more stringent; security of 50% of decretal amount may be required',
      );
    }
  }

  return {
    standardLadder,
    appealAvailable,
    appealForum,
    secondAppealAvailable,
    secondAppealGround,
    revisionAvailable,
    revisionGrounds,
    reviewAvailable,
    reviewGrounds,
    reviewDeadline,
    transferAvailable,
    stayOfExecution,
    stayConditions,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// STAGE 14 — EXECUTION ENGINE
// CPC Order 21 — Modes: attachment, sale, arrest (max 6 months), garnishee,
// delivery of possession, committal for contempt
// Limitation: Art.182 (12 years from decree)
// Objections: Order 21 Rule 58
// ═══════════════════════════════════════════════════════════════════════════

export function runStage14(
  facts: CaseFacts,
  decision: DecisionOutput,
  stage4?: Stage4Result,
): ExecutionResult {
  // ── 14.1 Trigger check ──
  // Execution only if there's a decree that grants reliefs
  const noDecreeOutcomes: OutcomeType[] = [
    'rejection_of_plaint',
    'return_of_plaint',
    'dismissal',
  ];
  const trigger = !noDecreeOutcomes.includes(decision.outcomeType);

  if (!trigger) {
    return {
      trigger: false,
      decreeType: 'No decree — suit rejected / dismissed',
      modes: [],
      applicationWithinLimit: false,
      limitationPeriod: '12 years from date of decree (Art.182 Limitation Act)',
      objections: ['No execution — no executable decree exists'],
      contemptAvailable: false,
      arrestAllowed: false,
      garnisheeAvailable: false,
      outcome: 'No execution required — suit rejected or dismissed',
    };
  }

  const grantedReliefs = decision.grantedReliefs;

  // ── 14.2 Determine decree type from granted reliefs ──
  const hasMoneyDecree = grantedReliefs.some(
    r =>
      r.relief === 'money_decree' ||
      r.relief === 'damages' ||
      r.relief === 'execution_money',
  );
  const hasPossessionDecree = grantedReliefs.some(
    r =>
      r.relief === 'recovery_of_possession_title' ||
      r.relief === 'recovery_of_possession_summary' ||
      r.relief === 'execution_possession',
  );
  const hasInjunctionDecree = grantedReliefs.some(
    r =>
      r.relief === 'permanent_injunction' ||
      r.relief === 'mandatory_injunction' ||
      r.relief === 'contempt_order',
  );
  const hasSpecificPerformanceDecree = grantedReliefs.some(
    r => r.relief === 'specific_performance',
  );
  const hasPartitionDecree = grantedReliefs.some(r => r.relief === 'partition');
  const hasPreEmptionDecree = grantedReliefs.some(
    r => r.relief === 'pre_emption_substitution',
  );
  const hasAdversePossessionDecree = grantedReliefs.some(
    r => r.relief === 'adverse_possession_declaration',
  );

  let decreeType: string;
  const types: string[] = [];
  if (hasMoneyDecree) types.push('Money');
  if (hasPossessionDecree) types.push('Possession');
  if (hasInjunctionDecree) types.push('Injunction');
  if (hasSpecificPerformanceDecree) types.push('Specific Performance');
  if (hasPartitionDecree) types.push('Partition');
  if (hasPreEmptionDecree) types.push('Pre-emption');
  if (hasAdversePossessionDecree) types.push('Declaration (Adverse Possession)');

  if (types.length === 0) {
    decreeType = 'Declaration decree';
  } else if (types.length === 1) {
    decreeType = types[0] + ' decree';
  } else {
    decreeType = 'Composite decree (' + types.join(' + ') + ')';
  }

  // ── 14.3 Execution modes ──
  const modes: ExecutionResult['modes'] = [
    {
      mode: 'Attachment & Sale of Property',
      applicable: hasMoneyDecree,
      description:
        'Order 21 Rules 51-55 — Attach movable/immovable property of judgment debtor through court bailiff. ' +
        'Property proclaimed, advertised, and sold by public auction. ' +
        'Sale proceeds applied towards decretal amount + costs.',
    },
    {
      mode: 'Arrest & Civil Detention',
      applicable: hasMoneyDecree,
      description:
        'Order 21 Rule 32 — Judgment debtor arrested and detained in civil prison for MAXIMUM 6 MONTHS. ' +
        'Only available if: (a) decree is for payment of money, (b) debtor has means to pay but refuses, ' +
        '(c) decree cannot be satisfied otherwise. Not available for women, minors, persons > 60.',
    },
    {
      mode: 'Garnishee Order',
      applicable: hasMoneyDecree,
      description:
        'Order 21 Rule 46 — Court attaches debts owed to the judgment debtor by third parties (garnishees). ' +
        'Bank accounts, salary, rent receivables, etc., can be garnisheed. ' +
        'Garnishee prohibited from making payment to debtor.',
    },
    {
      mode: 'Delivery of Possession',
      applicable: hasPossessionDecree,
      description:
        'Order 21 Rules 35-36 — Court delivers physical possession to decree-holder through court bailiff. ' +
        'Unauthorized occupants removed by force if necessary. ' +
        'Delivery warrant issued within prescribed time.',
    },
    {
      mode: 'Committal for Civil Contempt',
      applicable: hasInjunctionDecree,
      description:
        'Order 21 Rule 32 read with SRA S.56 and CPC Order 39 — Willful breach of court injunction ' +
        'constitutes civil contempt. Punishable by simple imprisonment up to 6 months and/or fine. ' +
        'Contemnor must be given notice and opportunity of hearing.',
    },
    {
      mode: 'Decree-Specific Performance',
      applicable: hasSpecificPerformanceDecree,
      description:
        'Court directs specific performance of contract. If defendant refuses compliance, ' +
        'court may appoint a receiver or authorize decree-holder to complete the conveyance. ' +
        'Equivalent to delivery of possession + mutation.',
    },
    {
      mode: 'Partition Execution',
      applicable: hasPartitionDecree,
      description:
        'Order 21 Rule 49 — After final decree for partition, court delivers separated portion ' +
        'to each sharer. Commissioner may be appointed for physical division and demarcation. ' +
        'Each sharer gets exclusive possession of their share.',
    },
  ];

  // ── 14.4 Execution limitation — Art.182 ──
  // 12 years from date of decree (or date of final decree in partition)
  const limitationPeriod = '12 years from date of decree (Art.182 Limitation Act)';
  let applicationWithinLimit = true;

  // If stage4 showed time-barred risk, execution may also be at risk
  // (though execution limitation is separate from suit limitation)
  if (stage4?.suitTimeBarred && !stage4?.condonationAvailable) {
    // Note: execution limitation is independent of suit limitation
    // but if the suit itself was time-barred, the decree is vulnerable
    applicationWithinLimit = false;
  }

  // ── 14.5 Objections — Order 21 Rule 58 ──
  // Judgment debtor or any person aggrieved may object to execution
  const objections: string[] = [];

  if (facts.mutationStatus === 'not_started' || !facts.mutationStatus) {
    objections.push(
      'Order 21 R.58 — Mutation not completed; judgment debtor may challenge decree-holder\'s title during execution',
    );
  }
  if (facts.khasLand) {
    objections.push(
      'Order 21 R.58 — Property is Khas land; government may claim interest and object to execution',
    );
  }
  if (facts.ceilingExceeded) {
    objections.push(
      'Order 21 R.58 — Ceiling limit exceeded; SAT Act restrictions may bar execution of sale',
    );
  }
  if (hasPossessionDecree && facts.currentPossessor !== facts.plaintiff) {
    objections.push(
      'Order 21 R.58 — Third parties in possession may file objection; court must determine their rights',
    );
  }
  if (hasMoneyDecree) {
    objections.push(
      'Order 21 R.58 — Judgment debtor may claim insolvency or inability to pay; means inquiry required before arrest',
    );
  }

  // ── 14.6 Contempt availability ──
  const contemptAvailable = hasInjunctionDecree;

  // ── 14.7 Arrest availability ──
  const arrestAllowed = hasMoneyDecree;

  // ── 14.8 Garnishee availability ──
  const garnisheeAvailable = hasMoneyDecree;

  // ── 14.9 Outcome summary ──
  let outcome: string;
  if (!trigger) {
    outcome = 'No execution — suit rejected/dismissed';
  } else if (hasMoneyDecree && hasPossessionDecree) {
    outcome =
      'Composite execution — (1) attachment/garnishee for money component, ' +
      '(2) delivery of possession for possession component. Arrest as last resort (max 6 months).';
  } else if (hasMoneyDecree) {
    outcome =
      'Money decree execution — attachment of property, garnishee of debts, public auction. ' +
      'Civil arrest (max 6 months) available only if debtor has means but refuses to pay.';
  } else if (hasPossessionDecree) {
    outcome =
      'Possession decree execution — delivery of physical possession through court bailiff. ' +
      'Unauthorized occupants removed; demarcation by commissioner if needed.';
  } else if (hasInjunctionDecree) {
    outcome =
      'Injunction decree — no active execution unless breach occurs. ' +
      'Upon breach: contempt proceedings, committal for civil contempt (max 6 months).';
  } else if (hasSpecificPerformanceDecree) {
    outcome =
      'Specific performance decree — court directs conveyance. If defendant non-compliant: ' +
      'court may execute conveyance on defendant\'s behalf (SRA S.20).';
  } else if (hasPartitionDecree) {
    outcome =
      'Partition decree execution — physical division by commissioner, demarcation, ' +
      'delivery of separated portions, mutation of divided shares.';
  } else if (hasPreEmptionDecree) {
    outcome =
      'Pre-emption decree execution — substitution of purchaser; ' +
      'pre-emptor steps into shoes of original purchaser in sale deed.';
  } else {
    outcome =
      'Declaration decree — no active execution required, but declaration may be ' +
      'used for consequential relief (mutation, injunction, partition).';
  }

  return {
    trigger,
    decreeType,
    modes,
    applicationWithinLimit,
    limitationPeriod,
    objections,
    contemptAvailable,
    arrestAllowed,
    garnisheeAvailable,
    outcome,
  };
}
