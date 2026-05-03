// ═══════════════════════════════════════════════════════════════════════════════
// FATIHA v3.0 — Bangladesh Civil Dispute Decision Engine
// Stages 0–4: Entry Gate → Fact Extraction → Legal Classification →
//             TPA/SAT Act Engine → Precondition Filters → Limitation Engine
// ═══════════════════════════════════════════════════════════════════════════════
//
// All functions are pure (no side effects, no React) — safe for 'use server'.
// Imports from local types only.

import type {
  CaseFacts,
  Stage0Result,
  Stage1Result,
  Stage2Result,
  Stage25Result,
  PreconditionResult,
  Stage4Result,
  DisputeTrack,
  SuitTrack,
  Severity,
  PropertyInfo,
  DeedInfo,
  PossessionInfo,
  PartyInfo,
} from './types';

// ─── INTERNAL HELPERS ──────────────────────────────────────────────────────

/** Add calendar days to an ISO-date string, returns new ISO-date string. */
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/** Add calendar months to an ISO-date string. */
function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

/** Add calendar years. */
function addYears(dateStr: string, years: number): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().split('T')[0];
}

/** Days between two ISO-date strings (positive if deadline in future). */
function daysBetween(startStr: string, endStr: string): number {
  const s = new Date(startStr);
  const e = new Date(endStr);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return NaN;
  return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
}

/** Parse a numeric amount from string or number. */
function parseAmount(val: string | number | undefined): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  const cleaned = val.replace(/[,৳\s]/g, '').trim();
  const n = Number(cleaned);
  return isNaN(n) ? 0 : n;
}

/** Convert Bangla (Bengali) digits to Latin digits. */
function toLatinDigits(s: string): string {
  const bengaliDigits = '০১২৩৪৫৬৭৮৯';
  return s.replace(/[০-৯]/g, (ch) => String(bengaliDigits.indexOf(ch)));
}

/** Parse amount from a string that may contain Bangla digits, commas, etc. */
function parseAmountBangla(val: string | number | undefined): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  const latin = toLatinDigits(String(val));
  return parseAmount(latin);
}

/** Lower-case keyword search in a string. Exported for use in other stage files. */
export function hasKeyword(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

/** Try to determine party type from a name string. */
function detectPartyType(name: string): 'individual' | 'company' | 'government' | 'bank' {
  const lower = name.toLowerCase();
  const govtKeywords = ['govt', 'government', 'ministry', 'union parishad', 'pourashava',
    'city corporation', 'upazila parishad', 'zilla parishad', 'land office', 'dc office',
    'ac land', 'sadar', 'thana', 'bangladesh', 'republic', 'state of'];
  const bankKeywords = ['bank', 'nbfi', 'financial institution', 'microcredit', 'grameen',
    'brac', 'asa', 'janata bank', 'sonali bank', 'rupali bank', 'agrani bank',
    'pubali bank', 'uttara bank', 'dhaka bank', 'city bank', 'prime bank', 'ibbl',
    'artha rin', 'artharin'];
  const companyKeywords = ['ltd', 'limited', 'llc', 'pvt', 'private', 'incorporated',
    'corporation', 'company', 's.a.', 'gmbh', 'enterprise', 'industries'];

  if (govtKeywords.some((k) => lower.includes(k))) return 'government';
  if (bankKeywords.some((k) => lower.includes(k))) return 'bank';
  if (companyKeywords.some((k) => lower.includes(k))) return 'company';
  return 'individual';
}

/** Detect if the string refers to a minor (under 18). */
function isMinor(nameOrNote: string): boolean {
  const keywords = ['minor', 'infant', 'under 18', 'under18', 'কমলা', 'নাবালক', 'অপ্রাপ্তবয়স্ক'];
  return keywords.some((k) => nameOrNote.toLowerCase().includes(k));
}

/** Classify property from a free-text classification field. */
function classifyProperty(val: string | undefined): PropertyInfo['classification'] {
  if (!val) return 'agricultural';
  const lower = val.toLowerCase();
  if (lower.includes('khas') || lower.includes('খাস')) return 'khas';
  if (lower.includes('agricultural') || lower.includes('ফসল') || lower.includes('জমি') ||
    lower.includes('শস্য') || lower.includes('কৃষি')) return 'agricultural';
  if (lower.includes('homestead') || lower.includes('বসতভিটা') || lower.includes('আবাসিক') ||
    lower.includes('resident')) return 'homestead';
  if (lower.includes('commercial') || lower.includes('বাণিজ্যিক') || lower.includes('দোকান') ||
    lower.includes('market') || lower.includes('office')) return 'commercial';
  if (lower.includes('industrial') || lower.includes('কারখানা') || lower.includes('factory')) return 'industrial';
  if (lower.includes('water') || lower.includes('জল') || lower.includes('pond') ||
    lower.includes('দিঘী') || lower.includes('খাল') || lower.includes('নদী') ||
    lower.includes('river') || lower.includes('lake') || lower.includes('jheel')) return 'water_body';
  if (lower.includes('non-agricultural') || lower.includes('non agri') || lower.includes('অকৃষি')) return 'non-agricultural';
  return 'agricultural';
}

/** Determine deed type display name from raw input. */
function normalizeDeedType(val: string | undefined): string {
  if (!val) return 'sale';
  const lower = val.toLowerCase().trim();
  const map: Record<string, string> = {
    'sale': 'sale_deed', 'sale deed': 'sale_deed', 'বিক্রয়': 'sale_deed', 'baynamah': 'sale_deed',
    'bayna': 'sale_deed', 'ক্রয়': 'sale_deed', 'contract of sale': 'sale_deed',
    'heba': 'heba_deed', 'hiba': 'heba_deed', 'gift': 'heba_deed', 'দানপত্র': 'heba_deed',
    'gift deed': 'heba_deed',
    'mortgage': 'mortgage_deed', 'বন্ধক': 'mortgage_deed', 'গৃহঋণ': 'mortgage_deed',
    'exchange': 'exchange_deed', 'বিনিময়': 'exchange_deed',
    'waqf': 'waqf_deed', 'ওয়াকফ': 'waqf_deed',
    'lease': 'lease_deed', 'পট্টা': 'lease_deed', 'rent': 'lease_deed', 'ভাড়া': 'lease_deed',
    'partition': 'partition_deed', 'বণ্টন': 'partition_deed',
    'settlement': 'settlement_deed', 'সমঝোতা': 'settlement_deed',
    'power of attorney': 'poa', 'পাওয়ার': 'poa', ' attorney': 'poa',
    'agreement': 'agreement', 'চুক্তি': 'agreement',
    'will': 'will', 'উইল': 'will', 'কবলনামা': 'sale_deed', 'kablanama': 'sale_deed',
  };
  for (const [key, mapped] of Object.entries(map)) {
    if (lower === key || lower.includes(key)) return mapped;
  }
  return 'sale_deed';
}


// ═══════════════════════════════════════════════════════════════════════════════
// STAGE 0 — ENTRY GATE
// Classify dispute → determine suit track → jurisdiction → objections
// ═══════════════════════════════════════════════════════════════════════════════

export function runStage0(facts: CaseFacts): Stage0Result {
  // ── 0A. Dispute Track Classification ───────────────────────────────────
  const dt = (facts.disputeType || '').toLowerCase();
  const desc = (facts.description || '').toLowerCase();
  const combined = `${dt} ${desc}`;

  let track: DisputeTrack = 'unknown';
  let subType: string | undefined;
  let primaryLaw: string = '';

  // --- Property dispute keywords ---
  const titleKeywords = ['title suit', 'title', 'declaration of title', 'দাবি মামলা',
    'মালিকানা', 'ownership', 'titlement', 'title dispute', 'স্বত্ব',
    'declaration of title and recovery', 'seeking declaration', 'declaration suit',
    'competing claims', 'title and possession', 'title conflict'];
  const possessionKeywords = ['possession', 'ejectment', 'eviction', 'দখল', 'হাত থেকে',
    'recover possession', 'possess', 'vacant', 'occupy', 'dispossessed',
    'dispossession', 'dispossess'];
  const partitionKeywords = ['partition', 'partition suit', 'ফাঁড়', 'ভাগ', 'co-sharer',
    'co-sharer partition', 'cotenant', 'joint owner', 'joint possession'];
  const cancellationKeywords = ['cancellation', 'cancel deed', 'রদ', 'মুছে ফেলা',
    'void deed', 'voidable', 'forged deed', 'fake deed', 'fabricated'];
  const injunctionKeywords = ['injunction', 'stay order', 'প্রতিবন্ধক', 'নিষেধাজ্ঞা',
    'temporary injunction', 'permanent injunction', 'restraining order'];
  const adverseKeywords = ['adverse possession', 'adverse claim', '১২ বছর',
    '12 years possession', 'hostile possession', 'limitation title',
    'title by adverse', 'title by limitation'];
  const mortgageKeywords = ['mortgage', 'বন্ধক', 'গৃহঋণ', 'home loan', 'mortgagor',
    'mortgagee', 'redemption', 'mortgage redemption', 'foreclosure'];
  const preemptionKeywords = ['pre-emption', 'preemption', 'প্রাকক্রয়', 'kabla',
    'co-sharer sale', 'tenant sale', 'right of pre-emption'];
  const leaseKeywords = ['lease', 'tenancy', 'tenant', 'পট্টা', 'ভাড়া', 'rent',
    'landlord', 'rental', 'eviction', 'lease termination'];

  // --- Money dispute keywords ---
  const moneyKeywords = ['money', 'debt', 'loan', 'borrowed', 'ধার', 'ঋণ', 'টাকা',
    'tk ', 'taka', 'amount due', 'recover money', 'money recovery', 'unpaid',
    'dues', 'outstanding'];
  const contractKeywords = ['contract', 'agreement', 'breach of contract', 'চুক্তি',
    'specific performance', 'enforce contract', 'fulfillment', 'contractual'];
  const damagesKeywords = ['damages', 'compensation', 'tort', 'negligence', 'ক্ষতিপূরণ',
    'harm', 'injury', 'loss', 'suffered loss'];
  const bankKeywords = ['bank', 'artharin', 'artha rin', 'loan default', 'bank loan',
    'nbfi', 'financial institution', 'microcredit', 'default interest', 'principal due'];
  const negotiableKeywords = ['promissory note', 'bill of exchange', 'cheque', 'hundi',
    'pay order', 'draft', 'negotiable instrument', 'প্রতিশ্রুতিপত্র',
    'বিল', 'চেক', 'ড্রাফট'];

  // --- Double-sale / bona fide purchaser detection ---
  const doubleSaleKeywords = ['double sale', 'second sale', 'duplicate sale', 'দ্বৈত বিক্রয়',
    'another sale deed', 'subsequent sale', 'subsequent deed', 'two sale deeds',
    'two registered deed', 'bona fide purchaser', 'bona fide purchaser for value',
    'bona fide purchaser without notice', 'prior sale', 'later sale',
    'first sale deed', 'second sale deed', 'competing claims over title',
    'conflicting sale', 'conflicting deed'];

  // ══════════════════════════════════════════════════════════════════════════
  // PRIORITY-BASED CLASSIFICATION (most specific FIRST)
  //
  // Priority Order (CRITICAL — prevents misclassification):
  //   1. Bank/Artha Rin — unique procedural track
  //   2. Negotiable Instrument — unique procedural track (O.37)
  //   3. Pre-emption — SAT Act S.96 (specific statutory right)
  //   4. TITLE + DOUBLE SALE — must be before lease/injunction because
  //      descriptions mention "possession" and "injunction" as secondary reliefs
  //   5. CANCELLATION — must be before injunction (plaintiff seeks both)
  //   6. ADVERSE POSSESSION — must be before general possession (specific defence)
  //   7. Partition — checked after adverse possession (combined suits exist)
  //   8. Lease / Mortgage / Injunction — general tracks
  //   9. Possession — most generic, checked last among property
  //  10. Money/Damages/Contract — money tracks
  // ══════════════════════════════════════════════════════════════════════════
  if (hasKeyword(combined, ['artha rin', 'artharin ain', 'artharin']) || facts.isBankCreditor) {
    track = 'artha_rin';
    primaryLaw = 'Artha Rin Ain 2003';
  } else if (hasKeyword(combined, negotiableKeywords) || facts.isNegotiableInstrument) {
    track = 'money_negotiable';
    primaryLaw = 'CPC Order 37 + Negotiable Instruments Act 1881';
  } else if (hasKeyword(combined, preemptionKeywords) || facts.preEmptionClaim) {
    track = 'property_preemption';
    primaryLaw = 'SAT Act S.96 + CPC S.54';
    subType = 'co_sharer_or_tenant';
  } else if (hasKeyword(dt, cancellationKeywords) || facts.fraudulentIntent || facts.benamiFlag) {
    // Cancellation/Fraud: Only check disputeType (not full description) because
    // title suits often mention "cancellation of second deed" as secondary relief.
    // When the ENTIRE dispute is about forged/fraudulent deeds, classify as cancellation.
    track = 'property_cancellation';
    primaryLaw = 'SRA S.39 + Registration Act S.17';
  } else if (hasKeyword(combined, titleKeywords) || hasKeyword(combined, doubleSaleKeywords) || facts.multipleSales) {
    // Title / Declaration of Title — including double-sale cases where
    // competing registered deeds create title conflict (TPA S.48)
    // MUST be checked BEFORE lease/injunction because title suits
    // often describe secondary relief (possession, injunction) in the facts.
    track = 'property_title';
    primaryLaw = 'SRA S.42 + TPA S.48';
    if (hasKeyword(combined, doubleSaleKeywords) || facts.multipleSales) {
      subType = 'double_sale_title_conflict';
    }
  } else if (hasKeyword(combined, cancellationKeywords) || (facts.fraudulentIntent || facts.benamiFlag)) {
    // Cancellation MUST be before injunction — plaintiff often seeks both.
    // If disputeType contains "cancellation", "forged", "fake", "fabricated"
    // the primary relief is cancellation, not injunction.
    track = 'property_cancellation';
    primaryLaw = 'SRA S.39 + Registration Act S.17';
  } else if (hasKeyword(combined, adverseKeywords) || facts.adversePossessionClaim) {
    // Adverse possession MUST be before general possession.
    track = 'property_adverse';
    primaryLaw = 'Limitation Act Art.142 + SRA S.8';
    subType = facts.adversePossessionClaim ? `adverse_${facts.adversePossessionYears}_years` : undefined;
  } else if (hasKeyword(combined, partitionKeywords) || facts.partitionClaim) {
    track = 'property_partition';
    primaryLaw = 'CPC S.54 read with S.9';
    subType = 'co_sharer_partition';
  } else if (hasKeyword(combined, leaseKeywords)) {
    track = 'property_lease';
    primaryLaw = 'TPA S.105-117 + SAT Act';
  } else if (hasKeyword(combined, mortgageKeywords)) {
    track = 'property_mortgage';
    primaryLaw = 'TPA S.58-104';
    subType = 'mortgage_enforcement';
  } else if (hasKeyword(combined, injunctionKeywords)) {
    track = 'property_injunction';
    primaryLaw = 'CPC Order 39 Rules 1 & 2 + SRA S.52-57';
  } else if (hasKeyword(combined, possessionKeywords)) {
    track = 'property_possession';
    primaryLaw = 'SRA S.8/S.9';
  } else if (hasKeyword(combined, damagesKeywords)) {
    track = 'money_damages';
    primaryLaw = 'Law of Torts + CPC';
  } else if (hasKeyword(combined, contractKeywords)) {
    track = 'money_contract';
    primaryLaw = 'SRA S.10/12 + Contract Act 1872';
  } else if (hasKeyword(combined, moneyKeywords)) {
    track = 'money_contract';
    primaryLaw = 'CPC + Contract Act 1872';
  } else if (hasKeyword(combined, bankKeywords)) {
    track = 'artha_rin';
    primaryLaw = 'Artha Rin Ain 2003';
  } else {
    track = 'unknown';
    primaryLaw = 'CPC';
  }

  // ── 0B. Suit Track ─────────────────────────────────────────────────────
  let suitTrack: SuitTrack = 'regular';
  if (track === 'artha_rin') {
    suitTrack = 'artha_rin';
  } else if (track === 'money_negotiable') {
    suitTrack = 'order37_summary';
  } else if (track === 'property_lease' && facts.khasLand) {
    suitTrack = 'revenue';
  } else if (track === 'family') {
    suitTrack = 'family';
  }

  // ── 0C. Territorial Jurisdiction ───────────────────────────────────────
  const propertyTracks: DisputeTrack[] = [
    'property_title', 'property_possession', 'property_partition',
    'property_cancellation', 'property_injunction', 'property_adverse',
    'property_mortgage', 'property_preemption', 'property_lease',
  ];
  const isPropertyDispute = propertyTracks.includes(track);

  let territorialBasis: string;
  let territorialSection: string;
  const courtDistrict = facts.district || 'Unknown';
  const courtUpazila = facts.upazila || '';
  const courtMouza = facts.mouza || '';

  if (isPropertyDispute) {
    // CPC S.16 — suits for immovable property lie where property is situated
    territorialBasis = `Property situated at ${[courtMouza, courtUpazila, courtDistrict].filter(Boolean).join(', ')}`;
    territorialSection = 'CPC S.16';
  } else {
    // CPC S.20 — money suits: defendant residence OR where cause of action arose
    territorialBasis = `Defendant resides or cause of action arose in ${courtDistrict}${courtUpazila ? ` (${courtUpazila})` : ''}`;
    territorialSection = 'CPC S.20';
  }

  // ── 0D. Pecuniary Jurisdiction ─────────────────────────────────────────
  const amount = parseAmountBangla(facts.amountClaimed || facts.consideration || '0');

  // Civil Courts (Amendment) Act 2026 limits
  let courtLevel: string;
  let limit: string;
  let pecuniarySection: string = 'Civil Courts (Amendment) Act 2026';

  if (amount <= 0) {
    courtLevel = 'Joint District Judge'; // default when amount not specified
    limit = 'N/A';
  } else if (amount <= 15_00_000) {
    courtLevel = 'Assistant Judge Court';
    limit = 'Up to ৳15,00,000 (15 Lakh)';
  } else if (amount <= 25_00_000) {
    courtLevel = 'Senior Assistant Judge Court';
    limit = '৳15,00,001 – ৳25,00,000 (15L–25L)';
  } else if (amount <= 5_00_00_000) {
    courtLevel = 'Joint District Judge Court';
    limit = '৳25,00,001 – ৳5,00,00,000 (25L–5 Crore)';
  } else {
    courtLevel = 'District Judge Court';
    limit = 'Above ৳5,00,00,000 (5 Crore)';
  }

  // Override for Artha Rin — no pecuniary cap
  if (suitTrack === 'artha_rin') {
    courtLevel = 'Artha Rin Adalat';
    limit = 'No pecuniary ceiling (Artha Rin Ain S.3)';
    pecuniarySection = 'Artha Rin Ain 2003 S.3';
  }

  // Override for revenue matters
  if (suitTrack === 'revenue') {
    courtLevel = 'Assistant Settlement Officer / AC (Land)';
    limit = 'Revenue matter — no pecuniary limit';
    pecuniarySection = 'SAT Act 1950';
  }

  // ── 0E. Assigned Court ─────────────────────────────────────────────────
  let assignedCourt: string;
  if (suitTrack === 'artha_rin') {
    assignedCourt = `Artha Rin Adalat, ${courtDistrict}`;
  } else if (suitTrack === 'revenue') {
    assignedCourt = `Assistant Settlement Officer, ${courtUpazila || courtDistrict}`;
  } else if (suitTrack === 'family') {
    assignedCourt = `Family Court, ${courtDistrict}`;
  } else {
    assignedCourt = `${courtLevel}, ${courtUpazila || courtDistrict}`;
  }

  // ── 0F. Jurisdiction Objections ────────────────────────────────────────
  const objections: Array<{ type: string; description: string; section: string }> = [];

  // Under/over pecuniary
  if (amount > 0 && amount <= 15_00_000 && courtLevel !== 'Assistant Judge Court' && courtLevel !== 'Artha Rin Adalat') {
    objections.push({
      type: 'pecuniary',
      description: `Amount ৳${amount.toLocaleString('en-IN')} is within Assistant Judge limit but filed in higher court`,
      section: 'CPC S.15-20',
    });
  }

  // S.16 objection — property not within jurisdiction
  if (isPropertyDispute && !facts.district) {
    objections.push({
      type: 'territorial',
      description: 'Property district not specified — territorial jurisdiction unclear',
      section: 'CPC S.16',
    });
  }

  // Family court objection
  if (track !== 'family' && hasKeyword(combined, ['divorce', 'dower', 'mehr', 'mahr', 'maintenance', 'alimony', 'child custody', 'wife'])) {
    objections.push({
      type: 'forum',
      description: 'Matter involves family law — may fall under Family Court jurisdiction (FCA 1985 S.5)',
      section: 'Family Courts Ordinance 1985 S.5',
    });
  }

  // Revenue matter objection
  if (facts.khasLand && suitTrack === 'regular') {
    objections.push({
      type: 'forum',
      description: 'Khas land dispute — may require revenue court / AC (Land) jurisdiction',
      section: 'SAT Act 1950 S.82',
    });
  }

  // Government defendant — S.80 notice requirement
  if (facts.isGovernmentDefendant && !facts.s80NoticeGiven) {
    objections.push({
      type: 'procedural',
      description: 'Government is defendant but S.80 CPC notice not given — suit may be barred',
      section: 'CPC S.80(2)',
    });
  }

  return {
    track,
    suitTrack,
    subType,
    primaryLaw,
    territorialJurisdiction: {
      basis: territorialBasis,
      court: assignedCourt,
      district: courtDistrict,
      section: territorialSection,
    },
    pecuniaryJurisdiction: {
      courtLevel,
      amountClaimed: amount,
      limit,
      section: pecuniarySection,
    },
    assignedCourt,
    objections,
  };
}


// ═══════════════════════════════════════════════════════════════════════════════
// STAGE 1 — FACT EXTRACTION
// Parse parties, property, transaction chain, documents, special triggers
// ═══════════════════════════════════════════════════════════════════════════════

export function runStage1(facts: CaseFacts): Stage1Result {
  // ── 1A. Party Parsing ──────────────────────────────────────────────────
  const parties: PartyInfo[] = [];

  // Parse plaintiff(s) — may be comma-separated
  const plaintiffNames = (facts.plaintiff || 'Unknown Plaintiff')
    .split(/[,&;\/]/)
    .map((s) => s.trim())
    .filter(Boolean);

  plaintiffNames.forEach((name, idx) => {
    const ptype = detectPartyType(name);
    const minor = isMinor(name);
    parties.push({
      name,
      type: ptype,
      role: idx === 0 ? 'plaintiff' : 'plaintiff',
      isMinor: minor,
      isLunatic: false,
      guardianRequired: minor,
    });
  });

  // Parse defendant(s) — may be comma-separated
  const defendantNames = (facts.defendant || 'Unknown Defendant')
    .split(/[,&;\/]/)
    .map((s) => s.trim())
    .filter(Boolean);

  defendantNames.forEach((name, idx) => {
    const dtype = detectPartyType(name);
    const minor = isMinor(name);
    parties.push({
      name,
      type: dtype,
      role: idx === 0 ? 'defendant' : 'defendant',
      isMinor: minor,
      isLunatic: false,
      guardianRequired: minor,
    });
  });

  // Add POA holder if specified
  if (facts.poaHolder) {
    parties.push({
      name: facts.poaHolder,
      type: detectPartyType(facts.poaHolder),
      role: 'necessary',
      isMinor: false,
      isLunatic: false,
      guardianRequired: false,
    });
  }

  // ── 1B. Property Details ───────────────────────────────────────────────
  let property: PropertyInfo | undefined;

  // Only build property if any property field exists
  if (facts.mouza || facts.district || facts.dag || facts.khatian || facts.classification) {
    // Parse Dag — may have prefix like "CS Dag No." or just a number
    const dagStr = facts.dag || '';
    const dagNumbers: PropertyInfo['dagNumbers'] = {};

    // Try to identify record type from dag format: e.g., "CS-123" or "SA Dag 456"
    const dagMatch = dagStr.match(/(?:cs|sa|rs|bs|c\.?s\.?|s\.?a\.?|r\.?s\.?|b\.?s\.?)?\s*[-:.]?\s*(\d+)/i);
    if (dagMatch) {
      const recordType = (dagStr.match(/(cs|sa|rs|bs)/i)?.[1] || 'bs').toLowerCase();
      dagNumbers[recordType as keyof PropertyInfo['dagNumbers']] = dagMatch[1];
      // Default to BS if only one dag given and no record type prefix
      if (!dagStr.match(/(cs|sa|rs|bs)/i)) {
        dagNumbers.bs = dagMatch[1];
      }
    }

    // Parse Khatian
    const khatianStr = facts.khatian || '';
    const khatianNumbers: PropertyInfo['khatianNumbers'] = {};
    const khatianMatch = khatianStr.match(/(?:cs|sa|rs|bs|c\.?s\.?|s\.?a\.?|r\.?s\.?|b\.?s\.?)?\s*[-:.]?\s*(\d+)/i);
    if (khatianMatch) {
      const recordType = (khatianStr.match(/(cs|sa|rs|bs)/i)?.[1] || 'bs').toLowerCase();
      khatianNumbers[recordType as keyof PropertyInfo['khatianNumbers']] = khatianMatch[1];
      if (!khatianStr.match(/(cs|sa|rs|bs)/i)) {
        khatianNumbers.bs = khatianMatch[1];
      }
    }

    property = {
      mouza: facts.mouza || '',
      jlNo: undefined, // Not in CaseFacts
      dagNumbers,
      khatianNumbers,
      district: facts.district || '',
      upazila: facts.upazila || '',
      classification: classifyProperty(facts.classification),
      area: facts.landArea || undefined,
      boundaries: facts.boundaries || undefined,
    };
  }

  // ── 1C. Transaction Chain ──────────────────────────────────────────────
  const transactionChain: DeedInfo[] = [];

  if (facts.deedType || facts.registrationDate || facts.consideration) {
    const deedTypeName = normalizeDeedType(facts.deedType);
    const isRegistered = facts.registered !== false &&
      (facts.registrationDate !== undefined || facts.s17Compliant !== false);

    transactionChain.push({
      type: deedTypeName,
      date: facts.registrationDate || facts.causeOfActionDate || '',
      registered: isRegistered,
      registrationDate: facts.registrationDate || undefined,
      stampDutyPaid: facts.stampDutyOk !== false,
      stampDutyAmount: undefined,
      consideration: parseAmountBangla(facts.consideration) || undefined,
      parties: [facts.plaintiff || '', facts.defendant || ''].filter(Boolean),
      documentId: undefined,
    });
  }

  // Detect chain gaps
  const chainGaps: string[] = [];
  if (transactionChain.length > 0) {
    if (!facts.registrationDate && facts.deedType) {
      chainGaps.push('Deed type specified but registration date missing — cannot verify priority');
    }
    if (facts.multipleSales) {
      chainGaps.push('Multiple sales detected — chain integrity compromised; S.48 TPA applies');
    }
    if (facts.transferDuringLis) {
      chainGaps.push('Transfer during lis pendens — S.52 TPA may render transfer void');
    }
  }

  // ── 1D. Document Stack ─────────────────────────────────────────────────
  const documentStack: Stage1Result['documentStack'] = [];

  // Add primary deed if exists
  if (transactionChain.length > 0) {
    const deed = transactionChain[0];
    documentStack.push({
      type: deed.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      date: deed.registrationDate || deed.date,
      registered: deed.registered,
      stampStatus: deed.stampDutyPaid ? 'adequate' : 'deficient',
      description: `${deed.type.replace(/_/g, ' ')} ${deed.consideration ? `for ৳${deed.consideration.toLocaleString('en-IN')}` : ''}`,
    });
  }

  // Add mutation document if status available
  if (facts.mutationStatus) {
    documentStack.push({
      type: 'Mutation Record',
      date: undefined,
      registered: false,
      stampStatus: 'n/a',
      description: `Mutation status: ${facts.mutationStatus} (non-conclusive — not a title document)`,
    });
  }

  // Add S.80 notice if government defendant
  if (facts.isGovernmentDefendant && facts.s80NoticeGiven) {
    documentStack.push({
      type: 'S.80 CPC Notice',
      date: undefined,
      registered: false,
      stampStatus: 'n/a',
      description: 'Two-month statutory notice served on government (CPC S.80)',
    });
  }

  // Add ceiling document if applicable
  if (facts.ceilingExceeded) {
    documentStack.push({
      type: 'Ceiling Certificate',
      date: undefined,
      registered: false,
      stampStatus: 'n/a',
      description: 'Land ceiling exceeded — SAT Act S.90 ceiling limit applies',
    });
  }

  // ── 1E. Missing Parties / Guardian ─────────────────────────────────────
  const missingParties: string[] = [];
  let guardianRequired = false;

  // Check for minors
  for (const p of parties) {
    if (p.isMinor || isMinor(p.name)) {
      p.isMinor = true;
      p.guardianRequired = true;
      guardianRequired = true;
      missingParties.push(`Guardian for minor: ${p.name} (CPC O.32 R.1)`);
    }
  }

  // Check for co-sharers if partition claim
  if (facts.partitionClaim && facts.coSharers) {
    const coSharers = facts.coSharers.split(/[,&;]/).map((s) => s.trim()).filter(Boolean);
    for (const cs of coSharers) {
      const alreadyListed = parties.some(
        (p) => p.name.toLowerCase().includes(cs.toLowerCase()) || cs.toLowerCase().includes(p.name.toLowerCase())
      );
      if (!alreadyListed) {
        missingParties.push(`Co-sharer not impleaded: ${cs} — may be a necessary party (CPC S.9)`);
      }
    }
  }

  // If POA holder exists but not a party
  if (facts.poaHolder && !parties.some((p) => p.name === facts.poaHolder)) {
    missingParties.push(`Power of Attorney holder not made a party: ${facts.poaHolder}`);
  }

  // ── 1F. Special Triggers ───────────────────────────────────────────────
  const isBankCreditor = facts.isBankCreditor === true ||
    detectPartyType(facts.plaintiff || '') === 'bank' ||
    detectPartyType(facts.defendant || '') === 'bank' ||
    hasKeyword(facts.disputeType || '', ['bank', 'artharin', 'artha rin', 'nbfi', 'financial institution']);

  const isNegotiableInstrument = facts.isNegotiableInstrument === true ||
    hasKeyword(
      `${facts.disputeType || ''} ${facts.description || ''} ${facts.instrumentType || ''}`,
      ['promissory note', 'bill of exchange', 'cheque', 'hundi', 'pay order', 'draft', 'negotiable']
    );

  const isArthaRinEligible = isBankCreditor || isNegotiableInstrument
    ? false
    : detectPartyType(facts.plaintiff || '') === 'bank' ||
      hasKeyword(facts.disputeType || '', ['artharin ain', 'artha rin', 'loan recovery suit']);

  // ── 1G. Possession Info ────────────────────────────────────────────────
  const possessionNature = facts.possessionNature || 'owner';
  let nature: PossessionInfo['nature'] = 'owner';
  if (hasKeyword(possessionNature, ['adverse', 'hostile'])) nature = 'adverse';
  else if (hasKeyword(possessionNature, ['trespasser', 'encroacher', 'unauthorized'])) nature = 'trespasser';
  else if (hasKeyword(possessionNature, ['tenant', 'lessee', 'patta', 'rent'])) nature = 'tenant';
  else if (hasKeyword(possessionNature, ['licensee', 'license'])) nature = 'licensee';
  else if (hasKeyword(possessionNature, ['mortgagee', 'mortgage possession'])) nature = 'mortgagee';

  const possession: PossessionInfo = {
    currentPossessor: facts.currentPossessor || facts.defendant || 'Unknown',
    startDate: facts.possessionStartDate || undefined,
    nature,
    physicalActs: facts.physicalActs || undefined,
    dispossessionDate: facts.dispossessionDate || undefined,
    dispossessionEvent: facts.dispossessionDate ? `Dispossession on ${facts.dispossessionDate}` : undefined,
  };

  return {
    parties,
    property,
    transactionChain,
    chainGaps: chainGaps.length > 0 ? chainGaps : undefined,
    possession,
    documentStack,
    missingParties,
    guardianRequired,
    isBankCreditor,
    isNegotiableInstrument,
    isArthaRinEligible: isArthaRinEligible || isBankCreditor,
  };
}


// ═══════════════════════════════════════════════════════════════════════════════
// STAGE 2 — LEGAL CLASSIFICATION
// Classify into codes 2A-2M, determine routing to specific engine stages
// ═══════════════════════════════════════════════════════════════════════════════

export function runStage2(facts: CaseFacts, stage0: Stage0Result): Stage2Result {
  const track = stage0.track;

  // ── 2A-2I: Property Dispute Sub-Classification ─────────────────────────
  const propertyClassifications: Record<string, {
    code: string;
    name: string;
    description: string;
    targetStage: number;
  }> = {
    property_title: {
      code: '2A',
      name: 'Declaration of Title',
      description: 'Suit for declaration of title to immovable property (SRA S.42)',
      targetStage: 7, // SRA Engine
    },
    property_possession: {
      code: '2B',
      name: 'Recovery of Possession',
      description: 'Suit for recovery of possession (SRA S.8/S.9)',
      targetStage: 7,
    },
    property_partition: {
      code: '2C',
      name: 'Partition',
      description: 'Suit for partition of jointly held property (CPC S.54)',
      targetStage: 10,
    },
    property_cancellation: {
      code: '2D',
      name: 'Cancellation of Instrument',
      description: 'Suit for cancellation of deed/instrument (SRA S.39)',
      targetStage: 7,
    },
    property_injunction: {
      code: '2E',
      name: 'Injunction',
      description: 'Temporary/Permanent injunction over immovable property (CPC O.39, SRA S.52-57)',
      targetStage: 7,
    },
    property_adverse: {
      code: '2F',
      name: 'Adverse Possession',
      description: 'Claim or defence based on adverse possession (Art.142 Limitation Act)',
      targetStage: 11,
    },
    property_mortgage: {
      code: '2G',
      name: 'Mortgage Enforcement/Redemption',
      description: 'Mortgage decree, foreclosure, or redemption (TPA S.58-104)',
      targetStage: 7,
    },
    property_preemption: {
      code: '2H',
      name: 'Pre-emption',
      description: 'Pre-emption suit by co-sharer or tenant (SAT Act S.96)',
      targetStage: 12,
    },
    property_lease: {
      code: '2I',
      name: 'Lease / Tenancy',
      description: 'Lease enforcement, termination, or eviction (TPA S.105-117)',
      targetStage: 7,
    },
  };

  // ── 2J-2M: Money Dispute Sub-Classification ────────────────────────────
  const moneyClassifications: Record<string, {
    code: string;
    name: string;
    description: string;
    targetStage: number;
  }> = {
    money_contract: {
      code: '2J',
      name: 'Money Recovery (Contract)',
      description: 'Recovery of money on contract/breach of contract (Art.113 Limitation Act)',
      targetStage: 7,
    },
    money_damages: {
      code: '2K',
      name: 'Damages / Compensation',
      description: 'Damages for tort, negligence, or breach (CPC)',
      targetStage: 7,
    },
    money_refund: {
      code: '2L',
      name: 'Unjust Enrichment / Refund',
      description: 'Recovery of money paid under mistake or unjust enrichment',
      targetStage: 7,
    },
    money_negotiable: {
      code: '2M',
      name: 'Negotiable Instrument',
      description: 'Summary suit on negotiable instrument (CPC O.37)',
      targetStage: 6,
    },
  };

  // Special tracks
  const specialClassifications: Record<string, {
    code: string;
    name: string;
    description: string;
    targetStage: number;
  }> = {
    artha_rin: {
      code: '2N',
      name: 'Artha Rin (Bank/FI)',
      description: 'Money suit by bank or financial institution under Artha Rin Ain 2003',
      targetStage: 5,
    },
    family: {
      code: '2O',
      name: 'Family Court Matter',
      description: 'Outside FATIHA engine — requires Family Court (FCA 1985)',
      targetStage: 0,
    },
    revenue: {
      code: '2P',
      name: 'Revenue / SAT Act',
      description: 'Revenue matter under SAT Act 1950 — may require AC (Land)',
      targetStage: 0,
    },
    unknown: {
      code: '2?',
      name: 'Unclassified',
      description: 'Could not determine dispute classification from provided facts',
      targetStage: 0,
    },
  };

  const allClassifications = {
    ...propertyClassifications,
    ...moneyClassifications,
    ...specialClassifications,
  };

  const classification = allClassifications[track] || allClassifications['unknown'];

  // ── Property Sub-Type ──────────────────────────────────────────────────
  let propertySubType: string | undefined;
  if (['2A', '2B', '2D', '2E'].includes(classification.code)) {
    // Distinguish between title-based and summary possession for 2B
    if (classification.code === '2B') {
      if (facts.registered === true || facts.registrationDate) {
        propertySubType = 'title_based_s8'; // SRA S.8 — must examine title
      } else {
        propertySubType = 'summary_s9'; // SRA S.9 — on plaintiff's own title, dispossession within 6 months
      }
    }
  }

  // ── Money Sub-Type ─────────────────────────────────────────────────────
  let moneySubType: string | undefined;
  if (classification.code === '2J') {
    moneySubType = hasKeyword(facts.disputeType || '', ['breach', 'contract'])
      ? 'breach_of_contract'
      : 'simple_money_recovery';
  } else if (classification.code === '2K') {
    moneySubType = 'tort_damages';
  }

  // ── Engine Flags ───────────────────────────────────────────────────────
  const requiresPartitionEngine = track === 'property_partition';
  const requiresAdversePossessionEngine = track === 'property_adverse';
  const requiresPreEmptionEngine = track === 'property_preemption';
  const requiresOrder37 = track === 'money_negotiable';
  const requiresArthaRin = track === 'artha_rin';

  return {
    classification: {
      code: classification.code,
      name: classification.name,
      description: classification.description,
      targetStage: classification.targetStage,
    },
    propertySubType,
    moneySubType,
    routedStage: classification.targetStage,
    requiresPreEmptionEngine,
    requiresAdversePossessionEngine,
    requiresPartitionEngine,
    requiresOrder37,
    requiresArthaRin,
  };
}


// ═══════════════════════════════════════════════════════════════════════════════
// STAGE 2.5 — TPA + SAT ACT ENGINE
// Sale validity, double sale, ostensible owner, feeding grant, lis pendens,
// fraudulent transfer, mortgage analysis, lease analysis, SAT Act analysis
// ═══════════════════════════════════════════════════════════════════════════════

export function runStage25(
  facts: CaseFacts,
  stage1: Stage1Result,
  stage2: Stage2Result
): Stage25Result {
  const flags: Array<{ id: string; severity: Severity; message: string; legalRef: string }> = [];

  // Defensive: if stage2 is undefined (upstream failure), create safe fallback
  const s2 = stage2 ?? {
    classification: { code: '2?', name: 'Unclassified', description: '', targetStage: 0 },
    routedStage: 0,
    requiresArthaRin: false,
    requiresOrder37: false,
    requiresPartitionEngine: false,
    requiresAdversePossessionEngine: false,
    requiresPreEmptionEngine: false,
  };

  // ── 2.5A. Sale Validity Check (TPA S.54) ───────────────────────────────
  const deed = stage1.transactionChain.length > 0 ? stage1.transactionChain[0] : null;
  const isRegistered = deed?.registered !== false && (facts.registered !== false);
  const consideration = parseAmountBangla(facts.consideration || deed?.consideration || 0);
  const s17Compliant = facts.s17Compliant !== false;

  const saleValidityIssues: string[] = [];
  if (!isRegistered && facts.deedType) {
    saleValidityIssues.push('Transfer deed not registered — Registration Act S.17 requires compulsory registration for immovable property');
  }
  if (consideration > 0 && consideration <= 100) {
    saleValidityIssues.push(`Consideration ৳${consideration} appears nominal — TPA S.54 requires consideration > ৳100 for valid sale`);
  }
  if (!s17Compliant) {
    saleValidityIssues.push('S.17 Registration Act compliance not established — document may not confer valid title');
  }
  if (!facts.registrationDate && facts.deedType) {
    saleValidityIssues.push('No registration date provided — cannot confirm registration');
  }

  const saleValidity: Stage25Result['saleValidity'] = {
    registered: isRegistered,
    considerationOver100: consideration > 100,
    validUnderS54: isRegistered && consideration > 100,
    validUnderS17: s17Compliant,
    issues: saleValidityIssues,
  };

  if (!saleValidity.validUnderS54 && (facts.deedType || deed)) {
    flags.push({
      id: 'TPA_S54_INVALID',
      severity: 'red',
      message: 'Sale may not be valid under TPA S.54 — check registration and consideration',
      legalRef: 'TPA S.54',
    });
  }

  // ── 2.5B. Double Sale Analysis (TPA S.48) ──────────────────────────────
  let doubleSale: Stage25Result['doubleSale'] = undefined;
  if (facts.multipleSales || hasKeyword(facts.description || '', ['double sale', 'second sale', 'duplicate sale', 'দ্বৈত বিক্রয়'])) {
    // Under S.48, the person who registered first OR who had no notice of prior transfer prevails
    const firstDeed = {
      registered: isRegistered,
      date: facts.registrationDate || deed?.date || '',
    };
    const secondDeed = {
      registered: false, // assume second not registered unless stated
      date: facts.causeOfActionDate || '',
    };
    const noticeAtSecondTransfer = !facts.registrationDate || true; // assume no notice unless proven
    const prevailingBuyer = firstDeed.registered && !secondDeed.registered
      ? (facts.plaintiff || 'First purchaser')
      : 'Unresolved — requires evidence of registration date and notice';

    doubleSale = {
      isDoubleSale: true,
      firstDeed,
      secondDeed,
      noticeAtSecondTransfer,
      prevailingBuyer,
      section48Analysis: 'TPA S.48: Where immovable property is sold to one person and then to another, ' +
        'the prior transferee prevails if: (a) their deed was registered first, OR ' +
        '(b) their deed, though unregistered, was completed before the second transfer AND ' +
        'the second transferee had notice of the prior transfer.',
    };

    flags.push({
      id: 'TPA_S48_DOUBLE_SALE',
      severity: 'red',
      message: `Double sale detected — ${prevailingBuyer} may have priority under TPA S.48`,
      legalRef: 'TPA S.48',
    });
  }

  // ── 2.5C. Ostensible Owner (TPA S.41) ──────────────────────────────────
  let ostensibleOwner: Stage25Result['ostensibleOwner'] = undefined;
  if (facts.ostensibleOwner || hasKeyword(facts.description || '', ['ostensible', 'apparent owner', 'benami', 'بنعامی'])) {
    ostensibleOwner = {
      conditions: {
        consentOfRealOwner: facts.ostensibleOwner !== false, // assume consent unless denied
        forConsideration: consideration > 0,
        goodFaithDueCare: true, // assume BFP unless proven otherwise
      },
      allMet: facts.ostensibleOwner !== false && consideration > 0,
      protected: facts.ostensibleOwner !== false && consideration > 0,
    };

    flags.push({
      id: 'TPA_S41_OSTENSIBLE',
      severity: 'yellow',
      message: 'Ostensible owner doctrine invoked — transferee may be protected if S.41 conditions met',
      legalRef: 'TPA S.41',
    });
  }

  // ── 2.5D. Feeding the Grant (TPA S.43) ─────────────────────────────────
  let feedingGrant: Stage25Result['feedingGrant'] = undefined;
  if (hasKeyword(facts.description || '', ['subsequent acquisition', 'subsequent title', 'later acquired', 'no title at transfer'])) {
    feedingGrant = {
      transferorHadNoTitle: true,
      subsequentlyAcquired: true, // assume this is being invoked because title was later acquired
      titleFeeds: true, // S.43: transferor's subsequent title feeds the earlier conveyance
      interveningBFP: false, // check if there's a bona fide purchaser in between
    };

    flags.push({
      id: 'TPA_S43_FEEDING',
      severity: 'info',
      message: 'Feeding the grant doctrine (S.43) — transferor\'s subsequent title passes to earlier transferee unless barred by intervening BFP',
      legalRef: 'TPA S.43',
    });
  }

  // ── 2.5E. Lis Pendens (TPA S.52) ───────────────────────────────────────
  let lisPendens: Stage25Result['lisPendens'] = undefined;
  if (facts.transferDuringLis || hasKeyword(facts.description || '', ['lis pendens', 'during pendency', 'pending suit', 'transfer during suit'])) {
    lisPendens = {
      pendingSuitExists: true,
      transferDuringPendency: true,
      transfereeBound: true, // S.52: transferee is bound by the decree
    };

    flags.push({
      id: 'TPA_S52_LIS_PENDENS',
      severity: 'red',
      message: 'Transfer during lis pendens — transferee is bound by any subsequent decree (TPA S.52)',
      legalRef: 'TPA S.52',
    });
  }

  // ── 2.5F. Fraudulent Transfer (TPA S.53) ───────────────────────────────
  let fraudulentTransfer: Stage25Result['fraudulentTransfer'] = undefined;
  if (facts.fraudulentIntent || facts.benamiFlag ||
    hasKeyword(facts.description || '', ['fraudulent', 'defraud creditor', 'benami', 'bogus', 'fake transfer', 'conceal'])) {
    fraudulentTransfer = {
      intentToDefeatCreditors: facts.fraudulentIntent === true,
      transfereeKnowledge: facts.benamiFlag === true,
      inadequateConsideration: consideration > 0 && consideration < parseAmountBangla(facts.amountClaimed) * 0.5,
      voidable: facts.fraudulentIntent === true || facts.benamiFlag === true,
    };

    if (fraudulentTransfer.voidable) {
      flags.push({
        id: 'TPA_S53_FRAUDULENT',
        severity: 'critical',
        message: 'Fraudulent transfer detected — transfer may be voidable at instance of creditor (TPA S.53)',
        legalRef: 'TPA S.53',
      });
    }
  }

  // ── 2.5G. Mortgage Analysis (TPA S.58-104) ─────────────────────────────
  let mortgage: Stage25Result['mortgage'] = undefined;
  if (s2.requiresArthaRin === false &&
    (s2.classification.code === '2G' ||
      hasKeyword(facts.deedType || facts.disputeType || '', ['mortgage', 'বন্ধক', 'গৃহঋণ']))) {
    const redemptionAvailable = true; // mortgagor always has right to redeem on payment
    const clogOnEquity = hasKeyword(facts.description || '', ['clog', 'perpetual', 'irredeemable']);

    mortgage = {
      type: hasKeyword(facts.deedType || '', ['conditional sale', 'চিরকালীন', 'perpetual'])
        ? 'conditional_sale'
        : 'simple',
      remedies: [
        'Suit for foreclosure (TPA S.67)',
        'Suit for sale (TPA S.69)',
        'Suit for possession in lieu of arrears (TPA S.68)',
        'Redemption by mortgagor (TPA S.60)',
      ],
      mortgagorRights: [
        'Right to redeem on payment of principal + interest + costs (S.60)',
        'Right to lease (S.65A)',
        'Right to transfer mortgaged property (S.59A)',
      ],
      redemptionAvailable: !clogOnEquity,
      clogOnEquity,
    };

    if (clogOnEquity) {
      flags.push({
        id: 'TPA_CLOG_ON_EQUITY',
        severity: 'red',
        message: 'Clog on equity of redemption detected — mortgage terms may be struck down',
        legalRef: 'TPA S.60 (equity of redemption)',
      });
    }
  }

  // ── 2.5H. Lease Analysis (TPA S.105-117) ───────────────────────────────
  let lease: Stage25Result['lease'] = undefined;
  if (s2.classification.code === '2I' ||
    hasKeyword(facts.deedType || facts.disputeType || '', ['lease', 'tenancy', 'tenant', 'পট্টা', 'ভাড়া', 'rent'])) {

    const terminationGrounds: string[] = [];
    const desc = (facts.description || '').toLowerCase();

    if (desc.includes('non-payment') || desc.includes('rent arrears') || desc.includes('unpaid rent')) {
      terminationGrounds.push('Non-payment of rent (TPA S.111(g))');
    }
    if (desc.includes('default') || desc.includes('breach of condition')) {
      terminationGrounds.push('Breach of lease condition (TPA S.111(a)-(f))');
    }
    if (desc.includes('expired') || desc.includes('term ended') || desc.includes('overstayed')) {
      terminationGrounds.push('Lease term expired, tenant holding over (TPA S.116)');
    }
    if (desc.includes('unauthorized') || desc.includes('sublet') || desc.includes('transfer')) {
      terminationGrounds.push('Unauthorized subletting/transfer (TPA S.108)');
    }
    if (terminationGrounds.length === 0) {
      terminationGrounds.push('Standard grounds available per TPA S.111');
    }

    lease = {
      terminationGrounds,
      noticePeriod: facts.khasLand ? 'Per SAT Act provisions' : '15 days to 6 months per TPA S.106',
      reliefAgainstForfeiture: true, // S.114 — court has discretion
      lesseeHoldingOver: hasKeyword(desc, ['holding over', 'overstayed', 'expired']),
    };

    if (lease.lesseeHoldingOver) {
      flags.push({
        id: 'TPA_S116_HOLDING_OVER',
        severity: 'yellow',
        message: 'Lessee holding over after lease expiry — TPA S.116 treats as month-to-month tenancy',
        legalRef: 'TPA S.116',
      });
    }
  }

  // ── 2.5I. SAT Act Analysis ─────────────────────────────────────────────
  let satAct: Stage25Result['satAct'] = undefined;
  if (facts.khasLand || facts.ceilingExceeded ||
    (facts.classification === 'agricultural' || facts.classification === 'khas') ||
    hasKeyword(facts.disputeType || facts.description || '', ['sat act', 'state acquisition', 'tenancy act', 'ceiling', 'khas'])) {

    const recordHierarchy: Array<{ type: string; weight: number; available: boolean }> = [
      { type: 'CS (Cadastral Survey)', weight: 10, available: !!stage1.property?.dagNumbers.cs || !!stage1.property?.khatianNumbers.cs },
      { type: 'SA (State Acquisition)', weight: 9, available: !!stage1.property?.dagNumbers.sa || !!stage1.property?.khatianNumbers.sa },
      { type: 'RS (Revisional Survey)', weight: 8, available: !!stage1.property?.dagNumbers.rs || !!stage1.property?.khatianNumbers.rs },
      { type: 'BRS (Bangladesh RS)', weight: 7, available: !!stage1.property?.dagNumbers.bs || !!stage1.property?.khatianNumbers.bs },
    ];

    let mutationStatus: Stage25Result['satAct']['mutationStatus'] = 'not_mutated';
    let mutationWeight = 'low';
    if (facts.mutationStatus === 'completed') {
      mutationStatus = 'mutated';
      mutationWeight = 'moderate (but non-conclusive — Supreme Court precedent)';
    } else if (facts.mutationStatus === 'pending') {
      mutationStatus = 'not_mutated';
      mutationWeight = 'low';
    } else if (facts.mutationStatus === 'mutated_without_deed') {
      mutationStatus = 'mutated_without_deed';
      mutationWeight = 'very low (mutation without deed is void)';
    }

    const tenancyType = facts.classification === 'agricultural'
      ? 'Agricultural tenant (bhagchasi) under SAT Act'
      : facts.classification === 'khas'
        ? 'Khas land lessee'
        : 'Non-agricultural tenancy';

    satAct = {
      tenancyType,
      recordHierarchy,
      khasLand: facts.khasLand === true,
      mutationStatus,
      mutationWeight,
      recordOfRightsAnalysis: 'Record of Rights (ROR) is maintained by AC (Land) under SAT Act S.89. ' +
        'Weight hierarchy: CS > SA > RS > BRS. ' +
        'Mutation is an administrative act — NOT a title document (per Supreme Court, Bangladesh). ' +
        'Possession + Title Deed together create superior claim over mere mutation.',
    };

    // Ceiling check
    if (facts.ceilingExceeded) {
      flags.push({
        id: 'SAT_S90_CEILING',
        severity: 'red',
        message: 'Land holding exceeds ceiling limit under SAT Act S.90 — excess land may vest in government',
        legalRef: 'SAT Act S.90',
      });
    }

    // Khas land check
    if (facts.khasLand) {
      flags.push({
        id: 'SAT_KHAS_LAND',
        severity: 'yellow',
        message: 'Khas land — transfer restrictions apply under SAT Act. Government may retain ownership.',
        legalRef: 'SAT Act S.82, S.103',
      });
    }

    // Agricultural transfer check
    if (facts.classification === 'agricultural') {
      flags.push({
        id: 'SAT_S42_AGRI_TRANSFER',
        severity: 'yellow',
        message: 'Agricultural land transfer — SAT Act S.42 restrictions may apply. Transfer without AC (Land) approval may be void.',
        legalRef: 'SAT Act S.42',
      });
    }
  }

  return {
    saleValidity,
    doubleSale,
    ostensibleOwner,
    feedingGrant,
    lisPendens,
    fraudulentTransfer,
    mortgage,
    lease,
    satAct,
    flags,
  };
}


// ═══════════════════════════════════════════════════════════════════════════════
// STAGE 3 — PRECONDITION FILTERS
// Registration Act S.17/S.49, Stamp Act, possession, mutation → bars/flags
// ═══════════════════════════════════════════════════════════════════════════════

export function runStage3(
  facts: CaseFacts,
  stage1: Stage1Result
): PreconditionResult {
  const bars: PreconditionResult['bars'] = [];
  const criticalBlockers: string[] = [];

  // ── 3A. Registration Act Check ─────────────────────────────────────────
  // Determine if document is compulsorily registrable (S.17 Registration Act)
  const immovablePropertyKeywords = [
    'sale', 'baynamah', 'kablanama', 'mortgage', 'heba', 'gift', 'exchange',
    'lease (over 1 year)', 'partition', 'settlement', 'waqf', 'disclaimer',
    'conveyance', 'transfer of immovable', 'agricultural', 'khas',
  ];
  const deedTypeLower = (facts.deedType || '').toLowerCase();
  const isPropertyDocument = immovablePropertyKeywords.some((kw) => deedTypeLower.includes(kw)) ||
    stage1.property !== undefined;

  const isCompulsorilyRegistrable = isPropertyDocument;
  const isRegistered = facts.registered !== false &&
    (facts.registrationDate !== undefined || facts.s17Compliant !== false);
  const s17Compliant = facts.s17Compliant !== false;
  const s49Inadmissible = facts.s49Inadmissible === true;

  // Under S.49, an unregistered document required by S.17 is not admissible
  // in evidence for proving title — but CAN be used for collateral purposes
  // (e.g., to prove consideration, relationship, nature of transaction)
  const admissibleForTitle = isCompulsorilyRegistrable ? (isRegistered && s17Compliant) : true;
  const admissibleForCollateral = true; // Even unregistered docs are admissible for collateral (S.49 proviso)

  // Determine specific collateral purpose
  let collateralPurpose: string | undefined;
  if (isCompulsorilyRegistrable && !isRegistered) {
    collateralPurpose = 'Document may be admitted for collateral purposes only — to prove consideration, date, ' +
      'relationship of parties, or existence of a transaction (but NOT to prove title or transfer).';
    bars.push({
      id: 'REG_S49_INADMISSIBLE',
      severity: 'red',
      message: 'Document not registered but compulsorily registrable under S.17 — inadmissible for title proof under S.49',
      legalRef: 'Registration Act S.17, S.49',
    });
    criticalBlockers.push('Unregistered compulsorily registrable document — cannot prove title');
  }

  // S.17 compliance failure
  if (isCompulsorilyRegistrable && !s17Compliant) {
    bars.push({
      id: 'REG_S17_NONCOMPLIANT',
      severity: 'red',
      message: 'Document does not comply with Registration Act S.17 — transfer of immovable property invalid without registration',
      legalRef: 'Registration Act S.17(1)',
    });
    if (!criticalBlockers.includes('S.17 non-compliant — transfer may be void')) {
      criticalBlockers.push('S.17 non-compliant — transfer may be void');
    }
  }

  const registration: PreconditionResult['registration'] = {
    isCompulsorilyRegistrable,
    isRegistered,
    admissibleForTitle,
    admissibleForCollateral,
    collateralPurpose,
    section17: s17Compliant,
    section49: s49Inadmissible || (!isRegistered && isCompulsorilyRegistrable),
  };

  // ── 3B. Stamp Act Check ────────────────────────────────────────────────
  const sufficientlyStamped = facts.stampDutyOk !== false;
  const impounded = facts.stampDutyOk === false;
  const penaltyRequired = facts.stampDutyOk === false;

  let stampStatus: PreconditionResult['stamp']['status'] = 'pass';
  if (impounded) {
    stampStatus = 'impounded';
  } else if (penaltyRequired) {
    stampStatus = 'penalty_pending';
  }

  if (!sufficientlyStamped) {
    bars.push({
      id: 'STAMP_IMPUNDED',
      severity: 'yellow',
      message: 'Document appears to be insufficiently stamped — may be impounded under Stamp Act S.33. ' +
        'Court may admit on payment of penalty (S.35/S.37).',
      legalRef: 'Stamp Act S.33, S.35, S.37',
    });
  }

  const stamp: PreconditionResult['stamp'] = {
    sufficientlyStamped,
    impounded,
    penaltyRequired,
    penaltyAmount: undefined, // Would need specific amounts for calculation
    status: stampStatus,
  };

  // ── 3C. Possession Status ──────────────────────────────────────────────
  const possession: PreconditionResult['possession'] = {
    ...stage1.possession,
  };

  // ── 3D. Mutation Status ────────────────────────────────────────────────
  const mutationNonConclusive = true; // ALWAYS non-conclusive per Bangladesh Supreme Court precedent
  const mutationWeight = facts.mutationStatus === 'completed'
    ? 'moderate (administrative proof only — NOT conclusive title)'
    : facts.mutationStatus === 'mutated_without_deed'
      ? 'void — mutation without deed is of no legal value'
      : 'low — mutation not completed';

  if (facts.mutationStatus === 'mutated_without_deed') {
    bars.push({
      id: 'MUTATION_WITHOUT_DEED',
      severity: 'red',
      message: 'Mutation completed without underlying deed — mutation is void and creates no title',
      legalRef: 'SAT Act S.89, Supreme Court precedent',
    });
    criticalBlockers.push('Mutation without deed — no legal basis for title');
  }

  const mutation: PreconditionResult['mutation'] = {
    status: facts.mutationStatus || 'not_started',
    weight: mutationWeight,
    nonConclusive: mutationNonConclusive,
  };

  // ── 3E. Overall Pass/Fail ──────────────────────────────────────────────
  const passed = criticalBlockers.length === 0 && bars.filter((b) => b.severity === 'red').length === 0;

  // Mutation is informational only (non-conclusive)
  const mutationBars = bars.filter((b) => b.id === 'MUTATION_WITHOUT_DEED');
  if (mutationBars.length === criticalBlockers.length && criticalBlockers.length > 0) {
    // Only mutation blocker — still a problem
  }

  return {
    registration,
    stamp,
    possession,
    mutation,
    bars,
    passed,
    criticalBlockers,
  };
}


// ═══════════════════════════════════════════════════════════════════════════════
// STAGE 4 — LIMITATION ENGINE
// Comprehensive limitation period lookup, deadline calculation, condonation
// ═══════════════════════════════════════════════════════════════════════════════

export function runStage4(
  facts: CaseFacts,
  stage0: Stage0Result,
  stage2: Stage2Result
): Stage4Result {
  // Defensive: safe fallback if stage2 is undefined
  const s2 = stage2 ?? {
    classification: { code: '2?', name: 'Unclassified', description: '', targetStage: 0 },
    routedStage: 0,
    propertySubType: undefined,
    requiresArthaRin: false,
    requiresOrder37: false,
    requiresPartitionEngine: false,
    requiresAdversePossessionEngine: false,
    requiresPreEmptionEngine: false,
  };
  const causeDate = facts.causeOfActionDate;
  const filingDate = facts.filingDate || new Date().toISOString().split('T')[0];
  const knowledgeDate = facts.knowledgeOfFraudDate || causeDate;
  const code = s2.classification.code;

  // ── 4A. Determine applicable limitation periods ────────────────────────

  type LimitationDef = {
    suitType: string;
    article: string;
    periodDays: number;
    periodDisplay: string;
    startDate: string;
  };

  const applicable: LimitationDef[] = [];
  // Guard: if causeDate is missing, fall back to today so limitation is not falsely marked barred
  const effectiveCauseDate = causeDate || new Date().toISOString().split('T')[0];

  // Primary limitation based on classification
  switch (code) {
    case '2A': // Declaration of Title
      applicable.push({
        suitType: 'Declaration of Title (SRA S.42)',
        article: 'Art.120 Limitation Act',
        periodDays: 6 * 365,
        periodDisplay: '6 years from right denial',
        startDate: effectiveCauseDate,
      });
      break;

    case '2B': // Recovery of Possession
      // Two tracks: S.8 (title-based, 12 years) and S.9 (summary, 6 months)
      if (s2.propertySubType === 'summary_s9') {
        applicable.push({
          suitType: 'Recovery of Possession — Summary (SRA S.9)',
          article: 'Art.3 Limitation Act',
          periodDays: 180, // 6 months
          periodDisplay: '6 months',
          startDate: facts.dispossessionDate || causeDate,
        });
      }
      applicable.push({
        suitType: 'Recovery of Possession — Title-based (SRA S.8)',
        article: 'Art.144 Limitation Act',
        periodDays: 12 * 365,
        periodDisplay: '12 years',
        startDate: facts.dispossessionDate || causeDate,
      });
      break;

    case '2C': // Partition
      applicable.push({
        suitType: 'Partition Suit',
        article: 'Art.120 Limitation Act',
        periodDays: 6 * 365,
        periodDisplay: '6 years (residuary — no specific article for partition)',
        startDate: effectiveCauseDate,
      });
      break;

    case '2D': // Cancellation
      applicable.push({
        suitType: 'Cancellation of Instrument (SRA S.39)',
        article: 'Art.91 Limitation Act',
        periodDays: 3 * 365,
        periodDisplay: '3 years from knowledge of fraud/mistake',
        startDate: knowledgeDate || causeDate,
      });
      break;

    case '2E': // Injunction
      applicable.push({
        suitType: 'Permanent Injunction (SRA S.52-57)',
        article: 'Art.120 Limitation Act',
        periodDays: 6 * 365,
        periodDisplay: '6 years from cause of action',
        startDate: effectiveCauseDate,
      });
      // Temporary injunction has its own timeline (not subject to limitation per se, but related)
      break;

    case '2F': // Adverse Possession
      applicable.push({
        suitType: 'Adverse Possession — Declaration',
        article: 'Art.142 Limitation Act',
        periodDays: 12 * 365, // 12 years actual possession required
        periodDisplay: '12 years continuous adverse possession',
        startDate: facts.possessionStartDate || causeDate,
      });
      break;

    case '2G': // Mortgage
      applicable.push({
        suitType: 'Mortgage Redemption / Enforcement',
        article: 'Art.132 Limitation Act',
        periodDays: 12 * 365,
        periodDisplay: '12 years (redemption) / 60 years (foreclosure)',
        startDate: effectiveCauseDate,
      });
      // Also add 60-year period for foreclosure
      applicable.push({
        suitType: 'Mortgage Foreclosure',
        article: 'Art.147 Limitation Act',
        periodDays: 60 * 365,
        periodDisplay: '60 years',
        startDate: effectiveCauseDate,
      });
      break;

    case '2H': // Pre-emption
      applicable.push({
        suitType: 'Pre-emption (SAT Act S.96)',
        article: 'SAT Act S.96',
        periodDays: 120, // 4 months from knowledge
        periodDisplay: '4 months from knowledge of transfer',
        startDate: knowledgeDate || causeDate,
      });
      break;

    case '2I': // Lease
      applicable.push({
        suitType: 'Lease Enforcement / Eviction',
        article: 'Art.110 Limitation Act',
        periodDays: 3 * 365,
        periodDisplay: '3 years',
        startDate: effectiveCauseDate,
      });
      break;

    case '2J': // Money recovery (contract)
      applicable.push({
        suitType: 'Money Recovery on Contract',
        article: 'Art.113 Limitation Act',
        periodDays: 3 * 365,
        periodDisplay: '3 years from date fixed for payment or default',
        startDate: facts.defaultDate || causeDate,
      });
      break;

    case '2K': // Damages
      applicable.push({
        suitType: 'Damages / Compensation',
        article: 'Art.115 Limitation Act',
        periodDays: 3 * 365,
        periodDisplay: '3 years from cause of action',
        startDate: effectiveCauseDate,
      });
      break;

    case '2L': // Refund / Unjust Enrichment
      applicable.push({
        suitType: 'Unjust Enrichment / Refund',
        article: 'Art.113 Limitation Act',
        periodDays: 3 * 365,
        periodDisplay: '3 years',
        startDate: effectiveCauseDate,
      });
      break;

    case '2M': // Negotiable Instrument
      applicable.push({
        suitType: 'Negotiable Instrument (Order 37)',
        article: 'Art.73 Limitation Act',
        periodDays: 3 * 365,
        periodDisplay: '3 years from date of bill/note',
        startDate: facts.defaultDate || causeDate,
      });
      break;

    case '2N': // Artha Rin
      applicable.push({
        suitType: 'Artha Rin Suit',
        article: 'Artha Rin Ain 2003',
        periodDays: 3 * 365, // Generally 3 years but strictly applied
        periodDisplay: '3 years — strictly enforced per Artha Rin Ain',
        startDate: facts.defaultDate || causeDate,
      });
      break;

    default: // Unknown
      applicable.push({
        suitType: 'Civil Suit (general)',
        article: 'Art.120 Limitation Act',
        periodDays: 6 * 365,
        periodDisplay: '6 years (residuary)',
        startDate: effectiveCauseDate,
      });
      break;
  }

  // ── 4B. Calculate deadlines and status for each entry ──────────────────

  const allApplicable: Stage4Result['allApplicable'] = applicable.map((entry) => {
    const deadline = addDays(entry.startDate, entry.periodDays);
    const daysRemaining = daysBetween(filingDate, deadline);
    const atRiskDays = 30; // within 30 days of deadline = at risk

    let status: Stage4Result['allApplicable'][0]['status'];
    if (isNaN(daysRemaining)) {
      status = 'barred'; // Can't calculate — assume worst
    } else if (daysRemaining < 0) {
      status = 'barred';
    } else if (daysRemaining <= atRiskDays) {
      status = 'at_risk';
    } else {
      status = 'within_time';
    }

    // Overrides for special cases
    const overrides: Array<{ type: string; description: string; section: string }> = [];

    // S.18 — Fraud/concealment extends limitation
    if (facts.knowledgeOfFraudDate && facts.knowledgeOfFraudDate !== causeDate) {
      overrides.push({
        type: 'S.18 Extension',
        description: 'Limitation runs from date of discovery of fraud/concealment, not from transaction',
        section: 'Limitation Act S.18',
      });
    }

    // S.19 — Acknowledgment resets
    // Would need separate acknowledgment date — flag if applicable

    // S.20 — Part payment resets
    if (facts.defaultDate && facts.defaultDate !== causeDate) {
      overrides.push({
        type: 'S.20 Part Payment',
        description: 'Part payment or acknowledgment of liability may reset limitation clock',
        section: 'Limitation Act S.20',
      });
    }

    // Special: Artha Rin strict statutory
    if (code === '2N') {
      overrides.push({
        type: 'Artha Rin Strict',
        description: 'Artha Rin Ain limitation is strictly enforced — S.5/Limitation Act S.5 condonation generally NOT available for original suits',
        section: 'Artha Rin Ain 2003',
      });
    }

    return {
      suitType: entry.suitType,
      article: entry.article,
      period: entry.periodDisplay,
      computedDeadline: deadline,
      daysRemaining: isNaN(daysRemaining) ? undefined : daysRemaining,
      status,
      startDate: entry.startDate,
      overrides: overrides.length > 0 ? overrides : undefined,
    };
  });

  // ── 4C. Primary limitation (first entry = most critical) ───────────────
  const primaryLimitation = allApplicable[0] || {
    suitType: 'Unknown',
    article: 'Art.113',
    period: '3 years',
    status: 'barred',
    startDate: effectiveCauseDate,
  };

  // ── 4D. Condonation Analysis ───────────────────────────────────────────

  // S.5 — S.5 of Limitation Act: ONLY for appeals, revisions, reviews, NOT original suits
  const condonationAvailable = code !== '2N' && primaryLimitation.status === 'barred';
  // Even then, S.5 applies only to appellate/review proceedings
  // Original suits that are time-barred cannot be saved by S.5

  let condonationBasis: string | undefined;
  if (condonationAvailable) {
    condonationBasis = 'Note: Limitation Act S.5 (condonation of delay) is available ONLY for appeals, ' +
      'revisions, and review applications (not original suits). ' +
      'An original suit that is time-barred must rely on S.18 (fraud/concealment) or S.19 (acknowledgment) ' +
      'or S.20 (part payment) to extend the limitation period.';
  }

  // S.18 — Fraud or mistake
  const fraudConcealment = !!facts.knowledgeOfFraudDate &&
    facts.knowledgeOfFraudDate !== causeDate &&
    primaryLimitation.status === 'barred';

  // S.19 — Acknowledgment in writing signed by defendant or agent
  // We check if there's evidence of acknowledgment
  const acknowledgementResets = hasKeyword(facts.description || '', [
    'acknowledgment', 'acknowledgement', 'admitted', 'acknowledge debt',
    'stated in writing', 'লিখিত স্বীকৃতি', 'স্বীকার',
  ]);

  // S.20 — Part payment
  const partPaymentResets = hasKeyword(facts.description || '', [
    'part payment', 'partial payment', 'repayment', 'paid some',
    'কিছু পরিশোধ', 'আংশিক',
  ]);

  // ── 4E. Gate Result ────────────────────────────────────────────────────
  let gateResult: Stage4Result['gateResult'];

  if (primaryLimitation.status === 'within_time') {
    gateResult = 'pass';
  } else if (primaryLimitation.status === 'at_risk') {
    gateResult = 'pass'; // technically still within time
  } else if (primaryLimitation.status === 'barred') {
    if (fraudConcealment || acknowledgementResets || partPaymentResets) {
      gateResult = 'condonable';
    } else if (code === '2N') {
      gateResult = 'barred'; // Artha Rin — strict, no condonation
    } else {
      gateResult = 'barred';
    }
  } else {
    gateResult = 'barred'; // default to barred if can't determine
  }

  const suitTimeBarred = gateResult === 'barred';

  return {
    primaryLimitation,
    allApplicable,
    condonationAvailable,
    condonationBasis,
    acknowledgementResets,
    partPaymentResets,
    fraudConcealment,
    suitTimeBarred,
    gateResult,
  };
}
