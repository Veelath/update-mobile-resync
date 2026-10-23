import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  StatusBar,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Svg, { Line, Polyline, Circle as SvgCircle, Text as SvgText } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors, fonts } from '../theme/colors';
import { Button } from '../components/Button';
import { Callout } from '../components/Callout';
import {
  CHAPTER1_COMPARE_DATA,
  COMPARE_ISSUES,
  CompareIssue,
  CompareVersion,
} from '../data/compare';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<RootStackParamList, 'Compare'>;

export const CompareScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const versions: CompareVersion[] = CHAPTER1_COMPARE_DATA.versions;

  const [fromVersionId, setFromVersionId] = useState<string>('v1');
  const [toVersionId, setToVersionId] = useState<string>('v3');

  const fromVer = versions.find((v) => v.id === fromVersionId) || versions[0];
  const toVer =
    versions.find((v) => v.id === toVersionId) || versions[versions.length - 1];

  const scoreA = fromVer.score;
  const scoreB = toVer.score;
  const delta = scoreB - scoreA;

  // Diff logic:
  // Resolved = in From but not in To
  // Still open = in both
  // New = in To but not in From
  const fromIssues = fromVer.issueIds.map((id) => COMPARE_ISSUES[id]).filter(Boolean);
  const toIssues = toVer.issueIds.map((id) => COMPARE_ISSUES[id]).filter(Boolean);

  const resolvedIssues: CompareIssue[] = fromIssues.filter(
    (fi) => !toIssues.some((ti) => ti.id === fi.id)
  );

  const stillOpenIssues: CompareIssue[] = fromIssues.filter((fi) =>
    toIssues.some((ti) => ti.id === fi.id)
  );

  const newIssues: CompareIssue[] = toIssues.filter(
    (ti) => !fromIssues.some((fi) => fi.id === ti.id)
  );

  const validatedRefsDelta = toVer.validatedRefs - fromVer.validatedRefs;

  // Line chart coordinates for viewBox 343x116
  const chartW = 343;
  const chartH = 116;
  const xPad = 40;
  const yTop = 26;
  const yBottom = 88;

  const points = versions.map((v, i) => {
    const x = xPad + (i * (chartW - 2 * xPad)) / (versions.length - 1);
    // score 0..100 maps to yBottom..yTop
    const y = yBottom - ((v.score - 40) / 60) * (yBottom - yTop);
    return { x, y, version: v };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

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
          <Text style={styles.topBarCaption}>Compare versions</Text>
          <Text style={styles.topBarTitle} numberOfLines={1}>
            {CHAPTER1_COMPARE_DATA.title}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Score Card */}
        <View style={styles.scoreCard}>
          <Text style={styles.eyebrowMuted}>COHERENCE SCORE</Text>

          <View style={styles.scoreDeltaRow}>
            <Text style={styles.scoreTransitionText}>
              {scoreA}{' '}
              <Text style={{ color: colors.hint, fontFamily: fonts.display[500] }}>
                →
              </Text>{' '}
              {scoreB}
            </Text>

            <View
              style={[
                styles.deltaPill,
                delta >= 0 ? styles.deltaPillPos : styles.deltaPillNeg,
              ]}
            >
              <MaterialIcons
                name={delta >= 0 ? 'trending-up' : 'trending-down'}
                size={16}
                color={delta >= 0 ? '#10B981' : '#F43F5E'}
              />
              <Text
                style={[
                  styles.deltaText,
                  { color: delta >= 0 ? '#047857' : '#BE123C' },
                ]}
              >
                {delta >= 0 ? `+${delta} pts` : `${delta} pts`}
              </Text>
            </View>
          </View>

          {/* Line Chart */}
          <View style={styles.chartWrapper}>
            <Svg width="100%" height={116} viewBox={`0 0 ${chartW} ${chartH}`}>
              {/* Gridlines */}
              <Line
                x1="20"
                y1="30"
                x2={chartW - 20}
                y2="30"
                stroke="#F1F5F9"
                strokeWidth="1"
              />
              <Line
                x1="20"
                y1="65"
                x2={chartW - 20}
                y2="65"
                stroke="#F1F5F9"
                strokeWidth="1"
              />

              {/* Polyline */}
              <Polyline
                points={polylinePoints}
                fill="none"
                stroke={colors.primary}
                strokeWidth="2.5"
              />

              {/* Points */}
              {points.map((p) => {
                const isSelected =
                  p.version.id === fromVersionId || p.version.id === toVersionId;
                return (
                  <React.Fragment key={p.version.id}>
                    {/* Circle */}
                    {isSelected ? (
                      <SvgCircle
                        cx={p.x}
                        cy={p.y}
                        r="6"
                        fill={colors.primary}
                      />
                    ) : (
                      <SvgCircle
                        cx={p.x}
                        cy={p.y}
                        r="4"
                        fill={colors.white}
                        stroke={colors.primary}
                        strokeWidth="2"
                      />
                    )}
                    {/* Score label above */}
                    <SvgText
                      x={p.x}
                      y={p.y - 10}
                      fill={isSelected ? colors.ink : colors.muted}
                      fontSize="12.5"
                      fontWeight="700"
                      textAnchor="middle"
                    >
                      {p.version.score}
                    </SvgText>
                    {/* X label below */}
                    <SvgText
                      x={p.x}
                      y={chartH - 8}
                      fill={colors.muted}
                      fontSize="11"
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      {`${p.version.label} · ${p.version.date}`}
                    </SvgText>
                  </React.Fragment>
                );
              })}
            </Svg>
          </View>
        </View>

        {/* Pickers Side by Side */}
        <View style={styles.pickersRow}>
          {/* FROM Picker */}
          <View style={styles.pickerCol}>
            <Text style={styles.pickerEyebrow}>FROM</Text>
            <View style={styles.pickerSegmented}>
              {versions.map((v) => {
                const isActive = v.id === fromVersionId;
                const isDisabled = v.id === toVersionId;
                return (
                  <Pressable
                    key={v.id}
                    disabled={isDisabled}
                    onPress={() => setFromVersionId(v.id)}
                    style={[
                      styles.pickerItem,
                      isActive && styles.pickerItemActive,
                      isDisabled && styles.pickerItemDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.pickerLabel,
                        isActive && styles.pickerLabelActive,
                        isDisabled && styles.pickerLabelDisabled,
                      ]}
                    >
                      {v.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* TO Picker */}
          <View style={styles.pickerCol}>
            <Text style={styles.pickerEyebrow}>TO</Text>
            <View style={styles.pickerSegmented}>
              {versions.map((v) => {
                const isActive = v.id === toVersionId;
                const isDisabled = v.id === fromVersionId;
                return (
                  <Pressable
                    key={v.id}
                    disabled={isDisabled}
                    onPress={() => setToVersionId(v.id)}
                    style={[
                      styles.pickerItem,
                      isActive && styles.pickerItemActive,
                      isDisabled && styles.pickerItemDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.pickerLabel,
                        isActive && styles.pickerLabelActive,
                        isDisabled && styles.pickerLabelDisabled,
                      ]}
                    >
                      {v.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* Three Summary Tiles */}
        <View style={styles.summaryTilesRow}>
          <View style={styles.sumTileResolved}>
            <Text style={styles.sumNum}>{resolvedIssues.length}</Text>
            <View style={styles.sumLabelRow}>
              <View style={[styles.sumDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.sumLabelText}>Resolved</Text>
            </View>
          </View>

          <View style={styles.sumTileOpen}>
            <Text style={styles.sumNum}>{stillOpenIssues.length}</Text>
            <View style={styles.sumLabelRow}>
              <View style={[styles.sumDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.sumLabelText}>Still open</Text>
            </View>
          </View>

          <View style={styles.sumTileNew}>
            <Text style={styles.sumNum}>{newIssues.length}</Text>
            <View style={styles.sumLabelRow}>
              <View style={[styles.sumDot, { backgroundColor: '#F43F5E' }]} />
              <Text style={styles.sumLabelText}>New</Text>
            </View>
          </View>
        </View>

        {/* Groups */}
        {/* GROUP 1: RESOLVED */}
        <View style={styles.groupContainer}>
          <View style={styles.groupHeaderRow}>
            <MaterialIcons name="check-circle" size={16} color="#10B981" />
            <Text style={styles.groupTitleText}>
              RESOLVED · {resolvedIssues.length}
            </Text>
          </View>

          {resolvedIssues.length === 0 ? (
            <Text style={styles.emptyGroupText}>
              Nothing resolved between these versions.
            </Text>
          ) : (
            resolvedIssues.map((issue) => (
              <View key={issue.id} style={styles.issueRow}>
                <MaterialIcons name="check-circle" size={20} color="#10B981" />
                <View style={styles.issueInfoCol}>
                  <Text style={styles.issueLink}>
                    {issue.type} · {issue.link}
                  </Text>
                  <Text style={styles.issueTitleResolved}>{issue.title}</Text>
                </View>
                <View
                  style={[
                    styles.sevPill,
                    issue.severity === 'High'
                      ? styles.sevPillHigh
                      : issue.severity === 'Medium'
                      ? styles.sevPillMed
                      : styles.sevPillLow,
                  ]}
                >
                  <Text
                    style={[
                      styles.sevPillText,
                      issue.severity === 'High'
                        ? { color: '#BE123C' }
                        : issue.severity === 'Medium'
                        ? { color: '#D97706' }
                        : { color: '#64748B' },
                    ]}
                  >
                    {issue.severity}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* GROUP 2: STILL OPEN */}
        <View style={styles.groupContainer}>
          <View style={styles.groupHeaderRow}>
            <MaterialIcons name="adjust" size={16} color="#F59E0B" />
            <Text style={styles.groupTitleText}>
              STILL OPEN · {stillOpenIssues.length}
            </Text>
          </View>

          {stillOpenIssues.length === 0 ? (
            <Text style={styles.emptyGroupText}>No carried-over issues.</Text>
          ) : (
            stillOpenIssues.map((issue) => (
              <View key={issue.id} style={styles.issueRow}>
                <MaterialIcons
                  name="radio-button-unchecked"
                  size={20}
                  color="#F59E0B"
                />
                <View style={styles.issueInfoCol}>
                  <Text style={styles.issueLink}>
                    {issue.type} · {issue.link}
                  </Text>
                  <Text style={styles.issueTitleOpen}>{issue.title}</Text>
                </View>
                <View
                  style={[
                    styles.sevPill,
                    issue.severity === 'High'
                      ? styles.sevPillHigh
                      : issue.severity === 'Medium'
                      ? styles.sevPillMed
                      : styles.sevPillLow,
                  ]}
                >
                  <Text
                    style={[
                      styles.sevPillText,
                      issue.severity === 'High'
                        ? { color: '#BE123C' }
                        : issue.severity === 'Medium'
                        ? { color: '#D97706' }
                        : { color: '#64748B' },
                    ]}
                  >
                    {issue.severity}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* GROUP 3: NEW IN TO */}
        <View style={styles.groupContainer}>
          <View style={styles.groupHeaderRow}>
            <MaterialIcons name="add-circle" size={16} color="#F43F5E" />
            <Text style={styles.groupTitleText}>
              NEW IN {toVer.label.toUpperCase()} · {newIssues.length}
            </Text>
          </View>

          {newIssues.length === 0 ? (
            <Text style={styles.emptyGroupText}>No new issues introduced.</Text>
          ) : (
            newIssues.map((issue) => (
              <View key={issue.id} style={styles.issueRow}>
                <MaterialIcons name="add-circle" size={20} color="#F43F5E" />
                <View style={styles.issueInfoCol}>
                  <Text style={styles.issueLink}>
                    {issue.type} · {issue.link}
                  </Text>
                  <Text style={styles.issueTitleOpen}>{issue.title}</Text>
                </View>
                <View
                  style={[
                    styles.sevPill,
                    issue.severity === 'High'
                      ? styles.sevPillHigh
                      : issue.severity === 'Medium'
                      ? styles.sevPillMed
                      : styles.sevPillLow,
                  ]}
                >
                  <Text
                    style={[
                      styles.sevPillText,
                      issue.severity === 'High'
                        ? { color: '#BE123C' }
                        : issue.severity === 'Medium'
                        ? { color: '#D97706' }
                        : { color: '#64748B' },
                    ]}
                  >
                    {issue.severity}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Citations callout if validated refs increased */}
        {validatedRefsDelta > 0 && (
          <Callout
            icon="link"
            iconColor={colors.primary}
            backgroundColor={colors.primaryTint}
            borderColor="#D5DDFB"
          >
            <Text style={styles.calloutBody}>
              <Text style={{ fontFamily: fonts.sans[700], color: colors.ink }}>
                Citations improved.{' '}
              </Text>
              {validatedRefsDelta} reference now opens correctly.
            </Text>
          </Callout>
        )}
      </ScrollView>

      {/* Compare Footer */}
      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 24) },
        ]}
      >
        <Button
          title={`Open ${fromVer.label} report`}
          variant="outline"
          onPress={() =>
            navigation.push('Report', { scanId: fromVer.scanId, heavy: true })
          }
          style={{ flex: 1 }}
        />
        <Button
          title={`Open ${toVer.label} report`}
          variant="primary"
          onPress={() =>
            navigation.push('Report', { scanId: toVer.scanId, heavy: false })
          }
          style={{ flex: 1 }}
        />
      </View>
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
  topBarCaption: {
    fontFamily: fonts.sans[400],
    fontSize: 11.5,
    color: colors.hint,
  },
  topBarTitle: {
    fontFamily: fonts.sans[600],
    fontSize: 14.5,
    color: colors.ink,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
    gap: 22,
  },
  scoreCard: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    paddingTop: 14,
    paddingHorizontal: 14,
    paddingBottom: 8,
    backgroundColor: colors.white,
    gap: 10,
  },
  eyebrowMuted: {
    fontFamily: fonts.sans[700],
    fontSize: 10.5,
    color: colors.muted,
    letterSpacing: 1.1,
  },
  scoreDeltaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreTransitionText: {
    fontFamily: fonts.display[700],
    fontSize: 30,
    color: colors.ink,
  },
  deltaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  deltaPillPos: {
    backgroundColor: '#ECFDF5',
  },
  deltaPillNeg: {
    backgroundColor: '#FFF1F3',
  },
  deltaText: {
    fontFamily: fonts.sans[700],
    fontSize: 13,
  },
  chartWrapper: {
    marginTop: 6,
  },
  pickersRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pickerCol: {
    flex: 1,
    gap: 6,
  },
  pickerEyebrow: {
    fontFamily: fonts.sans[700],
    fontSize: 10.5,
    color: colors.muted,
    letterSpacing: 1.1,
  },
  pickerSegmented: {
    flexDirection: 'row',
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    padding: 3,
  },
  pickerItem: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerItemActive: {
    backgroundColor: colors.white,
    elevation: 1,
  },
  pickerItemDisabled: {
    opacity: 0.35,
  },
  pickerLabel: {
    fontFamily: fonts.sans[500],
    fontSize: 12.5,
    color: colors.muted,
  },
  pickerLabelActive: {
    fontFamily: fonts.sans[600],
    color: colors.ink,
  },
  pickerLabelDisabled: {
    color: '#CBD5E1',
  },
  summaryTilesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sumTileResolved: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F6FDF9',
    borderWidth: 1,
    borderColor: '#D7F3E5',
    gap: 4,
  },
  sumTileOpen: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFFBF0',
    borderWidth: 1,
    borderColor: '#F7E8C4',
    gap: 4,
  },
  sumTileNew: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFF7F8',
    borderWidth: 1,
    borderColor: '#FBD5DC',
    gap: 4,
  },
  sumNum: {
    fontFamily: fonts.display[700],
    fontSize: 24,
    color: colors.ink,
  },
  sumLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sumDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sumLabelText: {
    fontFamily: fonts.sans[600],
    fontSize: 12,
    color: colors.muted,
  },
  groupContainer: {
    gap: 10,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupTitleText: {
    fontFamily: fonts.sans[700],
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 1.1,
  },
  emptyGroupText: {
    fontFamily: fonts.sans[400],
    fontSize: 13,
    color: colors.hint,
    paddingLeft: 4,
  },
  issueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  issueInfoCol: {
    flex: 1,
    gap: 2,
  },
  issueLink: {
    fontFamily: fonts.sans[600],
    fontSize: 11.5,
    color: colors.muted,
  },
  issueTitleResolved: {
    fontFamily: fonts.sans[600],
    fontSize: 14,
    color: colors.hint,
    textDecorationLine: 'line-through',
  },
  issueTitleOpen: {
    fontFamily: fonts.sans[600],
    fontSize: 14,
    color: colors.ink,
  },
  sevPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sevPillHigh: {
    backgroundColor: '#FFF1F3',
  },
  sevPillMed: {
    backgroundColor: '#FFF8EB',
  },
  sevPillLow: {
    backgroundColor: '#F1F5F9',
  },
  sevPillText: {
    fontFamily: fonts.sans[700],
    fontSize: 10.5,
  },
  calloutBody: {
    fontFamily: fonts.sans[400],
    fontSize: 13,
    lineHeight: 19,
    color: colors.body,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.white,
  },
});
