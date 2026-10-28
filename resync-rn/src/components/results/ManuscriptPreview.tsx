import React, {useMemo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {colors, fonts} from '../../theme/colors';
import type {V7ScanResponse} from '../../services/v7Result';

// Match the web's verified quotes across whitespace and smart/straight quote differences.
export function verifiedQuoteRanges(text: string, quotes: string[]): {start: number; end: number}[] {
  const normalize = (value: string) => value.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ');
  let normalized = '';
  const starts: number[] = [];
  const ends: number[] = [];
  for (let i = 0; i < text.length;) {
    const next = /\s/.test(text[i]) ? i + (text.slice(i).match(/^\s+/)?.[0].length ?? 1) : i + 1;
    const clean = normalize(text.slice(i, next));
    for (let unit = 0; unit < clean.length; unit++) {
      normalized += clean[unit];
      starts.push(i);
      ends.push(next);
    }
    i = next;
  }
  const matches = quotes.flatMap(quote => {
    const needle = normalize(quote.trim());
    if (!needle) return [];
    const at = normalized.indexOf(needle);
    return at < 0 ? [] : [{start: starts[at], end: ends[at + needle.length - 1]}];
  }).sort((a, b) => a.start - b.start);
  const ranges: {start: number; end: number}[] = [];
  for (const match of matches) if (!ranges.length || match.start >= ranges[ranges.length - 1].end) ranges.push(match);
  return ranges;
}

export function ManuscriptPreview({result, text, reason, loading}: {result: V7ScanResponse; text?: string | null; reason?: string; loading?: boolean}) {
  const paragraphs = useMemo(() => {
    if (!text) return [];
    const quotes = result.inconsistencies.filter(item => item.evidence_verified)
      .flatMap(item => item.evidence_quotes).map(quote => quote.text);
    const ranges = verifiedQuoteRanges(text, quotes);
    let offset = 0;
    let rangeIndex = 0;
    return text.split(/(\r?\n)/).filter((_, index) => index % 2 === 0).map((paragraph, index) => {
      const start = offset;
      const end = start + paragraph.length;
      offset = end + (text.slice(end).startsWith('\r\n') ? 2 : text.slice(end).startsWith('\n') ? 1 : 0);
      const pieces: {text: string; marked: boolean}[] = [];
      let cursor = start;
      while (rangeIndex < ranges.length && ranges[rangeIndex].end <= start) rangeIndex++;
      for (let i = rangeIndex; i < ranges.length && ranges[i].start < end; i++) {
        const from = Math.max(start, ranges[i].start);
        const to = Math.min(end, ranges[i].end);
        if (from > cursor) pieces.push({text: text.slice(cursor, from), marked: false});
        if (to > from) pieces.push({text: text.slice(from, to), marked: true});
        cursor = to;
      }
      if (cursor < end) pieces.push({text: text.slice(cursor, end), marked: false});
      return {key: index, pieces};
    });
  }, [result, text]);

  const passages = [
    ...result.inconsistencies.filter(finding => finding.evidence_verified).flatMap(finding =>
      finding.evidence_quotes.map(quote => ({section: quote.section, text: quote.text, label: `Finding · ${finding.section_a} → ${finding.section_b}`}))),
    ...result.manuscript_flow.flatMap(pair => [
      ...pair.culprit_sentences.section_a.map(culprit => ({section: pair.section_a, text: culprit.sentence, label: `Pair · ${pair.section_a} → ${pair.section_b}`})),
      ...pair.culprit_sentences.section_b.map(culprit => ({section: pair.section_b, text: culprit.sentence, label: `Pair · ${pair.section_a} → ${pair.section_b}`})),
    ]),
  ].filter(passage => passage.text.trim());
  const sections = result.sections_analyzed.map(name => ({name, passages: passages.filter(passage => passage.section === name)}))
    .filter(section => section.passages.length);
  const isGoogleDoc = /^https?:\/\/docs\.google\.com\//i.test(result.doc_url);
  const note = isGoogleDoc ? reason === 'private'
    ? "The document is not shared with 'Anyone with the link can view', so only the passages the analysis refers to are shown."
    : "We couldn't load the document text right now, so only the passages the analysis refers to are shown."
    : "The full text of uploaded files isn't kept, so only the passages the analysis refers to are shown.";

  return <View style={styles.section}>
    <Text style={styles.title}>Manuscript preview</Text>
    <Text style={styles.legend}>Highlighted passages: a sentence the analysis flagged in a weak section connection or tied to a finding.</Text>
    {loading ? <Text style={styles.body}>Loading manuscript text…</Text> : text ? paragraphs.map(paragraph =>
      <Text key={paragraph.key} style={styles.manuscript}>{paragraph.pieces.map((piece, index) =>
        <Text key={index} style={piece.marked ? styles.highlight : undefined}>{piece.text}</Text>)}</Text>) : <>
      <Text style={styles.body}>{note}</Text>
      {sections.length ? sections.map(section => <View key={section.name} style={styles.excerptSection}>
        <Text style={styles.title}>{section.name}</Text>
        {section.passages.map((passage, index) => <View key={index} style={styles.passage}>
          <Text style={styles.label}>{passage.label}</Text>
          <Text style={styles.manuscript}><Text style={styles.highlight}>{passage.text}</Text></Text>
        </View>)}
      </View>) : <Text style={styles.body}>No passages were flagged in this manuscript.</Text>}
    </>}
  </View>;
}

const styles = StyleSheet.create({
  section: {gap: 12, backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: 16},
  title: {fontFamily: fonts.sans[700], color: colors.ink, fontSize: 16},
  legend: {fontFamily: fonts.sans[400], color: colors.muted, fontSize: 12, lineHeight: 18},
  body: {fontFamily: fonts.sans[400], color: colors.body, fontSize: 13, lineHeight: 20},
  manuscript: {fontFamily: fonts.serif[400], color: colors.body, fontSize: 14, lineHeight: 26},
  highlight: {backgroundColor: '#FECACA'},
  excerptSection: {borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12, gap: 10},
  passage: {gap: 4}, label: {fontFamily: fonts.sans[600], color: colors.muted, fontSize: 11},
});
