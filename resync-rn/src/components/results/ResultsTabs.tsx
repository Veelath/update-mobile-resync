import React, {useState} from 'react';
import {View, Text, Pressable, StyleSheet, Linking} from 'react-native';
import {colors, fonts} from '../../theme/colors';
import {citationAccess, CITATION_LABELS, plainText, type CitationReport, type V7ScanResponse} from '../../services/v7Result';

const citationText = (value?: string | null) => (value || '').replace(/<\/?[a-z][^>]*>/gi, '')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
const contains = (reference: string, value?: string | number | null) => value != null && reference.toLowerCase().includes(String(value).toLowerCase());

function CitationRow({citation, index}: {citation: CitationReport; index: number}) {
  const reference = citationText(citation.citation_raw_reference_text);
  const title = citationText(citation.citation_crossref_title);
  const authors = citationText(citation.citation_authors_parsed);
  const year = citation.citation_year_parsed;
  const link = citation.citation_primary_link || '';
  const access = citationAccess(citation);
  return <View style={styles.card}>
    <Text style={styles.number}>{index + 1}</Text>
    <Text style={styles.status}>{CITATION_LABELS[access]}</Text>
    {!!title && !contains(reference, title) && <Text style={styles.strong}>{title}</Text>}
    {!!authors && !contains(reference, authors) && <Text style={styles.body}>{authors}</Text>}
    {!!year && !contains(reference, year) && <Text style={styles.body}>{year}</Text>}
    <Text style={styles.body}>{reference}</Text>
    {/^https?:\/\//i.test(link) && <Text onPress={() => Linking.openURL(link)} style={styles.link}>{link}</Text>}
  </View>;
}

export function ResultsTabs({result}: {result: V7ScanResponse}) {
  const [tab, setTab] = useState<'recommendations' | 'citations'>('recommendations');
  const [filter, setFilter] = useState<'public' | 'private' | null>(null);
  const [more, setMore] = useState(false);
  const citations = result.citations || [];
  const displayed = filter ? citations.filter(citation => citationAccess(citation) === filter) : citations;
  return <View style={styles.section}>
    <View style={styles.tabs}>
      <Pressable accessibilityRole="tab" accessibilityState={{selected: tab === 'recommendations'}} onPress={() => setTab('recommendations')} style={[styles.tab, tab === 'recommendations' && styles.activeTab]}>
        <Text style={[styles.tabText, tab === 'recommendations' && styles.activeText]}>Recommendations ({result.recommendations.length})</Text>
      </Pressable>
      <Pressable accessibilityRole="tab" accessibilityState={{selected: tab === 'citations'}} onPress={() => setTab('citations')} style={[styles.tab, tab === 'citations' && styles.activeTab]}>
        <Text style={[styles.tabText, tab === 'citations' && styles.activeText]}>Citations ({citations.length})</Text>
      </Pressable>
    </View>
    {tab === 'recommendations' ? result.recommendations.length ? result.recommendations.map((item, index) => <View key={item.recommendation_id || index} style={styles.card}>
      <Text style={styles.number}>{String(index + 1).padStart(2, '0')}</Text>
      {!!item.section_b && <Text style={styles.strong}>{item.section_b}</Text>}
      {!!item.original_sentence && <View style={styles.quote}><Text style={styles.label}>Original sentence</Text><Text style={styles.body}>“{plainText(item.original_sentence)}”</Text></View>}
      <View style={styles.revision}><Text style={styles.label}>Recommended revision</Text><Text style={styles.body}>{plainText(item.recommended_revision)}</Text></View>
    </View>) : <Text style={styles.body}>No recommendations for this scan.</Text> : <>
      <Text style={styles.body}>Click any status card to filter the list. Click it again to clear.</Text>
      <View style={styles.filters}>{(['public', 'private'] as const).map(status => <Pressable key={status} onPress={() => setFilter(filter === status ? null : status)} accessibilityState={{selected: filter === status}} style={[styles.filter, filter === status && styles.selectedFilter]}>
        <Text style={styles.label}>{CITATION_LABELS[status]}</Text>
        <Text style={styles.filterCount}>{citations.filter(citation => citationAccess(citation) === status).length}</Text>
      </Pressable>)}</View>
      <Text style={styles.body}>Accessible (Public) = anyone can open the source · Inaccessible (Private) = private, or needs permission or a login.</Text>
      {filter && <Pressable onPress={() => setFilter(null)}><Text style={styles.link}>Filtering by: {CITATION_LABELS[filter]} ({displayed.length} of {citations.length}) · Show All</Text></Pressable>}
      {displayed.length ? displayed.map((citation, index) => <CitationRow key={index} citation={citation} index={index} />) : <Text style={styles.body}>{filter ? `No ${CITATION_LABELS[filter].toLowerCase()} citations` : `No citations were detected in this manuscript (${result.citations_audited} sources audited).`}</Text>}
    </>}
    {!!result.ai_text_indicator && <View style={styles.ai}>
      <Text style={styles.body}>AI-text indicator: {result.ai_text_indicator.overall_score ?? '—'} · A rough hint only, not proof that AI wrote the text. Well-written academic prose can score 40-60 on its own. Never use it alone to judge a submission.</Text>
      <Pressable onPress={() => setMore(!more)} accessibilityRole="button" accessibilityState={{expanded: more}}><Text style={styles.link}>More about this indicator</Text></Pressable>
      {more && <Text style={styles.body}>{plainText(result.ai_text_indicator.disclaimer)}</Text>}
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  section: {gap: 12}, tabs: {flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.line},
  tab: {flex: 1, paddingVertical: 12, alignItems: 'center'}, activeTab: {borderBottomWidth: 2, borderBottomColor: colors.primary},
  tabText: {fontFamily: fonts.sans[700], fontSize: 12, color: colors.muted}, activeText: {color: colors.primary},
  card: {backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 14, gap: 8},
  number: {fontFamily: fonts.mono[700], color: colors.primary, fontSize: 12},
  strong: {fontFamily: fonts.sans[700], color: colors.ink, fontSize: 13},
  body: {fontFamily: fonts.sans[400], color: colors.body, fontSize: 13, lineHeight: 20},
  label: {fontFamily: fonts.sans[700], color: colors.muted, fontSize: 10, textTransform: 'uppercase'},
  quote: {backgroundColor: colors.soft, padding: 10, borderRadius: 8, gap: 4},
  revision: {backgroundColor: colors.primaryTint, padding: 10, borderRadius: 8, gap: 4},
  link: {fontFamily: fonts.sans[600], color: colors.primary, fontSize: 12},
  status: {fontFamily: fonts.sans[700], color: colors.primary, fontSize: 11},
  filters: {flexDirection: 'row', gap: 8}, filter: {flex: 1, padding: 10, borderWidth: 1, borderColor: colors.line, borderRadius: 10},
  selectedFilter: {backgroundColor: colors.primaryTint, borderColor: colors.primary}, filterCount: {fontFamily: fonts.sans[700], fontSize: 20, color: colors.ink},
  ai: {borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 14, gap: 8},
});
