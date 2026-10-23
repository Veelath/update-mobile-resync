export interface Finding {
  id: string;
  kind: 'Issue' | 'Strength';
  color: string;
  link: string;
  title: string;
  description: string;
  fix: string;
  severity?: 'High' | 'Medium' | 'Low';
}

export interface Recommendation {
  id: string;
  number: string;
  title: string;
  desc: string;
  findingId?: string;
}

export interface SectionScore {
  id: string;
  label: string;
  score: number;
}

export const SAMPLE_FINDINGS: Record<string, Finding> = {
  f1: {
    id: 'f1',
    kind: 'Issue',
    color: '#F43F5E',
    link: 'Objectives ↔ Methodology',
    title: "Social support isn't measured",
    description: 'The Abstract names social support as a variable, but the Methodology lists no instrument for it.',
    fix: 'Add the support scale you used to Section 3, or drop the variable from the Abstract.',
    severity: 'High',
  },
  f2: {
    id: 'f2',
    kind: 'Strength',
    color: '#10B981',
    link: 'Methodology ↔ Findings',
    title: 'Claim matches the results',
    description: 'Workload and recovery time are reported as significant predictors in Chapter 4, so this statement is supported.',
    fix: 'No change needed. Keep the wording consistent with Table 4.2.',
  },
  f3: {
    id: 'f3',
    kind: 'Issue',
    color: '#F43F5E',
    link: 'Objectives ↔ Conclusion',
    title: 'Conclusion goes beyond the study',
    description: '"All STEM programs" generalises past your sample of three universities and isn\'t one of your objectives.',
    fix: 'Limit the recommendation to the institutions studied, or tie it to a stated objective.',
    severity: 'High',
  },
};

export const HEAVY_ATTENTION_FINDINGS: Finding[] = [
  {
    id: 'h1',
    kind: 'Issue',
    color: '#F43F5E',
    severity: 'High',
    link: 'Objectives ↔ Conclusion',
    title: 'Two conclusions exceed the objectives',
    description: 'Conclusions 3 and 4 recommend institution-wide policy, which none of your objectives set out to test.',
    fix: 'Limit both conclusions to the institutions studied, or add an objective that covers policy.',
  },
  {
    id: 'h2',
    kind: 'Issue',
    color: '#F43F5E',
    severity: 'High',
    link: 'Objectives ↔ Methodology',
    title: "Social support isn't measured",
    description: 'Objective 2 names social support, but no instrument for it appears in Chapter 3.',
    fix: 'Add the support scale you used to Section 3.4, or drop the variable.',
  },
  {
    id: 'h3',
    kind: 'Issue',
    color: '#F59E0B',
    severity: 'Medium',
    link: 'Literature ↔ Findings',
    title: 'Plateau claim contradicts your data',
    description: 'Chapter 2 cites burnout plateauing after one semester; Chapter 4 shows it rising all year.',
    fix: 'Discuss the difference in Chapter 5, or cite studies that match your trend.',
  },
  {
    id: 'h4',
    kind: 'Issue',
    color: '#F59E0B',
    severity: 'Medium',
    link: 'Title ↔ Scope',
    title: 'Title is broader than the sample',
    description: '"Philippine Universities" suggests a national sample; the scope covers three schools in Metro Manila.',
    fix: 'Revise the title to reflect the three-school scope.',
  },
  {
    id: 'h5',
    kind: 'Issue',
    color: '#F59E0B',
    severity: 'Medium',
    link: 'Abstract ↔ Conclusion',
    title: 'Conclusion repeats the Abstract',
    description: 'The two sections are 82% similar, so the Conclusion adds no new synthesis.',
    fix: 'Add implications and limitations instead of restating results.',
  },
];

export const HEAVY_ALIGNED_FINDINGS: Finding[] = [
  {
    id: 'a1',
    kind: 'Strength',
    color: '#10B981',
    link: 'Methodology ↔ Findings',
    title: 'Results follow the research design',
    description: 'The quantitative analyses conducted strictly adhere to the correlational blueprint established in Chapter 3.',
    fix: 'No change needed.',
  },
  {
    id: 'a2',
    kind: 'Strength',
    color: '#10B981',
    link: 'Research questions ↔ Findings',
    title: 'All three questions are answered',
    description: 'Every statement of the problem corresponds to dedicated statistical tables and interpretations.',
    fix: 'No change needed.',
  },
  {
    id: 'a3',
    kind: 'Strength',
    color: '#10B981',
    link: 'Framework ↔ Instruments',
    title: 'Instruments fit the framework',
    description: 'The survey constructs map 1:1 to the theoretical variables outlined in Chapter 1.',
    fix: 'No change needed.',
  },
  {
    id: 'a4',
    kind: 'Strength',
    color: '#10B981',
    link: 'Sampling ↔ Analysis',
    title: 'Sample size supports the tests',
    description: 'N=384 exceeds the statistical power threshold required for multivariate regression.',
    fix: 'No change needed.',
  },
];

export const HEAVY_RECOMMENDATIONS: Recommendation[] = [
  { id: 'r1', number: '01', title: 'Revise the conclusion', desc: 'Match each claim to an objective and result.' },
  { id: 'r2', number: '02', title: 'Measure social support', desc: 'Add the instrument for every variable you name.' },
  { id: 'r3', number: '03', title: 'Reconcile the plateau claim', desc: 'Explain why your trend differs from the literature.' },
  { id: 'r4', number: '04', title: 'Narrow the title', desc: 'Reflect the three-school scope.' },
  { id: 'r5', number: '05', title: 'Add synthesis to the conclusion', desc: 'Discuss implications, not just results.' },
  { id: 'r6', number: '06', title: "Define 'recovery time' once", desc: 'Chapters 1 and 4 use different definitions.' },
  { id: 'r7', number: '07', title: 'Fix two dead citations', desc: "Dela Cruz (2020) and Reyes (2023) don't open." },
  { id: 'r8', number: '08', title: 'Align table numbering', desc: 'Tables 4.3–4.5 are cited out of order.' },
];

export const LIGHT_RECOMMENDATIONS: Recommendation[] = [
  { id: 'lr1', number: '01', title: 'Revise the conclusion', desc: 'Match each claim to an objective and result.', findingId: 'f3' },
  { id: 'lr2', number: '02', title: 'Measure social support', desc: 'Add the instrument for every variable named in the Abstract.', findingId: 'f1' },
  { id: 'lr3', number: '03', title: 'Keep the findings wording', desc: 'Your predictor claims already match Chapter 4.', findingId: 'f2' },
];

export const SECTIONS_SCORES: SectionScore[] = [
  { id: 's1', label: 'Executive synthesis', score: 74 },
  { id: 's2', label: 'Research objectives', score: 68 },
  { id: 's3', label: 'Methodology', score: 87 },
  { id: 's4', label: 'Findings & discussion', score: 72 },
  { id: 's5', label: 'Conclusion', score: 61 },
];
