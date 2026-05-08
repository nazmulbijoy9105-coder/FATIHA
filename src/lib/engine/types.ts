// ─── JesAI Knowledge Store — Core Types ──────────────────────
// NLC validates every entry before it goes live.

export type Jurisdiction =
  | "BD"
  | "US"
  | "UK"
  | "Australia"
  | "Canada"
  | "India"
  | "Germany"
  | "China"
  | "BD+US"
  | "BD+UK"
  | "BD+Australia"
  | "BD+Canada"
  | "BD+India"
  | "MULTI";

export type Certainty = "confirmed" | "arguable" | "verify-with-lawyer";

export type LawArea =
  | "constitutional"
  | "criminal"
  | "property"
  | "family"
  | "contract"
  | "labour"
  | "company"
  | "tax"
  | "nrb"
  | "administrative"
  | "evidence"
  | "general";

// ── A single legal rule ───────────────────────────────────────
export interface LegalRule {
  id: string;
  area: LawArea;
  jurisdiction: Jurisdiction;
  title: string;
  rule: string;
  source: string;
  certainty: Certainty;
  tags: string[];
  lastVerified: string;
  nlcNote?: string;
}

// ── A Q&A entry ───────────────────────────────────────────────
export interface QAEntry {
  id: string;
  area: LawArea;
  jurisdiction: Jurisdiction;
  triggerKeywords: string[];
  question: string;
  irac: {
    issue: string;
    rule: string;
    application: string;
    conclusion: string;
  };
  escalate: boolean;
  escalateReason?: string;
  relatedRules: string[];
  lastVerified: string;
}

// ── Subject area module ───────────────────────────────────────
export interface KnowledgeModule {
  area: LawArea;
  label: string;
  description: string;
  rules: LegalRule[];
  qaBank: QAEntry[];
}

// ── Query result ──────────────────────────────────────────────
export interface KnowledgeResult {
  matched: boolean;
  area: LawArea | null;
  qaEntry: QAEntry | null;
  rules: LegalRule[];
  escalate: boolean;
  escalateReason?: string;
  confidence: "high" | "medium" | "low";
}
