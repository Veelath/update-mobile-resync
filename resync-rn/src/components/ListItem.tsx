import React from 'react';
import {
  Pressable,
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors, fonts } from '../theme/colors';

export interface ListItemProps {
  title: string;
  meta?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  selected?: boolean;
  disabled?: boolean;
  showChevron?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export const ListItem: React.FC<ListItemProps> = ({
  title,
  meta,
  leading,
  trailing,
  selected = false,
  disabled = false,
  showChevron = false,
  onPress,
  style,
}) => {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.container,
        selected && styles.selectedContainer,
        disabled && styles.disabledContainer,
        { opacity: pressed && !disabled ? 0.85 : disabled ? 0.4 : 1 },
        style,
      ]}
      android_ripple={!disabled ? { color: '#F1F5F9' } : undefined}
    >
      {leading && <View style={styles.leadingCol}>{leading}</View>}
      <View style={styles.contentCol}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      </View>
      {trailing ? (
        <View style={styles.trailingCol}>{trailing}</View>
      ) : showChevron ? (
        <MaterialIcons name="chevron-right" size={20} color={colors.hint} />
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedContainer: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  disabledContainer: {
    opacity: 0.4,
  },
  leadingCol: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentCol: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.sans[600],
    fontSize: 14.5,
    color: colors.ink,
  },
  meta: {
    fontFamily: fonts.sans[400],
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  trailingCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
