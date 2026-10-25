import { useId } from 'react'
import {
  SYMBOL_VIEWBOX, SYMBOL_ASPECT, SYMBOL_STROKE, BLUE_DEEP, BLUE_SKY,
  LOOP_LEFT, LOOP_RIGHT, MIDDLE_BAR,
} from './logoSymbol'

// The symbol on its own, filled with the deep→sky brand gradient (or one flat
// `color`, e.g. white on the navy panels).
export function LogoSymbol({ height = 24, color, style, ...rest }) {
  const gradId = useId()
  const stroke = color ?? `url(#${gradId})`
  return (
    <svg
      viewBox={SYMBOL_VIEWBOX}
      height={height}
      width={typeof height === 'number' ? height * SYMBOL_ASPECT : undefined}
      fill="none"
      stroke={stroke}
      strokeWidth={SYMBOL_STROKE}
      strokeLinecap="round"
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0, aspectRatio: SYMBOL_ASPECT, ...style }}
      {...rest}
    >
      {!color && (
        <defs>
          <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1="185" y1="0" x2="564" y2="0">
            <stop offset="0" stopColor={BLUE_DEEP} />
            <stop offset="1" stopColor={BLUE_SKY} />
          </linearGradient>
        </defs>
      )}
      <path d={LOOP_LEFT} />
      <path d={MIDDLE_BAR} />
      <path d={LOOP_RIGHT} />
    </svg>
  )
}

// Symbol + "BLUETECH" wordmark. `height` is the wordmark's cap size reference
// (kept compatible with the old wordmark sizes); the symbol is drawn 1.5× taller.
// The word follows the theme (var(--text)); passing `color` paints everything
// that one color, symbol included.
export default function Logo({ height = 15, color, style, ...rest }) {
  const symbolHeight = typeof height === 'number' ? height * 1.5 : `calc(${height} * 1.5)`
  const fontSize = typeof height === 'number' ? height * 1.05 : `calc(${height} * 1.05)`
  return (
    <span
      role="img"
      aria-label="Blue-Tech"
      style={{
        display: 'inline-flex', alignItems: 'center', flexShrink: 0,
        gap: '0.45em', fontSize, lineHeight: 1,
        ...style,
      }}
      {...rest}
    >
      <LogoSymbol height={symbolHeight} color={color} />
      <span
        aria-hidden="true"
        style={{
          fontFamily: '"Montserrat", var(--font-sans)', fontWeight: 600,
          letterSpacing: '0.06em', color: color ?? 'var(--text)', whiteSpace: 'nowrap',
        }}
      >
        BLUETECH
      </span>
    </span>
  )
}
