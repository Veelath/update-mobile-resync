import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import * as SvgModule from 'react-native-svg';
const Svg = SvgModule.Svg || (SvgModule as any).default || SvgModule;
const Defs = SvgModule.Defs;
const Pattern = SvgModule.Pattern;
const Rect = SvgModule.Rect;
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainTabParamList, RootStackParamList } from '../navigation/types';
import { colors, fonts, gradients } from '../theme/colors';
import {supabase} from '../services/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ResyncMonogram } from '../components/ResyncMonogram';
import { NotificationBell } from '../components/NotificationBell';
import { takePendingScanId } from '../services/notifications';

export const DashboardScreen: React.FC = () => {
  const tabNav = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const insets = useSafeAreaInsets();
  const [displayName, setDisplayName] = useState('');

  // A notification tapped before sign-in finished opens its report once the Dashboard is reached.
  useEffect(() => {
    const scanId = takePendingScanId();
    if (scanId) tabNav.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('Report', {scanId});
  }, [tabNav]);

  useEffect(() => {
    supabase.auth.getUser().then(({data}) => setDisplayName(data.user?.user_metadata?.full_name || data.user?.email || ''));
  }, []);

  const timelineSteps = [
    {
      step: '01',
      icon: 'upload',
      title: 'Upload Manuscript',
      desc: 'Upload your Word file or paste a Google Docs share link.',
    },
    {
      step: '02',
      icon: 'dashboard-customize',
      title: 'Review Sections',
      desc: 'Upload a manuscript and review its detected sections.',
    },
    {
      step: '03',
      icon: 'schedule',
      title: 'Coherence Scan',
      desc: 'AI checks consecutive section links, citations, and the AI-text indicator.',
    },
    {
      step: '04',
      icon: 'download',
      title: 'Export Report',
      desc: 'Download your annotated report and fix recommendations as a PDF.',
    },
  ];

  const deliverables = [
    {
      icon: 'speed',
      color: '#0A2AB8',
      bg: '#EEF2FF',
      title: 'Coherence Score',
      desc: 'A 0–100 coherence score for logical links between consecutive manuscript sections.',
    },
    {
      icon: 'subject',
      color: '#2563EB',
      bg: '#EFF6FF',
      title: 'Annotated Manuscript',
      desc: 'Manuscript text with verified passages highlighted inline for review.',
    },
    {
      icon: 'task-alt',
      color: '#059669',
      bg: '#ECFDF5',
      title: 'Fix Recommendations',
      desc: 'Suggested revisions for flagged section links, ready to review.',
    },
    {
      icon: 'link',
      color: '#D97706',
      bg: '#FFFBEB',
      title: 'Verified Reference List',
      desc: 'Public or private access status for every cited URL and DOI in your bibliography.',
    },
  ];

  const guidanceItems = [
    {
      icon: 'description',
      title: 'Digital Manuscripts',
      sub: 'DOCX, PDF, Google Docs',
    },
    {
      icon: 'menu-book',
      title: 'Section Flow',
      sub: 'Consecutive section links',
    },
    {
      icon: 'view-agenda',
      title: 'Single-Column Flow',
      sub: 'Sequential reading order',
    },
    {
      icon: 'notes',
      title: 'Direct Prose',
      sub: 'Claims and conclusions',
    },
    {
      icon: 'link',
      title: 'Open References',
      sub: 'Citations and DOI checks',
    },
    {
      icon: 'smart-toy',
      title: 'AI-Text Indicator',
      sub: 'Review the text signal',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 30 }]}
      >
        {/* HERO */}
        <LinearGradient
          colors={gradients.hero.colors}
          start={gradients.hero.start}
          end={gradients.hero.end}
          style={[styles.hero, { paddingTop: insets.top + 6 }]}
        >
          {/* Dot grid overlay */}
          <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <Svg width="100%" height="100%">
              <Defs>
                <Pattern
                  id="dotGrid"
                  x="0"
                  y="0"
                  width="18"
                  height="18"
                  patternUnits="userSpaceOnUse"
                >
                  <Rect
                    x="2"
                    y="2"
                    width="1.5"
                    height="1.5"
                    fill="rgba(255,255,255,0.12)"
                  />
                </Pattern>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#dotGrid)" />
            </Svg>
          </View>

          {/* Top row */}
          <View style={styles.topRow}>
            <View style={styles.brandGroup}>
              <ResyncMonogram width={24} height={30} color="#FFFFFF" />
              <Text style={styles.heroBrandText}>Resync</Text>
            </View>

            <View style={styles.headerRightGroup}>
              {/* Bell icon */}
              <NotificationBell />

              {/* Avatar */}
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{displayName.slice(0, 2).toUpperCase()}</Text>
              </View>
            </View>
          </View>

          {/* Greeting Pill */}
          <View style={styles.greetingPill}>
            <Text style={styles.greetingText}>Welcome, {displayName.split(' ')[0]}</Text>
          </View>

          {/* Headline */}
          <Text style={styles.headline}>
            Your manuscript,{' '}
            <Text style={{ color: '#93C5FD' }}>checked{'\n'}end-to-end.</Text>
          </Text>

          {/* Body */}
          <Text style={styles.heroBody}>
            Check logical links between consecutive sections, citations, and the AI-text indicator in one report.
          </Text>

          {/* CTA row */}
          <View style={styles.ctaRow}>
            <Pressable
              onPress={() => tabNav.navigate('Upload')}
              style={({ pressed }) => [
                styles.ctaButton,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <MaterialIcons name="upload" size={19} color={colors.ink} />
              <Text style={styles.ctaButtonText}>Start a Scan</Text>
            </Pressable>

            <Pressable onPress={() => tabNav.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate('Report', {sample: true})} style={styles.previewLink}>
              <Text style={styles.previewText}>Preview sample</Text>
            </Pressable>

          </View>

          {/* Divider */}
          <View style={styles.heroDivider} />

          {/* Meta row */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <View style={[styles.metaDot, { backgroundColor: '#34D399' }]} />
              <Text style={styles.metaText}>Consecutive section coherence</Text>
            </View>
            <View style={styles.metaItem}>
              <View style={[styles.metaDot, { backgroundColor: 'rgba(255,255,255,0.45)' }]} />
              <Text style={styles.metaText}>Citation accessibility checks</Text>
            </View>
            <View style={styles.metaItem}>
              <View style={[styles.metaDot, { backgroundColor: 'rgba(255,255,255,0.45)' }]} />
              <Text style={styles.metaText}>AI-text indicator</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={[styles.metaText, { fontFamily: fonts.sans[600] }]}>
                Word (.doc/.docx) & Google Docs
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* BODY CONTENT */}
        <View style={styles.bodyContent}>
          {/* SECTION 1: PROCESS */}
          <View style={styles.section}>
            <Text style={styles.eyebrowMono}>PROCESS</Text>
            <Text style={styles.h2}>How It Works</Text>
            <Text style={styles.sectionSubtitle}>
              Four simple steps from manuscript to coherence report.
            </Text>

            {/* Timeline */}
            <View style={styles.timeline}>
              {timelineSteps.map((item, idx) => {
                const isLast = idx === timelineSteps.length - 1;
                return (
                  <View key={item.step} style={styles.timelineRow}>
                    {/* Left Column */}
                    <View style={styles.leftCol}>
                      <View style={styles.stepIconTile}>
                        <MaterialIcons
                          name={item.icon}
                          size={21}
                          color={colors.white}
                        />
                      </View>
                      {!isLast && <View style={styles.dashedConnector} />}
                    </View>

                    {/* Right Column Card */}
                    <View style={styles.timelineCard}>
                      <Text style={styles.stepLabel}>STEP {item.step}</Text>
                      <Text style={styles.stepTitleText}>{item.title}</Text>
                      <Text style={styles.stepDescText}>{item.desc}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* SECTION 2: OUTPUTS */}
          <View style={styles.section}>
            <Text style={styles.eyebrowMono}>OUTPUTS</Text>
            <Text style={styles.h2}>What You Get</Text>
            <Text style={styles.sectionSubtitle}>
              Four deliverables, every scan, automatically.
            </Text>

            {/* 2x2 Grid */}
            <View style={styles.grid2x2}>
              {deliverables.map((item) => (
                <View key={item.title} style={styles.outputCard}>
                  <View
                    style={[styles.outputIconTile, { backgroundColor: item.bg }]}
                  >
                    <MaterialIcons
                      name={item.icon}
                      size={19}
                      color={item.color}
                    />
                  </View>
                  <Text style={styles.outputTitle}>{item.title}</Text>
                  <Text style={styles.outputDesc}>{item.desc}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* SECTION 3: GUIDANCE */}
          <View style={styles.section}>
            <Text style={styles.eyebrowMono}>GUIDANCE</Text>
            <Text style={styles.h2}>Best Results With</Text>
            <Text style={styles.sectionSubtitle}>
              Clear sections help ReSync assess how each part of your manuscript connects to the next.
            </Text>

            {/* 2-column Grid */}
            <View style={styles.guidanceGrid}>
              {guidanceItems.map((item) => (
                <View key={item.title} style={styles.guidanceItem}>
                  <LinearGradient
                    colors={gradients.guideTile.colors}
                    start={gradients.guideTile.start}
                    end={gradients.guideTile.end}
                    style={styles.guidanceTile}
                  >
                    <MaterialIcons
                      name={item.icon}
                      size={28}
                      color={colors.primary}
                    />
                  </LinearGradient>
                  <Text style={styles.guidanceTitle}>{item.title}</Text>
                  <Text style={styles.guidanceSub}>{item.sub}</Text>
                </View>
              ))}
            </View>

            {/* Callout */}
            <View style={styles.calloutBox}>
              <MaterialIcons name="info" size={18} color={colors.primary} />
              <Text style={styles.calloutText}>
                <Text style={styles.calloutBold}>
                  When inconsistencies may appear.{' '}
                </Text>
                Review flagged findings in Detailed Analysis & Recommendations.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.soft,
  },
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    position: 'relative',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroBrandText: {
    fontFamily: fonts.sans[800],
    fontSize: 20,
    color: colors.white,
    letterSpacing: -0.4,
  },
  creditsPill: {
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  creditsText: {
    fontFamily: fonts.sans[600],
    fontSize: 12,
    color: colors.white,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.sans[800],
    fontSize: 12,
    color: colors.primary,
  },
  greetingPill: {
    alignSelf: 'flex-start',
    marginTop: 26,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  greetingText: {
    fontFamily: fonts.sans[600],
    fontSize: 12,
    color: colors.white,
  },
  headline: {
    marginTop: 14,
    fontFamily: fonts.display[700],
    fontSize: 31,
    lineHeight: 34,
    letterSpacing: -1,
    color: colors.white,
  },
  heroBody: {
    marginTop: 10,
    fontFamily: fonts.sans[400],
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.82)',
  },
  ctaRow: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  ctaButton: {
    height: 46,
    borderRadius: 12,
    paddingHorizontal: 18,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ctaButtonText: {
    fontFamily: fonts.sans[700],
    fontSize: 14.5,
    color: colors.ink,
  },
  previewLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewText: {
    fontFamily: fonts.sans[700],
    fontSize: 14,
    color: colors.white,
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
    marginTop: 22,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    rowGap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  metaText: {
    fontFamily: fonts.sans[400],
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 26,
    gap: 30,
  },
  section: {},
  eyebrowMono: {
    fontFamily: fonts.mono[500],
    fontSize: 11,
    color: colors.primary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  h2: {
    marginTop: 6,
    fontFamily: fonts.display[700],
    fontSize: 24,
    letterSpacing: -0.5,
    color: colors.ink,
  },
  sectionSubtitle: {
    marginTop: 4,
    fontFamily: fonts.sans[400],
    fontSize: 13.5,
    color: colors.muted,
  },
  // Timeline
  timeline: {
    marginTop: 18,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 14,
  },
  leftCol: {
    alignItems: 'center',
    width: 44,
  },
  stepIconTile: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  dashedConnector: {
    width: 1,
    flex: 1,
    marginVertical: 4,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  timelineCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    paddingTop: 14,
    paddingHorizontal: 14,
    paddingBottom: 16,
    marginBottom: 12,
  },
  stepLabel: {
    fontFamily: fonts.mono[500],
    fontSize: 10.5,
    color: colors.primary,
  },
  stepTitleText: {
    marginTop: 2,
    fontFamily: fonts.sans[700],
    fontSize: 15.5,
    color: colors.ink,
  },
  stepDescText: {
    marginTop: 4,
    fontFamily: fonts.sans[400],
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
  },
  // Deliverables 2x2
  grid2x2: {
    marginTop: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  outputCard: {
    width: '48.5%',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  outputIconTile: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outputTitle: {
    fontFamily: fonts.sans[700],
    fontSize: 14,
    color: colors.ink,
  },
  outputDesc: {
    fontFamily: fonts.sans[400],
    fontSize: 12,
    lineHeight: 17,
    color: colors.muted,
  },
  // Guidance
  guidanceGrid: {
    marginTop: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 18,
    columnGap: 12,
    justifyContent: 'space-between',
  },
  guidanceItem: {
    width: '30%',
    alignItems: 'center',
  },
  guidanceTile: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DCE3FD',
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guidanceTitle: {
    marginTop: 8,
    fontFamily: fonts.sans[700],
    fontSize: 14,
    color: colors.ink,
    textAlign: 'center',
  },
  guidanceSub: {
    marginTop: 2,
    fontFamily: fonts.sans[400],
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
  },
  calloutBox: {
    marginTop: 22,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#D5DDFB',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  calloutText: {
    flex: 1,
    fontFamily: fonts.sans[400],
    fontSize: 13,
    lineHeight: 19,
    color: colors.body,
  },
  calloutBold: {
    fontFamily: fonts.sans[700],
    color: colors.ink,
  },
});
