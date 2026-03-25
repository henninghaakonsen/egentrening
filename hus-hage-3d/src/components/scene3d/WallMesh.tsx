import React, { useMemo } from 'react'
import * as THREE from 'three'
import type { Wall } from '../../types'

interface Props {
  wall: Wall
  selected: boolean
  onClick: () => void
}

interface Seg {
  cx: number  // center along wall (world units from start)
  cy: number  // center height (world Y)
  wx: number  // half-width along wall
  wy: number  // half-height
}

function wallSegments(wall: Wall): Seg[] {
  const dx = wall.end.x - wall.start.x
  const dy = wall.end.y - wall.start.y
  const len = Math.hypot(dx, dy)
  if (len < 0.05) return []

  const h = wall.height
  const openings = wall.openings
    .map((op) => ({
      x0: Math.max(0.001, op.offset),
      x1: Math.min(len - 0.001, op.offset + op.width),
      y0: Math.max(0, op.sillHeight),
      y1: Math.min(h, op.sillHeight + op.height),
    }))
    .filter((op) => op.x1 > op.x0 + 0.001 && op.y1 > op.y0 + 0.001)
    .sort((a, b) => a.x0 - b.x0)

  const segs: Seg[] = []

  if (openings.length === 0) {
    segs.push({ cx: len / 2, cy: h / 2, wx: len / 2, wy: h / 2 })
    return segs
  }

  const xs = [
    ...new Set([0, ...openings.flatMap((o) => [o.x0, o.x1]), len]),
  ].sort((a, b) => a - b)

  for (let i = 0; i < xs.length - 1; i++) {
    const x0 = xs[i], x1 = xs[i + 1]
    const bw = x1 - x0
    if (bw < 0.001) continue
    const cx = (x0 + x1) / 2
    const op = openings.find((o) => o.x0 <= x0 + 0.001 && o.x1 >= x1 - 0.001)
    if (!op) {
      segs.push({ cx, cy: h / 2, wx: bw / 2, wy: h / 2 })
    } else {
      if (op.y0 > 0.001)
        segs.push({ cx, cy: op.y0 / 2, wx: bw / 2, wy: op.y0 / 2 })
      if (op.y1 < h - 0.001)
        segs.push({ cx, cy: (op.y1 + h) / 2, wx: bw / 2, wy: (h - op.y1) / 2 })
    }
  }

  return segs
}

/**
 * Builds a BufferGeometry whose vertices are computed directly in world space.
 * No rotation matrix needed — eliminates all orientation ambiguity.
 *
 * Coordinate mapping: 2D plan (x, y) → 3D world (x, Y, z) where plan-Y = world-Z.
 */
function buildWallGeometry(wall: Wall): THREE.BufferGeometry {
  const dx = wall.end.x - wall.start.x
  const dy = wall.end.y - wall.start.y
  const len = Math.hypot(dx, dy)
  if (len < 0.05) return new THREE.BufferGeometry()

  const segs = wallSegments(wall)
  if (segs.length === 0) return new THREE.BufferGeometry()

  // Wall direction unit vector (in XZ plane)
  const dX = dx / len   // world-X component
  const dZ = dy / len   // world-Z component  (plan Y → world Z)

  // Wall normal (90° CCW from direction, in XZ plane)
  const nX = -dZ        // = -(dy/len) = dy/len ... wait: CCW rot of (dX,dZ): (-dZ, dX)
  const nZ = dX

  const ht = wall.thickness / 2   // half-thickness in normal direction
  const sx = wall.start.x
  const sz = wall.start.y   // plan Y → world Z

  const positions: number[] = []
  const indices: number[] = []

  for (const seg of segs) {
    const base = positions.length / 3

    // Centre of this segment in XZ
    const cx = sx + seg.cx * dX
    const cz = sz + seg.cx * dZ

    // Y extents
    const yLo = seg.cy - seg.wy
    const yHi = seg.cy + seg.wy

    // Half-length along wall direction
    const hw = seg.wx

    // 8 corners (named by [±wall, ±normal, ±height])
    // front = +normal side, back = -normal side
    // left  = -wall dir, right = +wall dir
    //
    // Vertex layout (index offset):
    //  0: front-left-bottom
    //  1: front-right-bottom
    //  2: back-left-bottom
    //  3: back-right-bottom
    //  4: front-left-top
    //  5: front-right-top
    //  6: back-left-top
    //  7: back-right-top

    const flx = cx - hw * dX + ht * nX, flz = cz - hw * dZ + ht * nZ
    const frx = cx + hw * dX + ht * nX, frz = cz + hw * dZ + ht * nZ
    const blx = cx - hw * dX - ht * nX, blz = cz - hw * dZ - ht * nZ
    const brx = cx + hw * dX - ht * nX, brz = cz + hw * dZ - ht * nZ

    // Bottom 4
    positions.push(flx, yLo, flz)  // 0 front-left-bottom
    positions.push(frx, yLo, frz)  // 1 front-right-bottom
    positions.push(blx, yLo, blz)  // 2 back-left-bottom
    positions.push(brx, yLo, brz)  // 3 back-right-bottom
    // Top 4
    positions.push(flx, yHi, flz)  // 4 front-left-top
    positions.push(frx, yHi, frz)  // 5 front-right-top
    positions.push(blx, yHi, blz)  // 6 back-left-top
    positions.push(brx, yHi, brz)  // 7 back-right-top

    const b = base
    // Front face (+normal): 0,1,4 + 1,5,4
    indices.push(b, b+1, b+4,  b+1, b+5, b+4)
    // Back face (-normal):  2,3,6 + 3,7,6  (reversed winding for outward normal)
    indices.push(b+3, b+2, b+6,  b+3, b+6, b+7)
    // Left face: 0,2,4 + 2,6,4
    indices.push(b+2, b+0, b+4,  b+2, b+4, b+6)
    // Right face: 1,3,5 + 3,7,5
    indices.push(b+1, b+3, b+5,  b+3, b+7, b+5)
    // Top face: 4,5,6 + 5,7,6
    indices.push(b+4, b+5, b+7,  b+4, b+7, b+6)
    // Bottom face: 0,1,2 + 1,3,2
    indices.push(b+1, b+0, b+2,  b+1, b+2, b+3)
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

export default function WallMesh({ wall, selected, onClick }: Props) {
  const geometry = useMemo(
    () => buildWallGeometry(wall),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      wall.start.x, wall.start.y, wall.end.x, wall.end.y,
      wall.height, wall.thickness,
      JSON.stringify(wall.openings),
    ]
  )

  return (
    <mesh
      geometry={geometry}
      castShadow
      receiveShadow
      onClick={(e) => { e.stopPropagation(); onClick() }}
    >
      <meshStandardMaterial
        color={selected ? '#ff9090' : wall.color}
        roughness={0.7}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
