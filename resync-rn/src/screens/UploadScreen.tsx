import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  BackHandler,
  StatusBar,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainTabParamList, RootStackParamList } from '../navigation/types';
import { colors, fonts } from '../theme/colors';
import { FileTile } from '../components/FileTile';
import { Button } from '../components/Button';
import { UnderlineTabs } from '../components/UnderlineTabs';
import {ChapterTemplate} from '../data/templates';
import {flattenTemplateToc, parseTemplateFile, validateManuscriptFile} from '../services/templateParser';
import {loadSavedTemplate, saveTemplate} from '../services/templateStorage';
import {executeScan} from '../services/scanRepository';
import {validateGoogleDocsUrl} from '../services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const UploadScreen: React.FC = () => {
  const tabNav = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 states
  const [intakeTab, setIntakeTab] = useState<'file' | 'gdocs'>('file');

  // File state
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: string;
    extension: 'DOCX';
    uri: string;
    type: string;
  } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Google Docs state
  const [gdocsUrl, setGdocsUrl] = useState('');
  const [gdocsStatus, setGdocsStatus] = useState<
    'idle' | 'checking' | 'ok' | 'invalid' | 'private'
  >('idle');
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Step 2 Template state
  const [template, setTemplate] = useState<ChapterTemplate[]>([]);
  const [openChapterId, setOpenChapterId] = useState<string>('');
  const [editingHeading, setEditingHeading] = useState<{
    chapterId: string;
    index: number;
    text: string;
  } | null>(null);
  const [addingToChapterId, setAddingToChapterId] = useState<string | null>(null);
  const [newHeadingText, setNewHeadingText] = useState('');
  const [templateFileName, setTemplateFileName] = useState('');
  const [templateError, setTemplateError] = useState('');
  const [templateNotice, setTemplateNotice] = useState('');
  const [hasSavedTemplate, setHasSavedTemplate] = useState(false);

  const [activeScanStep, setActiveScanStep] = useState(0);
  const [scanAttempt, setScanAttempt] = useState(0);
  const [scanError, setScanError] = useState('');

  useEffect(() => {
    if (step !== 3) return;
    setActiveScanStep(0);
    let elapsed = 0;
    const timers = [1500, 2500, 3000, 2000].map((duration, index) => {
      elapsed += duration;
      return setTimeout(() => setActiveScanStep(index + 1), elapsed);
    });
    return () => timers.forEach(clearTimeout);
  }, [step, scanAttempt]);

  useEffect(() => {
    if (step !== 2) return;
    loadSavedTemplate().then(saved => setHasSavedTemplate(!!saved)).catch(() => setHasSavedTemplate(false));
  }, [step]);

  // Hardware back handler
  useEffect(() => {
    const onBackPress = () => {
      if (step === 2) {
        setStep(1);
        return true;
      } else if (step === 1) {
        tabNav.navigate('Home');
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );
    return () => subscription.remove();
  }, [step, tabNav]);

  // Google docs input change debounce
  const handleGdocsChange = (text: string) => {
    setGdocsUrl(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!text.trim()) {
      setGdocsStatus('idle');
      return;
    }

    setGdocsStatus('checking');
    debounceTimer.current = setTimeout(() => {
      setGdocsStatus(validateGoogleDocsUrl(text) ? 'ok' : 'invalid');
    }, 900);
  };

  const handlePickFile = async () => {
    try {
      const picker = require('@react-native-documents/picker');
      const res = await picker.pick({
        mode: 'open',
        type: [picker.types.doc, picker.types.docx],
      });
      if (res && res[0]) {
        const file = res[0];
        const error = validateManuscriptFile(file);
        if (error) {
          setSelectedFile(null);
          setFileError(error);
          return;
        }
        const sizeMb = (file.size || 0) / (1024 * 1024);
        setFileError(null);
        setSelectedFile({
          name: file.name,
          size: `${sizeMb.toFixed(1)} MB`,
          extension: 'DOCX',
          uri: file.uri,
          type: file.type || (file.name.toLowerCase().endsWith('.doc') ? picker.types.doc : picker.types.docx),
        });
      }
    } catch (e: any) {
      if (e?.code !== 'DOCUMENT_PICKER_CANCELED') {
        setFileError(e?.message || 'Could not select the file.');
      }
    }
  };

  const handleRunScan = async () => {
    setScanError('');
    setScanAttempt(attempt => attempt + 1);
    setStep(3);
    try {
      const title = getDocName();
      const templateToc = flattenTemplateToc(template);
      const result = await executeScan({
        manuscript_title: title,
        ...(intakeTab === 'file' && selectedFile ? {file: selectedFile} : {doc_url: gdocsUrl.trim()}),
        ...(templateToc ? {template_toc: templateToc} : {}),
      });
      setStep(1);
      tabNav.navigate('Home');
      rootNav.push('Report', {result, manuscriptTitle: title});
    } catch (error) {
      setScanError(error instanceof Error ? error.message : String(error));
    }
  };

  // Template helpers
  const totalChapters = template.length;
  const totalHeadings = template.reduce((acc, c) => acc + c.headings.length, 0);

  const handleResetTemplate = () => {
    setTemplate([]);
    setTemplateFileName('');
    setTemplateError('');
    setTemplateNotice('');
  };

  const handlePickTemplate = async () => {
    try {
      const picker = require('@react-native-documents/picker');
      const [file] = await picker.pick({mode: 'open', type: [picker.types.doc, picker.types.docx, picker.types.plainText]});
      setTemplateError('');
      setTemplateNotice('');
      if (!file?.name || !/\.(docx?|txt)$/i.test(file.name)) throw new Error('Unsupported template file. Please upload a .docx or .txt file.');
      if (/\.doc$/i.test(file.name)) throw new Error('Old .doc templates cannot be read. Please save this template as .docx and try again.');
      // RN's BlobModule reads picked content:// URIs through ContentResolver for fetch blob responses.
      const bytes = await (await fetch(file.uri)).arrayBuffer();
      const parsed = parseTemplateFile(file.name, bytes);
      if (!parsed.length) throw new Error('No headings found in the template. No template will be sent.');
      setTemplate(parsed);
      setTemplateFileName(file.name);
      setOpenChapterId(parsed[0].id);
    } catch (error: any) {
      if (error?.code === 'DOCUMENT_PICKER_CANCELED') return;
      setTemplate([]);
      setTemplateFileName('');
      setTemplateError(error instanceof Error ? error.message : 'Could not parse the template file. No template will be sent.');
    }
  };

  const handleSaveTemplate = async () => {
    try {
      const save = async () => {
        try {
          await saveTemplate(template);
          setHasSavedTemplate(true);
          setTemplateNotice('Template saved.');
        } catch { setTemplateError('Could not save the template.'); }
      };
      if (await loadSavedTemplate()) Alert.alert('Overwrite saved template?', '', [
        {text: 'Cancel', style: 'cancel'}, {text: 'Overwrite', onPress: save},
      ]);
      else await save();
    } catch { setTemplateError('Could not save the template.'); }
  };

  const handleLoadTemplate = async () => {
    try {
      const saved = await loadSavedTemplate();
      if (!saved) return;
      setTemplate(saved);
      setTemplateFileName('');
      setOpenChapterId(saved[0]?.id || '');
      setTemplateError('');
      setTemplateNotice('Saved template loaded.');
    } catch { setTemplateError('Could not load the saved template.'); }
  };

  const handleRemoveHeading = (chId: string, hIndex: number) => {
    setTemplate((prev) =>
      prev.map((c) =>
        c.id === chId
          ? { ...c, headings: c.headings.filter((_, idx) => idx !== hIndex) }
          : c
      )
    );
  };

  const handleCommitHeadingEdit = (chId: string, hIndex: number, newTxt: string) => {
    if (newTxt.trim()) {
      setTemplate((prev) =>
        prev.map((c) =>
          c.id === chId
            ? {
                ...c,
                headings: c.headings.map((h, idx) =>
                  idx === hIndex ? newTxt.trim() : h
                ),
              }
            : c
        )
      );
    }
    setEditingHeading(null);
  };

  const handleAddHeadingCommit = (chId: string) => {
    if (newHeadingText.trim()) {
      setTemplate((prev) =>
        prev.map((c) =>
          c.id === chId
            ? { ...c, headings: [...c.headings, newHeadingText.trim()] }
            : c
        )
      );
    }
    setAddingToChapterId(null);
    setNewHeadingText('');
  };

  const isStep1Valid =
    (intakeTab === 'file' && !!selectedFile) ||
    (intakeTab === 'gdocs' && gdocsStatus === 'ok');

  const getDocName = () => {
    if (selectedFile) return selectedFile.name;
    if (intakeTab === 'gdocs' && gdocsStatus === 'ok')
      return 'Google Docs manuscript';
    return 'Your Manuscript';
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            if (step === 1) tabNav.navigate('Home');
            else if (step === 2) setStep(1);
          }}
          style={styles.headerBtn}
        >
          <MaterialIcons
            name={step === 1 ? 'close' : 'arrow-back'}
            size={20}
            color={colors.ink}
          />
        </Pressable>

        <Text style={styles.headerTitle}>New scan</Text>
        <Text style={styles.headerCount}>
          <Text style={{ fontFamily: fonts.mono[700], color: colors.ink }}>
            0{step}
          </Text>{' '}
          / 03
        </Text>
      </View>

      {/* Progress Segments */}
      <View style={styles.progressRow}>
        {(['Manuscript', 'Template', 'Scan'] as const).map((label, idx) => {
          const reached = step >= idx + 1;
          return (
            <View key={label} style={styles.progressSegCol}>
              <View
                style={[
                  styles.progressSegBar,
                  { backgroundColor: reached ? colors.primary : colors.track },
                ]}
              />
              <Text
                style={[
                  styles.progressSegLabel,
                  { color: reached ? colors.ink : colors.hint },
                ]}
              >
                {label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* STEP 1: MANUSCRIPT INTAKE */}
      {step === 1 && (
        <View style={styles.stepContainer}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* StepHead */}
            <View style={styles.stepHead}>
              <View style={styles.stepHeadTagRow}>
                <Text style={styles.stepHeadTag}>STEP 1 · MANUSCRIPT INTAKE</Text>
              </View>
              <Text style={styles.stepTitle}>Upload manuscript</Text>
              <Text style={styles.stepSub}>
                ReSync detects section headings from your manuscript. A chapter template is optional in Step 2.
              </Text>
              <Text style={styles.stepSub}>
                Check logical links between consecutive sections, citations, and the AI-text indicator in one report.
              </Text>
            </View>

            {/* Label: Manuscript */}
            <View style={styles.sectionBlock}>
              <Text style={styles.fieldLabel}>MANUSCRIPT SOURCE</Text>
              <UnderlineTabs
                items={[
                  { id: 'file', label: 'Upload Word file', icon: 'upload-file' },
                  { id: 'gdocs', label: 'Google Docs', icon: 'link' },
                ]}
                selectedId={intakeTab}
                onSelect={(id) => setIntakeTab(id as any)}
                activeColor={colors.ink}
              />

              <View style={styles.intakeBody}>
                {intakeTab === 'file' ? (
                  !selectedFile ? (
                    <Pressable
                      onPress={handlePickFile}
                      style={styles.fileDropZone}
                    >
                      <View style={styles.dropZoneIcon}>
                        <MaterialIcons
                          name="upload"
                          size={24}
                          color={colors.primary}
                        />
                      </View>
                      <Text style={styles.dropZoneTitle}>Choose a file</Text>
                      <Text style={styles.dropZoneMeta}>
                        .doc, .docx  max 25 MB
                      </Text>
                      {fileError && (
                        <Text style={styles.fileErrorText}>{fileError}</Text>
                      )}
                    </Pressable>
                  ) : (
                    <View style={styles.fileChosenWrapper}>
                      <FileTile
                        extension={selectedFile.extension}
                        name={selectedFile.name}
                        meta={selectedFile.size}
                        onRemove={() => setSelectedFile(null)}
                      />
                      <View style={styles.successRow}>
                        <MaterialIcons
                          name="check-circle"
                          size={16}
                          color="#10B981"
                        />
                        <Text style={styles.successText}>
                          Manuscript attached</Text>
                      </View>
                    </View>
                  )
                ) : (
                  <View style={styles.gdocsWrapper}>
                    {/* Google Docs Input Row */}
                    <View
                      style={[
                        styles.gdocsInputRow,
                        gdocsStatus === 'ok' && { borderColor: '#10B981' },
                        (gdocsStatus === 'invalid' || gdocsStatus === 'private') && {
                          borderColor: '#F59E0B',
                        },
                      ]}
                    >
                      <MaterialIcons
                        name="link"
                        size={18}
                        color={colors.hint}
                        style={{ marginRight: 8 }}
                      />
                      <TextInput
                        value={gdocsUrl}
                        onChangeText={handleGdocsChange}
                        placeholder="https://docs.google.com/document/d/..."
                        placeholderTextColor={colors.hint}
                        style={styles.gdocsInput}
                        autoCapitalize="none"
                      />
                      {!!gdocsUrl && (
                        <Pressable
                          onPress={() => {
                            setGdocsUrl('');
                            setGdocsStatus('idle');
                          }}
                          style={styles.clearCircle}
                        >
                          <MaterialIcons name="close" size={15} color={colors.hint} />
                        </Pressable>
                      )}
                    </View>

                    {/* States */}
                    {gdocsStatus === 'idle' && (
                      <Text style={styles.gdocsHelper}>
                        Sharing must be set to{' '}
                        <Text style={{ fontFamily: fonts.sans[700] }}>
                          Anyone with the link can view</Text>
                        .
                      </Text>
                    )}

                    {gdocsStatus === 'checking' && (
                      <View style={styles.gdocsCheckingRow}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={styles.gdocsCheckingText}>
                          Opening your document…
                        </Text>
                      </View>
                    )}

                    {gdocsStatus === 'invalid' && (
                      <Text style={styles.gdocsInvalidText}>
                        That doesn't look like a Google Docs link.
                      </Text>
                    )}

                    {gdocsStatus === 'ok' && (
                      <View style={styles.gdocsOkWrapper}>
                        <FileTile
                          extension="GDOC"
                          tone="#1A73E8"
                          name={gdocsUrl}
                          meta="Google Docs link"
                          onRemove={() => {
                            setGdocsUrl('');
                            setGdocsStatus('idle');
                          }}
                        />
                        <View style={styles.successRow}>
                          <MaterialIcons
                            name="check-circle"
                            size={16}
                            color="#10B981"
                          />
                          <Text style={styles.successText}>
                            Link format accepted; sharing will be checked during scan</Text>
                        </View>
                      </View>
                    )}

                    {gdocsStatus === 'private' && (
                      <View style={styles.privateCard}>
                        <View style={styles.privateTitleRow}>
                          <MaterialIcons name="lock" size={18} color="#D97706" />
                          <Text style={styles.privateTitle}>
                            This document is private
                          </Text>
                        </View>
                        <Text style={styles.privateStep}>
                          1. Open it in Google Docs and tap Share
                        </Text>
                        <Text style={styles.privateStep}>
                          2. Under General access, choose Anyone with the link
                        </Text>
                        <Text style={styles.privateStep}>
                          3. Keep the role as Viewer, then paste again
                        </Text>
                        <Pressable
                          onPress={() => handleGdocsChange(gdocsUrl)}
                          style={{ marginTop: 4 }}
                        >
                          <Text style={styles.checkAgainLink}>Check again</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View
            style={[
              styles.footer,
              { paddingBottom: Math.max(insets.bottom, 24) },
            ]}
          >
            <Button
              title="Continue to template"
              variant="dark"
              size="lg"
              icon="arrow-forward"
              iconPosition="right"
              disabled={!isStep1Valid}
              onPress={() => setStep(2)}
              style={{ width: '100%' }}
            />
          </View>
        </View>
      )}

      {/* STEP 2: CHAPTER TEMPLATE */}
      {step === 2 && (
        <View style={styles.stepContainer}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* StepHead */}
            <View style={styles.stepHead}>
              <View style={styles.stepHeadTagRow}>
                <Text style={styles.stepHeadTag}>STEP 2 · CHAPTER TEMPLATE</Text>
              </View>
              <Text style={styles.stepTitle}>Optional chapter template</Text>
              <Text style={styles.stepSub}>
                Skip this step to let ReSync detect sections. Attach or load a template only if your school requires specific headings.
              </Text>
            </View>

            <View style={styles.templateControls}>
              <Button title="Attach template (.docx, .txt)" onPress={handlePickTemplate} />
              <Text style={styles.stepSub}>.txt: one CHAPTER: or HEADING: item per line</Text>
              {!!templateFileName && <Text style={styles.stepSub}>{templateFileName}</Text>}
              <View style={styles.templateActions}>
                <Pressable onPress={handleSaveTemplate} disabled={!totalHeadings} style={styles.resetBtn}>
                  <Text style={styles.resetBtnText}>Save Template</Text>
                </Pressable>
                <Pressable onPress={handleLoadTemplate} disabled={!hasSavedTemplate} style={styles.resetBtn}>
                  <Text style={styles.resetBtnText}>Use Saved Template</Text>
                </Pressable>
                <Pressable onPress={handleResetTemplate} style={styles.resetBtn}>
                  <Text style={styles.resetBtnText}>Clear Template</Text>
                </Pressable>
              </View>
              {!!templateNotice && <Text style={styles.successText}>{templateNotice}</Text>}
              {!!templateError && <Text style={styles.fileErrorText}>{templateError}</Text>}
            </View>

            {/* Stats Bar */}
            <View style={styles.statsBar}>
              <View style={styles.statsGroup}>
                <View style={styles.statItem}>
                  <Text style={styles.statNum}>{totalChapters}</Text>
                  <Text style={styles.statLabel}>chapters</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNum}>{totalHeadings}</Text>
                  <Text style={styles.statLabel}>headings</Text>
                </View>
              </View>

            </View>

            {/* Accordion List */}
            <View style={styles.accordionContainer}>
              {template.map((ch) => {
                const isOpen = openChapterId === ch.id;
                return (
                  <View key={ch.id} style={styles.chItem}>
                    <Pressable
                      onPress={() => setOpenChapterId(isOpen ? '' : ch.id)}
                      style={styles.chHeader}
                    >
                      <Text
                        style={[
                          styles.chNumber,
                          { color: isOpen ? colors.primary : colors.hint },
                        ]}
                      >
                        {ch.number}
                      </Text>
                      <View style={styles.chTitleCol}>
                        <Text style={styles.chTitleText}>{ch.title}</Text>
                        <Text style={styles.chHeadingCount}>
                          {ch.headings.length} headings
                        </Text>
                      </View>
                      <MaterialIcons
                        name={isOpen ? 'expand-less' : 'expand-more'}
                        size={22}
                        color={colors.hint}
                      />
                    </Pressable>

                    {/* Expanded Content */}
                    {isOpen && (
                      <View style={styles.chipsWrap}>
                        {ch.headings.map((h, hIdx) => {
                          const isEditing =
                            editingHeading?.chapterId === ch.id &&
                            editingHeading?.index === hIdx;

                          if (isEditing) {
                            return (
                              <TextInput
                                key={hIdx}
                                autoFocus
                                value={editingHeading.text}
                                onChangeText={(t) =>
                                  setEditingHeading({
                                    ...editingHeading,
                                    text: t,
                                  })
                                }
                                onBlur={() =>
                                  handleCommitHeadingEdit(
                                    ch.id,
                                    hIdx,
                                    editingHeading.text
                                  )
                                }
                                onSubmitEditing={() =>
                                  handleCommitHeadingEdit(
                                    ch.id,
                                    hIdx,
                                    editingHeading.text
                                  )
                                }
                                style={styles.chipInput}
                              />
                            );
                          }

                          return (
                            <View key={hIdx} style={styles.chip}>
                              <Pressable
                                onPress={() =>
                                  setEditingHeading({
                                    chapterId: ch.id,
                                    index: hIdx,
                                    text: h,
                                  })
                                }
                              >
                                <Text style={styles.chipText}>{h}</Text>
                              </Pressable>
                              <Pressable
                                onPress={() => handleRemoveHeading(ch.id, hIdx)}
                                style={styles.chipRemove}
                              >
                                <MaterialIcons
                                  name="close"
                                  size={14}
                                  color={colors.hint}
                                />
                              </Pressable>
                            </View>
                          );
                        })}

                        {/* Add Heading chip or inline input */}
                        {addingToChapterId === ch.id ? (
                          <TextInput
                            autoFocus
                            placeholder="Heading name..."
                            value={newHeadingText}
                            onChangeText={setNewHeadingText}
                            onBlur={() => handleAddHeadingCommit(ch.id)}
                            onSubmitEditing={() => handleAddHeadingCommit(ch.id)}
                            style={styles.chipInput}
                          />
                        ) : (
                          <Pressable
                            onPress={() => {
                              setAddingToChapterId(ch.id);
                              setNewHeadingText('');
                            }}
                            style={styles.addHeadingChip}
                          >
                            <MaterialIcons
                              name="add"
                              size={16}
                              color={colors.primary}
                            />
                            <Text style={styles.addHeadingText}>Add heading</Text>
                          </Pressable>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>

          {/* Footer */}
          <View
            style={[
              styles.footer,
              { paddingBottom: Math.max(insets.bottom, 24) },
            ]}
          >
            <Button
               title="Run Coherence Scan (1 Credit)"
              icon="manage-search"
              size="lg"
              onPress={handleRunScan}
              style={{ width: '100%' }}
            />
          </View>
        </View>
      )}

      {/* STEP 3: SCANNING / PROCESSING */}
      {step === 3 && (
        <View style={styles.step3Container}>
          <View style={styles.step3CenterBlock}>
            <Text style={styles.stepTitle}>Analyzing your manuscript</Text>
            <Text style={styles.stepSub}>Running 4 checks across consecutive sections</Text>
            {[
              'Reading your manuscript',
              'Checking section flow',
              'Analyzing logical coherence',
              'Verifying citation access',
              'Finalizing your report',
            ].map((label, index) => (
              <View key={label} style={styles.checkItemRow}>
                <Text style={[styles.checkItemText, {color: index === activeScanStep ? colors.ink : colors.hint}]}>
                  {label}
                </Text>
                {index === activeScanStep ? <ActivityIndicator size="small" color={colors.primary} /> :
                  index < activeScanStep ? <MaterialIcons name="check" size={18} color={colors.primary} /> : null}
              </View>
            ))}
            {!!scanError && <Text style={styles.fileErrorText}>{scanError}</Text>}
            {!!scanError && <Button title="Try again" onPress={handleRunScan} />}
          </View>

          {/* Footer note */}
          <View
            style={[
              styles.step3Footer,
              { paddingBottom: Math.max(insets.bottom, 24) },
            ]}
          >
            <MaterialIcons
              name="notifications-none"
              size={20}
              color={colors.muted}
            />
            <Text style={styles.step3FooterText}>
              Keep this screen open until your report is ready.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: fonts.sans[600],
    fontSize: 15,
    color: colors.ink,
  },
  headerCount: {
    fontFamily: fonts.mono[400],
    fontSize: 12,
    color: colors.muted,
  },
  progressRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 4,
    marginBottom: 8,
  },
  progressSegCol: {
    flex: 1,
    gap: 4,
  },
  progressSegBar: {
    height: 3,
    borderRadius: 2,
  },
  progressSegLabel: {
    fontFamily: fonts.sans[600],
    fontSize: 11,
  },
  stepContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
    gap: 26,
  },
  stepHead: {
    gap: 8,
  },
  stepHeadTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepHeadTag: {
    fontFamily: fonts.mono[500],
    fontSize: 11,
    color: colors.primary,
    letterSpacing: 1.2,
  },
  scopeBadge: {
    backgroundColor: colors.primaryTint,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  scopeBadgeText: {
    fontFamily: fonts.mono[700],
    fontSize: 9.5,
    color: colors.primary,
  },
  stepTitle: {
    fontFamily: fonts.display[700],
    fontSize: 27,
    lineHeight: 31,
    letterSpacing: -0.6,
    color: colors.ink,
  },
  stepSub: {
    fontFamily: fonts.sans[400],
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted,
  },
  sectionBlock: {},
  fieldLabel: {
    fontFamily: fonts.mono[500],
    fontSize: 11,
    color: colors.muted,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  scopeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  scopeCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  scopeSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  scopeUnselected: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  scopeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scopeIconTile: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  radioActive: {
    borderWidth: 5,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  radioInactive: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  scopeTitle: {
    fontFamily: fonts.sans[700],
    fontSize: 15,
    color: colors.ink,
  },
  scopeDesc: {
    fontFamily: fonts.sans[400],
    fontSize: 12.5,
    lineHeight: 17,
    color: colors.muted,
  },
  intakeBody: {
    marginTop: 14,
  },
  fileDropZone: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 16,
    backgroundColor: colors.soft,
    paddingVertical: 26,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 10,
  },
  dropZoneIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropZoneTitle: {
    fontFamily: fonts.sans[600],
    fontSize: 15,
    color: colors.ink,
  },
  dropZoneMeta: {
    fontFamily: fonts.mono[400],
    fontSize: 11.5,
    color: colors.muted,
  },
  fileErrorText: {
    fontFamily: fonts.sans[400],
    fontSize: 12,
    color: '#D97706',
  },
  fileChosenWrapper: {
    gap: 10,
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 4,
  },
  successText: {
    fontFamily: fonts.sans[500],
    fontSize: 12.5,
    color: '#047857',
  },
  gdocsWrapper: {
    gap: 12,
  },
  gdocsInputRow: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingLeft: 14,
    paddingRight: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  gdocsInput: {
    flex: 1,
    fontFamily: fonts.mono[400],
    fontSize: 13,
    color: colors.ink,
    paddingVertical: 0,
  },
  pasteBtn: {
    height: 38,
    borderRadius: 9,
    backgroundColor: colors.ink,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pasteBtnText: {
    fontFamily: fonts.sans[600],
    fontSize: 13,
    color: colors.white,
  },
  clearCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gdocsHelper: {
    fontFamily: fonts.sans[400],
    fontSize: 12.5,
    color: colors.muted,
  },
  gdocsCheckingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gdocsCheckingText: {
    fontFamily: fonts.sans[400],
    fontSize: 13.5,
    color: colors.body,
  },
  gdocsInvalidText: {
    fontFamily: fonts.sans[500],
    fontSize: 12.5,
    color: '#B45309',
  },
  gdocsOkWrapper: {
    gap: 10,
  },
  privateCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  privateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  privateTitle: {
    fontFamily: fonts.sans[700],
    fontSize: 14,
    color: '#D97706',
  },
  privateStep: {
    fontFamily: fonts.mono[400],
    fontSize: 11,
    color: '#B45309',
  },
  checkAgainLink: {
    fontFamily: fonts.sans[700],
    fontSize: 13,
    color: colors.primary,
  },
  statsBar: {
    backgroundColor: colors.soft,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  statItem: {
    alignItems: 'flex-start',
  },
  templateControls: {
    gap: 10,
    marginBottom: 20,
  },
  templateActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statNum: {
    fontFamily: fonts.display[700],
    fontSize: 20,
    color: colors.ink,
  },
  statLabel: {
    fontFamily: fonts.sans[400],
    fontSize: 11.5,
    color: colors.muted,
  },
  resetBtn: {
    height: 34,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resetBtnText: {
    fontFamily: fonts.sans[600],
    fontSize: 12.5,
    color: colors.ink,
  },
  accordionContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  chItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  chHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    gap: 12,
  },
  chNumber: {
    fontFamily: fonts.mono[700],
    fontSize: 12,
    width: 20,
  },
  chTitleCol: {
    flex: 1,
    gap: 2,
  },
  chTitleText: {
    fontFamily: fonts.sans[600],
    fontSize: 15,
    color: colors.ink,
  },
  chHeadingCount: {
    fontFamily: fonts.sans[400],
    fontSize: 12,
    color: colors.muted,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingLeft: 32,
    paddingBottom: 16,
  },
  chip: {
    height: 34,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingLeft: 11,
    paddingRight: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipText: {
    fontFamily: fonts.sans[400],
    fontSize: 13,
    color: colors.body,
  },
  chipRemove: {
    padding: 2,
  },
  chipInput: {
    height: 34,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    fontFamily: fonts.sans[400],
    fontSize: 13,
    color: colors.ink,
  },
  addHeadingChip: {
    height: 34,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addHeadingText: {
    fontFamily: fonts.sans[600],
    fontSize: 13,
    color: colors.primary,
  },
  creditBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  creditBadgeText: {
    fontFamily: fonts.mono[400],
    fontSize: 12,
    color: colors.white,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.white,
  },
  step3Container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 22,
    justifyContent: 'center',
  },
  step3CenterBlock: {
    gap: 12,
    paddingVertical: 12,
  },
  checkItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  checkItemText: {
    fontFamily: fonts.sans[400],
    fontSize: 14.5,
    flex: 1,
  },
  step3Footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 16,
    marginTop: 20,
  },
  step3FooterText: {
    flex: 1,
    fontFamily: fonts.sans[400],
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  },
});
