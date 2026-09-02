const LOGO_ASPECT_RATIO = 1272.8 / 233.115

// Renders /logo-mark.svg as a CSS mask so it recolors with `color` (defaults to
// var(--text), matching the site's light/dark theme) instead of the file's own
// baked-in white fill.
export default function Logo({ height = 15, color = 'var(--text)', style, ...rest }) {
  return (
    <span
      role="img"
      aria-label="Blue-Tech"
      style={{
        display: 'inline-block',
        flexShrink: 0,
        height,
        aspectRatio: LOGO_ASPECT_RATIO,
        backgroundColor: color,
        WebkitMaskImage: 'url(/logo-mark.svg)',
        maskImage: 'url(/logo-mark.svg)',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskPosition: 'left center',
        maskPosition: 'left center',
        ...style,
      }}
      {...rest}
    />
  )
}
