import React from 'react';
import * as SvgModule from 'react-native-svg';

const Svg = SvgModule.Svg || (SvgModule as any).default || SvgModule;
const Path = SvgModule.Path;
const G = SvgModule.G;

interface Props {
  width?: number;
  height?: number;
  color?: string;
}

/**
 * Iconic Resync Interlocking S Monogram
 * Perfectly matching the official splash and dashboard brand mark
 */
export const ResyncMonogram: React.FC<Props> = ({
  width = 60,
  height = 74,
  color = '#0A2AB8',
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 100 120" fill="none">
      <G fill={color}>
        {/* Upper swoosh: sweeps over the top left and curves gracefully into the center */}
        <Path
          d="M 78 34
             C 78 18, 64 8, 48 8
             C 28 8, 14 22, 14 44
             C 14 62, 26 72, 42 78
             C 38 72, 36 65, 36 58
             C 36 46, 42 38, 52 32
             C 44 32, 28 38, 28 46
             C 28 32, 37 20, 48 20
             C 60 20, 66 26, 66 34
             C 66 44, 56 52, 48 58
             L 54 68
             C 68 58, 78 48, 78 34
             Z"
        />
        {/* Lower swoosh: sweeps under the bottom right and curves into the center */}
        <Path
          d="M 22 86
             C 22 102, 36 112, 52 112
             C 72 112, 86 98, 86 76
             C 86 58, 74 48, 58 42
             C 62 48, 64 55, 64 62
             C 64 74, 58 82, 48 88
             C 56 88, 72 82, 72 74
             C 72 88, 63 100, 52 100
             C 40 100, 34 94, 34 86
             C 34 76, 44 68, 52 62
             L 46 52
             C 32 62, 22 72, 22 86
             Z"
        />
      </G>
    </Svg>
  );
};
