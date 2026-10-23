import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../theme/colors';

export interface CalloutProps {
  icon?: string;
  iconColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const Callout: React.FC<CalloutProps> = ({
  icon = 'info',
  iconColor = colors.primary,
  backgroundColor = colors.primaryTint,
  borderColor = colors.calloutBorder,
  children,
  style,
}) => {
  return (
    <View
      style={[
        styles.callout,
        {
          backgroundColor,
          borderColor,
        },
        style,
      ]}
    >
      {icon && (
        <MaterialIcons
          name={icon}
          size={18}
          color={iconColor}
          style={styles.icon}
        />
      )}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  callout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  icon: {
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
});
