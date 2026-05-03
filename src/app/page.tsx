'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Scale, LayoutDashboard, FilePlus, FolderOpen, Eye, EyeOff, Flame, Zap,
  GitBranch, Briefcase, ClipboardCopy, Shuffle, Sword, Users, Layers,
  Settings, LogOut, Lock, ChevronDown, ChevronRight, ChevronLeft,
  Search, Plus, AlertTriangle, CheckCircle2, XCircle, Clock, Shield,
  TrendingUp, MapPin, FileText, Gavel, Landmark, ArrowRight, Menu,
  X, Crown, Star, Target, Timer, DollarSign, BarChart3, CircleDot,
  ChevronUp, ExternalLink, Copy, Info, Sparkles, Loader2, AlertCircle,
  CreditCard, Building2, Wallet, Receipt, Banknote, UserCheck, UserX, ArrowLeft,
  CircleCheck, CircleX, Send, Check, BadgeCheck, BadgeX, ArrowLeftRight, KeyRound,
  Phone, Mail, UserCog, Activity, PieChart, ShieldCheck, MonitorSmartphone,
  WalletCards, LandPlot, ScrollText, Handshake, Stamp, Fingerprint,
} from 'lucide-react';
import type { FullAnalysisResult, CaseFacts } from '@/lib/engine/types';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════
type ViewMode = 'auth' | 'user-dash' | 'admin-dash' | 'new-case' | 'cases' | 'case-detail';
type UserTab = 'overview' | 'my-cases' | 'subscription' | 'payment-history';
type AdminTab = 'overview' | 'pipeline' | 'users' | 'all-cases' | 'payments' | 'settings';

interface UserInfo {
  id: string; email: string; name: string; phone?: string;
  role: 'admin' | 'user'; plan: 'free' | 'pro' | 'enterprise';
}

interface CaseItem {
  id: string; caseNumber: string; title: string; status: string;
  plaintiff: string; defendant: string; court?: string | null;
  mouza?: string | null; dag?: string | null; khatian?: string | null;
  description?: string | null; factsJson?: string | null;
  analysisJson?: string | null; scoreJson?: string | null;
  userId?: string | null; createdAt: string; updatedAt: string;
}

interface PaymentItem {
  id: string; userId: string; userName: string; userEmail: string;
  userPhone: string; plan: 'pro' | 'enterprise'; amount: number;
  currency: string; method: 'bkash' | 'nagad' | 'bank';
  transactionId: string; status: 'pending' | 'verified' | 'rejected' | 'expired';
  verifiedBy?: string; verifiedAt?: string; rejectionReason?: string;
  note?: string; createdAt: string; updatedAt: string;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS — DISPUTE TYPES
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

// ═══════════════════════════════════════════════════════════════
// CONSTANTS — CASE TYPE REFERENCE
// ═══════════════════════════════════════════════════════════════
const CASE_TYPE_REFERENCE = [
  { num: 1, name: 'Title Suit (T.S.)', desc: 'Declaration + Recovery of Possession + Partition + SP + Injunction' },
  { num: 2, name: 'Injunction Suit', desc: 'Temporary (during case) / Permanent (final relief)' },
  { num: 3, name: 'Partition Suit', desc: 'Between co-owners' },
  { num: 4, name: 'Declaration Suit', desc: 'Legal rights/status' },
  { num: 5, name: 'Specific Performance Suit', desc: 'Enforce contract (SRA 1877)' },
  { num: 6, name: 'Money Suit', desc: 'Recovery of money/debt' },
  { num: 7, name: 'Rent Suit', desc: 'Landlord-tenant disputes' },
  { num: 8, name: 'Ejectment Suit', desc: 'Evict unauthorized occupants' },
  { num: 9, name: 'Probate / Administration', desc: 'Inheritance of deceased estate' },
  { num: 10, name: 'Miscellaneous Civil (M.C.)', desc: 'Injunction petitions, stay applications' },
  { num: 11, name: 'Execution Case (E.C.)', desc: 'Enforce court decree' },
  { num: 12, name: 'Appeal / Revision', desc: 'Civil Appeal (C.A.), Civil Revision (C.R.)' },
];

const LIMITATION_PERIODS = [
  { type: 'Recovery of Possession', period: '12 years', ref: 'Art. 64/65' },
  { type: 'Declaration of Title', period: '6 years', ref: 'Art. 120' },
  { type: 'Specific Performance', period: '1 year', ref: 'Art. 113 (Amended 2004)' },
  { type: 'Injunction', period: '3 years', ref: 'Art. 136' },
  { type: 'Fraud/Cancellation', period: '3 years from discovery', ref: 'Art.91/Art.95' },
  { type: 'Mortgage', period: '12 years', ref: 'Art. 132' },
  { type: 'Money Recovery', period: '3 years', ref: 'Art. 113' },
  { type: 'Pre-emption', period: '4 months', ref: 'SRA S.96' },
  { type: 'Possessory Reference', period: '6 months', ref: 'Art. 144' },
];

const DECISION_TREE_NODES = [
  { q: 'Q1: What is the main problem?', options: [
    { label: 'LAND/PROPERTY', next: 'Q2' },
    { label: 'MONEY only', answer: 'Money Suit' },
    { label: 'CONTRACT', answer: 'Specific Performance Suit (SRA 1877)' },
    { label: 'COURT ORDER exists', answer: 'Execution Case (E.C.)' },
  ]},
  { q: 'Q2: If LAND/PROPERTY —', options: [
    { label: 'Claim ownership', answer: 'Title Suit (Declaration + Possession)' },
    { label: 'Co-owner wants division', answer: 'Partition Suit' },
    { label: 'Someone selling/interfering', answer: 'Injunction Suit' },
    { label: 'Illegal occupation', answer: 'Ejectment / Recovery of Possession' },
    { label: 'Deed validity dispute', answer: 'Declaration Suit' },
  ]},
  { q: 'Q3: CONTRACT issue —', options: [
    { label: 'Valid but not performed', answer: 'Specific Performance' },
    { label: 'Broken, only loss', answer: 'Money Suit / Damages' },
  ]},
  { q: 'Q4: FAMILY/INHERITANCE —', options: [
    { label: 'Inheritance/Will', answer: 'Probate / Administration' },
    { label: 'Division of inherited', answer: 'Partition Suit' },
  ]},
  { q: 'Q5: TENANCY →', options: [
    { label: 'Landlord-tenant dispute', answer: 'Rent Suit' },
  ]},
  { q: 'Q6: JUDGMENT not executed →', options: [
    { label: 'Court decree not enforced', answer: 'Execution Case' },
  ]},
  { q: 'Q7: URGENT protection only →', options: [
    { label: 'Need immediate court order', answer: 'Injunction Petition (M.C. Case)' },
  ]},
];

// ═══════════════════════════════════════════════════════════════
// CONSTANTS — ADMIN PIPELINE (hidden from users)
// ═══════════════════════════════════════════════════════════════
const ADMIN_PIPELINE_STAGES = [
  { num: 0, name: 'Entry Gate', ref: 'CPC S.9, S.11, S.16, S.20 — Track, Suit, Jurisdiction', color: 'bg-emerald-500' },
  { num: 1, name: 'Fact Extraction', ref: 'CPC O.7 + Evidence Act — Parties, Property, Documents', color: 'bg-emerald-400' },
  { num: 2, name: 'Legal Classification', ref: 'Mapping Engine — 17 Dispute Tracks (2A–2P)', color: 'bg-teal-500' },
  { num: 3, name: 'TPA + SAT Act Engine', ref: 'TPA S.5–S.117, SAT Act — Double Sale, Fraud, Mortgage', color: 'bg-green-500' },
  { num: 4, name: 'Precondition Filters', ref: 'Registration Act S.17/S.49, Stamp Act', color: 'bg-yellow-500' },
  { num: 5, name: 'Limitation Engine', ref: 'Limitation Act — Art.64/65/113/120/142', color: 'bg-red-500' },
  { num: 6, name: 'Artha Rin Adalat', ref: 'Artha Rin Ain 2003 — Bank/FI Money Recovery', color: 'bg-orange-500' },
  { num: 7, name: 'Order 37 Summary Suit', ref: 'CPC O.37 — Negotiable Instruments', color: 'bg-orange-400' },
  { num: 8, name: 'SRA Relief Engine', ref: 'SRA S.8–S.57 — SP, Declaration, Cancellation, Injunction', color: 'bg-green-400' },
  { num: 9, name: 'Evidence Engine', ref: 'Evidence Act S.91–S.114 — Hierarchy, Strength', color: 'bg-teal-400' },
  { num: 10, name: 'Procedural Defects', ref: 'CPC O.7 R.11, O.1 R.9 — Fatal/Waivable', color: 'bg-amber-500' },
  { num: 11, name: 'Partition Engine', ref: 'CPC S.54 — Co-ownership, Physical Division', color: 'bg-blue-500' },
  { num: 12, name: 'Adverse Possession', ref: 'Limitation Act Art.142 — 12-year Possession', color: 'bg-red-400' },
  { num: 13, name: 'Pre-emption Engine', ref: 'SAT Act S.96 — Co-sharer/Tenant Rights', color: 'bg-purple-500' },
  { num: 14, name: 'Appeal + Revision', ref: 'CPC S.96/100/115, O.47 — Ladder Analysis', color: 'bg-indigo-500' },
  { num: 15, name: 'Final Decision', ref: 'CPC + SRA + TPA — Outcome, Reliefs, Risk, Strategy', color: 'bg-emerald-600' },
];

// ═══════════════════════════════════════════════════════════════
// CONSTANTS — PARTY TYPES (Civil Case Parties)
// ═══════════════════════════════════════════════════════════════
const CIVIL_CASE_PARTIES = [
  'Plaintiff',
  'Defendant',
  'Proforma Defendant',
  'Necessary Party',
  'Proper Party',
  'Formal Party',
  'Third Party',
  'Intervenor',
  'Legal Representative (LR)',
  'Guardian (for minor/unsound person)',
  'Next Friend',
  'Power of Attorney Holder',
  'Transferee Pendente Lite',
  'Co-plaintiff',
  'Co-defendant',
];

const DOCUMENT_EVIDENCE_PARTIES = [
  'Vendor (Seller)',
  'Purchaser (Buyer)',
  'Co-sharer',
  'Donor',
  'Donee',
  'Mortgagor',
  'Mortgagee',
  'Lessor (Landlord)',
  'Lessee (Tenant)',
  'Licensor',
  'Licensee',
  'Executor',
  'Testator',
  'Beneficiary',
  'Legal Heir',
  'Successor-in-interest',
  'Power of Attorney (PoA) Holder',
  'Principal (PoA giver)',
  'Witness',
  'Attesting Witness',
  'Identifier (Deed identifier)',
  'Scribe / Deed Writer',
  'Advocate',
  'Guarantor',
  'Surety',
  'Possessor (Actual occupier)',
  'Adverse Possessor',
  'Mutated Owner (Record holder)',
  'Government / State Authority',
  'AC Land / Revenue Officer',
  'Settlement Authority',
  'Waqf Mutawalli',
  'Trustee',
];

const GOVERNMENT_PARTY_SECTIONS = [
  { section: 'CPC S.79', desc: 'Government as Defendant — suits against Government in prescribed manner', role: 'Defendant' },
  { section: 'CPC O.27 R.5–9', desc: 'Government as Necessary/Proforma Party — when government interest affected', role: 'Proforma / Necessary Party' },
  { section: 'SRA S.95', desc: 'Government Notice — pre-emption notice to Government for khas land', role: 'Necessary Party' },
  { section: 'TPA S.52', desc: 'Government Authority — acquisition authority affected by transfer', role: 'Proforma Defendant' },
  { section: 'CPC S.80', desc: 'Two-month notice to Government before filing suit', role: 'Procedural Requirement' },
  { section: 'Land Acquisition Act S.4', desc: 'Government acquiring authority — acquisition proceedings pending', role: 'Defendant / Proforma' },
  { section: 'State Acquisition & Tenancy Act S.96', desc: 'Board of Revenue — ceiling excess land matters', role: 'Necessary Party' },
  { section: 'Vested Property Act', desc: 'Government as custodian of vested property', role: 'Defendant' },
];

const AUTO_DETECT_KEYWORDS: Record<string, string> = {
  'title suit': 'Title Suit (T.S.) — Declaration + Recovery of Possession',
  'declaration': 'Declaration Suit — Legal Rights/Status',
  'possession': 'Ejectment Suit — Evict Unauthorized Occupants',
  'injunction': 'Injunction Suit — Temporary / Permanent',
  'partition': 'Partition Suit — Between Co-Owners',
  'specific performance': 'Specific Performance Suit — Enforce Contract (SRA 1877)',
  'money': 'Money Suit — Recovery of Money/Debt',
  'rent': 'Rent Suit — Landlord-Tenant Disputes',
  'ejectment': 'Ejectment Suit — Evict Unauthorized Occupants',
  'probate': 'Probate / Administration — Inheritance of Deceased Estate',
  'execution': 'Execution Case (E.C.) — Enforce Court Decree',
  'appeal': 'Appeal / Revision — Civil Appeal (C.A.), Civil Revision (C.R.)',
  'fraud': 'Title Suit (T.S.) — Declaration + Recovery of Possession',
  'sale deed': 'Title Suit (T.S.) — Declaration + Recovery of Possession',
  'ownership': 'Title Suit (T.S.) — Declaration + Recovery of Possession',
  'co-owner': 'Partition Suit — Between Co-Owners',
  'tenant': 'Rent Suit — Landlord-Tenant Disputes',
  'inheritance': 'Probate / Administration — Inheritance of Deceased Estate',
  'stay': 'Miscellaneous Civil (M.C.) — Injunction Petitions, Stay Applications',
  'deed': 'Title Suit (T.S.) — Declaration + Recovery of Possession',
};

const SUBSCRIPTION_PLANS = [
  { id: 'free' as const, name: 'Free', price: 0, period: 'Forever', features: ['Up to 2 cases', 'Basic case overview', 'Court jurisdiction reference', 'Case type decision tree', 'Limitation period lookup'], limits: ['Evidence Analysis', 'Fraud Detection', 'Injunction Analysis', 'Relief Optimizer', 'Client Advisory', 'Arguments Builder', 'Strategy Engine'], recommended: false },
  { id: 'pro' as const, name: 'PRO', price: 999, period: 'Monthly', features: ['Up to 20 cases', 'Full case overview', 'Evidence analysis & scoring', 'Fraud detection engine', 'Injunction analysis', 'Relief optimizer', 'Client advisory report', 'Arguments builder', 'Strategy engine', 'Priority support'], limits: [], recommended: true },
  { id: 'enterprise' as const, name: 'Enterprise', price: 4999, period: 'Monthly', features: ['Unlimited cases', 'All PRO features', 'API access', 'Bulk case import', 'Priority analysis', 'Custom legal templates', 'Dedicated support', 'Team collaboration'], limits: [], recommended: false },
];

const PAYMENT_METHODS = [
  { id: 'bkash' as const, name: 'bKash', number: '01712-345678', type: 'Send Money', color: '#E2136E', bgColor: 'bg-pink-600', instructions: ['Open bKash app', 'Tap "Send Money"', 'Enter: 01712-345678', 'Enter the plan amount', 'Reference: FATIHA-PRO', 'Confirm & note Transaction ID'] },
  { id: 'nagad' as const, name: 'Nagad', number: '01712-345678', type: 'Send Money', color: '#F6921E', bgColor: 'bg-orange-500', instructions: ['Open Nagad app', 'Tap "Send Money"', 'Enter: 01712-345678', 'Enter the plan amount', 'Reference: FATIHA-PRO', 'Confirm & note Transaction ID'] },
  { id: 'bank' as const, name: 'Bank Transfer', number: '1234567890', type: 'Bank Transfer', color: '#1E88E5', bgColor: 'bg-blue-600', bankName: 'Dutch-Bangla Bank (DBBL)', accountName: 'FATIHA Legal Engineering', branch: 'Gulshan, Dhaka', routing: '090260367', instructions: ['Transfer via bank app or branch', 'A/C: Dutch-Bangla Bank Limited', 'Name: FATIHA Legal Engineering', 'A/C No: 1234567890', 'Branch: Gulshan, Dhaka', 'Routing: 090260367', 'Note the Transaction Reference'] },
];

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function FatihaPage() {
  const { toast } = useToast();

  // ─── Core State ───
  const [view, setView] = useState<ViewMode>('auth');
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ─── Auth State ───
  const [authRole, setAuthRole] = useState<'user' | 'admin' | null>(null);
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');
  const [signinEmail, setSigninEmail] = useState('');
  const [signinPassword, setSigninPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [googleAuthAvailable, setGoogleAuthAvailable] = useState(false);

  // ─── Password Visibility & Remember Me ───
  const [showSigninPassword, setShowSigninPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirm, setShowSignupConfirm] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // ─── Forgot Password ───
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotShowPassword, setForgotShowPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  // ─── Tab State ───
  const [userTab, setUserTab] = useState<UserTab>('overview');
  const [adminTab, setAdminTab] = useState<AdminTab>('overview');

  // ─── Cases State ───
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [casesLoading, setCasesLoading] = useState(false);
  const [casesSearch, setCasesSearch] = useState('');
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [analysisResult, setAnalysisResult] = useState<FullAnalysisResult | null>(null);
  const [detailTab, setDetailTab] = useState('overview');

  // ─── New Case Form State ───
  const [formTitle, setFormTitle] = useState('');
  const [formPlaintiff, setFormPlaintiff] = useState('');
  const [formDefendant, setFormDefendant] = useState('');
  const [formDisputeType, setFormDisputeType] = useState('');
  const [formCauseDate, setFormCauseDate] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formMouza, setFormMouza] = useState('');
  const [formUpazila, setFormUpazila] = useState('');
  const [formDistrict, setFormDistrict] = useState('');
  const [formDag, setFormDag] = useState('');
  const [formKhatian, setFormKhatian] = useState('');
  const [formClassification, setFormClassification] = useState('');
  const [formLandArea, setFormLandArea] = useState('');
  const [formDeedType, setFormDeedType] = useState('');
  const [formRegDate, setFormRegDate] = useState('');
  const [formConsideration, setFormConsideration] = useState('');
  const [formStampDuty, setFormStampDuty] = useState('');
  const [formPoaHolder, setFormPoaHolder] = useState('');
  const [formPossessor, setFormPossessor] = useState('');
  const [formPossStartDate, setFormPossStartDate] = useState('');
  const [formPossNature, setFormPossNature] = useState('');
  const [formPossActs, setFormPossActs] = useState('');
  const [formS17, setFormS17] = useState('');
  const [formS49, setFormS49] = useState('');
  const [formBenami, setFormBenami] = useState('');
  const [formStampOk, setFormStampOk] = useState('');
  const [formReligion, setFormReligion] = useState('');
  const [formApplicableLaw, setFormApplicableLaw] = useState('');
  const [formWillExists, setFormWillExists] = useState('');
  const [formMutation, setFormMutation] = useState('');
  const [formAcqMutation, setFormAcqMutation] = useState('');
  const [formCeilingExceeded, setFormCeilingExceeded] = useState('');
  const [formAcquisition, setFormAcquisition] = useState('');
  const [formAmountClaimed, setFormAmountClaimed] = useState('');
  const [formDefaultDate, setFormDefaultDate] = useState('');
  const [formInstrumentType, setFormInstrumentType] = useState('');
  const [formPreDeposit, setFormPreDeposit] = useState('');
  const [formS80Notice, setFormS80Notice] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [autoDetected, setAutoDetected] = useState(false);
  const [formInheritanceOpen, setFormInheritanceOpen] = useState(false);
  const [formStateOpen, setFormStateOpen] = useState(false);

  // ─── Login Role (persisted) ───
  const loginRole = typeof window !== 'undefined' ? (localStorage.getItem('fatiha-login-role') as 'user' | 'admin' | null) : null;
  const isAdminView = loginRole === 'admin';

  // ─── Admin State ───
  const [allUsers, setAllUsers] = useState<UserInfo[]>([]);
  const [allCases, setAllCases] = useState<CaseItem[]>([]);
  const [allPayments, setAllPayments] = useState<PaymentItem[]>([]);
  const [userPayments, setUserPayments] = useState<PaymentItem[]>([]);

  // ─── Upgrade Dialog State ───
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeStep, setUpgradeStep] = useState(0); // 0=plans, 1=method, 2=txid, 3=success
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'enterprise'>('pro');
  const [selectedMethod, setSelectedMethod] = useState<'bkash' | 'nagad' | 'bank'>('bkash');
  const [payTxId, setPayTxId] = useState('');
  const [payPhone, setPayPhone] = useState('');
  const [payNote, setPayNote] = useState('');
  const [paySubmitting, setPaySubmitting] = useState(false);

  // ─── Computed ───
  const isAdmin = user?.role === 'admin';
  const isProUser = user?.plan !== 'free';
  const totalCases = cases.length;
  const analyzedCases = cases.filter(c => c.status === 'analyzed').length;
  const strongCases = cases.filter(c => { try { return c.analysisJson ? JSON.parse(c.analysisJson).overallRisk === 'STRONG' : false; } catch { return false; } }).length;
  const pendingCases = cases.filter(c => c.status === 'draft').length;
  const filteredCases = cases.filter(c => c.title.toLowerCase().includes(casesSearch.toLowerCase()) || c.plaintiff.toLowerCase().includes(casesSearch.toLowerCase()) || c.defendant.toLowerCase().includes(casesSearch.toLowerCase()));
  const pendingPayments = allPayments.filter(p => p.status === 'pending');
  const totalRevenue = allPayments.filter(p => p.status === 'verified').reduce((s, p) => s + p.amount, 0);
  const pendingRevenue = pendingPayments.reduce((s, p) => s + p.amount, 0);

  // ═══════════════════════════════════════════════════════════════
  // AUTH FUNCTIONS
  // ═══════════════════════════════════════════════════════════════
  const checkSession = useCallback(async () => {
    try {
      // 1. Fast path: restore session from cached user info in localStorage
      const cachedUserInfo = localStorage.getItem('fatiha-user-info');
      if (cachedUserInfo) {
        try {
          const cachedUser = JSON.parse(cachedUserInfo) as UserInfo;
          if (cachedUser && cachedUser.id) {
            setUser(cachedUser);
            setView(localStorage.getItem('fatiha-login-role') === 'admin' ? 'admin-dash' : 'user-dash');
          }
        } catch { /* corrupt cache — ignore, will fall through to server check */ }
      }

      // 2. Background server verification
      const userId = localStorage.getItem('fatiha-user-id');
      if (!userId) { setUser(null); setView('auth'); return; }
      const res = await fetch(`/api/session?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user as UserInfo);
          setView(localStorage.getItem('fatiha-login-role') === 'admin' ? 'admin-dash' : 'user-dash');
          // Update cached info with latest server data
          localStorage.setItem('fatiha-user-info', JSON.stringify(data.user));
          return;
        }
        // Server says not authenticated — keep cached session if available
        // (handles ephemeral storage on Vercel serverless where DB resets)
        // Only clear if NO cached session exists at all (e.g., user was deleted)
        const hasCached = localStorage.getItem('fatiha-user-info');
        if (!hasCached) {
          localStorage.removeItem('fatiha-user-id');
          setUser(null); setView('auth');
        }
        // If cached session exists, keep it — user stays logged in via cache
        return;
      }
      // Non-ok response (e.g. 404/500) — keep cached session, don't clear
    } catch { /* network error — keep cached session, do NOT invalidate */ }
  }, []);

  useEffect(() => {
    const init = async () => {
      try { await fetch('/api/auth/seed', { method: 'POST' }); } catch { /* */ }
      try {
        const r = await fetch('/api/auth/login');
        if (r.ok) { const d = await r.json(); setGoogleAuthAvailable(d.googleAuthAvailable); }
      } catch { /* */ }
      // Restore remembered credentials
      const savedEmail = localStorage.getItem('fatiha-remember-email');
      const savedPass = localStorage.getItem('fatiha-remember-password');
      if (savedEmail) { setSigninEmail(savedEmail); setRememberMe(true); }
      if (savedPass) setSigninPassword(savedPass);
      await checkSession();
      setLoading(false);
    };
    init();
    const vis = () => { if (document.visibilityState === 'visible') checkSession(); };
    document.addEventListener('visibilitychange', vis);
    return () => document.removeEventListener('visibilitychange', vis);
  }, [checkSession]);

  const handleSignIn = async () => {
    if (!signinEmail || !signinPassword) { toast({ title: 'Error', description: 'Email and password required', variant: 'destructive' }); return; }
    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: signinEmail, password: signinPassword }) });
      const data = await res.json();
      if (res.ok && data.authenticated && data.user) {
        // Save/remember credentials
        if (rememberMe) {
          localStorage.setItem('fatiha-remember-email', signinEmail);
          localStorage.setItem('fatiha-remember-password', signinPassword);
        } else {
          localStorage.removeItem('fatiha-remember-email');
          localStorage.removeItem('fatiha-remember-password');
        }
        localStorage.setItem('fatiha-user-id', data.user.id);
        localStorage.setItem('fatiha-user-info', JSON.stringify(data.user));
        localStorage.setItem('fatiha-login-role', authRole || (data.user.role === 'admin' ? 'admin' : 'user'));
        setUser(data.user as UserInfo);
        setView(localStorage.getItem('fatiha-login-role') === 'admin' ? 'admin-dash' : 'user-dash');
        toast({ title: 'Welcome back!', description: `Signed in as ${data.user.name}` });
      } else { toast({ title: 'Sign in failed', description: data.error || 'Invalid credentials', variant: 'destructive' }); }
    } catch { toast({ title: 'Error', description: 'Connection failed', variant: 'destructive' }); }
    setAuthLoading(false);
  };

  const handleSignUp = async () => {
    if (!signupName || !signupEmail || !signupPassword) { toast({ title: 'Error', description: 'Name, email, password required', variant: 'destructive' }); return; }
    if (signupPassword !== signupConfirm) { toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' }); return; }
    if (signupPassword.length < 6) { toast({ title: 'Error', description: 'Password min 6 chars', variant: 'destructive' }); return; }
    setAuthLoading(true);
    try {
      const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: signupName, email: signupEmail, phone: signupPhone || undefined, password: signupPassword }) });
      if (res.ok) {
        const newUser = await res.json();
        localStorage.setItem('fatiha-user-id', newUser.id);
        localStorage.setItem('fatiha-user-info', JSON.stringify(newUser));
        localStorage.setItem('fatiha-login-role', 'user');
        setUser(newUser as UserInfo);
        setView('user-dash');
        toast({ title: 'Account created!', description: `Welcome, ${newUser.name}!` });
      }
      else { const d = await res.json(); toast({ title: 'Signup failed', description: d.error, variant: 'destructive' }); }
    } catch { toast({ title: 'Error', description: 'Connection failed', variant: 'destructive' }); }
    setAuthLoading(false);
  };

  const handleGoogleSignIn = () => {
    if (googleAuthAvailable) window.location.href = '/api/auth/signin/google';
    else toast({ title: 'Google Sign-In Coming Soon', description: 'Use email/password for now.' });
  };

  const handleSignOut = async () => {
    try { await fetch('/api/auth/signout', { method: 'POST' }); } catch { /* */ }
    localStorage.removeItem('fatiha-user-id');
    localStorage.removeItem('fatiha-user-info');
    localStorage.removeItem('fatiha-login-role');
    setUser(null); setView('auth'); setCases([]); setSelectedCase(null); setAnalysisResult(null);
    toast({ title: 'Signed out' });
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail || !forgotNewPassword) { toast({ title: 'Error', description: 'Email and new password required', variant: 'destructive' }); return; }
    if (forgotNewPassword !== forgotConfirmPassword) { toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' }); return; }
    if (forgotNewPassword.length < 6) { toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' }); return; }
    setForgotLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: forgotEmail, newPassword: forgotNewPassword }) });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: 'Password Reset', description: data.message });
        setForgotOpen(false); setForgotEmail(''); setForgotNewPassword(''); setForgotConfirmPassword('');
      } else { toast({ title: 'Reset Failed', description: data.error || 'Failed to reset password', variant: 'destructive' }); }
    } catch { toast({ title: 'Error', description: 'Connection failed', variant: 'destructive' }); }
    setForgotLoading(false);
  };

  // ═══════════════════════════════════════════════════════════════
  // DATA LOADING
  // ═══════════════════════════════════════════════════════════════
  const loadCases = useCallback(async () => {
    setCasesLoading(true);
    try {
      const url = user ? `/api/cases?userId=${user.id}` : '/api/cases';
      const r = await fetch(url);
      if (r.ok) { const d = await r.json(); setCases(Array.isArray(d) ? d : []); }
    } catch { setCases([]); }
    setCasesLoading(false);
  }, [user]);

  const loadAllCases = useCallback(async () => { try { const r = await fetch('/api/cases'); if (r.ok) { const d = await r.json(); setAllCases(Array.isArray(d) ? d : []); } } catch { /* */ } }, []);
  const loadUsers = useCallback(async () => { try { const r = await fetch('/api/users?adminKey=fatiha-admin-2024'); if (r.ok) { const data = await r.json(); setAllUsers(Array.isArray(data) ? data : []); } } catch { /* */ } }, []);
  const loadAllPayments = useCallback(async () => { try { const r = await fetch('/api/payments?adminKey=fatiha-admin-2024'); if (r.ok) { const d = await r.json(); setAllPayments(Array.isArray(d.payments) ? d.payments : []); } } catch { /* */ } }, []);
  const loadUserPayments = useCallback(async () => { if (!user) return; try { const r = await fetch(`/api/payments?userId=${user.id}`); if (r.ok) { const d = await r.json(); setUserPayments(Array.isArray(d.payments) ? d.payments : []); } } catch { /* */ } }, [user]);

  useEffect(() => {
    if ((view === 'user-dash' || view === 'cases' || view === 'admin-dash') && user) loadCases();
    if (view === 'admin-dash' && isAdmin) { loadAllCases(); loadUsers(); loadAllPayments(); }
    if (userTab === 'payment-history' || userTab === 'subscription') loadUserPayments();
  }, [view, user, userTab, loadCases, loadAllCases, loadUsers, loadAllPayments, loadUserPayments]);

  // Auto-close sidebar on mobile when view changes
  useEffect(() => { setSidebarOpen(false); }, [view]);

  // Redirect view='cases' to user-dash my-cases tab
  useEffect(() => {
    if (view === 'cases') { setUserTab('my-cases'); setView('user-dash'); }
  }, [view]);

  // ═══════════════════════════════════════════════════════════════
  // CASE FUNCTIONS
  // ═══════════════════════════════════════════════════════════════
  const viewCaseDetail = async (c: CaseItem) => {
    setSelectedCase(c); setView('case-detail'); setDetailTab('overview');
    if (c.analysisJson) { try { setAnalysisResult(JSON.parse(c.analysisJson)); } catch { setAnalysisResult(null); } } else { setAnalysisResult(null); }
  };

  const descTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!formDescription) { setAutoDetected(false); return; }
    clearTimeout(descTimerRef.current);
    descTimerRef.current = setTimeout(() => {
      const d = formDescription.toLowerCase();
      for (const [kw, dt] of Object.entries(AUTO_DETECT_KEYWORDS)) { if (d.includes(kw)) { setFormDisputeType(dt); setAutoDetected(true); return; } }
      setAutoDetected(false);
    }, 500);
    return () => clearTimeout(descTimerRef.current);
  }, [formDescription]);

  const handleAutoFill = async () => {
    if (!formDescription.trim()) { toast({ title: 'No Description', description: 'Enter a case description first', variant: 'destructive' }); return; }
    try {
      const res = await fetch('/api/auto-fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: formDescription }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Auto-fill failed'); }
      const data = await res.json();
      let changed = 0;
      // Apply each field only if current form field is empty
      if (data.title && !formTitle) { setFormTitle(data.title); changed++; }
      if (data.plaintiff && !formPlaintiff) { setFormPlaintiff(data.plaintiff); changed++; }
      if (data.defendant && !formDefendant) { setFormDefendant(data.defendant); changed++; }
      if (data.disputeType && !formDisputeType) { setFormDisputeType(data.disputeType); changed++; }
      if (data.deedType && !formDeedType) { setFormDeedType(data.deedType); changed++; }
      if (data.mouza && !formMouza) { setFormMouza(data.mouza); changed++; }
      if (data.upazila && !formUpazila) { setFormUpazila(data.upazila); changed++; }
      if (data.dag && !formDag) { setFormDag(data.dag); changed++; }
      if (data.khatian && !formKhatian) { setFormKhatian(data.khatian); changed++; }
      if (data.classification && !formClassification) { setFormClassification(data.classification); changed++; }
      if (data.causeDate && !formCauseDate) { setFormCauseDate(data.causeDate); changed++; }
      if (data.possessor && !formPossessor) { setFormPossessor(data.possessor); changed++; }
      if (data.possessionNature && !formPossNature) { setFormPossNature(data.possessionNature); changed++; }
      if (data.possessionDate && !formPossStartDate) { setFormPossStartDate(data.possessionDate); changed++; }
      if (data.physicalActs && !formPossActs) { setFormPossActs(data.physicalActs); changed++; }
      if (data.religion && !formReligion) { setFormReligion(data.religion); changed++; }
      if (data.ceilingExceeded && !formCeilingExceeded) { setFormCeilingExceeded(data.ceilingExceeded); changed++; }
      if (data.mutation && !formMutation) { setFormMutation(data.mutation); changed++; }
      if (data.poaHolder && !formPoaHolder) { setFormPoaHolder(data.poaHolder); changed++; }
      // Default document validity if not set
      if (!formS17 && data.s17) { setFormS17(data.s17); changed++; }
      if (!formS49 && data.s49) { setFormS49(data.s49); changed++; }
      if (!formBenami && data.benami) { setFormBenami(data.benami); changed++; }
      if (!formStampOk && data.stampOk) { setFormStampOk(data.stampOk); changed++; }
      // Auto-generate title
      if (!formTitle && (formPlaintiff || data.plaintiff) && (formDefendant || data.defendant)) {
        const p = formPlaintiff || data.plaintiff;
        const d = formDefendant || data.defendant;
        setFormTitle(`${p} v. ${d}`);
        changed++;
      }
      toast({ title: 'Auto-Fill Complete', description: `${changed} field(s) populated from description` });
    } catch (err) {
      toast({ title: 'Auto-Fill Error', description: err instanceof Error ? err.message : 'Failed to auto-fill', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormTitle(''); setFormPlaintiff(''); setFormDefendant(''); setFormDisputeType('');
    setFormCauseDate(''); setFormDescription(''); setFormMouza(''); setFormUpazila('');
    setFormDag(''); setFormKhatian(''); setFormClassification(''); setFormLandArea('');
    setFormDeedType(''); setFormRegDate(''); setFormConsideration(''); setFormStampDuty('');
    setFormPoaHolder(''); setFormPossessor(''); setFormPossStartDate(''); setFormPossNature('');
    setFormPossActs(''); setFormS17(''); setFormS49(''); setFormBenami(''); setFormStampOk('');
    setFormReligion(''); setFormApplicableLaw(''); setFormWillExists(''); setFormMutation('');
    setFormDistrict(''); setFormAmountClaimed(''); setFormDefaultDate('');
    setFormInstrumentType(''); setFormPreDeposit(''); setFormS80Notice('');
    setFormAcqMutation(''); setFormCeilingExceeded(''); setFormAcquisition(''); setAutoDetected(false);
  };

  const handleAnalyzeCase = async () => {
    if (!formTitle || !formPlaintiff || !formDefendant) { toast({ title: 'Missing fields', description: 'Title, Plaintiff, Defendant required', variant: 'destructive' }); return; }
    setAnalyzing(true);
    try {
      // ── detectPartyKind: auto-detect from name ──────────────────────
      const detectPartyKind = (name: string): string => {
        if (/bank|nbfi|financial institution/i.test(name)) return 'bank';
        if (/ltd|limited|pvt|llc|corp|inc|company|traders|enterprise/i.test(name)) return 'company';
        if (/government|govt|sarkari|bangladesh|ministry|district/i.test(name)) return 'government';
        return 'individual';
      };

      const caseFacts: CaseFacts = {
        // ── Core ─────────────────────────────────────────────────────────
        disputeType: formDisputeType || 'property title declaration',
        description: formDescription || '',
        causeOfActionDate: formCauseDate || new Date().toISOString().split('T')[0],
        filingDate: new Date().toISOString().split('T')[0],

        // ── Parties ──────────────────────────────────────────────────────
        plaintiff: formPlaintiff,
        plaintiffType: detectPartyKind(formPlaintiff),
        defendant: formDefendant,
        defendantType: detectPartyKind(formDefendant),
        isBankCreditor: /bank|nbfi|financial institution/i.test(formPlaintiff),
        isGovernmentDefendant: /government|govt|sarkari|ac land|dc office/i.test(formDefendant),
        isNegotiableInstrument: /cheque|promissory|bill of exchange/i.test(formDisputeType + ' ' + formInstrumentType),

        // ── Property ─────────────────────────────────────────────────────
        district: formDistrict || undefined,
        upazila: formUpazila || undefined,
        mouza: formMouza || undefined,
        dag: formDag || undefined,
        khatian: formKhatian || undefined,
        landArea: formLandArea || undefined,
        classification: formClassification || undefined,

        // ── Transaction ──────────────────────────────────────────────────
        deedType: formDeedType || 'sale deed',
        registrationDate: formRegDate || undefined,
        consideration: formConsideration || undefined,
        registered: formS17 === 'yes' || !!formRegDate,
        stampDutyOk: formStampOk === 'yes',
        s17Compliant: formS17 === 'yes',
        s49Inadmissible: formS49 === 'yes',
        benamiFlag: formBenami === 'yes',
        multipleSales: /double sale|two buyer|same vendor/i.test(formDescription),

        // ── Possession ───────────────────────────────────────────────────
        currentPossessor: formPossessor || 'plaintiff',
        possessionStartDate: formPossStartDate || undefined,
        possessionNature: formPossNature || undefined,
        physicalActs: formPossActs ? formPossActs.split(',').map((s: string) => s.trim()) : undefined,

        // ── SAT Act / Land ────────────────────────────────────────────────
        khasLand: /khas/i.test(formAcqMutation + ' ' + formDescription),
        ceilingExceeded: formCeilingExceeded === 'yes',
        mutationStatus: formMutation || formAcqMutation || undefined,
        acquisitionOrder: formAcquisition || undefined,

        // ── Inheritance ───────────────────────────────────────────────────
        religion: formReligion || undefined,
        poaHolder: formPoaHolder || undefined,
        plaintiffReadyWilling: true,

        // ── Money suits ───────────────────────────────────────────────────
        amountClaimed: formAmountClaimed ? Number(formAmountClaimed.replace(/,/g, '')) : undefined,
        defaultDate: formDefaultDate || undefined,
        instrumentType: formInstrumentType || undefined,

        // ── Pre-emption ───────────────────────────────────────────────────
        preEmptionClaim: /pre.?emption/i.test(formDisputeType),
        preDepositMade: formPreDeposit === 'yes',

        // ── Partition ─────────────────────────────────────────────────────
        partitionClaim: /partition/i.test(formDisputeType),
        coSharers: undefined,

        // ── Adverse possession ────────────────────────────────────────────
        adversePossessionClaim: /adverse.?possession/i.test(formDisputeType),

        // ── Government ────────────────────────────────────────────────────
        s80NoticeGiven: formS80Notice === 'yes',
      };
      const caseRes = await fetch('/api/cases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: formTitle, plaintiff: formPlaintiff, defendant: formDefendant, description: formDescription, mouza: formMouza, dag: formDag, khatian: formKhatian, factsJson: caseFacts, userId: user?.id }) });
      if (!caseRes.ok) { const e = await caseRes.json(); throw new Error(e.error || 'Failed'); }
      const createdCase = await caseRes.json();
      const analysisRes = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ caseId: createdCase.id, caseFacts }) });
      if (!analysisRes.ok) throw new Error('Analysis failed');
      const result = await analysisRes.json();
      setSelectedCase({ ...createdCase, analysisJson: JSON.stringify(result) });
      setAnalysisResult(result);
      setView('case-detail');
      toast({ title: 'Analysis Complete' });
      resetForm();
    } catch (err) { toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' }); }
    setAnalyzing(false);
  };

  // ═══════════════════════════════════════════════════════════════
  // PAYMENT FUNCTIONS
  // ═══════════════════════════════════════════════════════════════
  const handleUpgradeSubmit = async () => {
    if (!payTxId) { toast({ title: 'Error', description: 'Transaction ID is required', variant: 'destructive' }); return; }
    if (!user) return;
    setPaySubmitting(true);
    try {
      const res = await fetch('/api/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, plan: selectedPlan, method: selectedMethod, transactionId: payTxId, note: payNote || undefined }) });
      if (res.ok) { setUpgradeStep(3); loadUserPayments(); toast({ title: 'Payment Submitted!', description: 'Admin will verify within 24 hours.' }); }
      else { const d = await res.json(); toast({ title: 'Error', description: d.error, variant: 'destructive' }); }
    } catch { toast({ title: 'Error', description: 'Submission failed', variant: 'destructive' }); }
    setPaySubmitting(false);
  };

  const handleVerifyPayment = async (paymentId: string, action: 'verify' | 'reject', reason?: string) => {
    try {
      const res = await fetch(`/api/payments/${paymentId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminKey: 'fatiha-admin-2024', action, rejectionReason: reason }) });
      if (res.ok) { const d = await res.json(); toast({ title: action === 'verify' ? 'Payment Verified' : 'Payment Rejected', description: d.message }); loadAllPayments(); loadUsers(); }
      else { const d = await res.json(); toast({ title: 'Error', description: d.error, variant: 'destructive' }); }
    } catch { toast({ title: 'Error', description: 'Action failed', variant: 'destructive' }); }
  };

  const handleAdminUpgradeUser = async (userId: string, plan: string) => {
    try {
      const res = await fetch('/api/subscription', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminKey: 'fatiha-admin-2024', userId, plan }) });
      if (res.ok) { toast({ title: 'Plan Updated', description: `User upgraded to ${plan.toUpperCase()}` }); loadUsers(); }
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
  };

  const openUpgradeDialog = () => { setUpgradeStep(0); setSelectedPlan('pro'); setSelectedMethod('bkash'); setPayTxId(''); setPayPhone(''); setPayNote(''); setUpgradeOpen(true); };

  // ═══════════════════════════════════════════════════════════════
  // LOADING SCREEN
  // ═══════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4"><Scale className="h-12 w-12 text-black animate-pulse" /><p className="text-neutral-500 text-sm font-medium">Loading FATIHA...</p></div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // AUTH VIEW
  // ═══════════════════════════════════════════════════════════════
  if (view === 'auth') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 relative">
        {/* Watermark */}
        <div className="watermark-overlay" aria-hidden="true" />

        <div className="w-full max-w-md relative z-10">
          {/* Logo + Neum Lex Counsel Branding */}
          <div className="flex flex-col items-center gap-3 mb-6">
            {/* Neum Lex Counsel Image */}
            <img src="/neum-lex-counsel.png" alt="Neum Lex Counsel" className="h-20 w-auto" />
            <div className="text-center">
              <p className="text-xs font-semibold tracking-widest text-amber-700 uppercase">A Product of Neum Lex Counsel</p>
              <h1 className="text-2xl font-bold tracking-tight text-black mt-1">FATIHA</h1>
              <p className="text-sm text-neutral-500 font-medium">Legal Engineering Platform</p>
              <p className="text-xs text-neutral-400 mt-1">Bangladesh Land Litigation</p>
            </div>
          </div>

          {authRole === null ? (
            /* ─── Role Selection ─── */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button onClick={() => setAuthRole('user')} className="group p-6 rounded-2xl bg-black text-white flex flex-col items-center gap-3 hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
                <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center"><Scale className="h-6 w-6" /></div>
                <div className="text-center"><h2 className="text-lg font-bold">User</h2><p className="text-xs text-neutral-400 mt-1">Analyze your land dispute cases</p></div>
              </button>
              <button onClick={() => setAuthRole('admin')} className="group p-6 rounded-2xl bg-red-600 text-white flex flex-col items-center gap-3 hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
                <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center"><Shield className="h-6 w-6" /></div>
                <div className="text-center"><h2 className="text-lg font-bold">Admin</h2><p className="text-xs text-red-200 mt-1">System control &amp; user management</p></div>
              </button>
            </div>
          ) : authRole === 'user' ? (
            /* ─── User Sign In / Sign Up ─── */
            <>
              <button onClick={() => setAuthRole(null)} className="flex items-center gap-2 text-sm text-neutral-500 hover:text-black mb-4 transition-colors"><ArrowLeft className="h-4 w-4" />Back</button>
              <Card className="border-gray-200 bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex gap-0 rounded-lg overflow-hidden border border-gray-200">
                    <button onClick={() => setAuthTab('signin')} className={`flex-1 py-3 text-sm font-medium transition-colors ${authTab === 'signin' ? 'bg-black text-white' : 'bg-white text-neutral-500 hover:bg-gray-50'}`}>Sign In</button>
                    <button onClick={() => setAuthTab('signup')} className={`flex-1 py-3 text-sm font-medium transition-colors ${authTab === 'signup' ? 'bg-black text-white' : 'bg-white text-neutral-500 hover:bg-gray-50'}`}>Sign Up</button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {authTab === 'signin' ? (<>
                    <div className="space-y-2"><Label htmlFor="si-email" className="text-sm font-medium text-neutral-700">Email</Label><Input id="si-email" type="email" placeholder="advocate@example.com" value={signinEmail} onChange={e => setSigninEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSignIn()} autoFocus className="h-11" /></div>
                    <div className="space-y-2"><Label htmlFor="si-password" className="text-sm font-medium text-neutral-700">Password</Label><div className="relative"><Input id="si-password" type={showSigninPassword ? 'text' : 'password'} placeholder="Enter password" value={signinPassword} onChange={e => setSigninPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSignIn()} className="h-11 pr-10" /><button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-black transition-colors" onClick={() => setShowSigninPassword(!showSigninPassword)} tabIndex={-1}>{showSigninPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer select-none"><Checkbox checked={rememberMe} onCheckedChange={(v) => setRememberMe(v === true)} className="h-4 w-4" /><span className="text-sm text-neutral-600">Remember me</span></label>
                      <button type="button" className="text-sm text-primary hover:underline font-medium" onClick={() => setForgotOpen(true)}>Forgot password?</button>
                    </div>
                    <Button className="w-full h-11 bg-black hover:bg-neutral-800 text-white font-medium" onClick={handleSignIn} disabled={authLoading}>{authLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Sign In</Button>
                    <Separator className="bg-gray-100" />
                    <Button variant="outline" className={`w-full h-11 border-gray-200 font-medium ${!googleAuthAvailable ? 'opacity-60' : ''}`} onClick={handleGoogleSignIn}><svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>Sign in with Google</Button>
                  </>) : (<>
                    <div className="space-y-2"><Label htmlFor="su-name" className="text-sm font-medium text-neutral-700">Full Name</Label><Input id="su-name" placeholder="Adv. Md. Nazmul Islam" value={signupName} onChange={e => setSignupName(e.target.value)} className="h-11" /></div>
                    <div className="space-y-2"><Label htmlFor="su-email" className="text-sm font-medium text-neutral-700">Email</Label><Input id="su-email" type="email" placeholder="advocate@example.com" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} className="h-11" /></div>
                    <div className="space-y-2"><Label htmlFor="su-phone" className="text-sm font-medium text-neutral-700">Phone (+880)</Label><div className="flex"><span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-200 bg-gray-50 text-sm text-neutral-500 font-medium">+880</span><Input id="su-phone" placeholder="1712-345678" value={signupPhone} onChange={e => setSignupPhone(e.target.value)} className="rounded-l-none h-11" /></div></div>
                    <div className="space-y-2"><Label htmlFor="su-password" className="text-sm font-medium text-neutral-700">Password</Label><div className="relative"><Input id="su-password" type={showSignupPassword ? 'text' : 'password'} placeholder="Min. 6 characters" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} className="h-11 pr-10" /><button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-black transition-colors" onClick={() => setShowSignupPassword(!showSignupPassword)} tabIndex={-1}>{showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
                    <div className="space-y-2"><Label htmlFor="su-confirm" className="text-sm font-medium text-neutral-700">Confirm Password</Label><div className="relative"><Input id="su-confirm" type={showSignupConfirm ? 'text' : 'password'} placeholder="Re-enter password" value={signupConfirm} onChange={e => setSignupConfirm(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSignUp()} className="h-11 pr-10" /><button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-black transition-colors" onClick={() => setShowSignupConfirm(!showSignupConfirm)} tabIndex={-1}>{showSignupConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
                    <Button className="w-full h-11 bg-black hover:bg-neutral-800 text-white font-medium" onClick={handleSignUp} disabled={authLoading}>{authLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create Account</Button>
                    <Separator className="bg-gray-100" />
                    <Button variant="outline" className="w-full h-11 border-gray-200 font-medium" onClick={handleGoogleSignIn}><svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>Sign up with Google</Button>
                  </>)}
                </CardContent>
              </Card>
            </>
          ) : (
            /* ─── Admin Sign In Only ─── */
            <>
              <button onClick={() => setAuthRole(null)} className="flex items-center gap-2 text-sm text-neutral-500 hover:text-black mb-4 transition-colors"><ArrowLeft className="h-4 w-4" />Back</button>
              <Card className="border-red-200 bg-white shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-lg text-red-600 flex items-center gap-2"><Shield className="h-5 w-5" />Admin Sign In</CardTitle><CardDescription>System administrator access only</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label htmlFor="admin-email" className="text-sm font-medium text-neutral-700">Email</Label><Input id="admin-email" type="email" placeholder="admin@fatiha.com" value={signinEmail} onChange={e => setSigninEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSignIn()} autoFocus className="h-11" /></div>
                  <div className="space-y-2"><Label htmlFor="admin-password" className="text-sm font-medium text-neutral-700">Password</Label><div className="relative"><Input id="admin-password" type={showAdminPassword ? 'text' : 'password'} placeholder="Enter admin password" value={signinPassword} onChange={e => setSigninPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSignIn()} className="h-11 pr-10" /><button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-red-600 transition-colors" onClick={() => setShowAdminPassword(!showAdminPassword)} tabIndex={-1}>{showAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
                  <Button className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-medium" onClick={handleSignIn} disabled={authLoading}>{authLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Sign In as Admin</Button>
                </CardContent>
              </Card>
            </>
          )}
          <p className="text-center text-xs text-neutral-400 mt-6">FATIHA v3.0 &middot; A Product of <span className="text-amber-700 font-semibold">Neum Lex Counsel</span></p>
        </div>

        {/* ─── Forgot Password Dialog ─── */}
        <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" />Reset Password</DialogTitle>
              <DialogDescription>Enter your email and set a new password</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="advocate@example.com" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} className="h-11" /></div>
              <div className="space-y-2"><Label>New Password</Label><div className="relative"><Input type={forgotShowPassword ? 'text' : 'password'} placeholder="Min. 6 characters" value={forgotNewPassword} onChange={e => setForgotNewPassword(e.target.value)} className="h-11 pr-10" /><button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-black transition-colors" onClick={() => setForgotShowPassword(!forgotShowPassword)} tabIndex={-1}>{forgotShowPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
              <div className="space-y-2"><Label>Confirm New Password</Label><div className="relative"><Input type={forgotShowPassword ? 'text' : 'password'} placeholder="Re-enter new password" value={forgotConfirmPassword} onChange={e => setForgotConfirmPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleForgotPassword()} className="h-11 pr-10" /><button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-black transition-colors" onClick={() => setForgotShowPassword(!forgotShowPassword)} tabIndex={-1}>{forgotShowPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
            </div>
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setForgotOpen(false)}>Cancel</Button>
              <Button onClick={handleForgotPassword} disabled={forgotLoading}>{forgotLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Reset Password</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // PRO CHECKER
  // ═══════════════════════════════════════════════════════════════
  const isPaidUnlocked = () => isAdmin || isProUser;
  const ProBadge = () => (<span className="inline-flex items-center gap-1 ml-2"><Lock className="h-3 w-3 text-amber-500" /><Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-600">PRO</Badge></span>);
  const renderProBadge = ProBadge;

  // ═══════════════════════════════════════════════════════════════
  // USER SIDEBAR
  // ═══════════════════════════════════════════════════════════════
  const renderUserSidebar = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-black flex items-center justify-center"><Scale className="h-5 w-5 text-white" /></div>
        <div><h1 className="text-sm font-bold tracking-tight text-black">FATIHA</h1><p className="text-[10px] text-neutral-400 font-medium">Legal Engineering</p></div>
      </div>
      <Separator className="bg-gray-100" />
      <ScrollArea className="flex-1 px-3 py-2">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider px-3 mb-2">Navigation</p>
          {([['overview', LayoutDashboard, 'Dashboard'], ['my-cases', FolderOpen, 'My Cases'], ['subscription', Crown, 'Subscription'], ['payment-history', Receipt, 'Payment History']] as const).map(([tab, Icon, label]) => (
            <button key={tab} onClick={() => { setView('user-dash'); setUserTab(tab as UserTab); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${view === 'user-dash' && userTab === tab ? 'bg-black text-white' : 'text-neutral-600 hover:bg-gray-100 hover:text-black'}`}><Icon className="h-4 w-4" />{label}{tab === 'my-cases' && pendingCases > 0 && <Badge variant="secondary" className="ml-auto text-[10px] h-5 px-1.5 bg-gray-100 text-neutral-700">{pendingCases}</Badge>}{tab === 'subscription' && !isProUser && <Badge variant="outline" className="ml-auto text-[9px] px-1.5 border-amber-300 text-amber-600">PRO</Badge>}</button>
          ))}
          <button onClick={() => { setView('new-case'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${view === 'new-case' ? 'bg-black text-white' : 'text-neutral-600 hover:bg-gray-100 hover:text-black'}`}><FilePlus className="h-4 w-4" />New Case Analysis</button>
        </div>
        {user?.plan === 'free' && (<div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
          <p className="text-xs font-semibold text-amber-700 mb-1">Upgrade to PRO</p>
          <p className="text-[11px] text-neutral-500 mb-2">Unlock evidence, fraud, injunction &amp; strategy analysis</p>
          <Button size="sm" className="w-full text-xs bg-black hover:bg-neutral-800 text-white" onClick={openUpgradeDialog}><Crown className="h-3 w-3 mr-1" />Upgrade Now</Button>
        </div>)}
        {user?.role === 'admin' && loginRole === 'user' && (<div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-200">
          <p className="text-xs font-semibold text-blue-700 mb-1">Admin Mode</p>
          <p className="text-[11px] text-neutral-500 mb-2">You are viewing as a regular user</p>
          <Button size="sm" variant="outline" className="w-full text-xs border-blue-300 text-blue-700 hover:bg-blue-100" onClick={() => { localStorage.setItem('fatiha-login-role', 'admin'); setView('admin-dash'); setAdminTab('overview'); setSidebarOpen(false); }}><Shield className="h-3 w-3 mr-1" />Back to Admin</Button>
        </div>)}
      </ScrollArea>
      <Separator className="bg-gray-100" />
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7"><AvatarFallback className="text-[10px] bg-black text-white font-medium">{user?.name?.charAt(0) || 'U'}</AvatarFallback></Avatar>
          <div className="flex-1 min-w-0"><p className="text-xs font-medium truncate text-black">{user?.name}</p><Badge variant={user?.plan === 'free' ? 'secondary' : 'default'} className="text-[9px] h-4 px-1.5">{(user?.plan || 'FREE').toUpperCase()}</Badge></div>
        </div>
        <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-neutral-500 hover:bg-gray-100 hover:text-black transition-colors font-medium"><LogOut className="h-3.5 w-3.5" />Sign Out</button>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════
  // ADMIN SIDEBAR
  // ═══════════════════════════════════════════════════════════════
  const renderAdminSidebar = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-red-600 flex items-center justify-center"><Shield className="h-5 w-5 text-white" /></div>
        <div><h1 className="text-sm font-bold tracking-tight text-black">FATIHA <span className="text-red-600">Admin</span></h1><p className="text-[10px] text-neutral-400 font-medium">System Control</p></div>
      </div>
      <Separator className="bg-gray-100" />
      <ScrollArea className="flex-1 px-3 py-2">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider px-3 mb-2">Administration</p>
          {([['overview', BarChart3, 'System Overview'], ['pipeline', Sword, 'Engine Pipeline'], ['users', Users, 'User Management'], ['all-cases', Layers, 'All Cases'], ['payments', CreditCard, 'Payments'], ['settings', Settings, 'Settings']] as const).map(([tab, Icon, label]) => (
            <button key={tab} onClick={() => { setView('admin-dash'); setAdminTab(tab as AdminTab); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${view === 'admin-dash' && adminTab === tab ? 'bg-red-600 text-white' : 'text-neutral-600 hover:bg-gray-100 hover:text-black'}`}><Icon className="h-4 w-4" />{label}{tab === 'payments' && pendingPayments.length > 0 && <Badge variant="destructive" className="ml-auto text-[10px] h-5 px-1.5">{pendingPayments.length}</Badge>}</button>
          ))}
        </div>
        <Separator className="my-3 bg-gray-100" />
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider px-3 mb-2">Switch</p>
          <button onClick={() => { localStorage.setItem('fatiha-login-role', 'user'); setView('user-dash'); setUserTab('overview'); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-neutral-600 hover:bg-gray-100 hover:text-black"><MonitorSmartphone className="h-4 w-4" />View as User</button>
        </div>
      </ScrollArea>
      <Separator className="bg-gray-100" />
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7"><AvatarFallback className="text-[10px] bg-red-600 text-white font-medium">{user?.name?.charAt(0) || 'A'}</AvatarFallback></Avatar>
          <div className="flex-1 min-w-0"><p className="text-xs font-medium truncate text-black">{user?.name}</p><div className="flex gap-1"><Badge variant="outline" className="text-[9px] h-4 px-1.5 border-red-300 text-red-600">ADMIN</Badge><Badge className="text-[9px] h-4 px-1.5 bg-black">ENTERPRISE</Badge></div></div>
        </div>
        <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-neutral-500 hover:bg-gray-100 hover:text-black transition-colors font-medium"><LogOut className="h-3.5 w-3.5" />Sign Out</button>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════
  // UPGRADE DIALOG (Multi-Step)
  // ═══════════════════════════════════════════════════════════════
  const renderUpgradeDialogContent = () => {
    if (upgradeStep === 0) return (
      <div className="space-y-4">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Crown className="h-5 w-5 text-amber-600" />Choose Your Plan</DialogTitle><DialogDescription>Select a subscription plan to unlock full analysis features</DialogDescription></DialogHeader>
        <div className="grid gap-3">
          {SUBSCRIPTION_PLANS.map(plan => (
            <Card key={plan.id} className={`border-2 cursor-pointer transition-all ${plan.recommended ? 'border-amber-500/50 bg-amber-500/5' : plan.id === selectedPlan ? 'border-primary' : 'border-gray-200'} ${plan.id === user?.plan ? 'opacity-50 pointer-events-none' : ''}`} onClick={() => { if (plan.id !== 'free' && plan.id !== user?.plan) setSelectedPlan(plan.id); }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between"><div className="flex items-center gap-2"><h3 className="font-bold">{plan.name}</h3>{plan.recommended && <Badge className="bg-amber-500 text-black text-[10px]">RECOMMENDED</Badge>}{plan.id === user?.plan && <Badge variant="secondary" className="text-[10px]">CURRENT</Badge>}</div><div className="text-right"><p className="text-xl font-bold">{plan.price === 0 ? 'Free' : `Tk ${plan.price.toLocaleString()}`}</p><p className="text-xs text-muted-foreground">{plan.period}</p></div></div>
                <div className="mt-3 space-y-1">{plan.features.map(f => (<div key={f} className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" /><span>{f}</span></div>))}</div>
              </CardContent>
            </Card>
          ))}
        </div>
        <DialogFooter><Button className="w-full" onClick={() => setUpgradeStep(1)}>Continue with {SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan)?.name}</Button></DialogFooter>
      </div>
    );

    if (upgradeStep === 1) return (
      <div className="space-y-4">
        <DialogHeader><DialogTitle>Select Payment Method</DialogTitle><DialogDescription>Choose how you want to pay for {SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan)?.name} plan (Tk {SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan)?.price.toLocaleString()})</DialogDescription></DialogHeader>
        <div className="grid gap-3">
          {PAYMENT_METHODS.map(m => (
            <Card key={m.id} className={`border-2 cursor-pointer transition-all ${selectedMethod === m.id ? 'border-primary' : 'border-gray-200'}`} onClick={() => setSelectedMethod(m.id)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3"><div className={`h-10 w-10 rounded-lg ${m.bgColor} flex items-center justify-center text-white font-bold text-sm`}>{m.name.charAt(0)}</div><div><h3 className="font-bold text-sm">{m.name}</h3><p className="text-xs text-muted-foreground">{m.type}{m.id !== 'bank' ? ` → ${m.number}` : ''}</p></div></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <DialogFooter className="flex gap-2"><Button variant="outline" onClick={() => setUpgradeStep(0)}>Back</Button><Button className="flex-1" onClick={() => setUpgradeStep(2)}>Proceed</Button></DialogFooter>
      </div>
    );

    if (upgradeStep === 2) {
      const method = PAYMENT_METHODS.find(m => m.id === selectedMethod)!;
      return (
        <div className="space-y-4">
          <DialogHeader><DialogTitle>Payment Instructions</DialogTitle><DialogDescription>Follow these steps, then enter your Transaction ID</DialogDescription></DialogHeader>
          <Card className="border-gray-200">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3"><div className={`h-10 w-10 rounded-lg ${method.bgColor} flex items-center justify-center text-white font-bold`}>{method.name.charAt(0)}</div><div><h3 className="font-bold">{method.name}</h3>{method.bankName && <p className="text-xs text-muted-foreground">{method.bankName}</p>}</div></div>
              {method.bankName && (<div className="space-y-1 text-sm"><p><span className="text-muted-foreground">A/C Name:</span> {method.accountName}</p><p><span className="text-muted-foreground">A/C No:</span> {method.number}</p><p><span className="text-muted-foreground">Branch:</span> {method.branch}</p><p><span className="text-muted-foreground">Routing:</span> {method.routing}</p></div>)}
              {!method.bankName && (<p className="text-sm"><span className="text-muted-foreground">Number:</span> <span className="font-mono font-bold">{method.number}</span> ({method.type})</p>)}
              <div className="p-3 rounded-lg bg-gray-100"><p className="text-xs font-medium mb-2">Steps:</p><ol className="space-y-1">{method.instructions.map((s, i) => (<li key={i} className="text-xs flex gap-2"><span className="text-primary font-bold">{i + 1}.</span>{s}</li>))}</ol></div>
              <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-xs"><p className="font-medium text-amber-600">Amount to Send: Tk {SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan)?.price.toLocaleString()}</p></div>
            </CardContent>
          </Card>
          <div className="space-y-3">
            <div className="space-y-2"><Label>Transaction ID <span className="text-red-600">*</span></Label><Input placeholder="Enter your transaction/tracking ID" value={payTxId} onChange={e => setPayTxId(e.target.value)} /></div>
            <div className="space-y-2"><Label>Your Phone (optional)</Label><div className="flex"><span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-gray-100 text-sm text-muted-foreground">+880</span><Input placeholder="1712-345678" value={payPhone} onChange={e => setPayPhone(e.target.value)} className="rounded-l-none" /></div></div>
            <div className="space-y-2"><Label>Note (optional)</Label><Textarea placeholder="Any reference or note" value={payNote} onChange={e => setPayNote(e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter className="flex gap-2"><Button variant="outline" onClick={() => setUpgradeStep(1)}>Back</Button><Button className="flex-1" onClick={handleUpgradeSubmit} disabled={paySubmitting}>{paySubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}Submit Payment</Button></DialogFooter>
        </div>
      );
    }

    return (
      <div className="space-y-4 text-center py-4">
        <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"><CheckCircle2 className="h-8 w-8 text-green-600" /></div>
        <DialogHeader><DialogTitle>Payment Submitted!</DialogTitle><DialogDescription>Your payment has been submitted for verification. The admin will review and activate your subscription within 24 hours.</DialogDescription></DialogHeader>
        <div className="p-3 rounded-lg bg-gray-100 text-sm space-y-1"><p><span className="text-muted-foreground">Plan:</span> <span className="font-medium">{SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan)?.name}</span></p><p><span className="text-muted-foreground">Method:</span> <span className="font-medium">{PAYMENT_METHODS.find(m => m.id === selectedMethod)?.name}</span></p><p><span className="text-muted-foreground">TxID:</span> <span className="font-mono">{payTxId}</span></p></div>
        <DialogFooter><Button className="w-full" onClick={() => setUpgradeOpen(false)}>Done</Button></DialogFooter>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // USER DASHBOARD CONTENT
  // ═══════════════════════════════════════════════════════════════
  const renderUserDashboardContent = () => (
    <div className="space-y-6">
      {/* Overview Tab */}
      {userTab === 'overview' && (<>
        <div><h2 className="text-2xl font-bold">Welcome, <span className="text-primary">{user?.name?.split(' ')[0]}</span></h2><p className="text-muted-foreground text-sm mt-1">Your legal engineering dashboard &middot; {(user?.plan || 'Free').charAt(0).toUpperCase()}{user?.plan?.slice(1)} Plan</p></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[{ label: 'Total Cases', value: totalCases, icon: FolderOpen, color: 'text-primary' }, { label: 'Analyzed', value: analyzedCases, icon: CheckCircle2, color: 'text-green-600' }, { label: 'Strong Cases', value: strongCases, icon: Shield, color: 'text-green-600' }, { label: 'Pending', value: pendingCases, icon: Clock, color: 'text-amber-600' }].map(s => (
            <Card key={s.label} className="border-gray-200 bg-white shadow-sm"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground mt-1">{s.label}</p></div><s.icon className={`h-8 w-8 ${s.color} opacity-40`} /></div></CardContent></Card>
          ))}
        </div>
        {user?.plan === 'free' && (
          <Card className="border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-orange-500/5"><CardContent className="p-4 flex items-center gap-4"><Crown className="h-10 w-10 text-amber-600 shrink-0" /><div className="flex-1"><h3 className="font-bold text-amber-600">Unlock Full Analysis</h3><p className="text-xs text-muted-foreground mt-1">Upgrade to PRO for Evidence Analysis, Fraud Detection, Injunction, Strategy Engine &amp; more</p></div><Button className="bg-black hover:bg-neutral-800 text-white shrink-0" onClick={openUpgradeDialog}>Upgrade to PRO</Button></CardContent></Card>
        )}
        <Card className="border-gray-200 bg-white shadow-sm"><CardHeader className="pb-3"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><FolderOpen className="h-5 w-5 text-primary" /><CardTitle className="text-lg">Recent Cases</CardTitle></div><Button variant="outline" size="sm" className="text-xs" onClick={() => setUserTab('my-cases')}>View All</Button></div></CardHeader><CardContent>
          {cases.length === 0 ? (<div className="text-center py-8"><FileText className="h-8 w-8 text-neutral-300 mx-auto mb-2" /><p className="text-sm text-muted-foreground">No cases yet</p><Button size="sm" className="mt-3" onClick={() => setView('new-case')}><FilePlus className="h-3.5 w-3.5 mr-1" />Create First Case</Button></div>) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">{cases.slice(0, 5).map(c => (
              <button key={c.id} onClick={() => viewCaseDetail(c)} className="w-full flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-secondary/40 border border-border/30 transition-colors text-left">
                <div className="flex-1 min-w-0"><div className="flex items-center gap-2"><p className="text-sm font-medium truncate">{c.title}</p><Badge variant={c.status === 'analyzed' ? 'default' : 'secondary'} className={`text-[10px] h-5 px-1.5 shrink-0 ${c.status === 'analyzed' ? 'bg-emerald-500/10 text-green-600 border-emerald-500/20' : ''}`}>{c.status === 'analyzed' ? 'Analyzed' : 'Draft'}</Badge></div><p className="text-xs text-muted-foreground mt-0.5">{c.caseNumber} &middot; {c.plaintiff} v. {c.defendant}</p></div><ChevronRight className="h-4 w-4 text-neutral-300 shrink-0" />
              </button>
            ))}</div>
          )}
        </CardContent></Card>
      </>)}

      {/* My Cases Tab */}
      {userTab === 'my-cases' && (<>
        <div className="flex items-center justify-between flex-wrap gap-3"><div><h2 className="text-2xl font-bold">My Cases</h2><p className="text-muted-foreground text-sm mt-1">{totalCases} total cases</p></div><Button onClick={() => setView('new-case')}><FilePlus className="h-4 w-4 mr-2" />New Case</Button></div>
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search cases..." value={casesSearch} onChange={e => setCasesSearch(e.target.value)} className="pl-9" /></div>
        <div className="space-y-2">{filteredCases.length === 0 ? (<div className="text-center py-12"><FolderOpen className="h-10 w-10 text-neutral-300 mx-auto mb-2" /><p className="text-sm text-muted-foreground">No cases found</p></div>) : filteredCases.map(c => (
          <button key={c.id} onClick={() => viewCaseDetail(c)} className="w-full flex items-center gap-3 p-4 rounded-lg bg-gray-50 hover:bg-secondary/40 border border-border/30 transition-colors text-left">
            <div className="flex-1 min-w-0"><div className="flex items-center gap-2 flex-wrap"><p className="text-sm font-medium">{c.title}</p><Badge variant={c.status === 'analyzed' ? 'default' : 'secondary'} className={`text-[10px] h-5 px-1.5 ${c.status === 'analyzed' ? 'bg-emerald-500/10 text-green-600 border-emerald-500/20' : ''}`}>{c.status}</Badge></div><p className="text-xs text-muted-foreground mt-1">{c.caseNumber} &middot; {c.plaintiff} v. {c.defendant}</p>{c.mouza && <p className="text-xs text-muted-foreground">{c.mouza}{c.dag ? ` · Dag ${c.dag}` : ''}</p>}</div><ChevronRight className="h-4 w-4 text-neutral-300 shrink-0" />
          </button>
        ))}</div>
      </>)}

      {/* Subscription Tab */}
      {userTab === 'subscription' && (<>
        <div><h2 className="text-2xl font-bold">Subscription</h2><p className="text-muted-foreground text-sm mt-1">Manage your plan and billing</p></div>
        <Card className="border-primary/30 bg-primary/5"><CardContent className="p-4 flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center"><Crown className={`h-6 w-6 ${user?.plan === 'free' ? 'text-muted-foreground' : 'text-amber-600'}`} /></div><div className="flex-1"><h3 className="font-bold">Current Plan: <span className={user?.plan === 'free' ? 'text-muted-foreground' : 'text-primary'}>{(user?.plan || 'Free').toUpperCase()}</span></h3><p className="text-xs text-muted-foreground">{user?.plan === 'free' ? 'Limited features available' : user?.plan === 'pro' ? 'Full analysis features unlocked' : 'All features + API access'}</p></div>{user?.plan === 'free' && <Button className="bg-black hover:bg-neutral-800 text-white" onClick={openUpgradeDialog}>Upgrade</Button>}</CardContent></Card>
        <div className="space-y-1"><h3 className="text-sm font-semibold mb-3">Plan Comparison</h3>
          {['Cases', 'Basic Overview', 'Evidence Analysis', 'Fraud Detection', 'Injunction Analysis', 'Relief Optimizer', 'Client Advisory', 'Arguments Builder', 'Strategy Engine', 'API Access', 'Priority Support'].map(feature => (
            <div key={feature} className="grid grid-cols-4 gap-2 p-2 text-xs"><span className="font-medium">{feature}</span><div className="text-center">{['Cases'].includes(feature) ? <Badge variant="secondary">2</Badge> : <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />}</div><div className="text-center">{['Cases'].includes(feature) ? <Badge variant="secondary">20</Badge> : <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />}</div><div className="text-center">{['Cases'].includes(feature) ? <Badge variant="secondary">&infin;</Badge> : <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />}</div></div>
          ))}
          <div className="grid grid-cols-4 gap-2 p-2 text-xs font-medium text-muted-foreground"><span>Feature</span><div className="text-center">Free</div><div className="text-center text-amber-600">PRO</div><div className="text-center">Enterprise</div></div>
        </div>
      </>)}

      {/* Payment History Tab */}
      {userTab === 'payment-history' && (<>
        <div><h2 className="text-2xl font-bold">Payment History</h2><p className="text-muted-foreground text-sm mt-1">Track your payments and subscription status</p></div>
        {userPayments.length === 0 ? (<Card className="border-gray-200"><CardContent className="p-8 text-center"><Receipt className="h-10 w-10 text-neutral-300 mx-auto mb-2" /><p className="text-sm text-muted-foreground">No payments yet</p><Button className="mt-3 bg-black hover:bg-neutral-800 text-white" onClick={openUpgradeDialog}>Make First Payment</Button></CardContent></Card>) : (
          <div className="space-y-2">{userPayments.map(p => (
            <Card key={p.id} className="border-gray-200"><CardContent className="p-4 flex items-center gap-4"><div className={`h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-sm ${p.method === 'bkash' ? 'bg-pink-600' : p.method === 'nagad' ? 'bg-orange-500' : 'bg-blue-600'}`}>{p.method === 'bkash' ? 'b' : p.method === 'nagad' ? 'N' : 'B'}</div><div className="flex-1 min-w-0"><p className="text-sm font-medium">{p.plan.toUpperCase()} Plan &middot; Tk {p.amount.toLocaleString()}</p><p className="text-xs text-muted-foreground">{p.method.toUpperCase()} &middot; TxID: {p.transactionId}</p><p className="text-xs text-neutral-400">{new Date(p.createdAt).toLocaleDateString('en-BD')}</p></div><Badge variant={p.status === 'verified' ? 'default' : p.status === 'rejected' ? 'destructive' : 'secondary'} className={`text-[10px] h-5 ${p.status === 'verified' ? 'bg-emerald-500/10 text-green-600 border-emerald-500/20' : ''}`}>{p.status}</Badge></CardContent></Card>
          ))}</div>
        )}
      </>)}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════
  // ADMIN DASHBOARD CONTENT
  // ═══════════════════════════════════════════════════════════════
  const renderAdminDashboardContent = () => (
    <div className="space-y-6">
      {/* Admin Overview */}
      {adminTab === 'overview' && (<>
        <div><h2 className="text-2xl font-bold text-red-600">System Overview</h2><p className="text-muted-foreground text-sm mt-1">FATIHA Platform Administration</p></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[{ l: 'Total Users', v: allUsers.length, i: Users, c: 'text-primary' }, { l: 'Total Cases', v: allCases.length, i: Layers, c: 'text-green-600' }, { l: 'Revenue (BDT)', v: `Tk ${totalRevenue.toLocaleString()}`, i: DollarSign, c: 'text-amber-600' }, { l: 'Pending Payments', v: pendingPayments.length, i: Clock, c: 'text-red-600' }].map(s => (
            <Card key={s.l} className="border-gray-200 bg-white shadow-sm"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-2xl font-bold">{s.v}</p><p className="text-xs text-muted-foreground mt-1">{s.l}</p></div><s.i className={`h-8 w-8 ${s.c} opacity-40`} /></div></CardContent></Card>
          ))}
        </div>
        {pendingPayments.length > 0 && (
          <Card className="border-red-500/30 bg-red-500/5"><CardHeader className="pb-3"><CardTitle className="text-base text-red-600 flex items-center gap-2"><AlertCircle className="h-4 w-4" />Pending Payment Verifications</CardTitle></CardHeader><CardContent><div className="space-y-2">{pendingPayments.slice(0, 5).map(p => (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-border/30"><div className={`h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-xs ${p.method === 'bkash' ? 'bg-pink-600' : p.method === 'nagad' ? 'bg-orange-500' : 'bg-blue-600'}`}>{p.method.charAt(0).toUpperCase()}</div><div className="flex-1 min-w-0"><p className="text-sm font-medium">{p.userName}</p><p className="text-xs text-muted-foreground">{p.plan.toUpperCase()} &middot; Tk {p.amount.toLocaleString()} &middot; {p.method.toUpperCase()}</p></div><div className="flex gap-2"><Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => handleVerifyPayment(p.id, 'verify')}>Verify</Button><Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => handleVerifyPayment(p.id, 'reject', 'Could not verify')}>Reject</Button></div></div>
          ))}</div></CardContent></Card>
        )}
        <Card className="border-gray-200 bg-white shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-base">Quick Stats</CardTitle></CardHeader><CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-gray-50"><p className="text-xs text-muted-foreground mb-1">Plan Distribution</p><div className="space-y-1">{['free', 'pro', 'enterprise'].map(plan => { const count = allUsers.filter(u => u.plan === plan).length; return (<div key={plan} className="flex items-center gap-2 text-xs"><span className="w-16">{plan.charAt(0).toUpperCase() + plan.slice(1)}</span><div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${allUsers.length > 0 ? (count / allUsers.length) * 100 : 0}%` }} /></div><span className="w-6 text-right">{count}</span></div>); })}</div></div>
            <div className="p-3 rounded-lg bg-gray-50"><p className="text-xs text-muted-foreground mb-1">Cases by Status</p><div className="space-y-1">{['draft', 'analyzed'].map(status => { const count = allCases.filter(c => c.status === status).length; return (<div key={status} className="flex items-center gap-2 text-xs"><span className="w-16 capitalize">{status}</span><div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden"><div className={`h-full rounded-full ${status === 'analyzed' ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${allCases.length > 0 ? (count / allCases.length) * 100 : 0}%` }} /></div><span className="w-6 text-right">{count}</span></div>); })}</div></div>
            <div className="p-3 rounded-lg bg-gray-50"><p className="text-xs text-muted-foreground mb-1">Payment Methods</p><div className="space-y-1">{['bkash', 'nagad', 'bank'].map(m => { const count = allPayments.filter(p => p.method === m).length; return (<div key={m} className="flex items-center gap-2 text-xs"><span className="w-16 uppercase">{m}</span><div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${allPayments.length > 0 ? (count / allPayments.length) * 100 : 0}%` }} /></div><span className="w-6 text-right">{count}</span></div>); })}</div></div>
          </div>
        </CardContent></Card>
      </>)}

      {/* Engine Pipeline */}
      {adminTab === 'pipeline' && (<>
        <div><h2 className="text-2xl font-bold text-red-600">Engine Pipeline</h2><p className="text-muted-foreground text-sm mt-1">15-stage Bangladesh Civil Dispute Decision Engine v3.0</p></div>
        <Card className="border-gray-200 bg-white shadow-sm"><CardContent className="p-4"><div className="space-y-2">{ADMIN_PIPELINE_STAGES.map((stage, i) => (
          <div key={stage.num} className="flex items-center gap-3"><div className={`h-8 w-8 rounded-lg ${stage.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>{stage.num}</div><div className="flex-1 min-w-0"><p className="text-sm font-medium">{stage.name}</p><p className="text-xs text-muted-foreground">{stage.ref}</p></div>{i < ADMIN_PIPELINE_STAGES.length - 1 && <ChevronDown className="h-4 w-4 text-neutral-300 shrink-0" />}</div>
        ))}</div></CardContent></Card>
      </>)}

      {/* User Management */}
      {adminTab === 'users' && (<>
        <div><h2 className="text-2xl font-bold text-red-600">User Management</h2><p className="text-muted-foreground text-sm mt-1">{allUsers.length} registered users &middot; {allCases.length} total cases</p></div>
        <Card className="border-gray-200 bg-white shadow-sm"><CardContent className="p-0"><div className="overflow-x-auto">
          <table className="w-full text-sm"><thead><tr className="border-b border-gray-200"><th className="p-3 text-left text-xs font-semibold text-muted-foreground">Name</th><th className="p-3 text-left text-xs font-semibold text-muted-foreground">Email</th><th className="p-3 text-left text-xs font-semibold text-muted-foreground">Phone</th><th className="p-3 text-center text-xs font-semibold text-muted-foreground">Cases</th><th className="p-3 text-left text-xs font-semibold text-muted-foreground">Plan</th><th className="p-3 text-left text-xs font-semibold text-muted-foreground">Actions</th></tr></thead>
          <tbody>{allUsers.map(u => {
            const userCaseCount = allCases.filter(c => c.userId === u.id).length;
            return (
            <tr key={u.id} className="border-b border-border/30 hover:bg-gray-50"><td className="p-3 font-medium">{u.name}{u.role === 'admin' && <Badge variant="outline" className="text-[9px] ml-2 border-red-500/30 text-red-600">ADMIN</Badge>}</td><td className="p-3 text-muted-foreground text-xs">{u.email}</td><td className="p-3 text-muted-foreground text-xs">{u.phone || '—'}</td><td className="p-3 text-center"><Badge variant="secondary" className="text-[10px]">{userCaseCount}</Badge></td><td className="p-3"><Badge variant={u.plan === 'free' ? 'secondary' : 'default'} className="text-[10px]">{u.plan.toUpperCase()}</Badge></td>
            <td className="p-3"><Select defaultValue={u.plan} onValueChange={v => handleAdminUpgradeUser(u.id, v)}><SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="free">Free</SelectItem><SelectItem value="pro">PRO</SelectItem><SelectItem value="enterprise">Enterprise</SelectItem></SelectContent></Select></td></tr>
            );
          })}</tbody></table>
        </div></CardContent></Card>
      </>)}

      {/* All Cases */}
      {adminTab === 'all-cases' && (<>
        <div><h2 className="text-2xl font-bold text-red-600">All Cases</h2><p className="text-muted-foreground text-sm mt-1">{allCases.length} total cases</p></div>
        <Card className="border-gray-200 bg-white shadow-sm"><CardContent className="p-0"><div className="overflow-x-auto">
          <table className="w-full text-sm"><thead><tr className="border-b border-gray-200"><th className="p-3 text-left text-xs font-semibold text-muted-foreground">Case #</th><th className="p-3 text-left text-xs font-semibold text-muted-foreground">Title</th><th className="p-3 text-left text-xs font-semibold text-muted-foreground">User</th><th className="p-3 text-left text-xs font-semibold text-muted-foreground">Parties</th><th className="p-3 text-left text-xs font-semibold text-muted-foreground">Status</th></tr></thead>
          <tbody>{allCases.map(c => {
            const caseUser = allUsers.find(u => u.id === c.userId);
            return (
            <tr key={c.id} className="border-b border-border/30 hover:bg-gray-50 cursor-pointer" onClick={() => viewCaseDetail(c)}><td className="p-3 text-xs font-mono text-muted-foreground">{c.caseNumber}</td><td className="p-3 font-medium">{c.title}</td><td className="p-3 text-xs text-muted-foreground">{caseUser ? caseUser.name : (c.userId ? '—' : 'Unassigned')}</td><td className="p-3 text-xs text-muted-foreground">{c.plaintiff} v. {c.defendant}</td><td className="p-3"><Badge variant={c.status === 'analyzed' ? 'default' : 'secondary'} className={`text-[10px] ${c.status === 'analyzed' ? 'bg-emerald-500/10 text-green-600 border-emerald-500/20' : ''}`}>{c.status}</Badge></td></tr>
            );
          })}</tbody></table>
        </div></CardContent></Card>
      </>)}

      {/* Payment Verification */}
      {adminTab === 'payments' && (<>
        <div><h2 className="text-2xl font-bold text-red-600">Payment Verification</h2><p className="text-muted-foreground text-sm mt-1">Review and verify user payments</p></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[{ l: 'Total Revenue', v: `Tk ${totalRevenue.toLocaleString()}`, c: 'text-green-600' }, { l: 'Pending', v: `${pendingPayments.length} (Tk ${pendingRevenue.toLocaleString()})`, c: 'text-amber-600' }, { l: 'Verified', v: allPayments.filter(p => p.status === 'verified').length.toString(), c: 'text-green-600' }, { l: 'Rejected', v: allPayments.filter(p => p.status === 'rejected').length.toString(), c: 'text-red-600' }].map(s => (
            <Card key={s.l} className="border-gray-200 bg-white shadow-sm"><CardContent className="p-3"><p className={`text-lg font-bold ${s.c}`}>{s.v}</p><p className="text-xs text-muted-foreground">{s.l}</p></CardContent></Card>
          ))}
        </div>
        {allPayments.length === 0 ? (<Card className="border-gray-200"><CardContent className="p-8 text-center"><Receipt className="h-10 w-10 text-neutral-300 mx-auto mb-2" /><p className="text-sm text-muted-foreground">No payments yet</p></CardContent></Card>) : (
          <div className="space-y-2">{allPayments.map(p => (
            <Card key={p.id} className={`border-gray-200 ${p.status === 'pending' ? 'border-amber-500/30' : ''}`}><CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0 ${p.method === 'bkash' ? 'bg-pink-600' : p.method === 'nagad' ? 'bg-orange-500' : 'bg-blue-600'}`}>{p.method === 'bkash' ? 'b' : p.method === 'nagad' ? 'N' : 'B'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap"><p className="font-medium">{p.userName}</p><Badge variant={p.status === 'verified' ? 'default' : p.status === 'rejected' ? 'destructive' : 'secondary'} className={`text-[10px] ${p.status === 'verified' ? 'bg-emerald-500/10 text-green-600 border-emerald-500/20' : ''}`}>{p.status}</Badge></div>
                  <p className="text-xs text-muted-foreground">{p.userEmail} &middot; {p.userPhone}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs"><span><span className="text-muted-foreground">Plan:</span> {p.plan.toUpperCase()}</span><span><span className="text-muted-foreground">Amount:</span> Tk {p.amount.toLocaleString()}</span><span><span className="text-muted-foreground">Method:</span> {p.method.toUpperCase()}</span><span><span className="text-muted-foreground">TxID:</span> <span className="font-mono">{p.transactionId}</span></span></div>
                  {p.note && <p className="text-xs text-muted-foreground mt-1">Note: {p.note}</p>}
                  {p.rejectionReason && <p className="text-xs text-red-600 mt-1">Reason: {p.rejectionReason}</p>}
                </div>
                {p.status === 'pending' && (<div className="flex gap-2 shrink-0"><Button size="sm" className="h-8 text-xs bg-green-600 hover:bg-green-700" onClick={() => handleVerifyPayment(p.id, 'verify')}><CheckCircle2 className="h-3 w-3 mr-1" />Verify</Button><Button size="sm" variant="destructive" className="h-8 text-xs" onClick={() => handleVerifyPayment(p.id, 'reject', 'Could not verify transaction')}><XCircle className="h-3 w-3 mr-1" />Reject</Button></div>)}
              </div>
            </CardContent></Card>
          ))}</div>
        )}
      </>)}

      {/* Settings */}
      {adminTab === 'settings' && (<>
        <div><h2 className="text-2xl font-bold text-red-600">System Settings</h2><p className="text-muted-foreground text-sm mt-1">Platform configuration</p></div>
        <Card className="border-gray-200 bg-white shadow-sm"><CardHeader><CardTitle className="text-base">Payment Accounts</CardTitle></CardHeader><CardContent className="space-y-3">{PAYMENT_METHODS.map(m => (
          <div key={m.id} className="p-3 rounded-lg bg-gray-50 border border-border/30 flex items-center gap-3"><div className={`h-8 w-8 rounded-lg ${m.bgColor} flex items-center justify-center text-white font-bold text-xs`}>{m.name.charAt(0)}</div><div><p className="text-sm font-medium">{m.name}</p><p className="text-xs text-muted-foreground">{m.bankName ? `${m.bankName} · ${m.number}` : `${m.number} (${m.type})`}</p></div></div>
        ))}</CardContent></Card>
        <Card className="border-gray-200 bg-white shadow-sm"><CardHeader><CardTitle className="text-base">Platform Info</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Version</span><span>FATIHA v3.0</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Developer</span><span>Adv Md Nazmul Islam (BIJOY)</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Framework</span><span>Next.js 16 + TypeScript</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Database</span><span>JSON File Storage</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Total Users</span><span>{allUsers.length}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Total Cases</span><span>{allCases.length}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Total Revenue</span><span className="text-green-600">Tk {totalRevenue.toLocaleString()}</span></div>
        </CardContent></Card>
      </>)}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════
  // NEW CASE FORM
  // ═══════════════════════════════════════════════════════════════
  const renderNewCaseForm = () => (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold">New Case Analysis</h2><p className="text-muted-foreground text-sm mt-1">Provide case facts for comprehensive legal analysis</p></div>
      {/* Case Info */}
      <Card className="border-gray-200 bg-white shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-base">Case Information</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Case Title *</Label><Input placeholder="e.g., Asif v. Vashn — Title Suit" value={formTitle} onChange={e => setFormTitle(e.target.value)} /></div>
          <div className="space-y-2"><Label>Dispute Type</Label><Select value={formDisputeType} onValueChange={setFormDisputeType}><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent>{DISPUTE_TYPES.map(dt => <SelectItem key={dt} value={dt}>{dt}</SelectItem>)}</SelectContent></Select>{autoDetected && <p className="text-[10px] text-green-600 flex items-center gap-1"><Sparkles className="h-3 w-3" />Auto-detected from description</p>}</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Plaintiff *</Label><Input placeholder="Name of plaintiff" value={formPlaintiff} onChange={e => setFormPlaintiff(e.target.value)} /></div>
          <div className="space-y-2"><Label>Defendant *</Label><Input placeholder="Name of defendant" value={formDefendant} onChange={e => setFormDefendant(e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Cause of Action Date</Label><Input type="date" value={formCauseDate} onChange={e => setFormCauseDate(e.target.value)} /></div>
          <div className="space-y-2"><Label>Deed Type</Label><Select value={formDeedType} onValueChange={setFormDeedType}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{DEED_TYPES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <div className="space-y-2"><Label>Case Description</Label><Textarea placeholder="Describe the facts of the case..." rows={4} value={formDescription} onChange={e => setFormDescription(e.target.value)} /><Button variant="outline" size="sm" type="button" onClick={handleAutoFill} className="mt-1"><Sparkles className="h-3.5 w-3.5 mr-1" />Auto-Fill from Description</Button></div>
      </CardContent></Card>
      {/* Property */}
      <Card className="border-gray-200 bg-white shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-base">Property Details</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div className="space-y-2"><Label>Mouza</Label><Input placeholder="Village name" value={formMouza} onChange={e => setFormMouza(e.target.value)} /></div><div className="space-y-2"><Label>Upazila</Label><Input placeholder="Upazila name" value={formUpazila} onChange={e => setFormUpazila(e.target.value)} /></div><div className="space-y-2"><Label>District *</Label><Input placeholder="e.g. Narsingdi" value={formDistrict} onChange={e => setFormDistrict(e.target.value)} /></div></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div className="space-y-2"><Label>Dag No.</Label><Input placeholder="DAG number" value={formDag} onChange={e => setFormDag(e.target.value)} /></div><div className="space-y-2"><Label>Khatian No.</Label><Input placeholder="CS/RS khatian" value={formKhatian} onChange={e => setFormKhatian(e.target.value)} /></div><div className="space-y-2"><Label>Classification</Label><Select value={formClassification} onValueChange={setFormClassification}><SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger><SelectContent>{PROPERTY_CLASSIFICATIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><Label>Land Area</Label><Input placeholder="e.g., 0.5 acres" value={formLandArea} onChange={e => setFormLandArea(e.target.value)} /></div><div className="space-y-2"><Label>Registration Date</Label><Input type="date" value={formRegDate} onChange={e => setFormRegDate(e.target.value)} /></div></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><Label>Consideration (Tk)</Label><Input placeholder="Sale price" value={formConsideration} onChange={e => setFormConsideration(e.target.value)} /></div><div className="space-y-2"><Label>Stamp Duty</Label><Input placeholder="Stamp amount" value={formStampDuty} onChange={e => setFormStampDuty(e.target.value)} /></div></div>
      </CardContent></Card>
      {/* Possession & Document */}
      <Card className="border-gray-200 bg-white shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-base">Possession &amp; Document Validity</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><Label>Current Possessor</Label><Input placeholder="Who has possession?" value={formPossessor} onChange={e => setFormPossessor(e.target.value)} /></div><div className="space-y-2"><Label>Possession Start Date</Label><Input type="date" value={formPossStartDate} onChange={e => setFormPossStartDate(e.target.value)} /></div></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><Label>Possession Nature</Label><Select value={formPossNature} onValueChange={setFormPossNature}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="open">Open</SelectItem><SelectItem value="hostile">Hostile</SelectItem><SelectItem value="peaceful">Peaceful</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>PoA Holder</Label><Input placeholder="If applicable" value={formPoaHolder} onChange={e => setFormPoaHolder(e.target.value)} /></div></div>
        <div className="space-y-2"><Label>Physical Acts of Possession</Label><Input placeholder="e.g., construction, farming, fencing" value={formPossActs} onChange={e => setFormPossActs(e.target.value)} /></div>
        <Separator />
        <p className="text-xs font-medium text-muted-foreground">Document Validity Checks</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[{ l: 'S.17 Compliant', v: formS17, s: setFormS17 }, { l: 'S.49 Issue', v: formS49, s: setFormS49 }, { l: 'Benami Flag', v: formBenami, s: setFormBenami }, { l: 'Stamp Duty OK', v: formStampOk, s: setFormStampOk }].map(item => (<div key={item.l} className="space-y-2"><Label className="text-xs">{item.l}</Label><Select value={item.v} onValueChange={item.s}><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="N/A" /></SelectTrigger><SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent></Select></div>))}
        </div>
      </CardContent></Card>
      {/* Inheritance (collapsible) */}
      <Collapsible open={formInheritanceOpen} onOpenChange={setFormInheritanceOpen}>
        <Card className="border-gray-200 bg-white shadow-sm"><CardHeader className="pb-3 cursor-pointer" onClick={() => setFormInheritanceOpen(!formInheritanceOpen)}><CollapsibleTrigger className="flex items-center gap-2 w-full"><ChevronDown className={`h-4 w-4 transition-transform ${formInheritanceOpen ? 'rotate-180' : ''}`} /><CardTitle className="text-base">Inheritance (Optional)</CardTitle></CollapsibleTrigger></CardHeader><CollapsibleContent><CardContent className="space-y-4 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><Label>Religion</Label><Select value={formReligion} onValueChange={setFormReligion}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Islam">Islam</SelectItem><SelectItem value="Hindu">Hindu</SelectItem><SelectItem value="Christian">Christian</SelectItem><SelectItem value="Buddhist">Buddhist</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Applicable Law</Label><Input placeholder="e.g., MFLO" value={formApplicableLaw} onChange={e => setFormApplicableLaw(e.target.value)} /></div></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><Label>Will Exists?</Label><Select value={formWillExists} onValueChange={setFormWillExists}><SelectTrigger><SelectValue placeholder="N/A" /></SelectTrigger><SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Mutation Status</Label><Select value={formMutation} onValueChange={setFormMutation}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="completed">Completed</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="not_started">Not Started</SelectItem></SelectContent></Select></div></div>
        </CardContent></CollapsibleContent></Card>
      </Collapsible>
      {/* State Action (collapsible) */}
      <Collapsible open={formStateOpen} onOpenChange={setFormStateOpen}>
        <Card className="border-gray-200 bg-white shadow-sm"><CardHeader className="pb-3 cursor-pointer" onClick={() => setFormStateOpen(!formStateOpen)}><CollapsibleTrigger className="flex items-center gap-2 w-full"><ChevronDown className={`h-4 w-4 transition-transform ${formStateOpen ? 'rotate-180' : ''}`} /><CardTitle className="text-base">State Action (Optional)</CardTitle></CollapsibleTrigger></CardHeader><CollapsibleContent><CardContent className="space-y-4 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><Label>Acquisition Mutation</Label><Input placeholder="Status" value={formAcqMutation} onChange={e => setFormAcqMutation(e.target.value)} /></div><div className="space-y-2"><Label>Ceiling Exceeded?</Label><Select value={formCeilingExceeded} onValueChange={setFormCeilingExceeded}><SelectTrigger><SelectValue placeholder="N/A" /></SelectTrigger><SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent></Select></div></div>
          <div className="space-y-2"><Label>Acquisition Order</Label><Input placeholder="If applicable" value={formAcquisition} onChange={e => setFormAcquisition(e.target.value)} /></div>
        </CardContent></CollapsibleContent></Card>
      </Collapsible>
      {/* Submit */}
      <Button className="w-full h-12 text-base" onClick={handleAnalyzeCase} disabled={analyzing}>{analyzing ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Analyzing...</> : <><Scale className="h-5 w-5 mr-2" />Analyze Case</>}</Button>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════
  // CASE DETAIL VIEW
  // ═══════════════════════════════════════════════════════════════
  const renderCaseDetailView = (activeTab: string, onTabChange: (t: string) => void) => {
    if (!selectedCase) return null;
    const r = analysisResult;
    const paidTabs = ['pipeline', 'evidence', 'legal', 'arguments', 'strategy', 'advisory'];

    const handleTabChange = (tab: string) => {
      if (paidTabs.includes(tab) && !isPaidUnlocked()) { setUpgradeOpen(true); return; }
      onTabChange(tab);
    };

    const renderProLock = (tabName: string) => (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Lock className="h-12 w-12 text-amber-600/40 mb-4" />
        <h3 className="text-lg font-bold mb-1">{tabName}</h3>
        <p className="text-sm text-muted-foreground mb-4">Upgrade to PRO to unlock this analysis</p>
        <Button className="bg-black hover:bg-neutral-800 text-white" onClick={openUpgradeDialog}><Crown className="h-4 w-4 mr-2" />Upgrade to PRO</Button>
      </div>
    );

    const severityColor = (s: string) => {
      switch (s) {
        case 'critical': return 'bg-red-500';
        case 'red': return 'bg-red-600';
        case 'yellow': return 'bg-amber-500';
        case 'green': return 'bg-emerald-500';
        case 'info': return 'bg-blue-500';
        default: return 'bg-slate-400';
      }
    };

    const severityTextColor = (s: string) => {
      switch (s) {
        case 'critical': return 'text-red-600';
        case 'red': return 'text-red-600';
        case 'yellow': return 'text-amber-600';
        case 'green': return 'text-green-600';
        case 'info': return 'text-blue-600';
        default: return 'text-muted-foreground';
      }
    };

    const renderArgumentNode = (node: { id?: string; label: string; type: string; strength?: number; children?: Array<{ id?: string; label: string; type: string; strength?: number; children?: unknown[]; legalRef?: string; factBasis?: string }>; legalRef?: string; factBasis?: string }, depth = 0) => (
      <div key={node.id || node.label} className="ml-4" style={{ paddingLeft: depth > 0 ? '12px' : 0, borderLeft: depth > 0 ? '2px solid ' + (node.type === 'supporting' ? 'rgba(16,185,129,0.3)' : node.type === 'weakening' ? 'rgba(239,68,68,0.3)' : 'rgba(148,163,184,0.3)') : 'none' }}>
        <div className="flex items-start gap-2 py-1">
          <span className={`mt-1 h-2 w-2 rounded-full shrink-0 ${node.type === 'supporting' ? 'bg-emerald-400' : node.type === 'weakening' ? 'bg-red-400' : 'bg-slate-400'}`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{node.label}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <Badge variant="outline" className="text-[9px] px-1 py-0">{node.type}</Badge>
              {node.strength !== undefined && <span className="text-[10px] text-muted-foreground">Strength: {node.strength}/100</span>}
              {node.legalRef && <span className="text-[10px] text-primary">{node.legalRef}</span>}
            </div>
            {node.factBasis && <p className="text-[10px] text-muted-foreground mt-0.5">{node.factBasis}</p>}
          </div>
        </div>
        {node.children && node.children.map(child => renderArgumentNode(child as Parameters<typeof renderArgumentNode>[0], depth + 1))}
      </div>
    );

    const tabList = ['decision', 'pipeline', 'evidence', 'legal', 'arguments', 'strategy', 'advisory'];

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3"><button onClick={() => { if (loginRole === 'admin') { setView('admin-dash'); } else { setView('user-dash'); } }} className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft className="h-5 w-5" /></button><div className="flex-1 min-w-0"><h2 className="text-xl font-bold truncate">{selectedCase.title}</h2><p className="text-xs text-muted-foreground truncate">{selectedCase.caseNumber} &middot; {selectedCase.plaintiff} v. {selectedCase.defendant}</p></div><Badge variant={selectedCase.status === 'analyzed' ? 'default' : 'secondary'} className={selectedCase.status === 'analyzed' ? 'bg-emerald-500/10 text-green-600 border-emerald-500/20' : ''}>{selectedCase.status}</Badge></div>

        {r ? (<>
          {/* Score Banner */}
          <Card className="border-gray-200 shadow-sm"><CardContent className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Overall:</span>
                <Badge variant="default" className={`text-sm px-3 py-1 ${r.overallRisk === 'STRONG' ? 'bg-emerald-500/10 text-green-600 border-emerald-500/20' : r.overallRisk === 'MODERATE' ? 'bg-amber-500/10 text-amber-700 border-amber-500/20' : 'bg-red-600 text-white border-red-500/20'}`}>{r.overallRisk}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Score:</span>
                <span className="text-sm font-bold">{r.overallScore}/100</span>
                <Progress value={r.overallScore} className="h-2 w-24" />
              </div>
              {r.decision && (
                <div className="flex gap-3 text-xs">
                  <span className="text-muted-foreground">Win:</span>
                  <span className={`font-medium ${r.decision.winProbability >= 60 ? 'text-green-600' : r.decision.winProbability >= 40 ? 'text-amber-600' : 'text-red-600'}`}>{r.decision.winProbability}%</span>
                  {r.decision.estimatedTimeRange && <><span className="text-muted-foreground ml-2">Time:</span><span className="font-medium">{r.decision.estimatedTimeRange}</span></>}
                </div>
              )}
              <span className="text-[10px] text-muted-foreground ml-auto">{r.engineVersion}</span>
            </div>
          </CardContent></Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="flex-wrap gap-1 h-auto bg-gray-50 p-1">
              {tabList.map(tab => (
                <TabsTrigger key={tab} value={tab} className="text-xs px-3 py-1.5 data-[state=active]:bg-white capitalize">
                  {tab === 'legal' ? 'Legal Analysis' : tab}
                  {paidTabs.includes(tab) && !isPaidUnlocked() && <Lock className="h-3 w-3 ml-1 text-amber-600" />}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ═══ DECISION TAB ═══ */}
            <TabsContent value="decision" className="mt-4">
              <Card className="border-gray-200 bg-white shadow-sm"><CardContent className="p-4 space-y-5">
                {r.decision ? (<>
                  {/* Outcome & Strength */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-lg bg-gray-50 text-center">
                      <p className="text-[10px] text-muted-foreground mb-1">Outcome</p>
                      <Badge className={`text-sm font-bold px-3 py-1 ${r.decision.outcomeType === 'full_decree' ? 'bg-emerald-500/10 text-green-600 border-emerald-500/20' : r.decision.outcomeType === 'partial_decree' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : r.decision.outcomeType === 'dismissal' || r.decision.outcomeType === 'rejection_of_plaint' ? 'bg-red-500/10 text-red-600 border-red-500/20' : 'bg-blue-500/10 text-blue-600 border-blue-500/20'}`}>
                        {r.decision.outcomeType.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50 text-center">
                      <p className="text-[10px] text-muted-foreground mb-1">Overall Risk</p>
                      <span className={`text-lg font-bold ${r.overallRisk === 'STRONG' ? 'text-green-600' : r.overallRisk === 'MODERATE' ? 'text-amber-600' : 'text-red-600'}`}>{r.overallRisk}</span>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50 text-center">
                      <p className="text-[10px] text-muted-foreground mb-1">Case Strength</p>
                      <span className={`text-lg font-bold ${r.decision.overallStrength === 'STRONG' ? 'text-green-600' : r.decision.overallStrength === 'MODERATE' ? 'text-amber-600' : 'text-red-600'}`}>{r.decision.overallStrength}</span>
                    </div>
                  </div>

                  {/* Win Probability Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">Win Probability</span>
                      <span className={`text-sm font-bold ${r.decision.winProbability >= 60 ? 'text-green-600' : r.decision.winProbability >= 40 ? 'text-amber-600' : 'text-red-600'}`}>{r.decision.winProbability}%</span>
                    </div>
                    <Progress value={r.decision.winProbability} className="h-3" />
                    <div className="flex justify-between text-[9px] text-muted-foreground"><span>0%</span><span>100%</span></div>
                  </div>

                  {/* Estimated Time */}
                  {r.decision.estimatedTimeRange && (
                    <div className="p-3 rounded-lg bg-gray-50">
                      <p className="text-[10px] text-muted-foreground">Estimated Duration</p>
                      <p className="text-sm font-semibold">{r.decision.estimatedTimeRange}</p>
                    </div>
                  )}

                  {/* Granted Reliefs */}
                  {r.decision.grantedReliefs && r.decision.grantedReliefs.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" />Granted Reliefs</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {r.decision.grantedReliefs.map((gr, i) => (
                          <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium">{gr.relief.replace(/_/g, ' ')}</p>
                              <p className="text-[11px] text-muted-foreground">{gr.description}</p>
                              {gr.legalRef && <p className="text-[9px] text-primary mt-0.5">{gr.legalRef}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Refused Reliefs */}
                  {r.decision.refusedReliefs && r.decision.refusedReliefs.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><XCircle className="h-4 w-4 text-red-600" />Refused Reliefs</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {r.decision.refusedReliefs.map((rr, i) => (
                          <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/5 border border-red-500/10">
                            <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium">{rr.relief.replace(/_/g, ' ')}</p>
                              <p className="text-[11px] text-muted-foreground">{rr.reason}</p>
                              {rr.legalRef && <p className="text-[9px] text-primary mt-0.5">{rr.legalRef}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Strategic Recommendations */}
                  {r.decision.strategicRecommendations && r.decision.strategicRecommendations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />Strategic Recommendations</h4>
                      <div className="space-y-1.5">
                        {r.decision.strategicRecommendations.map((rec, i) => (
                          <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-primary/5">
                            <ArrowRight className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                            <span className="text-xs">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Risk Factors */}
                  {r.decision.riskFactors && r.decision.riskFactors.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-600" />Risk Factors</h4>
                      <div className="space-y-1.5">
                        {r.decision.riskFactors.map((risk, i) => (
                          <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                            <AlertTriangle className="h-3 w-3 text-amber-600 shrink-0 mt-0.5" />
                            <span className="text-xs">{risk}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Conditions */}
                  {r.decision.conditions && r.decision.conditions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Conditions</h4>
                      <div className="space-y-1">
                        {r.decision.conditions.map((c, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <span className="text-[9px] text-muted-foreground">{i + 1}.</span>
                            <span>{c}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>) : <p className="text-xs text-muted-foreground">No decision data available.</p>}
              </CardContent></Card>
            </TabsContent>

            {/* ═══ PIPELINE TAB ═══ */}
            <TabsContent value="pipeline" className="mt-4">
              {paidTabs.includes('pipeline') && !isPaidUnlocked() ? renderProLock('Stage Pipeline') : (
                <Card className="border-gray-200 bg-white shadow-sm"><CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">14-Stage Pipeline</h4>
                    <span className="text-[10px] text-muted-foreground">14-stage analysis</span>
                  </div>
                  <div className="space-y-2 max-h-[32rem] overflow-y-auto">
                    {r.pipeline && r.pipeline.length > 0 ? r.pipeline.map((stage, i) => (
                      <div key={i} className={`p-3 rounded-lg border ${stage.status === 'skipped' ? 'bg-gray-50/50 border-gray-100 opacity-60' : stage.status === 'error' ? 'bg-red-500/5 border-red-500/20' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center gap-3">
                          <span className={`h-3 w-3 rounded-full shrink-0 ${severityColor(stage.severity)}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-semibold">Stage {stage.stageNumber}</span>
                              <span className="text-xs text-muted-foreground">{stage.stageName}</span>
                              <Badge variant="outline" className={`text-[9px] ${stage.status === 'completed' ? 'border-emerald-500/30 text-green-600' : stage.status === 'skipped' ? 'border-gray-300 text-muted-foreground' : stage.status === 'error' ? 'border-red-500/30 text-red-600' : 'border-blue-500/30 text-blue-600'}`}>
                                {stage.status}
                              </Badge>
                            </div>
                            {stage.summary && <p className="text-[11px] text-muted-foreground mt-0.5">{stage.summary}</p>}
                            {stage.legalRef && <p className="text-[9px] text-primary mt-0.5">{stage.legalRef}</p>}
                          </div>
                        </div>
                        {stage.flags && stage.flags.length > 0 && (
                          <div className="mt-2 ml-6 space-y-1">
                            {stage.flags.slice(0, 3).map((flag, fi) => (
                              <div key={fi} className="flex items-center gap-1.5">
                                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${severityColor(flag.severity)}`} />
                                <span className={`text-[10px] ${severityTextColor(flag.severity)}`}>{flag.message}</span>
                                {flag.legalRef && <span className="text-[9px] text-muted-foreground">{flag.legalRef}</span>}
                              </div>
                            ))}
                            {stage.flags.length > 3 && <p className="text-[9px] text-muted-foreground">+{stage.flags.length - 3} more flags</p>}
                          </div>
                        )}
                      </div>
                    )) : <p className="text-xs text-muted-foreground text-center py-4">No pipeline data available.</p>}
                  </div>
                </CardContent></Card>
              )}
            </TabsContent>

            {/* ═══ EVIDENCE TAB ═══ */}
            <TabsContent value="evidence" className="mt-4">
              {paidTabs.includes('evidence') && !isPaidUnlocked() ? renderProLock('Evidence Analysis') : (
                <Card className="border-gray-200 bg-white shadow-sm"><CardContent className="p-4 space-y-4">
                  {r.stage8 ? (<>
                    {/* Evidence Strength Header */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-4 rounded-lg bg-gray-50 text-center">
                        <p className="text-[10px] text-muted-foreground mb-1">Evidence Strength</p>
                        <span className={`text-2xl font-bold ${r.stage8.evidenceStrength >= 60 ? 'text-green-600' : r.stage8.evidenceStrength >= 40 ? 'text-amber-600' : 'text-red-600'}`}>{r.stage8.evidenceStrength}</span>
                        <span className="text-xs text-muted-foreground">/100</span>
                      </div>
                      <div className="p-4 rounded-lg bg-gray-50 text-center">
                        <p className="text-[10px] text-muted-foreground mb-1">Burden of Proof</p>
                        <Badge variant="outline" className="text-xs mt-1">{r.stage8.burdenOfProof}</Badge>
                      </div>
                    </div>
                    <Progress value={r.stage8.evidenceStrength} className="h-2" />

                    {/* Key Strengths & Weaknesses */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {r.stage8.keyStrengths && r.stage8.keyStrengths.length > 0 && (
                        <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                          <h5 className="text-xs font-semibold text-green-700 mb-2">Key Strengths</h5>
                          <div className="space-y-1">
                            {r.stage8.keyStrengths.map((s, i) => (
                              <div key={i} className="flex items-start gap-1.5"><CheckCircle2 className="h-3 w-3 text-green-600 shrink-0 mt-0.5" /><span className="text-[11px]">{s}</span></div>
                            ))}
                          </div>
                        </div>
                      )}
                      {r.stage8.keyWeaknesses && r.stage8.keyWeaknesses.length > 0 && (
                        <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                          <h5 className="text-xs font-semibold text-red-700 mb-2">Key Weaknesses</h5>
                          <div className="space-y-1">
                            {r.stage8.keyWeaknesses.map((w, i) => (
                              <div key={i} className="flex items-start gap-1.5"><XCircle className="h-3 w-3 text-red-600 shrink-0 mt-0.5" /><span className="text-[11px]">{w}</span></div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Adversarial Threshold */}
                    {r.stage8.adversarialThreshold && (
                      <div className="p-3 rounded-lg bg-gray-50">
                        <p className="text-[10px] text-muted-foreground">Adversarial Threshold</p>
                        <p className="text-xs font-medium">{r.stage8.adversarialThreshold}</p>
                      </div>
                    )}

                    {/* Digital Evidence */}
                    {(r.stage8.digitalEvidenceAdmissible !== undefined || r.stage8.s65bCertificate !== undefined) && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-2.5 rounded-lg bg-gray-50 text-center">
                          <p className="text-[9px] text-muted-foreground">Digital Evidence</p>
                          <span className={`text-xs font-bold ${r.stage8.digitalEvidenceAdmissible ? 'text-green-600' : 'text-red-600'}`}>{r.stage8.digitalEvidenceAdmissible ? 'Admissible' : 'Not Admissible'}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-gray-50 text-center">
                          <p className="text-[9px] text-muted-foreground">S.65B Certificate</p>
                          <span className={`text-xs font-bold ${r.stage8.s65bCertificate ? 'text-green-600' : 'text-red-600'}`}>{r.stage8.s65bCertificate ? 'Available' : 'Missing'}</span>
                        </div>
                      </div>
                    )}

                    {/* Evidence Act Rules */}
                    {r.stage8.evidenceActRules && r.stage8.evidenceActRules.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Evidence Act Rules Applied</h4>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {r.stage8.evidenceActRules.map((rule, i) => (
                            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50">
                              <Badge variant="outline" className="text-[9px] shrink-0 text-primary">{rule.section}</Badge>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium">{rule.rule}</p>
                                <p className="text-[10px] text-muted-foreground">{rule.application}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Document Hierarchy */}
                    {r.stage8.documentHierarchy && r.stage8.documentHierarchy.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Document Hierarchy</h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {r.stage8.documentHierarchy.map((doc, i) => (
                            <div key={i} className={`p-3 rounded-lg border ${doc.admissible ? 'bg-gray-50 border-gray-200' : 'bg-red-500/5 border-red-500/20'}`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium">{doc.type}</span>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-bold ${doc.weight >= 7 ? 'text-green-600' : doc.weight >= 4 ? 'text-amber-600' : 'text-red-600'}`}>Weight: {doc.weight}/10</span>
                                  <Badge variant={doc.admissible ? 'default' : 'destructive'} className={`text-[9px] ${doc.admissible ? 'bg-emerald-500/10 text-green-600 border-emerald-500/20' : ''}`}>
                                    {doc.admissible ? 'Admissible' : 'Inadmissible'}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-[11px] text-muted-foreground">{doc.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Progress value={doc.weight * 10} className="h-1.5 flex-1" />
                                {doc.legalRef && <span className="text-[9px] text-primary shrink-0">{doc.legalRef}</span>}
                              </div>
                              {doc.bar && <p className="text-[9px] text-red-600 mt-1">Bar: {doc.bar}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>) : <p className="text-xs text-muted-foreground">No evidence analysis data available for this case type.</p>}
                </CardContent></Card>
              )}
            </TabsContent>

            {/* ═══ LEGAL ANALYSIS TAB ═══ */}
            <TabsContent value="legal" className="mt-4">
              {paidTabs.includes('legal') && !isPaidUnlocked() ? renderProLock('Legal Analysis') : (
                <Card className="border-gray-200 bg-white shadow-sm"><CardContent className="p-4 space-y-5">
                  {/* Stage 7: SRA Engine — Possession, SP, Declaration, Cancellation, Injunction */}
                  {r.stage7 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><Scale className="h-4 w-4 text-primary" />SRA Engine (Stage 7)</h4>

                        {/* Possession Track */}
                        {r.stage7.possession && (
                          <div className="mb-4 p-3 rounded-lg bg-gray-50 space-y-2">
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-semibold">Possession Track ({r.stage7.possession.track})</h5>
                              <Badge variant={r.stage7.possession.allMet ? 'default' : 'destructive'} className={`text-[9px] ${r.stage7.possession.allMet ? 'bg-emerald-500/10 text-green-600 border-emerald-500/20' : ''}`}>
                                {r.stage7.possession.allMet ? 'ALL MET' : 'NOT ALL MET'}
                              </Badge>
                            </div>
                            <p className="text-[10px] text-muted-foreground">Trigger: {r.stage7.possession.trigger}</p>
                            <p className="text-[10px] text-muted-foreground">Limitation: {r.stage7.possession.limitation}</p>
                            {r.stage7.possession.elements.map((el, i) => (
                              <div key={i} className="flex items-start gap-2">
                                {el.met ? <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0 mt-0.5" /> : <XCircle className="h-3 w-3 text-red-600 shrink-0 mt-0.5" />}
                                <div><p className="text-[11px] font-medium">{el.name}</p><p className="text-[10px] text-muted-foreground">{el.description}</p></div>
                              </div>
                            ))}
                            {r.stage7.possession.outcome && <p className="text-[11px] font-medium text-primary mt-1">Outcome: {r.stage7.possession.outcome}</p>}
                          </div>
                        )}

                        {/* Specific Performance 5-Step */}
                        {r.stage7.specificPerformance && (
                          <div className="mb-4 p-3 rounded-lg bg-gray-50 space-y-3">
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-semibold">Specific Performance (5-Step Test)</h5>
                              <Badge variant={r.stage7.specificPerformance.finalOutcome === 'granted' ? 'default' : 'destructive'} className={`text-[9px] ${r.stage7.specificPerformance.finalOutcome === 'granted' ? 'bg-emerald-500/10 text-green-600 border-emerald-500/20' : r.stage7.specificPerformance.finalOutcome === 'conditional' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : ''}`}>
                                {r.stage7.specificPerformance.finalOutcome.replace(/_/g, ' ')}
                              </Badge>
                            </div>
                            <Accordion type="single" collapsible className="w-full">
                              <AccordionItem value="s14">
                                <AccordionTrigger className="text-[11px] py-1.5">S.14 Bar Check {r.stage7.specificPerformance.s14BarCheck.anyBarApplies && <span className="text-[9px] text-red-600">(Bars Apply)</span>}</AccordionTrigger>
                                <AccordionContent className="space-y-1 pb-2">
                                  {r.stage7.specificPerformance.s14BarCheck.bars.map((b, i) => (
                                    <div key={i} className="flex items-center gap-2 text-[10px]">
                                      {b.applicable ? <XCircle className="h-3 w-3 text-red-600 shrink-0" /> : <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />}
                                      <span>{b.bar}</span>
                                      <span className="text-muted-foreground">{b.description}</span>
                                    </div>
                                  ))}
                                </AccordionContent>
                              </AccordionItem>
                              <AccordionItem value="s16">
                                <AccordionTrigger className="text-[11px] py-1.5">S.16 Personal Bar {r.stage7.specificPerformance.s16PersonalBar.anyBarApplies && <span className="text-[9px] text-red-600">(Bars Apply)</span>}</AccordionTrigger>
                                <AccordionContent className="space-y-1 pb-2">
                                  {r.stage7.specificPerformance.s16PersonalBar.bars.map((b, i) => (
                                    <div key={i} className="flex items-center gap-2 text-[10px]">
                                      {b.applicable ? <XCircle className="h-3 w-3 text-red-600 shrink-0" /> : <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />}
                                      <span>{b.bar}: {b.description}</span>
                                    </div>
                                  ))}
                                  <p className="text-[10px] text-muted-foreground">Readiness & Willingness: {r.stage7.specificPerformance.s16PersonalBar.readinessWillingnessProven ? '✓ Proven' : '✗ Not Proven'}</p>
                                </AccordionContent>
                              </AccordionItem>
                              <AccordionItem value="s21">
                                <AccordionTrigger className="text-[11px] py-1.5">S.21 Contract Validity</AccordionTrigger>
                                <AccordionContent className="space-y-1 pb-2">
                                  {[
                                    ['In Writing', r.stage7.specificPerformance.s21ContractValid.inWriting],
                                    ['Terms Certain', r.stage7.specificPerformance.s21ContractValid.termsCertain],
                                    ['Consideration', r.stage7.specificPerformance.s21ContractValid.considerationExists],
                                    ['No Illegality', r.stage7.specificPerformance.s21ContractValid.noIllegality],
                                    ['Competent Parties', r.stage7.specificPerformance.s21ContractValid.partiesCompetent],
                                  ].map(([label, val], i) => (
                                    <div key={i} className="flex items-center gap-2 text-[10px]">
                                      {val ? <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" /> : <XCircle className="h-3 w-3 text-red-600 shrink-0" />}
                                      <span>{label}</span>
                                    </div>
                                  ))}
                                  <p className={`text-[10px] font-medium mt-1 ${r.stage7.specificPerformance.s21ContractValid.allValid ? 'text-green-600' : 'text-red-600'}`}>
                                    Overall: {r.stage7.specificPerformance.s21ContractValid.allValid ? 'All Valid' : 'Issues Found'}
                                  </p>
                                </AccordionContent>
                              </AccordionItem>
                              <AccordionItem value="s10">
                                <AccordionTrigger className="text-[11px] py-1.5">S.10 Damages Inadequate</AccordionTrigger>
                                <AccordionContent className="space-y-1 pb-2">
                                  <p className="text-[10px]">Presumed Inadequate: {r.stage7.specificPerformance.s10DamagesInadequate.presumedInadequate ? 'Yes' : 'No'}</p>
                                  <p className="text-[10px]">Immovable Property: {r.stage7.specificPerformance.s10DamagesInadequate.immovableProperty ? 'Yes' : 'No'}</p>
                                  <p className="text-[10px]">Damages Adequate: {r.stage7.specificPerformance.s10DamagesInadequate.damagesAdequate ? 'Yes' : 'No'}</p>
                                </AccordionContent>
                              </AccordionItem>
                              <AccordionItem value="s22">
                                <AccordionTrigger className="text-[11px] py-1.5">S.22 Discretion ({r.stage7.specificPerformance.s22Discretion.netAssessment})</AccordionTrigger>
                                <AccordionContent className="space-y-1 pb-2">
                                  {r.stage7.specificPerformance.s22Discretion.inFavourFactors.length > 0 && (
                                    <div><p className="text-[10px] text-green-600 font-medium">In Favour:</p>{r.stage7.specificPerformance.s22Discretion.inFavourFactors.map((f, i) => <p key={i} className="text-[10px] text-muted-foreground">+ {f}</p>)}</div>
                                  )}
                                  {r.stage7.specificPerformance.s22Discretion.againstFactors.length > 0 && (
                                    <div><p className="text-[10px] text-red-600 font-medium">Against:</p>{r.stage7.specificPerformance.s22Discretion.againstFactors.map((f, i) => <p key={i} className="text-[10px] text-muted-foreground">- {f}</p>)}</div>
                                  )}
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                            {r.stage7.specificPerformance.conditions && r.stage7.specificPerformance.conditions.length > 0 && (
                              <div className="mt-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                                <p className="text-[9px] text-amber-600 font-semibold">Conditions:</p>
                                {r.stage7.specificPerformance.conditions.map((c, i) => <p key={i} className="text-[10px]">{c}</p>)}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Declaration */}
                        {r.stage7.declaration && (
                          <div className="mb-4 p-3 rounded-lg bg-gray-50 space-y-2">
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-semibold">Declaration (S.42)</h5>
                              <Badge variant={r.stage7.declaration.outcome === 'granted' ? 'default' : 'destructive'} className={`text-[9px] ${r.stage7.declaration.outcome === 'granted' ? 'bg-emerald-500/10 text-green-600 border-emerald-500/20' : ''}`}>
                                {r.stage7.declaration.outcome}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                              <div>Standing: <span className={r.stage7.declaration.standing ? 'text-green-600' : 'text-red-600'}>{r.stage7.declaration.standing ? 'Yes' : 'No'}</span></div>
                              <div>Maintainable: <span className={r.stage7.declaration.maintainable ? 'text-green-600' : 'text-red-600'}>{r.stage7.declaration.maintainable ? 'Yes' : 'No'}</span></div>
                              <div>Gov Defendant: <span className={r.stage7.declaration.governmentDefendant ? 'text-amber-600' : 'text-muted-foreground'}>{r.stage7.declaration.governmentDefendant ? 'Yes' : 'No'}</span></div>
                              <div>S.80 Notice: <span className={r.stage7.declaration.s80NoticeGiven ? 'text-green-600' : 'text-red-600'}>{r.stage7.declaration.s80NoticeGiven ? 'Given' : 'Not Given'}</span></div>
                            </div>
                            {r.stage7.declaration.standingIssue && <p className="text-[10px] text-red-600">Standing Issue: {r.stage7.declaration.standingIssue}</p>}
                            {r.stage7.declaration.maintainabilityIssue && <p className="text-[10px] text-red-600">Maintainability Issue: {r.stage7.declaration.maintainabilityIssue}</p>}
                          </div>
                        )}

                        {/* Cancellation */}
                        {r.stage7.cancellation && (
                          <div className="mb-4 p-3 rounded-lg bg-gray-50 space-y-2">
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-semibold">Cancellation of Deed (S.39)</h5>
                              <Badge variant={r.stage7.cancellation.outcome === 'granted' ? 'default' : 'destructive'} className={`text-[9px] ${r.stage7.cancellation.outcome === 'granted' ? 'bg-emerald-500/10 text-green-600 border-emerald-500/20' : ''}`}>
                                {r.stage7.cancellation.outcome}
                              </Badge>
                            </div>
                            <p className="text-[10px]">Nature: <span className="font-medium">{r.stage7.cancellation.voidableOrVoid}</span></p>
                            <div className="space-y-1">
                              {r.stage7.cancellation.grounds.map((g, i) => (
                                <div key={i} className="flex items-center gap-2 text-[10px]">
                                  {g.proven ? <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" /> : <XCircle className="h-3 w-3 text-slate-400 shrink-0" />}
                                  <span>{g.ground}: {g.description}</span>
                                </div>
                              ))}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                              <div>Within 3 Years: <span className={r.stage7.cancellation.limitationCheck.within3Years ? 'text-green-600' : 'text-red-600'}>{r.stage7.cancellation.limitationCheck.within3Years ? 'Yes' : 'No'}</span></div>
                              <div>Restitution: <span className={r.stage7.cancellation.restitution.required ? 'text-amber-600' : 'text-muted-foreground'}>{r.stage7.cancellation.restitution.required ? 'Required' : 'N/A'}</span></div>
                            </div>
                          </div>
                        )}

                        {/* Temporary Injunction */}
                        {r.stage7.temporaryInjunction && (
                          <div className="mb-4 p-3 rounded-lg bg-gray-50 space-y-2">
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-semibold">Temporary Injunction (O.39)</h5>
                              <Badge variant={r.stage7.temporaryInjunction.outcome === 'refused' ? 'destructive' : 'default'} className={`text-[9px] ${r.stage7.temporaryInjunction.outcome !== 'refused' ? 'bg-emerald-500/10 text-green-600 border-emerald-500/20' : ''}`}>
                                {r.stage7.temporaryInjunction.outcome.replace(/_/g, ' ')}
                              </Badge>
                            </div>
                            {[
                              ['Prima Facie Case', r.stage7.temporaryInjunction.primaFacieCase],
                              ['Irreparable Injury', r.stage7.temporaryInjunction.irreparableInjury],
                              ['All Three Met', r.stage7.temporaryInjunction.allThreeMet],
                            ].map(([label, val], i) => (
                              <div key={i} className="flex items-center gap-2 text-[10px]">
                                {val ? <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" /> : <XCircle className="h-3 w-3 text-red-600 shrink-0" />}
                                <span>{label}</span>
                              </div>
                            ))}
                            <p className="text-[10px] text-muted-foreground">Balance of Convenience: {r.stage7.temporaryInjunction.balanceOfConvenience}</p>
                            {r.stage7.temporaryInjunction.exParteAvailable && <p className="text-[10px] text-blue-600">Ex-parte available</p>}
                          </div>
                        )}

                        {/* Permanent Injunction */}
                        {r.stage7.permanentInjunction && (
                          <div className="mb-4 p-3 rounded-lg bg-gray-50 space-y-2">
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-semibold">Permanent Injunction (S.52-57)</h5>
                              <Badge variant={r.stage7.permanentInjunction.outcome === 'refused' ? 'destructive' : 'default'} className={`text-[9px] ${r.stage7.permanentInjunction.outcome !== 'refused' ? 'bg-emerald-500/10 text-green-600 border-emerald-500/20' : ''}`}>
                                {r.stage7.permanentInjunction.outcome}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                              <div>Breach of Obligation: <span className={r.stage7.permanentInjunction.breachOfObligation ? 'text-green-600' : 'text-red-600'}>{r.stage7.permanentInjunction.breachOfObligation ? 'Yes' : 'No'}</span></div>
                              <div>Compensation Inadequate: <span className={r.stage7.permanentInjunction.compensationInadequate ? 'text-green-600' : 'text-red-600'}>{r.stage7.permanentInjunction.compensationInadequate ? 'Yes' : 'No'}</span></div>
                            </div>
                            {r.stage7.permanentInjunction.bars && r.stage7.permanentInjunction.bars.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-[10px] font-semibold">Bars:</p>
                                {r.stage7.permanentInjunction.bars.map((b, i) => (
                                  <div key={i} className={`flex items-center gap-2 text-[10px] p-1 rounded ${b.applies ? 'bg-red-500/5' : ''}`}>
                                    {b.applies ? <AlertTriangle className="h-3 w-3 text-red-600 shrink-0" /> : <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />}
                                    <span>{b.bar}: {b.description} ({b.section})</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Applicable Reliefs */}
                        {r.stage7.applicableReliefs && r.stage7.applicableReliefs.length > 0 && (
                          <div>
                            <h5 className="text-xs font-semibold mb-2">Applicable Reliefs</h5>
                            <div className="flex flex-wrap gap-1.5">
                              {r.stage7.applicableReliefs.map((relief, i) => (
                                <Badge key={i} className="bg-black text-white border-primary/20 text-[10px]">{relief.replace(/_/g, ' ')}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Stage 2.5: TPA / SAT Act */}
                  {r.stage25 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><Landmark className="h-4 w-4 text-primary" />TPA / SAT Act Analysis (Stage 2.5)</h4>

                        {/* Sale Validity */}
                        <div className="mb-4 p-3 rounded-lg bg-gray-50 space-y-2">
                          <h5 className="text-xs font-semibold">Sale Validity</h5>
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div>Registered: <span className={r.stage25.saleValidity.registered ? 'text-green-600' : 'text-red-600'}>{r.stage25.saleValidity.registered ? 'Yes' : 'No'}</span></div>
                            <div>{'Consideration > 100'}: <span className={r.stage25.saleValidity.considerationOver100 ? 'text-green-600' : 'text-muted-foreground'}>{r.stage25.saleValidity.considerationOver100 ? 'Yes' : 'No'}</span></div>
                            <div>Valid S.54: <span className={r.stage25.saleValidity.validUnderS54 ? 'text-green-600' : 'text-red-600'}>{r.stage25.saleValidity.validUnderS54 ? 'Yes' : 'No'}</span></div>
                            <div>Valid S.17: <span className={r.stage25.saleValidity.validUnderS17 ? 'text-green-600' : 'text-red-600'}>{r.stage25.saleValidity.validUnderS17 ? 'Yes' : 'No'}</span></div>
                          </div>
                          {r.stage25.saleValidity.issues.length > 0 && (
                            <div className="mt-1 space-y-0.5">{r.stage25.saleValidity.issues.map((iss, i) => <p key={i} className="text-[10px] text-red-600">⚠ {iss}</p>)}</div>
                          )}
                        </div>

                        {/* Double Sale */}
                        {r.stage25.doubleSale && (
                          <div className="mb-4 p-3 rounded-lg bg-gray-50 space-y-2">
                            <h5 className="text-xs font-semibold">Double Sale (S.47)</h5>
                            <p className="text-[10px]">Is Double Sale: <span className={r.stage25.doubleSale.isDoubleSale ? 'font-medium text-red-600' : 'text-muted-foreground'}>{r.stage25.doubleSale.isDoubleSale ? 'Yes' : 'No'}</span></p>
                            {r.stage25.doubleSale.isDoubleSale && (
                              <>
                                <div className="grid grid-cols-2 gap-2 text-[10px]">
                                  <div>1st Deed: {r.stage25.doubleSale.firstDeed.date} ({r.stage25.doubleSale.firstDeed.registered ? 'Registered' : 'Unregistered'})</div>
                                  <div>2nd Deed: {r.stage25.doubleSale.secondDeed.date} ({r.stage25.doubleSale.secondDeed.registered ? 'Registered' : 'Unregistered'})</div>
                                </div>
                                <p className="text-[10px]">Prevailing Buyer: <span className="font-medium">{r.stage25.doubleSale.prevailingBuyer}</span></p>
                                <p className="text-[10px] text-muted-foreground">{r.stage25.doubleSale.section48Analysis}</p>
                              </>
                            )}
                          </div>
                        )}

                        {/* Ostensible Owner */}
                        {r.stage25.ostensibleOwner && (
                          <div className="mb-4 p-3 rounded-lg bg-gray-50 space-y-1">
                            <h5 className="text-xs font-semibold">Ostensible Owner (S.41)</h5>
                            <p className="text-[10px]">Protected: <span className={r.stage25.ostensibleOwner.protected ? 'text-green-600' : 'text-red-600'}>{r.stage25.ostensibleOwner.protected ? 'Yes' : 'No'}</span></p>
                            {[
                              ['Consent of Real Owner', r.stage25.ostensibleOwner.conditions.consentOfRealOwner],
                              ['For Consideration', r.stage25.ostensibleOwner.conditions.forConsideration],
                              ['Good Faith & Due Care', r.stage25.ostensibleOwner.conditions.goodFaithDueCare],
                            ].map(([l, v], i) => (
                              <div key={i} className="flex items-center gap-2 text-[10px]">
                                {v ? <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" /> : <XCircle className="h-3 w-3 text-red-600 shrink-0" />}
                                <span>{l}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Mortgage */}
                        {r.stage25.mortgage && (
                          <div className="mb-4 p-3 rounded-lg bg-gray-50 space-y-1">
                            <h5 className="text-xs font-semibold">Mortgage Analysis</h5>
                            <p className="text-[10px]">Type: <span className="font-medium">{r.stage25.mortgage.type}</span></p>
                            <p className="text-[10px]">Redemption Available: <span className={r.stage25.mortgage.redemptionAvailable ? 'text-green-600' : 'text-red-600'}>{r.stage25.mortgage.redemptionAvailable ? 'Yes' : 'No'}</span></p>
                            <p className="text-[10px]">Clog on Equity: <span className={r.stage25.mortgage.clogOnEquity ? 'text-red-600' : 'text-green-600'}>{r.stage25.mortgage.clogOnEquity ? 'Yes' : 'No'}</span></p>
                            {r.stage25.mortgage.remedies.length > 0 && <p className="text-[10px] text-muted-foreground">Remedies: {r.stage25.mortgage.remedies.join(', ')}</p>}
                          </div>
                        )}

                        {/* SAT Act */}
                        {r.stage25.satAct && (
                          <div className="mb-4 p-3 rounded-lg bg-gray-50 space-y-2">
                            <h5 className="text-xs font-semibold">SAT Act Analysis</h5>
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                              <div>Khas Land: <span className={r.stage25.satAct.khasLand ? 'text-amber-600' : 'text-muted-foreground'}>{r.stage25.satAct.khasLand ? 'Yes' : 'No'}</span></div>
                              <div>Mutation: <Badge variant="outline" className="text-[9px]">{r.stage25.satAct.mutationStatus.replace(/_/g, ' ')}</Badge></div>
                            </div>
                            <p className="text-[10px] text-muted-foreground">Mutation Weight: {r.stage25.satAct.mutationWeight}</p>
                            <p className="text-[10px] text-muted-foreground">{r.stage25.satAct.recordOfRightsAnalysis}</p>
                          </div>
                        )}

                        {/* Stage 2.5 Flags */}
                        {r.stage25.flags && r.stage25.flags.length > 0 && (
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {r.stage25.flags.map((f, i) => (
                              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50">
                                <span className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${severityColor(f.severity)}`} />
                                <div className="flex-1 min-w-0">
                                  <p className={`text-[10px] ${severityTextColor(f.severity)}`}>{f.message}</p>
                                  <p className="text-[9px] text-muted-foreground">{f.legalRef}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Stage 11: Adverse Possession */}
                  {r.stage11 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><Timer className="h-4 w-4 text-primary" />Adverse Possession (Stage 11)</h4>
                        <div className="p-3 rounded-lg bg-gray-50 space-y-3">
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div>Position: <Badge variant="outline" className="text-[9px]">{r.stage11.position}</Badge></div>
                            <div>All Elements Met: <span className={r.stage11.allElementsMet ? 'text-green-600 font-bold' : 'text-red-600'}>{r.stage11.allElementsMet ? 'Yes' : 'No'}</span></div>
                            {r.stage11.continuousYears !== undefined && <div>Continuous: <span className="font-medium">{r.stage11.continuousYears} years</span></div>}
                            <div>Tacking Available: <span className={r.stage11.tackingAvailable ? 'text-green-600' : 'text-muted-foreground'}>{r.stage11.tackingAvailable ? 'Yes' : 'No'}</span></div>
                          </div>
                          <div>
                            <h5 className="text-xs font-semibold mb-2">6 Elements</h5>
                            <div className="space-y-1.5">
                              {r.stage11.elements.map((el, i) => (
                                <div key={i} className={`flex items-start gap-2 p-2 rounded-lg ${el.proven ? 'bg-emerald-500/5' : 'bg-red-500/5'}`}>
                                  {el.proven ? <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0 mt-0.5" /> : <XCircle className="h-3 w-3 text-red-600 shrink-0 mt-0.5" />}
                                  <div className="flex-1">
                                    <p className="text-[11px] font-medium">{el.name}</p>
                                    <p className="text-[10px] text-muted-foreground">{el.description}</p>
                                    <p className="text-[9px] text-primary mt-0.5">Evidence: {el.evidence}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          {r.stage11.gaps && r.stage11.gaps.length > 0 && (
                            <div className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                              <p className="text-[10px] font-semibold text-amber-600">Gaps in Possession:</p>
                              {r.stage11.gaps.map((g, i) => <p key={i} className="text-[10px]">⚠ {g}</p>)}
                            </div>
                          )}
                          <div className="p-2 rounded-lg bg-primary/5 border border-primary/10">
                            <p className="text-[10px] text-muted-foreground">Outcome</p>
                            <p className="text-xs font-semibold">{r.stage11.outcome.replace(/_/g, ' ')}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Stage 12: Pre-emption */}
                  {r.stage12 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><Users className="h-4 w-4 text-primary" />Pre-emption (Stage 12)</h4>
                        <div className="p-3 rounded-lg bg-gray-50 space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div>Applicable: <span className={r.stage12.applicable ? 'text-green-600' : 'text-muted-foreground'}>{r.stage12.applicable ? 'Yes' : 'No'}</span></div>
                            <div>Claimant: <span className="font-medium">{r.stage12.claimantType}</span></div>
                            <div>Priority: <span className="font-medium">#{r.stage12.priority}</span></div>
                            <div>Within 4 Months: <span className={r.stage12.limitation4Months ? 'text-green-600' : 'text-red-600'}>{r.stage12.limitation4Months ? 'Yes' : 'No'}</span></div>
                            <div>Pre-Deposit: <span className={r.stage12.preDepositMade ? 'text-green-600' : 'text-red-600'}>{r.stage12.preDepositMade ? `Yes (${r.stage12.preDepositAmount})` : 'Not Made'}</span></div>
                            <div>Notice Given: <span className={r.stage12.noticeToPurchaser ? 'text-green-600' : 'text-red-600'}>{r.stage12.noticeToPurchaser ? 'Yes' : 'No'}</span></div>
                          </div>
                          {r.stage12.daysRemaining !== undefined && (
                            <p className={`text-xs font-bold ${r.stage12.daysRemaining > 60 ? 'text-green-600' : r.stage12.daysRemaining > 15 ? 'text-amber-600' : 'text-red-600'}`}>
                              {r.stage12.daysRemaining} days remaining
                            </p>
                          )}
                          <div className="p-2 rounded-lg bg-primary/5 border border-primary/10">
                            <p className="text-[10px] text-muted-foreground">Outcome</p>
                            <p className="text-xs font-semibold">{r.stage12.outcome.replace(/_/g, ' ')}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Stage 10: Partition */}
                  {r.stage10 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><Layers className="h-4 w-4 text-primary" />Partition (Stage 10)</h4>
                        <div className="p-3 rounded-lg bg-gray-50 space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div>Co-Ownership: <span className={r.stage10.coOwnershipEstablished ? 'text-green-600' : 'text-red-600'}>{r.stage10.coOwnershipEstablished ? 'Established' : 'Not Established'}</span></div>
                            <div>Physically Divisible: <span className={r.stage10.physicallyDivisible ? 'text-green-600' : 'text-amber-600'}>{r.stage10.physicallyDivisible ? 'Yes' : 'No'}</span></div>
                            <div>Commissioner: <span className={r.stage10.commissionerRequired ? 'text-amber-600' : 'text-muted-foreground'}>{r.stage10.commissionerRequired ? 'Required' : 'Not Required'}</span></div>
                            <div>Mutation: <span className={r.stage10.mutationRequired ? 'text-amber-600' : 'text-muted-foreground'}>{r.stage10.mutationRequired ? 'Required' : 'N/A'}</span></div>
                          </div>
                          {r.stage10.coSharers && r.stage10.coSharers.length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold mb-1">Co-sharers</p>
                              <div className="space-y-0.5">{r.stage10.coSharers.map((cs, i) => (
                                <div key={i} className="flex items-center gap-2 text-[10px]"><span>{cs.name}</span><Badge variant="outline" className="text-[9px]">{cs.share}</Badge></div>
                              ))}</div>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div>Preliminary Decree: <span className={r.stage10.preliminaryDecree.sharesDetermined ? 'text-green-600' : 'text-muted-foreground'}>{r.stage10.preliminaryDecree.sharesDetermined ? 'Shares Determined' : 'Pending'}</span></div>
                            <div>Final Decree: <span className="font-medium">{r.stage10.finalDecree.mode.replace(/_/g, ' ')}</span></div>
                          </div>
                          {r.stage10.limitationRisk && <p className="text-[10px] text-amber-600">Risk: {r.stage10.limitationRisk}</p>}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Stage 5: Artha Rin */}
                  {r.stage5 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" />Artha Rin Adalat (Stage 5)</h4>
                        <div className="p-3 rounded-lg bg-gray-50 space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div>Eligible: <span className={r.stage5.eligible ? 'text-green-600' : 'text-red-600'}>{r.stage5.eligible ? 'Yes' : 'No'}</span></div>
                            <div>Section: <span className="font-medium text-primary">{r.stage5.section}</span></div>
                            <div>Limitation Strict: <span className={r.stage5.limitationStrict ? 'text-red-600' : 'text-muted-foreground'}>{r.stage5.limitationStrict ? 'Yes' : 'No'}</span></div>
                            <div>Mediation: <Badge variant="outline" className="text-[9px]">{r.stage5.preLitigationMediation.mediationStatus.replace(/_/g, ' ')}</Badge></div>
                          </div>
                          <div className="p-2 rounded-lg bg-gray-100 space-y-1">
                            <p className="text-[10px] font-semibold">Pre-Litigation Mediation</p>
                            <p className="text-[10px] text-muted-foreground">Mandatory: {r.stage5.preLitigationMediation.mandatory ? 'Yes' : 'No'}</p>
                            <p className="text-[10px] text-muted-foreground">Period: {r.stage5.preLitigationMediation.mediationPeriod}</p>
                            <p className="text-[10px] text-muted-foreground">Notice Issued: {r.stage5.preLitigationMediation.noticeIssued ? 'Yes' : 'No'}</p>
                          </div>
                          {r.stage5.requiredDocuments.length > 0 && (
                            <div><p className="text-[10px] font-semibold">Required Documents:</p>{r.stage5.requiredDocuments.map((d, i) => <p key={i} className="text-[10px] text-muted-foreground">• {d}</p>)}</div>
                          )}
                          {r.stage5.interimOrders.length > 0 && (
                            <div><p className="text-[10px] font-semibold">Interim Orders:</p>{r.stage5.interimOrders.map((o, i) => <p key={i} className="text-[10px] text-muted-foreground">• {o}</p>)}</div>
                          )}
                          <p className="text-[10px] text-muted-foreground">Appeal Track: {r.stage5.appealTrack}</p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Stage 6: Order 37 */}
                  {r.stage6 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><Zap className="h-4 w-4 text-primary" />Order 37 Summary Suit (Stage 6)</h4>
                        <div className="p-3 rounded-lg bg-gray-50 space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div>Eligible: <span className={r.stage6.eligible ? 'text-green-600' : 'text-red-600'}>{r.stage6.eligible ? 'Yes' : 'No'}</span></div>
                            <div>Basis: <span className="font-medium">{r.stage6.basis}</span></div>
                            <div>Leave to Defend: <Badge variant="outline" className="text-[9px]">{r.stage6.leaveToDefend.replace(/_/g, ' ')}</Badge></div>
                            <div>Outcome: <Badge variant={r.stage6.outcome === 'summary_decree' ? 'default' : 'outline'} className={`text-[9px] ${r.stage6.outcome === 'summary_decree' ? 'bg-emerald-500/10 text-green-600 border-emerald-500/20' : ''}`}>{r.stage6.outcome.replace(/_/g, ' ')}</Badge></div>
                          </div>
                          <p className="text-[10px] text-muted-foreground">Limitation: {r.stage6.limitation}</p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Stage 4: Limitation */}
                  {r.stage4 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><Clock className="h-4 w-4 text-primary" />Limitation Period (Stage 4)</h4>
                        <div className="p-3 rounded-lg bg-gray-50 space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div>Gate Result: <Badge variant={r.stage4.gateResult === 'barred' ? 'destructive' : r.stage4.gateResult === 'pass' ? 'default' : 'secondary'} className={`text-[9px] ${r.stage4.gateResult === 'pass' ? 'bg-emerald-500/10 text-green-600 border-emerald-500/20' : ''}`}>{r.stage4.gateResult}</Badge></div>
                            <div>Time Barred: <span className={r.stage4.suitTimeBarred ? 'text-red-600 font-bold' : 'text-green-600'}>{r.stage4.suitTimeBarred ? 'YES' : 'No'}</span></div>
                            <div>Condonation: <span className={r.stage4.condonationAvailable ? 'text-amber-600' : 'text-muted-foreground'}>{r.stage4.condonationAvailable ? 'Available' : 'N/A'}</span></div>
                          </div>
                          <div className="p-2 rounded-lg bg-gray-100 space-y-1">
                            <p className="text-[10px] font-semibold">Primary Limitation</p>
                            <p className="text-[11px]">Article {r.stage4.primaryLimitation.article}: {r.stage4.primaryLimitation.period}</p>
                            <p className="text-[10px] text-muted-foreground">Status: <span className={r.stage4.primaryLimitation.status === 'barred' ? 'text-red-600' : r.stage4.primaryLimitation.status === 'at_risk' ? 'text-amber-600' : 'text-green-600'}>{r.stage4.primaryLimitation.status.replace(/_/g, ' ')}</span></p>
                            {r.stage4.primaryLimitation.daysRemaining !== undefined && <p className="text-[10px]">Days Remaining: <span className="font-bold">{r.stage4.primaryLimitation.daysRemaining}</span></p>}
                          </div>
                          {r.stage4.allApplicable.length > 1 && (
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              <p className="text-[10px] font-semibold">All Applicable Articles</p>
                              {r.stage4.allApplicable.map((le, i) => (
                                <div key={i} className="flex items-center gap-2 text-[10px]">
                                  <Badge variant="outline" className="text-[9px]">{le.article}</Badge>
                                  <span>{le.period}</span>
                                  <span className={le.status === 'barred' ? 'text-red-600' : le.status === 'at_risk' ? 'text-amber-600' : 'text-green-600'}>({le.status.replace(/_/g, ' ')})</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Stage 9: Procedural Defects */}
                  {r.stage9 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-primary" />Procedural Defects (Stage 9)</h4>
                        <div className="p-3 rounded-lg bg-gray-50 space-y-2">
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-2 rounded bg-gray-100"><p className="text-[9px] text-muted-foreground">Defects</p><p className="text-sm font-bold">{r.stage9.defects.length}</p></div>
                            <div className="p-2 rounded bg-red-500/10"><p className="text-[9px] text-red-600">Fatal</p><p className="text-sm font-bold text-red-600">{r.stage9.fatalDefects.length}</p></div>
                            <div className="p-2 rounded bg-amber-500/10"><p className="text-[9px] text-amber-600">Waivable</p><p className="text-sm font-bold text-amber-600">{r.stage9.waivableDefects.length}</p></div>
                          </div>
                          <p className="text-[10px]">Suit Proceedable: <span className={r.stage9.suitProceedable ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{r.stage9.suitProceedable ? 'YES' : 'BLOCKED'}</span></p>
                          {r.stage9.blockingDefect && <p className="text-[10px] text-red-600 font-medium">Blocking: {r.stage9.blockingDefect}</p>}
                          <div className="space-y-1.5 max-h-48 overflow-y-auto">
                            {r.stage9.defects.filter(d => d.detected).map((defect, i) => (
                              <div key={i} className={`flex items-start gap-2 p-2 rounded-lg ${defect.outcome === 'rejection' || defect.outcome === 'bar' ? 'bg-red-500/5 border border-red-500/10' : 'bg-gray-100'}`}>
                                <span className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${severityColor(defect.severity)}`} />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2"><span className="text-[11px] font-medium">{defect.name}</span><Badge variant="outline" className={`text-[9px] ${severityTextColor(defect.severity)}`}>{defect.outcome}</Badge></div>
                                  <p className="text-[10px] text-muted-foreground">{defect.description} ({defect.section})</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Stage 13: Appeal + Revision */}
                  {r.stage13 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><GitBranch className="h-4 w-4 text-primary" />Appeal & Revision (Stage 13)</h4>
                        <div className="p-3 rounded-lg bg-gray-50 space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div>Appeal Available: <span className={r.stage13.appealAvailable ? 'text-green-600' : 'text-muted-foreground'}>{r.stage13.appealAvailable ? 'Yes' : 'No'}</span></div>
                            <div>Appeal Forum: <span className="font-medium">{r.stage13.appealForum}</span></div>
                            <div>2nd Appeal: <span className={r.stage13.secondAppealAvailable ? 'text-green-600' : 'text-muted-foreground'}>{r.stage13.secondAppealAvailable ? `Yes (${r.stage13.secondAppealGround})` : 'No'}</span></div>
                            <div>Revision: <span className={r.stage13.revisionAvailable ? 'text-green-600' : 'text-muted-foreground'}>{r.stage13.revisionAvailable ? 'Yes' : 'No'}</span></div>
                            <div>Review: <span className={r.stage13.reviewAvailable ? 'text-green-600' : 'text-muted-foreground'}>{r.stage13.reviewAvailable ? 'Yes' : 'No'}</span></div>
                            <div>Stay of Execution: <span className={r.stage13.stayOfExecution ? 'text-amber-600' : 'text-muted-foreground'}>{r.stage13.stayOfExecution ? 'Yes' : 'No'}</span></div>
                          </div>
                          {r.stage13.standardLadder.length > 0 && (
                            <div><p className="text-[10px] font-semibold">Appeal Ladder</p>{r.stage13.standardLadder.map((step, i) => (
                              <div key={i} className="flex items-center gap-2 text-[10px]"><span>{step.from}</span><ChevronRight className="h-3 w-3" /><span className="font-medium">{step.to}</span><span className="text-muted-foreground">({step.section})</span></div>
                            ))}</div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Stage 14: Execution */}
                  {r.stage14 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><Gavel className="h-4 w-4 text-primary" />Execution (Stage 14)</h4>
                        <div className="p-3 rounded-lg bg-gray-50 space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div>Trigger: <span className={r.stage14.trigger ? 'text-green-600' : 'text-muted-foreground'}>{r.stage14.trigger ? 'Yes' : 'No'}</span></div>
                            <div>Decree Type: <span className="font-medium">{r.stage14.decreeType}</span></div>
                            <div>Within Limit: <span className={r.stage14.applicationWithinLimit ? 'text-green-600' : 'text-red-600'}>{r.stage14.applicationWithinLimit ? 'Yes' : 'No'}</span></div>
                            <div>Contempt: <span className={r.stage14.contemptAvailable ? 'text-amber-600' : 'text-muted-foreground'}>{r.stage14.contemptAvailable ? 'Available' : 'N/A'}</span></div>
                          </div>
                          <p className="text-[10px] text-muted-foreground">Limitation: {r.stage14.limitationPeriod}</p>
                          {r.stage14.modes.filter(m => m.applicable).length > 0 && (
                            <div><p className="text-[10px] font-semibold">Available Modes</p>{r.stage14.modes.filter(m => m.applicable).map((m, i) => (
                              <div key={i} className="text-[10px]"><Badge variant="outline" className="text-[9px]">{m.mode}</Badge> <span className="text-muted-foreground">{m.description}</span></div>
                            ))}</div>
                          )}
                          {r.stage14.objections.length > 0 && (
                            <div><p className="text-[10px] font-semibold text-amber-600">Objections</p>{r.stage14.objections.map((o, i) => <p key={i} className="text-[10px] text-amber-600">⚠ {o}</p>)}</div>
                          )}
                          <p className="text-[10px] font-medium text-primary">{r.stage14.outcome}</p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Stage 3: Precondition Filters */}
                  {r.stage3 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><Fingerprint className="h-4 w-4 text-primary" />Precondition Filters (Stage 3)</h4>
                        <div className="p-3 rounded-lg bg-gray-50 space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold">Passed:</span>
                            <Badge variant={r.stage3.passed ? 'default' : 'destructive'} className={`text-[9px] ${r.stage3.passed ? 'bg-emerald-500/10 text-green-600 border-emerald-500/20' : ''}`}>
                              {r.stage3.passed ? 'YES' : 'BLOCKED'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="p-2.5 rounded-lg bg-gray-100 space-y-1">
                              <p className="text-[10px] font-semibold">Registration</p>
                              <p className="text-[10px]">Compulsory: {r.stage3.registration.isCompulsorilyRegistrable ? 'Yes' : 'No'}</p>
                              <p className="text-[10px]">Registered: <span className={r.stage3.registration.isRegistered ? 'text-green-600' : 'text-red-600'}>{r.stage3.registration.isRegistered ? 'Yes' : 'No'}</span></p>
                              <p className="text-[10px]">S.17: <span className={r.stage3.registration.section17 ? 'text-amber-600' : 'text-muted-foreground'}>{r.stage3.registration.section17 ? 'Applies' : 'N/A'}</span></p>
                              <p className="text-[10px]">S.49: <span className={r.stage3.registration.section49 ? 'text-amber-600' : 'text-muted-foreground'}>{r.stage3.registration.section49 ? 'Applies' : 'N/A'}</span></p>
                            </div>
                            <div className="p-2.5 rounded-lg bg-gray-100 space-y-1">
                              <p className="text-[10px] font-semibold">Stamp</p>
                              <p className="text-[10px]">Sufficient: <span className={r.stage3.stamp.sufficientlyStamped ? 'text-green-600' : 'text-red-600'}>{r.stage3.stamp.sufficientlyStamped ? 'Yes' : 'No'}</span></p>
                              <p className="text-[10px]">Status: <Badge variant="outline" className="text-[9px]">{r.stage3.stamp.status.replace(/_/g, ' ')}</Badge></p>
                            </div>
                            <div className="p-2.5 rounded-lg bg-gray-100 space-y-1">
                              <p className="text-[10px] font-semibold">Mutation</p>
                              <p className="text-[10px]">Status: {r.stage3.mutation.status}</p>
                              <p className="text-[10px]">Weight: {r.stage3.mutation.weight}</p>
                            </div>
                          </div>
                          {r.stage3.criticalBlockers.length > 0 && (
                            <div className="p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                              <p className="text-[10px] font-semibold text-red-600">Critical Blockers</p>
                              {r.stage3.criticalBlockers.map((b, i) => <p key={i} className="text-[10px] text-red-600">✗ {b}</p>)}
                            </div>
                          )}
                          {r.stage3.bars.length > 0 && (
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              <p className="text-[10px] font-semibold">Bars</p>
                              {r.stage3.bars.map((bar, i) => (
                                <div key={i} className="flex items-start gap-2 p-1.5 rounded bg-gray-100">
                                  <span className={`h-2 w-2 rounded-full shrink-0 mt-0.5 ${severityColor(bar.severity)}`} />
                                  <div><p className={`text-[10px] ${severityTextColor(bar.severity)}`}>{bar.message}</p><p className="text-[9px] text-muted-foreground">{bar.legalRef}</p></div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* No sub-engine data */}
                  {!r.stage7 && !r.stage25 && !r.stage11 && !r.stage12 && !r.stage10 && !r.stage5 && !r.stage6 && !r.stage4 && !r.stage9 && !r.stage13 && !r.stage14 && !r.stage3 && (
                    <p className="text-xs text-muted-foreground text-center py-8">No sub-engine analysis data available for this case type.</p>
                  )}
                </CardContent></Card>
              )}
            </TabsContent>

            {/* ═══ ARGUMENTS TAB ═══ */}
            <TabsContent value="arguments" className="mt-4">
              {paidTabs.includes('arguments') && !isPaidUnlocked() ? renderProLock('Arguments Builder') : (
                <div className="space-y-4">
                  {r.argumentTree ? (<>
                    <Card className="border-gray-200 bg-white shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Scale className="h-4 w-4 text-green-600" />Plaintiff Arguments</CardTitle></CardHeader><CardContent className="p-4">
                      {renderArgumentNode(r.argumentTree.plaintiff)}
                    </CardContent></Card>
                    <Card className="border-gray-200 bg-white shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4 text-red-600" />Defendant Arguments</CardTitle></CardHeader><CardContent className="p-4">
                      {renderArgumentNode(r.argumentTree.defendant)}
                    </CardContent></Card>
                  </>) : <Card className="border-gray-200"><CardContent className="p-8 text-center"><p className="text-xs text-muted-foreground">No argument tree data available.</p></CardContent></Card>}
                </div>
              )}
            </TabsContent>

            {/* ═══ STRATEGY TAB ═══ */}
            <TabsContent value="strategy" className="mt-4">
              {paidTabs.includes('strategy') && !isPaidUnlocked() ? renderProLock('Strategy Engine') : (
                <Card className="border-gray-200 bg-white shadow-sm"><CardContent className="p-4 space-y-4">
                  {r.strategy ? (<>
                    {r.strategy.optimalReliefPath && r.strategy.optimalReliefPath.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Optimal Relief Path</h4>
                        <div className="flex items-center gap-2 flex-wrap">{r.strategy.optimalReliefPath.map((step, i) => (
                          <React.Fragment key={i}><Badge variant="outline" className="text-[10px]">{step}</Badge>{i < r.strategy.optimalReliefPath.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}</React.Fragment>
                        ))}</div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Confidence:</span>
                      <Progress value={r.strategy.confidenceLevel} className="h-2 flex-1 max-w-32" />
                      <span className="text-xs font-bold">{r.strategy.confidenceLevel}%</span>
                    </div>
                    {r.strategy.phases && r.strategy.phases.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">4-Phase Strategy Timeline</h4>
                        <div className="space-y-3">{r.strategy.phases.map((phase, i) => (
                          <div key={i} className="p-3 rounded-lg bg-gray-50 space-y-2">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <Badge className="text-[9px] bg-black text-white">Phase {phase.phase}</Badge>
                                <span className="text-xs font-medium">{phase.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={`text-[9px] ${phase.riskLevel === 'low' ? 'border-emerald-500/30 text-green-600' : phase.riskLevel === 'medium' ? 'border-amber-500/30 text-amber-600' : 'border-red-500/30 text-red-600'}`}>{phase.riskLevel} risk</Badge>
                                <span className="text-[10px] text-muted-foreground">{phase.timeline}</span>
                              </div>
                            </div>
                            {phase.actions && phase.actions.length > 0 && (
                              <div className="ml-4 space-y-1">{phase.actions.map((a, j) => <p key={j} className="text-[11px] text-muted-foreground">• {a}</p>)}</div>
                            )}
                            {phase.legalRefs && phase.legalRefs.length > 0 && (
                              <div className="flex flex-wrap gap-1 ml-4">{phase.legalRefs.map((ref, j) => <Badge key={j} variant="outline" className="text-[8px] px-1 py-0 text-primary">{ref}</Badge>)}</div>
                            )}
                          </div>
                        ))}</div>
                      </div>
                    )}
                    {r.strategy.keyMilestones && r.strategy.keyMilestones.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Key Milestones</h4>
                        <div className="space-y-1">{r.strategy.keyMilestones.map((m, i) => <div key={i} className="flex items-center gap-2 text-xs"><CircleDot className="h-3 w-3 text-primary shrink-0" /><span>{m}</span></div>)}</div>
                      </div>
                    )}
                    {r.strategy.riskMitigation && r.strategy.riskMitigation.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Risk Mitigation</h4>
                        <div className="space-y-1">{r.strategy.riskMitigation.map((rm, i) => <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50"><ShieldCheck className="h-3 w-3 text-green-600 shrink-0 mt-0.5" /><span className="text-xs">{rm}</span></div>)}</div>
                      </div>
                    )}
                    {r.strategy.estimatedCostRange && (
                      <div className="p-3 rounded-lg bg-gray-50">
                        <p className="text-[10px] text-muted-foreground">Estimated Cost Range</p>
                        <p className="text-sm font-bold">{r.strategy.estimatedCostRange}</p>
                      </div>
                    )}
                    {r.strategy.disclaimer && (
                      <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                        <p className="text-[10px] text-amber-600">⚠ AI Disclaimer</p>
                        <p className="text-[10px] text-muted-foreground">{r.strategy.disclaimer}</p>
                      </div>
                    )}
                  </>) : <p className="text-xs text-muted-foreground">No strategy data available.</p>}
                </CardContent></Card>
              )}
            </TabsContent>

            {/* ═══ ADVISORY TAB ═══ */}
            <TabsContent value="advisory" className="mt-4">
              {paidTabs.includes('advisory') && !isPaidUnlocked() ? renderProLock('Client Advisory') : (
                <Card className="border-gray-200 bg-white shadow-sm"><CardContent className="p-4 space-y-5">
                  {r.clientSummary ? (<>
                    {/* Core Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-4 rounded-lg bg-gray-50 text-center">
                        <p className="text-[10px] text-muted-foreground">Win Chance</p>
                        <p className={`text-lg font-bold ${r.clientSummary.winChance.toLowerCase().includes('high') || r.clientSummary.winChance.toLowerCase().includes('strong') ? 'text-green-600' : r.clientSummary.winChance.toLowerCase().includes('moderate') ? 'text-amber-600' : 'text-red-600'}`}>{r.clientSummary.winChance}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-gray-50 text-center">
                        <p className="text-[10px] text-muted-foreground">Estimated Time</p>
                        <p className="text-lg font-bold">{r.clientSummary.estimatedTime}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-gray-50 text-center">
                        <p className="text-[10px] text-muted-foreground">Cost Risk</p>
                        <p className={`text-lg font-bold ${r.clientSummary.costRisk.toLowerCase() === 'low' ? 'text-green-600' : r.clientSummary.costRisk.toLowerCase() === 'medium' ? 'text-amber-600' : 'text-red-600'}`}>{r.clientSummary.costRisk}</p>
                      </div>
                    </div>

                    {/* Advice */}
                    {r.clientSummary.advice && (
                      <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                        <p className="text-xs font-semibold text-primary mb-2">Client Advice</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{r.clientSummary.advice}</p>
                      </div>
                    )}

                    {/* Critical Actions */}
                    {r.clientSummary.criticalActions && r.clientSummary.criticalActions.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><AlertCircle className="h-4 w-4 text-red-600" />Critical Actions</h4>
                        <div className="space-y-1.5">
                          {r.clientSummary.criticalActions.map((action, i) => (
                            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                              <span className="h-5 w-5 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center text-[9px] font-bold shrink-0">{i + 1}</span>
                              <span className="text-xs">{action}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Warnings */}
                    {r.clientSummary.warnings && r.clientSummary.warnings.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-600" />Warnings</h4>
                        <div className="space-y-1.5">
                          {r.clientSummary.warnings.map((w, i) => (
                            <Alert key={i} className="py-2 border-amber-500/20 bg-amber-500/5">
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                              <AlertDescription className="text-xs">{w}</AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Next Steps */}
                    {r.clientSummary.nextSteps && r.clientSummary.nextSteps.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><ArrowRight className="h-4 w-4 text-primary" />Next Steps</h4>
                        <div className="space-y-1.5">
                          {r.clientSummary.nextSteps.map((step, i) => (
                            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50">
                              <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold shrink-0">{i + 1}</span>
                              <span className="text-xs">{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>) : <p className="text-xs text-muted-foreground">No advisory data available.</p>}
                </CardContent></Card>
              )}
            </TabsContent>

          </Tabs>
        </>) : (
          <Card className="border-gray-200"><CardContent className="p-8 text-center">
            <AlertCircle className="h-10 w-10 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Case not yet analyzed</p>
            <Button className="mt-3" onClick={() => { setView('new-case'); }}><FilePlus className="h-4 w-4 mr-2" />Analyze Case</Button>
          </CardContent></Card>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // MAIN LAYOUT
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen flex bg-gray-50 relative">
      {/* Watermark */}
      <div className="watermark-overlay" aria-hidden="true" />

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex-shrink-0 transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {loginRole === 'admin' && view !== 'new-case' && view !== 'case-detail' ? renderAdminSidebar() : renderUserSidebar()}
      </aside>

      {/* Main */}
      <div className="flex-1 min-h-screen flex flex-col lg:ml-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-14 border-b border-gray-200 bg-white/80 backdrop-blur-md flex items-center px-4 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-md hover:bg-gray-100 shrink-0">{sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
            <h1 className="text-sm font-bold text-black truncate">FATIHA</h1>
            {view === 'case-detail' && selectedCase && <span className="text-xs text-muted-foreground truncate hidden sm:inline">· {selectedCase.title}</span>}
            {user?.role === 'admin' && loginRole === 'user' && view === 'user-dash' && <span className="text-xs text-blue-600 truncate hidden sm:inline">· Viewing as User</span>}
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2 shrink-0">
            {!isProUser && !isAdmin && <Button size="sm" variant="outline" className="text-xs gap-1 border-amber-300 text-amber-600 hover:bg-amber-50 hidden sm:inline-flex" onClick={openUpgradeDialog}><Crown className="h-3 w-3" />Upgrade to PRO</Button>}
            {user?.role === 'admin' && loginRole === 'user' && <Button size="sm" variant="outline" className="text-xs gap-1 border-blue-300 text-blue-600 hover:bg-blue-50 hidden sm:inline-flex" onClick={() => { localStorage.setItem('fatiha-login-role', 'admin'); setView('admin-dash'); setAdminTab('overview'); }}><Shield className="h-3 w-3" />Exit User View</Button>}
            {loginRole === 'admin' && view !== 'admin-dash' && view !== 'new-case' && view !== 'case-detail' && <Button size="sm" variant="outline" className="text-xs gap-1 border-red-500/30 text-red-600 hover:bg-red-500/10 hidden sm:inline-flex" onClick={() => { setView('admin-dash'); setAdminTab('overview'); }}><Shield className="h-3 w-3" />Admin Panel</Button>}
            {loginRole === 'admin' && <Badge variant="outline" className="text-[9px] border-red-300 text-red-600 hidden sm:inline-flex">ADMIN</Badge>}
            {user?.role === 'admin' && loginRole === 'user' && <Badge variant="outline" className="text-[9px] border-blue-300 text-blue-600 hidden sm:inline-flex">USER VIEW</Badge>}
            <Badge variant="secondary" className="text-[10px]">{(user?.plan || 'FREE').toUpperCase()}</Badge>
            <span className="text-[10px] text-muted-foreground hidden md:inline">v3.0</span>
            <Separator orientation="vertical" className="h-5 bg-gray-200 mx-1 hidden sm:block" />
            <button onClick={handleSignOut} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-neutral-500 hover:bg-red-50 hover:text-red-600 transition-colors font-medium"><LogOut className="h-3.5 w-3.5" /><span className="hidden sm:inline">Sign Out</span></button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto overflow-y-auto">
          {view === 'user-dash' && renderUserDashboardContent()}
          {view === 'admin-dash' && renderAdminDashboardContent()}
          {view === 'new-case' && renderNewCaseForm()}
          {view === 'case-detail' && renderCaseDetailView(detailTab, setDetailTab)}
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t border-gray-200 py-3 px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <img src="/neum-lex-counsel-sm.png" alt="" className="h-4 w-auto opacity-60" aria-hidden="true" />
            <span className="text-[11px] text-muted-foreground leading-relaxed">FATIHA v3.0 &middot; A Product of <span className="text-amber-700 font-semibold">Neum Lex Counsel</span></span>
          </div>
        </footer>
      </div>

      {/* Upgrade Dialog */}
      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">{renderUpgradeDialogContent()}</DialogContent>
      </Dialog>
    </div>
  );
}
