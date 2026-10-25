// Geometry for the Blue-Tech symbol (two loops + a middle bar), redrawn from the
// official logo. Every piece is a stroked path, so the splash screen can "draw"
// it with pathLength. The right loop is the left one rotated 180° about the centre.

export const SYMBOL_VIEWBOX = '182 241 385 138'
export const SYMBOL_ASPECT = 385 / 138
export const SYMBOL_STROKE = 22

export const BLUE_DEEP = '#3D52AF'
export const BLUE_SKY = '#448ECD'

// Left loop: starts at the top-right gap, runs anticlockwise round the circle
// (centre 251,310, r 55) and leaves at the bottom-right along the 45° diagonal.
export const LOOP_LEFT = 'M 286.4 267.9 A 55 55 0 1 0 289.9 348.9 L 383 255.8'
export const LOOP_RIGHT = 'M 462.6 352.1 A 55 55 0 1 0 459.1 271.1 L 366 364.2'
export const MIDDLE_BAR = 'M 348 336.5 L 401 283.5'
