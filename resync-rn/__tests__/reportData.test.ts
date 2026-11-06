import { it, expect } from '@jest/globals';
import { MANUSCRIPT_BLOCKS, overallScore, RECOMMENDATIONS, SCORE_CATEGORIES } from '../src/data/report';

it('points every recommendation at exactly one manuscript passage', () => {
  for (const rec of RECOMMENDATIONS) {
    const matches = MANUSCRIPT_BLOCKS.filter((b) => b.kind === 'text' && b.text.includes(rec.highlight));
    expect(matches).toHaveLength(1);
  }
});

it('keeps each manuscript paragraph to a single finding', () => {
  for (const block of MANUSCRIPT_BLOCKS) {
    expect(RECOMMENDATIONS.filter((r) => block.text.includes(r.highlight)).length).toBeLessThanOrEqual(1);
  }
});

it('averages only the categories that apply, rounded up', () => {
  expect(overallScore(SCORE_CATEGORIES)).toBe(62);
});
