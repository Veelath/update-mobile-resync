import React from 'react';
import { View, TextInput, StyleSheet, ViewStyle } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors, fonts } from '../theme/colors';

export interface SearchFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: ViewStyle;
}

export const SearchField: React.FC<SearchFieldProps> = ({
  value,
  onChangeText,
  placeholder = 'Search scans',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <MaterialIcons name="search" size={18} color={colors.hint} style={styles.icon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.hint}
        style={styles.input}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontFamily: fonts.sans[400],
    fontSize: 13.5,
    color: colors.ink,
    paddingVertical: 0,
  },
});
