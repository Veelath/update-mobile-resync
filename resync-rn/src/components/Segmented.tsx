import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors, fonts } from '../theme/colors';

export interface SegmentedItem {
  id: string;
  label: string;
  count?: number;
}

export interface SegmentedProps {
  items: SegmentedItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  style?: ViewStyle;
}

export const Segmented: React.FC<SegmentedProps> = ({
  items,
  selectedId,
  onSelect,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {items.map((item) => {
        const isActive = item.id === selectedId;
        return (
          <Pressable
            key={item.id}
            onPress={() => onSelect(item.id)}
            style={({ pressed }) => [
              styles.item,
              isActive && styles.itemActive,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text
              style={[
                styles.label,
                {
                  color: isActive ? colors.ink : colors.muted,
                  fontFamily: isActive ? fonts.sans[600] : fonts.sans[500],
                },
              ]}
            >
              {item.label}
            </Text>
            {item.count !== undefined && (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: isActive ? colors.primaryTint : colors.track,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    {
                      color: isActive ? colors.primary : colors.muted,
                    },
                  ]}
                >
                  {item.count}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    padding: 3,
  },
  item: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemActive: {
    backgroundColor: colors.white,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  label: {
    fontSize: 12.5,
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 6,
  },
  badgeText: {
    fontFamily: fonts.sans[700],
    fontSize: 10.5,
  },
});
