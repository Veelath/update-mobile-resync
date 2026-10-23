import React from 'react';
import { Image, ImageStyle } from 'react-native';
import * as SvgModule from 'react-native-svg';

const Svg = SvgModule.Svg || (SvgModule as any).default || SvgModule;
const Path = SvgModule.Path;
const G = SvgModule.G;

interface Props {
  width?: number;
  height?: number;
  color?: string;
  usePhoto?: boolean;
  style?: ImageStyle;
}

/**
 * Iconic Resync Interlocking S Monogram
 * Supports both exact photo rendering and crisp vector geometry
 */
export const ResyncMonogram: React.FC<Props> = ({
  width = 60,
  height = 84,
  color = '#0024D9',
  usePhoto,
  style,
}) => {
  // If usePhoto is explicitly true or color is default blue, render the exact user photo
  if (usePhoto || (usePhoto === undefined && color === '#0024D9')) {
    return (
      <Image
        source={require('../assets/images/resync_symbol.png')}
        style={[{ width, height }, style]}
        resizeMode="contain"
      />
    );
  }

  return (
    <Svg width={width} height={height} viewBox="0 0 200 280" fill="none">
      <G fill={color}>
        {/* Upper lobe: precision circular arc with 45-degree terminal and central diagonal cut */}
        <Path d="M 125 63 L 151 37 A 72 72 0 1 0 49 139 L 83 105 A 36 36 0 0 1 125 63 Z" />
        {/* Lower lobe: 180-degree point-reflected matching ribbon */}
        <Path d="M 75 217 L 49 243 A 72 72 0 1 0 151 141 L 117 175 A 36 36 0 0 1 75 217 Z" />
      </G>
    </Svg>
  );
};

