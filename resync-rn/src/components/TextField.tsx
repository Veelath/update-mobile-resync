import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  Pressable,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors, fonts } from '../theme/colors';

export interface TextFieldProps extends TextInputProps {
  label?: string;
  labelRight?: React.ReactNode;
  error?: string;
  isPassword?: boolean;
  containerStyle?: ViewStyle;
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  labelRight,
  error,
  isPassword = false,
  containerStyle,
  style,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label || labelRight ? (
        <View style={styles.labelRow}>
          {label ? <Text style={styles.labelText}>{label}</Text> : <View />}
          {labelRight}
        </View>
      ) : null}

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          error ? styles.inputError : null,
        ]}
      >
        <TextInput
          {...rest}
          secureTextEntry={isPassword && !showPassword}
          onFocus={(e) => {
            setIsFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            rest.onBlur?.(e);
          }}
          placeholderTextColor={colors.hint}
          style={[styles.input, style]}
        />
        {isPassword && (
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeBtn}
          >
            <MaterialIcons
              name={showPassword ? 'visibility' : 'visibility_off'}
              size={18}
              color={colors.hint}
            />
          </Pressable>
        )}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  labelText: {
    fontFamily: fonts.sans[700],
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#334155',
  },
  inputContainer: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputFocused: {
    borderColor: colors.action,
  },
  inputError: {
    borderColor: '#DC2626',
  },
  input: {
    flex: 1,
    fontFamily: fonts.sans[400],
    fontSize: 14,
    color: colors.ink,
    paddingVertical: 0,
  },
  eyeBtn: {
    padding: 6,
    marginLeft: 6,
  },
  errorText: {
    fontFamily: fonts.sans[400],
    fontSize: 12,
    color: '#DC2626',
    marginTop: 2,
  },
});
