import React from 'react';
import * as SvgModule from 'react-native-svg';

const Svg = SvgModule.Svg || (SvgModule as any).default || SvgModule;
const { Path, Rect, Circle } = SvgModule;

/**
 * Stroke icons lifted from the A-series mockups (24x24 grid, 2px round strokes).
 * Each entry lists its shapes so the screens can render the exact glyphs.
 */
type Shape =
  | { p: string }
  | { rect: { x: number; y: number; width: number; height: number; rx: number } }
  | { circle: { cx: number; cy: number; r: number } };

const ICONS = {
  back: [{ p: 'M15 5l-7 7 7 7' }],
  arrowRight: [{ p: 'M5 12h14M13 6l6 6-6 6' }],
  mail: [{ rect: { x: 3, y: 5, width: 18, height: 14, rx: 2.5 } }, { p: 'M3.5 7l8.5 6 8.5-6' }],
  lock: [{ rect: { x: 4.5, y: 10.5, width: 15, height: 10, rx: 2.5 } }, { p: 'M8 10.5V8a4 4 0 0 1 8 0v2.5' }],
  eye: [{ p: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z' }, { circle: { cx: 12, cy: 12, r: 3 } }],
  eyeOff: [{ p: 'M3 3l18 18' }, { p: 'M10.6 5.1A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.8 9.8 0 0 0 5.4-1.6' }, { p: 'M9.9 9.9a3 3 0 0 0 4.2 4.2' }],
  check: [{ p: 'M5 12.5l4.5 4.5L19 7.5' }],
  star: [{ p: 'M12 3.5l2.7 5.5 6 .9-4.4 4.2 1 6-5.3-2.8-5.3 2.8 1-6L3.3 9.9l6-.9z' }],
  bell: [{ p: 'M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z' }, { p: 'M10 21h4' }],
  upload: [{ p: 'M12 16V5' }, { p: 'M7 9l5-5 5 5' }, { p: 'M5 19h14' }],
  download: [{ p: 'M12 4v12' }, { p: 'M7 11l5 5 5-5' }, { p: 'M4 18v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1' }],
  doc: [{ p: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z' }, { p: 'M14 3v5h5' }],
  docLines: [{ p: 'M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z' }, { p: 'M14 3v5h5' }, { p: 'M9 13h6M9 17h4' }],
  link: [{ p: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1' }, { p: 'M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1' }],
  chat: [{ p: 'M5 5h14v10H9l-4 4z' }],
  sparkle: [{ p: 'M12 4l1.8 4.7L18.5 10.5l-4.7 1.8L12 17l-1.8-4.7L5.5 10.5l4.7-1.8z' }],
  template: [{ rect: { x: 3.5, y: 3.5, width: 17, height: 17, rx: 2.5 } }, { p: 'M3.5 9h17' }, { p: 'M9.5 9v11.5' }],
  scanCheck: [{ circle: { cx: 10.5, cy: 10.5, r: 6.5 } }, { p: 'M20 20l-4.9-4.9' }, { p: 'M8 10.5l2 2 3.5-4' }],
  home: [{ p: 'M4 11l8-7 8 7' }, { p: 'M6 10v10h12V10' }],
  scan: [{ p: 'M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3' }, { p: 'M4 12h16' }],
  user: [{ circle: { cx: 12, cy: 8, r: 4 } }, { p: 'M4 20c0-4 3.6-6 8-6s8 2 8 6' }],
  plus: [{ p: 'M12 5v14M5 12h14' }],
  pencil: [{ p: 'M4 20h4l11-11-4-4L4 16z' }],
  camera: [{ p: 'M4 8h3l2-3h6l2 3h3v11H4z' }, { circle: { cx: 12, cy: 13, r: 3.5 } }],
  phone: [{ p: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A15 15 0 0 1 4 5a1 1 0 0 1 1-1z' }],
  cap: [{ p: 'M3 9l9-5 9 5-9 5z' }, { p: 'M7 11.5V16c0 1.5 2.2 3 5 3s5-1.5 5-3v-4.5' }],
  book: [{ p: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z' }, { p: 'M5 17a3 3 0 0 1 3-3h11' }],
  calendar: [{ rect: { x: 4, y: 5, width: 16, height: 15, rx: 2.5 } }, { p: 'M4 10h16M9 3v4M15 3v4' }],
  page: [{ p: 'M6 3h8l4 4v14H6z' }, { p: 'M14 3v4h4M9 12h6M9 16h4' }],
  info: [{ circle: { cx: 12, cy: 12, r: 9 } }, { p: 'M12 11v5M12 8v.01' }],
  clock: [{ circle: { cx: 12, cy: 12, r: 9 } }, { p: 'M12 7v5l3 2' }],
  help: [{ circle: { cx: 12, cy: 12, r: 9 } }, { p: 'M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17v.01' }],
  linkAlt: [{ p: 'M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1' }, { p: 'M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1' }],
  close: [{ p: 'M6 6l12 12M18 6L6 18' }],
  bolt: [{ p: 'M13 3L5 13.5h6L10 21l8-10.5h-6z' }],
  copy: [{ rect: { x: 9, y: 9, width: 11, height: 11, rx: 2.5 } }, { p: 'M5 15V6a2 2 0 0 1 2-2h8' }],
  pin: [{ p: 'M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z' }, { circle: { cx: 12, cy: 10, r: 2.3 } }],
  tap: [{ p: 'M9 11V5a2 2 0 014 0v6' }, { p: 'M13 10a2 2 0 014 0v3a6 6 0 01-6 6h-1a5 5 0 01-4-2l-2-3a2 2 0 013-2l1 1' }],
  coin: [{ circle: { cx: 12, cy: 12, r: 9 } }, { p: 'M12 7v10' }, { p: 'M15 9.5c-.6-1-1.7-1.5-3-1.5-1.7 0-3 .8-3 2.2 0 3 6 1.6 6 4.4 0 1.4-1.3 2.4-3 2.4-1.4 0-2.6-.6-3.2-1.7' }],
  checkCircle: [{ circle: { cx: 12, cy: 12, r: 9 } }, { p: 'M8 12.5l2.7 2.7L16 9.5' }],
  exportDown: [{ p: 'M12 4v11' }, { p: 'M7 11l5 5 5-5' }, { p: 'M5 20h14' }],
  logout: [{ p: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3' }, { p: 'M10 17l-5-5 5-5' }, { p: 'M5 12h11' }],
} satisfies Record<string, Shape[]>;

export type LineIconName = keyof typeof ICONS;

interface Props {
  name: LineIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const LineIcon: React.FC<Props> = ({ name, size = 18, color = 'currentColor', strokeWidth = 2 }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {(ICONS[name] as Shape[]).map((s, i) =>
      'p' in s ? <Path key={i} d={s.p} /> : 'rect' in s ? <Rect key={i} {...s.rect} /> : <Circle key={i} {...s.circle} />,
    )}
  </Svg>
);
