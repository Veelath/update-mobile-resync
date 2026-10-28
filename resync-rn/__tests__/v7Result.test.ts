import {describe, it, expect} from '@jest/globals';
import fixtureA from './fixtures/REAL_V7_RESPONSE_2.json';
import fixtureB from './fixtures/p9-real-result.json';
import {SAMPLE_REPORT} from '../src/data/sampleReport';
import {
  adaptScanResult, citationAccess, CITATION_LABELS, dimensionCard, displayTitle,
  isV7Result, OLD_RESULT_NOTICE, plainText, scoreText,
  type V7ScanResponse,
} from '../src/services/v7Result';

const first = adaptScanResult(fixtureA);
const second = adaptScanResult(fixtureB);

describe('v7 result boundary and display', () => {
  it('accepts only the literal v7 marker and keeps old results behind the notice', () => {
    expect(isV7Result(first)).toBe(true);
    expect(isV7Result(second)).toBe(true);
    expect(isV7Result(adaptScanResult({result_version: 'v6'}))).toBe(false);
    expect(isV7Result(adaptScanResult({analysis_run_id: 'old'}))).toBe(false);
    expect(OLD_RESULT_NOTICE).toBe('This scan was made with an older version of ReSync. Please run a new scan.');
    expect(() => adaptScanResult(null)).toThrow('Invalid scan result.');
  });

  it('uses server means and weights for cards, rounding only visible scores', () => {
    const weighted = {...fixtureA, score_breakdown: {...fixtureA.score_breakdown,
      dimension_weights: {objectives_alignment: 0.25, methodology_fit: 0.25, claim_support: 0.25, numeric_consistency: 0.25}}} as V7ScanResponse;
    expect(scoreText(weighted.overall_coherence_score)).toBe('82');
    expect(weighted.score_breakdown.band).toBe('Solid');
    expect(dimensionCard(weighted, 'objectives_alignment')).toEqual({applicable: true, value: 74, caption: 'counts 25%'});
    expect(dimensionCard(second as V7ScanResponse, 'claim_support')).toEqual({applicable: true, value: 67, caption: null});
    expect(dimensionCard(SAMPLE_REPORT, 'numeric_consistency').caption).toBe('counts 25%');
  });

  it('explains a missing dimension and the remaining one-third weights', () => {
    const result = {...fixtureB, score_breakdown: {...fixtureB.score_breakdown,
      dimensions: {...fixtureB.score_breakdown.dimensions, numeric_consistency: null},
      dimension_weights: {objectives_alignment: 1 / 3, methodology_fit: 1 / 3, claim_support: 1 / 3, numeric_consistency: 0}}} as V7ScanResponse;
    expect(dimensionCard(result, 'numeric_consistency')).toEqual({applicable: false, value: 0, caption: 'no figures to compare'});
    expect(dimensionCard(result, 'methodology_fit').caption).toBe('counts 33%');
    expect(dimensionCard({...result, score_breakdown: {...result.score_breakdown,
      dimensions: {...result.score_breakdown.dimensions, methodology_fit: null}}}, 'methodology_fit').caption).toBe('not enough text');
  });

  it('maps citation access with boolean precedence and web labels', () => {
    const citation = SAMPLE_REPORT.citations[0];
    expect(citationAccess(citation)).toBe('public');
    expect(citationAccess({...citation, citation_is_accessible: false})).toBe('private');
    expect(citationAccess({...citation, citation_is_accessible: null, citation_status: 'metadata_mismatch'})).toBe('public');
    expect(citationAccess({...citation, citation_is_accessible: null, citation_status: 'paywalled'})).toBe('private');
    expect(CITATION_LABELS).toEqual({public: 'Accessible (Public)', private: 'Inaccessible (Private)'});
  });

  it('cleans AI text exactly like the web helper', () => {
    expect(plainText('## **numeric_consistency**\n- `Check` *the* figures')).toBe('Numbers agree Check the figures');
    expect(plainText(null)).toBe('');
  });

  it('never uses a URL as the manuscript title', () => {
    const doc = {manuscript_title: 'https://docs.google.com/document/d/abc/edit', doc_url: 'https://docs.google.com/document/d/abc/edit'};
    expect(displayTitle(doc, '\uFEFF\nIV\nGuided Reading Outcomes\nAbstract')).toBe('Guided Reading Outcomes');
    expect(displayTitle(doc, 'https://example.com/title')).toBe('Google Docs manuscript');
    expect(displayTitle({...doc, manuscript_title: 'Proper title'}, 'Other title')).toBe('Proper title');
    expect(displayTitle({manuscript_title: null, doc_url: 'paper.docx'})).toBe('paper');
  });
});
