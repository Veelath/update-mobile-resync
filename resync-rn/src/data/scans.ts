export interface ScanItem {
  id: string;
  title: string;
  status: string;
  date: string;
  score: number;
  url: string;
  isGoogleDoc?: boolean;
  versionName?: string;
  heavy?: boolean;
  unlocked?: boolean; // false while only the free preview is available; older scans have no flag and stay open
  result?: BackendScanResult;
  creditsRemaining?: number | null;
}

export interface CheckCount {
  items: number;
  passed: number;
  credit?: number; // points earned (full plus part); older scans don't send it
}

export interface DimensionBreakdown extends Partial<CheckCount> {
  score?: number | null; // 0 to 100
  flow?: CheckCount;
  cross?: CheckCount;
  failures?: { order: number }[]; // the section pairs that missed this check
}

export interface BackendScanResult {
  analysis_run_id: string;
  manuscript_title?: string | null;
  overall_coherence_score: number;
  sections_analyzed: string[];
  access?: {
    unlocked: boolean;
    unlock_cost: number;
    locked_counts: { sections: number; citations: number; recommendations: number };
  };
  score_breakdown?: {
    band?: string;
    dimensions?: Record<string, number | null>; // 0 to 1
    dimension_breakdown?: Record<string, DimensionBreakdown> | null;
  };
  citations?: {
    citation_raw_reference_text: string;
    citation_is_accessible: boolean;
    citation_primary_link?: string | null;
  }[];
  recommendations?: {
    recommendation_id: string;
    section?: string;
    section_a: string;
    section_b: string;
    pair_order?: number;
    original_sentence?: string | null;
    issue?: string;
    recommended_revision: string;
    recommendation_priority: 'High' | 'Medium' | 'Low';
  }[];
  manuscript_flow?: { order: number; section_a: string; section_b: string; severity?: string | null; scores?: { overall_coherence?: number | null } }[];
  manuscript_sections?: { name: string; text: string | null }[];
  credits_remaining?: number | null;
}

export const INITIAL_SCANS: ScanItem[] = [
  {
    id: 'novel_v3',
    title: 'Novel Draft - Chapter 1',
    status: 'Final review',
    date: 'Jul 2, 2026',
    score: 92,
    url: 'chapter1',
    versionName: 'v3',
    heavy: false,
  },
  {
    id: 'novel_v2',
    title: 'Novel Draft - Chapter 1',
    status: 'Revision 1',
    date: 'Jun 28, 2026',
    score: 78,
    url: 'chapter1',
    versionName: 'v2',
    heavy: true,
  },
  {
    id: 'novel_v1',
    title: 'Novel Draft - Chapter 1',
    status: 'Initial scan',
    date: 'Jun 20, 2026',
    score: 54,
    url: 'chapter1',
    versionName: 'v1',
    heavy: true,
  },
  {
    id: 's2',
    title: 'Capstone_Final_v3.docx',
    status: 'Revision',
    date: 'Jun 30, 2026',
    score: 74,
    url: 'capstone',
    heavy: false,
  },
  {
    id: 's3',
    title: 'Creative Writing Essay',
    status: 'Draft',
    date: 'Jun 24, 2026',
    score: 54,
    url: 'essay',
    heavy: true,
  },
  {
    id: 's4',
    title: 'Manuscript Draft Redux',
    status: 'Final',
    date: 'Jun 18, 2026',
    score: 92,
    url: 'redux',
    heavy: false,
  },
  {
    id: 's5',
    title: 'Poetry Anthology',
    status: 'Draft',
    date: 'Jun 9, 2026',
    score: 45,
    url: 'poetry',
    heavy: true,
  },
];
