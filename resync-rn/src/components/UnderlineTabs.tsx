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

export interface UnderlineTabItem {
  id: string;
  label: string;
  icon?: string;
  count?: number;
}

export interface UnderlineTabsProps {
  items: UnderlineTabItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  activeColor?: string; // primary or ink
  height?: number;
  style?: ViewStyle;
}

export const UnderlineTabs: React.FC<UnderlineTabsProps> = ({
  items,
  selectedId,
  onSelect,
  activeColor = colors.primary,
  height = 44,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {items.map((tab) => {
        const isActive = tab.id === selectedId;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onSelect(tab.id)}
            style={({ pressed }) => [
              styles.tab,
              {
                height,
                borderBottomColor: isActive ? activeColor : 'transparent',
                borderBottomWidth: isActive ? 2 : 0,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View style={styles.tabContent}>
              {tab.icon && (
                <MaterialIcons
                  name={tab.icon}
                  size={18}
                  color={isActive ? activeColor : colors.muted}
                  style={styles.icon}
                />
              )}
              <Text
                style={[
                  styles.label,
                  {
                    color: isActive ? activeColor : colors.muted,
                    fontFamily: isActive ? fonts.sans[600] : fonts.sans[500],
                  },
                ]}
              >
                {tab.label}
              </Text>
              {tab.count !== undefined && (
                <View
                  style={[
                    styles.countBadge,
                    {
                      backgroundColor: isActive ? colors.primaryTint : colors.track,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.countText,
                      {
                        color: isActive ? colors.primary : colors.muted,
                      },
                    ]}
                  >
                    {tab.count}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 6,
  },
  label: {
    fontSize: 13.5,
  },
  countBadge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 6,
  },
  countText: {
    fontFamily: fonts.sans[700],
    fontSize: 10.5,
  },
});
