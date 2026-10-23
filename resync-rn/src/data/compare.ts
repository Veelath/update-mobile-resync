export interface CompareIssue {
  id: string;
  type: string;
  severity: 'High' | 'Medium' | 'Low';
  link: string;
  title: string;
}

export interface CompareVersion {
  id: string;
  scanId: string;
  label: string;
  status: string;
  date: string;
  score: number;
  issueIds: string[];
  validatedRefs: number;
}

export const COMPARE_ISSUES: Record<string, CompareIssue> = {
  sample: {
    id: 'sample',
    type: 'Contradiction',
    severity: 'High',
    link: '1.2 Introduction ↔ 3.4 Methodology',
    title: 'Sample size differs (200 vs N=150)',
  },
  metric: {
    id: 'metric',
    type: 'Logic gap',
    severity: 'Medium',
    link: '2 Literature ↔ 4 Discussion',
    title: 'Discussion drops the retention metric',
  },
  terms: {
    id: 'terms',
    type: 'Terminology',
    severity: 'Low',
    link: '1.1 Scope ↔ 5.1 Analysis',
    title: '"Users" vs "subjects"',
  },
  setup: {
    id: 'setup',
    type: 'Redundancy',
    severity: 'Low',
    link: '3.1 Setup ↔ 3.2 Analysis',
    title: 'Regression setup described twice',
  },
};

export const CHAPTER1_COMPARE_DATA: {
  title: string;
  versions: CompareVersion[];
} = {
  title: 'Novel Draft - Chapter 1',
  versions: [
    {
      id: 'v1',
      scanId: 'novel_v1',
      label: 'v1',
      status: 'Initial scan',
      date: 'Jun 20',
      score: 54,
      issueIds: ['sample', 'metric', 'terms'],
      validatedRefs: 0,
    },
    {
      id: 'v2',
      scanId: 'novel_v2',
      label: 'v2',
      status: 'Revision 1',
      date: 'Jun 28',
      score: 78,
      issueIds: ['metric', 'setup'],
      validatedRefs: 1,
    },
    {
      id: 'v3',
      scanId: 'novel_v3',
      label: 'v3',
      status: 'Final review',
      date: 'Jul 2',
      score: 92,
      issueIds: ['setup'],
      validatedRefs: 1,
    },
  ],
};
