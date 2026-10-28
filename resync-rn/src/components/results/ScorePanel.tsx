import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {ScoreRing} from '../ScoreRing';
import {colors, fonts} from '../../theme/colors';
import {DIMENSION_KEYS, dimensionCard, type V7ScanResponse} from '../../services/v7Result';

const labels = ['Objectives', 'Methodology', 'Claims', 'Numeric'];
const barColors = [colors.warning, colors.success, colors.error, colors.action];

export function ScorePanel({result}: {result: V7ScanResponse}) {
  return <View style={styles.panel}>
    <ScoreRing score={result.overall_coherence_score} size={88} />
    <Text style={styles.eyebrow}>Coherence Score</Text>
    <Text style={styles.band}>{result.score_breakdown.band}</Text>
    <Text style={styles.note}>Four equal parts; a part that does not apply is left out.</Text>
    <View style={styles.grid} accessibilityLabel="Result summary">
      {DIMENSION_KEYS.map((key, index) => {
        const card = dimensionCard(result, key);
        return <View key={key} style={styles.card} accessibilityLabel={`${labels[index]}: ${card.applicable ? `${card.value}%` : 'Not applicable'}`}>
          <Text style={styles.label}>{labels[index]}</Text>
          <Text style={styles.value}>{card.applicable ? `${card.value}%` : 'Not applicable'}</Text>
          <View style={styles.track}><View style={[styles.bar, {width: `${card.value}%`, backgroundColor: barColors[index]}]} /></View>
          {!!card.caption && <Text style={styles.caption}>{card.caption}</Text>}
        </View>;
      })}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  panel: {alignItems: 'center', backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: 16, gap: 6},
  eyebrow: {fontFamily: fonts.mono[700], fontSize: 11, color: colors.muted, textTransform: 'uppercase'},
  band: {fontFamily: fonts.sans[700], fontSize: 14, color: colors.ink},
  note: {fontFamily: fonts.sans[400], fontSize: 12, color: colors.muted, textAlign: 'center'},
  grid: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8, width: '100%', marginTop: 8},
  card: {width: '48.5%', borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 10, gap: 7},
  label: {fontFamily: fonts.sans[600], fontSize: 12, color: colors.body},
  value: {fontFamily: fonts.sans[700], fontSize: 14, color: colors.ink},
  track: {height: 6, borderRadius: 3, backgroundColor: colors.track, overflow: 'hidden'},
  bar: {height: 6, borderRadius: 3},
  caption: {fontFamily: fonts.sans[400], fontSize: 11, color: colors.muted},
});
