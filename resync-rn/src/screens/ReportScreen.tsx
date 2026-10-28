import React from 'react';
import {View, Text, ScrollView, StyleSheet, Pressable, StatusBar} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {RootStackParamList} from '../navigation/types';
import {ScoreRing} from '../components/ScoreRing';
import {colors, fonts} from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Report'>;

export const ReportScreen: React.FC<Props> = ({navigation, route}) => {
  const insets = useSafeAreaInsets();
  const result = route.params?.result;
  const findings = result?.inconsistencies || [];
  const issues = findings.filter(item => item.finding_status !== 'key_strength');
  const strengths = findings.filter(item => item.finding_status === 'key_strength');
  const dimensions = Object.entries(result?.score_breakdown?.v6_dimensions || {});

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <MaterialIcons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.caption}>Scan report</Text>
          <Text style={styles.title} numberOfLines={1}>{route.params?.manuscriptTitle || 'Manuscript'}</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {!result ? <Text style={styles.body}>This report is unavailable. Start a new scan to view a live result.</Text> : <>
          <View style={styles.scoreCard}>
            <ScoreRing score={Math.round(result.overall_coherence_score)} />
            <View style={styles.scoreInfo}>
              <Text style={styles.eyebrow}>COHERENCE SCORE</Text>
              <Text style={styles.band}>{result.score_breakdown?.band || 'Unrated'}</Text>
              <Text style={styles.body}>{issues.length} issues · {strengths.length} key strengths</Text>
            </View>
          </View>
          {!!issues.length && <View style={styles.section}>
            <Text style={styles.sectionTitle}>Issues</Text>
            {issues.map((item, index) => <View key={item.inconsistency_id || `issue-${index}`} style={styles.card}>
              <Text style={styles.cardTitle}>{item.section_a} ↔ {item.section_b}</Text>
              <Text style={styles.body}>{item.explanation_what}</Text>
              {!!item.explanation_why && <Text style={styles.body}>{item.explanation_why}</Text>}
              {!!item.suggested_fix && <Text style={styles.fix}>Suggested fix: {item.suggested_fix}</Text>}
            </View>)}
          </View>}
          {!!strengths.length && <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key strengths</Text>
            {strengths.map((item, index) => <View key={item.inconsistency_id || `strength-${index}`} style={styles.card}>
              <Text style={styles.cardTitle}>{item.section_a} ↔ {item.section_b}</Text>
              <Text style={styles.body}>{item.explanation_what}</Text>
              {!!item.explanation_why && <Text style={styles.body}>{item.explanation_why}</Text>}
            </View>)}
          </View>}
          {!!result.citations?.length && <View style={styles.section}>
            <Text style={styles.sectionTitle}>Citations and references</Text>
            {result.citations.map((citation, index) => <View key={index} style={styles.card}>
              <Text style={styles.cardTitle}>{citation.citation_raw_reference_text}</Text>
              <Text style={styles.body}>{citation.citation_status} · {citation.citation_is_accessible ? 'Accessible' : 'Not accessible'}</Text>
              {!!citation.citation_primary_link && <Text style={styles.link}>{citation.citation_primary_link}</Text>}
            </View>)}
          </View>}
          {!!dimensions.length && <View style={styles.section}>
            <Text style={styles.sectionTitle}>Coherence dimensions</Text>
            {dimensions.map(([pair, scores]) => <View key={pair} style={styles.card}>
              <Text style={styles.cardTitle}>{pair.replace('::', ' ↔ ')}</Text>
              {Object.entries(scores || {}).map(([name, score]) => score == null ? null :
                <View key={name} style={styles.dimensionRow}>
                  <Text style={styles.body}>{name.replace(/_/g, ' ')}</Text>
                  <Text style={styles.dimensionScore}>{Math.round(score)}</Text>
                </View>)}
            </View>)}
          </View>}
        </>}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.soft},
  header: {flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.line},
  back: {padding: 4, marginRight: 12},
  headerText: {flex: 1},
  caption: {fontFamily: fonts.sans[500], color: colors.muted, fontSize: 11},
  title: {fontFamily: fonts.sans[700], color: colors.ink, fontSize: 16},
  content: {padding: 16, paddingBottom: 40, gap: 20},
  scoreCard: {flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: 18, gap: 18},
  scoreInfo: {flex: 1, gap: 5},
  eyebrow: {fontFamily: fonts.sans[700], fontSize: 11, color: colors.muted},
  band: {fontFamily: fonts.sans[700], fontSize: 20, color: colors.ink},
  body: {fontFamily: fonts.sans[400], fontSize: 14, lineHeight: 20, color: colors.body},
  section: {gap: 10},
  sectionTitle: {fontFamily: fonts.sans[700], fontSize: 18, color: colors.ink},
  card: {backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 16, gap: 8},
  cardTitle: {fontFamily: fonts.sans[700], color: colors.ink, fontSize: 14},
  fix: {fontFamily: fonts.sans[500], fontSize: 14, lineHeight: 20, color: colors.primary},
  link: {fontFamily: fonts.sans[400], fontSize: 12, color: colors.primary},
  dimensionRow: {flexDirection: 'row', justifyContent: 'space-between'},
  dimensionScore: {fontFamily: fonts.sans[700], color: colors.ink, fontSize: 14},
});
