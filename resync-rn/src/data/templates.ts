export interface ChapterTemplate {
  id: string;
  number: string;
  title: string;
  headings: string[];
}

export const QUANTITATIVE_TEMPLATE: ChapterTemplate[] = [
  {
    id: 'c1',
    number: '01',
    title: 'Introduction',
    headings: [
      'Background of the Study',
      'Statement of the Problem',
      'Research Hypotheses',
      'Conceptual Framework',
      'Significance of the Study',
      'Scope & Delimitations',
    ],
  },
  {
    id: 'c2',
    number: '02',
    title: 'Review of Related Literature',
    headings: [
      'Theoretical Framework',
      'Review of Related Literature & Studies',
      'Synthesis of the State of the Art',
    ],
  },
  {
    id: 'c3',
    number: '03',
    title: 'Methodology',
    headings: [
      'Research Design',
      'Population & Sampling Technique',
      'Instrumentation & Validation',
      'Data Gathering Procedure',
      'Statistical Treatment of Data',
    ],
  },
  {
    id: 'c4',
    number: '04',
    title: 'Results and Discussion',
    headings: [
      'Descriptive Statistical Analysis',
      'Hypothesis Testing & Correlation',
      'Interpretation of Findings',
    ],
  },
  {
    id: 'c5',
    number: '05',
    title: 'Summary, Conclusions & Recommendations',
    headings: [
      'Summary of Findings',
      'Conclusions',
      'Recommendations for Practice & Future Research',
    ],
  },
];

export const QUALITATIVE_TEMPLATE: ChapterTemplate[] = [
  {
    id: 'c1',
    number: '01',
    title: 'Introduction',
    headings: [
      'Background of the Study',
      'Research Questions',
      'Significance of the Study',
      'Scope & Delimitations',
    ],
  },
  {
    id: 'c2',
    number: '02',
    title: 'Review of Related Literature',
    headings: [
      'Theoretical Lens',
      'Related Studies',
      'Research Gap',
    ],
  },
  {
    id: 'c3',
    number: '03',
    title: 'Methodology',
    headings: [
      'Research Design',
      'Participants & Sampling',
      'Data Collection',
      'Thematic Analysis',
      'Trustworthiness & Ethics',
    ],
  },
  {
    id: 'c4',
    number: '04',
    title: 'Findings and Discussion',
    headings: [
      'Emerging Themes',
      'Discussion of Themes',
    ],
  },
  {
    id: 'c5',
    number: '05',
    title: 'Conclusions & Recommendations',
    headings: [
      'Summary',
      'Conclusions',
      'Recommendations',
    ],
  },
];
