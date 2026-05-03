// ═══════════════════════════════════════════════════════════════════════════
// FATIHA v3.0 — Stages 5–9: Bangladesh Civil Dispute Decision Engine
// Stage 5: Artha Rin Adalat Engine (Artha Rin Ain 2003)
// Stage 6: Order 37 CPC Summary Suit Engine
// Stage 7: SRA Engine (Possession, SP, Declaration, Cancellation, Injunction)
// Stage 8: Evidence Engine (Evidence Act 1872)
// Stage 9: Procedural Defect Engine (CPC O.7 R.11 + misc.)
// ═══════════════════════════════════════════════════════════════════════════

import type {
  CaseFacts,
  Stage0Result,
  Stage2Result,
  Stage25Result,
  Stage1Result,
  Stage4Result,
  ArthaRinResult,
  Order37Result,
  Stage7Result,
  Stage8Result,
  Stage9Result,
  PossessionTrack,
  SpecificPerformanceCheck,
  DeclarationCheck,
  CancellationCheck,
  TemporaryInjunction,
  PermanentInjunction,
  EvidenceItem,
  ProceduralDefect,
  ReliefType,
} from '@/lib/engine/types';

// ─── Helper Utilities ───────────────────────────────────────────────────────

/** Parse a date string (multiple formats) into a JS Date. Returns null on failure. */
function parseDate(input?: string): Date | null {
  if (!input) return null;
  // Try YYYY-MM-DD
  const d1 = Date.parse(input);
  if (!isNaN(d1)) return new Date(d1);
  // Try DD/MM/YYYY or DD-MM-YYYY
  const parts = input.split(/[./\-]/);
  if (parts.length === 3) {
    const [day, month, year] = parts.map(Number);
    if (year && year > 100) {
      const d = new Date(year, month - 1, day);
      if (!isNaN(d.getTime())) return d;
    }
  }
  return null;
}

/** Calculate days between two dates. Returns negative if past. */
function daysBetween(start: Date, end: Date): number {
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

/** Format a deadline date from a start date plus N months. */
function addMonths(start: Date, months: number): Date {
  const d = new Date(start);
  d.setMonth(d.getMonth() + months);
  return d;
}

/** Format a deadline date from a start date plus N years. */
function addYears(start: Date, years: number): Date {
  const d = new Date(start);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

/** Keyword search in a string (case-insensitive). */
function hasKeyword(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some(k => lower.includes(k.toLowerCase()));
}

// ═══════════════════════════════════════════════════════════════════════════
// STAGE 5: ARTHA RIN ADALAT ENGINE
// Artha Rin Adalat Ain 2003 (Bangladesh Money Loan Court Act)
// Exclusive jurisdiction over bank/financial institution loan disputes
// ═══════════════════════════════════════════════════════════════════════════

export function runStage5(facts: CaseFacts, stage0: Stage0Result): ArthaRinResult {
  // ─── Trigger Check ───
  // Defendant must be a bank or financial institution
  const isBankCreditor = !!facts.isBankCreditor ||
    (facts.defendantType && hasKeyword(facts.defendantType, [
      'bank', 'financial institution', 'nbfi', 'scheduled bank',
      'commercial bank', 'grameen', 'sonali', 'janata', 'agrani',
      'islami bank', 'city bank', 'brac bank', 'dbbl',
    ]));

  if (!isBankCreditor) {
    return {
      eligible: false,
      preLitigationMediation: {
        mandatory: false,
        mediationPeriod: 'N/A',
        noticeIssued: false,
        mediationStatus: 'pending',
      },
      requiredDocuments: [],
      limitationStrict: false,
      interimOrders: [],
      appealTrack: 'Not applicable — route to Civil Court',
      pecuniaryCap: 'none',
      section: 'Artha Rin Adalat Ain 2003 S.2 (definition of "Artha Rin")',
    };
  }

  // ─── Pre-Litigation Mediation (S.22 Artha Rin Ain 2003) ───
  // Mandatory 60-day mediation before filing suit
  const causeDate = parseDate(facts.causeOfActionDate);
  const filingDate = parseDate(facts.filingDate) || new Date();
  const mediationDeadline = causeDate ? addMonths(causeDate, 2) : null;

  let mediationStatus: 'pending' | 'success' | 'failed' = 'pending';
  if (filingDate && causeDate) {
    // Check if enough time has passed for mediation
    const daysSinceCause = daysBetween(causeDate, filingDate);
    if (daysSinceCause >= 60) {
      mediationStatus = 'failed'; // Assumed failed if filing after mediation period
    }
  }

  // ─── Required Documents ───
  const requiredDocuments: string[] = [
    'Loan agreement / Sanction letter (S.22(1))',
    'Statement of accounts / Ledger (S.22(2))',
    'Security documents — Mortgage deed / Hypothecation deed (S.22(3))',
    'Demand / Legal notice (S.22(4))',
    'Mediation failure certificate from Bangladesh Bank / Mediator (S.22(5))',
    ' affidavit of borrower default',
    'Certificate of outstanding balance',
  ];

  if (facts.registered) {
    requiredDocuments.push('Registered mortgage deed (TPA S.54 / Registration Act S.17)');
  }

  // ─── Limitation ───
  // Artha Rin Adalat follows strict statutory limitation — NO general condonation
  // Under Artha Rin Ain 2003 S.20 read with Limitation Act Art. 132 for mortgage suits
  const limitationStrict = true;

  // ─── Interim Orders ───
  const interimOrders: string[] = [
    'Attachment before judgment (Artha Rin Ain S.32)',
    'Temporary injunction (Artha Rin Ain S.33)',
    'Appointment of Receiver (Artha Rin Ain S.34)',
    'Stay of alienation of mortgaged property',
  ];

  // ─── Appeal Track ───
  // Unlike regular civil suits (District Judge → High Court),
  // Artha Rin Adalat appeals go DIRECTLY to High Court Division
  // under Artha Rin Ain 2003 S.53

  return {
    eligible: true,
    preLitigationMediation: {
      mandatory: true,
      mediationPeriod: '60 days (S.22 Artha Rin Ain 2003)',
      noticeIssued: filingDate && causeDate ? daysBetween(causeDate, filingDate) > 30 : false,
      mediationStatus,
    },
    requiredDocuments,
    limitationStrict,
    interimOrders,
    appealTrack: 'Direct appeal to High Court Division (S.53 Artha Rin Ain 2003) — bypasses District Judge',
    pecuniaryCap: 'none',
    section: 'Artha Rin Adalat Ain 2003 S.2, S.3, S.20, S.22, S.32-34, S.53',
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// STAGE 6: ORDER 37 CPC SUMMARY SUIT ENGINE
// Summary procedure for liquidated claims on negotiable instruments,
// written contracts for definite sum, or guarantees for debt already due
// ═══════════════════════════════════════════════════════════════════════════

export function runStage6(facts: CaseFacts, stage0: Stage0Result): Order37Result {
  // ─── Eligibility Check ───
  let eligible = false;
  let basis = 'Not eligible for summary suit';

  const disputeLower = (facts.disputeType || '').toLowerCase();
  const deedLower = (facts.deedType || '').toLowerCase();
  const instrumentLower = (facts.instrumentType || '').toLowerCase();
  const descriptionLower = (facts.description || '').toLowerCase();

  // Check 1: Negotiable instrument
  const isNegotiableInstrument = !!facts.isNegotiableInstrument ||
    hasKeyword(instrumentLower, ['promissory note', 'bill of exchange', 'cheque', 'hundi', 'bond']) ||
    hasKeyword(descriptionLower, ['promissory note', 'bill of exchange', 'dishonoured cheque', 'bounced cheque', 'dishonored cheque']);

  // Check 2: Written contract for definite sum
  const isWrittenContract = hasKeyword(deedLower, ['contract', 'agreement', 'loan agreement', 'sale agreement', 'settlement agreement']) ||
    hasKeyword(descriptionLower, ['written contract', 'definite sum', 'liquidated demand', 'agreed amount']);

  // Check 3: Guarantee for debt already due
  const isGuarantee = hasKeyword(descriptionLower, ['guarantee', 'surety', 'guarantor', 'suretyship']) ||
    hasKeyword(disputeLower, ['guarantee']);

  if (isNegotiableInstrument) {
    eligible = true;
    basis = `Negotiable instrument: ${facts.instrumentType || 'as alleged'} — O.37 CPC applies ( negotiable instrument category)`;
  } else if (isWrittenContract) {
    eligible = true;
    basis = `Written contract for definite sum: ${facts.deedType || 'as alleged'} — O.37 CPC applies (written contract category)`;
  } else if (isGuarantee) {
    eligible = true;
    basis = 'Guarantee for debt already due — O.37 CPC applies (guarantee category)';
  }

  // ─── If not eligible, return early ───
  if (!eligible) {
    return {
      eligible: false,
      basis,
      defendantAppeared: false,
      leaveToDefend: 'not_applied',
      triableIssueExists: false,
      outcome: 'pending',
      limitation: '3 years from dishonour/default (Art. 58/113 Limitation Act)',
    };
  }

  // ─── Defendant Appearance Check ───
  // Under O.37 R.2, defendant must appear within 10 days of summons
  const defendantAppeared = true; // Assumption for engine — to be set by actual case data

  // ─── Leave to Defend Analysis ───
  // Defendant must show a TRIABLE ISSUE (not mere denial)
  // O.37 R.3(1): Court must be satisfied there is no defence on merits
  // If defence is "bona fide" and raises triable issue → leave granted → transferred to ordinary suit
  const triableIssueIndicators = [
    facts.benamiFlag,
    facts.fraudulentIntent,
    facts.s49Inadmissible,
    !facts.registered && facts.deedType?.toLowerCase() === 'sale',
    hasKeyword(descriptionLower, ['counter claim', 'set-off', 'fraud', 'coercion', 'undue influence']),
  ];

  const triableIssueExists = triableIssueIndicators.some(Boolean);

  // ─── Leave to Defend Status ───
  let leaveToDefend: 'not_applied' | 'granted' | 'refused' | 'pending';
  if (!defendantAppeared) {
    leaveToDefend = 'not_applied';
  } else if (triableIssueExists) {
    leaveToDefend = 'granted';
  } else {
    leaveToDefend = 'refused';
  }

  // ─── Outcome ───
  let outcome: 'summary_decree' | 'transferred_to_ordinary' | 'pending';
  if (leaveToDefend === 'not_applied') {
    outcome = 'pending';
  } else if (leaveToDefend === 'granted') {
    outcome = 'transferred_to_ordinary';
  } else {
    outcome = 'summary_decree';
  }

  // ─── Limitation ───
  // Negotiable instrument: 3 years from dishonour (Art. 113 for bill of exchange, Art. 58 for general)
  // Written contract: 3 years from breach/default (Art. 113/58)
  // Guarantee: 3 years from date debt became due (Art. 113)
  const limitationDate = facts.defaultDate || facts.causeOfActionDate;
  let limitationStr = '3 years from dishonour/default (Art. 58/113 Limitation Act)';
  if (limitationDate) {
    const deadline = addYears(parseDate(limitationDate) || new Date(), 3);
    const remaining = daysBetween(new Date(), deadline);
    if (remaining <= 0) {
      limitationStr = `TIME BARRED — 3 years from ${limitationDate} expired. Summary suit will fail under O.37 R.2 read with O.7 R.11(d) CPC.`;
    } else if (remaining <= 90) {
      limitationStr = `3 years from ${limitationDate} — only ${remaining} days remaining. URGENT filing required.`;
    } else {
      limitationStr = `3 years from dishonour/default (Art. 58/113) — ${remaining} days remaining`;
    }
  }

  return {
    eligible: true,
    basis,
    defendantAppeared,
    leaveToDefend,
    triableIssueExists,
    outcome,
    limitation: limitationStr,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// STAGE 7: SRA ENGINE (Specific Relief Act, 1877)
// The most complex engine — covers 5 sub-engines:
//   7.1 Possession (S.8, S.9 SRA)
//   7.2 Specific Performance (S.10/12/14/16/21/22 SRA)
//   7.3 Declaration (S.42 SRA)
//   7.4 Cancellation (S.34-35 SRA)
//   7.5 Injunction (CPC O.39 + SRA S.52-57)
// ═══════════════════════════════════════════════════════════════════════════

export function runStage7(
  facts: CaseFacts,
  stage0: Stage0Result,
  stage2: Stage2Result,
  stage4: Stage4Result,
): Stage7Result {
  const result: Stage7Result = {
    applicableReliefs: [],
  };

  const disputeLower = (facts.disputeType || '').toLowerCase();
  const descriptionLower = (facts.description || '').toLowerCase();

  // ─── Determine which sub-engines to run ───
  const needsPossession = hasKeyword(disputeLower, [
    'possession', 'recovery', 'ejectment', 'eviction', 'mesne',
  ]) || hasKeyword(descriptionLower, ['dispossessed', 'possession taken', 'thrown out']);

  const needsSP = hasKeyword(disputeLower, [
    'specific performance', 'sp', 'enforce contract', 'execution of contract',
  ]) || hasKeyword(descriptionLower, ['specific performance', 'enforce agreement', 'execute sale deed']);

  const needsDeclaration = hasKeyword(disputeLower, [
    'declaration', 'title suit', 'title', 'declaratory',
  ]);

  const needsCancellation = hasKeyword(disputeLower, [
    'cancellation', 'cancel', 'void', 'voidable', 'set aside deed',
  ]) || hasKeyword(descriptionLower, ['cancel deed', 'forged deed', 'fraudulent deed']);

  const needsInjunction = hasKeyword(disputeLower, [
    'injunction', 'stay', 'restrain', 'prevent',
  ]) || hasKeyword(descriptionLower, ['injunction', 'stay order', 'restrain defendant']);

  // ─── 7.1 Possession Engine ───
  if (needsPossession) {
    result.possession = runPossessionEngine(facts, stage4);
    if (result.possession.allMet) {
      result.applicableReliefs.push(
        result.possession.track === 'S9_summary'
          ? 'recovery_of_possession_summary'
          : 'recovery_of_possession_title'
      );
    }
  }

  // ─── 7.2 Specific Performance Engine ───
  if (needsSP) {
    result.specificPerformance = runSpecificPerformanceEngine(facts);
    if (result.specificPerformance.finalOutcome === 'granted' || result.specificPerformance.finalOutcome === 'conditional') {
      result.applicableReliefs.push('specific_performance');
    } else if (result.specificPerformance.finalOutcome === 'damages_in_lieu') {
      result.applicableReliefs.push('damages');
    }
  }

  // ─── 7.3 Declaration Engine ───
  if (needsDeclaration || needsPossession) {
    result.declaration = runDeclarationEngine(facts);
    if (result.declaration.outcome === 'granted') {
      result.applicableReliefs.push('declaration_of_title');
    }
  }

  // ─── 7.4 Cancellation Engine ───
  if (needsCancellation) {
    result.cancellation = runCancellationEngine(facts);
    if (result.cancellation.outcome === 'granted') {
      result.applicableReliefs.push('cancellation_of_deed');
    }
  }

  // ─── 7.5 Injunction Engine ───
  if (needsInjunction || needsPossession || needsDeclaration) {
    const injResult = runInjunctionEngine(facts);
    result.temporaryInjunction = injResult.temporary;
    result.permanentInjunction = injResult.permanent;
    if (result.permanentInjunction.outcome === 'permanent' || result.permanentInjunction.outcome === 'mandatory') {
      result.applicableReliefs.push('permanent_injunction');
    }
    if (result.temporaryInjunction.outcome !== 'refused') {
      result.applicableReliefs.push('temporary_injunction');
    }
    if (result.permanentInjunction.outcome === 'mandatory') {
      result.applicableReliefs.push('mandatory_injunction');
    }
  }

  return result;
}

// ─── 7.1 Possession Engine ──────────────────────────────────────────────────

function runPossessionEngine(facts: CaseFacts, stage4: Stage4Result): PossessionTrack {
  const descriptionLower = (facts.description || '').toLowerCase();
  const dispossessionDate = parseDate(facts.dispossessionDate);
  const causeDate = parseDate(facts.causeOfActionDate);
  const now = new Date();

  // ─── Track Selection: S.9 (summary) vs S.8 (title-based) ───
  const isSummaryDispossession = !!dispossessionDate &&
    hasKeyword(descriptionLower, ['dispossessed', 'thrown out', 'forcefully', 'without consent', 'tresspass', 'encroachment']);

  const isTitleBased = !isSummaryDispossession ||
    hasKeyword(descriptionLower, ['title', 'ownership', 'deed', 'right']);

  // Track A: S.9 SRA Summary (6-month HARD LIMIT)
  if (isSummaryDispossession && dispossessionDate) {
    const sixMonths = addMonths(dispossessionDate, 6);
    const daysSinceDispossession = daysBetween(dispossessionDate, now);
    const withinLimit = daysSinceDispossession <= (6 * 30) && daysSinceDispossession > 0;

    // 3 Elements of S.9
    const wasInPossession = hasKeyword(descriptionLower, ['was in possession', 'my possession', 'owned', 'possessor']);
    const withoutConsent = hasKeyword(descriptionLower, ['without consent', 'forcefully', 'against my will', 'trespassed']);
    const withoutDueProcess = !hasKeyword(descriptionLower, ['court order', 'decree', 'legal process', 'due process']);

    const elements = [
      {
        name: 'Was in possession',
        met: wasInPossession,
        description: 'Plaintiff must prove they were in possession of the property before dispossession',
      },
      {
        name: 'Dispossession without consent',
        met: withoutConsent,
        description: 'Dispossession must be without the consent of the plaintiff (S.9 proviso)',
      },
      {
        name: 'Without due process of law',
        met: withoutDueProcess,
        description: 'Dispossession was not by authority of law or court decree',
      },
    ];

    const allMet = wasInPossession && withoutConsent && withoutDueProcess;

    return {
      track: 'S9_summary',
      trigger: dispossessionDate.toISOString().split('T')[0],
      limitation: withinLimit
        ? `Within 6-month HARD LIMIT (S.9 SRA) — ${Math.abs(Math.round(daysBetween(now, sixMonths)))} days remaining`
        : `BARRED — 6-month limit under S.9 SRA expired on ${sixMonths.toISOString().split('T')[0]}. No condonation available.`,
      elements,
      allMet: allMet && withinLimit,
      titleExamined: false,
      outcome: allMet && withinLimit
        ? 'Summary possession decree under S.9 SRA — title NOT examined'
        : withinLimit && !allMet
          ? 'S.9 elements not fully satisfied — consider title-based suit under S.8'
          : 'TIME BARRED — S.9 dismissed. May file title-based suit under S.8 if limitation permits',
    };
  }

  // Track B: S.8 SRA Title-Based (12 years)
  const startDate = causeDate || dispossessionDate;
  const twelveYears = startDate ? addYears(startDate, 12) : null;
  const daysRemaining = twelveYears ? daysBetween(now, twelveYears) : 0;
  const withinLimit = twelveYears ? daysRemaining > 0 : false;

  // Title-based elements
  const hasRegisteredDeed = !!facts.registered;
  const hasTitleDocument = hasRegisteredDeed || hasKeyword(descriptionLower, ['deed', 'title document', 'khatian']);
  const possessionEstablished = facts.physicalActs && facts.physicalActs.length > 0;

  const elements = [
    {
      name: 'Title/right to possess established',
      met: hasTitleDocument,
      description: 'Plaintiff must prove lawful title to the property (S.8 requires title examination)',
    },
    {
      name: 'Defendant in wrongful possession',
      met: hasKeyword(descriptionLower, ['wrongful', 'unauthorized', 'illegal', 'without right']),
      description: 'Defendant must be shown to be in possession without lawful right',
    },
    {
      name: 'Possession evidence available',
      met: possessionEstablished,
      description: 'Physical acts of possession support the claim (Evidence Act S.110)',
    },
  ];

  const allMet = hasTitleDocument && possessionEstablished;

  return {
    track: 'S8_title',
    trigger: startDate ? startDate.toISOString().split('T')[0] : 'Unknown',
    limitation: withinLimit
      ? `12 years under Art. 65 Limitation Act — ${Math.round(daysRemaining)} days remaining`
      : 'TIME BARRED — 12-year limitation under Art. 65 expired',
    elements,
    allMet: allMet && withinLimit,
    titleExamined: true,
    outcome: allMet && withinLimit
      ? 'Possession decree on title — full title examination required under S.8 SRA'
      : !withinLimit
        ? 'TIME BARRED under Art. 65 Limitation Act'
        : 'Title evidence insufficient — strengthen title documents before filing',
  };
}

// ─── 7.2 Specific Performance Engine ────────────────────────────────────────

function runSpecificPerformanceEngine(facts: CaseFacts): SpecificPerformanceCheck {
  const descriptionLower = (facts.description || '').toLowerCase();
  const disputeLower = (facts.disputeType || '').toLowerCase();

  // ─── Step 1: S.14 Bar Check ───
  // 5 statutory bars where SP is REFUSED as a matter of law
  const s14Bars = [
    {
      bar: 'Compensation is adequate relief (S.14(1))',
      applicable: false,
      description: 'Where monetary compensation would adequately remedy the breach, SP is refused',
    },
    {
      bar: 'Continuous duty requiring supervision (S.14(2))',
      applicable: hasKeyword(descriptionLower, ['continuous supervision', 'ongoing obligation', 'personal supervision']),
      description: 'Court cannot enforce contracts requiring continuous supervision',
    },
    {
      bar: 'Determinable contract (S.14(3))',
      applicable: hasKeyword(descriptionLower, ['determinable', 'determinable life', 'at will']),
      description: 'SP not available for contracts determinable at will',
    },
    {
      bar: 'Personal volition/skill (S.14(4))',
      applicable: hasKeyword(descriptionLower, ['personal skill', 'personal service', 'artistic work', 'writing a book', 'painting']),
      description: 'Contracts depending on personal volition cannot be specifically enforced',
    },
    {
      bar: 'Construction contract not substantially performed (S.14 proviso)',
      applicable: hasKeyword(descriptionLower, ['construction', 'building contract']) && !hasKeyword(descriptionLower, ['substantially performed', 'completed']),
      description: 'Construction contracts: SP only if substantially performed or compensation difficult to assess',
    },
  ];

  // Check if compensation is adequate for immovable property
  const isImmovableProperty = facts.classification === 'agricultural' ||
    facts.classification === 'homestead' ||
    facts.classification === 'commercial' ||
    facts.classification === 'industrial' ||
    facts.mouza ||
    facts.dag ||
    hasKeyword(descriptionLower, ['land', 'property', 'plot', 'katha', 'bigha']);

  // For immovable property, compensation is PRESUMED inadequate (S.14(1) exception)
  if (isImmovableProperty) {
    s14Bars[0].applicable = false; // Not applicable — immovable property exception
    s14Bars[0].description += ' [EXCEPTION: Immovable property — compensation presumed inadequate per S.10 read with S.14]';
  }

  const anyS14Bar = s14Bars.some(b => b.applicable);

  // ─── Step 2: S.16 Personal Bar ───
  // 3 personal bars — plaintiff's own conduct
  const plaintiffReady = facts.plaintiffReadyWilling !== false &&
    (hasKeyword(descriptionLower, ['ready', 'willing', 'arranged funds', 'paid advance', 'always willing']) ||
      !hasKeyword(descriptionLower, ['not ready', 'unable to pay', 'defaulted', 'backed out']));

  const plaintiffCapable = !hasKeyword(descriptionLower, ['incapable', 'insolvent', 'bankrupt', 'unable to perform']);

  const plaintiffCleanHands = !hasKeyword(descriptionLower, [
    'plaintiff fraud', 'plaintiff misrepresented', 'plaintiff suppressed',
    'unclean hands', 'plaintiff default',
  ]);

  const s16Bars = [
    {
      bar: 'Plaintiff not ready and willing (S.16(a))',
      applicable: !plaintiffReady,
      description: 'CRITICAL: Plaintiff must plead and prove readiness and willingness to perform their part of the contract',
    },
    {
      bar: 'Plaintiff incapable of performing (S.16(b))',
      applicable: !plaintiffCapable,
      description: 'If plaintiff is incapable of performing the contract, SP cannot be granted',
    },
    {
      bar: 'Plaintiff\'s own conduct defeats claim (S.16(c))',
      applicable: !plaintiffCleanHands,
      description: 'If plaintiff\'s own conduct contributed to the breach, court may refuse SP',
    },
  ];

  const anyS16Bar = s16Bars.some(b => b.applicable);

  // ─── Step 3: S.21 Contract Validity ───
  const inWriting = hasKeyword(descriptionLower, ['written', 'agreement', 'deed', 'contract', 'document']) ||
    !!facts.registered;
  const termsCertain = !hasKeyword(descriptionLower, ['vague terms', 'uncertain', 'incomplete', 'not specific']);
  const considerationExists = !!facts.consideration || hasKeyword(descriptionLower, ['consideration', 'price', 'amount', 'paid', 'agreed']);
  const noIllegality = !hasKeyword(descriptionLower, ['illegal', 'prohibited', 'against law', 'unlawful']);
  const partiesCompetent = !hasKeyword(descriptionLower, ['minor', 'insane', 'unsound mind', 'disqualified']);

  const s21ContractValid = {
    inWriting,
    termsCertain,
    considerationExists,
    noIllegality,
    partiesCompetent,
    allValid: inWriting && termsCertain && considerationExists && noIllegality && partiesCompetent,
  };

  // ─── Step 4: S.10 Damages Adequacy ───
  // For immovable property, damages are PRESUMED inadequate
  const presumedInadequate = isImmovableProperty;
  const damagesAdequate = !presumedInadequate && hasKeyword(descriptionLower, [
    'money adequate', 'compensation sufficient', 'easily calculable',
  ]);

  // ─── Step 5: S.22 Discretion ───
  const againstFactors: string[] = [];
  const inFavourFactors: string[] = [];

  if (anyS14Bar) againstFactors.push('Statutory bar exists under S.14');
  if (anyS16Bar) againstFactors.push('Personal bar exists under S.16');
  if (!s21ContractValid.allValid) againstFactors.push('Contract validity doubtful under S.21');
  if (damagesAdequate) againstFactors.push('Damages would be adequate remedy');

  if (plaintiffReady) inFavourFactors.push('Plaintiff is ready and willing to perform');
  if (s21ContractValid.allValid) inFavourFactors.push('Contract is valid and enforceable under S.21');
  if (presumedInadequate) inFavourFactors.push('Property is immovable — compensation presumed inadequate');
  if (facts.registered) inFavourFactors.push('Registered instrument strengthens claim');

  const netAssessment: 'favour' | 'against' | 'neutral' =
    againstFactors.length > inFavourFactors.length ? 'against' :
    inFavourFactors.length > againstFactors.length ? 'favour' : 'neutral';

  // ─── Final Outcome ───
  let finalOutcome: 'granted' | 'refused' | 'conditional' | 'damages_in_lieu';

  if (anyS14Bar) {
    finalOutcome = 'refused';
  } else if (!plaintiffReady) {
    finalOutcome = 'refused';
  } else if (!s21ContractValid.allValid) {
    finalOutcome = 'refused';
  } else if (damagesAdequate && !presumedInadequate) {
    finalOutcome = 'damages_in_lieu';
  } else if (netAssessment === 'neutral') {
    finalOutcome = 'conditional';
  } else {
    finalOutcome = 'granted';
  }

  return {
    s14BarCheck: {
      bars: s14Bars,
      anyBarApplies: anyS14Bar,
      spRefusedUnderS14: anyS14Bar,
    },
    s16PersonalBar: {
      bars: s16Bars,
      anyBarApplies: anyS16Bar,
      readinessWillingnessProven: plaintiffReady,
    },
    s21ContractValid,
    s10DamagesInadequate: {
      presumedInadequate,
      immovableProperty: isImmovableProperty,
      damagesAdequate,
    },
    s22Discretion: {
      againstFactors,
      inFavourFactors,
      netAssessment,
    },
    finalOutcome,
    conditions: finalOutcome === 'conditional'
      ? ['Court may impose time limit for performance', 'Security deposit may be ordered', 'Court retains supervisory jurisdiction']
      : undefined,
  };
}

// ─── 7.3 Declaration Engine ─────────────────────────────────────────────────

function runDeclarationEngine(facts: CaseFacts): DeclarationCheck {
  const descriptionLower = (facts.description || '').toLowerCase();
  const disputeLower = (facts.disputeType || '').toLowerCase();

  // ─── Standing Check ───
  // Plaintiff must have a legal right and defendant must be denying it
  const hasLegalRight = hasKeyword(descriptionLower, [
    'owner', 'title holder', 'rightful owner', 'heir', 'purchaser',
  ]) || !!facts.registered;

  const defendantDenyingRight = hasKeyword(descriptionLower, [
    'denying', 'disputing', 'contesting', 'claiming adverse', 'encroaching',
  ]);

  const standing = hasLegalRight;
  let standingIssue: string | undefined;
  if (!hasLegalRight) {
    standingIssue = 'Plaintiff must establish legal right to the property — standing questionable';
  }

  // ─── S.42 Proviso: Further Relief Bar ───
  // If plaintiff could seek consequential relief (e.g., possession) but seeks only declaration,
  // the suit is DISMISSED
  const onlyDeclaration = !hasKeyword(disputeLower, ['possession', 'recovery', 'injunction', 'mesne']);
  const couldSeekFurther = hasKeyword(descriptionLower, [
    'possession', 'occupy', 'enter', 'recovery',
  ]) || facts.currentPossessor !== facts.plaintiff;

  const furtherReliefBar = onlyDeclaration && couldSeekFurther;
  let furtherReliefAvailable: string | undefined;
  if (furtherReliefBar) {
    furtherReliefAvailable = 'Plaintiff could seek possession relief — S.42 Proviso mandates combined declaration + consequential relief. Risk of dismissal.';
  }

  // ─── Maintainability Check ───
  // Declaration must not be sought as a mere academic exercise
  const isAcademicExercise = !hasKeyword(descriptionLower, [
    'dispute', 'denial', 'cloud on title', 'obstruction', 'injury',
  ]);

  let maintainabilityIssue: string | undefined;
  if (isAcademicExercise) {
    maintainabilityIssue = 'Declaration sought appears to be academic — no live dispute or threatened injury demonstrated. Risk of dismissal.';
  }

  // ─── Government Defendant + S.80 Notice ───
  const governmentDefendant = !!facts.isGovernmentDefendant ||
    hasKeyword((facts.defendant || '').toLowerCase(), [
      'government', 'state', 'republic', 'bangladesh government', 'ministry',
      'upazila parishad', 'union parishad', 'city corporation', 'municipality',
      'land revenue', 'ac land', 'dc office', 'settled officer',
    ]);

  const s80NoticeGiven = facts.s80NoticeGiven === true ||
    hasKeyword(descriptionLower, ['section 80 notice', 'two month notice', 's.80 notice']);

  // ─── Outcome ───
  let outcome: 'granted' | 'refused' | 'amendment_directed';

  if (!standing) {
    outcome = 'refused';
  } else if (furtherReliefBar) {
    outcome = 'amendment_directed';
  } else if (governmentDefendant && !s80NoticeGiven) {
    outcome = 'refused';
  } else {
    outcome = 'granted';
  }

  return {
    standing,
    standingIssue,
    furtherReliefBar,
    furtherReliefAvailable,
    maintainable: !isAcademicExercise,
    maintainabilityIssue,
    governmentDefendant,
    s80NoticeGiven,
    outcome,
  };
}

// ─── 7.4 Cancellation Engine ────────────────────────────────────────────────

function runCancellationEngine(facts: CaseFacts): CancellationCheck {
  const descriptionLower = (facts.description || '').toLowerCase();
  const causeDate = parseDate(facts.causeOfActionDate);
  const now = new Date();

  // ─── Void vs Voidable ───
  const voidIndicators = [
    hasKeyword(descriptionLower, ['forged', 'fabricated', 'fake', 'non est factum', 'never signed']),
    facts.s49Inadmissible === true,
  ];

  const voidableIndicators = [
    hasKeyword(descriptionLower, ['fraud', 'misrepresentation', 'undue influence', 'coercion', 'mistake', 'concealment']),
    facts.fraudulentIntent === true,
    facts.benamiFlag === true,
  ];

  const isVoid = voidIndicators.some(Boolean);
  const isVoidable = !isVoid && voidableIndicators.some(Boolean);
  const voidOrVoidable: 'voidable' | 'void' = isVoid ? 'void' : 'voidable';

  // ─── 5 Grounds for Cancellation (S.34 SRA) ───
  const grounds = [
    {
      ground: 'Fraud / Misrepresentation (S.34(1))',
      proven: hasKeyword(descriptionLower, ['fraud', 'misrepresentation', 'deception', 'false statement']),
      description: 'Document executed through fraud or misrepresentation — cancellable at instance of injured party',
    },
    {
      ground: 'Undue Influence / Coercion (S.34(2))',
      proven: hasKeyword(descriptionLower, ['undue influence', 'coercion', 'threat', 'pressure', 'forced']),
      description: 'Party gave consent under undue influence or coercion',
    },
    {
      ground: 'Mistake of Fact/Law (S.34(3))',
      proven: hasKeyword(descriptionLower, ['mistake', 'error', 'unaware', 'did not know']),
      description: 'Document executed under mistake of fact or law',
    },
    {
      ground: 'Against Natural Justice / Illegality (S.34(4))',
      proven: hasKeyword(descriptionLower, ['illegal', 'against law', 'unnatural', 'contrary to natural justice']),
      description: 'Document is illegal or contrary to principles of natural justice',
    },
    {
      ground: 'Causes Injury / Threatens Injury (S.39)',
      proven: hasKeyword(descriptionLower, ['injury', 'harm', 'loss', 'damage', 'prejudice']),
      description: 'Document causes or threatens injury to plaintiff\'s legal rights',
    },
  ];

  const provenGrounds = grounds.filter(g => g.proven).length;

  // ─── Limitation: 3 years from discovery (Art. 91) ───
  let within3Years = true;
  let deadline: string | undefined;

  // For fraud-based claims, limitation runs from discovery (Art. 91)
  const discoveryDate = parseDate(facts.knowledgeOfFraudDate) || causeDate;
  if (discoveryDate) {
    const threeYearDeadline = addYears(discoveryDate, 3);
    deadline = threeYearDeadline.toISOString().split('T')[0];
    within3Years = daysBetween(now, threeYearDeadline) > 0;
  }

  // ─── Restitution ───
  const restitutionRequired = hasKeyword(descriptionLower, ['consideration', 'money paid', 'amount paid', 'registration fee']);
  let restitutionTerms: string | undefined;
  if (restitutionRequired) {
    restitutionTerms = 'Upon cancellation, defendant must restore consideration amount with interest and expenses. Read with S.35 SRA.';
  }

  // ─── Outcome ───
  const outcome: 'granted' | 'refused' = (provenGrounds >= 1 && within3Years) ? 'granted' : 'refused';

  return {
    voidableOrVoid: voidOrVoidable,
    grounds,
    limitationCheck: {
      within3Years,
      deadline,
    },
    restitution: {
      required: restitutionRequired,
      terms: restitutionTerms,
    },
    outcome,
  };
}

// ─── 7.5 Injunction Engine ──────────────────────────────────────────────────

function runInjunctionEngine(facts: CaseFacts): {
  temporary: TemporaryInjunction;
  permanent: PermanentInjunction;
} {
  const descriptionLower = (facts.description || '').toLowerCase();

  // ═══ TEMPORARY INJUNCTION (CPC O.39 R.1 & R.2) ═══
  // Three-prong test: (1) Prima facie case (2) Balance of convenience (3) Irreparable injury

  const primaFacieCase = !!facts.registered ||
    hasKeyword(descriptionLower, ['right established', 'deed in my favour', 'valid title', 'court decree', 'registered in my name']);

  // Balance of convenience — favours plaintiff if defendant is doing something irreversible
  const balanceOfConvenience = hasKeyword(descriptionLower, [
    'constructing', 'building', 'selling to third party', 'encroaching',
    'demolishing', 'cutting trees', 'filling', 'changing nature',
  ]) || facts.currentPossessor === facts.defendant;

  // Irreparable injury — harm that cannot be compensated by money
  const irreparableInjury = hasKeyword(descriptionLower, [
    'heritage property', 'ancestral', 'homestead', 'unique', 'irreplaceable',
    'emotional attachment', 'agricultural land', 'only property',
  ]) || hasKeyword(descriptionLower, ['permanent damage', 'cannot be compensated', 'irreparable']);

  const allThreeMet = primaFacieCase && balanceOfConvenience && irreparableInjury;

  // Ex-parte ad-interim available on day of filing
  const exParteAvailable = primaFacieCase && irreparableInjury;

  // Procedure for temporary injunction
  const procedure: string[] = [
    'File application under CPC O.39 R.1 & R.2 with supporting affidavit',
    'Court may grant ex-parte ad-interim injunction on day of filing (O.39 R.3)',
    'Matter listed for hearing on returnable date (usually 2-4 weeks)',
    'If no appearance by defendant → injunction confirmed',
    'If triable issues raised → matter adjourned for trial',
  ];

  let outcome: 'ad_interim' | 'interim' | 'refused';
  if (allThreeMet) {
    outcome = 'ad_interim'; // Strong case — ad-interim likely
  } else if (primaFacieCase && (balanceOfConvenience || irreparableInjury)) {
    outcome = 'interim'; // Moderate case — interim after hearing
  } else {
    outcome = 'refused';
  }

  const temporary: TemporaryInjunction = {
    primaFacieCase,
    balanceOfConvenience: balanceOfConvenience
      ? 'Favours plaintiff — defendant action threatens plaintiff rights'
      : 'Neutral or favours defendant — no urgency shown',
    irreparableInjury,
    allThreeMet,
    procedure,
    exParteAvailable,
    outcome,
  };

  // ═══ PERMANENT INJUNCTION (SRA S.52-57) ═══

  // Breach of obligation
  const breachOfObligation = hasKeyword(descriptionLower, [
    'breach', 'violating', 'trespassing', 'encroaching', 'interfering', 'obstructing',
  ]);

  // Compensation inadequate
  const compensationInadequate = irreparableInjury || hasKeyword(descriptionLower, [
    'unique property', 'emotional value', 'no adequate damages',
  ]);

  // Multiple parties
  const multipleParties = hasKeyword(descriptionLower, ['multiple defendants', 'several persons', 'co-sharers', 'joint encroachers']);

  // Mandatory injunction (S.55 — higher threshold)
  const mandatoryInjunction = hasKeyword(descriptionLower, [
    'mandatory', 'must remove', 'restore', 'reconstruct', 'dismantle', 'vacate',
  ]);

  // Bars (S.56)
  const bars = [
    {
      bar: 'Judicial proceeding cannot be injuncted',
      applies: hasKeyword(descriptionLower, ['judicial proceeding', 'court case', 'stay of court']),
      description: 'No injunction can be granted to restrain any judicial proceeding — SRA S.56',
      section: 'SRA S.56(a)',
    },
    {
      bar: 'Legislative/Constitutional act',
      applies: hasKeyword(descriptionLower, ['legislation', 'constitutional amendment', 'parliament act']),
      description: 'No injunction against legislative or sovereign acts — SRA S.56',
      section: 'SRA S.56(b)',
    },
    {
      bar: 'Unenforceable contract',
      applies: !facts.registered && hasKeyword(descriptionLower, ['contract', 'agreement']),
      description: 'No injunction to enforce an unenforceable contract — SRA S.56',
      section: 'SRA S.56 proviso',
    },
    {
      bar: 'Adequate damages available',
      applies: !compensationInadequate && hasKeyword(descriptionLower, ['money', 'compensation', 'damages sufficient']),
      description: 'No injunction where damages would adequately compensate the injury — SRA S.56 / SRA S.54',
      section: 'SRA S.56',
    },
  ];

  const anyBarApplies = bars.some(b => b.applies);

  let permOutcome: 'permanent' | 'mandatory' | 'refused';
  if (anyBarApplies) {
    permOutcome = 'refused';
  } else if (mandatoryInjunction && breachOfObligation) {
    permOutcome = 'mandatory';
  } else if (breachOfObligation && compensationInadequate) {
    permOutcome = 'permanent';
  } else {
    permOutcome = 'refused';
  }

  const permanent: PermanentInjunction = {
    breachOfObligation,
    compensationInadequate,
    multipleParties,
    mandatoryInjunction,
    bars,
    outcome: permOutcome,
  };

  return { temporary, permanent };
}

// ═══════════════════════════════════════════════════════════════════════════
// STAGE 8: EVIDENCE ENGINE
// Evidence Act 1872 — document hierarchy, admissibility rules, burden of proof,
// digital evidence (S.65B), strength scoring
// ═══════════════════════════════════════════════════════════════════════════

export function runStage8(
  facts: CaseFacts,
  stage1: Stage1Result,
  stage25?: Stage25Result,
): Stage8Result {
  const descriptionLower = (facts.description || '').toLowerCase();
  const documentStack = stage1.documentStack || [];

  // ─── Document Hierarchy (Weighted for land disputes) ───
  // Registered deed > CS Khatian > SA Khatian > RS Khatian > Mutation > Unregistered > Oral
  const documentHierarchy: EvidenceItem[] = [];

  // 1. Registered Sale Deed — highest weight (10/10)
  if (facts.registered) {
    documentHierarchy.push({
      type: 'Registered Deed',
      description: `Primary conveyance instrument${facts.registrationDate ? `, registered on ${facts.registrationDate}` : ''} — Presumed valid under S.114(e) Evidence Act`,
      weight: 10,
      legalRef: 'Evidence Act S.114(e) + Registration Act S.17 + TPA S.54',
      admissible: true,
    });
  } else if (hasKeyword(descriptionLower, ['sale deed', 'conveyance deed', 'gift deed', 'mortgage deed'])) {
    documentHierarchy.push({
      type: 'Unregistered Deed',
      description: 'Instrument required to be registered under S.17 Registration Act but was NOT registered',
      weight: 1,
      legalRef: 'Registration Act S.17, S.49 — INADMISSIBLE for title',
      admissible: false,
      bar: 'S.49 Registration Act — inadmissible as evidence of title',
    });
  }

  // 2. Court Decree (if any from previous suit)
  if (hasKeyword(descriptionLower, ['decree', 'court order', 'judgment'])) {
    documentHierarchy.push({
      type: 'Court Decree',
      description: 'Previous court decree — res judicata if between same parties on same matter (S.11 CPC)',
      weight: 10,
      legalRef: 'CPC S.11 + Evidence Act S.40',
      admissible: true,
    });
  }

  // 3. CS (Cadastral Survey) Record
  if (facts.khatian && hasKeyword(facts.khatian, ['cs']) || hasKeyword(descriptionLower, ['cs khatian', 'cadastral survey'])) {
    documentHierarchy.push({
      type: 'CS Khatian',
      description: 'Cadastral Survey record — primary revenue record for land identification',
      weight: 8,
      legalRef: 'State Acquisition & Tenancy Act + Revenue Records Rules',
      admissible: true,
    });
  }

  // 4. SA (State Acquisition) Record
  if (facts.khatian && hasKeyword(facts.khatian, ['sa']) || hasKeyword(descriptionLower, ['sa khatian', 'state acquisition'])) {
    documentHierarchy.push({
      type: 'SA Khatian',
      description: 'State Acquisition survey record — post-1950 land record',
      weight: 7,
      legalRef: 'State Acquisition & Tenancy Act 1950',
      admissible: true,
    });
  }

  // 5. RS (Revisional Survey) Record
  if (facts.khatian && hasKeyword(facts.khatian, ['rs']) || hasKeyword(descriptionLower, ['rs khatian', 'revisional survey'])) {
    documentHierarchy.push({
      type: 'RS Khatian',
      description: 'Revisional Survey record — updated cadastral map',
      weight: 7,
      legalRef: 'State Acquisition & Tenancy Act 1950',
      admissible: true,
    });
  }

  // 6. Mutation Record
  if (facts.mutationStatus === 'completed' || hasKeyword(descriptionLower, ['mutation completed', 'namjari', 'record of rights'])) {
    documentHierarchy.push({
      type: 'Mutation Record',
      description: 'AC Land mutation completed — administrative record only, NOT conclusive proof of title',
      weight: 5,
      legalRef: 'State Acquisition & Tenancy Act — mutation is administrative, not judicial',
      admissible: true,
    });
  } else if (facts.mutationStatus === 'pending') {
    documentHierarchy.push({
      type: 'Mutation Record (Pending)',
      description: 'Mutation is pending — does not affect title but may indicate procedural delay',
      weight: 3,
      legalRef: 'State Acquisition & Tenancy Act',
      admissible: true,
    });
  }

  // 7. Unregistered documents
  if (hasKeyword(descriptionLower, ['unregistered document', 'handwritten agreement', 'memo', 'receipt'])) {
    documentHierarchy.push({
      type: 'Unregistered Document',
      description: 'May be admissible for collateral purposes only — not for title (S.49 Registration Act)',
      weight: 2,
      legalRef: 'Registration Act S.49 — admissible for collateral purpose only',
      admissible: true,
      bar: 'Cannot be used as primary evidence of title',
    });
  }

  // 8. Oral Evidence
  documentHierarchy.push({
    type: 'Oral Witness Testimony',
    description: 'Testimonial evidence — weakest form. Cannot contradict written documents under S.91',
    weight: 3,
    legalRef: 'Evidence Act S.60, S.91, S.92',
    admissible: true,
  });

  // 9. Physical Possession Evidence
  if (facts.physicalActs && facts.physicalActs.length > 0) {
    documentHierarchy.push({
      type: 'Possession Evidence',
      description: `Physical acts: ${facts.physicalActs.join(', ')} — supports possession claim under S.110`,
      weight: 6,
      legalRef: 'Evidence Act S.110',
      admissible: true,
    });
  }

  // 10. Digital Evidence
  const hasDigitalEvidence = hasKeyword(descriptionLower, ['digital', 'electronic', 'email', 'sms', 'whatsapp', 'screenshot', 'cctv', 'video', 'photo']);
  const hasS65BCertificate = hasKeyword(descriptionLower, ['section 65b', '65b certificate', 'digital certificate', 'hash value']);

  documentHierarchy.push({
    type: 'Digital Evidence',
    description: hasDigitalEvidence
      ? `Digital evidence identified. ${hasS65BCertificate ? 'S.65B certificate present.' : 'WARNING: S.65B certificate REQUIRED for admissibility.'}`
      : 'No digital evidence identified',
    weight: hasDigitalEvidence && hasS65BCertificate ? 5 : hasDigitalEvidence ? 1 : 0,
    legalRef: 'Evidence Act S.65A, S.65B (IT Act 2006 S.79A)',
    admissible: hasDigitalEvidence ? hasS65BCertificate : true,
    bar: hasDigitalEvidence && !hasS65BCertificate ? 'S.65B — digital evidence inadmissible without certificate' : undefined,
  });

  // ─── Evidence Act Rules Applied ───
  const evidenceActRules: Array<{ section: string; rule: string; application: string }> = [
    {
      section: 'S.91',
      rule: 'Documentary Supremacy',
      application: 'When terms of a document have been reduced to writing, oral evidence CANNOT contradict it. Written document overrides oral testimony.',
    },
    {
      section: 'S.92',
      rule: 'Oral Exclusion for Written Contracts',
      application: 'Oral evidence is EXCLUDED when the contract is in writing and the writing expressly or impliedly excludes oral terms.',
    },
    {
      section: 'S.67',
      rule: 'Proof of Signature/Execution',
      application: 'Signature or execution of a document must be proved by calling at least one attesting witness (if document is required by law to be attested).',
    },
    {
      section: 'S.64-65',
      rule: 'Primary vs Secondary Evidence',
      application: 'Primary evidence = original document (S.62). Secondary evidence (copies, oral accounts) admissible only when primary is lost, destroyed, or in opponent\'s possession (S.65).',
    },
    {
      section: 'S.74-77',
      rule: 'Public Documents',
      application: 'Public documents (government records, court orders, gazette notifications) are presumed genuine. Certified copies admissible without producing original.',
    },
    {
      section: 'S.101',
      rule: 'Burden of Proof',
      application: 'The burden of proof lies on the person who would fail if no evidence is given. In civil suits, this is the PLAINTIFF.',
    },
    {
      section: 'S.110',
      rule: 'Possession Presumption',
      application: 'Long and continuous possession creates a PRESUMPTION of title — burden shifts to challenger.',
    },
    {
      section: 'S.114(e)',
      rule: 'Registered Deed Presumption',
      application: 'Registered document is PRESUMED to have been properly executed — burden shifts to challenger to prove otherwise.',
    },
  ];

  if (hasDigitalEvidence) {
    evidenceActRules.push({
      section: 'S.65A/65B',
      rule: 'Digital Evidence Admissibility',
      application: 'Electronic records are admissible as evidence IF accompanied by S.65B certificate (IT Act 2006 S.79A). Certificate must verify accuracy, hash value, and chain of custody.',
    });
  }

  // ─── Burden of Proof ───
  let burdenOfProof = 'On plaintiff to prove case on preponderance of probability (Evidence Act S.101)';
  if (facts.registered && hasKeyword(descriptionLower, ['defendant', 'challenging', 'disputing'])) {
    burdenOfProof += ' — Shifted to defendant to rebut S.114(e) presumption of registered deed validity';
  }
  if (facts.physicalActs && facts.physicalActs.length > 0) {
    burdenOfProof += ' — S.110: Long possession presumption shifts burden to challenger';
  }

  // ─── Digital Evidence ───
  const digitalEvidenceAdmissible = !hasDigitalEvidence || hasS65BCertificate;
  const s65bCertificate = hasS65BCertificate;

  // ─── Evidence Strength Scoring (0-100) ───
  const totalWeight = documentHierarchy.reduce((sum, d) => sum + d.weight, 0);
  const maxPossibleWeight = documentHierarchy.length * 10;
  const rawScore = maxPossibleWeight > 0 ? (totalWeight / maxPossibleWeight) * 100 : 0;

  // Penalty for inadmissible evidence
  const inadmissibleCount = documentHierarchy.filter(d => !d.admissible).length;
  const penaltyScore = inadmissibleCount * 8;

  const evidenceStrength = Math.max(0, Math.min(100, Math.round(rawScore - penaltyScore)));

  // ─── Adversarial Threshold ───
  let adversarialThreshold = 'Below threshold — case unlikely to succeed';
  if (evidenceStrength >= 75) {
    adversarialThreshold = 'STRONG — evidence meets or exceeds civil standard (preponderance of probability)';
  } else if (evidenceStrength >= 50) {
    adversarialThreshold = 'MODERATE — evidence close to threshold, may benefit from additional documentation';
  } else if (evidenceStrength >= 30) {
    adversarialThreshold = 'WEAK — significant gaps in evidence chain, case at risk';
  }

  // ─── Key Strengths ───
  const keyStrengths: string[] = [];
  if (facts.registered) keyStrengths.push('Registered deed — S.114(e) presumption of validity');
  if (facts.physicalActs && facts.physicalActs.length > 0) keyStrengths.push('Physical possession evidence available');
  if (facts.mutationStatus === 'completed') keyStrengths.push('Mutation completed (administrative record)');
  if (facts.khatian) keyStrengths.push('Khatian records available for land identification');
  if (stage25?.saleValidity.validUnderS54) keyStrengths.push('Sale valid under TPA S.54');
  if (stage25?.saleValidity.validUnderS17) keyStrengths.push('Document compliant with Registration Act S.17');
  if (documentHierarchy.some(d => d.weight >= 8)) keyStrengths.push('Strong documentary evidence in hierarchy');

  // ─── Key Weaknesses ───
  const keyWeaknesses: string[] = [];
  if (!facts.registered) keyWeaknesses.push('No registered deed — title unprovable under S.17 Registration Act');
  if (!facts.physicalActs || facts.physicalActs.length === 0) keyWeaknesses.push('No physical possession evidence — S.110 presumption unavailable');
  if (facts.s49Inadmissible) keyWeaknesses.push('S.49 inadmissibility — document cannot be admitted as evidence');
  if (facts.mutationStatus !== 'completed') keyWeaknesses.push('Mutation not completed — weak administrative record');
  if (hasDigitalEvidence && !hasS65BCertificate) keyWeaknesses.push('Digital evidence lacks S.65B certificate — inadmissible');
  if (documentHierarchy.some(d => !d.admissible)) keyWeaknesses.push('Inadmissible evidence items detected');
  if (inadmissibleCount > 1) keyWeaknesses.push(`Multiple (${inadmissibleCount}) inadmissible evidence items`);

  return {
    documentHierarchy,
    evidenceActRules,
    burdenOfProof,
    adversarialThreshold,
    digitalEvidenceAdmissible,
    s65bCertificate,
    evidenceStrength,
    keyWeaknesses,
    keyStrengths,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// STAGE 9: PROCEDURAL DEFECT ENGINE
// CPC O.7 R.11 (rejection) + O.7 R.10 (return) + procedural bars
// Checks 8 procedural defect categories: 9A through 9H
// ═══════════════════════════════════════════════════════════════════════════

export function runStage9(
  facts: CaseFacts,
  stage1: Stage1Result,
  stage4: Stage4Result,
): Stage9Result {
  const descriptionLower = (facts.description || '').toLowerCase();
  const disputeLower = (facts.disputeType || '').toLowerCase();
  const defects: ProceduralDefect[] = [];

  // ═══ 9A: Limitation Barred → Reject O.7 R.11(d) ═══
  const limitationBarred = stage4.suitTimeBarred;
  defects.push({
    code: '9A',
    name: 'Limitation Barred',
    detected: limitationBarred,
    severity: limitationBarred ? 'critical' : 'green',
    outcome: limitationBarred ? 'rejection' : 'proceed',
    section: 'CPC O.7 R.11(d) + Limitation Act S.3',
    description: limitationBarred
      ? `Suit is TIME BARRED — limitation period has expired. Liable to rejection under O.7 R.11(d). ${stage4.condonationAvailable ? 'Condonation may be available under S.5 Limitation Act.' : 'No condonation available.'}`
      : 'Suit is within limitation period — no bar detected',
  });

  // ═══ 9B: Wrong Jurisdiction → Return/Reject ═══
  const arthaRinDispute = facts.isBankCreditor ||
    hasKeyword((facts.defendantType || '').toLowerCase(), ['bank', 'financial institution']);
  const familyDispute = hasKeyword(disputeLower, ['divorce', 'dower', 'maintenance', 'child custody', 'family']);
  const wrongJurisdiction = arthaRinDispute && !hasKeyword(disputeLower, ['artha rin', 'money loan']);

  defects.push({
    code: '9B',
    name: 'Wrong Jurisdiction',
    detected: wrongJurisdiction,
    severity: wrongJurisdiction ? 'red' : 'green',
    outcome: wrongJurisdiction ? 'return' : 'proceed',
    section: 'CPC S.9, S.15-21 + Artha Rin Adalat Ain S.3',
    description: wrongJurisdiction
      ? 'Defendant is a bank/financial institution — Civil Court may lack jurisdiction. Route to Artha Rin Adalat (S.3 Artha Rin Ain).'
      : 'Jurisdiction appears correct based on available facts',
  });

  // ═══ 9C: Res Judicata S.11 → Absolute Bar ═══
  const resJudicata = hasKeyword(descriptionLower, [
    'previous suit', 'already decided', 'same parties', 'res judicata',
    'earlier decree', 'same subject matter', 'final judgment',
  ]);
  defects.push({
    code: '9C',
    name: 'Res Judicata (S.11 CPC)',
    detected: resJudicata,
    severity: resJudicata ? 'critical' : 'green',
    outcome: resJudicata ? 'bar' : 'proceed',
    section: 'CPC S.11',
    description: resJudicata
      ? 'ABSOLUTE BAR: Matter already decided in previous suit between same parties on same subject matter. No second suit permissible. Check: (1) Same parties, (2) Same subject matter, (3) Competent court, (4) Final decision.'
      : 'No res judicata issue detected',
  });

  // ═══ 9D: Order 2 Rule 2 Bar ═══
  const splittingCause = hasKeyword(descriptionLower, [
    'partial claim', 'omitted relief', 'split claim', 'separate suit',
    'could have claimed', 'left out',
  ]);
  defects.push({
    code: '9D',
    name: 'O.2 R.2 — Splitting Cause of Action',
    detected: splittingCause,
    severity: splittingCause ? 'red' : 'green',
    outcome: splittingCause ? 'bar' : 'proceed',
    section: 'CPC O.2 R.2 + SRA S.42 Proviso',
    description: splittingCause
      ? 'BAR: Plaintiff appears to have omitted part of claim/relief. O.2 R.2 prohibits splitting cause of action. Also connects to SRA S.42 Proviso (declaration without consequential relief).'
      : 'No splitting of cause of action detected',
  });

  // ═══ 9E: No Cause of Action → Reject O.7 R.11(a) ═══
  const noCauseOfAction = !hasKeyword(descriptionLower, [
    'breach', 'injury', 'violation', 'denial', 'dispute', 'right',
    'obstruction', 'encroachment', 'failure', 'default', 'dispossession',
  ]) && !facts.causeOfActionDate;

  defects.push({
    code: '9E',
    name: 'No Cause of Action',
    detected: noCauseOfAction,
    severity: noCauseOfAction ? 'critical' : 'green',
    outcome: noCauseOfAction ? 'rejection' : 'proceed',
    section: 'CPC O.7 R.11(a)',
    description: noCauseOfAction
      ? 'FATAL: Plaint does not disclose any cause of action. No breach, injury, or right violation is alleged. Liable to rejection under O.7 R.11(a).'
      : 'Cause of action appears to exist based on pleaded facts',
  });

  // ═══ 9F: No S.80 Notice → Return Plaint ═══
  const governmentDefendant = !!facts.isGovernmentDefendant ||
    hasKeyword((facts.defendant || '').toLowerCase(), [
      'government', 'state', 'republic', 'ministry', 'upazila parishad',
      'union parishad', 'city corporation', 'municipality', 'dc office',
    ]);
  const s80NoticeGiven = facts.s80NoticeGiven === true ||
    hasKeyword(descriptionLower, ['section 80 notice', 'two month notice', 'notice served']);
  const noS80Notice = governmentDefendant && !s80NoticeGiven;

  defects.push({
    code: '9F',
    name: 'No S.80 Notice (Government Defendant)',
    detected: noS80Notice,
    severity: noS80Notice ? 'red' : 'green',
    outcome: noS80Notice ? 'return' : 'proceed',
    section: 'CPC S.80 (2-month notice requirement)',
    description: noS80Notice
      ? 'FATAL: Defendant is a government entity but no 2-month S.80 notice has been served. Plaint must be RETURNED for presentation to proper court after notice compliance.'
      : governmentDefendant
        ? 'Government defendant — S.80 notice served, proceeding permitted'
        : 'Not applicable — defendant is not a government entity',
  });

  // ═══ 9G: Necessary Party Not Joined ═══
  const necessaryPartyNotJoined = hasKeyword(descriptionLower, [
    'co-owner', 'co-sharer', 'joint owner', 'necessary party',
    'person interested', 'whose presence required',
  ]) && !hasKeyword(descriptionLower, ['all parties joined', 'joined as defendant']);

  defects.push({
    code: '9G',
    name: 'Necessary Party Not Joined',
    detected: necessaryPartyNotJoined,
    severity: necessaryPartyNotJoined ? 'yellow' : 'green',
    outcome: necessaryPartyNotJoined ? 'amendment' : 'proceed',
    section: 'CPC O.1 R.9 (misjoinder/non-joinder of parties)',
    description: necessaryPartyNotJoined
      ? 'Defect: References to co-owners/co-sharers found but all necessary parties may not be joined. Court may order amendment under O.1 R.9. Non-joinder of necessary party may result in dismissal.'
      : 'Party joinder appears adequate',
  });

  // ═══ 9H: Plaint Defects ═══
  const plaintDefects: string[] = [];
  if (!facts.causeOfActionDate) plaintDefects.push('Missing cause of action date');
  if (!facts.plaintiff) plaintDefects.push('Missing plaintiff name');
  if (!facts.defendant) plaintDefects.push('Missing defendant name');
  if (!facts.description || facts.description.length < 50) plaintDefects.push('Description too brief — insufficient facts pleaded');
  if (!facts.mouza && !facts.dag) plaintDefects.push('Property identification insufficient — no mouza/dag provided');
  if (!facts.amountClaimed && hasKeyword(disputeLower, ['money', 'damages', 'recovery'])) plaintDefects.push('Amount claimed not specified for money suit');
  if (facts.stampDutyOk === false) plaintDefects.push('Insufficient stamp duty on plaint — O.7 R.11(c) rejection risk');
  if (!facts.registered && hasKeyword(disputeLower, ['title', 'declaration', 'possession'])) plaintDefects.push('No registered deed for title claim — fatal evidentiary defect');

  defects.push({
    code: '9H',
    name: 'Plaint Defects',
    detected: plaintDefects.length > 0,
    severity: plaintDefects.length >= 3 ? 'red' : plaintDefects.length >= 1 ? 'yellow' : 'green',
    outcome: plaintDefects.length >= 3 ? 'rejection' : plaintDefects.length >= 1 ? 'amendment' : 'proceed',
    section: 'CPC O.7 R.1-14 (plaint requirements)',
    description: plaintDefects.length > 0
      ? `Plaint has ${plaintDefects.length} defect(s): ${plaintDefects.join('; ')}. ${plaintDefects.length >= 3 ? 'Risk of rejection under O.7 R.11.' : 'Amendment may be permitted under O.15 CPC.'}`
      : 'Plaint appears to comply with CPC O.7 requirements',
  });

  // ─── Categorize Defects ───
  const fatalDefects = defects.filter(d =>
    d.detected && (d.outcome === 'rejection' || d.outcome === 'bar')
  );
  const waivableDefects = defects.filter(d =>
    d.detected && d.outcome === 'amendment'
  );

  // ─── Suit Proceedable? ───
  const hasFatalDefect = fatalDefects.length > 0;
  const suitProceedable = !hasFatalDefect;

  const blockingDefect = hasFatalDefect
    ? fatalDefects[0].name + ' — ' + fatalDefects[0].description
    : null;

  return {
    defects,
    fatalDefects,
    waivableDefects,
    suitProceedable,
    blockingDefect,
  };
}
