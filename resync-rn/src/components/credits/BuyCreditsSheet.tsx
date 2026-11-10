import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { fonts } from '../../theme/colors';
import { brand } from '../../theme/brand';
import { LineIcon } from '../LineIcon';
import { PressableScale } from '../PressableScale';
import { PaymentMethod, PurchaseProof, purchaseCreditsApi } from '../../services/api';
import { readBase64 } from '../../services/wordDoc';

const PACKAGES = [
  { name: 'Quick Scan', credits: 1, desc: 'One manuscript, one check', price: '₱25', unit: '₱25.00 / credit' },
  { name: 'Starter', credits: 5, desc: 'Small batch of revisions', price: '₱125', unit: '₱25.00 / credit' },
  { name: 'Standard', credits: 20, desc: 'Full defense preparation', price: '₱450', unit: '₱22.50 / credit', off: '10% OFF' },
  { name: 'Research Team', credits: 50, desc: 'Multi-author or lab use', price: '₱1,000', unit: '₱20.00 / credit', off: '20% OFF' },
];

const METHODS: { id: PaymentMethod; label: string; verb: string; payee: string; proof: string; payer: string }[] = [
  { id: 'card', label: 'Card', verb: '', payee: '', proof: '', payer: '' },
  { id: 'gcash', label: 'GCash', verb: 'GCash', payee: 'Resync · 0900 000 0000', proof: 'Send the exact amount, then screenshot the receipt.', payer: 'Name on the GCash account (optional)' },
  { id: 'bank_transfer', label: 'Bank transfer', verb: 'Bank transfer', payee: 'Resync · Bank 0000-0000-00', proof: 'Transfer the exact amount, then photograph or screenshot the deposit slip.', payer: 'Name on the account you paid from (optional)' },
];

const MAX_PROOF_BYTES = 2 * 1024 * 1024;

const creditsWord = (n: number) => `${n} ${n === 1 ? 'Credit' : 'Credits'}`;

type ProofFile = { name: string; type: string; uri: string };

interface Props {
  visible: boolean;
  userName: string;
  onClose: () => void;
  onPurchased: (balance: number, added: number) => void;
}

/** Two-step purchase from the Credits mockup: pick a package, then a payment method. */
export const BuyCreditsSheet: React.FC<Props> = ({ visible, userName, onClose, onPurchased }) => {
  const { width, height } = useWindowDimensions();
  const [step, setStep] = useState<'packages' | 'payment'>('packages');
  const [selected, setSelected] = useState(2);
  const [methodIndex, setMethodIndex] = useState(0);
  const [payerName, setPayerName] = useState('');
  const [reference, setReference] = useState('');
  const [proofFile, setProofFile] = useState<ProofFile | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setStep('packages');
    setSelected(2);
    setMethodIndex(0);
    setPayerName('');
    setReference('');
    setProofFile(null);
    setError(null);
  }, [visible]);

  const pack = PACKAGES[selected];
  const method = METHODS[methodIndex];
  const isCard = method.id === 'card';

  const pickProof = async () => {
    try {
      const picker = require('@react-native-documents/picker');
      const [file] = await picker.pick({ mode: 'open', type: [picker.types.images, picker.types.pdf] });
      if (!file?.uri) return;
      if ((file.size || 0) > MAX_PROOF_BYTES) {
        setError('That file is over the 2 MB limit.');
        return;
      }
      setError(null);
      setProofFile({ name: file.name || 'receipt', type: file.type || 'image/jpeg', uri: file.uri });
    } catch {
      // Cancelling the picker lands here
    }
  };

  const submit = async () => {
    if (busy) return;
    const ref = reference.trim();
    if (!isCard && proofFile && !/^[A-Za-z0-9 -]{4,40}$/.test(ref)) {
      setError('Add the reference number from your receipt, at least 4 letters or numbers.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      let proof: PurchaseProof | null = null;
      if (!isCard && proofFile) {
        proof = {
          reference_number: ref,
          payer_name: payerName.trim() || undefined,
          file_name: proofFile.name.slice(0, 200),
          content_type: proofFile.type,
          proof_data: await readBase64(proofFile.uri),
        };
      }
      const result = await purchaseCreditsApi(pack.credits, method.id, proof);
      onPurchased(result.balance, result.credit_amount);
    } catch (err: any) {
      setError(err?.message || 'Unable to add credits. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const header = (
    <View style={styles.head}>
      <View style={styles.flex1}>
        <Text style={styles.title}>Buy credits</Text>
        <Text style={styles.sub}>Credits never expire and can unlock a full report.</Text>
      </View>
      <Pressable onPress={onClose} style={styles.close} hitSlop={6} accessibilityLabel="Close">
        <LineIcon name="close" size={18} color="#4A476B" />
      </Pressable>
    </View>
  );

  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={[StyleSheet.absoluteFill, styles.scrim]} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { width: width - 20, maxHeight: height * 0.9 }]}>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {header}

            {step === 'packages' ? (
              <>
                {[0, 2].map((start) => (
                  <View key={start} style={styles.packRow}>
                    {PACKAGES.slice(start, start + 2).map((p) => {
                      const on = PACKAGES[selected] === p;
                      return (
                        <Pressable key={p.name} onPress={() => setSelected(PACKAGES.indexOf(p))} style={[styles.pack, on && styles.packOn]}>
                          {!!p.off && (
                            <View style={styles.off}>
                              <Text style={styles.offText}>{p.off}</Text>
                            </View>
                          )}
                          <View style={[styles.radio, on && styles.radioOn]}>{on && <View style={styles.radioDot} />}</View>
                          <Text style={styles.packName}>{p.name}</Text>
                          <Text style={styles.packCredits}>
                            <Text style={styles.packCount}>{p.credits}</Text> {p.credits === 1 ? 'Credit' : 'Credits'}
                          </Text>
                          <Text style={styles.packDesc}>{p.desc}</Text>
                          <View style={styles.packFoot}>
                            <Text style={styles.packPrice}>{p.price}</Text>
                            <Text style={styles.packUnit}>{p.unit}</Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                ))}

                <View style={styles.summary}>
                  <Text style={styles.summaryText}>
                    Selected: <Text style={styles.summaryBold}>{creditsWord(pack.credits)}</Text> for <Text style={styles.summaryBold}>{pack.price}</Text>
                  </Text>
                  <Text style={styles.summaryNote}>Instant ledger crediting</Text>
                </View>

                <View style={styles.actions}>
                  <Pressable onPress={onClose} hitSlop={6}>
                    <Text style={styles.cancel}>Cancel</Text>
                  </Pressable>
                  <PressableScale onPress={() => setStep('payment')} style={styles.continue}>
                    <Text style={styles.continueText}>Continue to Payment</Text>
                    <LineIcon name="arrowRight" size={16} color="#FFFFFF" />
                  </PressableScale>
                </View>
              </>
            ) : (
              <>
                <View style={styles.tabs}>
                  {METHODS.map((m, i) => (
                    <Pressable
                      key={m.id}
                      onPress={() => {
                        setMethodIndex(i);
                        setError(null);
                      }}
                      style={[styles.tab, i === 2 && styles.tabWide, i === methodIndex && styles.tabOn]}
                    >
                      <Text style={[styles.tabText, i === methodIndex && styles.tabTextOn]}>{m.label}</Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.order}>
                  <Pressable onPress={() => setStep('packages')} hitSlop={6}>
                    <Text style={styles.orderBack}>← Back to packages</Text>
                  </Pressable>
                  <Text style={styles.orderText} numberOfLines={1}>
                    <Text style={styles.summaryBold}>
                      {creditsWord(pack.credits)} — {pack.price}
                    </Text>
                  </Text>
                </View>

                {isCard ? (
                  <View style={styles.form}>
                    <Text style={styles.note}>This is a test purchase. No card is charged, so these sample details can’t be changed.</Text>
                    <Text style={styles.label}>CARDHOLDER NAME</Text>
                    <View style={styles.input}>
                      <Text style={styles.inputText}>{userName}</Text>
                    </View>
                    <Text style={styles.label}>CARD NUMBER</Text>
                    <View style={styles.input}>
                      <Text style={styles.inputMono}>4242  4242  4242  4242</Text>
                    </View>
                    <View style={styles.formRow}>
                      <View style={styles.flex1}>
                        <Text style={styles.label}>EXPIRATION DATE</Text>
                        <View style={styles.input}>
                          <Text style={styles.inputMono}>12/28</Text>
                        </View>
                      </View>
                      <View style={styles.flex1}>
                        <Text style={styles.label}>CVC / CVV</Text>
                        <View style={styles.input}>
                          <Text style={styles.inputMono}>123</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.form}>
                    <Text style={styles.note}>
                      <Text style={styles.summaryBold}>1. Pay {pack.price}</Text> by {method.verb} to <Text style={styles.summaryBold}>{method.payee}</Text>. {method.proof}
                    </Text>
                    <Text style={styles.note}>
                      <Text style={styles.summaryBold}>2. Add your receipt details</Text> below if you like. This is a test purchase, so they are optional.
                    </Text>
                    <Text style={styles.label}>{method.payer.toUpperCase()}</Text>
                    <TextInput value={payerName} onChangeText={setPayerName} placeholder="Juan Dela Cruz" placeholderTextColor="#9A98B8" style={[styles.input, styles.inputText]} />
                    <Text style={styles.label}>REFERENCE NUMBER (OPTIONAL)</Text>
                    <TextInput
                      value={reference}
                      onChangeText={setReference}
                      placeholder="e.g. 1234 567 890"
                      placeholderTextColor="#9A98B8"
                      maxLength={40}
                      style={[styles.input, styles.inputMono]}
                    />
                    <Text style={styles.label}>PROOF OF PAYMENT (OPTIONAL)</Text>
                    <Pressable onPress={pickProof} style={styles.upload}>
                      <Text style={styles.uploadTitle} numberOfLines={1}>
                        {proofFile ? proofFile.name : 'Choose a screenshot or PDF'}
                      </Text>
                      <Text style={styles.uploadHint}>{proofFile ? 'Tap to choose a different file' : 'PNG, JPEG, WebP or PDF · up to 2 MB'}</Text>
                    </Pressable>
                  </View>
                )}

                {!!error && <Text style={styles.error}>{error}</Text>}

                <PressableScale onPress={submit} style={styles.buyWrap}>
                  <LinearGradient colors={['#1D1BD0', '#2B35E6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.buy}>
                    {busy ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.buyText}>
                        {isCard ? `BUY ${pack.credits} ${pack.credits === 1 ? 'CREDIT' : 'CREDITS'} · ${pack.price}` : `ADD ${pack.credits} ${pack.credits === 1 ? 'CREDIT' : 'CREDITS'}`}
                      </Text>
                    )}
                  </LinearGradient>
                </PressableScale>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
    minWidth: 0,
  },
  root: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 10,
  },
  scrim: {
    backgroundColor: 'rgba(11,10,46,0.5)',
  },
  sheet: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  body: {
    padding: 16,
    gap: 14,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  title: {
    fontFamily: fonts.sans[800],
    fontSize: 19,
    color: brand.ink,
  },
  sub: {
    marginTop: 3,
    fontFamily: fonts.sans[400],
    fontSize: 12.5,
    color: '#6B6890',
  },
  close: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pack: {
    flex: 1,
    minWidth: 0,
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E3E2F4',
    backgroundColor: '#FFFFFF',
  },
  packOn: {
    borderWidth: 2,
    borderColor: '#1D5BFF',
    backgroundColor: '#F5F8FF',
    paddingTop: 11,
    paddingHorizontal: 11,
    paddingBottom: 9,
  },
  off: {
    position: 'absolute',
    right: 12,
    top: -8,
    zIndex: 1,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: '#1D5BFF',
  },
  offText: {
    fontFamily: fonts.sans[800],
    fontSize: 8.5,
    color: '#FFFFFF',
  },
  radio: {
    position: 'absolute',
    right: 10,
    top: 12,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#CFCDE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: {
    backgroundColor: '#1D5BFF',
    borderColor: '#1D5BFF',
  },
  radioDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  packName: {
    fontFamily: fonts.sans[800],
    fontSize: 12,
    color: brand.ink,
  },
  packCredits: {
    marginTop: 6,
    fontFamily: fonts.sans[400],
    fontSize: 12.5,
    color: '#6B6890',
  },
  packCount: {
    fontFamily: fonts.sans[800],
    fontSize: 22,
    color: brand.ink,
  },
  packDesc: {
    marginTop: 2,
    minHeight: 30,
    fontFamily: fonts.sans[400],
    fontSize: 11.5,
    lineHeight: 15,
    color: '#6B6890',
  },
  packFoot: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 2,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEEDF8',
  },
  packPrice: {
    fontFamily: fonts.sans[800],
    fontSize: 17,
    color: brand.ink,
  },
  packUnit: {
    fontFamily: fonts.mono[500],
    fontSize: 9,
    color: '#8B89AD',
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EEEDFB',
    backgroundColor: '#F7F7FD',
  },
  summaryText: {
    flexShrink: 1,
    fontFamily: fonts.sans[400],
    fontSize: 12,
    color: '#4A476B',
  },
  summaryBold: {
    fontFamily: fonts.sans[800],
    color: brand.ink,
  },
  summaryNote: {
    fontFamily: fonts.sans[400],
    fontSize: 11.5,
    color: '#6B6890',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 18,
  },
  cancel: {
    fontFamily: fonts.sans[700],
    fontSize: 13.5,
    color: '#4A476B',
  },
  continue: {
    height: 46,
    paddingHorizontal: 20,
    borderRadius: 13,
    backgroundColor: '#1D1BD0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  continueText: {
    fontFamily: fonts.sans[800],
    fontSize: 14.5,
    color: '#FFFFFF',
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#E3E2F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabWide: {
    flex: 1.2,
  },
  tabOn: {
    borderColor: '#1D5BFF',
    backgroundColor: '#EEF3FF',
  },
  tabText: {
    fontFamily: fonts.sans[700],
    fontSize: 12.5,
    color: '#4A476B',
  },
  tabTextOn: {
    color: '#1D3FD0',
  },
  order: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEDF8',
  },
  orderBack: {
    fontFamily: fonts.sans[400],
    fontSize: 11.5,
    color: '#4A476B',
  },
  orderText: {
    flexShrink: 1,
    fontSize: 11.5,
  },
  form: {
    gap: 6,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  note: {
    marginBottom: 2,
    fontFamily: fonts.sans[400],
    fontSize: 12,
    lineHeight: 18,
    color: '#4A476B',
  },
  label: {
    marginTop: 4,
    marginBottom: 6,
    fontFamily: fonts.sans[700],
    fontSize: 10.5,
    letterSpacing: 0.63,
    color: '#6B6890',
  },
  input: {
    height: 42,
    paddingHorizontal: 12,
    paddingVertical: 0,
    justifyContent: 'center',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#E3E2F4',
  },
  inputText: {
    fontFamily: fonts.sans[400],
    fontSize: 13,
    color: brand.ink,
  },
  inputMono: {
    fontFamily: fonts.mono[500],
    fontSize: 13,
    color: brand.ink,
  },
  upload: {
    alignItems: 'center',
    gap: 5,
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CFCDE6',
    backgroundColor: '#F9F9FD',
  },
  uploadTitle: {
    fontFamily: fonts.sans[800],
    fontSize: 12.5,
    color: brand.ink,
  },
  uploadHint: {
    fontFamily: fonts.sans[400],
    fontSize: 10.5,
    color: '#8B89AD',
  },
  error: {
    fontFamily: fonts.sans[600],
    fontSize: 12.5,
    lineHeight: 18,
    color: brand.danger,
  },
  buyWrap: {
    borderRadius: 13,
    overflow: 'hidden',
  },
  buy: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyText: {
    fontFamily: fonts.sans[800],
    fontSize: 13.5,
    letterSpacing: 0.27,
    color: '#FFFFFF',
  },
});
