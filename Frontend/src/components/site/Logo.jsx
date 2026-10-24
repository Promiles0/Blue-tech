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

// The brand navy, fixed in both light and dark themes.
const BRAND_BLUE = '#354380'

// Renders the wordmark as two CSS-mask layers so each part can recolor:
// the dot + "Blue" (/logo-mark-blue.svg) and the outlined "-Tech"
// (/logo-mark-tech.svg). Both default to the brand navy in every theme.
// Passing `color` paints the whole logo one color, e.g. all white on the navy
// panels; `accent` overrides just the dot + "Blue".
export default function Logo({ height = 15, color, accent, style, ...rest }) {
  const techColor = color ?? BRAND_BLUE
  const blueColor = accent ?? color ?? BRAND_BLUE
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
