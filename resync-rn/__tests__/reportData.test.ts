import { describe, it, expect } from '@jest/globals';
import { categoryPercent, liveScoreCategories, MANUSCRIPT_BLOCKS, overallScore, RECOMMENDATIONS, SCORE_CATEGORIES,
  liveFlowSummary,
} from '../src/data/report';

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

describe('liveScoreCategories', () => {
  const check = (score: number, items: number, passed: number) => ({ score, items, passed, flow: { items: 8, passed: 2 }, cross: { items: 8, passed: 8 } });

  it('uses the backend score and counts, in the report order, and averages to the overall score', () => {
    const categories = liveScoreCategories({
      dimensions: { claim_support: 0.3682 },
      dimension_breakdown: {
        logical_support: check(77.79, 16, 10),
        evidence_consistency: { score: 100, items: 1, passed: 1 },
        context_alignment: check(82.06, 16, 11),
        operational_alignment: check(70.85, 16, 9),
      },
    });
    expect(categories.map((c) => c.name)).toEqual(['Context Alignment', 'Operational Alignment', 'Logical Support', 'Evidence Consistency']);
    expect(categories.map(categoryPercent)).toEqual([82.06, 70.85, 77.79, 100]);
    expect(categories[0]).toMatchObject({ correct: 11, total: 16, flow: { passed: 2 }, cross: { passed: 8 } });
    expect(overallScore(categories)).toBe(83);
  });

  it('marks a check with nothing to compare as not applicable', () => {
    const [category] = liveScoreCategories({ dimension_breakdown: { evidence_consistency: { score: null, items: 0, passed: 0 } } });
    expect(categoryPercent(category)).toBeNull();
    expect(category.naCaption).toBeTruthy();
  });

  it('scales the 0 to 1 averages of older scans to percentages', () => {
    const categories = liveScoreCategories({ dimensions: { claim_support: 0.3682, numeric_consistency: null } });
    expect(categories).toHaveLength(1);
    expect(categoryPercent(categories[0])).toBeCloseTo(36.82);
    expect(categories[0].total).toBeUndefined();
  });
});

describe('liveFlowSummary', () => {
  it('counts flagged or recommended pairs as issues and the rest as all clear, like the website', () => {
    const result = {
      recommendations: [{ pair_order: 3 }],
      manuscript_flow: [
        { order: 1, section_a: 'introduction', section_b: 'presentation', severity: 'Critical', scores: { overall_coherence: 0.8 } },
        { order: 2, section_a: 'objectives of the study', section_b: 'methodology', severity: 'None', scores: { overall_coherence: 0.2 } },
        { order: 3, section_a: 'method', section_b: 'presentation', severity: 'None', scores: { overall_coherence: 0.3 } },
        { order: 4, section_a: 'design', section_b: 'findings', severity: null, scores: { overall_coherence: 0.4 } },
        { order: 5, section_a: 'a', section_b: 'b', severity: 'None', scores: { overall_coherence: null } },
      ],
    } as any;
    expect(liveFlowSummary(result)).toEqual({ issues: 2, allClear: [{ from: 'Objectives Of The Study', to: 'Methodology' }] });
    expect(liveFlowSummary(undefined)).toEqual({ issues: 0, allClear: [] });
  });
});
