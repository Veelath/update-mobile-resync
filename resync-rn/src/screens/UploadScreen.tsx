import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  StatusBar,
  Alert,
  Animated,
  Easing,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabParamList, RootStackParamList } from '../navigation/types';
import { fonts } from '../theme/colors';
import { brand, cardStyle } from '../theme/brand';
import { getSession, saveSession, creditsAvailable, incrementScansCount, UserSession } from '../services/session';
import { saveNewScan } from '../services/scanRepository';
import { AppHeader, initialsOf } from '../components/AppHeader';
import { LineIcon, LineIconName } from '../components/LineIcon';
import { PressableScale } from '../components/PressableScale';
import { AnalyzingView } from '../components/scan/AnalyzingView';
import { ScanTour, TourRect, TOUR_STEPS } from '../components/scan/ScanTour';

type Phase = 'template' | 'upload' | 'confirm' | 'analyzing';
type Source = 'file' | 'gdocs';
type PickedFile = { name: string; sizeMb: number };
type GdocsStatus = 'idle' | 'checking' | 'ok' | 'invalid' | 'private';

const MAX_MB = 25;
const WORD_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];
// Shown on the confirm step while the tour walks through it without a real document
const DEMO_DOC = { name: 'Resync_Capstone_Manuscript_v3.docx', meta: '2.4 MB · 86 pages · ~18,400 words' };
// Which flow step sits behind each tour step
const TOUR_PHASE: Phase[] = ['template', 'template', 'upload', 'confirm', 'confirm'];
const PREVIEW_LINES = ['96%', '88%', '100%', '72%', '94%', '100%', '84%', '60%'];

const pickWordFile = async (): Promise<PickedFile | 'too-big' | null> => {
  try {
    const picker = require('@react-native-documents/picker');
    const res = await picker.pick({ mode: 'open', type: [picker.types.docx, picker.types.doc, ...WORD_TYPES] });
    const file = res?.[0];
    if (!file) return null;
    const sizeMb = (file.size || 0) / (1024 * 1024);
    if (sizeMb > MAX_MB) return 'too-big';
    return { name: file.name || 'manuscript.docx', sizeMb };
  } catch (e: any) {
    if (e?.code === 'DOCUMENT_PICKER_CANCELED' || e?.code === 'OPERATION_CANCELED') return null;
    // No native picker available (e.g. simulator without one): fall back to a sample file
    return { name: 'Academic_Burnout_Study_Final.docx', sizeMb: 2.4 };
  }
};

const formatMb = (mb: number) => `${(mb > 0 ? mb : 0.1).toFixed(1)} MB`;

/** Fades and nudges a step's content in whenever the step changes. */
const StepFade: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 380, easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: true }).start();
  }, [v]);
  return (
    <Animated.View
      style={{ gap: 12, opacity: v, transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }}
    >
      {children}
    </Animated.View>
  );
};

/** Floating icon tile inside a drop zone. */
const FloatingIcon: React.FC<{ icon: LineIconName }> = ({ icon }) => {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v]);
  return (
    <Animated.View style={[styles.dzIcon, { transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }] }]}>
      <LineIcon name={icon} size={22} color={brand.primary} />
    </Animated.View>
  );
};

const DropZone: React.FC<{ onPress: () => void; height?: number; children: React.ReactNode }> = ({ onPress, height, children }) => (
  <PressableScale onPress={onPress} pressedScale={0.985} style={[styles.dz, height ? { height } : null]}>
    <LinearGradient colors={['#FAFAFF', '#F3F2FF']} style={[StyleSheet.absoluteFill, styles.dzBg]} />
    {children}
  </PressableScale>
);

const Callout: React.FC<{ tone: 'warn' | 'ok' | 'info'; text: string }> = ({ tone, text }) => {
  const t = {
    warn: { bg: '#FFF8E6', border: '#F7E2A8', icon: '#B7791F', text: '#8A5A12' },
    ok: { bg: '#F1FAF5', border: '#CDEBD9', icon: brand.success, text: '#1F6B45' },
    info: { bg: '#FFFFFF', border: brand.line, icon: brand.primary, text: brand.sub },
  }[tone];
  return (
    <View style={[styles.callout, { backgroundColor: t.bg, borderColor: t.border }]}>
      <LineIcon name="info" size={17} color={t.icon} />
      <Text style={[styles.calloutText, { color: t.text }]}>{text}</Text>
    </View>
  );
};

const Radio: React.FC<{ on: boolean }> = ({ on }) => (
  <View style={[styles.radio, on && styles.radioOn]}>{on && <View style={styles.radioDot} />}</View>
);

export const UploadScreen: React.FC = () => {
  const tabNav = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const [session, setSession] = useState<UserSession | null>(null);
  const [phase, setPhase] = useState<Phase>('template');
  const [template, setTemplate] = useState<PickedFile | null>(null);
  const [source, setSource] = useState<Source>('file');
  const [file, setFile] = useState<PickedFile | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [gdocsUrl, setGdocsUrl] = useState('');
  const [gdocsStatus, setGdocsStatus] = useState<GdocsStatus>('idle');
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Guided tour
  const [tourStep, setTourStep] = useState<number | null>(null);
  const [tourRect, setTourRect] = useState<TourRect | null>(null);
  const phaseBeforeTour = useRef<Phase>('template');
  const targets = {
    head: useRef<View>(null),
    templateCard: useRef<View>(null),
    uploadArea: useRef<View>(null),
    confirmDoc: useRef<View>(null),
    runButton: useRef<View>(null),
  };
  const TOUR_TARGET = [targets.head, targets.templateCard, targets.uploadArea, targets.confirmDoc, targets.runButton];

  const startTour = useCallback(() => {
    phaseBeforeTour.current = phase === 'analyzing' ? 'template' : phase;
    setTourRect(null);
    setTourStep(0);
  }, [phase]);

  useFocusEffect(
    useCallback(() => {
      getSession().then((s) => {
        setSession(s);
        if (!s.hasSeenScanTour) {
          setTourStep(0);
          saveSession({ hasSeenScanTour: true });
        }
      });
    }, []),
  );

  const resetFlow = () => {
    setPhase('template');
    setTemplate(null);
    setSource('file');
    setFile(null);
    setFileError(null);
    setGdocsUrl('');
    setGdocsStatus('idle');
  };

  const goTo = (next: Phase) => {
    setPhase(next);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const goBack = useCallback(() => {
    if (tourStep !== null) setTourStep(null);
    else if (phase === 'confirm') goTo('upload');
    else if (phase === 'upload') goTo('template');
    else if (phase === 'template') {
      resetFlow();
      tabNav.navigate('Home');
    }
    // Analyzing can't be cancelled midway
    return true;
  }, [phase, tourStep, tabNav]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', goBack);
      return () => sub.remove();
    }, [goBack]),
  );

  // Tour: show the right step behind the coach mark, then measure its target
  useEffect(() => {
    if (tourStep === null) return;
    const want = TOUR_PHASE[tourStep];
    if (phase !== want) {
      goTo(want);
      return;
    }
    const t = setTimeout(() => {
      TOUR_TARGET[tourStep].current?.measureInWindow((x, y, width, height) => setTourRect({ x, y, width, height }));
    }, 90);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourStep, phase]);

  const endTour = () => {
    setTourStep(null);
    setTourRect(null);
    goTo(phaseBeforeTour.current);
  };

  // --- Template ---
  const attachTemplate = async () => {
    const res = await pickWordFile();
    if (res === 'too-big') Alert.alert('Template too large', `Choose a file under ${MAX_MB} MB.`);
    else if (res) setTemplate(res);
  };

  // --- Upload ---
  const chooseFile = async () => {
    const res = await pickWordFile();
    if (res === 'too-big') setFileError(`That file is over the ${MAX_MB} MB limit.`);
    else if (res) {
      setFileError(null);
      setFile(res);
    }
  };

  const onGdocsChange = (text: string) => {
    setGdocsUrl(text);
    if (debounce.current) clearTimeout(debounce.current);
    if (!text.trim()) {
      setGdocsStatus('idle');
      return;
    }
    setGdocsStatus('checking');
    debounce.current = setTimeout(() => {
      if (text.includes('Pr1vat3')) setGdocsStatus('private');
      else if (text.includes('docs.google.com/document') || text.includes('demo')) setGdocsStatus('ok');
      else setGdocsStatus('invalid');
    }, 900);
  };

  const uploadValid = source === 'file' ? !!file : gdocsStatus === 'ok';

  // --- Confirm / run ---
  const touringConfirm = tourStep !== null && phase === 'confirm' && !uploadValid;
  const doc = touringConfirm
    ? { ...DEMO_DOC, source: 'file' as Source }
    : source === 'file'
      ? { name: file?.name ?? '', meta: `${formatMb(file?.sizeMb ?? 0)} · Word document`, source }
      : { name: 'Google Docs manuscript', meta: gdocsUrl.replace(/^https?:\/\//, ''), source };

  const runScan = () => {
    if (session && creditsAvailable(session) < 1) {
      Alert.alert('No credits left', 'Each scan uses one credit. Top up to keep scanning.', [
        { text: 'Not now', style: 'cancel' },
        { text: 'View credits', onPress: () => tabNav.navigate('Credits') },
      ]);
      return;
    }
    goTo('analyzing');
  };

  const finishScan = useCallback(async () => {
    await incrementScansCount();
    const title = source === 'file' ? file?.name ?? 'Manuscript.docx' : 'Google Docs manuscript';
    await saveNewScan({
      id: `scan_${Date.now()}`,
      title,
      status: 'Initial scan',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      score: 74,
      url: title.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      isGoogleDoc: source === 'gdocs',
      heavy: false,
    });
    resetFlow();
    tabNav.navigate('Home');
    rootNav.push('Report', { heavy: false });
  }, [source, file, tabNav, rootNav]);

  if (phase === 'analyzing') {
    return <AnalyzingView onDone={finishScan} />;
  }

  const stepIndex = phase === 'template' ? 0 : phase === 'upload' ? 1 : 2;

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <AppHeader
        title="Back"
        initials={initialsOf(session?.userName ?? '')}
        onBack={goBack}
        onAvatarPress={() => tabNav.navigate('Profile')}
        action={{ icon: 'help', label: 'Replay the scan tour', onPress: startTour }}
      />

      <ScrollView ref={scrollRef} contentContainerStyle={styles.main} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View ref={targets.head} collapsable={false} style={styles.headBlock}>
          <View style={styles.progress}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.progressSeg, i <= stepIndex && styles.progressOn]} />
            ))}
          </View>
          <View>
            <Text style={styles.eyebrow}>
              {phase === 'template' ? 'STEP 1 OF 3' : phase === 'upload' ? 'STEP 2 OF 3' : 'STEP 3 OF 3 · CONFIRM'}
            </Text>
            <Text style={[styles.h1, phase === 'confirm' && { fontSize: 26 }]}>
              {phase === 'template' ? 'Optional chapter template' : phase === 'upload' ? 'Upload manuscript' : 'Is this the right document?'}
            </Text>
            {phase !== 'confirm' && (
              <Text style={styles.sub}>
                {phase === 'template'
                  ? 'Attach a template if you need specific headings, or skip to use headings detected from your manuscript.'
                  : 'Add a Word file or a Google Docs link. Resync detects sections if you skipped the template.'}
              </Text>
            )}
          </View>
        </View>

        {phase === 'template' && (
          <StepFade key="template">
            <View ref={targets.templateCard} collapsable={false} style={[cardStyle, styles.cardPad]}>
              <View style={styles.cardHead}>
                <View style={[styles.ic, { width: 40, height: 40 }]}>
                  <LineIcon name="docLines" size={20} color={brand.primary} />
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.cardTitle}>Have a school template?</Text>
                  <Text style={styles.cardSub}>.doc or .docx syllabus or format file</Text>
                </View>
              </View>
              {template ? (
                <View style={styles.attached}>
                  <View style={[styles.ic, { width: 40, height: 40 }]}>
                    <LineIcon name="doc" size={19} color={brand.primary} />
                  </View>
                  <View style={styles.flex1}>
                    <Text style={styles.attachedName} numberOfLines={1}>
                      {template.name}
                    </Text>
                    <Text style={styles.attachedMeta}>{formatMb(template.sizeMb)} · Template</Text>
                  </View>
                  <Pressable onPress={() => setTemplate(null)} hitSlop={10} style={styles.removeBtn} accessibilityLabel="Remove template">
                    <LineIcon name="close" size={16} color={brand.sub} />
                  </Pressable>
                </View>
              ) : (
                <DropZone onPress={attachTemplate}>
                  <FloatingIcon icon="upload" />
                  <Text style={styles.dzTitle}>Attach your school's template</Text>
                  <Text style={styles.dzSub}>Syllabus or format document · .doc or .docx</Text>
                </DropZone>
              )}
            </View>

            <View style={[cardStyle, styles.summary]}>
              <View style={styles.summaryHead}>
                <Text style={[styles.eyebrow, { color: brand.muted }]}>TEMPLATE SUMMARY</Text>
                <Text style={styles.pill}>{template ? 'Custom' : 'Auto-detect'}</Text>
              </View>
              <SummaryRow label="Chapters" value={template ? 'From template' : 'Auto-detected'} />
              <SummaryRow label="Sections" value={template ? 'From template' : 'Auto-detected'} />
              <SummaryRow label="Credit cost" value="1 credit" valueColor="#0B9F6E" />
            </View>

            <Callout
              tone={template ? 'ok' : 'warn'}
              text={
                template
                  ? 'Template attached. Resync will follow its chapter headings.'
                  : 'No template selected. Resync will detect sections from your manuscript.'
              }
            />
          </StepFade>
        )}

        {phase === 'upload' && (
          <StepFade key="upload">
            <View ref={targets.uploadArea} collapsable={false} style={styles.uploadArea}>
              <View style={styles.sources}>
                {(
                  [
                    { key: 'file', icon: 'docLines', title: 'Word file', sub: '.doc · .docx · 25 MB', mono: true },
                    { key: 'gdocs', icon: 'linkAlt', title: 'Google Docs', sub: 'Shared view link', mono: false },
                  ] as const
                ).map((o) => {
                  const on = source === o.key;
                  return (
                    <PressableScale key={o.key} onPress={() => setSource(o.key)} style={[styles.sourceCard, on && styles.sourceOn]}>
                      <View style={styles.sourceTop}>
                        <View style={[styles.ic, { width: 38, height: 38 }]}>
                          <LineIcon name={o.icon} size={20} color={brand.primary} />
                        </View>
                        <Radio on={on} />
                      </View>
                      <Text style={styles.sourceTitle}>{o.title}</Text>
                      <Text style={o.mono ? styles.sourceSubMono : styles.sourceSub}>{o.sub}</Text>
                    </PressableScale>
                  );
                })}
              </View>

              {source === 'file' ? (
                <DropZone onPress={chooseFile} height={210}>
                  {file ? (
                    <>
                      <View style={[styles.dzIcon, styles.dzIconDone]}>
                        <LineIcon name="check" size={24} color="#FFFFFF" strokeWidth={2.4} />
                      </View>
                      <Text style={styles.dzTitle} numberOfLines={2}>
                        {file.name}
                      </Text>
                      <Text style={styles.dzSub}>{formatMb(file.sizeMb)} · Tap to choose a different file</Text>
                    </>
                  ) : (
                    <>
                      <FloatingIcon icon="upload" />
                      <Text style={styles.dzTitle}>Tap to choose a file</Text>
                      <Text style={styles.dzSub}>.doc or .docx · max {MAX_MB} MB</Text>
                    </>
                  )}
                </DropZone>
              ) : (
                <View style={[cardStyle, styles.gdocsPanel]}>
                  <View style={styles.fld}>
                    <Text style={styles.fldLabel}>GOOGLE DOCS LINK</Text>
                    <View style={[styles.inp, gdocsStatus === 'ok' && { borderColor: '#34C16F' }, (gdocsStatus === 'invalid' || gdocsStatus === 'private') && { borderColor: brand.danger }]}>
                      <LineIcon name="linkAlt" size={20} color={brand.icon} />
                      <TextInput
                        value={gdocsUrl}
                        onChangeText={onGdocsChange}
                        placeholder="https://docs.google.com/document/d/…"
                        placeholderTextColor={brand.placeholder}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="url"
                        style={styles.inpText}
                      />
                      {gdocsStatus === 'checking' && <ActivityIndicator size="small" color={brand.primary} />}
                      {gdocsStatus === 'ok' && <LineIcon name="check" size={18} color="#34C16F" strokeWidth={2.4} />}
                    </View>
                    <GdocsHint status={gdocsStatus} />
                  </View>
                  <View style={styles.tipRow}>
                    <LineIcon name="info" size={17} color={brand.primary} />
                    <Text style={styles.tipText}>Set sharing to “Anyone with the link can view” so Resync can read it.</Text>
                  </View>
                </View>
              )}
              {source === 'file' && !!fileError && <Text style={styles.error}>{fileError}</Text>}
            </View>

            <Callout
              tone="info"
              text="Clear chapter headings help Resync check cross-chapter coherence. Google Docs must be set to “Anyone with the link can view”."
            />
          </StepFade>
        )}

        {phase === 'confirm' && (
          <StepFade key="confirm">
            <View style={styles.segmented}>
              {(
                [
                  { key: 'file', icon: 'docLines', label: 'Word file' },
                  { key: 'gdocs', icon: 'linkAlt', label: 'Google Docs link' },
                ] as const
              ).map((o) => {
                const on = doc.source === o.key;
                return (
                  <Pressable
                    key={o.key}
                    onPress={() => {
                      if (on || tourStep !== null) return;
                      setSource(o.key);
                      goTo('upload');
                    }}
                    style={[styles.segment, on && styles.segmentOn]}
                  >
                    <LineIcon name={o.icon} size={18} color={on ? brand.ink : brand.muted} />
                    <Text style={[styles.segmentText, on && { color: brand.ink }]}>{o.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View ref={targets.confirmDoc} collapsable={false} style={styles.confirmDoc}>
              <View style={[cardStyle, styles.docCard]}>
                <View style={[styles.ic, styles.docIcon]}>
                  <LineIcon name={doc.source === 'file' ? 'docLines' : 'linkAlt'} size={20} color={brand.primary} />
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.docName}>{doc.name}</Text>
                  <Text style={styles.docMeta} numberOfLines={1}>
                    {doc.meta}
                  </Text>
                </View>
              </View>

              <View style={styles.paper}>
                <Text style={styles.paperKicker}>CHAPTER 1</Text>
                <Text style={styles.paperTitle}>Introduction</Text>
                {PREVIEW_LINES.map((w, i) => (
                  <View key={i} style={[styles.paperLine, { width: w as any }]} />
                ))}
                <LinearGradient colors={['rgba(255,255,255,0)', '#FFFFFF']} style={styles.paperFade} pointerEvents="none" />
              </View>
            </View>

            <View style={[cardStyle, styles.checks]}>
              {(doc.source === 'file'
                ? ['File opens correctly', `Under the ${MAX_MB} MB limit`]
                : ['Link opens correctly', 'Sharing is set to “Anyone with the link can view”']
              )
                .concat(template ? 'Chapter headings taken from your template' : 'Chapter headings detected automatically')
                .map((t) => (
                  <View key={t} style={styles.checkRow}>
                    <View style={styles.checkIcon}>
                      <LineIcon name="check" size={13} color={brand.success} strokeWidth={2.6} />
                    </View>
                    <Text style={styles.checkText}>{t}</Text>
                  </View>
                ))}
            </View>
          </StepFade>
        )}
      </ScrollView>

      {/* Sticky action bar */}
      <View style={[styles.sbar, { paddingBottom: 18 + insets.bottom }]}>
        {phase === 'template' && (
          <>
            <PrimaryButton label="Continue to upload" onPress={() => goTo('upload')} />
            <GhostButton
              label="Skip, use detected headings"
              onPress={() => {
                setTemplate(null);
                goTo('upload');
              }}
            />
          </>
        )}
        {phase === 'upload' && (
          <PrimaryButton label="Continue · Confirm document" disabled={!uploadValid} onPress={() => goTo('confirm')} />
        )}
        {phase === 'confirm' && (
          <>
            <View ref={targets.runButton} collapsable={false}>
              <PrimaryButton label="Yes, run scan · 1 credit" onPress={runScan} />
            </View>
            <GhostButton label="Choose a different document" onPress={() => goTo('upload')} />
          </>
        )}
      </View>

      {tourStep !== null && (
        <ScanTour
          step={tourStep}
          rect={tourRect}
          onNext={() => setTourStep((s) => Math.min(TOUR_STEPS.length - 1, (s ?? 0) + 1))}
          onBack={() => setTourStep((s) => Math.max(0, (s ?? 0) - 1))}
          onClose={endTour}
        />
      )}
    </KeyboardAvoidingView>
  );
};

const SummaryRow: React.FC<{ label: string; value: string; valueColor?: string }> = ({ label, value, valueColor }) => (
  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={[styles.summaryValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
  </View>
);

const GdocsHint: React.FC<{ status: GdocsStatus }> = ({ status }) => {
  if (status === 'idle') return null;
  const map = {
    checking: { text: 'Checking link…', color: brand.muted },
    ok: { text: 'Link opens correctly', color: '#1F7A4A' },
    invalid: { text: 'That doesn’t look like a Google Docs link.', color: brand.danger },
    private: { text: 'This document is private. Set sharing to “Anyone with the link can view”.', color: brand.danger },
  } as const;
  return <Text style={[styles.hint, { color: map[status].color }]}>{map[status].text}</Text>;
};

const PrimaryButton: React.FC<{ label: string; onPress: () => void; disabled?: boolean }> = ({ label, onPress, disabled }) => (
  <PressableScale onPress={onPress} disabled={disabled} style={[styles.primaryBtn, disabled && styles.btnOff]}>
    <Text style={styles.primaryText}>{label}</Text>
    <LineIcon name="arrowRight" size={16} color="#FFFFFF" />
  </PressableScale>
);

const GhostButton: React.FC<{ label: string; onPress: () => void }> = ({ label, onPress }) => (
  <PressableScale onPress={onPress} style={styles.ghostBtn}>
    <Text style={styles.ghostText}>{label}</Text>
  </PressableScale>
);

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: brand.page,
  },
  flex1: {
    flex: 1,
    minWidth: 0,
  },
  main: {
    padding: 16,
    paddingBottom: 18,
    gap: 12,
  },
  headBlock: {
    gap: 12,
  },
  progress: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  progressSeg: {
    flex: 1,
    height: 5,
    borderRadius: 5,
    backgroundColor: brand.border,
  },
  progressOn: {
    backgroundColor: brand.primary,
  },
  eyebrow: {
    fontFamily: fonts.mono[500],
    fontSize: 11,
    letterSpacing: 1.54,
    color: brand.primary,
  },
  h1: {
    marginTop: 6,
    marginBottom: 6,
    fontFamily: fonts.sans[800],
    fontSize: 27,
    lineHeight: 30,
    letterSpacing: -0.54,
    color: brand.ink,
  },
  sub: {
    fontFamily: fonts.sans[400],
    fontSize: 14,
    lineHeight: 21,
    color: brand.sub,
  },
  cardPad: {
    padding: 16,
    gap: 12,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ic: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: brand.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: fonts.sans[700],
    fontSize: 14.5,
    color: brand.ink,
  },
  cardSub: {
    marginTop: 1,
    fontFamily: fonts.sans[400],
    fontSize: 12.5,
    color: brand.muted,
  },

  // Drop zone
  dz: {
    minHeight: 112,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#C9C7EE',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  dzBg: {
    borderRadius: 18,
  },
  dzIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: brand.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  dzIconDone: {
    backgroundColor: '#34C16F',
    shadowColor: '#34C16F',
  },
  dzTitle: {
    fontFamily: fonts.sans[700],
    fontSize: 16,
    color: brand.ink,
    textAlign: 'center',
  },
  dzSub: {
    fontFamily: fonts.sans[400],
    fontSize: 13,
    color: brand.muted,
    textAlign: 'center',
  },
  attached: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#F3F2FF',
    borderWidth: 1.5,
    borderColor: brand.primary,
  },
  attachedName: {
    fontFamily: fonts.sans[700],
    fontSize: 14,
    color: brand.ink,
  },
  attachedMeta: {
    marginTop: 2,
    fontFamily: fonts.mono[400],
    fontSize: 11,
    color: brand.muted,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: brand.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Summary
  summary: {
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  summaryHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  pill: {
    height: 26,
    lineHeight: 26,
    paddingHorizontal: 11,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: brand.tint,
    fontFamily: fonts.sans[700],
    fontSize: 12,
    color: brand.primary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
  },
  summaryLabel: {
    fontFamily: fonts.sans[400],
    fontSize: 13.5,
    color: brand.muted,
  },
  summaryValue: {
    fontFamily: fonts.sans[700],
    fontSize: 13.5,
    color: brand.ink,
  },
  callout: {
    flexDirection: 'row',
    gap: 11,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  calloutText: {
    flex: 1,
    fontFamily: fonts.sans[400],
    fontSize: 12.5,
    lineHeight: 19,
  },

  // Upload
  uploadArea: {
    gap: 12,
  },
  sources: {
    flexDirection: 'row',
    gap: 10,
  },
  sourceCard: {
    flex: 1,
    minWidth: 0,
    padding: 14,
    gap: 10,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E1DFFA',
    backgroundColor: '#FFFFFF',
  },
  sourceOn: {
    borderColor: brand.primary,
    backgroundColor: '#F3F2FF',
  },
  sourceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sourceTitle: {
    fontFamily: fonts.sans[700],
    fontSize: 14,
    color: brand.ink,
  },
  sourceSubMono: {
    marginTop: -8,
    fontFamily: fonts.mono[400],
    fontSize: 10.5,
    color: brand.muted,
  },
  sourceSub: {
    marginTop: -8,
    fontFamily: fonts.sans[400],
    fontSize: 11.5,
    color: brand.muted,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CFCDE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: {
    borderColor: brand.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: brand.primary,
  },
  gdocsPanel: {
    minHeight: 210,
    paddingHorizontal: 22,
    paddingVertical: 20,
    justifyContent: 'center',
    gap: 14,
  },
  fld: {
    gap: 8,
  },
  fldLabel: {
    fontFamily: fonts.sans[800],
    fontSize: 11.5,
    letterSpacing: 1.04,
    color: brand.label,
  },
  inp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 50,
    paddingHorizontal: 15,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: '#FFFFFF',
  },
  inpText: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    fontFamily: fonts.sans[400],
    fontSize: 15,
    color: brand.ink,
  },
  hint: {
    marginLeft: 4,
    fontFamily: fonts.sans[600],
    fontSize: 12.5,
  },
  tipRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  tipText: {
    flex: 1,
    fontFamily: fonts.sans[400],
    fontSize: 13,
    lineHeight: 19,
    color: brand.muted,
  },
  error: {
    marginLeft: 4,
    fontFamily: fonts.sans[600],
    fontSize: 12.5,
    color: brand.danger,
  },

  // Confirm
  segmented: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#EDEDF6',
  },
  segment: {
    flex: 1,
    height: 34,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  segmentOn: {
    backgroundColor: '#FFFFFF',
    shadowColor: brand.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  segmentText: {
    fontFamily: fonts.sans[700],
    fontSize: 13,
    color: brand.muted,
  },
  confirmDoc: {
    gap: 12,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
  },
  docIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
  },
  docName: {
    fontFamily: fonts.sans[700],
    fontSize: 15,
    color: brand.ink,
  },
  docMeta: {
    marginTop: 5,
    fontFamily: fonts.mono[400],
    fontSize: 11.5,
    color: brand.muted,
  },
  paper: {
    height: 96,
    paddingVertical: 16,
    paddingHorizontal: 22,
    gap: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: brand.line,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  paperKicker: {
    fontFamily: fonts.sans[700],
    fontSize: 11,
    letterSpacing: 1.54,
    color: brand.placeholder,
    textAlign: 'center',
  },
  paperTitle: {
    marginBottom: 6,
    fontFamily: fonts.sans[800],
    fontSize: 16,
    color: brand.ink,
    textAlign: 'center',
  },
  paperLine: {
    height: 9,
    borderRadius: 6,
    backgroundColor: '#E9E8F5',
  },
  paperFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 70,
  },
  checks: {
    padding: 16,
    gap: 12,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  checkIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: brand.successTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    flex: 1,
    fontFamily: fonts.sans[600],
    fontSize: 13.5,
    color: '#2E2C52',
  },

  // Sticky bar
  sbar: {
    paddingTop: 12,
    paddingHorizontal: 16,
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: brand.line,
    shadowColor: brand.primary,
    shadowOffset: { width: 0, height: -14 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 12,
  },
  primaryBtn: {
    height: 52,
    borderRadius: 15,
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
  btnOff: {
    opacity: 0.45,
  },
  primaryText: {
    fontFamily: fonts.sans[800],
    fontSize: 15.5,
    color: '#FFFFFF',
  },
  ghostBtn: {
    height: 48,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: {
    fontFamily: fonts.sans[700],
    fontSize: 14.5,
    color: brand.ink,
  },
});
