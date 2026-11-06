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

export const SECTIONS_SCORES: SectionScore[] = [
  { id: 's1', label: 'Executive synthesis', score: 74 },
  { id: 's2', label: 'Research objectives', score: 68 },
  { id: 's3', label: 'Methodology', score: 87 },
  { id: 's4', label: 'Findings & discussion', score: 72 },
  { id: 's5', label: 'Conclusion', score: 61 },
];

/** Sample scan result: the app has no analysis backend yet, so every report renders this. */
export const SAMPLE_REPORT_TITLE = 'UNIHUBChapter12';

export interface ScoreCategory {
  id: string;
  name: string;
  color: string;
  desc: string;
  correct?: number; // correct and total are unset when the category doesn't apply to this paper
  total?: number;
  naCaption?: string;
  naNote?: string;
}

export const SCORE_CATEGORIES: ScoreCategory[] = [
  { id: 'context', name: 'Context Alignment', color: '#F5A524', desc: 'How well each section leads into the next.', correct: 5, total: 7 },
  { id: 'operational', name: 'Operational Alignment', color: '#10B981', desc: 'How well the methods match the stated objectives.', correct: 4, total: 7 },
  { id: 'logical', name: 'Logical Support', color: '#F43F5E', desc: 'How well statements are backed up by the surrounding text.', correct: 4, total: 7 },
  {
    id: 'evidence',
    name: 'Evidence Consistency',
    color: '#C4C2DA',
    desc: 'How well numbers and claims agree across chapters.',
    naCaption: 'No figures to compare',
    naNote: 'Needs figures or numeric claims to compare. None were found in this paper.',
  },
];

export const categoryPercent = (c: ScoreCategory) =>
  c.correct === undefined || !c.total ? null : (c.correct / c.total) * 100;

/** Average of the categories that apply, rounded up. */
export const overallScore = (categories: ScoreCategory[]) => {
  const scores = categories.map(categoryPercent).filter((s): s is number => s !== null);
  return Math.ceil(scores.reduce((a, b) => a + b, 0) / scores.length);
};

export interface ReportRecommendation {
  id: string;
  tag: string;
  category: string;
  title: string;
  from: string;
  to: string;
  why: string;
  where: string;
  action: string;
  sentences: string;
  highlight: string; // exact passage of the manuscript this finding points at
}

export const RECOMMENDATIONS: ReportRecommendation[] = [
  {
    id: 'r1',
    tag: 'Quick fix · add 2 sentences',
    category: 'Operational Alignment',
    title: 'Connect your Introduction to your Rationale Of The Study',
    from: 'Introduction',
    to: 'Rationale Of The Study',
    why: 'These two parts sit side by side with nothing joining them, so a reader may feel a sudden jump. Two short sentences can fix that.',
    where: 'end of the Introduction',
    action: 'Add these 2 sentences',
    sentences:
      'Students who cannot easily find or resell used items spend more than they need to and throw away items that others could use. This is why the study proposes a campus marketplace application, which is explained in the Rationale of the Study.',
    highlight: 'which leaves readers unsure why the study is needed.',
  },
  {
    id: 'r2',
    tag: 'Quick fix · add 1 sentence',
    category: 'Context Alignment',
    title: 'Lead your Rationale into your Statement of the Problem',
    from: 'Rationale Of The Study',
    to: 'Statement Of The Problem',
    why: 'The Rationale ends on waste, but the next section opens on building an app, so the reason for your questions is unclear.',
    where: 'end of the Rationale of the Study',
    action: 'Add this sentence',
    sentences: 'These needs lead to the questions this study sets out to answer.',
    highlight: 'how it reduces waste among students.',
  },
  {
    id: 'r3',
    tag: 'Quick fix · add 1 sentence',
    category: 'Operational Alignment',
    title: 'Match your third question to an objective',
    from: 'Statement Of The Problem',
    to: 'Objectives Of The Study',
    why: 'Question 3 asks which features students want, but no objective says how those features will be identified.',
    where: 'start of the specific objectives',
    action: 'Add this sentence',
    sentences: 'The study first identifies the features students need through a short survey.',
    highlight: 'What features would make a campus marketplace useful to them?',
  },
  {
    id: 'r4',
    tag: 'Quick fix · add 1 sentence',
    category: 'Operational Alignment',
    title: 'Say what secure messaging covers',
    from: 'Objectives Of The Study',
    to: 'Scope And Limitations',
    why: 'The objectives promise secure messaging, but the Scope never mentions it, so readers cannot tell whether it is built.',
    where: 'end of the Scope and Limitations',
    action: 'Add this sentence',
    sentences: 'Messaging between buyers and sellers is included and is limited to verified student accounts.',
    highlight: 'to message sellers securely',
  },
  {
    id: 'r5',
    tag: 'Quick fix · add 1 sentence',
    category: 'Logical Support',
    title: 'Back up the claim that trading becomes safer',
    from: 'Objectives Of The Study',
    to: 'Significance Of The Study',
    why: 'The Significance says trading becomes safer, but nothing in your objectives explains what makes it safer.',
    where: 'end of the Significance of the Study',
    action: 'Add this sentence',
    sentences: 'Safety here refers to verified student accounts and designated campus meet-ups.',
    highlight: 'a safer and more organized way of trading',
  },
  {
    id: 'r6',
    tag: 'Quick fix · add 1 sentence',
    category: 'Context Alignment',
    title: 'Reconcile the items your study covers',
    from: 'Introduction',
    to: 'Scope And Limitations',
    why: 'The Introduction mentions gadgets, but the Scope limits the study to school-related items.',
    where: 'end of the Scope and Limitations',
    action: 'Add this sentence',
    sentences: 'Gadgets are included only when they are used for school work.',
    highlight: 'the buying and selling of second-hand school-related items',
  },
  {
    id: 'r7',
    tag: 'Quick fix · add 1 sentence',
    category: 'Logical Support',
    title: 'Use one meaning of circular economy',
    from: 'Introduction',
    to: 'Definition Of Terms',
    why: 'The Introduction ties the term to students, while the definition is general, so its meaning shifts between sections.',
    where: 'end of the Definition of Terms',
    action: 'Add this sentence',
    sentences: 'In this study, the term refers to students reselling and reusing items within the campus.',
    highlight: 'keeping items in use for as long as possible',
  },
  {
    id: 'r8',
    tag: 'Quick fix · add 1 sentence',
    category: 'Logical Support',
    title: 'Tie the literature to your features',
    from: 'Review Of Related Literature',
    to: 'Objectives Of The Study',
    why: 'This passage describes marketplaces in general and never says how it supports the features you plan to build.',
    where: 'end of the first paragraph of Chapter II',
    action: 'Add this sentence',
    sentences: 'These findings support the search and messaging features of UNIHUB.',
    highlight: 'make it easy to compare prices and contact sellers directly',
  },
  {
    id: 'r9',
    tag: 'Quick fix · add 1 sentence',
    category: 'Context Alignment',
    title: 'Link the trust findings to your Rationale',
    from: 'Review Of Related Literature',
    to: 'Rationale Of The Study',
    why: 'Trust is your strongest argument for a campus-only platform, but the Rationale never mentions it.',
    where: 'end of the second paragraph of Chapter II',
    action: 'Add this sentence',
    sentences: 'This supports the Rationale of the Study, which limits UNIHUB to the campus community.',
    highlight: 'increase trust because buyers and sellers belong to the same community',
  },
];

export const ALL_CLEAR_LINKS = [
  { from: 'Rationale Of The Study', to: 'Comparative Matrix Summary' },
  { from: 'Rationale Of The Study', to: 'Suggestion/ Recommendation Generation' },
  { from: 'Rationale Of The Study', to: 'Recommendation' },
  { from: 'Rationale Of The Study', to: 'Conclusion' },
  { from: 'Objectives Of The Study', to: 'Findings' },
  { from: 'Research Methodology', to: 'Findings' },
];

export interface Citation {
  text: string;
  url?: string;
  accessible: boolean;
}

export const CITATIONS: Citation[] = [
  {
    text: 'Beatrice, M., Pilar, E., Ellyza, O., & Abisado, M. (2025). CEBUANER: A new baseline Cebuano named entity recognition model. ResearchGate.',
    url: 'https://www.researchgate.net/publication/389436171_CEBUANER_A_New_Baseline_Cebuano_Named_Entity_Recognition_Model',
    accessible: true,
  },
  { text: 'Bolaños, F., Salatino, A., Osborne, F., & Motta, E. (2024). Artificial intelligence for literature reviews.', accessible: true },
  { text: 'Sample Author, A. (2024). Student resale platforms on campus. Sample Journal of Campus Technology.', url: 'https://example.org/resale-platforms', accessible: true },
  { text: 'Sample Author, B. (2023). Trust between student buyers and sellers. Sample Review of Commerce.', url: 'https://example.org/student-trust', accessible: true },
  { text: 'Sample Author, C. (2023). Second-hand goods and the circular economy. Sample Sustainability Letters.', url: 'https://example.org/circular-economy', accessible: true },
  { text: 'Sample Author, D. (2022). Designing mobile marketplaces. Sample Journal of Interaction.', url: 'https://example.org/mobile-marketplaces', accessible: true },
  { text: 'Sample Author, E. (2022). Agile methods in capstone projects. Sample Computing Education.', url: 'https://example.org/agile-capstone', accessible: true },
  { text: 'Sample Author, F. (2021). Price comparison among young consumers. Sample Consumer Studies.', url: 'https://example.org/price-comparison', accessible: true },
  { text: 'Sample Author, G. (2021). Campus commerce in Philippine universities. Unpublished thesis.', accessible: false },
  { text: 'Sample Author, H. (2020). Peer-to-peer trading behavior. Sample Subscription Journal.', url: 'https://example.org/peer-trading', accessible: false },
];

export interface ManuscriptBlock {
  kind: 'chapter' | 'heading' | 'text';
  text: string;
}

export const MANUSCRIPT_BLOCKS: ManuscriptBlock[] = [
  { kind: 'chapter', text: 'CHAPTER I · INTRODUCTION' },
  { kind: 'text', text: 'Students on campus often buy, sell and pass on used items such as books, uniforms and gadgets through social media groups, where listings are hard to find and easy to lose.' },
  { kind: 'text', text: 'UNIHUB is a campus marketplace application that lets students list items, search by category and meet on campus. By keeping items in use for longer, it supports a circular economy among students, which leaves readers unsure why the study is needed.' },
  { kind: 'heading', text: 'Rationale of the Study' },
  { kind: 'text', text: 'The rationale explains why a campus marketplace is needed, who benefits from it and how it reduces waste among students.' },
  { kind: 'heading', text: 'Statement of the Problem' },
  { kind: 'text', text: 'This study aims to design and develop a campus marketplace application for students. Specifically, it seeks to answer the following questions: (1) How do students currently buy, sell and exchange used items? (2) What difficulties do they encounter in doing so? (3) What features would make a campus marketplace useful to them?' },
  { kind: 'heading', text: 'Objectives of the Study' },
  { kind: 'text', text: 'The general objective is to develop UNIHUB, a mobile and web application that connects student buyers and sellers within the campus. The specific objectives are to allow students to post listings with photos and prices, to search and filter items by category, to message sellers securely, and to arrange meet-ups at designated campus locations.' },
  { kind: 'heading', text: 'Significance of the Study' },
  { kind: 'text', text: 'The study benefits students who want affordable school items, students who wish to earn from items they no longer use, and the university community, which gains a safer and more organized way of trading. Future researchers may also use its findings as a reference for similar student-centered platforms.' },
  { kind: 'heading', text: 'Scope and Limitations' },
  { kind: 'text', text: 'The study covers currently enrolled students of the university and is limited to the buying and selling of second-hand school-related items. Online payment, delivery services and transactions with people outside the campus are not included in the system.' },
  { kind: 'heading', text: 'Definition of Terms' },
  { kind: 'text', text: 'Listing refers to an item posted by a student for sale. Marketplace refers to the application where listings are displayed and searched. Circular economy refers to the practice of keeping items in use for as long as possible.' },
  { kind: 'chapter', text: 'CHAPTER II · REVIEW OF RELATED LITERATURE' },
  { kind: 'text', text: 'This chapter presents related literature and studies that provide background and support for the present study. Online marketplaces have grown quickly among young consumers because they make it easy to compare prices and contact sellers directly.' },
  { kind: 'text', text: 'Studies on student resale platforms report that trust, convenience and price are the main reasons students choose to buy second-hand items. Campus-based platforms were found to increase trust because buyers and sellers belong to the same community.' },
];

/** Blocks a locked report shows in the clear; everything after them is blurred. */
export const FREE_MANUSCRIPT_BLOCKS = 3;

export const TITLE_PAGE = {
  title: 'UNIHUB: A CAMPUS MARKETPLACE APPLICATION\nFOR STUDENTS',
  lines: [
    'A Capstone Research Proposal\nPresented to the Faculty of the\nCollege of Computer Studies, University of Cebu',
    'In Partial Fulfillment of the Requirements\nfor the Degree of Bachelor of Science in Information Technology',
    'By:\nMaria L. Santos\nDaniel V. Reyes\nAna P. Villanueva\nJose T. Navarro',
    'Mr. Adviser Name\nAdviser',
  ],
};

export const PAPER_SECTIONS = [
  { title: 'Introduction', words: 461 },
  { title: 'Rationale Of The Study', words: 554 },
  { title: 'Objectives Of The Study', words: 167 },
  { title: 'Scope And Limitations Of The Study', words: 981 },
  { title: 'Agile Methodology', words: 629 },
  { title: 'Review Of Related Literature And Studies', words: 1477 },
  { title: 'Review Of Related Literature', words: 2828 },
  { title: 'Comparative Matrix Summary', words: 812 },
  { title: 'Research Methodology', words: 744 },
  { title: 'System Architecture', words: 903 },
  { title: 'Findings', words: 1206 },
  { title: 'Conclusion', words: 388 },
  { title: 'Recommendation', words: 301 },
];
