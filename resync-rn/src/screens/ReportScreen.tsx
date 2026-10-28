import React, {useEffect, useState} from 'react';
import {View, Text, ScrollView, StyleSheet, Pressable, StatusBar, ActivityIndicator} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {RootStackParamList} from '../navigation/types';
import {colors, fonts} from '../theme/colors';
import {displayTitle, isV7Result, OLD_RESULT_NOTICE, type ScanResult} from '../services/v7Result';
import {getManuscriptText, getScanResult} from '../services/api';
import {SAMPLE_MANUSCRIPT, SAMPLE_REPORT} from '../data/sampleReport';
import {ScorePanel} from '../components/results/ScorePanel';
import {ResultsTabs} from '../components/results/ResultsTabs';
import {ManuscriptPreview} from '../components/results/ManuscriptPreview';
import {ResyncMonogram} from '../components/ResyncMonogram';

type Props = NativeStackScreenProps<RootStackParamList, 'Report'>;

export const ReportScreen: React.FC<Props> = ({navigation, route}) => {
  const insets = useSafeAreaInsets();
  const sample = route.params?.sample === true;
  const scanId = route.params?.scanId;
  const supplied = route.params?.result;
  const [fetched, setFetched] = useState<ScanResult>();
  const [loading, setLoading] = useState(!!scanId && !supplied && !sample);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const rawResult = sample ? SAMPLE_REPORT : supplied || fetched;
  const result = isV7Result(rawResult) ? rawResult : undefined;
  const [manuscript, setManuscript] = useState<string | null>(sample ? SAMPLE_MANUSCRIPT : null);
  const [manuscriptLoading, setManuscriptLoading] = useState(false);
  const [manuscriptReason, setManuscriptReason] = useState<string>();

  useEffect(() => {
    if (!scanId || supplied || sample) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    getScanResult(scanId).then(value => {if (!cancelled) setFetched(value);})
      .catch(cause => {if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause));})
      .finally(() => {if (!cancelled) setLoading(false);});
    return () => {cancelled = true;};
  }, [scanId, supplied, sample, attempt]);

  useEffect(() => {
    if (sample || !result) return;
    let cancelled = false;
    setManuscript(null);
    setManuscriptReason(undefined);
    if (!/^https?:\/\/docs\.google\.com\//i.test(result.doc_url)) {
      setManuscriptLoading(false);
      setManuscriptReason('non_gdocs');
      return;
    }
    setManuscriptLoading(true);
    getManuscriptText(result.analysis_run_id).then(value => {
      if (cancelled) return;
      if (value.available) setManuscript(value.text);
      else setManuscriptReason(value.reason);
    }).catch(() => {if (!cancelled) setManuscriptReason('unavailable');})
      .finally(() => {if (!cancelled) setManuscriptLoading(false);});
    return () => {cancelled = true;};
  }, [sample, result]);

  const home = () => navigation.navigate('Main', {screen: 'Home'});
  const newScan = () => navigation.navigate('Main', {screen: 'Upload'});
  return <View style={[styles.container, {paddingTop: insets.top}]}>
    <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
    <View style={styles.header}>
      <Pressable accessibilityRole="button" onPress={sample ? () => navigation.goBack() : home} style={styles.headerButton}>
        <Text style={styles.headerAction}>{sample ? 'Back' : 'Home'}</Text>
      </Pressable>
      <ResyncMonogram width={16} height={20} color={colors.primary} />
      <Text style={styles.headerBrand}>Resync</Text>
    </View>
    <ScrollView contentContainerStyle={styles.content}>
      {loading ? <View style={styles.center}><ActivityIndicator color={colors.primary} /><Text style={styles.body}>Loading report…</Text></View>
        : error ? <View style={styles.center}><Text style={styles.body}>{error}</Text><Pressable onPress={() => setAttempt(attempt + 1)}><Text style={styles.action}>Retry</Text></Pressable></View>
        : !result ? <View style={styles.center}><Text style={styles.body}>{rawResult ? OLD_RESULT_NOTICE : 'This report is unavailable. Start a new scan to view a live result.'}</Text><Pressable onPress={newScan}><Text style={styles.action}>New Scan</Text></Pressable></View>
        : <>
          <Text style={styles.eyebrow}>{sample ? 'Sample manuscript report' : 'Manuscript report'}</Text>
          <Text style={styles.title}>{sample ? 'Guided Reading Outcomes' : displayTitle(result, manuscript)}</Text>
          <Text style={styles.assessment}>Overall assessment {result.score_breakdown.band} · {result.inconsistencies.length} findings across {result.sections_analyzed.length} sections</Text>
          <ScorePanel result={result} />
          <ResultsTabs result={result} />
          <ManuscriptPreview result={result} text={manuscript} reason={manuscriptReason} loading={manuscriptLoading} />
        </>}
    </ScrollView>
  </View>;
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.soft},
  header: {flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.line},
  headerButton: {padding: 4, minWidth: 55}, headerAction: {fontFamily: fonts.sans[600], color: colors.primary, fontSize: 14},
  headerBrand: {fontFamily: fonts.sans[800], color: colors.ink, fontSize: 18},
  content: {padding: 16, paddingBottom: 40, gap: 16}, center: {alignItems: 'center', gap: 16, padding: 24},
  eyebrow: {fontFamily: fonts.sans[700], color: colors.primary, fontSize: 11, textTransform: 'uppercase'},
  title: {fontFamily: fonts.display[700], color: colors.ink, fontSize: 25},
  assessment: {fontFamily: fonts.sans[400], color: colors.muted, fontSize: 12},
  body: {fontFamily: fonts.sans[400], color: colors.body, fontSize: 14, lineHeight: 20, textAlign: 'center'},
  action: {fontFamily: fonts.sans[700], color: colors.primary, fontSize: 14},
});
