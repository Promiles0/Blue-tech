import { useState, useRef } from 'react'

const ZOOM = 2.5
const LENS = 120

export default function LensZoom({ src, alt }) {
  const [lens, setLens]   = useState(null) // { x, y } in percent
  const imgRef            = useRef(null)

  const handleMove = (e) => {
    const rect = imgRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width)  * 100
    const y = ((e.clientY - rect.top)  / rect.height) * 100
    setLens({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) })
  }

  return (
    <div
      ref={imgRef}
      onMouseMove={handleMove}
      onMouseLeave={() => setLens(null)}
      style={{ position: 'relative', width: '100%', height: '100%', cursor: 'crosshair', overflow: 'hidden', borderRadius: 16 }}
    >
      <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />

      {lens && (
        <div style={{
          position: 'absolute',
          width: LENS, height: LENS,
          left: `calc(${lens.x}% - ${LENS / 2}px)`,
          top:  `calc(${lens.y}% - ${LENS / 2}px)`,
          borderRadius: '50%',
          border: '2px solid var(--accent-border)',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.4)',
          backgroundImage: `url(${src})`,
          backgroundSize: `${ZOOM * 100}%`,
          backgroundPosition: `${lens.x}% ${lens.y}%`,
          pointerEvents: 'none',
          zIndex: 10,
        }} />
      )}
    </div>
  )
}
