import React from 'react';
import {jest, it, expect} from '@jest/globals';
import renderer, {act} from 'react-test-renderer';
import {SAMPLE_REPORT} from '../src/data/sampleReport';
import {ScorePanel} from '../src/components/results/ScorePanel';
import {ResultsTabs} from '../src/components/results/ResultsTabs';
import {ManuscriptPreview, verifiedQuoteRanges} from '../src/components/results/ManuscriptPreview';
import {ReportScreen} from '../src/screens/ReportScreen';

jest.mock('react-native-safe-area-context', () => ({useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0})}));
jest.mock('../src/services/api', () => ({getScanResult: jest.fn(), getManuscriptText: jest.fn(async () => ({available: false, reason: 'private'}))}));

const words = (tree: renderer.ReactTestRenderer) => {
  const collect = (node: any): string => typeof node === 'string' || typeof node === 'number' ? String(node)
    : Array.isArray(node) ? node.map(collect).join('') : node?.children ? collect(node.children) : '';
  return collect(tree.toJSON());
};

it('renders four score cards with weights from the v7 fixture', () => {
  const tree = renderer.create(<ScorePanel result={SAMPLE_REPORT} />);
  const output = words(tree);
  for (const label of ['Objectives', 'Methodology', 'Claims', 'Numeric']) expect(output).toContain(label);
  expect(output.match(/counts 25%/g)).toHaveLength(4);
  expect(output).toContain('76');
});

it('shows a not applicable Numeric part without a weight caption', () => {
  const report = {...SAMPLE_REPORT, score_breakdown: {...SAMPLE_REPORT.score_breakdown,
    dimensions: {...SAMPLE_REPORT.score_breakdown.dimensions, numeric_consistency: null},
    dimension_weights: {...SAMPLE_REPORT.score_breakdown.dimension_weights, numeric_consistency: 0}}};
  const output = words(renderer.create(<ScorePanel result={report} />));
  expect(output).toContain('Not applicable');
  expect(output).toContain('no figures to compare');
  expect(output.match(/counts 25%/g)).toHaveLength(3);
});

it('omits a null original sentence and starts on Recommendations', () => {
  const report = {...SAMPLE_REPORT, recommendations: [{...SAMPLE_REPORT.recommendations[0], original_sentence: null}]};
  const output = words(renderer.create(<ResultsTabs result={report} />));
  expect(output).toContain('Recommendations (1)');
  expect(output).toContain('Recommended revision');
  expect(output).not.toContain('Original sentence');
  expect(output).not.toContain('Accessible (Public)');
});

it('shows citation access and decoded metadata on the Citations tab', () => {
  const report = {...SAMPLE_REPORT, citations: [{...SAMPLE_REPORT.citations[0],
    citation_raw_reference_text: 'Reference without title', citation_crossref_title: 'Reading &#38; Learning'}]};
  const tree = renderer.create(<ResultsTabs result={report} />);
  const citationsTab = tree.root.findAll(node => node.props.accessibilityRole === 'tab' && node.props.onPress)
    .find(node => node.findAllByType('Text' as any).some(text => String(text.props.children).startsWith('Citations')));
  act(() => citationsTab!.props.onPress());
  const output = words(tree);
  expect(output).toContain('Accessible (Public)');
  expect(output).toContain('Reading & Learning');
});

it('shows only the old-result notice for legacy scans', () => {
  const tree = renderer.create(<ReportScreen navigation={{navigate: jest.fn(), goBack: jest.fn()} as any}
    route={{params: {result: {result_version: 'v6'}}} as any} />);
  const output = words(tree);
  expect(output).toContain('This scan was made with an older version of ReSync. Please run a new scan.');
  expect(output).toContain('New Scan');
  expect(output).not.toContain('Coherence Score');
});

it('never renders a Google Docs URL as the result title', async () => {
  const report = {...SAMPLE_REPORT, manuscript_title: 'https://docs.google.com/document/d/secret/edit',
    doc_url: 'https://docs.google.com/document/d/secret/edit'};
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {tree = renderer.create(<ReportScreen navigation={{navigate: jest.fn(), goBack: jest.fn()} as any}
    route={{params: {result: report}} as any} />);});
  const output = words(tree);
  expect(output).toContain('Google Docs manuscript');
  expect(output).not.toContain('https://docs.google.com');
});

it('matches only verified quote text across whitespace and smart quotes', () => {
  const text = 'The “result” spans\n two lines. Another claim.';
  expect(verifiedQuoteRanges(text, ['The "result" spans two lines.', 'not present'])).toEqual([{start: 0, end: 30}]);
  const report = {...SAMPLE_REPORT, inconsistencies: SAMPLE_REPORT.inconsistencies.map(item => ({...item, evidence_verified: false}))};
  const tree = renderer.create(<ManuscriptPreview result={report} text={text} />);
  expect(JSON.stringify(tree.toJSON())).not.toContain('FECACA');
});
