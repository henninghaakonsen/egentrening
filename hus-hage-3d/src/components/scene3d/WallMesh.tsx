import React, { useMemo } from 'react'
import type { Wall } from '../../types'

interface Props {
  wall: Wall
  selected: boolean
  onClick: () => void
}

interface Seg {
  cx: number  // center along wall (0..len)
  cy: number  // center height (world Y)
  wx: number  // width along wall
  wy: number  // height
}

/**
 * Splits the wall into solid box segments, cutting out rectangular openings.
 * Returns segments in wall-local coordinates (cx along wall, cy = height center).
 */
function wallSegments(wall: Wall): Seg[] {
  const dx = wall.end.x - wall.start.x
  const dy = wall.end.y - wall.start.y
  const len = Math.hypot(dx, dy)
  if (len < 0.05) return []

  const h = wall.height
  const segs: Seg[] = []

  const openings = wall.openings
    .map((op) => ({
      x0: Math.max(0.001, op.offset),
      x1: Math.min(len - 0.001, op.offset + op.width),
      y0: Math.max(0, op.sillHeight),
      y1: Math.min(h, op.sillHeight + op.height),
    }))
    .filter((op) => op.x1 > op.x0 + 0.001 && op.y1 > op.y0 + 0.001)
    .sort((a, b) => a.x0 - b.x0)

  if (openings.length === 0) {
    segs.push({ cx: len / 2, cy: h / 2, wx: len, wy: h })
    return segs
  }

  // Collect x-cut points at each opening boundary
  const xs = [
    ...new Set([0, ...openings.flatMap((o) => [o.x0, o.x1]), len]),
  ].sort((a, b) => a - b)

  for (let i = 0; i < xs.length - 1; i++) {
    const x0 = xs[i]
    const x1 = xs[i + 1]
    const wx = x1 - x0
    if (wx < 0.001) continue
    const cx = (x0 + x1) / 2

    const op = openings.find((o) => o.x0 <= x0 + 0.001 && o.x1 >= x1 - 0.001)
    if (!op) {
      // Solid column
      segs.push({ cx, cy: h / 2, wx, wy: h })
    } else {
      // Sill piece (below opening)
      if (op.y0 > 0.001) {
        segs.push({ cx, cy: op.y0 / 2, wx, wy: op.y0 })
      }
      // Lintel piece (above opening)
      if (op.y1 < h - 0.001) {
        segs.push({ cx, cy: (op.y1 + h) / 2, wx, wy: h - op.y1 })
      }
    }
  }

  return segs
}

export default function WallMesh({ wall, selected, onClick }: Props) {
  const segs = useMemo(
    () => wallSegments(wall),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      wall.start.x, wall.start.y, wall.end.x, wall.end.y,
      wall.height, wall.thickness,
      JSON.stringify(wall.openings),
    ]
  )

  const dx = wall.end.x - wall.start.x
  const dy = wall.end.y - wall.start.y
  const len = Math.hypot(dx, dy)

  if (len < 0.05 || segs.length === 0) return null

  // Angle of wall in the horizontal XZ plane (2D plan Y → 3D Z)
  const angle = Math.atan2(dy, dx)

  // Unit vectors: wall direction and normal in the XZ plane
  const dirX = dx / len
  const dirZ = dy / len

  const color = selected ? '#ff9090' : wall.color

  return (
    <group onClick={(e) => { e.stopPropagation(); onClick() }}>
      {segs.map((seg, i) => (
        <mesh
          key={i}
          // Position: start + seg.cx along wall direction, seg.cy upward
          // BoxGeometry is centred at origin, so local Z (thickness) is already ±t/2
          position={[
            wall.start.x + seg.cx * dirX,
            seg.cy,
            wall.start.y + seg.cx * dirZ,
          ]}
          // Rotate around world Y so the box's local X aligns with the wall direction
          rotation={[0, -angle, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[seg.wx, seg.wy, wall.thickness]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
      ))}
    </group>
  )
}
