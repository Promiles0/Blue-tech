const LOGO_ASPECT_RATIO = 1272.8 / 233.115

const maskLayer = (src, backgroundColor) => ({
  position: 'absolute',
  inset: 0,
  backgroundColor,
  WebkitMaskImage: `url(${src})`,
  maskImage: `url(${src})`,
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskSize: 'contain',
  maskSize: 'contain',
  WebkitMaskPosition: 'left center',
  maskPosition: 'left center',
})

// Renders the wordmark as two CSS-mask layers so each part recolors:
// the dot + "Blue" (/logo-mark-blue.svg) take the brand blue, and the outlined
// "-Tech" (/logo-mark-tech.svg) takes `color` (defaults to var(--text), matching
// the site's light/dark theme). Passing `color` without `accent` paints the
// whole logo one color, e.g. all white on the navy panels.
export default function Logo({ height = 15, color, accent, style, ...rest }) {
  const techColor = color ?? 'var(--text)'
  const blueColor = accent ?? color ?? 'var(--brand-strong)'
  return (
    <span
      role="img"
      aria-label="Blue-Tech"
      style={{
        display: 'inline-block',
        position: 'relative',
        flexShrink: 0,
        height,
        aspectRatio: LOGO_ASPECT_RATIO,
        ...style,
      }}
      {...rest}
    >
      <span style={maskLayer('/logo-mark-blue.svg', blueColor)} />
      <span style={maskLayer('/logo-mark-tech.svg', techColor)} />
    </span>
  )
}
