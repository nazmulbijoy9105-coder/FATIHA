// ═══════════════════════════════════════════════════════════════════════════
// FATIHA v3.0 — Bangladesh Civil Dispute Decision Engine
// Full 14-Stage Production Types
// CPC + SRA + TPA + SAT Act + Artha Rin Ain 2003 + Order 37
// Evidence Act + Limitation Act + Registration Act + Stamp Act + Order 21
// ═══════════════════════════════════════════════════════════════════════════

// ─── DISPUTE TRACKS ────────────────────────────────────────────────────────
export type DisputeTrack =
  | 'property_title'        // [A] Title / Declaration
  | 'property_possession'   // [B] Possession recovery
  | 'property_partition'    // [C] Partition
  | 'property_cancellation' // [D] Cancellation of deed
  | 'property_injunction'   // [E] Injunction over land
  | 'property_adverse'      // [F] Adverse possession
  | 'property_mortgage'     // [G] Mortgage enforcement / redemption
  | 'property_preemption'   // [H] Pre-emption (S.96 SAT Act)
  | 'property_lease'        // [I] Lease termination
  | 'money_contract'        // [J] Simple money recovery
  | 'money_damages'         // [K] Damages for breach
  | 'money_refund'          // [L] Unjust enrichment / refund
  | 'money_negotiable'      // [M] Negotiable instrument → Order 37
  | 'artha_rin'             // Bank/financial institution → Artha Rin Ain
  | 'family'                // Family court — OUT OF ENGINE
  | 'revenue'               // Revenue / SAT Act court
  | 'unknown';

// ─── SUIT TRACKS ──────────────────────────────────────────────────────────
export type SuitTrack = 'regular' | 'order37_summary' | 'artha_rin' | 'family' | 'revenue';

// ─── RELIEF TYPES ──────────────────────────────────────────────────────────
export type ReliefType =
  | 'recovery_of_possession_title'   // SRA S.8
  | 'recovery_of_possession_summary' // SRA S.9
  | 'specific_performance'           // SRA S.10/12
  | 'declaration_of_title'           // SRA S.42
  | 'cancellation_of_deed'           // SRA S.39
  | 'rectification'                  // SRA S.31
  | 'rescission'                     // SRA S.35
  | 'permanent_injunction'           // SRA S.52-57
  | 'temporary_injunction'           // CPC Order 39
  | 'mandatory_injunction'           // SRA S.55
  | 'partition'                      // CPC S.54
  | 'money_decree'                   // General
  | 'damages'                        // General
  | 'pre_emption_substitution'       // SAT Act S.96
  | 'mortgage_sale'                  // TPA
  | 'adverse_possession_declaration'  // Limitation Art.142
  | 'contempt_order'                 // Breach of injunction
  | 'execution_possession'           // Order 21
  | 'execution_money'               // Order 21
  | 'execution_arrest'              // Order 21
  | 'settlement'                    // Order 23
  | 'none';

// ─── OUTCOME TYPES ────────────────────────────────────────────────────────
export type OutcomeType =
  | 'full_decree'
  | 'partial_decree'
  | 'preliminary_decree'
  | 'dismissal'
  | 'rejection_of_plaint'
  | 'return_of_plaint'
  | 'transfer_of_case'
  | 'summary_judgment'
  | 'settlement_decree'
  | 'contempt_order'
  | 'execution_decree';

// ─── SEVERITY ──────────────────────────────────────────────────────────────
export type Severity = 'critical' | 'red' | 'yellow' | 'green' | 'info';

// ─── STAGE 0: ENTRY GATE ──────────────────────────────────────────────────
export interface Stage0Result {
  track: DisputeTrack;
  suitTrack: SuitTrack;
  subType?: string;
  primaryLaw: string;
  territorialJurisdiction: {
    basis: string;
    court: string;
    district?: string;
    section: string;
  };
  pecuniaryJurisdiction: {
    courtLevel: string;
    amountClaimed: number;
    limit: string;
    section: string;
  };
  assignedCourt: string;
  objections: Array<{ type: string; description: string; section: string }>;
}

// ─── STAGE 1: FACT EXTRACTION ──────────────────────────────────────────────
export interface PartyInfo {
  name: string;
  type: 'individual' | 'company' | 'government' | 'bank';
  role: 'plaintiff' | 'defendant' | 'necessary' | 'proforma' | 'guardian';
  isMinor?: boolean;
  isLunatic?: boolean;
  guardianRequired?: boolean;
}

export interface PropertyInfo {
  mouza: string;
  jlNo?: string;
  dagNumbers: { cs?: string; sa?: string; rs?: string; bs?: string };
  khatianNumbers: { cs?: string; sa?: string; rs?: string; bs?: string };
  district: string;
  upazila: string;
  union?: string;
  classification: 'agricultural' | 'non-agricultural' | 'homestead' | 'commercial' | 'industrial' | 'water_body' | 'khas';
  area?: string;
  boundaries?: { north: string; south: string; east: string; west: string };
}

export interface DeedInfo {
  type: string;
  date: string;
  registered: boolean;
  registrationDate?: string;
  stampDutyPaid: boolean;
  stampDutyAmount?: number;
  consideration?: number;
  parties: string[];
  documentId?: string;
}

export interface PaymentInfo {
  amountLent?: number;
  amountDue?: number;
  repaymentRecord?: Array<{ date: string; amount: number; method: string }>;
  defaultDate?: string;
  interestRate?: number;
  securityType?: string;
}

export interface PossessionInfo {
  currentPossessor: string;
  startDate?: string;
  nature: 'owner' | 'licensee' | 'trespasser' | 'tenant' | 'adverse' | 'mortgagee';
  physicalActs?: string[];
  dispossessionDate?: string;
  dispossessionEvent?: string;
}

export interface Stage1Result {
  parties: PartyInfo[];
  property?: PropertyInfo;
  transactionChain: DeedInfo[];
  chainGaps?: string[];
  paymentHistory?: PaymentInfo;
  possession: PossessionInfo;
  documentStack: Array<{ type: string; date?: string; registered: boolean; stampStatus: string; description: string }>;
  missingParties: string[];
  guardianRequired: boolean;
  isBankCreditor: boolean;
  isNegotiableInstrument: boolean;
  isArthaRinEligible: boolean;
}

// ─── STAGE 2: LEGAL CLASSIFICATION ─────────────────────────────────────────
export interface ClassificationCode {
  code: string; // e.g., '2A', '2B', '2J'
  name: string;
  description: string;
  targetStage: number; // which stage handles this
}

export interface Stage2Result {
  classification: ClassificationCode;
  propertySubType?: string;
  moneySubType?: string;
  routedStage: number;
  requiresPreEmptionEngine?: boolean;
  requiresAdversePossessionEngine?: boolean;
  requiresPartitionEngine?: boolean;
  requiresOrder37?: boolean;
  requiresArthaRin?: boolean;
}

// ─── STAGE 2.5: TPA + SAT ACT ────────────────────────────────────────────
export interface SaleValidityCheck {
  registered: boolean;
  considerationOver100: boolean;
  validUnderS54: boolean;
  validUnderS17: boolean;
  issues: string[];
}

export interface DoubleSaleAnalysis {
  isDoubleSale: boolean;
  firstDeed: { registered: boolean; date: string };
  secondDeed: { registered: boolean; date: string };
  noticeAtSecondTransfer: boolean;
  prevailingBuyer: string;
  section48Analysis: string;
}

export interface OstensibleOwnerCheck {
  conditions: { consentOfRealOwner: boolean; forConsideration: boolean; goodFaithDueCare: boolean };
  allMet: boolean;
  protected: boolean;
}

export interface FeedingGrantCheck {
  transferorHadNoTitle: boolean;
  subsequentlyAcquired: boolean;
  titleFeeds: boolean;
  interveningBFP: boolean;
}

export interface LisPendensCheck {
  pendingSuitExists: boolean;
  transferDuringPendency: boolean;
  transfereeBound: boolean;
}

export interface FraudulentTransferCheck {
  intentToDefeatCreditors: boolean;
  transfereeKnowledge: boolean;
  inadequateConsideration: boolean;
  voidable: boolean;
}

export interface MortgageAnalysis {
  type: 'simple' | 'conditional_sale' | 'usufructuary' | 'english' | 'equitable';
  remedies: string[];
  mortgagorRights: string[];
  redemptionAvailable: boolean;
  clogOnEquity: boolean;
}

export interface LeaseAnalysis {
  terminationGrounds: string[];
  noticePeriod?: string;
  reliefAgainstForfeiture: boolean;
  lesseeHoldingOver: boolean;
}

export interface SATAnalysis {
  tenancyType?: string;
  recordHierarchy: Array<{ type: string; weight: number; available: boolean }>;
  khasLand: boolean;
  mutationStatus: 'mutated' | 'not_mutated' | 'mutated_without_deed';
  mutationWeight: string;
  recordOfRightsAnalysis: string;
}

export interface Stage25Result {
  saleValidity: SaleValidityCheck;
  doubleSale?: DoubleSaleAnalysis;
  ostensibleOwner?: OstensibleOwnerCheck;
  feedingGrant?: FeedingGrantCheck;
  lisPendens?: LisPendensCheck;
  fraudulentTransfer?: FraudulentTransferCheck;
  mortgage?: MortgageAnalysis;
  lease?: LeaseAnalysis;
  satAct?: SATAnalysis;
  flags: Array<{ id: string; severity: Severity; message: string; legalRef: string }>;
}

// ─── STAGE 3: PRECONDITION FILTERS ────────────────────────────────────────
export interface RegistrationCheck {
  isCompulsorilyRegistrable: boolean;
  isRegistered: boolean;
  admissibleForTitle: boolean;
  admissibleForCollateral: boolean;
  collateralPurpose?: string;
  section17: boolean;
  section49: boolean;
}

export interface StampCheck {
  sufficientlyStamped: boolean;
  impounded: boolean;
  penaltyRequired: boolean;
  penaltyAmount?: number;
  status: 'pass' | 'impounded' | 'penalty_pending' | 'admitted_with_penalty';
}

export interface PreconditionResult {
  registration: RegistrationCheck;
  stamp: StampCheck;
  possession: PossessionInfo;
  mutation: { status: string; weight: string; nonConclusive: boolean };
  bars: Array<{ id: string; severity: Severity; message: string; legalRef: string }>;
  passed: boolean;
  criticalBlockers: string[];
}

// ─── STAGE 4: LIMITATION ENGINE ───────────────────────────────────────────
export interface LimitationEntry {
  suitType: string;
  article: string;
  period: string;
  computedDeadline?: string;
  daysRemaining?: number;
  status: 'within_time' | 'at_risk' | 'barred';
  startDate: string;
  overrides?: Array<{ type: string; description: string; section: string }>;
}

export interface Stage4Result {
  primaryLimitation: LimitationEntry;
  allApplicable: LimitationEntry[];
  condonationAvailable: boolean;
  condonationBasis?: string;
  acknowledgementResets: boolean;
  partPaymentResets: boolean;
  fraudConcealment: boolean;
  suitTimeBarred: boolean;
  gateResult: 'pass' | 'barred' | 'condonable';
}

// ─── STAGE 5: ARTHA RIN ADALAT ────────────────────────────────────────────
export interface ArthaRinResult {
  eligible: boolean;
  preLitigationMediation: {
    mandatory: boolean;
    mediationPeriod: string;
    noticeIssued: boolean;
    mediationStatus: 'pending' | 'success' | 'failed';
  };
  requiredDocuments: string[];
  limitationStrict: boolean;
  interimOrders: string[];
  appealTrack: string;
  pecuniaryCap: 'none';
  section: string;
}

// ─── STAGE 6: ORDER 37 SUMMARY SUIT ──────────────────────────────────────
export interface Order37Result {
  eligible: boolean;
  basis: string;
  defendantAppeared: boolean;
  leaveToDefend: 'not_applied' | 'granted' | 'refused' | 'pending';
  triableIssueExists: boolean;
  outcome: 'summary_decree' | 'transferred_to_ordinary' | 'pending';
  limitation: string;
}

// ─── STAGE 7: SRA ENGINE ──────────────────────────────────────────────────
export interface PossessionTrack {
  track: 'S9_summary' | 'S8_title';
  trigger: string;
  limitation: string;
  elements: Array<{ name: string; met: boolean; description: string }>;
  allMet: boolean;
  titleExamined: boolean;
  outcome: string;
}

export interface SpecificPerformanceCheck {
  s14BarCheck: {
    bars: Array<{ bar: string; applicable: boolean; description: string }>;
    anyBarApplies: boolean;
    spRefusedUnderS14: boolean;
  };
  s16PersonalBar: {
    bars: Array<{ bar: string; applicable: boolean; description: string }>;
    anyBarApplies: boolean;
    readinessWillingnessProven: boolean;
  };
  s21ContractValid: {
    inWriting: boolean;
    termsCertain: boolean;
    considerationExists: boolean;
    noIllegality: boolean;
    partiesCompetent: boolean;
    allValid: boolean;
  };
  s10DamagesInadequate: {
    presumedInadequate: boolean;
    immovableProperty: boolean;
    damagesAdequate: boolean;
  };
  s22Discretion: {
    againstFactors: string[];
    inFavourFactors: string[];
    netAssessment: 'favour' | 'against' | 'neutral';
  };
  finalOutcome: 'granted' | 'refused' | 'conditional' | 'damages_in_lieu';
  conditions?: string[];
}

export interface DeclarationCheck {
  standing: boolean;
  standingIssue?: string;
  furtherReliefBar: boolean;
  furtherReliefAvailable?: string;
  maintainable: boolean;
  maintainabilityIssue?: string;
  governmentDefendant: boolean;
  s80NoticeGiven: boolean;
  outcome: 'granted' | 'refused' | 'amendment_directed';
}

export interface CancellationCheck {
  voidableOrVoid: 'voidable' | 'void';
  grounds: Array<{ ground: string; proven: boolean; description: string }>;
  limitationCheck: { within3Years: boolean; deadline?: string };
  restitution: { required: boolean; terms?: string };
  outcome: 'granted' | 'refused';
}

export interface TemporaryInjunction {
  primaFacieCase: boolean;
  balanceOfConvenience: string;
  irreparableInjury: boolean;
  allThreeMet: boolean;
  procedure: string[];
  exParteAvailable: boolean;
  outcome: 'ad_interim' | 'interim' | 'refused';
}

export interface PermanentInjunction {
  breachOfObligation: boolean;
  compensationInadequate: boolean;
  multipleParties: boolean;
  mandatoryInjunction: boolean;
  bars: Array<{ bar: string; applies: boolean; description: string; section: string }>;
  outcome: 'permanent' | 'mandatory' | 'refused';
}

export interface Stage7Result {
  possession?: PossessionTrack;
  specificPerformance?: SpecificPerformanceCheck;
  declaration?: DeclarationCheck;
  cancellation?: CancellationCheck;
  temporaryInjunction?: TemporaryInjunction;
  permanentInjunction?: PermanentInjunction;
  applicableReliefs: ReliefType[];
}

// ─── STAGE 8: EVIDENCE ENGINE ─────────────────────────────────────────────
export interface EvidenceItem {
  type: string;
  description: string;
  weight: number; // 0-10
  legalRef: string;
  admissible: boolean;
  bar?: string;
}

export interface Stage8Result {
  documentHierarchy: EvidenceItem[];
  evidenceActRules: Array<{ section: string; rule: string; application: string }>;
  burdenOfProof: string;
  adversarialThreshold: string;
  digitalEvidenceAdmissible: boolean;
  s65bCertificate: boolean;
  evidenceStrength: number; // 0-100
  keyWeaknesses: string[];
  keyStrengths: string[];
}

// ─── STAGE 9: PROCEDURAL DEFECT ENGINE ─────────────────────────────────────
export interface ProceduralDefect {
  code: string; // 9A, 9B, etc.
  name: string;
  detected: boolean;
  severity: Severity;
  outcome: 'rejection' | 'return' | 'amendment' | 'proceed' | 'bar';
  section: string;
  description: string;
}

export interface Stage9Result {
  defects: ProceduralDefect[];
  fatalDefects: ProceduralDefect[];
  waivableDefects: ProceduralDefect[];
  suitProceedable: boolean;
  blockingDefect: string | null;
}

// ─── STAGE 10: PARTITION ENGINE ────────────────────────────────────────────
export interface PartitionResult {
  coOwnershipEstablished: boolean;
  coSharers: Array<{ name: string; share: string }>;
  physicallyDivisible: boolean;
  preliminaryDecree: { sharesDetermined: boolean; appealable: boolean };
  commissionerRequired: boolean;
  finalDecree: { issued: boolean; mode: 'physical_division' | 'sale_distribution' };
  mutationRequired: boolean;
  limitationRisk: string;
}

// ─── STAGE 11: ADVERSE POSSESSION ENGINE ───────────────────────────────────
export interface AdversePossessionElement {
  name: string;
  description: string;
  proven: boolean;
  evidence: string;
}

export interface AdversePossessionResult {
  position: 'defence' | 'claim';
  elements: AdversePossessionElement[];
  allElementsMet: boolean;
  continuousYears?: number;
  gaps?: string[];
  tackingAvailable: boolean;
  outcome: 'title_by_limitation' | 'defence_succeeds' | 'defence_fails' | 'claim_dismissed';
}

// ─── STAGE 12: PRE-EMPTION ENGINE ──────────────────────────────────────────
export interface PreEmptionResult {
  applicable: boolean;
  claimantType: string;
  priority: number;
  limitation4Months: boolean;
  deadlineDate?: string;
  daysRemaining?: number;
  preDepositMade: boolean;
  preDepositAmount?: number;
  saleConsideration?: number;
  noticeToPurchaser: boolean;
  multipleClaimants: boolean;
  proRataDivision: boolean;
  outcome: 'substitution_granted' | 'suit_dismissed' | 'pending_deposit';
}

// ─── STAGE 13: APPEAL + REVISION ──────────────────────────────────────────
export interface AppealResult {
  standardLadder: Array<{ from: string; to: string; section: string }>;
  appealAvailable: boolean;
  appealForum: string;
  secondAppealAvailable: boolean;
  secondAppealGround: string;
  revisionAvailable: boolean;
  revisionGrounds: string[];
  reviewAvailable: boolean;
  reviewGrounds: string[];
  reviewDeadline: string;
  transferAvailable: boolean;
  stayOfExecution: boolean;
  stayConditions: string[];
}

// ─── STAGE 14: EXECUTION ENGINE ───────────────────────────────────────────
export interface ExecutionResult {
  trigger: boolean;
  decreeType: string;
  modes: Array<{ mode: string; applicable: boolean; description: string }>;
  applicationWithinLimit: boolean;
  limitationPeriod: string;
  objections: string[];
  contemptAvailable: boolean;
  arrestAllowed: boolean;
  garnisheeAvailable: boolean;
  outcome: string;
}

// ─── FINAL DECISION ENGINE ────────────────────────────────────────────────
export interface DecisionOutput {
  outcomeType: OutcomeType;
  grantedReliefs: Array<{ relief: ReliefType; description: string; legalRef: string }>;
  refusedReliefs: Array<{ relief: ReliefType; reason: string; legalRef: string }>;
  conditions?: string[];
  postDecreePath: 'complied' | 'execution' | 'appealed' | 'contempt';
  overallStrength: 'STRONG' | 'MODERATE' | 'WEAK';
  winProbability: number;
  estimatedTimeRange: string;
  riskFactors: string[];
  strategicRecommendations: string[];
}

// ─── STAGE PIPELINE RESULT ────────────────────────────────────────────────
export interface StagePipelineResult {
  stageNumber: number;
  stageName: string;
  status: 'pending' | 'running' | 'completed' | 'skipped' | 'error';
  severity: Severity;
  summary: string;
  legalRef: string;
  flags: Array<{ id: string; severity: Severity; message: string; legalRef: string }>;
  startedAt?: string;
  completedAt?: string;
}

// ─── CLIENT ADVISORY ──────────────────────────────────────────────────────
export interface ClientAdvisory {
  winChance: string;
  estimatedTime: string;
  costRisk: string;
  advice: string;
  criticalActions: string[];
  warnings: string[];
  nextSteps: string[];
}

// ─── STRATEGY ──────────────────────────────────────────────────────────────
export interface StrategyPhase {
  phase: number;
  name: string;
  timeline: string;
  actions: string[];
  legalRefs: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface StrategyResult {
  optimalReliefPath: string[];
  phases: StrategyPhase[];
  keyMilestones: string[];
  riskMitigation: string[];
  estimatedCostRange: string;
  confidenceLevel: number;
  disclaimer: string;
}

// ─── ARGUMENT TREES ────────────────────────────────────────────────────────
export interface ArgumentNode {
  id: string;
  label: string;
  type: 'supporting' | 'weakening' | 'neutral';
  strength: number;
  children?: ArgumentNode[];
  legalRef?: string;
  factBasis?: string;
  evidenceStrength?: number;
}

export interface ArgumentTree {
  plaintiff: ArgumentNode;
  defendant: ArgumentNode;
}

// ─── FULL ANALYSIS RESULT ─────────────────────────────────────────────────
export interface FullAnalysisResult {
  caseId: string;
  engineVersion: string;
  pipeline: StagePipelineResult[];

  // Stage results
  stage0?: Stage0Result;
  stage1?: Stage1Result;
  stage2?: Stage2Result;
  stage25?: Stage25Result;
  stage3?: PreconditionResult;
  stage4?: Stage4Result;
  stage5?: ArthaRinResult;
  stage6?: Order37Result;
  stage7?: Stage7Result;
  stage8?: Stage8Result;
  stage9?: Stage9Result;
  stage10?: PartitionResult;
  stage11?: AdversePossessionResult;
  stage12?: PreEmptionResult;
  stage13?: AppealResult;
  stage14?: ExecutionResult;

  // Final
  decision: DecisionOutput;
  clientSummary: ClientAdvisory;
  strategy: StrategyResult;
  argumentTree: ArgumentTree;

  // Quick access
  overallScore: number;
  overallRisk: 'STRONG' | 'MODERATE' | 'WEAK';
  executedAt: string;
}

// ─── CASE FACTS INPUT (enhanced from form) ────────────────────────────────
export interface CaseFacts {
  // Core identification
  disputeType: string;
  description: string;
  causeOfActionDate: string;

  // Parties
  plaintiff: string;
  plaintiffType?: string;
  defendant: string;
  defendantType?: string;
  isBankCreditor?: boolean;
  isGovernmentDefendant?: boolean;
  isNegotiableInstrument?: boolean;

  // Property
  mouza?: string;
  upazila?: string;
  district?: string;
  dag?: string;
  khatian?: string;
  classification?: string;
  landArea?: string;
  boundaries?: { north: string; south: string; east: string; west: string };

  // Transaction
  deedType?: string;
  registrationDate?: string;
  consideration?: string;
  stampDutyOk?: boolean;
  registered?: boolean;
  multipleSales?: boolean;
  transferDuringLis?: boolean;

  // Possession
  currentPossessor?: string;
  possessionStartDate?: string;
  possessionNature?: string;
  physicalActs?: string[];
  dispossessionDate?: string;

  // Document validity
  s17Compliant?: boolean;
  s49Inadmissible?: boolean;
  benamiFlag?: boolean;

  // TPA specific
  poaHolder?: string;
  ostensibleOwner?: boolean;
  fraudulentIntent?: boolean;

  // Inheritance
  religion?: string;
  inheritance?: string;

  // SAT Act
  khasLand?: boolean;
  ceilingExceeded?: boolean;
  mutationStatus?: string;
  acquisitionOrder?: string;

  // Chronology
  knowledgeOfFraudDate?: string;
  filingDate?: string;

  // SRA
  plaintiffReadyWilling?: boolean;

  // Payment (money suits)
  amountClaimed?: number;
  defaultDate?: string;
  instrumentType?: string; // promissory note, bill of exchange, cheque

  // Pre-emption
  preEmptionClaim?: boolean;
  saleConsideration?: number;
  preDepositMade?: boolean;

  // Partition
  partitionClaim?: boolean;
  coSharers?: string;

  // Adverse possession
  adversePossessionClaim?: boolean;
  adversePossessionYears?: number;

  // Government notice
  s80NoticeGiven?: boolean;
}
