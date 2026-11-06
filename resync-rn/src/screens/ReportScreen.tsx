import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ToastAndroid,
  Platform,
  Alert,
  StatusBar,
  Clipboard,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { fonts } from '../theme/colors';
import { brand } from '../theme/brand';
import { BottomSheet } from '../components/BottomSheet';
import { LineIcon } from '../components/LineIcon';
import { PressableScale } from '../components/PressableScale';
import {
  ALL_CLEAR_LINKS,
  categoryPercent,
  Citation,
  CITATIONS,
  FREE_MANUSCRIPT_BLOCKS,
  MANUSCRIPT_BLOCKS,
  ManuscriptBlock,
  overallScore,
  RECOMMENDATIONS,
  ReportRecommendation,
  SAMPLE_REPORT_TITLE,
  SCORE_CATEGORIES,
  ScoreCategory,
} from '../data/report';
import { ScanItem } from '../data/scans';
import { getAllScans, unlockScan } from '../services/scanRepository';
import { creditsAvailable, getSession, incrementScansCount } from '../services/session';

type Props = NativeStackScreenProps<RootStackParamList, 'Report'>;
type ReportView = 'report' | 'manuscript';
type ReportTab = 'recs' | 'clear' | 'citations';

const FREE_RECOMMENDATIONS = 1;
const FREE_CITATIONS = 2;
const RING_RADIUS = 42;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;
const RING_SEGMENT = 21.5; // share of the ring each category owns, leaving small gaps between them
const GRID_TOP = 10;

const notify = (message: string) => {
  if (Platform.OS === 'android') ToastAndroid.show(message, ToastAndroid.SHORT);
  else Alert.alert('Notice', message);
};

const creditsLabel = (n: number) => `You have ${n} ${n === 1 ? 'credit' : 'credits'}`;

/** Score ring split into one arc per category, each filled to that category's score. */
const CategoryRing: React.FC<{ score: number }> = ({ score }) => (
  <View style={styles.ring}>
    <Svg width={108} height={108} viewBox="0 0 100 100">
      {SCORE_CATEGORIES.map((c, i) => {
        const pct = categoryPercent(c);
        const arc = (share: number) => [(share / 100) * RING_LENGTH, RING_LENGTH];
        const shared = {
          cx: 50,
          cy: 50,
          r: RING_RADIUS,
          fill: 'none',
          strokeWidth: 9,
          strokeLinecap: 'round' as const,
          rotation: -88 + i * 90,
          originX: 50,
          originY: 50,
        };
        const stroke = pct === null ? '#FFFFFF' : c.color;
        return (
          <React.Fragment key={c.id}>
            <Circle {...shared} stroke={stroke} strokeOpacity={0.3} strokeDasharray={arc(RING_SEGMENT)} />
            {pct !== null && <Circle {...shared} stroke={stroke} strokeDasharray={arc((RING_SEGMENT * pct) / 100)} />}
          </React.Fragment>
        );
      })}
    </Svg>
    <View style={styles.ringCenter}>
      <Text style={styles.ringScore}>{score}</Text>
      <Text style={styles.ringMax}>/100</Text>
    </View>
  </View>
);

const Bar: React.FC<{ pct: number; color: string }> = ({ pct, color }) => (
  <View style={styles.bar}>
    <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
  </View>
);

const CategoryCard: React.FC<{ category: ScoreCategory; open: boolean; onPress: () => void }> = ({ category: c, open, onPress }) => {
  const pct = categoryPercent(c);
  return (
    <Pressable onPress={onPress} style={[styles.catCard, open && styles.catCardOpen]}>
      <View style={styles.catLabelRow}>
        <View style={[styles.dot, { backgroundColor: c.color }]} />
        <Text style={styles.catLabel}>{c.name}</Text>
      </View>
      {pct === null ? (
        <Text style={styles.catNa}>Not applicable</Text>
      ) : (
        <View style={styles.catScoreRow}>
          <Text style={styles.catScore}>{pct.toFixed(2)}</Text>
          <Text style={styles.catUnit}>%</Text>
        </View>
      )}
      <Text style={styles.catCaption}>{pct === null ? c.naCaption : `${c.correct} out of ${c.total} correct`}</Text>
      <Bar pct={pct ?? 0} color={c.color} />
    </Pressable>
  );
};

const CategoryPopover: React.FC<{ category: ScoreCategory; top: number; arrowLeft: `${number}%`; onClose: () => void }> = ({
  category: c,
  top,
  arrowLeft,
  onClose,
}) => {
  const pct = categoryPercent(c);
  return (
    <View style={[styles.pop, { top }]}>
      <View style={[styles.popArrow, { left: arrowLeft }]} />
      <View style={styles.popHead}>
        <View style={[styles.catLabelRow, styles.flex1]}>
          <View style={[styles.dot, { backgroundColor: c.color }]} />
          <Text style={styles.popTitle}>{c.name}</Text>
        </View>
        {pct === null ? (
          <Text style={styles.popNa}>Not applicable</Text>
        ) : (
          <Text style={styles.popUnit}>
            <Text style={styles.popScore}>{pct.toFixed(2)}</Text>%
          </Text>
        )}
      </View>
      <Text style={styles.popDesc}>{c.desc}</Text>
      {pct === null ? (
        <Text style={styles.popNote}>{c.naNote}</Text>
      ) : (
        <>
          {['Flow between neighboring sections', 'Chapters that should agree'].map((label) => (
            <View key={label}>
              <View style={styles.popRow}>
                <Text style={styles.popRowLabel}>{label}</Text>
                <Text style={styles.popRowValue}>
                  {c.correct} out of {c.total} correct
                </Text>
              </View>
              <Bar pct={pct} color={c.color} />
            </View>
          ))}
          <Text style={styles.popNote}>Each counts for half of this score, so the many chapter checks cannot hide weak flow.</Text>
        </>
      )}
      <Pressable onPress={onClose} style={styles.popClose}>
        <Text style={styles.popCloseText}>Close</Text>
      </Pressable>
    </View>
  );
};

const RecommendationCard: React.FC<{ rec: ReportRecommendation; onShow: () => void }> = ({ rec, onShow }) => (
  <View style={styles.recCard}>
    <View style={styles.recTagRow}>
      <View style={styles.recTag}>
        <LineIcon name="bolt" size={13} color="#12703F" />
        <Text style={styles.recTagText}>{rec.tag}</Text>
      </View>
      <Text style={styles.recCategory}>Category: {rec.category}</Text>
    </View>
    <Text style={styles.recTitle}>{rec.title}</Text>
    <Pressable onPress={onShow} style={styles.recLink}>
      <Text style={styles.recChip} numberOfLines={1}>
        {rec.from}
      </Text>
      <View style={styles.weakLink}>
        <View style={styles.weakDash} />
        <Text style={styles.weakText}>weak link</Text>
      </View>
      <Text style={styles.recChip} numberOfLines={1}>
        {rec.to}
      </Text>
    </Pressable>
    <Text style={styles.recWhy}>{rec.why}</Text>
    <View style={styles.recDivider} />
    <Text style={styles.recStepsLabel}>WHAT TO DO</Text>
    <View style={styles.recStep}>
      <View style={styles.recStepNum}>
        <Text style={styles.recStepNumText}>1</Text>
      </View>
      <Text style={[styles.recStepText, styles.flex1]}>
        Go to the <Text style={styles.recStepBold}>{rec.where}</Text>.
      </Text>
    </View>
    <View style={styles.recStep}>
      <View style={styles.recStepNum}>
        <Text style={styles.recStepNumText}>2</Text>
      </View>
      <View style={[styles.flex1, styles.recStepBody]}>
        <Text style={styles.recStepText}>{rec.action}:</Text>
        <View style={styles.recQuote}>
          <View style={styles.recQuoteBar} />
          <Text style={styles.recQuoteText}>{rec.sentences}</Text>
        </View>
      </View>
    </View>
    <View style={styles.recActions}>
      <PressableScale
        onPress={() => {
          Clipboard.setString(rec.sentences);
          notify('Copied');
        }}
        style={styles.recCopy}
      >
        <LineIcon name="copy" size={16} color="#FFFFFF" />
        <Text style={styles.recCopyText}>Copy sentences</Text>
      </PressableScale>
      <PressableScale onPress={onShow} style={styles.recShow}>
        <LineIcon name="pin" size={16} color={brand.primary} />
        <Text style={styles.recShowText}>Show me where</Text>
      </PressableScale>
    </View>
  </View>
);

const CitationCard: React.FC<{ citation: Citation; number: number }> = ({ citation: c, number }) => (
  <View style={[styles.citation, !c.accessible && styles.citationPrivate]}>
    <View style={styles.citationBody}>
      <Text style={styles.citationNum}>{number}</Text>
      <Text style={styles.citationText}>
        {c.text}
        {c.url ? <Text style={styles.citationUrl}>{`\n${c.url}`}</Text> : null}
      </Text>
    </View>
    <Text style={[styles.citationPill, !c.accessible && styles.citationPillPrivate]}>
      {c.accessible ? 'Accessible (Public)' : 'Inaccessible (Private)'}
    </Text>
  </View>
);

/** A manuscript paragraph with its finding marked up as a tappable highlight. */
const Paragraph: React.FC<{ text: string; activeId?: string; onPick: (rec: ReportRecommendation) => void }> = ({ text, activeId, onPick }) => {
  const rec = RECOMMENDATIONS.find((r) => text.includes(r.highlight));
  if (!rec) return <Text style={styles.paperText}>{text}</Text>;
  const [before, after] = text.split(rec.highlight);
  return (
    <Text style={styles.paperText}>
      {before}
      <Text onPress={() => onPick(rec)} style={[styles.highlight, rec.id === activeId && styles.highlightActive]}>
        {rec.highlight}
      </Text>
      {after}
    </Text>
  );
};

const BLOCK_STYLE = (kind: ManuscriptBlock['kind']) =>
  kind === 'chapter' ? styles.paperChapter : kind === 'heading' ? styles.paperHeading : styles.paperText;

export const ReportScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const scanId = route.params?.scanId;

  const [loaded, setLoaded] = useState(false);
  const [scan, setScan] = useState<ScanItem | null>(null);
  const [credits, setCredits] = useState(0);
  const [view, setView] = useState<ReportView>('report');
  const [tab, setTab] = useState<ReportTab>('recs');
  const [openCategory, setOpenCategory] = useState<number | null>(null);
  const [rowBottoms, setRowBottoms] = useState([0, 0]);
  const [citationFilter, setCitationFilter] = useState<boolean | null>(null);
  const [sheetRec, setSheetRec] = useState<ReportRecommendation | null>(null);

  const unlocking = useRef(false);
  const reportScroll = useRef<ScrollView>(null);
  const breakdownY = useRef(0);
  const manuscriptScroll = useRef<ScrollView>(null);
  const paperY = useRef(0);
  const blockY = useRef<Record<number, number>>({});
  const scrollToRec = useRef<ReportRecommendation | null>(null);

  const load = useCallback(async () => {
    const [session, scans] = await Promise.all([getSession(), getAllScans()]);
    setScan(scans.find((s) => s.id === scanId) ?? null);
    setCredits(creditsAvailable(session));
    setLoaded(true);
  }, [scanId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const locked = scan?.unlocked === false;
  const lockedCount = RECOMMENDATIONS.length - FREE_RECOMMENDATIONS;
  const recs = locked ? RECOMMENDATIONS.slice(0, FREE_RECOMMENDATIONS) : RECOMMENDATIONS;
  const citations = (locked ? CITATIONS.slice(0, FREE_CITATIONS) : CITATIONS)
    .map((c, i) => ({ c, number: i + 1 }))
    .filter(({ c }) => citationFilter === null || c.accessible === citationFilter);
  const openBlocks = locked ? MANUSCRIPT_BLOCKS.slice(0, FREE_MANUSCRIPT_BLOCKS) : MANUSCRIPT_BLOCKS;

  const unlock = async () => {
    if (!scan || unlocking.current) return;
    unlocking.current = true;
    // The scan itself is free: the credit is spent here, when the full report opens
    await incrementScansCount();
    await unlockScan(scan.id);
    await load();
    unlocking.current = false;
  };

  const unlockAction =
    credits > 0
      ? { label: 'Unlock full report · 1 credit', onPress: unlock }
      : { label: 'Buy credits', onPress: () => navigation.navigate('Main', { screen: 'Credits' }) };

  // Bring the tapped row to the top so the whole popover clears the unlock bar
  const toggleCategory = (index: number) => {
    const opening = openCategory !== index;
    setOpenCategory(opening ? index : null);
    if (opening) reportScroll.current?.scrollTo({ y: breakdownY.current + (index < 2 ? 0 : rowBottoms[0]), animated: true });
  };

  const closeSheet = useCallback(() => setSheetRec(null), []);

  const showInManuscript = (rec: ReportRecommendation) => {
    scrollToRec.current = rec;
    setView('manuscript');
    setSheetRec(rec);
  };

  // "Show me where" lands on the paragraph once the manuscript has laid out
  useEffect(() => {
    if (view !== 'manuscript' || !scrollToRec.current) return;
    const rec = scrollToRec.current;
    scrollToRec.current = null;
    const index = MANUSCRIPT_BLOCKS.findIndex((b) => b.text.includes(rec.highlight));
    const t = setTimeout(() => {
      const y = paperY.current + (blockY.current[index] ?? 0) - 12;
      manuscriptScroll.current?.scrollTo({ y: Math.max(0, y), animated: true });
    }, 80);
    return () => clearTimeout(t);
  }, [view, sheetRec]);

  return (
    <View style={[styles.page, { paddingTop: insets.top }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <View style={styles.header}>
        <Pressable onPress={() => navigation.navigate('Main', { screen: 'Home' })} style={styles.headerBtn} accessibilityLabel="Home">
          <LineIcon name="home" size={20} color={brand.ink} />
        </Pressable>
        <View style={styles.flex1}>
          <Text style={styles.headerSmall}>Report</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {scan?.title ?? SAMPLE_REPORT_TITLE}
          </Text>
        </View>
        <Pressable onPress={() => notify('PDF export coming soon')} style={styles.headerBtn} accessibilityLabel="Export PDF">
          <LineIcon name="exportDown" size={20} color={brand.primary} />
        </Pressable>
      </View>

      <View style={styles.toggle}>
        {(
          [
            { key: 'report', label: 'Report' },
            { key: 'manuscript', label: 'Manuscript' },
          ] as const
        ).map((o) => (
          <Pressable key={o.key} onPress={() => setView(o.key)} style={[styles.toggleItem, view === o.key && styles.toggleOn]}>
            <Text style={[styles.toggleText, view === o.key && styles.toggleTextOn]}>{o.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Nothing below renders until we know whether this report is locked */}
      {loaded && view === 'report' && (
        <ScrollView
          ref={reportScroll}
          contentContainerStyle={[styles.reportScroll, !locked && { paddingBottom: 24 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={[brand.deep, brand.primary, brand.bright]}
            locations={[0, 0.7, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <CategoryRing score={overallScore(SCORE_CATEGORIES)} />
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>Overall coherence score</Text>
              <Text style={styles.heroSub}>Needs revision. Average of the four categories, rounded up.</Text>
            </View>
          </LinearGradient>

          <View style={styles.breakdownHead}>
            <Text style={styles.breakdownLabel}>BREAKDOWN OF YOUR TOTAL SCORE</Text>
            <Text style={styles.breakdownHint}>Tap a card</Text>
          </View>

          {/* The popover floats over what follows the grid; they share this parent so it stays tappable on Android */}
          <View onLayout={(e) => (breakdownY.current = e.nativeEvent.layout.y)}>
            <View style={styles.grid}>
              {[0, 2].map((start, row) => (
                <View
                  key={start}
                  style={styles.gridRow}
                  onLayout={(e) => {
                    const { y, height } = e.nativeEvent.layout;
                    setRowBottoms((prev) => prev.map((v, i) => (i === row ? y + height : v)));
                  }}
                >
                  {SCORE_CATEGORIES.slice(start, start + 2).map((c, i) => (
                    <CategoryCard
                      key={c.id}
                      category={c}
                      open={openCategory === start + i}
                      onPress={() => toggleCategory(start + i)}
                    />
                  ))}
                </View>
              ))}
            </View>

            <View style={styles.tabs}>
              {(
                [
                  { key: 'recs', label: 'Recommendations', count: recs.length },
                  { key: 'clear', label: 'All clear', count: ALL_CLEAR_LINKS.length },
                  { key: 'citations', label: 'Citations', count: CITATIONS.length },
                ] as const
              ).map((o) => (
                <Pressable key={o.key} onPress={() => setTab(o.key)} style={[styles.tab, tab === o.key && styles.toggleOn]}>
                  <Text style={[styles.tabText, tab === o.key && styles.toggleTextOn]} numberOfLines={1}>
                    {o.label} {o.count}
                  </Text>
                </Pressable>
              ))}
            </View>

            {tab === 'recs' && (
              <View style={styles.panel}>
                {recs.map((rec) => (
                  <RecommendationCard key={rec.id} rec={rec} onShow={() => showInManuscript(rec)} />
                ))}
              </View>
            )}

            {tab === 'clear' && (
              <View style={styles.panel}>
                {ALL_CLEAR_LINKS.map((l) => (
                  <View key={`${l.from}-${l.to}`} style={styles.clearRow}>
                    <Text style={styles.clearTitle}>
                      {l.from} <Text style={styles.clearArrow}>↔</Text> {l.to}
                    </Text>
                    <View style={styles.clearNote}>
                      <LineIcon name="checkCircle" size={15} color="#0F7A55" />
                      <Text style={styles.clearNoteText}>Minor vocabulary difference detected. No action needed.</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {tab === 'citations' && (
              <View style={styles.panel}>
                <Text style={styles.citeIntro}>Tap any status card to filter the list. Tap it again to clear.</Text>
                <View style={styles.citeStats}>
                  {[
                    { value: true, label: 'ACCESSIBLE (PUBLIC)' },
                    { value: false, label: 'INACCESSIBLE (PRIVATE)' },
                  ].map((o) => (
                    <Pressable
                      key={o.label}
                      onPress={() => setCitationFilter(citationFilter === o.value ? null : o.value)}
                      style={[styles.citeStat, citationFilter === o.value && styles.citeStatOn]}
                    >
                      <Text style={styles.citeStatLabel}>{o.label}</Text>
                      <Text style={styles.citeStatValue}>{CITATIONS.filter((c) => c.accessible === o.value).length}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.citeLegend}>
                  Accessible (Public) = anyone can open the source · Inaccessible (Private) = private, or needs permission or a login.
                </Text>
                {citations.map(({ c, number }) => (
                  <CitationCard key={number} citation={c} number={number} />
                ))}
                {locked && <Text style={styles.citeMore}>+ {CITATIONS.length - FREE_CITATIONS} more citations</Text>}
              </View>
            )}

            {openCategory !== null && (
              <CategoryPopover
                category={SCORE_CATEGORIES[openCategory]}
                top={GRID_TOP + rowBottoms[openCategory < 2 ? 0 : 1] + 6}
                arrowLeft={openCategory % 2 === 0 ? '22%' : '72%'}
                onClose={() => setOpenCategory(null)}
              />
            )}
          </View>
        </ScrollView>
      )}

      {loaded && view === 'report' && locked && (
        <LinearGradient colors={['#F1F0FF', '#E8E7FF']} style={[styles.unlockBar, { paddingBottom: 20 + insets.bottom }]}>
          <Text style={styles.unlockTitle}>{lockedCount} more recommendations in the full report</Text>
          <PressableScale onPress={unlockAction.onPress} style={styles.unlockBtn}>
            <LineIcon name="lock" size={18} color="#FFFFFF" />
            <Text style={styles.unlockBtnText}>{unlockAction.label}</Text>
          </PressableScale>
          <View style={styles.unlockHint}>
            <LineIcon name="coin" size={15} color={brand.sub} />
            <Text style={styles.unlockHintText}>{creditsLabel(credits)}</Text>
          </View>
        </LinearGradient>
      )}

      {loaded && view === 'manuscript' && (
        <ScrollView ref={manuscriptScroll} contentContainerStyle={{ paddingBottom: 24 + insets.bottom }} showsVerticalScrollIndicator={false}>
          <View style={styles.status}>
            <View style={styles.done}>
              <LineIcon name="check" size={14} color="#12703F" strokeWidth={2.4} />
              <Text style={styles.doneText}>Analysis complete</Text>
            </View>
            {locked ? (
              <Text style={styles.overall}>
                Free preview · <Text style={styles.overallBold}>{FREE_RECOMMENDATIONS} finding shown</Text> · Unlock to see all
              </Text>
            ) : (
              <Text style={styles.overall}>
                Overall assessment <Text style={styles.overallBold}>Needs revision coherence</Text> · {RECOMMENDATIONS.length} findings
                across 8 sections
              </Text>
            )}
            <View style={styles.tip}>
              <LineIcon name="tap" size={15} color={brand.hint} />
              <Text style={styles.tipText}>Tap a highlight to see the finding.</Text>
            </View>
          </View>

          <View style={styles.paper} onLayout={(e) => (paperY.current = e.nativeEvent.layout.y)}>
            {openBlocks.map((b, i) => (
              <View key={i} onLayout={(e) => (blockY.current[i] = e.nativeEvent.layout.y)}>
                {b.kind === 'text' ? (
                  <Paragraph text={b.text} activeId={sheetRec?.id} onPick={setSheetRec} />
                ) : (
                  <Text style={BLOCK_STYLE(b.kind)}>{b.text}</Text>
                )}
              </View>
            ))}

            {locked && (
              <View style={styles.lockWrap}>
                <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                  {MANUSCRIPT_BLOCKS.slice(FREE_MANUSCRIPT_BLOCKS).map((b, i) => (
                    <Text key={i} style={[BLOCK_STYLE(b.kind), styles.blurred]}>
                      {b.text}
                    </Text>
                  ))}
                </View>
                <View style={styles.lockCard}>
                  <LineIcon name="lock" size={22} color={brand.primary} />
                  <Text style={styles.lockTitle}>Unlock the full report to read every section and see all {lockedCount} more recommendations</Text>
                  <PressableScale onPress={unlockAction.onPress} style={styles.lockBtn}>
                    <Text style={styles.lockBtnText}>{unlockAction.label}</Text>
                  </PressableScale>
                  <Text style={styles.lockHint}>{creditsLabel(credits)}</Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      <BottomSheet inline visible={!!sheetRec} onClose={closeSheet}>
        {sheetRec && (
          <View style={styles.sheet}>
            <View style={styles.sheetTagRow}>
              <View style={styles.sheetTag}>
                <View style={styles.sheetDot} />
                <Text style={styles.sheetTagText}>
                  NEEDS ATTENTION · {sheetRec.from.toUpperCase()} ↔ {sheetRec.to.toUpperCase()}
                </Text>
              </View>
              <Pressable onPress={closeSheet} style={styles.sheetClose} accessibilityLabel="Close">
                <LineIcon name="close" size={16} color={brand.label} />
              </Pressable>
            </View>
            <Text style={styles.sheetTitle}>{sheetRec.title}</Text>
            <Text style={styles.sheetWhy}>{sheetRec.why}</Text>
            <View style={styles.fix}>
              <Text style={styles.fixLabel}>SUGGESTED FIX</Text>
              <Text style={styles.fixText}>
                {sheetRec.action} at the {sheetRec.where}.
              </Text>
              <View style={styles.fixQuote}>
                <Text style={styles.fixQuoteText}>{sheetRec.sentences}</Text>
              </View>
            </View>
            <PressableScale onPress={closeSheet} style={styles.gotIt}>
              <Text style={styles.gotItText}>Got it</Text>
            </PressableScale>
          </View>
        )}
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: brand.page,
  },
  flex1: {
    flex: 1,
    minWidth: 0,
  },
  reportScroll: {
    paddingBottom: 24,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: brand.line,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSmall: {
    fontFamily: fonts.sans[600],
    fontSize: 11.5,
    color: brand.hint,
  },
  headerTitle: {
    fontFamily: fonts.sans[700],
    fontSize: 14,
    color: brand.ink,
  },
  toggle: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 12,
    marginHorizontal: 16,
    padding: 4,
    borderRadius: 14,
    backgroundColor: '#EAE9F8',
  },
  toggleItem: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleOn: {
    backgroundColor: '#FFFFFF',
    shadowColor: brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  toggleText: {
    fontFamily: fonts.sans[700],
    fontSize: 13,
    color: brand.muted,
  },
  toggleTextOn: {
    color: brand.ink,
  },

  // Hero
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 16,
    marginHorizontal: 16,
    padding: 18,
    borderRadius: 24,
  },
  ring: {
    width: 108,
    height: 108,
  },
  ringCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringScore: {
    fontFamily: fonts.sans[800],
    fontSize: 32,
    lineHeight: 34,
    letterSpacing: -1,
    color: '#FFFFFF',
  },
  ringMax: {
    fontFamily: fonts.sans[700],
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  heroText: {
    flex: 1,
    minWidth: 0,
    gap: 7,
  },
  heroTitle: {
    fontFamily: fonts.sans[800],
    fontSize: 19,
    lineHeight: 23,
    letterSpacing: -0.38,
    color: '#FFFFFF',
  },
  heroSub: {
    fontFamily: fonts.sans[400],
    fontSize: 12.5,
    lineHeight: 19,
    color: '#D3D1F5',
  },

  // Breakdown
  breakdownHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 20,
    marginHorizontal: 16,
  },
  breakdownLabel: {
    flexShrink: 1,
    fontFamily: fonts.mono[400],
    fontSize: 11,
    letterSpacing: 1.54,
    color: brand.hint,
  },
  breakdownHint: {
    fontFamily: fonts.sans[600],
    fontSize: 11.5,
    color: brand.placeholder,
  },
  grid: {
    gap: 10,
    marginTop: GRID_TOP,
    marginHorizontal: 16,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  catCard: {
    flex: 1,
    minWidth: 0,
    gap: 5,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: brand.line,
    backgroundColor: '#FFFFFF',
  },
  catCardOpen: {
    borderColor: '#B9B6F2',
  },
  catLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  catLabel: {
    flex: 1,
    fontFamily: fonts.sans[600],
    fontSize: 12.5,
    color: brand.label,
  },
  catScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    marginTop: 2,
  },
  catScore: {
    fontFamily: fonts.sans[800],
    fontSize: 25,
    letterSpacing: -0.6,
    color: brand.ink,
  },
  catUnit: {
    fontFamily: fonts.sans[600],
    fontSize: 12,
    color: brand.hint,
  },
  catNa: {
    marginTop: 2,
    paddingVertical: 3,
    fontFamily: fonts.sans[800],
    fontSize: 20,
    letterSpacing: -0.4,
    color: brand.ink,
  },
  catCaption: {
    marginTop: 1,
    fontFamily: fonts.sans[600],
    fontSize: 11.5,
    color: brand.icon,
  },
  bar: {
    height: 6,
    borderRadius: 4,
    backgroundColor: brand.line,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Category popover
  pop: {
    position: 'absolute',
    left: 16,
    right: 16,
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CFCDF5',
    backgroundColor: '#FFFFFF',
    shadowColor: brand.ink,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
  },
  popArrow: {
    position: 'absolute',
    top: -7,
    width: 12,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: '#CFCDF5',
    transform: [{ rotate: '45deg' }],
  },
  popHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  popTitle: {
    flexShrink: 1,
    fontFamily: fonts.sans[800],
    fontSize: 15,
    color: brand.ink,
  },
  popScore: {
    fontFamily: fonts.sans[800],
    fontSize: 22,
    color: brand.ink,
  },
  popUnit: {
    fontFamily: fonts.sans[600],
    fontSize: 13,
    color: brand.hint,
  },
  popNa: {
    fontFamily: fonts.sans[800],
    fontSize: 15,
    color: brand.hint,
  },
  popDesc: {
    fontFamily: fonts.sans[400],
    fontSize: 13.5,
    lineHeight: 20,
    color: brand.sub,
  },
  popRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 4,
    marginBottom: 6,
  },
  popRowLabel: {
    flex: 1,
    fontFamily: fonts.sans[700],
    fontSize: 13,
    color: brand.ink,
  },
  popRowValue: {
    fontFamily: fonts.sans[700],
    fontSize: 13,
    color: brand.ink,
  },
  popNote: {
    marginTop: 4,
    fontFamily: fonts.sans[400],
    fontSize: 13,
    lineHeight: 19,
    color: brand.hint,
  },
  popClose: {
    marginTop: 6,
    height: 42,
    borderRadius: 14,
    backgroundColor: brand.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popCloseText: {
    fontFamily: fonts.sans[800],
    fontSize: 14,
    color: brand.primary,
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 20,
    marginHorizontal: 16,
    padding: 4,
    borderRadius: 14,
    backgroundColor: '#EAE9F8',
  },
  tab: {
    flexGrow: 1,
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabText: {
    fontFamily: fonts.sans[700],
    fontSize: 12.5,
    color: brand.muted,
  },
  panel: {
    gap: 10,
    marginTop: 14,
    marginHorizontal: 16,
  },

  // Recommendation
  recCard: {
    gap: 16,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: brand.line,
    backgroundColor: '#FFFFFF',
  },
  recTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  recTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: '#DDF7E8',
  },
  recTagText: {
    fontFamily: fonts.sans[800],
    fontSize: 12,
    color: '#12703F',
  },
  recCategory: {
    fontFamily: fonts.sans[600],
    fontSize: 12.5,
    color: brand.hint,
  },
  recTitle: {
    fontFamily: fonts.sans[800],
    fontSize: 19,
    lineHeight: 25,
    letterSpacing: -0.28,
    color: brand.ink,
  },
  recLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recChip: {
    flexShrink: 1,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: '#F1F0FF',
    overflow: 'hidden',
    fontFamily: fonts.sans[800],
    fontSize: 12,
    color: brand.primary,
  },
  weakLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  weakDash: {
    width: 10,
    height: 2,
    backgroundColor: '#E0A53C',
  },
  weakText: {
    fontFamily: fonts.sans[700],
    fontSize: 11,
    color: '#B7791F',
  },
  recWhy: {
    fontFamily: fonts.sans[400],
    fontSize: 14.5,
    lineHeight: 23,
    color: '#3C3A5C',
  },
  recDivider: {
    height: 1,
    backgroundColor: brand.softLine,
  },
  recStepsLabel: {
    fontFamily: fonts.sans[800],
    fontSize: 12,
    letterSpacing: 0.96,
    color: brand.hint,
  },
  recStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  recStepBody: {
    gap: 9,
  },
  recStepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: brand.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recStepNumText: {
    fontFamily: fonts.sans[800],
    fontSize: 13,
    color: brand.primary,
  },
  recStepText: {
    paddingTop: 3,
    fontFamily: fonts.sans[400],
    fontSize: 14.5,
    lineHeight: 22,
    color: brand.ink,
  },
  recStepBold: {
    fontFamily: fonts.sans[700],
  },
  recQuote: {
    paddingVertical: 13,
    paddingLeft: 17,
    paddingRight: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BFEBD3',
    backgroundColor: '#ECFBF3',
    overflow: 'hidden',
  },
  recQuoteBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 4,
    backgroundColor: '#10B981',
  },
  recQuoteText: {
    fontFamily: fonts.serif[400],
    fontSize: 15.5,
    lineHeight: 25,
    color: '#10311F',
  },
  recActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  recCopy: {
    flexGrow: 1,
    flexBasis: 130,
    height: 46,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: brand.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  recCopyText: {
    fontFamily: fonts.sans[800],
    fontSize: 14,
    color: '#FFFFFF',
  },
  recShow: {
    flexGrow: 1,
    flexBasis: 130,
    height: 46,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: brand.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  recShowText: {
    fontFamily: fonts.sans[800],
    fontSize: 14,
    color: brand.primary,
  },

  // All clear
  clearRow: {
    gap: 5,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BDEFD8',
    backgroundColor: '#E9FBF3',
  },
  clearTitle: {
    fontFamily: fonts.sans[600],
    fontSize: 14.5,
    lineHeight: 20,
    color: '#064E3B',
  },
  clearArrow: {
    fontFamily: fonts.sans[500],
    color: '#3B8F70',
  },
  clearNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  clearNoteText: {
    flex: 1,
    fontFamily: fonts.sans[500],
    fontSize: 13,
    color: '#0F7A55',
  },

  // Citations
  citeIntro: {
    fontFamily: fonts.sans[400],
    fontSize: 13,
    lineHeight: 20,
    color: brand.sub,
  },
  citeStats: {
    flexDirection: 'row',
    gap: 10,
  },
  citeStat: {
    flex: 1,
    minWidth: 0,
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0DEF5',
    backgroundColor: '#FFFFFF',
  },
  citeStatOn: {
    borderColor: brand.primary,
    backgroundColor: '#F6F5FF',
  },
  citeStatLabel: {
    fontFamily: fonts.mono[400],
    fontSize: 10.5,
    letterSpacing: 0.84,
    color: brand.label,
  },
  citeStatValue: {
    fontFamily: fonts.sans[800],
    fontSize: 26,
    lineHeight: 28,
    color: brand.ink,
  },
  citeLegend: {
    fontFamily: fonts.sans[400],
    fontSize: 12.5,
    lineHeight: 19,
    color: brand.hint,
  },
  citation: {
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#A7F0CE',
    backgroundColor: '#E9FBF3',
  },
  citationPrivate: {
    borderColor: brand.dangerBorder,
    backgroundColor: '#FFF4F6',
  },
  citationBody: {
    flexDirection: 'row',
    gap: 12,
  },
  citationNum: {
    minWidth: 10,
    paddingTop: 2,
    fontFamily: fonts.sans[700],
    fontSize: 11,
    color: brand.label,
  },
  citationText: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.sans[400],
    fontSize: 13.5,
    lineHeight: 22,
    color: '#1B1A47',
  },
  citationUrl: {
    color: brand.bright,
  },
  citationPill: {
    alignSelf: 'flex-end',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#C9F5E0',
    fontFamily: fonts.sans[700],
    fontSize: 11,
    color: '#0F7A55',
  },
  citationPillPrivate: {
    backgroundColor: '#FBDDE4',
    color: brand.danger,
  },
  citeMore: {
    paddingVertical: 4,
    fontFamily: fonts.sans[400],
    fontSize: 12.5,
    color: brand.hint,
    textAlign: 'center',
  },

  // Unlock bar
  unlockBar: {
    gap: 9,
    paddingTop: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: brand.border,
  },
  unlockTitle: {
    fontFamily: fonts.sans[700],
    fontSize: 14,
    color: brand.ink,
  },
  unlockBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: brand.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    shadowColor: brand.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
  },
  unlockBtnText: {
    fontFamily: fonts.sans[800],
    fontSize: 15,
    color: '#FFFFFF',
  },
  unlockHint: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unlockHintText: {
    fontFamily: fonts.sans[400],
    fontSize: 12.5,
    color: brand.sub,
  },

  // Manuscript
  status: {
    gap: 7,
    marginTop: 14,
    marginHorizontal: 16,
  },
  done: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#DDF7E8',
  },
  doneText: {
    fontFamily: fonts.sans[800],
    fontSize: 12.5,
    color: '#12703F',
  },
  overall: {
    fontFamily: fonts.sans[400],
    fontSize: 13,
    lineHeight: 20,
    color: brand.label,
  },
  overallBold: {
    fontFamily: fonts.sans[800],
    color: brand.ink,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipText: {
    fontFamily: fonts.sans[600],
    fontSize: 12.5,
    color: brand.hint,
  },
  paper: {
    marginTop: 12,
    marginHorizontal: 16,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 18,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: brand.line,
    backgroundColor: '#FFFFFF',
  },
  paperChapter: {
    marginBottom: 12,
    fontFamily: fonts.serif[700],
    fontSize: 12,
    letterSpacing: 1.2,
    color: brand.label,
  },
  paperHeading: {
    marginTop: 14,
    marginBottom: 8,
    fontFamily: fonts.serif[700],
    fontSize: 15,
    color: '#1B1A47',
  },
  paperText: {
    marginBottom: 10,
    fontFamily: fonts.serif[400],
    fontSize: 14.5,
    lineHeight: 25,
    color: '#1B1A47',
    textAlign: 'justify',
  },
  highlight: {
    backgroundColor: '#FFE8A3',
    // Android ignores textDecorationColor and would draw a black line
    ...Platform.select({ ios: { textDecorationLine: 'underline' as const, textDecorationColor: '#E0A53C' } }),
  },
  highlightActive: {
    backgroundColor: '#FFD86B',
  },
  lockWrap: {
    marginTop: 6,
  },
  // RN has no text blur, so the glyphs go near-invisible and only a soft shadow of them shows
  blurred: {
    color: 'rgba(27,26,71,0.02)',
    textShadowColor: 'rgba(27,26,71,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  lockCard: {
    position: 'absolute',
    top: 36,
    left: '4%',
    right: '4%',
    alignItems: 'center',
    gap: 10,
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: brand.line,
    backgroundColor: '#FFFFFF',
    shadowColor: brand.ink,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  lockTitle: {
    fontFamily: fonts.sans[800],
    fontSize: 14,
    lineHeight: 20,
    color: brand.ink,
    textAlign: 'center',
  },
  lockBtn: {
    alignSelf: 'stretch',
    height: 46,
    borderRadius: 12,
    backgroundColor: brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBtnText: {
    fontFamily: fonts.sans[800],
    fontSize: 14.5,
    color: '#FFFFFF',
  },
  lockHint: {
    fontFamily: fonts.sans[600],
    fontSize: 12.5,
    color: brand.hint,
  },

  // Finding sheet
  sheet: {
    gap: 10,
  },
  sheetTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sheetTag: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F5A524',
  },
  sheetTagText: {
    flex: 1,
    fontFamily: fonts.mono[500],
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.44,
    color: '#B7791F',
  },
  sheetClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F0FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    marginTop: 2,
    fontFamily: fonts.sans[800],
    fontSize: 21,
    lineHeight: 26,
    letterSpacing: -0.32,
    color: brand.ink,
  },
  sheetWhy: {
    fontFamily: fonts.sans[400],
    fontSize: 14.5,
    lineHeight: 22,
    color: brand.label,
  },
  fix: {
    paddingVertical: 13,
    paddingHorizontal: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: brand.tint,
  },
  fixLabel: {
    marginBottom: 6,
    fontFamily: fonts.mono[500],
    fontSize: 10.5,
    letterSpacing: 1.05,
    color: brand.primary,
  },
  fixText: {
    fontFamily: fonts.sans[400],
    fontSize: 14.5,
    lineHeight: 22,
    color: '#1B1A47',
  },
  fixQuote: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFEBD3',
    backgroundColor: '#ECFBF3',
  },
  fixQuoteText: {
    fontFamily: fonts.serif[400],
    fontSize: 14.5,
    lineHeight: 22,
    color: '#10311F',
  },
  gotIt: {
    marginTop: 4,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#1F2DB8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gotItText: {
    fontFamily: fonts.sans[800],
    fontSize: 15.5,
    color: '#FFFFFF',
  },
});
