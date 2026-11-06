import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '../theme/colors';
import { brand } from '../theme/brand';
import { LineIcon, LineIconName } from './LineIcon';

interface Props {
  title: string;
  initials: string;
  onBack?: () => void;
  onAvatarPress?: () => void;
  /** Optional icon button shown before the avatar (e.g. replay the scan tour). */
  action?: { icon: LineIconName; label: string; onPress: () => void };
}

/** White top bar from the account mockups: logo mark (or back button), page title, initials avatar. */
export const AppHeader: React.FC<Props> = ({ title, initials, onBack, onAvatarPress, action }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingTop: insets.top + 14 }]}>
      <View style={styles.left}>
        {onBack ? (
          <Pressable onPress={onBack} style={styles.back} hitSlop={6}>
            <LineIcon name="back" color={brand.ink} />
          </Pressable>
        ) : (
          <Image source={require('../assets/images/resync_symbol_color.png')} style={styles.mark} resizeMode="contain" />
        )}
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
      <View style={styles.right}>
        {action && (
          <Pressable onPress={action.onPress} style={styles.action} hitSlop={6} accessibilityLabel={action.label}>
            <LineIcon name={action.icon} size={20} color={brand.sub} />
          </Pressable>
        )}
        <Pressable onPress={onAvatarPress} disabled={!onAvatarPress} style={styles.avatar} hitSlop={4}>
          <Text style={styles.avatarText}>{initials}</Text>
        </Pressable>
      </View>
    </View>
  );
};

export const initialsOf = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: brand.line,
  },
  left: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mark: {
    width: 23,
    height: 30,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1DFFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flexShrink: 1,
    fontFamily: fonts.sans[800],
    fontSize: 16,
    color: brand.ink,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  action: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.sans[800],
    fontSize: 14,
    color: '#FFFFFF',
  },
});
