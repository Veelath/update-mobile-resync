export interface CitationReport {
  citation_raw_reference_text: string;
  citation_is_accessible: boolean | null;
  citation_status?: string | null;
  citation_primary_link?: string | null;
  citation_authors_parsed?: string | null;
  citation_year_parsed?: number | null;
  citation_crossref_title?: string | null;
  citation_title_match_score?: number | null;
  citation_is_cited_in_text?: boolean | null;
}

export interface AITextIndicatorResponse {
  overall_score?: number | null;
  section_scores?: Record<string, number | null>;
  flagged_sections?: string[];
  disclaimer?: string;
}

export type DimensionKey = 'objectives_alignment' | 'methodology_fit' | 'numeric_consistency' | 'claim_support';
export type PairScores = Record<DimensionKey | 'overall_coherence', number | null>;

export interface ManuscriptFlowPair {
  order: number;
  section_a: string;
  section_b: string;
  pair_weight: number | null;
  pair_score?: number | null;
  numeric_applicable?: boolean;
  scores: PairScores;
  skipped_reason: string | null;
  culprit_sentences: { section_a: { sentence: string; delta: number }[]; section_b: { sentence: string; delta: number }[] };
  explanation: {
    coherence_scores: { overall: number; objectives: number; methodology: number; numeric: number; claims: number };
    highlighted_inconsistencies: { section: string; quote: string; what: string; why: string }[];
    recommendations: { section: string; original_sentence: string | null; recommended_revision: string }[];
    reference_list: { section: string; sentence: string }[];
  } | null;
}

export interface V7Inconsistency {
  section_a: string;
  section_b: string;
  pair_order: number;
  coherence_score: number;
  explanation_what: string;
  explanation_why: string;
  suggested_fix: string;
  inconsistency_id: string;
  evidence_a: string;
  evidence_b: string;
  evidence_quotes: { section: string; text: string }[];
  evidence_verified: boolean;
  finding_status: 'material_issue';
}

export interface V7Recommendation {
  recommendation_id: string;
  section_a: string;
  section_b: string;
  pair_order: number;
  original_sentence: string | null;
  recommended_revision: string;
  recommendation_text: string;
  recommendation_priority: 'High' | 'Medium' | 'Low';
}

export interface PairPointer {
  order: number;
  section_a: string;
  section_b: string;
  overall_coherence: number;
  score: number;
}

export interface V7ScanResponse {
  status: string;
  analysis_run_id: string;
  user_id: string;
  manuscript_id: string;
  doc_url: string;
  manuscript_title?: string | null;
  result_version: 'v7';
  overall_coherence_score: number;
  sections_analyzed: string[];
  manuscript_flow: ManuscriptFlowPair[];
  inconsistencies_found: number;
  inconsistencies: V7Inconsistency[];
  recommendations: V7Recommendation[];
  ai_synthesis: { summary: string | null; strongest_pair: PairPointer | null; weakest_pair: PairPointer | null };
  citations_audited: number;
  citations: CitationReport[];
  score_breakdown: {
    overall_score: number;
    band: 'Strong' | 'Solid' | 'Needs Revision';
    cross_chapter_coherence_score: number;
    citation_integrity_score: number | null;
    dimensions: Record<DimensionKey, number | null>;
    dimension_weights?: Partial<Record<DimensionKey, number>> | null;
    citation_detail: { well_formed_ratio: number; link_resolution_rate: number; cross_match_score: number; total_entries: number };
  };
  ai_text_indicator: AITextIndicatorResponse | null;
  db_save_status: string;
  notification_dispatched: boolean;
  credits_remaining: number | null;
}

export type LegacyScanResponse = { result_version?: string | null; analysis_run_id?: string; sections_analyzed?: string[]; citations_audited?: number };
export type ScanResult = V7ScanResponse | LegacyScanResponse;

export const OLD_RESULT_NOTICE = 'This scan was made with an older version of ReSync. Please run a new scan.';

export function isV7Result(result: ScanResult | null | undefined): result is V7ScanResponse {
  return result?.result_version === 'v7';
}

export function adaptScanResult(raw: unknown): ScanResult {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Invalid scan result.');
  const result = raw as LegacyScanResponse;
  return result;
}

export const DIMENSION_KEYS: DimensionKey[] = ['objectives_alignment', 'methodology_fit', 'claim_support', 'numeric_consistency'];

export function scoreText(score: number): string {
  return String(Math.round(score));
}

export function dimensionCard(result: V7ScanResponse, key: DimensionKey) {
  const mean = result.score_breakdown.dimensions[key];
  const weight = result.score_breakdown.dimension_weights?.[key];
  const applicable = mean != null && weight !== 0;
  return {
    applicable,
    value: applicable ? Math.round(mean * 100) : 0,
    caption: applicable ? (weight == null ? null : `counts ${Math.round(weight * 100)}%`)
      : key === 'numeric_consistency' ? 'no figures to compare' : 'not enough text',
  };
}

export function citationAccess(citation: CitationReport): 'public' | 'private' {
  if (citation.citation_is_accessible === true) return 'public';
  if (citation.citation_is_accessible === false) return 'private';
  return ['verified_doi', 'verified_url', 'verified_metadata', 'metadata_mismatch', 'accessible']
    .includes(citation.citation_status || '') ? 'public' : 'private';
}

export const CITATION_LABELS = {public: 'Accessible (Public)', private: 'Inaccessible (Private)'} as const;

export const DIMENSION_LABELS = {
  objectives_alignment: 'Matches the objectives',
  methodology_fit: 'Fits the method',
  numeric_consistency: 'Numbers agree',
  claim_support: 'Claims are supported',
} as const;

export function plainText(value: string | null | undefined): string {
  return (value || '').replace(/\b(objectives_alignment|methodology_fit|numeric_consistency|claim_support)\b/g,
    key => DIMENSION_LABELS[key as DimensionKey])
    .replace(/\*\*|`|\*/g, '')
    .replace(/^\s*#{1,6}\s*/gm, '')
    .replace(/^\s*(?:[-+]\s+|\d+[.)]\s+)/gm, '')
    .replace(/\s+/g, ' ').trim();
}

export function displayTitle(result: Pick<V7ScanResponse, 'manuscript_title' | 'doc_url'>, manuscriptText?: string | null): string {
  const usable = (value?: string | null) => value?.trim() && !/^https?:\/\//i.test(value.trim()) ? value.trim() : null;
  const firstLine = manuscriptText?.replace(/^\uFEFF/, '').split(/\r?\n/).map(line => line.trim())
    .find(line => line && !/^(?:\d+|[ivxlcdm]+)$/i.test(line));
  const fileName = result.doc_url.split(/[\\/]/).pop()?.replace(/\.(docx|doc)$/i, '');
  return usable(result.manuscript_title) || usable(firstLine)
    || (/^https?:\/\/docs\.google\.com\//i.test(result.doc_url) ? 'Google Docs manuscript' : usable(fileName))
    || 'Document Coherence Scan';
}
