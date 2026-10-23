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
