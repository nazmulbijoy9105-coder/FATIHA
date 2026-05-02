import { NextRequest, NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════════
// /api/auto-fill — Extract legal facts from case description
// Pure server-side regex + keyword matching — no LLM needed
// ═══════════════════════════════════════════════════════════════

const DISPUTE_TYPES = [
  'Title Suit (T.S.) — Declaration + Recovery of Possession',
  'Injunction Suit — Temporary / Permanent',
  'Partition Suit — Between Co-Owners',
  'Declaration Suit — Legal Rights/Status',
  'Specific Performance Suit — Enforce Contract (SRA 1877)',
  'Money Suit — Recovery of Money/Debt',
  'Rent Suit — Landlord-Tenant Disputes',
  'Ejectment Suit — Evict Unauthorized Occupants',
  'Probate / Administration — Inheritance of Deceased Estate',
  'Miscellaneous Civil (M.C.) — Injunction Petitions, Stay Applications',
  'Execution Case (E.C.) — Enforce Court Decree',
  'Appeal / Revision — Civil Appeal (C.A.), Civil Revision (C.R.)',
];

const DEED_TYPES = [
  'Sale Deed', 'Gift Deed', 'Exchange Deed', 'Mortgage Deed', 'Lease Deed',
  'Waqf Deed', 'Settlement Deed', 'Partition Deed', 'Power of Attorney', 'Will', 'Other',
];

const PROPERTY_CLASSIFICATIONS = [
  'Agricultural', 'Non-Agricultural', 'Homestead', 'Commercial', 'Industrial', 'Water Body', 'Khas Land',
];

// Keyword → dispute type mapping (broader patterns checked first)
const DISPUTE_KEYWORDS: [RegExp, string][] = [
  [/\bspecific\s+performance\b/i, 'Specific Performance Suit — Enforce Contract (SRA 1877)'],
  [/\binjunction\b/i, 'Injunction Suit — Temporary / Permanent'],
  [/\bpartition\b/i, 'Partition Suit — Between Co-Owners'],
  [/\b(probate|administration|inheritance|succession|deceased\s+estate)\b/i, 'Probate / Administration — Inheritance of Deceased Estate'],
  [/\b(ejectment|evict|eviction)\b/i, 'Ejectment Suit — Evict Unauthorized Occupants'],
  [/\b(money|debt|recovery\s+of\s+money|artha\s+rin|loan)\b/i, 'Money Suit — Recovery of Money/Debt'],
  [/\b(rent|tenant|landlord|lease\s+dispute)\b/i, 'Rent Suit — Landlord-Tenant Disputes'],
  [/\b(appeal|revision|civil\s+appeal|civil\s+revision)\b/i, 'Appeal / Revision — Civil Appeal (C.A.), Civil Revision (C.R.)'],
  [/\b(execution|decree|enforce\s+court)\b/i, 'Execution Case (E.C.) — Enforce Court Decree'],
  [/\b(stay\s+application|stay\s+order|m\.c\.)\b/i, 'Miscellaneous Civil (M.C.) — Injunction Petitions, Stay Applications'],
  [/\b(declaration\s+suit|legal\s+rights|legal\s+status)\b/i, 'Declaration Suit — Legal Rights/Status'],
  [/\b(title\s+suit|title\s+dispute|ownership|sale\s+deed|co-owner|fraud)\b/i, 'Title Suit (T.S.) — Declaration + Recovery of Possession'],
  [/\b(possession|recover)\b/i, 'Title Suit (T.S.) — Declaration + Recovery of Possession'],
];

// Keyword → deed type mapping
const DEED_KEYWORDS: [RegExp, string][] = [
  [/\b(sale\s+deed|sale\s+agreement|conveyance)\b/i, 'Sale Deed'],
  [/\b(gift\s+deed|hiba|heba)\b/i, 'Gift Deed'],
  [/\b(exchange\s+deed)\b/i, 'Exchange Deed'],
  [/\b(mortgage\s+deed|mortgage)\b/i, 'Mortgage Deed'],
  [/\b(lease\s+deed|rental\s+agreement)\b/i, 'Lease Deed'],
  [/\b(waqf\s+deed|waqf)\b/i, 'Waqf Deed'],
  [/\b(settlement\s+deed|family\s+settlement)\b/i, 'Settlement Deed'],
  [/\b(partition\s+deed)\b/i, 'Partition Deed'],
  [/\b(will|testament|last\s+will)\b/i, 'Will'],
  [/\b(power\s+of\s+attorney|poa)\b/i, 'Power of Attorney'],
];

// Keyword → property classification mapping
const CLASSIFICATION_KEYWORDS: [RegExp, string][] = [
  [/\b(water\s+body|jheel|pond|lake|river|khal|beel)\b/i, 'Water Body'],
  [/\b(khas\s+land|government\s+land)\b/i, 'Khas Land'],
  [/\b(industrial|factory|mill|warehouse)\b/i, 'Industrial'],
  [/\b(commercial|shop|market|office|business)\b/i, 'Commercial'],
  [/\b(homestead|residential|dwelling|house|bhita|bari|ghar)\b/i, 'Homestead'],
  [/\b(non[\s-]agricultural|non[\s-]crop)\b/i, 'Non-Agricultural'],
  [/\b(agricultural|crop|farm|cultivation|farming|krishi)\b/i, 'Agricultural'],
];

// Physical acts keywords
const PHYSICAL_ACT_KEYWORDS: [RegExp, string][] = [
  [/\b(construction|building|structure|ghar|constructed)\b/i, 'Construction'],
  [/\b(crop|farming|cultivation|harvest|paddy)\b/i, 'Crop Cultivation'],
  [/\b(fence|wall|boundary|enclosure|bathon)\b/i, 'Boundary Fencing'],
  [/\b(trees|plantation|tree|garden|bagan)\b/i, 'Tree Plantation'],
  [/\b(demolition|break|destroy|damage)\b/i, 'Demolition'],
  [/\b(earth[- ]filling|soil|filling|mati)\b/i, 'Earth Filling'],
  [/\b(trespass|encroachment|encroach)\b/i, 'Trespass'],
  [/\b(locked|sealed|padlock|chang)\b/i, 'Property Locked'],
  [/\b(residing|living|dwelling|occupied)\b/i, 'Residing on Property'],
];

interface AutoFillResult {
  title: string;
  plaintiff: string;
  defendant: string;
  disputeType: string;
  deedType: string;
  mouza: string;
  upazila: string;
  dag: string;
  khatian: string;
  classification: string;
  causeDate: string;
  description: string;
  s17: string;
  s49: string;
  benami: string;
  stampOk: string;
  possessor: string;
  possessionNature: string;
  possessionDate: string;
  physicalActs: string;
  religion: string;
  ceilingExceeded: string;
  acquisition: string;
  mutation: string;
  poaHolder: string;
}

function extractNames(text: string): { plaintiff: string; defendant: string } {
  let plaintiff = '';
  let defendant = '';

  // Pattern: "A v. B" or "A vs B" or "A versus B"
  const versusMatch = text.match(/([A-Z][A-Za-z\s.]+?)\s+(?:v\.?|vs\.?|versus)\s+([A-Z][A-Za-z\s.]+?)(?:\s+[-–—,.\n]|\s*$)/i);
  if (versusMatch) {
    plaintiff = versusMatch[1].trim().replace(/\s+/g, ' ');
    defendant = versusMatch[2].trim().replace(/\s+/g, ' ');
    return { plaintiff, defendant };
  }

  // Pattern: "XYZ filed a suit against ABC"
  const filedMatch = text.match(/([A-Z][A-Za-z\s.]+?)\s+filed\s+a\s+suit\s+(?:for\s+\w+)?\s*against\s+([A-Z][A-Za-z\s.]+?)(?:\s+[.,;\n]|\s*$)/i);
  if (filedMatch) {
    plaintiff = filedMatch[1].trim().replace(/\s+/g, ' ');
    defendant = filedMatch[2].trim().replace(/\s+/g, ' ');
    return { plaintiff, defendant };
  }

  // Pattern: "suit between A and B"
  const betweenMatch = text.match(/suit\s+between\s+([A-Z][A-Za-z\s.]+?)\s+and\s+([A-Z][A-Za-z\s.]+?)(?:\s+[.,;\n]|\s*$)/i);
  if (betweenMatch) {
    plaintiff = betweenMatch[1].trim().replace(/\s+/g, ' ');
    defendant = betweenMatch[2].trim().replace(/\s+/g, ' ');
    return { plaintiff, defendant };
  }

  // Pattern: "plaintiff" keyword followed by name
  const plaintiffMatch = text.match(/(?:plaintiff|petitioner|complainant)[:\s]+([A-Z][A-Za-z\s.]+?)(?:\s*[.,;\n]|\s*$)/i);
  if (plaintiffMatch) {
    plaintiff = plaintiffMatch[1].trim().replace(/\s+/g, ' ');
  }

  // Pattern: "defendant" keyword followed by name
  const defendantMatch = text.match(/(?:defendant|respondent|opposite\s+party)[:\s]+([A-Z][A-Za-z\s.]+?)(?:\s*[.,;\n]|\s*$)/i);
  if (defendantMatch) {
    defendant = defendantMatch[1].trim().replace(/\s+/g, ' ');
  }

  return { plaintiff, defendant };
}

function extractLocation(text: string): { mouza: string; upazila: string } {
  let mouza = '';
  let upazila = '';

  // Extract mouza
  const mouzaMatch = text.match(/(?:mouza|moja|mauza)[:\s]+([A-Za-z][A-Za-z\s-]*?)(?:\s*[.,;)\]}\n]|\s+(?:under|in|at|upazila|thana|district)|$)/i);
  if (mouzaMatch) {
    mouza = mouzaMatch[1].trim();
  }

  // Extract upazila / thana
  const upazilaMatch = text.match(/(?:upazila|thana|upozilla)[:\s]+([A-Za-z][A-Za-z\s-]*?)(?:\s*[.,;)\]}\n]|\s+(?:under|in|at|district|sub-district)|$)/i);
  if (upazilaMatch) {
    upazila = upazilaMatch[1].trim();
  }

  return { mouza, upazila };
}

function extractDag(text: string): string {
  const dagMatch = text.match(/(?:dag\s*(?:no\.?|number|#)?)\s*[:\s]*([0-9]+(?:\/[0-9]+)?)/i);
  return dagMatch ? dagMatch[1] : '';
}

function extractKhatian(text: string): string {
  const khatianMatch = text.match(/(?:khatian\s*(?:no\.?|number|#)?)\s*[:\s]*([0-9]+(?:\/[0-9]+)?)/i);
  return khatianMatch ? khatianMatch[1] : '';
}

function extractDates(text: string): { causeDate: string; possessionDate: string } {
  const dates: string[] = [];

  // DD.MM.YYYY or DD/MM/YYYY or DD-MM-YYYY
  const dmyMatches = text.matchAll(/(\d{1,2})[./\-](\d{1,2})[./\-](\d{4})/g);
  for (const m of dmyMatches) {
    const day = m[1].padStart(2, '0');
    const month = m[2].padStart(2, '0');
    const year = m[3];
    if (parseInt(month) >= 1 && parseInt(month) <= 12) {
      dates.push(`${year}-${month}-${day}`);
    }
  }

  // YYYY-MM-DD
  const ymdMatches = text.matchAll(/(\d{4})-(\d{1,2})-(\d{1,2})/g);
  for (const m of ymdMatches) {
    const year = m[1];
    const month = m[2].padStart(2, '0');
    const day = m[3].padStart(2, '0');
    if (parseInt(month) >= 1 && parseInt(month) <= 12) {
      dates.push(`${year}-${month}-${day}`);
    }
  }

  // "on DD Month YYYY" or "DDth Month YYYY"
  const monthNames = 'january|february|march|april|may|june|july|august|september|october|november|december';
  const monthMap: Record<string, string> = {
    january: '01', february: '02', march: '03', april: '04',
    may: '05', june: '06', july: '07', august: '08',
    september: '09', october: '10', november: '11', december: '12',
  };
  const textMonthPattern = new RegExp(`(\\d{1,2})(?:st|nd|rd|th)?\\s+(${monthNames})\\s+(\\d{4})`, 'gi');
  const textMonthMatches = text.matchAll(textMonthPattern);
  for (const m of textMonthMatches) {
    const day = m[1].padStart(2, '0');
    const month = monthMap[m[2].toLowerCase()];
    const year = m[3];
    if (month) {
      dates.push(`${year}-${month}-${day}`);
    }
  }

  // Sort dates (earliest first)
  dates.sort();

  const causeDate = dates[0] || '';

  // Look for possession date specifically
  let possessionDate = '';
  const possCtxMatch = text.match(/(?:possession|took\s+possession|dispossessed|entered|occupied)(?:[^.\n]{0,100}?(?:on|dated|since)[:\s]*)?(\d{1,2}[./\-]\d{1,2}[./\-]\d{4})/i);
  if (possCtxMatch) {
    const parts = possCtxMatch[1].split(/[./\-]/);
    possessionDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  if (!possessionDate && dates.length > 1) {
    possessionDate = dates[dates.length - 1]; // Use latest date for possession if no specific context
  }

  return { causeDate, possessionDate };
}

function matchFirst<T>(text: string, patterns: [RegExp, T][]): T | '' {
  for (const [regex, value] of patterns) {
    if (regex.test(text)) return value;
  }
  return '';
}

function extractPossession(text: string): { possessor: string; nature: string } {
  let possessor = '';
  let nature = '';

  // Who has possession
  const lowerText = text.toLowerCase();

  // "plaintiff has possession" / "in possession of plaintiff"
  const plaintiffPossMatch = text.match(/(?:plaintiff|petitioner|purchaser|owner|vendor)\s+(?:is\s+in\s+|has\s+(?:the\s+)?|got\s+(?:the\s+)?|took\s+(?:the\s+)?|remains\s+in\s+)?possession/i);
  const inPossOfPlaintiff = text.match(/possession\s+(?:of\s+)?(?:the\s+)?(?:plaintiff|petitioner|purchaser|owner)/i);
  if (plaintiffPossMatch || inPossOfPlaintiff) {
    possessor = 'Plaintiff';
  }

  if (!possessor) {
    const defendantPossMatch = text.match(/(?:defendant|respondent|opposite|encroacher|trespasser|unauthorized)\s+(?:is\s+in\s+|has\s+(?:the\s+)?|got\s+(?:the\s+)?|took\s+(?:the\s+)?|remains\s+in\s+)?possession/i);
    const inPossOfDefendant = text.match(/possession\s+(?:of\s+)?(?:the\s+)?(?:defendant|respondent|opposite|encroacher|trespasser)/i);
    if (defendantPossMatch || inPossOfDefendant) {
      possessor = 'Defendant';
    }
  }

  // Extract possessor name if mentioned
  if (!possessor) {
    const possNameMatch = text.match(/(?:possession|possessor|occupier)[:\s]+([A-Z][A-Za-z\s.]+?)(?:\s*[.,;\n]|\s*$)/i);
    if (possNameMatch) possessor = possNameMatch[1].trim().replace(/\s+/g, ' ');
  }

  // Nature of possession
  if (/\bopen\b/i.test(text) && /\bhostile\b/i.test(text)) {
    nature = 'hostile';
  } else if (/\bopen\b/i.test(text) && /\bpeaceful\b/i.test(text)) {
    nature = 'peaceful';
  } else if (/\bhostile\b/i.test(text)) {
    nature = 'hostile';
  } else if (/\bpeaceful\b/i.test(text)) {
    nature = 'peaceful';
  } else if (/\bopen\b/i.test(text)) {
    nature = 'open';
  }

  return { possessor, nature };
}

function extractPhysicalActs(text: string): string {
  const acts: string[] = [];
  for (const [regex, label] of PHYSICAL_ACT_KEYWORDS) {
    if (regex.test(text)) acts.push(label);
  }
  return acts.join(', ');
}

function extractReligion(text: string): string {
  if (/\b(islam|muslim)\b/i.test(text)) return 'Islam';
  if (/\bhindu\b/i.test(text)) return 'Hindu';
  if (/\b(christian|christianity)\b/i.test(text)) return 'Christian';
  if (/\b(buddhist|buddhism)\b/i.test(text)) return 'Buddhist';
  return '';
}

function extractDocumentValidity(text: string): { s17: string; s49: string; benami: string; stampOk: string } {
  let s17 = '';
  let s49 = '';
  let benami = '';
  let stampOk = '';

  // S.17 — Registration Act compliance
  if (/\b(s\.?\s*17|section\s*17|registered|properly\s+registered)\b/i.test(text)) {
    s17 = 'yes';
  }
  if (/\bunregistered\b/i.test(text) || /\bnot\s+registered\b/i.test(text)) {
    s17 = 'no';
  }

  // S.49 — inadmissible if not registered
  if (/\b(s\.?\s*49|section\s*49|inadmissible)\b/i.test(text)) {
    s49 = 'yes';
  }

  // Benami
  if (/\bbenami\b/i.test(text)) {
    benami = 'yes';
  }

  // Stamp duty
  if (/\b(stamp\s+duty|properly\s+stamped|stamp\s+paid|duly\s+stamped)\b/i.test(text)) {
    stampOk = 'yes';
  }
  if (/\bunstamped\b/i.test(text) || /\bnot\s+stamped\b/i.test(text) || /\binsufficient\s+stamp\b/i.test(text)) {
    stampOk = 'no';
  }

  return { s17, s49, benami, stampOk };
}

function extractCeiling(text: string): string {
  if (/\bceiling\b/i.test(text) && /\bexceed(?:ed|s)?\b/i.test(text)) {
    return 'yes';
  }
  if (/\bwithin\s+ceiling\b/i.test(text) || (/\bceiling\s+limit\b/i.test(text) && /\bnot\s+exceed/i.test(text))) {
    return 'no';
  }
  return '';
}

function extractMutation(text: string): string {
  if (/\bmutation\s+(?:completed|done|recorded|finished)\b/i.test(text)) {
    return 'completed';
  }
  if (/\bmutation\s+(?:pending|under\s+process|in\s+progress)\b/i.test(text)) {
    return 'pending';
  }
  if (/\bnot\s+mutated\b/i.test(text) || /\bmutation\s+not\s+(?:done|started|initiated)\b/i.test(text)) {
    return 'not_started';
  }
  // If mutation is mentioned but no status
  if (/\bmutation\b/i.test(text)) {
    return 'pending'; // Default to pending
  }
  return '';
}

function extractAcquisition(text: string): string {
  const acqMatch = text.match(/(?:land\s+acquisition|acquisition\s+(?:order|proceeding|act|notification))[:\s]*([^.\n]{2,80}?)(?:\s*[.;\n]|$)/i);
  if (acqMatch) return acqMatch[1].trim();
  return '';
}

function extractPoaHolder(text: string): string {
  const poaMatch = text.match(/(?:power\s+of\s+attorney|poa)\s+(?:holder|appointed|given\s+to|granted\s+to|executed\s+by)[:\s]*([A-Z][A-Za-z\s.]+?)(?:\s*[.,;\n]|\s*$)/i);
  if (poaMatch) return poaMatch[1].trim().replace(/\s+/g, ' ');

  // "through PoA" pattern
  const throughPoa = text.match(/(?:through|via)\s+(?:the\s+)?(?:poa|power\s+of\s+attorney)\s+(?:of|by|holder)\s+([A-Z][A-Za-z\s.]+?)(?:\s*[.,;\n]|\s*$)/i);
  if (throughPoa) return throughPoa[1].trim().replace(/\s+/g, ' ');

  return '';
}

function generateTitle(plaintiff: string, defendant: string, disputeType: string): string {
  if (plaintiff && defendant) {
    return `${plaintiff} v. ${defendant}`;
  }
  if (plaintiff) return `${plaintiff} — Case`;
  if (defendant) return `Case against ${defendant}`;
  if (disputeType) return disputeType.split('—')[0].trim();
  return 'Untitled Case';
}

function autoFill(description: string): AutoFillResult {
  const { plaintiff, defendant } = extractNames(description);
  const { mouza, upazila } = extractLocation(description);
  const dag = extractDag(description);
  const khatian = extractKhatian(description);
  const { causeDate, possessionDate } = extractDates(description);
  const disputeType = matchFirst(description, DISPUTE_KEYWORDS) as string;
  const deedType = matchFirst(description, DEED_KEYWORDS) as string;
  const classification = matchFirst(description, CLASSIFICATION_KEYWORDS) as string;
  const { possessor, nature } = extractPossession(description);
  const physicalActs = extractPhysicalActs(description);
  const religion = extractReligion(description);
  const { s17, s49, benami, stampOk } = extractDocumentValidity(description);
  const ceilingExceeded = extractCeiling(description);
  const mutation = extractMutation(description);
  const acquisition = extractAcquisition(description);
  const poaHolder = extractPoaHolder(description);
  const title = generateTitle(plaintiff, defendant, disputeType);

  return {
    title,
    plaintiff,
    defendant,
    disputeType,
    deedType,
    mouza,
    upazila,
    dag,
    khatian,
    classification,
    causeDate,
    description,
    s17,
    s49,
    benami,
    stampOk,
    possessor,
    possessionNature: nature,
    possessionDate,
    physicalActs,
    religion,
    ceilingExceeded,
    acquisition,
    mutation,
    poaHolder,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description } = body as { description?: string };

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return NextResponse.json(
        { error: 'Description is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (description.length > 50000) {
      return NextResponse.json(
        { error: 'Description too long (max 50,000 characters)' },
        { status: 400 }
      );
    }

    const result = autoFill(description.trim());
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
