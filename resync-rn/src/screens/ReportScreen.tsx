import React, { useState, useRef } from 'react';
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
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors, fonts } from '../theme/colors';
import { ScoreRing } from '../components/ScoreRing';
import { Segmented } from '../components/Segmented';
import { UnderlineTabs } from '../components/UnderlineTabs';
import { BottomSheet } from '../components/BottomSheet';
import { Button } from '../components/Button';
import { Divider } from '../components/Divider';
import {
  Finding,
  SAMPLE_FINDINGS,
  HEAVY_ATTENTION_FINDINGS,
  HEAVY_ALIGNED_FINDINGS,
  HEAVY_RECOMMENDATIONS,
  LIGHT_RECOMMENDATIONS,
  SECTIONS_SCORES,
} from '../data/report';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<RootStackParamList, 'Report'>;

export const ReportScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const isHeavy = route.params?.heavy ?? false;

  const [activeTab, setActiveTab] = useState<'Manuscript' | 'Assessment' | 'Analysis'>(
    isHeavy ? 'Analysis' : 'Manuscript'
  );
  const scrollRef = useRef<ScrollView>(null);

  // Finding Bottom Sheet state
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);

  // Assessment tab states
  const [assessmentFilter, setAssessmentFilter] = useState<'All' | 'Strengths' | 'Issues'>('All');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('s1');

  // Analysis sub-tab
  const [analysisSubTab, setAnalysisSubTab] = useState<'synthesis' | 'recs'>('synthesis');
  const [showAllAttention, setShowAllAttention] = useState(false);
  const [alignedExpanded, setAlignedExpanded] = useState(false);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as any);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const handleExportPdf = () => {
    if (Platform.OS === 'android') {
      ToastAndroid.show('PDF export coming soon', ToastAndroid.SHORT);
    } else {
      Alert.alert('Notice', 'PDF export coming soon');
    }
  };

  const openFindingById = (id: string) => {
    const f =
      SAMPLE_FINDINGS[id] ||
      HEAVY_ATTENTION_FINDINGS.find((x) => x.id === id) ||
      HEAVY_ALIGNED_FINDINGS.find((x) => x.id === id);
    if (f) setSelectedFinding(f);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <MaterialIcons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>

        <View style={styles.topBarTitleCol}>
          <Text style={styles.scansCaption}>Scans</Text>
          <Text style={styles.docTitle} numberOfLines={1}>
            Predictors of Academic Burnout
          </Text>
        </View>

        <Pressable
          onPress={handleExportPdf}
          style={styles.downloadBtn}
        >
          <MaterialIcons name="file-download" size={20} color={colors.body} />
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Score Card */}
        <View style={styles.scoreCard}>
          <ScoreRing score={74} />
          <View style={styles.scoreInfoCol}>
            <Text style={styles.scoreEyebrow}>COHERENCE SCORE</Text>
            <View style={styles.scoreLevelRow}>
              <View style={styles.amberDot} />
              <Text style={styles.scoreLevelText}>Moderate</Text>
            </View>
            <Text style={styles.scoreDesc}>Three gaps need attention.</Text>
          </View>
        </View>

        {/* Segmented Navigation */}
        <Segmented
          items={[
            { id: 'Manuscript', label: 'Manuscript' },
            { id: 'Assessment', label: 'Assessment', count: 10 },
            { id: 'Analysis', label: 'Analysis' },
          ]}
          selectedId={activeTab}
          onSelect={handleTabChange}
          style={styles.mainSegmented}
        />

        {/* TAB 1: MANUSCRIPT */}
        {activeTab === 'Manuscript' && (
          <View style={styles.manuscriptContainer}>
            <View style={styles.previewMetaRow}>
              <View style={styles.metaLeft}>
                <MaterialIcons name="description" size={16} color={colors.muted} />
                <Text style={styles.previewLabel}>Manuscript preview</Text>
              </View>
              <Text style={styles.pageLabel}>Page 1 of 12</Text>
            </View>

            <Text style={styles.eyebrowPrimary}>SAMPLE MANUSCRIPT REPORT</Text>
            <Text style={styles.serifDocTitle}>
              Predictors of Academic Burnout Among STEM Undergraduates in Philippine
              Universities
            </Text>
            <Text style={styles.serifSubTitle}>
              A descriptive-correlational study · Academic Year 2023–2024
            </Text>

            <Divider marginVertical={4} />

            <View style={styles.pillComplete}>
              <MaterialIcons name="check" size={14} color="#047857" />
              <Text style={styles.pillCompleteText}>Analysis complete</Text>
            </View>

            <Text style={styles.assessmentLine}>
              Overall assessment{' '}
              <Text style={styles.assessmentHighlight}>Moderate coherence</Text> · 10
              findings across 5 sections
            </Text>

            <View style={styles.hintRow}>
              <MaterialIcons name="touch-app" size={15} color={colors.hint} />
              <Text style={styles.hintText}>
                Tap a highlight to see the finding.
              </Text>
            </View>

            {/* ABSTRACT */}
            <Text style={styles.serifHeading}>Abstract</Text>

            {/* P1 */}
            <Text style={styles.serifParagraph}>
              This study examines the relationship between{' '}
              <Text
                onPress={() => setSelectedFinding(SAMPLE_FINDINGS.f1)}
                style={[
                  styles.highlightedText,
                  selectedFinding?.id === 'f1' && styles.highlightedActive,
                ]}
              >
                academic workload, social support, and burnout
              </Text>{' '}
              among undergraduate STEM students. A descriptive-correlational
              design was used to identify the predictors most closely associated
              with academic burnout.
            </Text>

            {/* P2 */}
            <Text style={styles.serifParagraph}>
              Results indicate that{' '}
              <Text
                onPress={() => setSelectedFinding(SAMPLE_FINDINGS.f2)}
                style={[
                  styles.highlightedText,
                  selectedFinding?.id === 'f2' && styles.highlightedActive,
                ]}
              >
                sustained workload and limited recovery time are significant
                predictors
              </Text>
              . The findings emphasize the need for institutional support
              strategies that address both academic demands and student
              well-being.
            </Text>

            {/* CONCLUSION */}
            <Text style={styles.serifHeading}>Conclusion</Text>

            {/* P3 */}
            <Text style={styles.serifParagraph}>
              The findings show that workload and recovery time shape burnout.
              Therefore,{' '}
              <Text
                onPress={() => setSelectedFinding(SAMPLE_FINDINGS.f3)}
                style={[
                  styles.highlightedText,
                  selectedFinding?.id === 'f3' && styles.highlightedActive,
                ]}
              >
                all STEM programs should adopt the same institution-wide support
                model
              </Text>
              .
            </Text>
          </View>
        )}

        {/* TAB 2: ASSESSMENT */}
        {activeTab === 'Assessment' && (
          <View style={styles.assessmentContainer}>
            <View style={styles.assessmentHeader}>
              <View>
                <Text style={styles.eyebrowMuted}>MANUSCRIPT MAP</Text>
                <Text style={styles.h3}>Assessment</Text>
              </View>
              <View style={styles.countPill}>
                <Text style={styles.countPillText}>10</Text>
              </View>
            </View>

            {/* Segmented Filter */}
            <Segmented
              items={[
                { id: 'All', label: 'All' },
                { id: 'Strengths', label: 'Strengths' },
                { id: 'Issues', label: 'Issues' },
              ]}
              selectedId={assessmentFilter}
              onSelect={(id) => setAssessmentFilter(id as any)}
            />

            {/* Assessment Rows */}
            <View style={styles.statusRowsBox}>
              {(assessmentFilter === 'All') && (
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={styles.statusLabel}>Overall status</Text>
                  <Text style={styles.statusCount}>1</Text>
                </View>
              )}

              {(assessmentFilter === 'All' || assessmentFilter === 'Strengths') && (
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.statusLabel}>Key strengths</Text>
                  <Text style={styles.statusCount}>3</Text>
                </View>
              )}

              {(assessmentFilter === 'All' || assessmentFilter === 'Issues') && (
                <>
                  <View style={styles.statusRow}>
                    <View style={[styles.statusDot, { backgroundColor: '#F43F5E' }]} />
                    <Text style={styles.statusLabel}>Major issues</Text>
                    <Text style={styles.statusCount}>3</Text>
                  </View>
                  <View style={styles.statusRow}>
                    <View style={[styles.statusDot, { backgroundColor: '#1D4ED8' }]} />
                    <Text style={styles.statusLabel}>Affected sections</Text>
                    <Text style={styles.statusCount}>3</Text>
                  </View>
                </>
              )}
            </View>

            {/* SECTIONS */}
            <Text style={styles.eyebrowMuted}>SECTIONS</Text>

            <View style={styles.sectionsList}>
              {SECTIONS_SCORES.map((sec) => {
                const isSelected = selectedSectionId === sec.id;
                const barFillColor =
                  sec.score >= 80 ? '#10B981' : sec.score >= 70 ? '#F59E0B' : '#F97316';

                return (
                  <Pressable
                    key={sec.id}
                    onPress={() => setSelectedSectionId(sec.id)}
                    style={[
                      styles.sectionScoreRow,
                      isSelected && styles.sectionScoreRowSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.sectionScoreLabel,
                        isSelected && styles.sectionScoreLabelSelected,
                      ]}
                    >
                      {sec.label}
                    </Text>

                    {/* Progress bar 54x4 */}
                    <View style={styles.sectionProgressBar}>
                      <View
                        style={[
                          styles.sectionProgressFill,
                          {
                            width: `${sec.score}%`,
                            backgroundColor: barFillColor,
                          },
                        ]}
                      />
                    </View>

                    <Text
                      style={[
                        styles.sectionScoreVal,
                        isSelected && { color: '#D97706' },
                      ]}
                    >
                      {sec.score}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* TAB 3: ANALYSIS */}
        {activeTab === 'Analysis' && (
          <View style={styles.analysisContainer}>
            <View style={styles.analysisHeader}>
              <View style={styles.analysisIconTile}>
                <MaterialIcons name="auto-awesome" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.eyebrowPrimary}>ANALYSIS</Text>
                <Text style={styles.h3}>Coherence analysis</Text>
              </View>
            </View>

            <UnderlineTabs
              items={[
                { id: 'synthesis', label: 'AI synthesis' },
                {
                  id: 'recs',
                  label: 'Recommendations',
                  count: isHeavy ? 8 : 3,
                },
              ]}
              selectedId={analysisSubTab}
              onSelect={(id) => setAnalysisSubTab(id as any)}
              activeColor={colors.primary}
            />

            {/* SUB-TAB 1: AI SYNTHESIS */}
            {analysisSubTab === 'synthesis' && (
              <View style={styles.synthesisContent}>
                {!isHeavy ? (
                  // LIGHT AI SYNTHESIS
                  <>
                    <Text style={styles.synthesisSummaryTitle}>Summary</Text>
                    <Text style={styles.synthesisSummaryBody}>
                      Most sections align. Link the objectives and conclusions more
                      clearly.
                    </Text>

                    <View style={styles.cardsRow}>
                      {/* Green Card */}
                      <View style={styles.alignmentCardGreen}>
                        <View style={styles.cardTagRow}>
                          <MaterialIcons name="check" size={14} color="#059669" />
                          <Text style={styles.cardTagTextGreen}>
                            STRONGEST ALIGNMENT
                          </Text>
                        </View>
                        <Text style={styles.cardTitle}>
                          Methodology ↔ Findings
                        </Text>
                        <Text style={styles.cardDesc}>
                          Results follow the research design.
                        </Text>
                      </View>

                      {/* Amber Card */}
                      <View style={styles.alignmentCardAmber}>
                        <View style={styles.cardTagRow}>
                          <MaterialIcons name="adjust" size={14} color="#D97706" />
                          <Text style={styles.cardTagTextAmber}>
                            NEEDS ATTENTION
                          </Text>
                        </View>
                        <Text style={styles.cardTitle}>
                          Objectives ↔ Conclusion
                        </Text>
                        <Text style={styles.cardDesc}>
                          Two conclusions exceed the objectives.
                        </Text>
                      </View>
                    </View>

                    <Divider marginVertical={8} />

                    {/* Rec row */}
                    <View style={styles.lightRecRow}>
                      <View style={styles.numTile}>
                        <Text style={styles.numTileText}>01</Text>
                      </View>
                      <View style={styles.lightRecInfo}>
                        <Text style={styles.lightRecTitle}>
                          Revise the conclusion
                        </Text>
                        <Text style={styles.lightRecDesc}>
                          Match each claim to an objective and result.
                        </Text>
                      </View>
                      <Pressable onPress={() => openFindingById('f3')}>
                        <Text style={styles.viewFindingLink}>View finding</Text>
                      </Pressable>
                    </View>
                  </>
                ) : (
                  // HEAVY AI SYNTHESIS
                  <>
                    <Text style={styles.synthesisSummaryBody}>
                      The core argument holds, but several chapters drift from the
                      objectives. Fix the five links below before your defense.
                    </Text>

                    {/* Two Stat Chips */}
                    <View style={styles.statChipsRow}>
                      <View style={styles.statChipAmber}>
                        <MaterialIcons name="adjust" size={18} color="#D97706" />
                        <View>
                          <Text style={styles.statChipBigNum}>5</Text>
                          <Text style={styles.statChipLabel}>Need attention</Text>
                        </View>
                      </View>

                      <View style={styles.statChipGreen}>
                        <MaterialIcons name="check" size={18} color="#059669" />
                        <View>
                          <Text style={styles.statChipBigNum}>4</Text>
                          <Text style={styles.statChipLabel}>Aligned well</Text>
                        </View>
                      </View>
                    </View>

                    {/* Needs Attention List */}
                    <Text style={styles.eyebrowMuted}>NEEDS ATTENTION · 5</Text>
                    <View style={styles.findingsList}>
                      {HEAVY_ATTENTION_FINDINGS.slice(
                        0,
                        showAllAttention ? 5 : 3
                      ).map((item) => (
                        <Pressable
                          key={item.id}
                          onPress={() => setSelectedFinding(item)}
                          style={styles.findingRow}
                        >
                          <View
                            style={[
                              styles.findingDot,
                              { backgroundColor: item.color },
                            ]}
                          />
                          <View style={styles.findingTitleCol}>
                            <Text style={styles.findingLink}>{item.link}</Text>
                            <Text style={styles.findingItemTitle} numberOfLines={1}>
                              {item.title}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.severityPill,
                              item.severity === 'High'
                                ? styles.sevHigh
                                : styles.sevMed,
                            ]}
                          >
                            <Text
                              style={[
                                styles.severityText,
                                item.severity === 'High'
                                  ? { color: '#BE123C' }
                                  : { color: '#D97706' },
                              ]}
                            >
                              {item.severity}
                            </Text>
                          </View>
                          <MaterialIcons
                            name="keyboard-arrow-right"
                            size={18}
                            color={colors.hint}
                          />
                        </Pressable>
                      ))}

                      <Button
                        title={showAllAttention ? 'Show less' : 'Show 2 more'}
                        variant="outline"
                        size="sm"
                        onPress={() => setShowAllAttention(!showAllAttention)}
                        style={styles.showMoreBtn}
                      />
                    </View>

                    {/* Collapsible Aligned Well Box */}
                    <View style={styles.alignedBox}>
                      <Pressable
                        onPress={() => setAlignedExpanded(!alignedExpanded)}
                        style={styles.alignedHeader}
                      >
                        <MaterialIcons
                          name="check-circle"
                          size={18}
                          color="#10B981"
                        />
                        <Text style={styles.alignedHeaderText}>
                          4 links look good
                        </Text>
                        <MaterialIcons
                          name={
                            alignedExpanded ? 'expand-less' : 'keyboard-arrow-down'
                          }
                          size={20}
                          color={colors.hint}
                        />
                      </Pressable>

                      {alignedExpanded && (
                        <View style={styles.alignedList}>
                          {HEAVY_ALIGNED_FINDINGS.map((a) => (
                            <View key={a.id} style={styles.alignedItemRow}>
                              <Text style={styles.alignedLinkText}>{a.link}</Text>
                              <Text style={styles.alignedTitleText}>{a.title}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>

                    <Divider marginVertical={10} />

                    {/* Top recommendations header */}
                    <View style={styles.topRecsHeader}>
                      <Text style={styles.topRecsTitle}>Top recommendations</Text>
                      <Pressable onPress={() => setAnalysisSubTab('recs')}>
                        <Text style={styles.seeAllLink}>See all 8</Text>
                      </Pressable>
                    </View>

                    {/* First 3 recs */}
                    {HEAVY_RECOMMENDATIONS.slice(0, 3).map((r) => (
                      <View key={r.id} style={styles.lightRecRow}>
                        <View style={styles.numTile}>
                          <Text style={styles.numTileText}>{r.number}</Text>
                        </View>
                        <View style={styles.lightRecInfo}>
                          <Text style={styles.lightRecTitle}>{r.title}</Text>
                          <Text style={styles.lightRecDesc}>{r.desc}</Text>
                        </View>
                      </View>
                    ))}
                  </>
                )}
              </View>
            )}

            {/* SUB-TAB 2: RECOMMENDATIONS */}
            {analysisSubTab === 'recs' && (
              <View style={styles.recsContent}>
                {(isHeavy ? HEAVY_RECOMMENDATIONS : LIGHT_RECOMMENDATIONS).map(
                  (rec) => (
                    <View key={rec.id} style={styles.recItemBox}>
                      <View style={styles.numTile}>
                        <Text style={styles.numTileText}>{rec.number}</Text>
                      </View>
                      <View style={styles.recDetailsCol}>
                        <Text style={styles.recTitle}>{rec.title}</Text>
                        <Text style={styles.recDesc}>{rec.desc}</Text>
                        {rec.findingId && (
                          <Pressable
                            onPress={() => openFindingById(rec.findingId!)}
                            style={{ marginTop: 4 }}
                          >
                            <Text style={styles.viewFindingLink}>
                              View finding
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  )
                )}
              </View>
            )}

            {/* Footer AI Note */}
            <View style={styles.footerAiNote}>
              <MaterialIcons name="auto-awesome" size={13} color={colors.hint} />
              <Text style={styles.footerAiText}>
                AI guidance · Review before applying
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Report Footer */}
      <View
        style={[
          styles.reportFooter,
          { paddingBottom: Math.max(insets.bottom, 24) },
        ]}
      >
        <Button
          title="Export PDF"
          variant="outline"
          icon="file-download"
          onPress={handleExportPdf}
          style={{ flex: 1 }}
        />
        <Button
          title="New scan"
          variant="primary"
          icon="add"
          onPress={() => {
            navigation.navigate('Main', { screen: 'Upload' } as any);
          }}
          style={{ flex: 1 }}
        />
      </View>

      {/* FINDING BOTTOM SHEET */}
      <BottomSheet
        visible={!!selectedFinding}
        onClose={() => setSelectedFinding(null)}
      >
        {selectedFinding && (
          <View style={styles.sheetInner}>
            {/* Header row */}
            <View style={styles.sheetHeaderRow}>
              <View style={styles.sheetKindRow}>
                <View
                  style={[
                    styles.sheetDot,
                    { backgroundColor: selectedFinding.color },
                  ]}
                />
                <Text
                  style={[
                    styles.sheetKindText,
                    { color: selectedFinding.color },
                  ]}
                >
                  {selectedFinding.kind} · {selectedFinding.link}
                </Text>
              </View>
              <Pressable
                onPress={() => setSelectedFinding(null)}
                style={styles.sheetCloseBtn}
              >
                <MaterialIcons name="close" size={17} color={colors.ink} />
              </Pressable>
            </View>

            {/* Title & Desc */}
            <Text style={styles.sheetTitle}>{selectedFinding.title}</Text>
            <Text style={styles.sheetDesc}>{selectedFinding.description}</Text>

            {/* Fix Box */}
            <View style={styles.fixBox}>
              <Text style={styles.fixLabel}>SUGGESTED FIX</Text>
              <Text style={styles.fixText}>{selectedFinding.fix}</Text>
            </View>

            <Button
              title="Got it"
              variant="primary"
              size="sm"
              onPress={() => setSelectedFinding(null)}
              style={{ marginTop: 8 }}
            />
          </View>
        )}
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  topBarTitleCol: {
    flex: 1,
  },
  scansCaption: {
    fontFamily: fonts.sans[400],
    fontSize: 11.5,
    color: colors.hint,
  },
  docTitle: {
    fontFamily: fonts.sans[600],
    fontSize: 14.5,
    color: colors.ink,
  },
  downloadBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    backgroundColor: colors.white,
  },
  scoreInfoCol: {
    flex: 1,
    gap: 4,
  },
  scoreEyebrow: {
    fontFamily: fonts.sans[700],
    fontSize: 10.5,
    color: colors.muted,
    letterSpacing: 1.1,
  },
  scoreLevelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amberDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.warning,
  },
  scoreLevelText: {
    fontFamily: fonts.sans[700],
    fontSize: 18,
    color: colors.ink,
  },
  scoreDesc: {
    fontFamily: fonts.sans[400],
    fontSize: 13,
    color: colors.muted,
  },
  mainSegmented: {
    marginTop: 14,
  },
  // Manuscript tab
  manuscriptContainer: {
    paddingTop: 22,
    paddingHorizontal: 6,
    paddingBottom: 28,
    gap: 14,
  },
  previewMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewLabel: {
    fontFamily: fonts.sans[600],
    fontSize: 12.5,
    color: colors.body,
  },
  pageLabel: {
    fontFamily: fonts.sans[400],
    fontSize: 11.5,
    color: colors.hint,
  },
  eyebrowPrimary: {
    fontFamily: fonts.mono[500],
    fontSize: 11,
    color: colors.primary,
    letterSpacing: 1.2,
  },
  serifDocTitle: {
    fontFamily: fonts.serif[700],
    fontSize: 26,
    lineHeight: 31,
    color: colors.ink,
  },
  serifSubTitle: {
    fontFamily: fonts.serif[400],
    fontSize: 14,
    color: colors.muted,
  },
  pillComplete: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillCompleteText: {
    fontFamily: fonts.sans[700],
    fontSize: 12,
    color: '#047857',
  },
  assessmentLine: {
    fontFamily: fonts.sans[400],
    fontSize: 12.5,
    color: colors.muted,
  },
  assessmentHighlight: {
    fontFamily: fonts.sans[700],
    color: '#D97706',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hintText: {
    fontFamily: fonts.sans[400],
    fontSize: 12,
    color: colors.hint,
  },
  serifHeading: {
    fontFamily: fonts.serif[700],
    fontSize: 20,
    color: colors.ink,
    marginTop: 10,
  },
  serifParagraph: {
    fontFamily: fonts.serif[400],
    fontSize: 15.5,
    lineHeight: 27,
    color: colors.body,
  },
  highlightedText: {
    backgroundColor: '#FEF7E0',
    textDecorationLine: 'underline',
    textDecorationColor: '#F5C04A',
  },
  highlightedActive: {
    backgroundColor: '#FDECB5',
  },
  // Assessment tab
  assessmentContainer: {
    paddingTop: 22,
    paddingBottom: 28,
    gap: 18,
  },
  assessmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eyebrowMuted: {
    fontFamily: fonts.sans[700],
    fontSize: 10.5,
    color: colors.muted,
    letterSpacing: 1.1,
  },
  h3: {
    fontFamily: fonts.sans[700],
    fontSize: 18,
    color: colors.ink,
    marginTop: 2,
  },
  countPill: {
    backgroundColor: colors.track,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  countPillText: {
    fontFamily: fonts.sans[600],
    fontSize: 12,
    color: colors.ink,
  },
  statusRowsBox: {
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  statusLabel: {
    flex: 1,
    fontFamily: fonts.sans[400],
    fontSize: 14,
    color: colors.body,
  },
  statusCount: {
    fontFamily: fonts.sans[700],
    fontSize: 14,
    color: colors.ink,
  },
  sectionsList: {
    gap: 4,
  },
  sectionScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 12,
  },
  sectionScoreRowSelected: {
    backgroundColor: colors.primaryTint,
  },
  sectionScoreLabel: {
    flex: 1,
    fontFamily: fonts.sans[400],
    fontSize: 14,
    color: colors.body,
  },
  sectionScoreLabelSelected: {
    fontFamily: fonts.sans[700],
    color: colors.ink,
  },
  sectionProgressBar: {
    width: 54,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.track,
    overflow: 'hidden',
  },
  sectionProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  sectionScoreVal: {
    fontFamily: fonts.sans[700],
    fontSize: 13,
    color: colors.ink,
    width: 24,
    textAlign: 'right',
  },
  // Analysis tab
  analysisContainer: {
    paddingTop: 22,
    paddingBottom: 28,
    gap: 16,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  analysisIconTile: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  synthesisContent: {
    paddingTop: 12,
    gap: 14,
  },
  synthesisSummaryTitle: {
    fontFamily: fonts.sans[700],
    fontSize: 15,
    color: colors.ink,
  },
  synthesisSummaryBody: {
    fontFamily: fonts.sans[400],
    fontSize: 14,
    lineHeight: 21,
    color: colors.body,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  alignmentCardGreen: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#F6FDF9',
    borderWidth: 1,
    borderColor: '#D7F3E5',
    gap: 6,
  },
  alignmentCardAmber: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFBF0',
    borderWidth: 1,
    borderColor: '#F7E8C4',
    gap: 6,
  },
  cardTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardTagTextGreen: {
    fontFamily: fonts.sans[700],
    fontSize: 9.5,
    color: colors.muted,
  },
  cardTagTextAmber: {
    fontFamily: fonts.sans[700],
    fontSize: 9.5,
    color: colors.muted,
  },
  cardTitle: {
    fontFamily: fonts.sans[700],
    fontSize: 13,
    color: colors.ink,
  },
  cardDesc: {
    fontFamily: fonts.sans[400],
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.muted,
  },
  lightRecRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  numTile: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numTileText: {
    fontFamily: fonts.sans[700],
    fontSize: 11,
    color: colors.primary,
  },
  lightRecInfo: {
    flex: 1,
  },
  lightRecTitle: {
    fontFamily: fonts.sans[700],
    fontSize: 14,
    color: colors.ink,
  },
  lightRecDesc: {
    fontFamily: fonts.sans[400],
    fontSize: 13,
    color: colors.muted,
  },
  viewFindingLink: {
    fontFamily: fonts.sans[700],
    fontSize: 12.5,
    color: colors.primary,
  },
  // Heavy styles
  statChipsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statChipAmber: {
    flex: 1,
    backgroundColor: '#FFFBF0',
    borderWidth: 1,
    borderColor: '#F7E8C4',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statChipGreen: {
    flex: 1,
    backgroundColor: '#F6FDF9',
    borderWidth: 1,
    borderColor: '#D7F3E5',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statChipBigNum: {
    fontFamily: fonts.display[700],
    fontSize: 24,
    color: colors.ink,
  },
  statChipLabel: {
    fontFamily: fonts.sans[600],
    fontSize: 12,
    color: colors.muted,
  },
  findingsList: {
    gap: 8,
  },
  findingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  findingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  findingTitleCol: {
    flex: 1,
    gap: 2,
  },
  findingLink: {
    fontFamily: fonts.sans[600],
    fontSize: 11.5,
    color: colors.muted,
  },
  findingItemTitle: {
    fontFamily: fonts.sans[600],
    fontSize: 14,
    color: colors.ink,
  },
  severityPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sevHigh: {
    backgroundColor: '#FFF1F3',
  },
  sevMed: {
    backgroundColor: '#FFF8EB',
  },
  severityText: {
    fontFamily: fonts.sans[700],
    fontSize: 10.5,
  },
  showMoreBtn: {
    marginTop: 6,
    height: 38,
  },
  alignedBox: {
    backgroundColor: '#F6FDF9',
    borderWidth: 1,
    borderColor: '#D7F3E5',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  alignedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alignedHeaderText: {
    flex: 1,
    fontFamily: fonts.sans[700],
    fontSize: 13.5,
    color: '#059669',
    marginLeft: 8,
  },
  alignedList: {
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#D7F3E5',
  },
  alignedItemRow: {
    gap: 2,
  },
  alignedLinkText: {
    fontFamily: fonts.sans[600],
    fontSize: 11.5,
    color: colors.muted,
  },
  alignedTitleText: {
    fontFamily: fonts.sans[400],
    fontSize: 13,
    color: colors.body,
  },
  topRecsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topRecsTitle: {
    fontFamily: fonts.sans[700],
    fontSize: 14.5,
    color: colors.ink,
  },
  seeAllLink: {
    fontFamily: fonts.sans[700],
    fontSize: 13,
    color: colors.primary,
  },
  recsContent: {
    paddingTop: 12,
    gap: 14,
  },
  recItemBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  recDetailsCol: {
    flex: 1,
    gap: 4,
  },
  recTitle: {
    fontFamily: fonts.sans[700],
    fontSize: 14,
    color: colors.ink,
  },
  recDesc: {
    fontFamily: fonts.sans[400],
    fontSize: 13,
    color: colors.muted,
  },
  footerAiNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
  },
  footerAiText: {
    fontFamily: fonts.sans[400],
    fontSize: 11.5,
    color: colors.hint,
  },
  reportFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.white,
  },
  sheetInner: {
    gap: 14,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sheetKindRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sheetKindText: {
    fontFamily: fonts.sans[700],
    fontSize: 12,
  },
  sheetCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontFamily: fonts.sans[700],
    fontSize: 18,
    color: colors.ink,
  },
  sheetDesc: {
    fontFamily: fonts.sans[400],
    fontSize: 14,
    lineHeight: 21,
    color: colors.body,
  },
  fixBox: {
    backgroundColor: colors.primaryTint,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 6,
  },
  fixLabel: {
    fontFamily: fonts.sans[700],
    fontSize: 11,
    color: colors.primary,
    letterSpacing: 0.6,
  },
  fixText: {
    fontFamily: fonts.sans[400],
    fontSize: 14,
    lineHeight: 21,
    color: '#0B1A5C',
  },
});
