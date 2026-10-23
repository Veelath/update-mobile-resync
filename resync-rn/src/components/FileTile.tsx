import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors, fonts } from '../theme/colors';

export interface FileTileProps {
  extension: 'DOCX' | 'PDF' | 'GDOC';
  name: string;
  meta: string;
  tone?: string;
  onRemove?: () => void;
  style?: ViewStyle;
}

export const FileTile: React.FC<FileTileProps> = ({
  extension,
  name,
  meta,
  tone,
  onRemove,
  style,
}) => {
  const getExtensionColor = (): string => {
    if (tone) return tone;
    switch (extension) {
      case 'PDF':
        return colors.error;
      case 'GDOC':
        return colors.gdocs;
      case 'DOCX':
      default:
        return colors.action;
    }
  };

  const extBg = getExtensionColor();

  return (
    <View style={[styles.container, style]}>
      {/* Doc glyph */}
      <View style={styles.docGlyph}>
        <View style={styles.innerLine} />
        <View style={[styles.innerLine, { width: 18 }]} />
        <View style={[styles.innerLine, { width: 14 }]} />

        {/* Extension tag overlapping bottom-left */}
        <View style={[styles.extTag, { backgroundColor: extBg }]}>
          <Text style={styles.extText}>{extension}</Text>
        </View>
      </View>

      {/* Info column */}
      <View style={styles.infoCol}>
        <Text style={styles.fileName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.fileMeta}>{meta}</Text>
      </View>

      {/* Remove button */}
      {onRemove && (
        <Pressable
          onPress={onRemove}
          style={({ pressed }) => [
            styles.removeCircle,
            { opacity: pressed ? 0.8 : 1 },
          ]}
          android_ripple={{ color: 'rgba(0,0,0,0.1)', borderless: true }}
        >
          <MaterialIcons name="close" size={16} color={colors.hint} />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 12,
    gap: 12,
    backgroundColor: colors.white,
  },
  docGlyph: {
    width: 38,
    height: 46,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.soft,
    paddingTop: 8,
    paddingLeft: 6,
    position: 'relative',
    justifyContent: 'flex-start',
  },
  innerLine: {
    height: 2,
    width: 22,
    backgroundColor: colors.borderStrong,
    marginBottom: 4,
    borderRadius: 1,
  },
  extTag: {
    position: 'absolute',
    bottom: -4,
    left: -4,
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  extText: {
    fontFamily: fonts.mono[700],
    fontSize: 8.5,
    color: colors.white,
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  fileName: {
    fontFamily: fonts.sans[600],
    fontSize: 14,
    color: colors.ink,
    marginBottom: 2,
  },
  fileMeta: {
    fontFamily: fonts.sans[400],
    fontSize: 12,
    color: colors.muted,
  },
  removeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
