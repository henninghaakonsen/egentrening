import React, { useMemo } from 'react'
import * as THREE from 'three'
import type { Wall } from '../../types'

interface Props {
  wall: Wall
  selected: boolean
  onClick: () => void
}

/**
 * Builds wall geometry using THREE.Shape with rectangular holes for openings.
 * The shape is a 2D cross-section (length × height) with hole cutouts,
 * extruded to wall thickness.
 */
function buildWallGeometry(wall: Wall): THREE.BufferGeometry {
  const dx = wall.end.x - wall.start.x
  const dy = wall.end.y - wall.start.y
  const len = Math.hypot(dx, dy)
  if (len < 0.05) return new THREE.BufferGeometry()

  // Wall face shape: rectangle [0, len] × [0, height]
  const shape = new THREE.Shape()
  shape.moveTo(0, 0)
  shape.lineTo(len, 0)
  shape.lineTo(len, wall.height)
  shape.lineTo(0, wall.height)
  shape.closePath()

  // Add holes for openings
  for (const op of wall.openings) {
    const x0 = Math.max(0.01, op.offset)
    const x1 = Math.min(len - 0.01, op.offset + op.width)
    if (x1 <= x0) continue
    const y0 = Math.max(0, op.sillHeight)
    const y1 = Math.min(wall.height - 0.01, op.sillHeight + op.height)
    if (y1 <= y0) continue

    const hole = new THREE.Path()
    hole.moveTo(x0, y0)
    hole.lineTo(x1, y0)
    hole.lineTo(x1, y1)
    hole.lineTo(x0, y1)
    hole.closePath()
    shape.holes.push(hole)
  }

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: wall.thickness,
    bevelEnabled: false,
  }

  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings)

  // ExtrudeGeometry creates shape in XY plane; we need to transform it:
  // - Rotate so wall face is in XZ plane (shape X = along wall, shape Y = up)
  // - Translate to actual wall position
  // The extrude goes along +Z by default. We want it to go along wall thickness direction.

  const angle = Math.atan2(dy, dx)

  // Rotate: shape is in XY → rotate -90° around X to get XZ, then rotate around Y for wall direction
  const matrix = new THREE.Matrix4()
  // 1. Rotate shape from XY to XZ: rotate -90 deg around X axis
  const rotX = new THREE.Matrix4().makeRotationX(-Math.PI / 2)
  // 2. Rotate around Y for wall direction
  const rotY = new THREE.Matrix4().makeRotationY(-angle)
  // 3. Translate: center thickness across the wall, then to wall start position
  // After rotX, the extrude (was +Z) is now -Y; we need to offset by thickness/2 in the normal direction
  const normalX = Math.sin(angle)   // wall normal in X
  const normalZ = -Math.cos(angle)  // wall normal in Z
  const translate = new THREE.Matrix4().makeTranslation(
    wall.start.x - normalX * wall.thickness / 2,
    0,
    wall.start.y - normalZ * wall.thickness / 2
  )

  matrix.multiply(translate).multiply(rotY).multiply(rotX)
  geo.applyMatrix4(matrix)
  geo.computeVertexNormals()

  return geo
}

export default function WallMesh({ wall, selected, onClick }: Props) {
  const geometry = useMemo(() => buildWallGeometry(wall), [
    wall.start.x, wall.start.y, wall.end.x, wall.end.y,
    wall.height, wall.thickness,
    // Re-compute when openings change
    JSON.stringify(wall.openings),
  ])

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
